# Architecture

```
Host + player browsers (static /play/ app on GitHub Pages)
        │ wss
        ▼
API Gateway WebSocket API ($connect / $disconnect / $default)
        ▼
Lambda (nodejs22.x, arm64, single handler)
        │                            │ PostToConnection
        ▼                            ▼
DynamoDB (single table, TTL)   execute-api management endpoint
```

The same game code runs in two harnesses:

- **Lambda** (`backend/src/handler.mjs`): DynamoDB store + API Gateway sends.
- **Local dev server** (`backend/dev/dev-server.mjs`, `make dev`, port 8787):
  in-memory store + `ws` sends. The `/play/` app connects to it automatically
  on localhost.

`backend/src/actions.mjs` (orchestration) and `backend/src/engine.mjs` (pure
game logic) are injected with `{ store, send, now }`, so unit tests drive the
real code with a fake clock and recorded sends (`backend/test/`).

## WebSocket protocol

Routing: `$default` with route selection `$request.body.action`.

Client → server:

| action       | payload                                     | sender |
|--------------|---------------------------------------------|--------|
| `create`     | questions (drawn client-side), settings     | host   |
| `join`       | pin, nickname, playerId (rejoin only)       | player |
| `rejoinHost` | pin, hostToken                              | host   |
| `start`      | pin, hostToken                              | host   |
| `answer`     | pin, playerId, questionIndex, choiceIndex   | player |
| `reveal`     | pin, hostToken (countdown ended)            | host   |
| `next`       | pin, hostToken                              | host   |
| `end`        | pin, hostToken                              | host   |

Server → client: `created {pin, hostToken, total}`, `joined`, `lobby {players}`,
`question {index, total, q, options, diff, basePoints, timeLimitSeconds,
elapsedMs}` (no `correctIndex`/`explain`), `answerAck`, `answerCount` (host),
`reveal {correctIndex, explain, distribution, noAnswer, leaderboard, you}`,
`podium {top3, you | standings}`, `ended`, `error {code, message, action}`.

On join/rejoin the server sends a state snapshot so a refreshed client lands
on the correct screen mid-game; `elapsedMs` lets the countdown resume. A
rejoining host also gets the roster (`lobby` frame) and, mid-question, the
current `answerCount` back — its screens derive "N of M answered" from them.

## DynamoDB

One table, on-demand, TTL on `expiresAtEpochSeconds` (games expire 6 h after
creation):

| pk            | sk            | content                                                        |
|---------------|---------------|----------------------------------------------------------------|
| `GAME#<pin>`  | `META`        | state, questions (with answers), currentQuestion, questionStartedAtEpochMs, hostConnectionId, hostToken, settings |
| `GAME#<pin>`  | `PLAYER#<id>` | nickname, connectionId, score, streak, answers map             |
| `CONN#<id>`   | `META`        | pin + role, for `$disconnect` cleanup                          |

Concurrency is handled with conditional writes: PIN allocation
(`attribute_not_exists` on create, retried), one answer per question
(`attribute_not_exists(answers.#i)`), and state transitions
(`ConditionExpression: state = :from`) so the all-answered auto-reveal and the
host's timeout reveal can race harmlessly.

## Frontend

- `apps/play/` — entry: `config.js` (wsUrl), `banks.js` (question banks),
  `main.jsx`, `index.html`. Auto-discovered by the Vite build; URL `/play/`.
- `src/game/` — `GameApp` (role chooser), `HostView`, `PlayerView`,
  `hooks.js` (socket with auto-reconnect/rejoin, countdown, session storage),
  `shapes.jsx` (the four colour/shape identities), `game.css`.
- Vite aliases: `@game` → `src/game`, `@shared` → `live/shared` (the frontend
  imports the same scoring/draw modules the backend uses).
- The countdown renders client-side; the server stays authoritative by
  rejecting late answers and timing on its own clock.

## Limits and posture

- Casual-grade anti-cheat only: answers are stripped from question payloads
  and all grading happens server-side; there are no accounts.
- 50 players per game, 50 questions, 6-digit PINs, stage throttling
  (50 rps / burst 100). If the host tab dies the game stalls until the host
  reopens `/play/` (the session rejoins from sessionStorage).
