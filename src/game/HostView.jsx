/* HostView.jsx — the shared screen: game setup, lobby PIN, question pacing
   (auto-reveals when the countdown ends), per-question results and podium. */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Ring } from "@framework/components/Ring.jsx";
import { Ic } from "@framework/components/icons.jsx";
import { drawQuestions, eligibleQuestions } from "@shared/draw.mjs";
import { TIER_ORDER } from "@shared/scoring.mjs";
import { Shape, SHAPES } from "./shapes.jsx";
import { useGameSocket, useCountdown, useSession } from "./hooks.js";

const COUNTS = [10, 15, 20];

export function HostView({ config, banks, onExit }) {
  const session = useSession("play.host");
  const [stage, setStage] = useState("setup");
  const [bankId, setBankId] = useState(banks[0].id);
  const [count, setCount] = useState(15);
  const [catIds, setCatIds] = useState(null); // null = every category
  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState([]);
  const [question, setQuestion] = useState(null);
  const [answered, setAnswered] = useState(0);
  const [reveal, setReveal] = useState(null);
  const [podium, setPodium] = useState(null);
  const [toast, setToast] = useState(null);
  const revealSentRef = useRef(false);

  const bank = banks.find((b) => b.id === bankId);
  const pool = useMemo(() => eligibleQuestions(bank.quiz, catIds), [bank, catIds]);

  const { send, close } = useGameSocket(config.wsUrl, {
    makeRejoin: () => {
      const s = session.get();
      return s ? { action: "rejoinHost", pin: s.pin, hostToken: s.hostToken } : null;
    },
    onMessage: (msg) => {
      if (msg.type === "created") {
        setGame(msg);
        session.set({ pin: msg.pin, hostToken: msg.hostToken });
        setStage("lobby");
      } else if (msg.type === "lobby") {
        setPlayers(msg.players);
      } else if (msg.type === "question") {
        revealSentRef.current = false;
        setQuestion(msg);
        setAnswered(0);
        setStage("question");
      } else if (msg.type === "answerCount") {
        setAnswered(msg.answered);
      } else if (msg.type === "reveal") {
        setReveal(msg);
        setStage("reveal");
      } else if (msg.type === "podium") {
        setPodium(msg);
        setStage("podium");
      } else if (msg.type === "ended") {
        reset();
      } else if (msg.type === "error") {
        if (msg.code === "GAME_NOT_FOUND") reset();
        else setToast(msg.message);
      }
    },
  });

  // refreshed host tab -> resume the running game
  useEffect(() => {
    const s = session.get();
    if (s) send({ action: "rejoinHost", pin: s.pin, hostToken: s.hostToken });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const remainingMs = useCountdown(
    stage === "question" && game ? `${game.pin}-${question.index}` : null,
    question?.timeLimitSeconds ?? 0,
    question?.elapsedMs ?? 0,
    () => {
      if (!revealSentRef.current && game) {
        revealSentRef.current = true;
        send({ action: "reveal", pin: game.pin, hostToken: game.hostToken });
      }
    },
  );

  function reset() {
    session.set(null);
    setGame(null);
    setPlayers([]);
    setQuestion(null);
    setReveal(null);
    setPodium(null);
    setStage("setup");
  }

  function createGame() {
    const questions = drawQuestions(bank.quiz, { count, categoryIds: catIds });
    send({ action: "create", questions, settings: { bankId } });
  }

  function endGame() {
    if (game) send({ action: "end", pin: game.pin, hostToken: game.hostToken });
    reset();
  }

  function toggleCat(id) {
    const all = bank.quiz.categories.map((c) => c.id);
    const next = new Set(catIds ?? all);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCatIds(next.size === all.length ? null : [...next]);
  }

  const poolByTier = TIER_ORDER.map((t) => `${pool.filter((q) => q.diff === t).length} ${t}`).join(" · ");

  return (
    <div className="play-root host">
      {stage === "setup" && (
        <div className="panel setup">
          <button className="link-btn" onClick={onExit}><Ic.back /> Back</button>
          <h1>Host a game</h1>
          {banks.length > 1 && (
            <div className="field">
              <label>Question bank</label>
              <div className="chip-row">
                {banks.map((b) => (
                  <button key={b.id} className={`chip ${b.id === bankId ? "sel" : ""}`} onClick={() => setBankId(b.id)}>{b.name}</button>
                ))}
              </div>
            </div>
          )}
          {banks.length === 1 && <div className="bank-name">{bank.name}</div>}
          <div className="field">
            <label>Questions</label>
            <div className="chip-row">
              {COUNTS.map((n) => (
                <button key={n} className={`chip ${n === count ? "sel" : ""}`} onClick={() => setCount(n)}>{n}</button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Categories</label>
            <div className="chip-row">
              {bank.quiz.categories.map((c) => {
                const on = !catIds || catIds.includes(c.id);
                return (
                  <button key={c.id} className={`chip ${on ? "sel" : ""}`} onClick={() => toggleCat(c.id)}>{c.name}</button>
                );
              })}
            </div>
          </div>
          <div className="pool-note">
            {pool.length} questions available ({poolByTier}). Games run easy first, then harder — later questions are worth more.
          </div>
          <button className="big-btn" disabled={pool.length === 0} onClick={createGame}>
            Open lobby{count > pool.length ? ` (${pool.length} questions)` : ""}
          </button>
        </div>
      )}

      {stage === "lobby" && game && (
        <div className="panel lobby">
          <div className="lobby-join">Join at <strong>{location.host}{location.pathname}</strong> with PIN</div>
          <div className="pin">{String(game.pin).replace(/^(\d{3})/, "$1 ")}</div>
          <div className="roster">
            {players.length === 0 && <span className="roster-empty">Waiting for players…</span>}
            {players.map((p) => (
              <span key={p.nickname} className={`player-chip ${p.connected ? "" : "off"}`}>{p.nickname}</span>
            ))}
          </div>
          <button className="big-btn" disabled={players.length === 0} onClick={() => send({ action: "start", pin: game.pin, hostToken: game.hostToken })}>
            Start · {players.length} player{players.length === 1 ? "" : "s"}
          </button>
          <button className="link-btn" onClick={endGame}>Cancel game</button>
        </div>
      )}

      {stage === "question" && question && (
        <div className="panel quiz">
          <div className="q-top">
            <span className="q-step">{question.index + 1} / {question.total}</span>
            <span className={`diff-chip diff-${question.diff}`}>{question.diff} · {question.basePoints} pts</span>
            <Ring
              value={(remainingMs ?? 0) / (question.timeLimitSeconds * 1000)}
              size={54}
              stroke={6}
              label={<b className="ring-secs">{Math.ceil((remainingMs ?? 0) / 1000)}</b>}
            />
          </div>
          <h2 className="q-text">{question.q}</h2>
          <div className="opt-grid">
            {question.options.map((opt, i) => (
              <div key={i} className="opt" style={{ background: SHAPES[i].color }}>
                <Shape i={i} /><span>{opt}</span>
              </div>
            ))}
          </div>
          <div className="q-answered">{answered} of {players.length} answered</div>
        </div>
      )}

      {stage === "reveal" && reveal && (
        <div className="panel quiz">
          <div className="q-top">
            <span className="q-step">{reveal.index + 1} / {reveal.total}</span>
            <span className="q-step">results</span>
          </div>
          <div className="opt-list">
            {reveal.distribution.map((n, i) => {
              const max = Math.max(1, ...reveal.distribution);
              const correct = i === reveal.correctIndex;
              return (
                <div key={i} className={`bar-row ${correct ? "correct" : ""}`}>
                  <span className="bar-shape" style={{ background: SHAPES[i].color }}><Shape i={i} size={14} /></span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(n / max) * 100}%`, background: SHAPES[i].color }} />
                  </div>
                  <span className="bar-n">{n}{correct && <Ic.check />}</span>
                </div>
              );
            })}
            {reveal.noAnswer > 0 && <div className="no-answer">{reveal.noAnswer} didn’t answer</div>}
          </div>
          {reveal.explain && <p className="explain"><Ic.bulb /> {reveal.explain}</p>}
          <div className="lb">
            {reveal.leaderboard.map((p) => (
              <div key={p.nickname} className="lb-row">
                <span className="lb-rank">{p.rank}</span>
                <span className="lb-name">{p.nickname}</span>
                <span className="lb-score">{p.score}</span>
              </div>
            ))}
          </div>
          <button className="big-btn" onClick={() => send({ action: "next", pin: game.pin, hostToken: game.hostToken })}>
            {reveal.index + 1 === reveal.total ? "Show podium" : "Next question"}
          </button>
        </div>
      )}

      {stage === "podium" && podium && (
        <div className="panel podium">
          <h1>Final results</h1>
          <div className="podium-row">
            {[1, 0, 2].map((slot) =>
              podium.top3[slot] ? (
                <div key={slot} className={`podium-spot p${slot + 1}`}>
                  <div className="podium-name">{podium.top3[slot].nickname}</div>
                  <div className="podium-block">
                    <div className="podium-place">{slot + 1}</div>
                    <div className="podium-score">{podium.top3[slot].score}</div>
                  </div>
                </div>
              ) : null,
            )}
          </div>
          {podium.standings && podium.standings.length > 3 && (
            <div className="lb">
              {podium.standings.slice(3).map((p) => (
                <div key={p.nickname} className="lb-row">
                  <span className="lb-rank">{p.rank}</span>
                  <span className="lb-name">{p.nickname}</span>
                  <span className="lb-score">{p.score}</span>
                </div>
              ))}
            </div>
          )}
          <button className="big-btn" onClick={() => { reset(); close(); }}>New game</button>
        </div>
      )}

      {(stage === "question" || stage === "reveal") && (
        <button className="link-btn end-corner" onClick={endGame}>End game</button>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
