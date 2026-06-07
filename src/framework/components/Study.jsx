/* study.jsx — StudySession, SessionComplete, QuizSession */

import React from 'react'
import { Ring } from './Ring.jsx'
import { Ic } from './icons.jsx'
import { U } from '../lib/u.js'
import { Flashcard } from './Flashcard.jsx'

// ───────────────────────── STUDY ─────────────────────────
function StudySession({ queue, catMap, styleId, title, onCommit, onExit }) {
  const [cards, setCards] = React.useState(queue);
  // grades[i] is the final decision for cards[i]: undefined | true | false
  const [grades, setGrades] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  const [flipped, setFlipped] = React.useState(false);
  const [exiting, setExiting] = React.useState(null);
  const lock = React.useRef(false);
  const committed = React.useRef(false);

  const card = cards[idx];
  const done = idx >= cards.length;
  const got = grades.filter((g) => g === true).length;
  const missed = grades.filter((g) => g === false).length;

  // A pass commits all its final grades at once, so changing a grade on revisit
  // never double-counts a card. Fires once per pass (X, finish, or before repeat).
  function commitPass() {
    if (committed.current) return;
    committed.current = true;
    const results = [];
    cards.forEach((c, i) => { if (grades[i] !== undefined) results.push({ cardId: c.id, correct: grades[i] }); });
    onCommit(results);
  }
  function exit() { commitPass(); onExit(); }

  React.useEffect(() => { if (done) commitPass(); }, [done]);

  function grade(correct) {
    if (lock.current || done) return;
    lock.current = true;
    setExiting(correct ? "r" : "l");
    setGrades((g) => { const n = g.slice(); n[idx] = correct; return n; });
    setTimeout(() => {
      setExiting(null);
      setFlipped(false);
      setIdx((i) => i + 1);
      lock.current = false;
    }, 300);
  }
  function goPrev() {
    if (lock.current || idx <= 0) return;
    setFlipped(false);
    setIdx((i) => i - 1);
  }
  function goNext() {
    if (lock.current || done) return;
    setFlipped(false);
    setIdx((i) => i + 1);
  }

  // keyboard
  React.useEffect(() => {
    function onKey(e) {
      if (done) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); setFlipped((f) => !f); }
      else if (e.key === "ArrowRight") { e.preventDefault(); grade(true); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); grade(false); }
      else if (e.key === "Escape") exit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (done) {
    const missedCards = cards.filter((_, i) => grades[i] === false);
    return (
      <SessionComplete
        got={got} learning={missed} total={got + missed}
        onRepeat={missedCards.length ? () => {
          setCards(U.shuffle(missedCards)); setGrades([]); setIdx(0); setFlipped(false);
          committed.current = false;
        } : null}
        onDone={exit}
      />
    );
  }

  return (
    <div className="study">
      <div className="study-top" />
      <div className="study-bar">
        <button className="study-x" onClick={exit} aria-label="Close"><Ic.x /></button>
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
        <button className={"gbtn learn" + (grades[idx] === false ? " sel" : "")} onClick={() => grade(false)}>Still learning</button>
        <button className={"gbtn know" + (grades[idx] === true ? " sel" : "")} onClick={() => grade(true)}><Ic.check /> Got it</button>
      </div>
      <div className="nav-row">
        <button className="nav-btn" onClick={goPrev} disabled={idx <= 0}><Ic.back /> Previous</button>
        <button className="nav-btn fwd" onClick={goNext}>{idx + 1 >= cards.length ? "Finish" : "Next"} <Ic.fwd /></button>
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
function QuizSession({ quiz, saved, config, onFinish, onSave, onClear, onExit }) {
  // `correct` is a string for single-answer or a string[] for multiple-response.
  const [qs] = React.useState(() =>
    (saved && saved.qs) || U.shuffle(quiz.questions).map((item) => ({
      q: item.q,
      opts: U.shuffle(item.options),
      correct: item.correct,
      multi: Array.isArray(item.correct),
      explain: item.explain,
      diff: item.diff,
    }))
  );
  const [qi, setQi] = React.useState(saved ? saved.qi : 0);
  // answers[i] holds the decision for qs[i]: { picked: string[], submitted: bool } or null
  const [answers, setAnswers] = React.useState(() => (saved && saved.answers) || []);
  const finished = React.useRef(false);

  const q = qs[qi];
  const done = qi >= qs.length;
  const a = done ? null : answers[qi];
  const picked = a ? a.picked : [];
  const submitted = a ? a.submitted : false;
  const isMulti = q && (q.multi || Array.isArray(q.correct));
  const dm = q && q.diff ? U.diffMeta(q.diff) : null;

  // multiple-response is graded all-or-nothing — the exact set must match
  const isCorrectOpt = (opt) => isMulti ? q.correct.includes(opt) : opt === q.correct;
  function isAnsCorrect(qq, p) {
    if (Array.isArray(qq.correct)) return p.length === qq.correct.length && qq.correct.every((x) => p.includes(x));
    return p[0] === qq.correct;
  }
  const gradePicked = (p) => isAnsCorrect(q, p);

  // score and answered count are derived, so edits and skips stay consistent
  const score = answers.reduce((s, ans, i) => (ans && ans.submitted && isAnsCorrect(qs[i], ans.picked) ? s + 1 : s), 0);
  const answeredCount = answers.filter((x) => x && x.submitted).length;

  // persist a stable starting order on a fresh quiz
  React.useEffect(() => {
    if (!saved) onSave({ qs, qi: 0, answers: [] });
  }, []);

  // commit lifetime accuracy once, when the quiz is completed
  React.useEffect(() => {
    if (done && !finished.current) {
      finished.current = true;
      onFinish({ correct: score, total: answeredCount });
      onClear();
    }
  }, [done]);

  function writeAnswer(entry) {
    const next = answers.slice();
    next[qi] = entry;
    setAnswers(next);
    onSave({ qs, qi, answers: next });
  }
  function choose(opt) {
    if (isMulti) writeAnswer({ picked: picked.includes(opt) ? picked.filter((x) => x !== opt) : [...picked, opt], submitted: false });
    else writeAnswer({ picked: [opt], submitted: true });
  }
  function submitMulti() {
    if (submitted || !picked.length) return;
    writeAnswer({ picked, submitted: true });
  }
  function navTo(pos) {
    setQi(pos);
    if (pos < qs.length) onSave({ qs, qi: pos, answers });
  }
  function goPrev() { if (qi > 0) navTo(qi - 1); }
  function goNext() { navTo(qi + 1); } // skip-ahead allowed; past the last question ends the quiz

  React.useEffect(() => {
    function onKey(e) {
      if (done) return;
      if (e.key === "Escape") return onExit();
      if (e.key === "ArrowLeft") { e.preventDefault(); return goPrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); return goNext(); }
      if (/^[1-9]$/.test(e.key)) { const o = q.opts[+e.key - 1]; if (o) choose(o); }
      else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (isMulti && !submitted && picked.length) submitMulti();
        else goNext();
      }
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

  const wasCorrect = submitted && gradePicked(picked);
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
          <div className="quiz-q-row">
            <div className="quiz-q-k" style={{ color: U.catInk(quiz.hue) }}>{quiz.name}</div>
            {dm && <span className="diff-badge" style={{ background: U.catTint(dm.hue), color: U.catInk(dm.hue) }}>{dm.name}</span>}
          </div>
          <div className="quiz-q">{q.q}</div>
          {isMulti && <div className="quiz-multi-note">Select all that apply</div>}
        </div>
        <div className="quiz-opts">
          {q.opts.map((opt, n) => {
            const sel = picked.includes(opt);
            let cls = "opt";
            if (submitted) {
              if (isCorrectOpt(opt)) cls += " correct";
              else if (sel) cls += " wrong";
              else cls += " dim";
            } else if (sel) cls += " sel";
            const showCheck = (submitted && isCorrectOpt(opt)) || (!submitted && isMulti && sel);
            return (
              <button key={opt} className={cls} onClick={() => choose(opt)}>
                <span className={"opt-k" + (isMulti ? " box" : "")}>{showCheck ? <Ic.check /> : "ABCDE"[n]}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
        {submitted && q.explain && (
          <div className="quiz-explain">
            <span className="quiz-explain-k">{wasCorrect ? "Correct" : "Answer"}</span>
            {q.explain}
          </div>
        )}
      </div>
      {isMulti && !submitted && (
        <button className="quiz-next quiz-submit" onClick={submitMulti} disabled={!picked.length}>
          {picked.length ? `Submit · ${picked.length} selected` : "Select answers"}
        </button>
      )}
      <div className="nav-row">
        <button className="nav-btn" onClick={goPrev} disabled={qi <= 0}><Ic.back /> Previous</button>
        <button className="nav-btn fwd" onClick={goNext}>{qi + 1 >= qs.length ? "See score" : "Next"} <Ic.fwd /></button>
      </div>
      <div className="kbd-hints">
        <span><span className="kbd">1-{q.opts.length}</span> {isMulti ? "toggle" : "choose"}</span>
        {isMulti && !submitted && <span><span className="kbd">enter</span> submit</span>}
        <span><span className="kbd">←</span>/<span className="kbd">→</span> prev/next</span>
      </div>
      <div className="aif-bottom-safe" />
    </div>
  );
}

export { StudySession, SessionComplete, QuizSession };
