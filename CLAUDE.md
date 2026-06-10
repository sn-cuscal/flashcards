# CLAUDE.md

Guidance for working in this repository.

## What this is

A framework for building flashcard + quiz study apps. One shared, exam-agnostic
base (`src/framework`) renders everything; each app (`apps/<...>`) supplies only
its config and datasets. Apps build to static sites for GitHub Pages. Stack:
Vite + React 18, ES modules (no JSX runtime globals, no CDN scripts).

There is also a Kahoot-style live multiplayer quiz built on the same question
banks: the `/play/` app (`apps/play/` + `src/game/`) plus a serverless
WebSocket backend under `live/` — see the "Live multiplayer game" section.

## Commands

```
npm install            # sandbox must be disabled here (EPERM on ~/.npm/_cacache)
npm run dev            # dev server; open http://localhost:5173/aws/AIF-C01/
npm run build          # static output to dist/
npm run preview        # serve dist/ to check the production build
npm run dev:ws         # local game WebSocket server on :8787 (= make -C live dev)
npm run test:live      # game backend unit tests (node --test)
make -C live tftest    # terraform tests (mocked providers, no AWS access)
make -C live deploy    # terraform apply for the game backend (user-run)
```

There is no landing page — navigate directly to an app path (`/aws/AIF-C01/`,
`/play/`).

## Architecture

Layers, kept strictly separate:

- `src/framework/` — shared study-app code, never app-specific. Anything
  exam-specific that lands here is a bug; lift it into the app's `config.js`
  instead.
- `apps/<vendor>/<exam>/` — one app per directory. The directory path is the
  URL path (`apps/aws/AIF-C01/` -> `/aws/AIF-C01/`).
- `src/game/` + `live/` — the live multiplayer game (its own section below);
  game code never leaks into `src/framework/`, though it may import from it.

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
- `components/Ring.jsx`, `DesktopShell.jsx`, `Flashcard.jsx`, `Study.jsx`, `Home.jsx`. `Study.jsx`'s `QuizSession` renders single-answer and multiple-response questions (checkbox toggles + Submit, all-or-nothing). Both sessions support free back/forward navigation, editable revisits (re-grade a card / re-answer a question) and skip-ahead via small `‹`/`›` arrow buttons (`.nav-arrow`): the study screen places them flanking the `Still learning` / `Got it` grade buttons; the quiz centres them in a `.nav-row.quiz-nav` with the multiple-response `Submit` between them. To keep edits from double-counting, a study pass holds its grades locally and commits them once via `onCommit` (on finish/exit), and the quiz commits accuracy once via `onFinish` (on completion); the quiz score is derived from its `answers` array, not a running counter. `Study.jsx` also exports `NoteDrawer`: a per-card note that sits tucked just below the revealed (back) card and peeks out beneath it. `StudySession` passes the drawer to `Flashcard` as a `note` prop; `Flashcard` renders it inside the same flip-squeeze wrapper as the card and gates it on the displayed `face` (not `flipped`), so the note squeezes in/out *with* the card on flip rather than popping in on tap (the card front renders a `.note-spacer` of the same collapsed height so flipping never shifts the card). Collapsed it shows only a tiny tip peeking beneath the card — no text and no grip (the textarea and the bottom grip are mounted but faded out; the tip just carries a subtle category-hue tint when a note exists). The visible drawer sits inside a roomy transparent `.note-hit` wrapper (padding below and beside it) that owns the gestures, so opening/closing never needs a precise tap. You can show/hide the note by swiping up or down from **either** the card (handled in `Flashcard`, which locks gesture axis so a vertical note swipe never grades) or the note itself — incl. starting the swipe on the textarea (a clear vertical drag commits and takes the pointer from the field so it doesn't select text). A tap on the collapsed tip opens and focuses; a tap on the open drawer's chrome/grip slides it back up; a tap on the textarea just types. Closing blurs the field so the mobile keyboard dismisses. Because the note lives inside the card's pointer-capturing hit area, its own gesture handlers stop their events bubbling so the card doesn't read them as a flip/grade. The textarea autosaves on every keystroke via `onSaveNote` (no explicit save). The study keyboard shortcuts are suppressed whenever a text field is focused so the note owns every key. `Home.jsx` exports the shared `DiffFilter` (All / Easy / Intermediate / Advanced) used on the Cards and Quiz screens; the Cards screen orders its blocks header → difficulty filter → decks → Smart Review → mastery band.
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

## Live multiplayer game

Kahoot-style game on the quiz banks. Full docs: `live/README.md` ->
`live/docs/{GAME,ARCHITECTURE,DEPLOY}.md`. Plan history in
`docs/claude/260609-kahoot/`.

- Frontend: `apps/play/` (entry; `config.js` holds `wsUrl` — localhost uses
  the dev server, production is wired to the deployed `wss_url` Terraform
  output; `banks.js` registers question banks) + `src/game/` (views/hooks/
  styles, aliased `@game`). No `storeKey` — game state is server-side;
  sessions sit in `sessionStorage`.
- Shared logic: `live/shared/` (`scoring.mjs`, `draw.mjs`), aliased `@shared`,
  imported by both the frontend and the backend so rules can't drift. Only
  single-answer questions with <=4 options are game-eligible; draws order
  easy -> intermediate -> advanced with rising points (800/1000/1200) and
  time limits (15/20/25s).
- Backend: `live/backend/src/` — `engine.mjs`/`actions.mjs` are pure +
  dependency-injected (`{store, send, now}`); the Lambda handler (DynamoDB +
  API Gateway) and the local dev server (`live/backend/dev/`, memory store +
  `ws`) wrap the same code. Tests in `live/backend/test/` drive it with a fake
  clock (`npm run test:live`). The backend is deployed (ap-southeast-2);
  Lambda code changes ship with another `make -C live deploy`.
- Infra: `live/infra/` Terraform (API GW WebSocket + Lambda nodejs22.x +
  DynamoDB TTL table), driven by `live/Makefile`. The Lambda zip is built by
  `archive_file` straight from source — no bundler. All resources tagged via
  provider `default_tags`. Custom domain is two-phase (cert -> Cloudflare
  validation records -> domain + CNAME outputs); see `live/docs/DEPLOY.md`.
  Native tests in `live/infra/tests/` use mock providers (IAM uses
  `jsonencode`, not `aws_iam_policy_document` — the data source breaks under
  mocks). `terraform init/validate/test` need the sandbox disabled.
- Verifying game changes: start `npm run dev:ws` + `npm run dev`, open
  `/play/` in a host tab + player tabs. Playwright MCP roundtrips are slower
  than the 15s easy-question countdown, so script whole rounds inside a single
  `browser_run_code_unsafe` call when automating.

## Build / deploy

- `vite.config.js`: `root: 'apps'`, `base: './'` (relative assets, so the output
  works under any Pages sub-path without hard-coding the repo name), auto-discovers
  app entries, outputs to `dist/`.
- `.github/workflows/deploy.yml` deploys `dist/` to Pages on push to
  `main`/`master`. One-time: repo Settings -> Pages -> Source: GitHub Actions.
- URLs: `https://<user>.github.io/<repo>/<app-path>/`.

## Persistence

Card progress, streak, quiz score, in-progress quiz resume, per-card notes
(`notes`, keyed by card id), card style, and the
selected difficulty filter (`diffFilter`) are saved to `localStorage` under
`config.storeKey` and restored on load — state survives reloads and browser
restarts. The difficulty filter scopes Smart Review, decks and quiz draws; a
saved in-progress quiz resumes its exact snapshot regardless of the filter — the
snapshot is `{ qs, qi, answers }` (per-question `answers`, so back-navigation
restores each prior answer; the score is derived from it, not stored). The logic is in `App.jsx` (`load()` and
the persistence `useEffect`). `load()` runs `migrate()`, which recomputes each
record's `status` from its `box` (lossless — boxes, due dates and seen counts
are kept), so saved progress always reflects the current mastery rule. Extend
`migrate()` rather than bumping `storeKey` when the record shape changes.
