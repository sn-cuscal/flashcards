/* Game orchestration, dependency-injected so the Lambda handler (DynamoDB +
   API Gateway sends) and the local dev server (memory + ws sends) run the
   exact same code. ctx = { store, send(connectionId, obj), now() }. */

import { randomUUID } from "node:crypto";
import { GAME_TTL_SECONDS, MAX_PLAYERS } from "../../shared/scoring.mjs";
import {
  AppError, newPin, validateQuestions, validateNickname, answerKey,
  answerDeadlineEpochMs, questionPayload, gradeAnswer, revealFor, podiumFor,
} from "./engine.mjs";

const PIN_CREATE_ATTEMPTS = 5;

async function connections(ctx, game, players) {
  const ids = players.map((p) => p.connectionId).filter(Boolean);
  if (game.hostConnectionId) ids.push(game.hostConnectionId);
  return ids;
}

async function broadcast(ctx, game, players, payload) {
  const ids = await connections(ctx, game, players);
  await Promise.all(ids.map((id) => ctx.send(id, payload)));
}

function roster(players) {
  return players.map((p) => ({ nickname: p.nickname, connected: !!p.connectionId, score: p.score }));
}

async function broadcastLobby(ctx, game, players) {
  await broadcast(ctx, game, players, { type: "lobby", pin: game.pin, players: roster(players) });
}

async function requireGame(ctx, pin) {
  const game = await ctx.store.getGame(String(pin ?? ""));
  if (!game) throw new AppError("GAME_NOT_FOUND", "no game with that PIN");
  return game;
}

function requireHost(game, hostToken) {
  if (!hostToken || hostToken !== game.hostToken) throw new AppError("NOT_HOST", "invalid host token");
}

/* ---- actions ---------------------------------------------------------- */

async function create(ctx, connectionId, msg) {
  const questions = validateQuestions(msg.questions);
  const nowMs = ctx.now();
  const hostToken = randomUUID();
  const meta = {
    hostToken,
    state: "lobby",
    settings: msg.settings || {},
    questions,
    currentQuestion: -1,
    questionStartedAtEpochMs: null,
    hostConnectionId: connectionId,
    createdAtEpochMs: nowMs,
    expiresAtEpochSeconds: Math.floor(nowMs / 1000) + GAME_TTL_SECONDS,
  };

  let pin = null;
  for (let i = 0; i < PIN_CREATE_ATTEMPTS && !pin; i++) {
    const candidate = newPin();
    if (await ctx.store.createGame({ ...meta, pin: candidate })) pin = candidate;
  }
  if (!pin) throw new AppError("PIN_EXHAUSTED", "could not allocate a game PIN, try again");

  await ctx.store.putConn(connectionId, { pin, role: "host" });
  await ctx.send(connectionId, { type: "created", pin, hostToken, total: questions.length });
}

async function join(ctx, connectionId, msg) {
  const game = await requireGame(ctx, msg.pin);

  // Rejoin: a dropped player comes back with the playerId minted at first join
  // and keeps their score; just rebind the connection and resync.
  if (msg.playerId) {
    const existing = await ctx.store.getPlayer(game.pin, msg.playerId);
    if (existing) {
      await ctx.store.setPlayerConnection(game.pin, existing.playerId, connectionId);
      await ctx.store.putConn(connectionId, { pin: game.pin, role: existing.playerId });
      existing.connectionId = connectionId;
      await ctx.send(connectionId, {
        type: "joined", pin: game.pin, playerId: existing.playerId, nickname: existing.nickname,
        total: game.questions.length,
      });
      await sendSnapshot(ctx, game, existing);
      if (game.state === "lobby") await broadcastLobby(ctx, game, await ctx.store.listPlayers(game.pin));
      return;
    }
  }

  if (game.state !== "lobby") throw new AppError("GAME_STARTED", "that game has already started");
  const nickname = validateNickname(msg.nickname);
  const players = await ctx.store.listPlayers(game.pin);
  if (players.length >= MAX_PLAYERS) throw new AppError("GAME_FULL", "that game is full");
  if (players.some((p) => p.nickname.toLowerCase() === nickname.toLowerCase())) {
    throw new AppError("NICKNAME_TAKEN", "that nickname is taken");
  }

  const player = {
    pin: game.pin,
    playerId: randomUUID(),
    nickname,
    connectionId,
    score: 0,
    streak: 0,
    answers: {},
    expiresAtEpochSeconds: game.expiresAtEpochSeconds,
  };
  await ctx.store.putPlayer(player);
  await ctx.store.putConn(connectionId, { pin: game.pin, role: player.playerId });
  await ctx.send(connectionId, {
    type: "joined", pin: game.pin, playerId: player.playerId, nickname, total: game.questions.length,
  });
  await broadcastLobby(ctx, game, [...players, player]);
}

async function startQuestion(ctx, game, players, index, fromState) {
  const nowMs = ctx.now();
  const moved = await ctx.store.transitionState(game.pin, fromState, "question", {
    currentQuestion: index,
    questionStartedAtEpochMs: nowMs,
  });
  if (!moved) return;
  game.state = "question";
  game.currentQuestion = index;
  game.questionStartedAtEpochMs = nowMs;
  await broadcast(ctx, game, players, questionPayload(game, nowMs));
}

async function start(ctx, connectionId, msg) {
  const game = await requireGame(ctx, msg.pin);
  requireHost(game, msg.hostToken);
  if (game.state !== "lobby") throw new AppError("BAD_STATE", "game already started");
  const players = await ctx.store.listPlayers(game.pin);
  if (!players.length) throw new AppError("NO_PLAYERS", "no players have joined yet");
  await startQuestion(ctx, game, players, 0, "lobby");
}

async function answer(ctx, connectionId, msg) {
  const game = await requireGame(ctx, msg.pin);
  if (game.state !== "question" || game.currentQuestion !== msg.questionIndex) {
    throw new AppError("BAD_STATE", "that question is not open");
  }
  const nowMs = ctx.now();
  if (nowMs > answerDeadlineEpochMs(game)) throw new AppError("TOO_LATE", "time is up");

  const q = game.questions[game.currentQuestion];
  if (!Number.isInteger(msg.choiceIndex) || msg.choiceIndex < 0 || msg.choiceIndex >= q.options.length) {
    throw new AppError("BAD_CHOICE", "invalid answer option");
  }
  const player = await ctx.store.getPlayer(game.pin, msg.playerId);
  if (!player) throw new AppError("NOT_JOINED", "join the game first");

  const graded = gradeAnswer(game, player, msg.choiceIndex, nowMs);
  const entry = {
    choiceIndex: msg.choiceIndex,
    correct: graded.correct,
    points: graded.points,
    bonus: graded.bonus,
    timeUsedMs: graded.timeUsedMs,
  };
  const recorded = await ctx.store.recordAnswer(
    game.pin, player.playerId, game.currentQuestion, entry, graded.points, graded.streakAfter,
  );
  if (!recorded) throw new AppError("ALREADY_ANSWERED", "you already answered this question");

  await ctx.send(connectionId, { type: "answerAck", index: game.currentQuestion });

  const players = await ctx.store.listPlayers(game.pin);
  const answered = players.filter((p) => p.answers[answerKey(game.currentQuestion)]).length;
  if (game.hostConnectionId) {
    await ctx.send(game.hostConnectionId, { type: "answerCount", answered, total: players.length });
  }
  if (answered === players.length) await doReveal(ctx, game, players);
}

/* The transition is conditional, so the host's timeout reveal and the
   everyone-answered auto-reveal can race harmlessly — one wins, one no-ops. */
async function doReveal(ctx, game, players) {
  const moved = await ctx.store.transitionState(game.pin, "question", "reveal");
  if (!moved) return;
  game.state = "reveal";

  // No answer = streak broken; record it so the result screens and rejoin
  // snapshots see a uniform answers map.
  for (const p of players) {
    const key = answerKey(game.currentQuestion);
    if (!p.answers[key]) {
      const entry = { choiceIndex: null, correct: false, points: 0, bonus: 0, timeUsedMs: null };
      if (await ctx.store.recordAnswer(game.pin, p.playerId, game.currentQuestion, entry, 0, 0)) {
        p.answers[key] = entry;
        p.streak = 0;
      }
    }
  }

  const r = revealFor(game, players);
  const shared = {
    type: "reveal",
    index: r.index,
    total: r.total,
    correctIndex: r.correctIndex,
    explain: r.explain,
    distribution: r.distribution,
    noAnswer: r.noAnswer,
    leaderboard: r.leaderboard,
  };
  await Promise.all(players.map((p) =>
    p.connectionId ? ctx.send(p.connectionId, { ...shared, you: r.results[p.playerId] }) : null,
  ));
  if (game.hostConnectionId) await ctx.send(game.hostConnectionId, { ...shared, you: null });
}

async function reveal(ctx, connectionId, msg) {
  const game = await requireGame(ctx, msg.pin);
  requireHost(game, msg.hostToken);
  if (game.state !== "question") return;
  await doReveal(ctx, game, await ctx.store.listPlayers(game.pin));
}

async function sendPodium(ctx, game, players) {
  const { top3, standings } = podiumFor(players);
  await Promise.all(players.map((p) => {
    if (!p.connectionId) return null;
    const mine = standings.find((s) => s.playerId === p.playerId);
    return ctx.send(p.connectionId, { type: "podium", top3, you: { rank: mine.rank, score: mine.score } });
  }));
  if (game.hostConnectionId) {
    await ctx.send(game.hostConnectionId, {
      type: "podium", top3, standings: standings.map(({ playerId, ...pub }) => pub), you: null,
    });
  }
}

async function next(ctx, connectionId, msg) {
  const game = await requireGame(ctx, msg.pin);
  requireHost(game, msg.hostToken);
  if (game.state !== "reveal") throw new AppError("BAD_STATE", "reveal the current question first");
  const players = await ctx.store.listPlayers(game.pin);
  const nextIndex = game.currentQuestion + 1;
  if (nextIndex < game.questions.length) {
    await startQuestion(ctx, game, players, nextIndex, "reveal");
  } else if (await ctx.store.transitionState(game.pin, "reveal", "podium")) {
    await sendPodium(ctx, game, players);
  }
}

async function end(ctx, connectionId, msg) {
  const game = await requireGame(ctx, msg.pin);
  requireHost(game, msg.hostToken);
  await ctx.store.updateGame(game.pin, { state: "ended" });
  await broadcast(ctx, game, await ctx.store.listPlayers(game.pin), { type: "ended" });
}

/* Host browser refreshed: rebind the host connection and resync the screen. */
async function rejoinHost(ctx, connectionId, msg) {
  const game = await requireGame(ctx, msg.pin);
  requireHost(game, msg.hostToken);
  await ctx.store.updateGame(game.pin, { hostConnectionId: connectionId });
  game.hostConnectionId = connectionId;
  await ctx.store.putConn(connectionId, { pin: game.pin, role: "host" });
  await ctx.send(connectionId, { type: "created", pin: game.pin, hostToken: game.hostToken, total: game.questions.length });
  await sendSnapshot(ctx, game, null);
}

/* Resync one client (player, or host when player === null) to the current
   game state after a join/rejoin. */
async function sendSnapshot(ctx, game, player) {
  const connectionId = player ? player.connectionId : game.hostConnectionId;
  const players = await ctx.store.listPlayers(game.pin);
  // The host screens derive "N of M answered" and the Start gate from the
  // roster, so a rejoining host needs it back in every state, not just lobby.
  if (!player && game.state !== "lobby") {
    await ctx.send(connectionId, { type: "lobby", pin: game.pin, players: roster(players) });
  }
  if (game.state === "lobby") {
    await ctx.send(connectionId, { type: "lobby", pin: game.pin, players: roster(players) });
  } else if (game.state === "question") {
    const payload = questionPayload(game, ctx.now());
    const answered = player ? !!player.answers[answerKey(game.currentQuestion)] : false;
    await ctx.send(connectionId, { ...payload, answered });
    if (!player) {
      const count = players.filter((p) => p.answers[answerKey(game.currentQuestion)]).length;
      await ctx.send(connectionId, { type: "answerCount", answered: count });
    }
  } else if (game.state === "reveal") {
    const r = revealFor(game, players);
    await ctx.send(connectionId, {
      type: "reveal", index: r.index, total: r.total, correctIndex: r.correctIndex, explain: r.explain,
      distribution: r.distribution, noAnswer: r.noAnswer, leaderboard: r.leaderboard,
      you: player ? r.results[player.playerId] : null,
    });
  } else if (game.state === "podium") {
    const { top3, standings } = podiumFor(players);
    const mine = player ? standings.find((s) => s.playerId === player.playerId) : null;
    await ctx.send(connectionId, {
      type: "podium", top3,
      you: mine ? { rank: mine.rank, score: mine.score } : null,
      standings: player ? undefined : standings.map(({ playerId, ...pub }) => pub),
    });
  } else {
    await ctx.send(connectionId, { type: "ended" });
  }
}

/* ---- entry points ------------------------------------------------------ */

const ACTIONS = { create, join, start, answer, reveal, next, end, rejoinHost };

export async function dispatch(ctx, connectionId, msg) {
  const fn = ACTIONS[msg?.action];
  if (!fn) throw new AppError("UNKNOWN_ACTION", `unknown action ${msg?.action}`);
  await fn(ctx, connectionId, msg);
}

/* Shared outermost entry: parse, dispatch, and report failures back over the
   socket as { type: "error" } instead of dropping them. */
export async function handleMessage(ctx, connectionId, raw) {
  let msg = null;
  try {
    msg = JSON.parse(raw);
  } catch {
    await ctx.send(connectionId, { type: "error", code: "BAD_JSON", message: "message must be JSON" });
    return;
  }
  try {
    await dispatch(ctx, connectionId, msg);
  } catch (err) {
    const code = err instanceof AppError ? err.code : "INTERNAL";
    const message = err instanceof AppError ? err.message : "something went wrong";
    if (code === "INTERNAL") console.error("internal error", err);
    await ctx.send(connectionId, { type: "error", code, message, action: msg?.action });
  }
}

export async function onDisconnect(ctx, connectionId) {
  const conn = await ctx.store.getConn(connectionId);
  if (!conn) return;
  await ctx.store.deleteConn(connectionId);
  const game = await ctx.store.getGame(conn.pin);
  if (!game) return;
  if (conn.role === "host") {
    if (game.hostConnectionId === connectionId) {
      await ctx.store.updateGame(game.pin, { hostConnectionId: null });
    }
    return;
  }
  const player = await ctx.store.getPlayer(conn.pin, conn.role);
  if (player && player.connectionId === connectionId) {
    await ctx.store.setPlayerConnection(conn.pin, player.playerId, null);
    if (game.state === "lobby") {
      game.hostConnectionId = game.hostConnectionId === connectionId ? null : game.hostConnectionId;
      await broadcastLobby(ctx, game, await ctx.store.listPlayers(game.pin));
    }
  }
}
