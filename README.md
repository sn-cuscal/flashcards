# Flashcards

A small framework for building flashcard + quiz study apps. A shared base
(`src/framework`) provides all the UI and logic; each individual app
(`apps/<...>`) supplies only its config and datasets. Apps build to static
sites and deploy to GitHub Pages.

## Structure

```
src/framework/            shared, exam-agnostic code (never copied per app)
  components/             React components
    icons.jsx             stroke icon set (Ic)
    Ring.jsx              progress ring
    DesktopShell.jsx      responsive shell (mobile-first; desktop side panel)
    Flashcard.jsx         flip + swipe-to-grade card (shows a difficulty badge)
    Study.jsx             study + quiz sessions (single-answer + multi-select)
    Home.jsx              home / stats / style screens, bottom nav, DiffFilter
  lib/
    theme.js              per-category colour helpers
    spacedRepetition.js   Leitner-style scheduling
    u.js                  aggregates the above + the difficulty axis into `U`
  App.jsx                 root state, persistence, routing
  createApp.jsx           entry factory (mounts App in the responsive shell)
  styles.css              component styles, responsive shell, reduced-motion

apps/                     one directory per app; the path is the URL path
  aws/AIF-C01/            -> served at /aws/AIF-C01/
    index.html            page entry (host page: fonts + #root)
    favicon.svg           app icon (stacked-cards mark)
    main.jsx              wires config + datasets into createApp
    config.js             app-specific copy + storeKey
    cards.js              flashcard dataset (export const data)
    quiz.js               quiz bank (export const quiz)
```

Every card and quiz question carries a difficulty (`easy`, `intermediate` or
`advanced`). A filter on the Cards and Quiz screens scopes study, Smart Review
and quiz draws to one tier. Quiz questions support both single-answer and
multiple-response: a question's `correct` is a string for single-answer or a
string array for multiple-response (graded all-or-nothing).

## Develop

```
npm install
npm run dev        # then open http://localhost:5173/aws/AIF-C01/
```

There is no landing page; navigate directly to an app's path.

## Build

```
npm run build      # outputs static files to dist/
npm run preview    # serve dist/ locally to check the production build
```

The build auto-discovers every `apps/**/index.html`, so new apps need no
config change. Asset URLs are relative, so the output works under any GitHub
Pages sub-path without hard-coding the repository name.

## Adding a new app

1. Create `apps/<vendor>/<exam>/` (the directory path becomes the URL path).
2. Add these files, copying an existing app as a template:
   - `config.js` — set a **unique** `storeKey`, plus the title/eyebrow/footer copy.
   - `cards.js` — `export const data = { categories, cards }`; give each card a `diff`.
   - `quiz.js` — `export const quiz = { categories }`; each question has a `diff` and a `correct` (string or string array).
   - `main.jsx`, `index.html`, `favicon.svg` — copy as-is, only the `<title>` changes.
3. `npm run build`. The new app appears at its own path in `dist/`.

No framework code is touched.

## Persistence

All per-user state — card progress, daily streak, quiz score, in-progress quiz
resume, the chosen card style, and the selected difficulty filter — is stored in
the browser's `localStorage` under the app's `storeKey`. It persists across page reloads and browser
restarts; a returning user keeps their progress. `localStorage` is scoped to
the origin, so every app sharing a GitHub Pages origin must use a distinct
`storeKey` (set in its `config.js`) to avoid clobbering another app's data.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds on every push to `main`/`master` and
publishes `dist/` to GitHub Pages. One-time setup: in the repository's
**Settings -> Pages**, set **Source** to **GitHub Actions**.

Apps are then served at `https://<user>.github.io/<repo>/<app-path>/`, e.g.
`https://<user>.github.io/flashcards/aws/AIF-C01/`.
