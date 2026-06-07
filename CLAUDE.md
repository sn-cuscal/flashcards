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
mounts `App` (wrapped in `DesktopShell`) into the page `#root`. `App` takes
`{ config, data, quiz }` as props — it reads nothing global. `DesktopShell` +
`styles.css` own the responsive layout: mobile-first (the app fills the viewport
on phones), a centred portrait column on tablets, and a branded side panel
beside the column on desktop. `index.html` is just the host page (fonts +
`#root`).

### Module contracts

- `apps/*/config.js` — `export default { storeKey, documentTitle, home:{eyebrow,title}, quiz:{passLine}, footer }`.
- `apps/*/cards.js` — `export const data = { categories, cards }`. Each card carries a `diff` of `easy | intermediate | advanced` (the file defaults it by category, then per-card overrides).
- `apps/*/quiz.js`  — `export const quiz = { categories }`. Each question has a `diff` and a `correct` that is either a string (single-answer) or a string array (multiple-response, graded all-or-nothing); options may number 4–5.

### Framework internals

- `lib/theme.js` — per-category colour helpers (oklch by hue).
- `lib/spacedRepetition.js` — Leitner-style scheduling (`gradeRec`, `reviewQueue`, …). `gradeRec` marks a card `status: "known"` (= mastered) at `box >= 2`; every progress/mastery/due counter keys off `status === "known"`.
- `lib/u.js` — re-exports the above as a single `U` namespace; components call `U.x`. Also owns the difficulty axis: `U.DIFFS`, `U.diffMeta(id)`, `U.filterDiff(items, diff)`.
- `components/icons.jsx` — the `Ic` icon set.
- `components/Ring.jsx`, `DesktopShell.jsx`, `Flashcard.jsx`, `Study.jsx`, `Home.jsx`. `Study.jsx`'s `QuizSession` renders single-answer and multiple-response questions (checkbox toggles + Submit, all-or-nothing). `Home.jsx` exports the shared `DiffFilter` (All / Easy / Intermediate / Advanced) used on the Cards and Quiz screens.
- `App.jsx` — state, persistence, tab routing. `createApp.jsx` — entry (mounts `App` into `#root`).
- `styles.css` — component styles, the responsive shell, and reduced-motion fallbacks (page/session/flip transitions degrade to opacity-only fades).

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
`main.jsx`, `index.html`, and `favicon.svg` (copy an existing app; only the
`<title>` and the three data/config files change — `main.jsx`, `index.html` and
`favicon.svg` copy as-is). The build auto-discovers `apps/**/index.html` — no
config edits. Set a unique `storeKey`.

## Build / deploy

- `vite.config.js`: `root: 'apps'`, `base: './'` (relative assets, so the output
  works under any Pages sub-path without hard-coding the repo name), auto-discovers
  app entries, outputs to `dist/`.
- `.github/workflows/deploy.yml` deploys `dist/` to Pages on push to
  `main`/`master`. One-time: repo Settings -> Pages -> Source: GitHub Actions.
- URLs: `https://<user>.github.io/<repo>/<app-path>/`.

## Persistence

Card progress, streak, quiz score, in-progress quiz resume, card style, and the
selected difficulty filter (`diffFilter`) are saved to `localStorage` under
`config.storeKey` and restored on load — state survives reloads and browser
restarts. The difficulty filter scopes Smart Review, decks and quiz draws; a
saved in-progress quiz resumes its exact snapshot regardless of the filter. The logic is in `App.jsx` (`load()` and
the persistence `useEffect`). `load()` runs `migrate()`, which recomputes each
record's `status` from its `box` (lossless — boxes, due dates and seen counts
are kept), so saved progress always reflects the current mastery rule. Extend
`migrate()` rather than bumping `storeKey` when the record shape changes.
