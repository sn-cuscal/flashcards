/* u.js — aggregates the colour + spaced-repetition helpers into a single `U`
   namespace, matching how the components reference them (U.catTint, U.shuffle, …). */

import { catTint, catInk, catSolid, catDeep } from './theme.js'
import { blankRec, gradeRec, reviewQueue, shuffle, masteryOf, todayStr, daysBetween } from './spacedRepetition.js'

export const U = {
  catTint, catInk, catSolid, catDeep,
  blankRec, gradeRec, reviewQueue, shuffle, masteryOf,
  todayStr, daysBetween,
};
