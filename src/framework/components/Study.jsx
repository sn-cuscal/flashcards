/* study.jsx — StudySession, SessionComplete, QuizSession */

import React from 'react'
import { Ring } from './Ring.jsx'
import { Ic } from './icons.jsx'
import { U } from '../lib/u.js'
import { Flashcard } from './Flashcard.jsx'

// ───────────────────────── STUDY ─────────────────────────
function StudySession({ queue, catMap, styleId, title, onGrade, onExit }) {
  const [cards, setCards] = React.useState(queue);
  const [idx, setIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [exiting, setExiting] = React.useState(null);
  const [misses, setMisses] = React.useState([]);
  const [got, setGot] = React.useState(0);
  const lock = React.useRef(false);

  const card = cards[idx];
  const done = idx >= cards.length;

  function grade(correct) {
    if (lock.current || done) return;
    lock.current = true;
    setExiting(correct ? "r" : "l");
    onGrade(card.id, correct);
    if (correct) setGot((g) => g + 1);
    else setMisses((m) => [...m, card]);
    setTimeout(() => {
      setExiting(null);
      setFlipped(false);
      setIdx((i) => i + 1);
      lock.current = false;
    }, 300);
  }

  // keyboard
  React.useEffect(() => {
    function onKey(e) {
      if (done) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
      else if (e.key === "ArrowRight") { e.preventDefault(); grade(true); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); grade(false); }
      else if (e.key === "Escape") onExit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (done) {
    return (
      <SessionComplete
        got={got} learning={misses.length} total={cards.length}
        onRepeat={misses.length ? () => { setCards(U.shuffle(misses)); setIdx(0); setGot(0); setMisses([]); setFlipped(false); } : null}
        onDone={onExit}
      />
    );
  }

  return (
    <div className="study">
      <div className="study-top" />
      <div className="study-bar">
        <button className="study-x" onClick={onExit} aria-label="Close"><Ic.x /></button>
        <div className="prog-track"><i style={{ width: `${(idx / cards.length) * 100}%` }} /></div>
        <div className="study-count">{idx + 1}<span style={{ opacity: 0.5 }}>/{cards.length}</span></div>
      </div>

      <div className="card-stage" style={{ position: "relative" }}>
        <Flashcard
          key={card.id}
          card={card} cat={catMap[card.cat]} styleId={styleId}
          flipped={flipped} exiting={exiting}
          onFlip={() => setFlipped((f) => !f)}
          onGrade={grade}
        />
      </div>

      <div className="grade">
        <button className="gbtn learn" onClick={() => grade(false)}>Still learning</button>
        <button className="gbtn know" onClick={() => grade(true)}><Ic.check /> Got it</button>
      </div>
      <div className="kbd-hints">
        <span><span className="kbd">space</span> flip</span>
        <span><span className="kbd">←</span> learning</span>
        <span><span className="kbd">→</span> got it</span>
      </div>
      <div className="aif-bottom-safe" />
    </div>
  );
}

function SessionComplete({ got, learning, total, onRepeat, onDone }) {
  const pct = total ? Math.round((got / total) * 100) : 0;
  const msg = pct === 100 ? "Perfect run." : pct >= 70 ? "Strong session." : "Keep at it — repetition wins.";
  return (
    <div className="study">
      <div className="study-top" />
      <div className="study-bar">
        <button className="study-x" onClick={onDone} aria-label="Close"><Ic.x /></button>
        <div style={{ flex: 1 }} />
      </div>
      <div className="done-wrap fade-up">
        <div className="done-ring">
          <Ring value={got / Math.max(1, total)} size={132} stroke={12} color="var(--good)"
            label={<React.Fragment>
              <b style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{pct}%</b>
              <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>recalled</span>
            </React.Fragment>} />
        </div>
        <h2>Session complete</h2>
        <p>{msg}</p>
        <div className="done-stats">
          <div className="done-stat"><b style={{ color: "var(--good)" }}>{got}</b><span>Got it</span></div>
          <div className="done-stat"><b style={{ color: "var(--warn)" }}>{learning}</b><span>Still learning</span></div>
          <div className="done-stat"><b>{total}</b><span>Reviewed</span></div>
        </div>
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          {onRepeat && (
            <button className="cta" style={{ margin: 0, width: "100%" }} onClick={onRepeat}>
              <div className="cta-ic"><Ic.redo /></div>
              <div className="cta-t"><h3>Repeat the {learning} you missed</h3><p>Lock them in before you leave</p></div>
            </button>
          )}
          <button className="reset" style={{ margin: 0, color: "var(--ink)", fontWeight: 700 }} onClick={onDone}>Back to decks</button>
        </div>
      </div>
      <div className="aif-bottom-safe" />
    </div>
  );
}

// ───────────────────────── QUIZ ─────────────────────────
function QuizSession({ quiz, saved, config, onAnswer, onSave, onClear, onExit }) {
  const [qs] = React.useState(() =>
    (saved && saved.qs) || U.shuffle(quiz.questions).map((item) => ({
      q: item.q,
      opts: U.shuffle(item.options),
      correct: item.correct,
      explain: item.explain,
    }))
  );
  const [qi, setQi] = React.useState(saved ? saved.qi : 0);
  const [sel, setSel] = React.useState(null);
  const [score, setScore] = React.useState(saved ? saved.score : 0);
  const q = qs[qi];
  const answered = sel !== null;
  const done = qi >= qs.length;

  // persist a stable starting order on a fresh quiz
  React.useEffect(() => {
    if (!saved && qi < qs.length) onSave({ qs, qi: 0, score: 0 });
  }, []);

  function choose(opt) {
    if (answered) return;
    const correct = opt === q.correct;
    setSel(opt);
    if (correct) setScore((s) => s + 1);
    onAnswer(correct);
  }
  function next() {
    const nq = qi + 1;
    const nScore = score; // score already reflects the answered question
    setSel(null);
    setQi(nq);
    if (nq >= qs.length) onClear();
    else onSave({ qs, qi: nq, score: nScore });
  }

  React.useEffect(() => {
    function onKey(e) {
      if (done) return;
      if (e.key === "Escape") return onExit();
      if (!answered && q && /^[1-4]$/.test(e.key)) { const o = q.opts[+e.key - 1]; if (o) choose(o); }
      else if (answered && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (done) {
    const pct = Math.round((score / qs.length) * 100);
    return (
      <div className="study">
        <div className="study-top" />
        <div className="study-bar">
          <button className="study-x" onClick={onExit} aria-label="Close"><Ic.x /></button>
          <div style={{ flex: 1 }} />
        </div>
        <div className="done-wrap">
          <div className="done-ring">
            <Ring value={score / qs.length} size={132} stroke={12} color={pct >= 70 ? "var(--good)" : "var(--warn)"}
              label={<React.Fragment>
                <b style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1 }}>{score}/{qs.length}</b>
                <span style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 600, marginTop: 2 }}>{pct}%</span>
              </React.Fragment>} />
          </div>
          <h2>{pct >= 70 ? "Passing pace!" : "More reps needed"}</h2>
          <p>{pct >= 70 ? `You\u2019d clear the ${config.quiz.passLine} line on ${quiz.name}.` : `Review the ${quiz.name} deck, then run it again.`}</p>
          <div style={{ width: "100%" }}>
            <button className="reset" style={{ margin: 0, color: "var(--ink)", fontWeight: 700 }} onClick={onExit}>Done</button>
          </div>
        </div>
        <div className="aif-bottom-safe" />
      </div>
    );
  }

  return (
    <div className="study">
      <div className="study-top" />
      <div className="study-bar">
        <button className="study-x" onClick={onExit} aria-label="Close"><Ic.x /></button>
        <div className="prog-track"><i style={{ width: `${(qi / qs.length) * 100}%`, background: U.catSolid(quiz.hue) }} /></div>
        <div className="study-count">{qi + 1}<span style={{ opacity: 0.5 }}>/{qs.length}</span></div>
      </div>
      <div className="aif-scroll">
        <div className="quiz-prompt" key={"p" + qi}>
          <div className="quiz-q-k" style={{ color: U.catInk(quiz.hue) }}>{quiz.name}</div>
          <div className="quiz-q">{q.q}</div>
        </div>
        <div className="quiz-opts">
          {q.opts.map((opt, n) => {
            let cls = "opt";
            if (answered) {
              if (opt === q.correct) cls += " correct";
              else if (opt === sel) cls += " wrong";
              else cls += " dim";
            }
            return (
              <button key={opt} className={cls} onClick={() => choose(opt)}>
                <span className="opt-k">{answered && opt === q.correct ? <Ic.check /> : "ABCD"[n]}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
        {answered && q.explain && (
          <div className="quiz-explain">
            <span className="quiz-explain-k">{sel === q.correct ? "Correct" : "Answer"}</span>
            {q.explain}
          </div>
        )}
      </div>
      {answered && (
        <button className="quiz-next" onClick={next}>
          {qi + 1 >= qs.length ? "See score" : "Next question"} <Ic.arrowR />
        </button>
      )}
      <div className="kbd-hints">
        {!answered ? <span><span className="kbd">1-4</span> choose</span> : <span><span className="kbd">enter</span> next</span>}
      </div>
      <div className="aif-bottom-safe" />
    </div>
  );
}

export { StudySession, SessionComplete, QuizSession };
