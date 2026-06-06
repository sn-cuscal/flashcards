/* ui.jsx — icons, primitives, theme + spaced-repetition helpers (window.U) */

// ---------- icons (simple stroke set) ----------
const Ic = {
  cards: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}><rect x="3" y="6" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M7 4.5h9.5A3.5 3.5 0 0 1 20 8v9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  quiz: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M9.3 9.2a2.8 2.8 0 0 1 5.2 1.3c0 1.9-2.5 2-2.5 3.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="17" r="1.1" fill="currentColor"/></svg>,
  chart: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}><path d="M5 19V11M12 19V5M19 19v-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  style: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}><circle cx="8" cy="8" r="4.2" stroke="currentColor" strokeWidth="1.8"/><rect x="13" y="13" width="8" height="8" rx="2.2" stroke="currentColor" strokeWidth="1.8"/><path d="M3 21l4-5 4 5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>,
  flame: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M13 2c.5 3-1.5 4.2-2.8 5.6C8.8 9.2 8 10.6 8 12.5a4 4 0 0 0 .9 2.5c-.2-1.4.5-2.6 1.6-3.3-.3 1.8.6 2.7 1.6 3.6 1.4 1.2 1.4 2.6.9 3.7 2.3-.6 4-2.8 4-5.6 0-3.4-2.4-5-3.2-7.2-.5 1-1.3 1.6-2.3 2C12.7 9.6 13.6 6 13 2z"/></svg>,
  shuffle: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}><path d="M3 7h3.5c1.6 0 2.7 1 3.6 2.3l3.8 5.4c.9 1.3 2 2.3 3.6 2.3H21M3 17h3.5c1.6 0 2.7-1 3.6-2.3M21 7h-3.4c-1.5 0-2.6.9-3.5 2.1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M18.5 4.5 21 7l-2.5 2.5M18.5 14.5 21 17l-2.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bolt: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" {...p}><path d="M13 2 4.5 13.5H11l-1 8.5L19.5 10H13l0-8z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round"/></svg>,
  x: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round"/></svg>,
  check: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}><path d="M4 12.5l5 5L20 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  back: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}><path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  redo: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}><path d="M4 9h11a4.5 4.5 0 1 1-4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 5.5 3.5 9 7 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  flip: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" {...p}><path d="M12 3v18" stroke="currentColor" strokeWidth="1.7" strokeDasharray="2 2.5"/><path d="M9 7 5 12l4 5V7zM15 7l4 5-4 5V7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>,
  arrowR: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...p}><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  info: (p) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" {...p}><circle cx="12" cy="12" r="9.2" stroke="currentColor" strokeWidth="2"/><path d="M12 11v5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/><circle cx="12" cy="7.4" r="1.25" fill="currentColor"/></svg>,
};

// ---------- theme helpers ----------
function catTint(hue)  { return `oklch(0.955 0.036 ${hue})`; }
function catInk(hue)   { return `oklch(0.50 0.10 ${hue})`; }
function catSolid(hue) { return `oklch(0.62 0.095 ${hue})`; }
function catDeep(hue)  { return `oklch(0.30 0.05 ${hue})`; }

// ---------- progress ring ----------
function Ring({ value, size = 58, stroke = 7, color = "var(--accent)", track = "var(--line-2)", label }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, value)));
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.7,.2,1)" }} />
      </svg>
      {label !== undefined && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {label}
        </div>
      )}
    </div>
  );
}

// ---------- spaced repetition (Leitner-ish, session-based) ----------
const INTERVAL = { 1: 1, 2: 1, 3: 2, 4: 3, 5: 5 };

function blankRec() { return { box: 1, status: "new", due: 0, seen: 0 }; }

// grade one card; returns updated record. correct=true → promote, false → reset to box 1
function gradeRec(rec, correct, session) {
  const r = { ...(rec || blankRec()) };
  r.seen = (r.seen || 0) + 1;
  if (correct) {
    r.box = Math.min(5, (r.box || 1) + 1);
    r.status = r.box >= 4 ? "known" : "learning";
  } else {
    r.box = 1;
    r.status = "learning";
  }
  r.due = session + INTERVAL[r.box];
  return r;
}

// build an ordered review queue: due/struggling first, then new, then the rest
function reviewQueue(cards, progress, session, limit) {
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

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function masteryOf(cards, progress) {
  if (!cards.length) return 0;
  let s = 0;
  for (const c of cards) {
    const r = progress[c.id];
    if (!r || r.status === "new") continue;
    s += r.status === "known" ? 1 : (r.box - 1) / 5;
  }
  return s / cards.length;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function daysBetween(a, b) {
  const pa = a.split("-").map(Number), pb = b.split("-").map(Number);
  const da = new Date(pa[0], pa[1] - 1, pa[2]);
  const db = new Date(pb[0], pb[1] - 1, pb[2]);
  return Math.round((db - da) / 86400000);
}

Object.assign(window, {
  Ic, Ring,
  U: {
    catTint, catInk, catSolid, catDeep,
    blankRec, gradeRec, reviewQueue, shuffle, masteryOf,
    todayStr, daysBetween,
  },
});
