/* Full game driven through handleMessage with the memory store — the same
   code path the Lambda and the dev server use, minus the transports. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { makeMemoryStore } from "../dev/store-memory.mjs";
import { handleMessage } from "../src/actions.mjs";

const QUESTIONS = [
  { q: "Easy one?", options: ["right", "wrong-a", "wrong-b", "wrong-c"], correctIndex: 0, diff: "easy", explain: "e" },
  { q: "Middling?", options: ["wrong-a", "right", "wrong-b"], correctIndex: 1, diff: "intermediate", explain: "m" },
  { q: "Hard one?", options: ["wrong-a", "wrong-b", "right"], correctIndex: 2, diff: "advanced", explain: "h" },
];

function makeWorld() {
  const sent = [];
  let nowMs = 1_000_000;
  const ctx = {
    store: makeMemoryStore(),
    send: async (to, payload) => { sent.push({ to, ...payload }); return true; },
    now: () => nowMs,
  };
  return {
    ctx,
    sent,
    tick: (ms) => { nowMs += ms; },
    say: (conn, msg) => handleMessage(ctx, conn, JSON.stringify(msg)),
    last: (to, type) => [...sent].reverse().find((m) => m.to === to && m.type === type),
  };
}

async function setupGame(w) {
  await w.say("H", { action: "create", questions: QUESTIONS, settings: { bank: "test" } });
  const created = w.last("H", "created");
  await w.say("P1", { action: "join", pin: created.pin, nickname: "Ada" });
  await w.say("P2", { action: "join", pin: created.pin, nickname: "Grace" });
  return { pin: created.pin, hostToken: created.hostToken };
}

test("full game: lobby, ramped questions, scoring, streaks, podium", async () => {
  const w = makeWorld();
  const { pin, hostToken } = await setupGame(w);

  assert.equal(w.last("P1", "joined").playerId.length > 0, true);
  const p1Id = w.last("P1", "joined").playerId;
  const p2Id = w.last("P2", "joined").playerId;
  assert.deepEqual(w.last("H", "lobby").players.map((p) => p.nickname).sort(), ["Ada", "Grace"]);

  // wrong host token cannot start the game
  await w.say("H", { action: "start", pin, hostToken: "nope" });
  assert.equal(w.last("H", "error").code, "NOT_HOST");

  await w.say("H", { action: "start", pin, hostToken });
  const q1 = w.last("P1", "question");
  assert.equal(q1.index, 0);
  assert.equal(q1.diff, "easy");
  assert.equal(q1.timeLimitSeconds, 15);
  assert.equal(q1.correctIndex, undefined, "live question payload must not leak the answer");
  assert.equal(q1.explain, undefined);

  // Q1: Ada instant + correct (full 800), Grace wrong (0); all answered -> auto reveal
  await w.say("P1", { action: "answer", pin, playerId: p1Id, questionIndex: 0, choiceIndex: 0 });
  assert.equal(w.last("H", "answerCount").answered, 1);
  await w.say("P2", { action: "answer", pin, playerId: p2Id, questionIndex: 0, choiceIndex: 1 });

  let reveal = w.last("P1", "reveal");
  assert.equal(reveal.correctIndex, 0);
  assert.equal(reveal.you.points, 800);
  assert.equal(reveal.you.streak, 1);
  assert.equal(w.last("P2", "reveal").you.points, 0);
  assert.deepEqual(w.last("H", "reveal").distribution, [1, 1, 0, 0]);
  assert.equal(w.last("H", "reveal").leaderboard[0].nickname, "Ada");

  // a second answer for the same question is rejected
  await w.say("P1", { action: "answer", pin, playerId: p1Id, questionIndex: 0, choiceIndex: 0 });
  assert.equal(w.last("P1", "error").code, "BAD_STATE");

  // Q2: Ada correct at half time (750 + 100 streak), Grace instant correct (1000)
  await w.say("H", { action: "next", pin, hostToken });
  assert.equal(w.last("P2", "question").diff, "intermediate");
  w.tick(10_000);
  await w.say("P1", { action: "answer", pin, playerId: p1Id, questionIndex: 1, choiceIndex: 1 });
  w.tick(-10_000);
  await w.say("P2", { action: "answer", pin, playerId: p2Id, questionIndex: 1, choiceIndex: 1 });
  assert.equal(w.last("P1", "reveal").you.points, 850);
  assert.equal(w.last("P1", "reveal").you.bonus, 100);
  assert.equal(w.last("P2", "reveal").you.points, 1000);

  // Q3: Grace instant correct (1200 + 100 streak); Ada misses the deadline,
  // host reveals on timeout, Ada's streak resets
  await w.say("H", { action: "next", pin, hostToken });
  assert.equal(w.last("P1", "question").diff, "advanced");
  w.tick(25_000 + 501);
  await w.say("P1", { action: "answer", pin, playerId: p1Id, questionIndex: 2, choiceIndex: 2 });
  assert.equal(w.last("P1", "error").code, "TOO_LATE");
  w.tick(-25_000 - 501);
  await w.say("P2", { action: "answer", pin, playerId: p2Id, questionIndex: 2, choiceIndex: 2 });
  await w.say("H", { action: "reveal", pin, hostToken });

  reveal = w.last("P1", "reveal");
  assert.equal(reveal.index, 2);
  assert.equal(reveal.you.answered, false);
  assert.equal(reveal.you.streak, 0);
  assert.equal(reveal.noAnswer, 1);
  assert.equal(w.last("P2", "reveal").you.points, 1300);

  // podium: Grace 2300 beats Ada 1650
  await w.say("H", { action: "next", pin, hostToken });
  const podium = w.last("H", "podium");
  assert.deepEqual(podium.top3.map((p) => [p.nickname, p.score, p.rank]), [["Grace", 2300, 1], ["Ada", 1650, 2]]);
  assert.deepEqual(w.last("P1", "podium").you, { rank: 2, score: 1650 });
  assert.deepEqual(w.last("P2", "podium").you, { rank: 1, score: 2300 });
});

test("lobby rules: bad pin, duplicate nickname, no late joins", async () => {
  const w = makeWorld();
  const { pin, hostToken } = await setupGame(w);

  await w.say("P3", { action: "join", pin: "000000", nickname: "Eve" });
  assert.equal(w.last("P3", "error").code, "GAME_NOT_FOUND");

  await w.say("P3", { action: "join", pin, nickname: "ada" });
  assert.equal(w.last("P3", "error").code, "NICKNAME_TAKEN");

  await w.say("H", { action: "start", pin, hostToken });
  await w.say("P3", { action: "join", pin, nickname: "Eve" });
  assert.equal(w.last("P3", "error").code, "GAME_STARTED");
});

test("a dropped player rejoins mid-question with score intact", async () => {
  const w = makeWorld();
  const { pin, hostToken } = await setupGame(w);
  const p1Id = w.last("P1", "joined").playerId;
  const p2Id = w.last("P2", "joined").playerId;

  await w.say("H", { action: "start", pin, hostToken });
  await w.say("P1", { action: "answer", pin, playerId: p1Id, questionIndex: 0, choiceIndex: 0 });
  await w.say("P2", { action: "answer", pin, playerId: p2Id, questionIndex: 0, choiceIndex: 0 });
  await w.say("H", { action: "next", pin, hostToken });

  w.tick(5_000);
  await w.say("P1b", { action: "join", pin, playerId: p1Id, nickname: "Ada" });
  assert.equal(w.last("P1b", "joined").playerId, p1Id);
  const snap = w.last("P1b", "question");
  assert.equal(snap.index, 1);
  assert.equal(snap.elapsedMs, 5_000);
  assert.equal(snap.answered, false);

  // and the rebound connection can answer normally
  await w.say("P1b", { action: "answer", pin, playerId: p1Id, questionIndex: 1, choiceIndex: 1 });
  assert.equal(w.last("P1b", "answerAck").index, 1);
});

test("a refreshed host rejoins mid-question with roster and answer count", async () => {
  const w = makeWorld();
  const { pin, hostToken } = await setupGame(w);
  const p1Id = w.last("P1", "joined").playerId;

  await w.say("H", { action: "start", pin, hostToken });
  await w.say("P1", { action: "answer", pin, playerId: p1Id, questionIndex: 0, choiceIndex: 0 });

  w.tick(4_000);
  await w.say("H2", { action: "rejoinHost", pin, hostToken });
  assert.deepEqual(w.last("H2", "lobby").players.map((p) => p.nickname).sort(), ["Ada", "Grace"]);
  const snap = w.last("H2", "question");
  assert.equal(snap.index, 0);
  assert.equal(snap.elapsedMs, 4_000);
  assert.equal(w.last("H2", "answerCount").answered, 1);
});

test("create rejects malformed question sets", async () => {
  const w = makeWorld();
  await w.say("H", { action: "create", questions: [] });
  assert.equal(w.last("H", "error").code, "BAD_QUESTIONS");
  await w.say("H", { action: "create", questions: [{ q: "x?", options: ["a"], correctIndex: 0, diff: "easy" }] });
  assert.equal(w.last("H", "error").code, "BAD_QUESTIONS");
  await w.say("H", { action: "create", questions: [{ q: "x?", options: ["a", "b"], correctIndex: 2, diff: "easy" }] });
  assert.equal(w.last("H", "error").code, "BAD_QUESTIONS");
  await w.say("H", { action: "create", questions: [{ q: "x?", options: ["a", "b"], correctIndex: 0, diff: "nope" }] });
  assert.equal(w.last("H", "error").code, "BAD_QUESTIONS");
});

test("tampered tier parameters are re-derived server side", async () => {
  const w = makeWorld();
  await w.say("H", {
    action: "create",
    questions: [{ q: "x?", options: ["a", "b"], correctIndex: 0, diff: "easy", basePoints: 99999, timeLimitSeconds: 1 }],
  });
  const { pin, hostToken } = w.last("H", "created");
  await w.say("P1", { action: "join", pin, nickname: "Ada" });
  const p1Id = w.last("P1", "joined").playerId;
  await w.say("H", { action: "start", pin, hostToken });
  assert.equal(w.last("P1", "question").timeLimitSeconds, 15);
  await w.say("P1", { action: "answer", pin, playerId: p1Id, questionIndex: 0, choiceIndex: 0 });
  assert.equal(w.last("P1", "reveal").you.points, 800);
});
