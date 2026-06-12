/* PlayerView.jsx — a player's phone: join with PIN + nickname (the lobby QR
   pre-fills the PIN via ?pin=), tap a colour/shape to answer, then full-bleed
   state screens: waiting (brand yellow), locked (band purple), result
   (green/red) and final rank. */

import React, { useEffect, useState } from "react";
import { Ic } from "@framework/components/icons.jsx";
import { Shape, SHAPES, Avatar } from "./shapes.jsx";
import { useGameSocket, useCountdown, useSession } from "./hooks.js";

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

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

  const secs = Math.ceil((remainingMs ?? 0) / 1000);
  const finalTop3 = stage === "podium" && podium?.you && podium.you.rank <= 3;

  // each stage paints the whole screen: light chrome or a flat state colour
  let cls = "", bg = null;
  if (stage === "join" || stage === "question") cls = "lite";
  else if (stage === "lobby") { bg = "var(--brand)"; cls = "tone-dark"; }
  // Locked stays neutral: when the answer triggers the all-answered reveal,
  // this screen lives for one round-trip, and a tile-colour background would
  // just flash before the green/red result.
  else if (stage === "locked") bg = "var(--band)";
  else if (stage === "reveal") bg = reveal?.you?.correct ? "var(--good)" : "var(--bad)";
  else if (stage === "podium") { cls = finalTop3 ? "tone-dark" : "lite"; bg = finalTop3 ? "var(--brand)" : null; }

  return (
    <div className={`play-root player ${cls}`} style={bg ? { background: bg } : null}>
      {stage === "join" && (
        <form className="pstage" onSubmit={join}>
          <span className="brand-mark xl">T</span>
          <div className="join-title display">Trivia</div>
          <input
            className="input pin-input" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Game PIN" inputMode="numeric" autoComplete="off"
          />
          <input
            className="input" value={nickname} onChange={(e) => setNickname(e.target.value)}
            placeholder="Nickname" maxLength={16} autoComplete="off"
          />
          {joinError && <div className="form-error">{joinError}</div>}
          <button className="btn btn-primary big" type="submit" disabled={pin.length !== 6 || !nickname.trim()}>Join game</button>
          <button type="button" className="link-btn" onClick={onExit}><Ic.back /> Back</button>
        </form>
      )}

      {stage === "lobby" && me && (
        <div className="pstage">
          <Avatar name={me.nickname} size={64} />
          <div className="p-name display">{me.nickname}</div>
          <p className="p-sub">You’re in! See your nickname on the big screen? {me.total} questions, easy ones first.</p>
          <div className="dots"><span /><span /><span /></div>
        </div>
      )}

      {stage === "question" && question && (
        <div className="pquiz">
          <div className="pquiz-top">Tap your answer · <span className={secs <= 5 ? "low" : ""}>{secs}s</span></div>
          <div className="pquiz-q">{question.q}</div>
          {remainingMs === 0 ? (
            <p className="wait-note">Time’s up — waiting for results…</p>
          ) : (
            <div className="ptile-grid">
              {question.options.map((opt, i) => (
                <button key={i} className="ptile" style={{ background: SHAPES[i].color }} onClick={() => answer(i)}>
                  <Shape i={i} size={34} />
                  <span className="t-label">{opt}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {stage === "locked" && question && (
        <div className="pstage">
          {choice != null && <Shape i={choice} size={56} />}
          <div className="p-head display">Answer locked in</div>
          <p className="p-sub">
            {choice != null && <>You picked <b>{question.options[choice]}</b>. </>}Hang tight…
          </p>
        </div>
      )}

      {stage === "reveal" && reveal && (
        <div className="pstage">
          <div className="big-mark">
            {reveal.you?.correct ? <Ic.check width={40} height={40} /> : <Ic.x width={38} height={38} />}
          </div>
          <div className="p-head display">
            {reveal.you?.correct ? "Correct!" : reveal.you?.answered ? "Incorrect" : "Too slow!"}
          </div>
          {reveal.you?.correct && <div className="p-points display">+{reveal.you.points.toLocaleString()}</div>}
          {reveal.you?.correct && reveal.you.streak >= 2 && (
            <div className="streak-chip"><Ic.flame /> {reveal.you.streak} answer streak</div>
          )}
          <p className="p-sub">You’re in {ordinal(reveal.you?.rank ?? 0)} place</p>
          <div className="p-dim">{(reveal.you?.score ?? 0).toLocaleString()} points</div>
        </div>
      )}

      {stage === "podium" && podium && (
        <div className="pstage">
          <div className="p-emoji">{podium.you?.rank === 1 ? "🏆" : finalTop3 ? "🎉" : "👏"}</div>
          <div className="eyebrow">You finished</div>
          <div className="rank-big display">{ordinal(podium.you?.rank ?? 0)}</div>
          <Avatar name={me?.nickname} size={48} />
          <div className="p-sub"><b>{me?.nickname}</b></div>
          <div className="p-points sm display">{(podium.you?.score ?? 0).toLocaleString()} points</div>
          <button className="btn btn-primary big" onClick={() => { leave(); onExit(); }}>Done</button>
        </div>
      )}
    </div>
  );
}
