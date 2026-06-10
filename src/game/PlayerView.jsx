/* PlayerView.jsx — a player's phone: join with PIN + nickname, tap a
   colour/shape to answer, then per-question results and final rank. */

import React, { useEffect, useState } from "react";
import { Ring } from "@framework/components/Ring.jsx";
import { Ic } from "@framework/components/icons.jsx";
import { Shape, SHAPES } from "./shapes.jsx";
import { useGameSocket, useCountdown, useSession } from "./hooks.js";

export function PlayerView({ config, onExit }) {
  const session = useSession("play.player");
  const [stage, setStage] = useState("join");
  const [pin, setPin] = useState(new URLSearchParams(location.search).get("pin") || "");
  const [nickname, setNickname] = useState("");
  const [joinError, setJoinError] = useState(null);
  const [me, setMe] = useState(null);
  const [question, setQuestion] = useState(null);
  const [choice, setChoice] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [podium, setPodium] = useState(null);

  const { send } = useGameSocket(config.wsUrl, {
    makeRejoin: () => {
      const s = session.get();
      return s ? { action: "join", pin: s.pin, playerId: s.playerId, nickname: s.nickname } : null;
    },
    onMessage: (msg) => {
      if (msg.type === "joined") {
        session.set({ pin: msg.pin, playerId: msg.playerId, nickname: msg.nickname });
        setMe(msg);
        setStage("lobby");
      } else if (msg.type === "question") {
        setQuestion(msg);
        setChoice(null);
        setStage(msg.answered ? "locked" : "question");
      } else if (msg.type === "answerAck") {
        setStage("locked");
      } else if (msg.type === "reveal") {
        setReveal(msg);
        setStage("reveal");
      } else if (msg.type === "podium") {
        setPodium(msg);
        setStage("podium");
      } else if (msg.type === "ended") {
        leave();
      } else if (msg.type === "error") {
        if (msg.code === "TOO_LATE" || msg.code === "ALREADY_ANSWERED") setStage("locked");
        else if (msg.code === "GAME_NOT_FOUND" && session.get()) leave();
        else {
          setJoinError(msg.message);
          if (msg.action === "join") setStage("join");
        }
      }
    },
  });

  // refreshed mid-game -> resume with the stored playerId (score intact)
  useEffect(() => {
    const s = session.get();
    if (s) send({ action: "join", pin: s.pin, playerId: s.playerId, nickname: s.nickname });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const remainingMs = useCountdown(
    (stage === "question" || stage === "locked") && question ? `${me?.pin}-${question.index}` : null,
    question?.timeLimitSeconds ?? 0,
    question?.elapsedMs ?? 0,
    null,
  );

  function leave() {
    session.set(null);
    setMe(null);
    setQuestion(null);
    setReveal(null);
    setPodium(null);
    setStage("join");
  }

  function join(e) {
    e.preventDefault();
    setJoinError(null);
    send({ action: "join", pin: pin.trim(), nickname });
  }

  function answer(i) {
    setChoice(i);
    setStage("locked");
    send({ action: "answer", pin: me.pin, playerId: me.playerId, questionIndex: question.index, choiceIndex: i });
  }

  const ring = question && (
    <Ring
      value={(remainingMs ?? 0) / (question.timeLimitSeconds * 1000)}
      size={46}
      stroke={5}
      label={<b className="ring-secs">{Math.ceil((remainingMs ?? 0) / 1000)}</b>}
    />
  );

  return (
    <div className="play-root player">
      {stage === "join" && (
        <form className="panel join" onSubmit={join}>
          <button type="button" className="link-btn" onClick={onExit}><Ic.back /> Back</button>
          <h1>Join a game</h1>
          <input
            className="input pin-input" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Game PIN" inputMode="numeric" autoComplete="off"
          />
          <input
            className="input" value={nickname} onChange={(e) => setNickname(e.target.value)}
            placeholder="Nickname" maxLength={16} autoComplete="off"
          />
          {joinError && <div className="form-error">{joinError}</div>}
          <button className="big-btn" type="submit" disabled={pin.length !== 6 || !nickname.trim()}>Join</button>
        </form>
      )}

      {stage === "lobby" && me && (
        <div className="panel wait">
          <div className="wait-emoji"><Ic.bolt /></div>
          <h2>You’re in, {me.nickname}</h2>
          <p>Watch the host screen — the game starts soon. {me.total} questions, easy ones first.</p>
        </div>
      )}

      {stage === "question" && question && (
        <div className="panel quiz">
          <div className="q-top">
            <span className="q-step">{question.index + 1} / {question.total}</span>
            <span className={`diff-chip diff-${question.diff}`}>{question.diff}</span>
            {ring}
          </div>
          <h2 className="q-text small">{question.q}</h2>
          {remainingMs === 0 ? (
            <p className="wait-note">Time’s up — waiting for results…</p>
          ) : (
            <div className="opt-grid tap">
              {question.options.map((opt, i) => (
                <button key={i} className="opt" style={{ background: SHAPES[i].color }} onClick={() => answer(i)}>
                  <Shape i={i} /><span>{opt}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {stage === "locked" && question && (
        <div className="panel wait">
          {choice != null && (
            <div className="locked-shape" style={{ background: SHAPES[choice].color }}><Shape i={choice} size={34} /></div>
          )}
          <h2>Locked in</h2>
          <p>Waiting for everyone else…</p>
          {ring}
        </div>
      )}

      {stage === "reveal" && reveal && (
        <div className={`panel result ${reveal.you?.correct ? "good" : "bad"}`}>
          <div className="result-banner">
            {reveal.you?.correct ? <><Ic.check /> Correct</> : reveal.you?.answered ? <><Ic.x /> Wrong</> : <>No answer</>}
          </div>
          {reveal.you?.correct && (
            <div className="result-points">
              +{reveal.you.points}
              {reveal.you.bonus > 0 && <span className="result-bonus"><Ic.flame /> streak +{reveal.you.bonus}</span>}
            </div>
          )}
          <div className="result-stats">
            <span>#{reveal.you?.rank}</span>
            <span>{reveal.you?.score} pts</span>
            {reveal.you?.streak > 1 && <span><Ic.flame /> {reveal.you.streak}</span>}
          </div>
          {reveal.explain && <p className="explain">{reveal.explain}</p>}
        </div>
      )}

      {stage === "podium" && podium && (
        <div className="panel result good">
          <div className="result-banner">Final: #{podium.you?.rank}</div>
          <div className="result-points">{podium.you?.score} pts</div>
          <div className="lb">
            {podium.top3.map((p) => (
              <div key={p.nickname} className="lb-row">
                <span className="lb-rank">{p.rank}</span>
                <span className="lb-name">{p.nickname}</span>
                <span className="lb-score">{p.score}</span>
              </div>
            ))}
          </div>
          <button className="big-btn" onClick={() => { leave(); onExit(); }}>Done</button>
        </div>
      )}
    </div>
  );
}
