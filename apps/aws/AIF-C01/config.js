/* config.js — per-app settings for the AWS AIF-C01 flashcard app.
   Everything exam-specific lives here so the framework stays generic. */

export default {
  // localStorage namespace — MUST be unique per app so multiple apps served
  // from the same GitHub Pages origin keep separate progress.
  storeKey: "aif_c01_v1",

  // browser tab title
  documentTitle: "AIF-C01 Flash Cards",

  // home screen header
  home: {
    eyebrow: "AIF-C01 · AWS Certified AI Practitioner",
    title: "Flash Cards",
  },

  // quiz result copy: the scaled score needed to pass this exam
  quiz: {
    passLine: 700,
  },

  // footer note on the Style screen
  footer: "Built from the AIF-C01 exam guide v1.1. Smart Review uses spaced repetition — cards you miss come back sooner.",
};
