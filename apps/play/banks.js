/* Question banks a host can pick from. Adding another exam's bank is one
   import + one entry — the game itself is bank-agnostic. `expert` is optional:
   a game-only pool (never shown as flashcards) drawn for the final questions. */

import { quiz as aifQuiz } from "../aws/AIF-C01/quiz.js";
import { expert as aifExpert } from "../aws/AIF-C01/expert.js";

export const banks = [
  { id: "aif-c01", name: "AWS AI Practitioner (AIF-C01)", quiz: aifQuiz, expert: aifExpert },
];
