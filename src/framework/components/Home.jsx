/* home.jsx — HomeScreen, StatsScreen, StyleScreen, BottomNav */

import React from 'react'
import { Ring } from './Ring.jsx'
import { Ic } from './icons.jsx'
import { U } from '../lib/u.js'

function catStats(cards, progress, catId) {
  const list = cards.filter((c) => c.cat === catId);
  let known = 0, learning = 0;
  for (const c of list) {
    const r = progress[c.id];
    if (r && r.status === "known") known++;
    else if (r && r.status === "learning") learning++;
  }
  return { n: list.length, known, learning, neu: list.length - known - learning, mastery: U.masteryOf(list, progress) };
}

// segmented All / Easy / Intermediate / Advanced control, shared by Cards + Quiz
function DiffFilter({ diff, onDiff }) {
  const opts = [{ id: "all", name: "All" }, ...U.DIFFS];
  return (
    <div className="diff-filter">
      {opts.map((o) => (
        <button
          key={o.id}
          className={"diff-chip" + (diff === o.id ? " on" : "")}
          style={diff === o.id && o.hue ? { background: U.catTint(o.hue), color: U.catInk(o.hue), borderColor: U.catSolid(o.hue) } : undefined}
          onClick={() => onDiff(o.id)}
        >{o.name}</button>
      ))}
    </div>
  );
}

// ───────────────────────── HOME ─────────────────────────
function HomeScreen({ cats, cards, progress, streak, dueCount, onReview, onCategory, onShuffle, config, diff, onDiff }) {
  // the difficulty filter scopes every count + deck shown on this screen
  const shown = U.filterDiff(cards, diff);
  const mastery = U.masteryOf(shown, progress);
  const knownTotal = shown.filter((c) => progress[c.id]?.status === "known").length;
  const filtered = diff && diff !== "all";

  return (
    <div className="aif-scroll">
      <div className="hd fade-up">
        <div className="hd-row">
          <div>
            <div className="hd-eyebrow">{config.home.eyebrow}</div>
            <h1 className="hd-title">{config.home.title}</h1>
          </div>
          <div className="streak"><Ic.flame /> {streak}</div>
        </div>
      </div>

      <div className="band fade-up" style={{ animationDelay: ".03s" }}>
        <Ring value={mastery} size={64} stroke={8}
          label={<b style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.03em" }}>{Math.round(mastery * 100)}<span style={{ fontSize: 10 }}>%</span></b>} />
        <div className="band-meta">
          <div className="band-k">{filtered ? "Mastery · " + U.diffMeta(diff).name : "Overall mastery"}</div>
          <div className="band-v"><b>{knownTotal}</b> of <b>{shown.length}</b> cards mastered</div>
        </div>
      </div>

      <div className="sec-label" style={{ paddingBottom: 6 }}><span>Difficulty</span></div>
      <DiffFilter diff={diff} onDiff={onDiff} />

      <button className="cta fade-up" style={{ animationDelay: ".06s" }} onClick={onReview} disabled={!shown.length}>
        <div className="cta-ic"><Ic.bolt /></div>
        <div className="cta-t">
          <h3>Smart Review</h3>
          <p>Spaced repetition — the cards you need most</p>
        </div>
        <div className="cta-n">{dueCount} due</div>
      </button>

      <div className="sec-label">
        <span>Decks · {shown.length} cards</span>
        <button onClick={onShuffle} disabled={!shown.length}>Shuffle all</button>
      </div>

      <div className="decks">
        {cats.map((cat, i) => {
          const s = catStats(shown, progress, cat.id);
          const empty = s.n === 0;
          return (
            <button key={cat.id} className={"deck fade-up" + (empty ? " is-empty" : "")} style={{ animationDelay: `${0.08 + i * 0.03}s` }} onClick={() => onCategory(cat.id)} disabled={empty}>
              <div className="deck-dot" style={{ background: U.catTint(cat.hue), color: U.catInk(cat.hue) }}>{s.n}</div>
              <div className="deck-meta">
                <h4>{cat.name}</h4>
                <p>{empty ? "No cards at this level" : cat.blurb}</p>
                <div className="deck-bar"><i style={{ width: `${Math.max(3, s.mastery * 100)}%`, background: U.catSolid(cat.hue) }} /></div>
              </div>
              <div className="deck-pct">{Math.round(s.mastery * 100)}%</div>
            </button>
          );
        })}
      </div>
      <div style={{ height: 14 }} />
    </div>
  );
}

// ───────────────────────── STATS ─────────────────────────
function StatsScreen({ cats, cards, progress, streak, quiz, reviews, onReset }) {
  const mastery = U.masteryOf(cards, progress);
  const known = cards.filter((c) => progress[c.id]?.status === "known").length;
  const acc = quiz.total ? Math.round((quiz.correct / quiz.total) * 100) : 0;

  return (
    <div className="aif-scroll">
      <div className="hd"><h1 className="hd-title" style={{ fontSize: 28 }}>Progress</h1></div>

      <div className="stat-hero fade-up">
        <Ring value={mastery} size={92} stroke={10}
          label={<React.Fragment>
            <b style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{Math.round(mastery * 100)}%</b>
            <span style={{ fontSize: 10, color: "var(--ink-3)", fontWeight: 600 }}>mastered</span>
          </React.Fragment>} />
        <div className="stat-hero-t">
          <b>{known} of {cards.length} cards locked in</b>
          <p>{mastery >= 0.8 ? "You\u2019re exam-ready. Keep the streak alive." : mastery >= 0.4 ? "Solid base — push the weak decks." : "Early days. Run Smart Review daily."}</p>
        </div>
      </div>

      <div className="stat-cards fade-up" style={{ animationDelay: ".04s" }}>
        <div className="stat-c"><b style={{ color: "var(--warn)" }}>{streak}</b><span>day streak</span></div>
        <div className="stat-c"><b>{reviews}</b><span>cards reviewed</span></div>
        <div className="stat-c"><b style={{ color: acc >= 70 ? "var(--good)" : "var(--ink)" }}>{quiz.total ? acc + "%" : "\u2013"}</b><span>quiz accuracy</span></div>
      </div>

      <div className="sec-label" style={{ paddingBottom: 0 }}>By deck</div>
      <div className="stat-rows">
        {cats.map((cat) => {
          const s = catStats(cards, progress, cat.id);
          return (
            <div key={cat.id} className="fade-up">
              <div className="stat-row-h">
                <h4>{cat.name}</h4>
                <span>{s.known}/{s.n}</span>
              </div>
              <div className="seg">
                <i style={{ width: `${(s.known / s.n) * 100}%`, background: U.catSolid(cat.hue) }} />
                <i style={{ width: `${(s.learning / s.n) * 100}%`, background: U.catTint(cat.hue) }} />
              </div>
            </div>
          );
        })}
      </div>

      <button className="reset" onClick={onReset}><Ic.redo /> Reset all progress</button>
      <div style={{ height: 14 }} />
    </div>
  );
}

// ───────────────────────── STYLE PICKER ─────────────────────────
function MiniCard({ styleId }) {
  const hue = 188;
  const base = { position: "absolute", inset: 14, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between" };
  if (styleId === "minimal")
    return <div style={{ ...base, background: "#fff", border: "1px solid var(--line)", boxShadow: "0 6px 16px rgba(40,38,34,0.08)" }}>
      <span style={{ alignSelf: "flex-start", fontFamily: "var(--mono)", fontSize: 8, padding: "3px 7px", borderRadius: 99, background: U.catTint(hue), color: U.catInk(hue) }}>SERVICES</span>
      <div style={{ fontWeight: 750, fontSize: 17, letterSpacing: "-0.02em" }}>Amazon Bedrock</div>
    </div>;
  if (styleId === "tinted")
    return <div style={{ ...base, background: U.catTint(hue), border: `1px solid oklch(0.88 0.04 ${hue})` }}>
      <span style={{ alignSelf: "flex-start", fontFamily: "var(--mono)", fontSize: 8, padding: "3px 7px", borderRadius: 99, background: U.catSolid(hue), color: "#fff" }}>SERVICES</span>
      <div style={{ fontWeight: 750, fontSize: 17, letterSpacing: "-0.02em", color: U.catDeep(hue) }}>Amazon Bedrock</div>
    </div>;
  return <div style={{ ...base, background: "oklch(0.255 0.012 70)", border: "1px solid oklch(0.34 0.013 70)" }}>
    <span style={{ alignSelf: "flex-start", fontFamily: "var(--mono)", fontSize: 8, padding: "3px 7px", borderRadius: 99, background: "rgba(255,255,255,0.08)", color: "oklch(0.85 0.02 90)" }}>SERVICES</span>
    <div style={{ fontWeight: 750, fontSize: 17, letterSpacing: "-0.02em", color: "oklch(0.96 0.01 90)" }}>Amazon Bedrock</div>
  </div>;
}

function StyleScreen({ styleId, onStyle, shuffleOn, onShuffleToggle, config }) {
  const opts = [
    { id: "minimal", name: "Minimal", desc: "Airy white. Maximum focus." },
    { id: "tinted", name: "Tinted", desc: "Soft color-coded by deck." },
    { id: "editorial", name: "Editorial", desc: "High-contrast dark. Night study." },
  ];
  return (
    <div className="aif-scroll">
      <div className="hd"><h1 className="hd-title" style={{ fontSize: 28 }}>Card Style</h1></div>
      <div className="sec-label" style={{ paddingTop: 4 }}>Choose a look — applies everywhere</div>
      <div className="style-grid">
        {opts.map((o) => (
          <button key={o.id} className={"style-opt fade-up" + (styleId === o.id ? " on" : "")} onClick={() => onStyle(o.id)}>
            <div className="style-prev"><MiniCard styleId={o.id} /></div>
            <div className="style-foot">
              <div><h4>{o.name}</h4><p>{o.desc}</p></div>
              <div className="style-check">{styleId === o.id && <Ic.check style={{ color: "#fff" }} />}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="sec-label">Study options</div>
      <div className="set-list">
        <div className="set-row">
          <div className="set-row-t"><h4>Shuffle decks</h4><p>Randomize order when opening a deck</p></div>
          <button className={"toggle" + (shuffleOn ? " on" : "")} onClick={onShuffleToggle}><i /></button>
        </div>
      </div>
      <div style={{ padding: "16px 24px", fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>
        {config.footer}
      </div>
      <div style={{ height: 14 }} />
    </div>
  );
}

// ───────────────────────── NAV ─────────────────────────
function BottomNav({ tab, onTab }) {
  const items = [
    { id: "home", label: "Cards", ic: Ic.cards },
    { id: "quiz", label: "Quiz", ic: Ic.quiz },
    { id: "stats", label: "Progress", ic: Ic.chart },
    { id: "style", label: "Style", ic: Ic.style },
  ];
  return (
    <div className="nav">
      {items.map((it) => (
        <button key={it.id} className={"nav-i" + (tab === it.id ? " on" : "")} onClick={() => onTab(it.id)}>
          <it.ic />
          <span>{it.label}</span>
        </button>
      ))}
      <div style={{ position: "absolute" }} />
    </div>
  );
}

export { HomeScreen, StatsScreen, StyleScreen, BottomNav, catStats, DiffFilter };
