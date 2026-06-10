/* Push a message to one WebSocket connection via the API Gateway management
   API. Returns false (rather than throwing) when the connection is gone so
   broadcasts skip dead clients. */

import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";

export function makeApiGwSender(endpoint) {
  const client = new ApiGatewayManagementApiClient({ endpoint });
  return async function send(connectionId, payload) {
    try {
      await client.send(new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify(payload),
      }));
      return true;
    } catch (err) {
      if (err.name === "GoneException" || err.$metadata?.httpStatusCode === 410) return false;
      throw err;
    }
  };
}
