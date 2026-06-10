/* Local WebSocket server for development and Playwright verification. Runs
   the same actions/engine code as the Lambda, with the memory store standing
   in for DynamoDB. The play app connects here automatically on localhost. */

import { WebSocketServer } from "ws";
import { makeMemoryStore } from "./store-memory.mjs";
import { handleMessage, onDisconnect } from "../src/actions.mjs";

const port = Number(process.env.WS_PORT || 8787);
const sockets = new Map();
let nextConnection = 1;

const ctx = {
  store: makeMemoryStore(),
  now: () => Date.now(),
  async send(connectionId, payload) {
    const ws = sockets.get(connectionId);
    if (!ws || ws.readyState !== ws.OPEN) return false;
    ws.send(JSON.stringify(payload));
    return true;
  },
};

const wss = new WebSocketServer({ port });
wss.on("connection", (ws) => {
  const connectionId = `local-${nextConnection++}`;
  sockets.set(connectionId, ws);
  ws.on("message", (raw) => {
    handleMessage(ctx, connectionId, raw.toString()).catch((err) => console.error(err));
  });
  ws.on("close", () => {
    sockets.delete(connectionId);
    onDisconnect(ctx, connectionId).catch((err) => console.error(err));
  });
});

console.log(`dev ws server listening on ws://localhost:${port}`);
