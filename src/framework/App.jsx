/* app.jsx — root state, persistence, routing (mounts inside the iOS frame) */

import React from 'react'
import { U } from './lib/u.js'
import { Ic } from './components/icons.jsx'
import { HomeScreen, StatsScreen, StyleScreen, BottomNav } from './components/Home.jsx'
import { StudySession, QuizSession } from './components/Study.jsx'

const DEFAULT = {
  progress: {}, streak: 0, lastDate: null, session: 1,
  reviews: 0, quiz: { correct: 0, total: 0 }, quizProgress: {},
  styleId: "minimal", shuffleOn: true,
};

function load(STORE_KEY) {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch (e) {}
  return { ...DEFAULT };
}

export function App({ config, data, quiz }) {
  const { categories, cards } = data;
  const catMap = React.useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), []);
  const quizCats = quiz.categories;

  const [S, setS] = React.useState(() => load(config.storeKey));
  const [tab, setTab] = React.useState("home");
  const [session, setSession] = React.useState(null); // {type, queue|pool, title}

  React.useEffect(() => {
    try { localStorage.setItem(config.storeKey, JSON.stringify(S)); } catch (e) {}
  }, [S]);

  // ---- streak helper ----
  function withStreak(st) {
    const today = U.todayStr();
    if (st.lastDate === today) return st;
    const cont = st.lastDate && U.daysBetween(st.lastDate, today) === 1;
    return { ...st, streak: cont ? st.streak + 1 : 1, lastDate: today };
  }

  // ---- grading (study + quiz share SR update) ----
  function gradeCard(cardId, correct) {
    setS((st) => {
      let next = withStreak(st);
      const rec = U.gradeRec(next.progress[cardId], correct, next.session);
      return { ...next, progress: { ...next.progress, [cardId]: rec }, reviews: next.reviews + 1 };
    });
  }
  function quizAnswer(correct) {
    setS((st) => {
      const next = withStreak(st);
      return {
        ...next,
        quiz: { correct: next.quiz.correct + (correct ? 1 : 0), total: next.quiz.total + 1 },
      };
    });
  }

  // ---- quiz resume persistence ----
  function saveQuiz(catId, data) {
    setS((st) => ({ ...st, quizProgress: { ...st.quizProgress, [catId]: data } }));
  }
  function clearQuiz(catId) {
    setS((st) => {
      const qp = { ...st.quizProgress };
      delete qp[catId];
      return { ...st, quizProgress: qp };
    });
  }

  // ---- due count for the home CTA ----
  const dueCount = React.useMemo(() => cards.filter((c) => {
    const r = S.progress[c.id];
    if (!r || r.status !== "known") return true;
    return r.due <= S.session;
  }).length, [S.progress, S.session]);

  // ---- session launchers ----
  function bumpSession() { setS((st) => ({ ...st, session: st.session + 1 })); }

  function startReview() {
    let q = U.reviewQueue(cards, S.progress, S.session, 20);
    if (!q.length) q = U.shuffle(cards).slice(0, 20);
    bumpSession();
    setSession({ type: "study", queue: q, title: "Smart Review" });
  }
  function startCategory(catId) {
    let q = cards.filter((c) => c.cat === catId);
    if (S.shuffleOn) q = U.shuffle(q);
    bumpSession();
    setSession({ type: "study", queue: q, title: catMap[catId].name });
  }
  function startShuffleAll() {
    bumpSession();
    setSession({ type: "study", queue: U.shuffle(cards), title: "All cards" });
  }
  function startQuiz(quizCat) {
    setSession({ type: "quiz", quiz: quizCat, saved: S.quizProgress[quizCat.id] || null });
  }

  function resetProgress() {
    if (window.confirm("Reset all progress, streak and stats? This can\u2019t be undone.")) {
      setS({ ...DEFAULT, styleId: S.styleId, shuffleOn: S.shuffleOn });
    }
  }

  // ---- render session overlay ----
  if (session) {
    if (session.type === "study")
      return <StudySession
        queue={session.queue} catMap={catMap} styleId={S.styleId} title={session.title}
        onGrade={gradeCard} onExit={() => setSession(null)} />;
    return <QuizSession
      quiz={session.quiz} saved={session.saved} config={config}
      onAnswer={quizAnswer}
      onSave={(qd) => saveQuiz(session.quiz.id, qd)}
      onClear={() => clearQuiz(session.quiz.id)}
      onExit={() => setSession(null)} />;
  }

  return (
    <div className="aif-root">
      <div className="aif-top" />
      {/* keyed so each tab remounts and replays its enter transition */}
      <div className="tab-view" key={tab}>
        {tab === "home" && (
          <HomeScreen
            cats={categories} cards={cards} progress={S.progress} streak={S.streak}
            dueCount={dueCount} config={config}
            onReview={startReview} onCategory={startCategory} onShuffle={startShuffleAll} />
        )}
        {tab === "quiz" && <QuizPicker cats={quizCats} onPick={startQuiz} stats={S.quiz} progress={S.quizProgress} onReset={clearQuiz} />}
        {tab === "stats" && (
          <StatsScreen
            cats={categories} cards={cards} progress={S.progress} streak={S.streak}
            quiz={S.quiz} reviews={S.reviews} onReset={resetProgress} />
        )}
        {tab === "style" && (
          <StyleScreen
            styleId={S.styleId} onStyle={(id) => setS((st) => ({ ...st, styleId: id }))}
            shuffleOn={S.shuffleOn} onShuffleToggle={() => setS((st) => ({ ...st, shuffleOn: !st.shuffleOn }))}
            config={config} />
        )}
      </div>
      <BottomNav tab={tab} onTab={setTab} />
    </div>
  );
}

// quiz landing tab — pick a category
function QuizPicker({ cats, onPick, stats, progress, onReset }) {
  const answered = stats && stats.total > 0;
  const acc = answered ? Math.round((stats.correct / stats.total) * 100) : null;
  const total = cats.reduce((n, c) => n + c.questions.length, 0);
  return (
    <div className="aif-scroll">
      <div className="hd">
        <div className="hd-row">
          <div>
            <div className="hd-eyebrow">Multiple choice</div>
            <h1 className="hd-title" style={{ fontSize: 28 }}>Quiz</h1>
          </div>
          {answered && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--mono)", fontWeight: 700, fontSize: 26, letterSpacing: "-0.03em", color: acc >= 70 ? "var(--good)" : "var(--ink)" }}>{acc}%</div>
              <div className="band-k">accuracy</div>
            </div>
          )}
        </div>
      </div>
      <div className="sec-label" style={{ paddingTop: 6 }}>
        <span>Pick a category · {total} questions</span>
      </div>
      <div className="decks">
        {cats.map((cat) => {
          const p = progress[cat.id];
          const resuming = p && p.qi > 0 && p.qi < p.qs.length;
          return (
            <div key={cat.id} className="deck" role="button" tabIndex={0} onClick={() => onPick(cat)}>
              <div className="deck-dot" style={{ background: U.catTint(cat.hue), color: U.catInk(cat.hue) }}>{cat.questions.length}</div>
              <div className="deck-meta">
                <h4>{cat.name}</h4>
                {resuming
                  ? <p style={{ color: U.catInk(cat.hue), fontWeight: 600 }}>Resume · {p.qi}/{p.qs.length} answered</p>
                  : <p>{cat.blurb}</p>}
                {resuming && (
                  <div className="deck-bar" style={{ marginTop: 8 }}>
                    <i style={{ width: `${(p.qi / p.qs.length) * 100}%`, background: U.catSolid(cat.hue) }} />
                  </div>
                )}
              </div>
              {resuming ? (
                <button
                  className="quiz-reset"
                  title="Reset this quiz"
                  onClick={(e) => { e.stopPropagation(); onReset(cat.id); }}
                ><Ic.redo /></button>
              ) : (
                <div className="deck-pct" style={{ width: "auto", color: U.catInk(cat.hue) }}><Ic.arrowR /></div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ height: 14 }} />
    </div>
  );
}
