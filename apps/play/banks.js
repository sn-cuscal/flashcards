/* Question banks a host can pick from. Adding another exam's bank is one
   import + one entry — the game itself is bank-agnostic. */

import { quiz as aifQuiz } from "../aws/AIF-C01/quiz.js";

export const banks = [
  { id: "aif-c01", name: "AWS AI Practitioner (AIF-C01)", quiz: aifQuiz },
];
