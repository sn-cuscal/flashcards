/* DynamoDB persistence. One table:
     GAME#<pin> / META        — game state + questions (incl. answers)
     GAME#<pin> / PLAYER#<id> — per-player score, streak, answers map
     CONN#<id>  / META        — connectionId -> { pin, role } for $disconnect
   All items carry expiresAtEpochSeconds so TTL cleans up whole games. */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { answerKey } from "./engine.mjs";

const gameKey = (pin) => ({ pk: `GAME#${pin}`, sk: "META" });
const playerKey = (pin, playerId) => ({ pk: `GAME#${pin}`, sk: `PLAYER#${playerId}` });
const connKey = (connectionId) => ({ pk: `CONN#${connectionId}`, sk: "META" });

const isConditionFailure = (err) =>
  err.name === "ConditionalCheckFailedException" || err.name === "TransactionCanceledException";

export function makeDynamoStore({ tableName, client } = {}) {
  const doc = DynamoDBDocumentClient.from(client ?? new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  });
  const TableName = tableName ?? process.env.TABLE_NAME;

  return {
    async createGame(meta) {
      try {
        await doc.send(new PutCommand({
          TableName,
          Item: { ...gameKey(meta.pin), ...meta },
          ConditionExpression: "attribute_not_exists(pk)",
        }));
        return true;
      } catch (err) {
        if (isConditionFailure(err)) return false;
        throw err;
      }
    },

    async getGame(pin) {
      const r = await doc.send(new GetCommand({ TableName, Key: gameKey(pin) }));
      return r.Item ?? null;
    },

    async updateGame(pin, fields) {
      const names = {};
      const values = {};
      const sets = Object.entries(fields).map(([k, v], i) => {
        names[`#f${i}`] = k;
        values[`:v${i}`] = v;
        return `#f${i} = :v${i}`;
      });
      await doc.send(new UpdateCommand({
        TableName,
        Key: gameKey(pin),
        UpdateExpression: `SET ${sets.join(", ")}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      }));
    },

    /* Conditional state move; returns false when someone else already moved
       it (e.g. auto-reveal vs host-timeout reveal). */
    async transitionState(pin, from, to, extraFields = {}) {
      const names = { "#state": "state" };
      const values = { ":from": from, ":to": to };
      const sets = ["#state = :to"];
      Object.entries(extraFields).forEach(([k, v], i) => {
        names[`#f${i}`] = k;
        values[`:v${i}`] = v;
        sets.push(`#f${i} = :v${i}`);
      });
      try {
        await doc.send(new UpdateCommand({
          TableName,
          Key: gameKey(pin),
          UpdateExpression: `SET ${sets.join(", ")}`,
          ConditionExpression: "#state = :from",
          ExpressionAttributeNames: names,
          ExpressionAttributeValues: values,
        }));
        return true;
      } catch (err) {
        if (isConditionFailure(err)) return false;
        throw err;
      }
    },

    async putPlayer(player) {
      await doc.send(new PutCommand({
        TableName,
        Item: { ...playerKey(player.pin, player.playerId), ...player },
        ConditionExpression: "attribute_not_exists(pk)",
      }));
    },

    async getPlayer(pin, playerId) {
      const r = await doc.send(new GetCommand({ TableName, Key: playerKey(pin, playerId) }));
      return r.Item ?? null;
    },

    async listPlayers(pin) {
      const r = await doc.send(new QueryCommand({
        TableName,
        KeyConditionExpression: "pk = :pk AND begins_with(sk, :sk)",
        ExpressionAttributeValues: { ":pk": `GAME#${pin}`, ":sk": "PLAYER#" },
      }));
      return r.Items ?? [];
    },

    /* One answer per player per question — the map key is the condition. */
    async recordAnswer(pin, playerId, index, entry, pointsDelta, streakAfter) {
      try {
        await doc.send(new UpdateCommand({
          TableName,
          Key: playerKey(pin, playerId),
          UpdateExpression: "SET answers.#i = :a, streak = :s ADD score :p",
          ConditionExpression: "attribute_not_exists(answers.#i)",
          ExpressionAttributeNames: { "#i": answerKey(index) },
          ExpressionAttributeValues: { ":a": entry, ":s": streakAfter, ":p": pointsDelta },
        }));
        return true;
      } catch (err) {
        if (isConditionFailure(err)) return false;
        throw err;
      }
    },

    async setPlayerConnection(pin, playerId, connectionId) {
      await doc.send(new UpdateCommand({
        TableName,
        Key: playerKey(pin, playerId),
        UpdateExpression: "SET connectionId = :c",
        ExpressionAttributeValues: { ":c": connectionId },
      }));
    },

    async putConn(connectionId, { pin, role }) {
      await doc.send(new PutCommand({
        TableName,
        Item: {
          ...connKey(connectionId),
          pin,
          role,
          expiresAtEpochSeconds: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
        },
      }));
    },

    async getConn(connectionId) {
      const r = await doc.send(new GetCommand({ TableName, Key: connKey(connectionId) }));
      return r.Item ?? null;
    },

    async deleteConn(connectionId) {
      await doc.send(new DeleteCommand({ TableName, Key: connKey(connectionId) }));
    },
  };
}
