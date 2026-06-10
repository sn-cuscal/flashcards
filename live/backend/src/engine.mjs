/* Pure game computations — no AWS, no I/O — so the whole rule set is unit
   testable and shared between the Lambda handler and the local dev server. */

import {
  TIERS, ANSWER_GRACE_MS, MAX_QUESTIONS, NICKNAME_MAX_CHARS, scoreAnswer,
} from "../../shared/scoring.mjs";

export class AppError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function newPin(rng = Math.random) {
  return String(Math.floor(rng() * 900000) + 100000);
}

/* The host client supplies the drawn questions; normalise and re-derive the
   tier parameters server-side so scoring can't be inflated by a tampered
   payload. */
export function validateQuestions(input) {
  if (!Array.isArray(input) || input.length < 1 || input.length > MAX_QUESTIONS) {
    throw new AppError("BAD_QUESTIONS", `questions must be an array of 1-${MAX_QUESTIONS}`);
  }
  return input.map((item, i) => {
    const tier = TIERS[item?.diff];
    const ok =
      tier &&
      typeof item.q === "string" && item.q.trim() && item.q.length <= 500 &&
      Array.isArray(item.options) && item.options.length >= 2 && item.options.length <= 4 &&
      item.options.every((o) => typeof o === "string" && o.trim() && o.length <= 300) &&
      Number.isInteger(item.correctIndex) && item.correctIndex >= 0 && item.correctIndex < item.options.length &&
      (item.explain === undefined || (typeof item.explain === "string" && item.explain.length <= 600));
    if (!ok) throw new AppError("BAD_QUESTIONS", `question ${i} is malformed`);
    return {
      q: item.q.trim(),
      options: item.options.map((o) => o.trim()),
      correctIndex: item.correctIndex,
      explain: item.explain || "",
      diff: item.diff,
      basePoints: tier.basePoints,
      timeLimitSeconds: tier.timeLimitSeconds,
    };
  });
}

export function validateNickname(nickname) {
  const name = String(nickname ?? "").trim().replace(/\s+/g, " ");
  if (!name || name.length > NICKNAME_MAX_CHARS) {
    throw new AppError("BAD_NICKNAME", `nickname must be 1-${NICKNAME_MAX_CHARS} characters`);
  }
  return name;
}

export const answerKey = (index) => String(index);

export function answerDeadlineEpochMs(game) {
  const q = game.questions[game.currentQuestion];
  return game.questionStartedAtEpochMs + q.timeLimitSeconds * 1000 + ANSWER_GRACE_MS;
}

/* What every screen sees while a question is live — never includes
   correctIndex/explain, so a devtools-savvy player learns nothing early.
   elapsedMs lets a rejoining client resume the countdown mid-question. */
export function questionPayload(game, nowMs) {
  const q = game.questions[game.currentQuestion];
  return {
    type: "question",
    index: game.currentQuestion,
    total: game.questions.length,
    q: q.q,
    options: q.options,
    diff: q.diff,
    basePoints: q.basePoints,
    timeLimitSeconds: q.timeLimitSeconds,
    elapsedMs: Math.max(0, nowMs - game.questionStartedAtEpochMs),
  };
}

export function gradeAnswer(game, player, choiceIndex, nowMs) {
  const q = game.questions[game.currentQuestion];
  const timeUsedMs = nowMs - game.questionStartedAtEpochMs;
  const correct = choiceIndex === q.correctIndex;
  const { points, bonus, streakAfter } = scoreAnswer({
    correct,
    timeUsedMs,
    timeLimitMs: q.timeLimitSeconds * 1000,
    basePoints: q.basePoints,
    streakBefore: player.streak,
  });
  return { correct, points, bonus, streakAfter, timeUsedMs };
}

function ranked(players) {
  const sorted = [...players].sort((a, b) => b.score - a.score || a.nickname.localeCompare(b.nickname));
  let prevScore = null;
  let prevRank = 0;
  return sorted.map((p, i) => {
    const rank = p.score === prevScore ? prevRank : i + 1;
    prevScore = p.score;
    prevRank = rank;
    return { ...p, rank };
  });
}

export function leaderboard(players, top = 5) {
  return ranked(players).slice(0, top).map((p) => ({ nickname: p.nickname, score: p.score, rank: p.rank }));
}

/* Everything the reveal screens need: option distribution, the top five, and
   a personalised result per player. */
export function revealFor(game, players) {
  const idx = game.currentQuestion;
  const q = game.questions[idx];
  const distribution = q.options.map(() => 0);
  let noAnswer = 0;
  for (const p of players) {
    const a = p.answers[answerKey(idx)];
    if (a && a.choiceIndex != null) distribution[a.choiceIndex]++;
    else noAnswer++;
  }
  const standings = ranked(players);
  const results = {};
  for (const p of standings) {
    const a = p.answers[answerKey(idx)] || null;
    results[p.playerId] = {
      answered: !!a && a.choiceIndex != null,
      choiceIndex: a ? a.choiceIndex : null,
      correct: !!a && !!a.correct,
      points: a ? a.points : 0,
      bonus: a ? a.bonus || 0 : 0,
      score: p.score,
      streak: p.streak,
      rank: p.rank,
    };
  }
  return {
    index: idx,
    total: game.questions.length,
    correctIndex: q.correctIndex,
    explain: q.explain,
    distribution,
    noAnswer,
    leaderboard: standings.slice(0, 5).map((p) => ({ nickname: p.nickname, score: p.score, rank: p.rank })),
    results,
  };
}

export function podiumFor(players) {
  const standings = ranked(players).map((p) => ({ playerId: p.playerId, nickname: p.nickname, score: p.score, rank: p.rank }));
  return { top3: standings.slice(0, 3).map(({ playerId, ...pub }) => pub), standings };
}
