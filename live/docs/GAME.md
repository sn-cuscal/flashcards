# Game rules (as implemented)

## Question draw

The host's browser draws the questions from a quiz bank (`apps/play/banks.js`)
and sends them with the create request; the backend stores and grades them but
never needs to know about banks.

Eligibility (`live/shared/draw.mjs`): single-answer questions with 2–4 options.
Multiple-response and five-option questions are excluded — they don't fit the
four colour/shape buttons. For AIF-C01 that leaves 142 of 151 questions
(55 easy, 69 intermediate, 18 advanced).

The host picks a question count (10/15/20) and optional categories. The count
splits into even thirds ordered **easy → intermediate → advanced** (remainder
to the middle tier; 10 → 3/4/3), shuffled within each tier. A tier that runs
short after category filtering backfills from the nearest tier, easier first.
Each question's options are shuffled at draw time (banks usually list the
correct option first) and `correct` becomes `correctIndex`.

If the bank provides an expert pool (`expert` in `apps/play/banks.js`, e.g.
`apps/aws/AIF-C01/expert.js`), one in five of the requested count
(`expertCount`: 10 → 2, 15 → 3, 20 → 4) is reserved for randomly selected
expert questions played last, inside the chosen total — a 10-question
selection still plays 10 (8 ramp + 2 expert). A short expert pool hands its
unused slots back to the ramp. Expert questions are game-only: they never
appear as flashcards or in the study quiz, and they ignore the host's
category filter.

## Tiers

| Tier         | Base points | Time limit |
|--------------|-------------|------------|
| easy         | 800         | 15 s       |
| intermediate | 1000        | 20 s       |
| advanced     | 1200        | 25 s       |
| expert       | 1500        | 30 s       |

Defined once in `live/shared/scoring.mjs` and re-derived server-side at game
creation, so a tampered create payload can't inflate scoring.

## Scoring

For a correct answer:

```
points = round((1 - (timeUsedMs / timeLimitMs) / 2) * basePoints)
```

Instant ≈ full base points, at the buzzer ≈ half. Wrong or no answer = 0 and
resets the streak. Streak bonus: +100 per consecutive correct answer starting
from the second, capped at +500 per question. `timeUsedMs` is measured on the
server clock (answer received − question started); answers later than the
time limit + 500 ms grace are rejected.

## Flow

```
lobby → question(i) → reveal(i) → … → podium
```

- Players join in the lobby only; rejoining with a known `playerId` works in
  any state and keeps the score (sessionStorage survives a refresh).
- The host lobby shows a QR code for `<site>/play/?pin=<pin>`; scanning it on
  a phone opens the join form with the PIN pre-filled.
- A question reveals when every player has answered, or when the host's
  countdown ends (the host client sends `reveal`; the transition is
  conditional so the two paths can't double-fire).
- Reveal shows the correct option, answer distribution, the explanation and
  the top-5 leaderboard; each player also gets their own points/streak/rank.
- After the last question the podium shows the top 3 (full standings on the
  host screen); each player sees their final rank and score.
- One answer per player per question, enforced by a conditional write.
- Correct answers and explanations are never sent to player devices before
  the reveal.
