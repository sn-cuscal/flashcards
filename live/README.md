# Live multiplayer quiz

Kahoot-style multiplayer game built on the flashcard apps' quiz banks. A host
opens a lobby on a shared screen, players join with a 6-digit PIN on their own
devices, questions run on a countdown with time-weighted scoring, and the draw
gets harder as the game progresses (easy → intermediate → advanced).

## Layout

```
live/
  shared/    scoring + question-draw logic, shared by backend and frontend
  backend/   Lambda source (src/), local dev server (dev/), unit tests (test/)
  infra/     Terraform (API Gateway WebSocket + Lambda + DynamoDB), tests/
  docs/      documentation
  Makefile   terraform + test + dev entry points
```

The frontend is the `/play/` app (`apps/play/` + `src/game/`), built and
deployed to GitHub Pages with the rest of the repo.

## Docs

- [docs/GAME.md](docs/GAME.md) — rules as implemented: draw, ramp, scoring, flow
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — backend, protocol, data model
- [docs/DEPLOY.md](docs/DEPLOY.md) — deploy with the Makefile, Cloudflare DNS, frontend wiring

## Quick reference

```
make -C live test      # backend unit tests (node --test)
make -C live tftest    # terraform tests (mocked providers, no AWS access)
make -C live dev       # local WebSocket server on :8787 (npm run dev:ws)
npm run dev            # vite; open http://localhost:5173/play/
make -C live deploy    # terraform apply (run from repo root, or make deploy in live/)
```
