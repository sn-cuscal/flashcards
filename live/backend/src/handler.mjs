/* Lambda entry for the API Gateway WebSocket API. Routes:
   $connect (allow), $disconnect (unbind), $default (game actions). */

import { makeDynamoStore } from "./store-dynamo.mjs";
import { makeApiGwSender } from "./send-apigw.mjs";
import { handleMessage, onDisconnect } from "./actions.mjs";

const store = makeDynamoStore({});
// Clients may connect via the custom domain, which the management API does
// not accept — always post back through the execute-api endpoint.
const send = makeApiGwSender(process.env.WS_MANAGEMENT_ENDPOINT);
const ctx = { store, send, now: () => Date.now() };

export async function handler(event) {
  const { routeKey, connectionId } = event.requestContext;
  if (routeKey === "$disconnect") {
    await onDisconnect(ctx, connectionId);
  } else if (routeKey === "$default") {
    await handleMessage(ctx, connectionId, event.body ?? "");
  }
  return { statusCode: 200 };
}
