/* In-memory store with the same interface and conditional-write semantics as
   store-dynamo.mjs. Used by the local dev server and the unit tests, so the
   real action/engine code runs without AWS. */

import { answerKey } from "../src/engine.mjs";

const clone = (v) => (v == null ? v : structuredClone(v));

export function makeMemoryStore() {
  const games = new Map();   // pin -> meta
  const players = new Map(); // pin -> Map(playerId -> player)
  const conns = new Map();   // connectionId -> { pin, role }

  return {
    async createGame(meta) {
      if (games.has(meta.pin)) return false;
      games.set(meta.pin, clone(meta));
      players.set(meta.pin, new Map());
      return true;
    },

    async getGame(pin) {
      return clone(games.get(pin) ?? null);
    },

    async updateGame(pin, fields) {
      const game = games.get(pin);
      if (game) Object.assign(game, clone(fields));
    },

    async transitionState(pin, from, to, extraFields = {}) {
      const game = games.get(pin);
      if (!game || game.state !== from) return false;
      Object.assign(game, clone(extraFields), { state: to });
      return true;
    },

    async putPlayer(player) {
      const byId = players.get(player.pin);
      if (!byId || byId.has(player.playerId)) throw new Error("player exists");
      byId.set(player.playerId, clone(player));
    },

    async getPlayer(pin, playerId) {
      return clone(players.get(pin)?.get(playerId) ?? null);
    },

    async listPlayers(pin) {
      return [...(players.get(pin)?.values() ?? [])].map(clone);
    },

    async recordAnswer(pin, playerId, index, entry, pointsDelta, streakAfter) {
      const player = players.get(pin)?.get(playerId);
      if (!player || player.answers[answerKey(index)]) return false;
      player.answers[answerKey(index)] = clone(entry);
      player.score += pointsDelta;
      player.streak = streakAfter;
      return true;
    },

    async setPlayerConnection(pin, playerId, connectionId) {
      const player = players.get(pin)?.get(playerId);
      if (player) player.connectionId = connectionId;
    },

    async putConn(connectionId, { pin, role }) {
      conns.set(connectionId, { pin, role });
    },

    async getConn(connectionId) {
      return clone(conns.get(connectionId) ?? null);
    },

    async deleteConn(connectionId) {
      conns.delete(connectionId);
    },
  };
}
