/* Builds a game's question list from a quiz bank (the host does this client
   side and sends the result with the create request, keeping the backend
   bank-agnostic). Only questions that fit the four colour/shape buttons are
   eligible; the draw is ordered easy -> intermediate -> advanced, with a few
   randomly drawn expert finals appended when the bank provides them. */

import { TIERS, TIER_ORDER, EXPERT_FINAL_COUNT } from "./scoring.mjs";

export const MAX_OPTIONS = 4;

function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Single-answer questions with at most four options; multiple-response and
   five-option questions can't be represented by the colour/shape buttons. */
export function eligibleQuestions(quiz, categoryIds = null) {
  const out = [];
  for (const cat of quiz.categories) {
    if (categoryIds && !categoryIds.includes(cat.id)) continue;
    for (const q of cat.questions) {
      if (typeof q.correct !== "string") continue;
      if (q.options.length < 2 || q.options.length > MAX_OPTIONS) continue;
      if (!TIER_ORDER.includes(q.diff)) continue;
      out.push({ q: q.q, options: q.options, correct: q.correct, explain: q.explain, diff: q.diff, cat: cat.id });
    }
  }
  return out;
}

/* Even thirds, remainder to the middle tier (15 -> 5/5/5, 10 -> 3/4/3). */
export function tierCounts(total) {
  const base = Math.floor(total / 3);
  return { easy: base, intermediate: base + (total - base * 3), advanced: base };
}

/* The bank often lists the correct option first, so options are shuffled and
   `correct` becomes an index — otherwise players would learn that one colour
   is usually right. */
function toGameQuestion(item, rng) {
  const options = shuffle(item.options, rng);
  return {
    q: item.q,
    options,
    correctIndex: options.indexOf(item.correct),
    explain: item.explain,
    diff: item.diff,
    basePoints: TIERS[item.diff].basePoints,
    timeLimitSeconds: TIERS[item.diff].timeLimitSeconds,
  };
}

/* Expert questions live outside the quiz banks (game-only, never shown as
   flashcards); a random handful closes out the game after the ramp. */
export function eligibleExpert(expert) {
  return (expert ?? []).filter((q) =>
    typeof q.correct === "string" && q.options.length >= 2 && q.options.length <= MAX_OPTIONS,
  );
}

export function drawExpertFinals(expert, rng, count = EXPERT_FINAL_COUNT) {
  return shuffle(eligibleExpert(expert), rng)
    .slice(0, count)
    .map((item) => toGameQuestion({ ...item, diff: "expert" }, rng));
}

export function drawQuestions(quiz, { count = 15, categoryIds = null, rng = Math.random, expert = null } = {}) {
  const pool = eligibleQuestions(quiz, categoryIds);
  const byTier = Object.fromEntries(TIER_ORDER.map((t) => [t, shuffle(pool.filter((q) => q.diff === t), rng)]));
  const total = Math.min(count, pool.length);
  const want = tierCounts(total);

  const picks = Object.fromEntries(TIER_ORDER.map((t) => [t, byTier[t].splice(0, want[t])]));

  // Backfill a short tier from the leftovers of the nearest tiers, easier first,
  // so a thin advanced pool still yields a full (if slightly easier) final stretch.
  const NEAREST = {
    easy: ["intermediate", "advanced"],
    intermediate: ["easy", "advanced"],
    advanced: ["intermediate", "easy"],
  };
  for (const tier of [...TIER_ORDER].reverse()) {
    for (const from of NEAREST[tier]) {
      while (picks[tier].length < want[tier] && byTier[from].length) {
        picks[tier].push(byTier[from].shift());
      }
    }
  }

  const ramp = TIER_ORDER.flatMap((t) => picks[t]).map((item) => toGameQuestion(item, rng));
  return [...ramp, ...drawExpertFinals(expert, rng)];
}
