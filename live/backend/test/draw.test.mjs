import { test } from "node:test";
import assert from "node:assert/strict";
import { eligibleQuestions, eligibleExpert, expertCount, tierCounts, drawQuestions, drawExpertFinals } from "../../shared/draw.mjs";

// deterministic rng so shuffles are stable across runs
function lcg(seed = 42) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const q = (id, diff, n = 4, correct = `${id}-correct`) => ({
  q: `Q ${id}?`,
  options: [correct, ...Array.from({ length: n - 1 }, (_, i) => `${id}-wrong-${i}`)],
  correct,
  explain: `because ${id}`,
  diff,
});

function bank({ easy = 6, intermediate = 6, advanced = 6 } = {}) {
  const mk = (diff, n) => Array.from({ length: n }, (_, i) => q(`${diff}${i}`, diff));
  return {
    categories: [
      { id: "a", name: "A", questions: [...mk("easy", easy), ...mk("intermediate", intermediate)] },
      { id: "b", name: "B", questions: mk("advanced", advanced) },
    ],
  };
}

test("multiple-response and five-option questions are not eligible", () => {
  const quiz = bank({ easy: 2, intermediate: 0, advanced: 0 });
  quiz.categories[0].questions.push(
    { ...q("multi", "easy"), correct: ["x", "y"] },
    q("five", "easy", 5),
  );
  const pool = eligibleQuestions(quiz);
  assert.equal(pool.length, 2);
  assert.ok(pool.every((item) => typeof item.correct === "string" && item.options.length <= 4));
});

test("category filter narrows the pool", () => {
  const pool = eligibleQuestions(bank(), ["b"]);
  assert.ok(pool.length > 0);
  assert.ok(pool.every((item) => item.diff === "advanced"));
});

test("tier counts split into even thirds, remainder to the middle", () => {
  assert.deepEqual(tierCounts(15), { easy: 5, intermediate: 5, advanced: 5 });
  assert.deepEqual(tierCounts(10), { easy: 3, intermediate: 4, advanced: 3 });
  assert.deepEqual(tierCounts(20), { easy: 6, intermediate: 8, advanced: 6 });
});

test("a full pool draws in strict easy -> intermediate -> advanced order", () => {
  const drawn = drawQuestions(bank(), { count: 15, rng: lcg() });
  assert.equal(drawn.length, 15);
  assert.deepEqual(
    drawn.map((item) => item.diff),
    [...Array(5).fill("easy"), ...Array(5).fill("intermediate"), ...Array(5).fill("advanced")],
  );
});

test("tier parameters ride along on each drawn question", () => {
  const drawn = drawQuestions(bank(), { count: 3, rng: lcg() });
  for (const item of drawn) {
    assert.ok(item.basePoints > 0);
    assert.ok(item.timeLimitSeconds > 0);
  }
});

test("options are shuffled but correctIndex still points at the right text", () => {
  const drawn = drawQuestions(bank(), { count: 15, rng: lcg(7) });
  let moved = 0;
  for (const item of drawn) {
    assert.match(item.options[item.correctIndex], /-correct$/);
    if (item.correctIndex !== 0) moved++;
  }
  // the bank always lists the correct option first; the shuffle must not
  assert.ok(moved > 0);
});

test("a thin advanced pool backfills from intermediate leftovers", () => {
  const drawn = drawQuestions(bank({ easy: 6, intermediate: 6, advanced: 1 }), { count: 9, rng: lcg() });
  assert.equal(drawn.length, 9);
  assert.deepEqual(drawn.slice(0, 3).map((i) => i.diff), ["easy", "easy", "easy"]);
  assert.deepEqual(drawn.slice(3, 6).map((i) => i.diff), ["intermediate", "intermediate", "intermediate"]);
  const lastTierDiffs = drawn.slice(6).map((i) => i.diff).sort();
  assert.deepEqual(lastTierDiffs, ["advanced", "intermediate", "intermediate"]);
});

test("count larger than the pool returns the whole pool", () => {
  const drawn = drawQuestions(bank({ easy: 1, intermediate: 1, advanced: 1 }), { count: 20, rng: lcg() });
  assert.equal(drawn.length, 3);
  assert.deepEqual(drawn.map((i) => i.diff), ["easy", "intermediate", "advanced"]);
});

const expertPool = (n) => Array.from({ length: n }, (_, i) => {
  const { diff, ...item } = q(`expert${i}`);
  return item;
});

test("expert questions in a bank are not eligible for the ramp", () => {
  const quiz = bank({ easy: 2, intermediate: 0, advanced: 0 });
  quiz.categories[0].questions.push(q("sneaky", "expert"));
  assert.equal(eligibleQuestions(quiz).length, 2);
});

test("one in five of the requested count is an expert final", () => {
  assert.equal(expertCount(10), 2);
  assert.equal(expertCount(15), 3);
  assert.equal(expertCount(20), 4);
});

test("expert finals are included in the requested total, not added on top", () => {
  for (const [count, finals] of [[10, 2], [15, 3], [20, 4]]) {
    const drawn = drawQuestions(bank(), { count, rng: lcg(), expert: expertPool(8) });
    assert.equal(drawn.length, count);
    assert.ok(drawn.slice(0, count - finals).every((i) => i.diff !== "expert"));
    for (const item of drawn.slice(count - finals)) {
      assert.equal(item.diff, "expert");
      assert.ok(item.basePoints > 1200);
      assert.ok(item.timeLimitSeconds > 25);
      assert.match(item.options[item.correctIndex], /-correct$/);
    }
  }
});

test("expert finals are a random selection without repeats", () => {
  const drawn = drawQuestions(bank(), { count: 15, rng: lcg(7), expert: expertPool(8) });
  const finals = drawn.slice(12).map((i) => i.q);
  assert.equal(new Set(finals).size, 3);
  const other = drawQuestions(bank(), { count: 15, rng: lcg(1234567), expert: expertPool(8) }).slice(12).map((i) => i.q);
  assert.notDeepEqual(other, finals);
});

test("a missing or short expert pool hands its slots back to the ramp", () => {
  const noExpert = drawQuestions(bank(), { count: 10, rng: lcg() });
  assert.equal(noExpert.length, 10);
  assert.ok(noExpert.every((i) => i.diff !== "expert"));
  const short = drawQuestions(bank(), { count: 15, rng: lcg(), expert: expertPool(1) });
  assert.equal(short.length, 15);
  assert.equal(short.filter((i) => i.diff === "expert").length, 1);
});

test("ineligible expert items are filtered before the final draw", () => {
  const pool = expertPool(2);
  pool.push({ q: "multi?", options: ["a", "b", "c"], correct: ["a", "b"], explain: "" });
  pool.push({ q: "five?", options: ["a", "b", "c", "d", "e"], correct: "a", explain: "" });
  assert.equal(eligibleExpert(pool).length, 2);
  const finals = drawExpertFinals(pool, lcg(), 3);
  assert.equal(finals.length, 2);
});
