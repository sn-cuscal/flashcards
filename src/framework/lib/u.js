/* u.js — aggregates the colour + spaced-repetition helpers into a single `U`
   namespace, matching how the components reference them (U.catTint, U.shuffle, …). */

import { catTint, catInk, catSolid, catDeep } from './theme.js'
import { blankRec, gradeRec, reviewQueue, shuffle, masteryOf, todayStr, daysBetween } from './spacedRepetition.js'

// Difficulty is an exam-agnostic axis: every card/quiz item carries a `diff`
// of one of these ids, and the UI lets the learner filter to one tier. Each
// tier reuses the same hue-based colour helpers as the categories.
export const DIFFS = [
  { id: 'easy',         name: 'Easy',         short: 'Easy',  hue: 158 },
  { id: 'intermediate', name: 'Intermediate', short: 'Inter', hue: 62  },
  { id: 'advanced',     name: 'Advanced',     short: 'Adv',   hue: 28  },
];
function diffMeta(id) { return DIFFS.find((d) => d.id === id) || null; }
// keep only items at the chosen tier; 'all' (or falsy) passes everything through
function filterDiff(items, diff) { return diff && diff !== 'all' ? items.filter((x) => x.diff === diff) : items; }

export const U = {
  catTint, catInk, catSolid, catDeep,
  blankRec, gradeRec, reviewQueue, shuffle, masteryOf,
  todayStr, daysBetween,
  DIFFS, diffMeta, filterDiff,
};
