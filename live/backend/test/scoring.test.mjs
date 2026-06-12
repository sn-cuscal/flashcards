import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreAnswer, STREAK_BONUS_CAP_POINTS, TIERS } from "../../shared/scoring.mjs";

const base = { correct: true, timeLimitMs: 20000, basePoints: 1000, streakBefore: 0 };

test("instant correct answer earns full base points", () => {
  assert.equal(scoreAnswer({ ...base, timeUsedMs: 0 }).points, 1000);
});

test("answering at the buzzer earns half", () => {
  assert.equal(scoreAnswer({ ...base, timeUsedMs: 20000 }).points, 500);
});

test("time weighting is linear between full and half", () => {
  assert.equal(scoreAnswer({ ...base, timeUsedMs: 10000 }).points, 750);
  assert.equal(scoreAnswer({ ...base, timeUsedMs: 5000 }).points, 875);
});

test("wrong answer scores zero and resets the streak", () => {
  const r = scoreAnswer({ ...base, correct: false, timeUsedMs: 0, streakBefore: 4 });
  assert.deepEqual(r, { points: 0, bonus: 0, streakAfter: 0 });
});

test("streak bonus ramps by 100 from the second consecutive correct", () => {
  assert.equal(scoreAnswer({ ...base, timeUsedMs: 0, streakBefore: 0 }).bonus, 0);
  assert.equal(scoreAnswer({ ...base, timeUsedMs: 0, streakBefore: 1 }).bonus, 100);
  assert.equal(scoreAnswer({ ...base, timeUsedMs: 0, streakBefore: 3 }).bonus, 300);
});

test("streak bonus is capped", () => {
  const r = scoreAnswer({ ...base, timeUsedMs: 0, streakBefore: 25 });
  assert.equal(r.bonus, STREAK_BONUS_CAP_POINTS);
  assert.equal(r.points, 1000 + STREAK_BONUS_CAP_POINTS);
});

test("time used is clamped to the limit in both directions", () => {
  assert.equal(scoreAnswer({ ...base, timeUsedMs: -50 }).points, 1000);
  assert.equal(scoreAnswer({ ...base, timeUsedMs: 999999 }).points, 500);
});

test("tiers ramp points and thinking time upward", () => {
  assert.ok(TIERS.easy.basePoints < TIERS.intermediate.basePoints);
  assert.ok(TIERS.intermediate.basePoints < TIERS.advanced.basePoints);
  assert.ok(TIERS.advanced.basePoints < TIERS.expert.basePoints);
  assert.ok(TIERS.easy.timeLimitSeconds < TIERS.advanced.timeLimitSeconds);
  assert.ok(TIERS.advanced.timeLimitSeconds < TIERS.expert.timeLimitSeconds);
});
