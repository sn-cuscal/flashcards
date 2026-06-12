/* HostView.jsx — the shared screen: game setup, lobby PIN + join QR, question
   pacing (auto-reveals when the countdown ends), per-question results, a
   standings interstitial and the podium. Renders as a light "screen" card on
   the purple stage with the pacing controls beneath it. */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Ring } from "@framework/components/Ring.jsx";
import { Ic } from "@framework/components/icons.jsx";
import { drawQuestions, eligibleQuestions, eligibleExpert, expertCount } from "@shared/draw.mjs";
import { TIER_ORDER } from "@shared/scoring.mjs";
import { Shape, SHAPES, Avatar } from "./shapes.jsx";
import { useGameSocket, useCountdown, useSession } from "./hooks.js";

const COUNTS = [10, 15, 20];

const fmtPin = (pin) => String(pin).replace(/^(\d{3})/, "$1 ");

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
  const expertPool = useMemo(() => eligibleExpert(bank.expert), [bank]);

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
    () => sendReveal(),
  );

  function sendReveal() {
    if (!revealSentRef.current && game) {
      revealSentRef.current = true;
      send({ action: "reveal", pin: game.pin, hostToken: game.hostToken });
    }
  }

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
    const questions = drawQuestions(bank.quiz, { count, categoryIds: catIds, expert: bank.expert });
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
  const finalsCount = Math.min(expertCount(count), expertPool.length);
  const playable = Math.min(count - finalsCount, pool.length) + finalsCount;
  const secs = Math.ceil((remainingMs ?? 0) / 1000);
  const low = stage === "question" && secs <= 5;
  const isLast = reveal && reveal.index + 1 === reveal.total;

  const headTitle =
    stage === "setup" ? "Host a game"
    : stage === "lobby" ? bank.name
    : stage === "standings" ? "Standings"
    : stage === "podium" ? "Final results"
    : question ? `Question ${question.index + 1} of ${question.total}`
    : reveal ? `Question ${reveal.index + 1} of ${reveal.total}` : "";

  const answeredTotal = reveal ? reveal.distribution.reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="play-root host">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">T</span>
          <span className="brand-name">Trivia</span>
        </div>
        <div className="topbar-sub">{bank.name} · shared screen</div>
      </div>

      <div className="stage-mid">
        <div className="screen">
          <div className="screen-head">
            <div className="qmeta">
              <span className="brand-mark">T</span>
              <span className="head-title display">{headTitle}</span>
            </div>
            {stage === "lobby" && game && <span className="pill">PIN {fmtPin(game.pin)}</span>}
            {(stage === "question" || stage === "reveal") && question && (
              <span className="pill">{question.diff} · {question.basePoints} pts</span>
            )}
          </div>

          {stage === "setup" && (
            <div className="screen-body setup-body">
              {banks.length > 1 ? (
                <div className="field">
                  <span className="k-label">Question bank</span>
                  <div className="chip-row">
                    {banks.map((b) => (
                      <button key={b.id} className={`chip ${b.id === bankId ? "sel" : ""}`} onClick={() => setBankId(b.id)}>{b.name}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bank-name">{bank.name}</div>
              )}
              <div className="field">
                <span className="k-label">Questions</span>
                <div className="chip-row">
                  {COUNTS.map((n) => (
                    <button key={n} className={`chip ${n === count ? "sel" : ""}`} onClick={() => setCount(n)}>{n}</button>
                  ))}
                </div>
              </div>
              <div className="field">
                <span className="k-label">Categories</span>
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
                {finalsCount > 0 && ` The last ${finalsCount} are expert questions.`}
              </div>
            </div>
          )}

          {stage === "lobby" && game && (
            <div className="screen-body lobby-split">
              <div className="join-panel">
                <div>
                  <div className="k-label">Join at</div>
                  <div className="join-url display">{location.host}{location.pathname}</div>
                </div>
                <div>
                  <div className="k-label">Game PIN</div>
                  <div className="join-pin display">{fmtPin(game.pin)}</div>
                </div>
                <div className="qr-row">
                  <QRCodeSVG
                    className="qr" size={104} marginSize={0} fgColor="#1a1130"
                    value={`${location.origin}${location.pathname}?pin=${game.pin}`}
                  />
                  <div className="qr-note">Scan to join<br />on your phone</div>
                </div>
              </div>
              <div className="roster-panel">
                <div className="roster-head">
                  <div className="roster-title display">Players</div>
                  <div className="roster-count"><span className="dot" />{players.length}</div>
                </div>
                <div className="roster-grid">
                  {players.length === 0 && <div className="roster-empty">Waiting for players to join…</div>}
                  {players.map((p) => (
                    <div key={p.nickname} className={`roster-chip ${p.connected ? "" : "off"}`}>
                      <Avatar name={p.nickname} size={26} />
                      <span className="nick">{p.nickname}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stage === "question" && question && (
            <div className="screen-body qbody">
              <div className="qtext-wrap"><h2 className="qtext display">{question.q}</h2></div>
              <div className="qmid">
                <Ring
                  value={(remainingMs ?? 0) / (question.timeLimitSeconds * 1000)}
                  size={92} stroke={7} track="var(--card-line)"
                  color={low ? "var(--a-red)" : "var(--brand)"}
                  label={<b className={`ring-secs display ${low ? "low" : ""}`}>{secs}</b>}
                />
                <div className="qmid-c">
                  <div className="answered-big display">{answered}</div>
                  <div className="answered-sub">of {players.length} answered</div>
                </div>
                <div className="qmid-side" />
              </div>
              <div className="tile-grid">
                {question.options.map((opt, i) => (
                  <div key={i} className="tile" style={{ background: SHAPES[i].color }}>
                    <Shape i={i} size={26} />
                    <span className="t-label">{opt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stage === "reveal" && reveal && (
            <div className="screen-body qbody">
              {question && <div className="qtext-wrap"><h2 className="qtext display">{question.q}</h2></div>}
              <div className="qmid">
                <Ring value={0} size={92} stroke={7} track="var(--card-line)" color="var(--brand)"
                  label={<b className="ring-secs display low">0</b>} />
                <div className="qmid-c">
                  <div className="k-label">Correct answer</div>
                  <div className="correct-answer display">
                    {question?.options?.[reveal.correctIndex] ?? <Shape i={reveal.correctIndex} size={22} />}
                  </div>
                </div>
                <div className="qmid-side" />
              </div>
              <div className="tile-grid">
                {reveal.distribution.map((n, i) => {
                  const correct = i === reveal.correctIndex;
                  return (
                    <div key={i} className={`tile ${correct ? "hit" : "dim"}`} style={{ background: SHAPES[i].color }}>
                      <Shape i={i} size={26} />
                      <span className="t-label">{question?.options?.[i] ?? ""}</span>
                      <span className="t-count">{n}{correct ? <Ic.check /> : <Ic.x width={16} height={16} />}</span>
                      <span className="t-bar" style={{ width: `${answeredTotal ? Math.round((n / answeredTotal) * 100) : 0}%` }} />
                    </div>
                  );
                })}
              </div>
              {reveal.noAnswer > 0 && <div className="no-answer">{reveal.noAnswer} didn’t answer</div>}
              {reveal.explain && <p className="explain"><Ic.bulb /> {reveal.explain}</p>}
            </div>
          )}

          {stage === "standings" && reveal && (
            <div className="screen-body lb-body">
              <div className="lb">
                {reveal.leaderboard.map((p, i) => (
                  <div key={p.nickname} className="lb-row" style={{ animationDelay: `${i * 60}ms` }}>
                    <span className="lb-rank display">{p.rank}</span>
                    <Avatar name={p.nickname} size={34} />
                    <span className="lb-name">{p.nickname}</span>
                    <span className="lb-score display">{p.score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stage === "podium" && podium && (
            <div className="screen-body podium-body">
              <div className="win-line display">🏆 {podium.top3[0]?.nickname} wins!</div>
              {podium.standings && podium.standings.length > 3 && (
                <div className="lb mini">
                  {podium.standings.slice(3).map((p) => (
                    <div key={p.nickname} className="lb-row">
                      <span className="lb-rank display">{p.rank}</span>
                      <span className="lb-name">{p.nickname}</span>
                      <span className="lb-score display">{p.score.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="podium-row">
                {[1, 0, 2].map((slot, i) => {
                  const p = podium.top3[slot];
                  if (!p) return null;
                  return (
                    <div key={slot} className={`podium-col ${["silver", "gold", "bronze"][i]}`} style={{ animationDelay: `${i * 140}ms` }}>
                      <Avatar name={p.nickname} size={46} />
                      <div className="podium-name">{p.nickname}</div>
                      <div className="podium-pts display">{p.score.toLocaleString()}</div>
                      <div className="podium-block"><span className="podium-place display">{slot + 1}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="controls">
          {stage === "setup" && (
            <>
              <button className="btn" onClick={onExit}><Ic.back /> Back</button>
              <button className="btn btn-primary" disabled={pool.length === 0} onClick={createGame}>
                Open lobby{playable < count ? ` (${playable} questions)` : ""} ▸
              </button>
            </>
          )}
          {stage === "lobby" && game && (
            <>
              <span className="ctrl-hint">{players.length} player{players.length === 1 ? "" : "s"} in the lobby</span>
              <button className="btn btn-primary" disabled={players.length === 0}
                onClick={() => send({ action: "start", pin: game.pin, hostToken: game.hostToken })}>
                Start game ▸
              </button>
              <button className="btn" onClick={endGame}>Cancel</button>
            </>
          )}
          {stage === "question" && (
            <>
              <span className="ctrl-hint">Players are answering…</span>
              <button className="btn" onClick={sendReveal}>Skip to results ▸</button>
              <button className="btn" onClick={endGame}>End game</button>
            </>
          )}
          {stage === "reveal" && (
            <>
              <button className="btn btn-primary" onClick={() => setStage("standings")}>Show leaderboard ▸</button>
              <button className="btn" onClick={endGame}>End game</button>
            </>
          )}
          {stage === "standings" && game && (
            <>
              <button className="btn btn-primary" onClick={() => send({ action: "next", pin: game.pin, hostToken: game.hostToken })}>
                {isLast ? "Final results ▸" : "Next question ▸"}
              </button>
              <button className="btn" onClick={endGame}>End game</button>
            </>
          )}
          {stage === "podium" && (
            <button className="btn btn-primary" onClick={() => { reset(); close(); }}>↺ New game</button>
          )}
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
