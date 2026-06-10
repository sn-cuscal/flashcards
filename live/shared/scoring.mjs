/* Scoring + pacing constants shared by the Lambda backend and the play-app
   frontend (via the @shared vite alias) so the two can never drift. */

// Later questions are worth more and allow more thinking time, reinforcing
// the easy -> advanced ramp within a game.
export const TIERS = {
  easy:         { basePoints: 800,  timeLimitSeconds: 15 },
  intermediate: { basePoints: 1000, timeLimitSeconds: 20 },
  advanced:     { basePoints: 1200, timeLimitSeconds: 25 },
};
export const TIER_ORDER = ["easy", "intermediate", "advanced"];

export const STREAK_BONUS_POINTS = 100;     // per consecutive correct answer, from the 2nd
export const STREAK_BONUS_CAP_POINTS = 500; // per-question bonus ceiling

// Answers are timed on the server clock; allow a little network latency past
// the nominal deadline before rejecting.
export const ANSWER_GRACE_MS = 500;

export const GAME_TTL_SECONDS = 6 * 60 * 60; // DynamoDB TTL cleans up finished/abandoned games
export const MAX_PLAYERS = 50;
export const MAX_QUESTIONS = 50;
export const NICKNAME_MAX_CHARS = 16;

/* Kahoot-style time-weighted points: instant ~= basePoints, at the buzzer
   ~= half. Wrong (or no) answer scores 0 and resets the streak. */
export function scoreAnswer({ correct, timeUsedMs, timeLimitMs, basePoints, streakBefore }) {
  if (!correct) return { points: 0, bonus: 0, streakAfter: 0 };
  const used = Math.min(Math.max(timeUsedMs, 0), timeLimitMs);
  const base = Math.round((1 - (used / timeLimitMs) / 2) * basePoints);
  const streakAfter = streakBefore + 1;
  const bonus = Math.min((streakAfter - 1) * STREAK_BONUS_POINTS, STREAK_BONUS_CAP_POINTS);
  return { points: base + bonus, bonus, streakAfter };
}
