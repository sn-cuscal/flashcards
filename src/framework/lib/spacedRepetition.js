/* spacedRepetition.js — Leitner-ish, session-based scheduling + small helpers */

const INTERVAL = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 5 };

export function blankRec() { return { box: 1, status: "new", due: 0, seen: 0 }; }

// grade one card; returns updated record. correct=true → promote, false → reset to box 1
export function gradeRec(rec, correct, session) {
  const r = { ...(rec || blankRec()) };
  r.seen = (r.seen || 0) + 1;
  if (correct) {
    r.box = Math.min(5, (r.box || 1) + 1);
    // A correct recall (box 2+) counts as mastered; box 1 is only ever a card
    // that was just reset by a miss. Reaching box 4 needed three spaced correct
    // recalls, which almost never happened, so every "known" counter sat at 0.
    r.status = r.box >= 2 ? "known" : "learning";
  } else {
    r.box = 1;
    r.status = "learning";
  }
  r.due = session + INTERVAL[r.box];
  return r;
}

// build an ordered review queue: due/struggling first, then new, then the rest
export function reviewQueue(cards, progress, session, limit) {
  const score = (c) => {
    const r = progress[c.id];
    if (!r || r.status === "new") return 1;          // new — high priority
    if (r.status === "known" && r.due > session) return 4; // not due — low
    if (r.due <= session) return 0;                  // due — highest
    return 2;                                         // learning, not yet due
  };
  const sorted = cards
    .map((c) => ({ c, s: score(c), box: (progress[c.id]?.box) || 1 }))
    .sort((a, b) => a.s - b.s || a.box - b.box || Math.random() - 0.5)
    .filter((x) => x.s < 4)
    .map((x) => x.c);
  return limit ? sorted.slice(0, limit) : sorted;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function masteryOf(cards, progress) {
  if (!cards.length) return 0;
  let s = 0;
  for (const c of cards) {
    const r = progress[c.id];
    if (!r || r.status === "new") continue;
    s += r.status === "known" ? 1 : (r.box - 1) / 5;
  }
  return s / cards.length;
}

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function daysBetween(a, b) {
  const pa = a.split("-").map(Number), pb = b.split("-").map(Number);
  const da = new Date(pa[0], pa[1] - 1, pa[2]);
  const db = new Date(pb[0], pb[1] - 1, pb[2]);
  return Math.round((db - da) / 86400000);
}
