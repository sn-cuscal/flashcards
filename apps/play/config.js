/* Per-app settings for the live multiplayer quiz.
   On localhost the app talks to the local dev server (`npm run dev:ws`).
   After `make deploy` in live/, replace the placeholder below with the
   `wss_url` (or `custom_wss_url`) Terraform output. A `?ws=` query param
   overrides both for ad-hoc testing. */

const params = new URLSearchParams(location.search);
const isLocal = ["localhost", "127.0.0.1"].includes(location.hostname);

export default {
  documentTitle: "Trivia",
  wsUrl: params.get("ws") || (isLocal ? "ws://localhost:8787" : "wss://s6hgnqqz4c.execute-api.ap-southeast-2.amazonaws.com/prod"),
};
