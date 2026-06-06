# CLAUDE.md

Guidance for working in this repository.

## What this is

A framework for building flashcard + quiz study apps. One shared, exam-agnostic
base (`src/framework`) renders everything; each app (`apps/<...>`) supplies only
its config and datasets. Apps build to static sites for GitHub Pages. Stack:
Vite + React 18, ES modules (no JSX runtime globals, no CDN scripts).

## Commands

```
npm install            # sandbox must be disabled here (EPERM on ~/.npm/_cacache)
npm run dev            # dev server; open http://localhost:5173/aws/AIF-C01/
npm run build          # static output to dist/
npm run preview        # serve dist/ to check the production build
```

There is no landing page — navigate directly to an app path (`/aws/AIF-C01/`).

## Architecture

Two layers, kept strictly separate:

- `src/framework/` — shared code, never app-specific. Anything exam-specific
  that lands here is a bug; lift it into the app's `config.js` instead.
- `apps/<vendor>/<exam>/` — one app per directory. The directory path is the
  URL path (`apps/aws/AIF-C01/` -> `/aws/AIF-C01/`).

Data flow: an app's `main.jsx` calls `createApp({ config, data, quiz })`, which
mounts `App` inside the `IOSDevice` frame. `App` takes `{ config, data, quiz }`
as props — it reads nothing global.

### Module contracts

- `apps/*/config.js` — `export default { storeKey, documentTitle, home:{eyebrow,title}, quiz:{passLine}, footer }`.
- `apps/*/cards.js` — `export const data = { categories, cards }`.
- `apps/*/quiz.js`  — `export const quiz = { categories }`.

### Framework internals

- `lib/theme.js` — per-category colour helpers (oklch by hue).
- `lib/spacedRepetition.js` — Leitner-style scheduling (`gradeRec`, `reviewQueue`, …).
- `lib/u.js` — re-exports the above as a single `U` namespace; components call `U.x`.
- `components/icons.jsx` — the `Ic` icon set.
- `components/Ring.jsx`, `IOSFrame.jsx`, `Flashcard.jsx`, `Study.jsx`, `Home.jsx`.
- `App.jsx` — state, persistence, tab routing. `createApp.jsx` — entry + responsive scaler.

## Conventions

- ES imports only — no `window.*` globals. Components import `React`, `Ic`, `U`,
  `Ring`, `Flashcard` explicitly. Apps import the framework via the `@framework`
  alias (`src/framework`).
- All exam-specific copy comes from `config`, threaded as a prop. Don't hardcode
  exam strings in framework components.
- Each app's `config.storeKey` MUST be unique. All user state lives in
  `localStorage` under that key, and apps share the GitHub Pages origin, so a
  duplicate key clobbers another app's progress.

## Adding an app

Create `apps/<vendor>/<exam>/` with `config.js`, `cards.js`, `quiz.js`,
`main.jsx`, `index.html` (copy an existing app; only the `<title>` and the three
data/config files change). The build auto-discovers `apps/**/index.html` — no
config edits. Set a unique `storeKey`.

## Build / deploy

- `vite.config.js`: `root: 'apps'`, `base: './'` (relative assets, so the output
  works under any Pages sub-path without hard-coding the repo name), auto-discovers
  app entries, outputs to `dist/`.
- `.github/workflows/deploy.yml` deploys `dist/` to Pages on push to
  `main`/`master`. One-time: repo Settings -> Pages -> Source: GitHub Actions.
- URLs: `https://<user>.github.io/<repo>/<app-path>/`.

## Persistence

Card progress, streak, quiz score, in-progress quiz resume, and card style are
saved to `localStorage` under `config.storeKey` and restored on load — state
survives reloads and browser restarts. The logic is in `App.jsx` (`load()` and
the persistence `useEffect`).
