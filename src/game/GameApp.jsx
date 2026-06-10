/* GameApp.jsx — entry for the live multiplayer quiz: pick a role, then the
   Host or Player view owns its socket and screen flow. A saved session in
   sessionStorage routes straight back into the running game on refresh. */

import React, { useState } from "react";
import { HostView } from "./HostView.jsx";
import { PlayerView } from "./PlayerView.jsx";

function savedRole() {
  try {
    if (sessionStorage.getItem("play.host")) return "host";
    if (sessionStorage.getItem("play.player")) return "play";
  } catch { /* no sessionStorage */ }
  return null;
}

export function GameApp({ config, banks }) {
  const [mode, setMode] = useState(savedRole);

  if (mode === "host") return <HostView config={config} banks={banks} onExit={() => setMode(null)} />;
  if (mode === "play") return <PlayerView config={config} onExit={() => setMode(null)} />;

  return (
    <div className="play-root">
      <div className="home">
        <div className="home-eyebrow">Live Quiz</div>
        <h1 className="home-title">Play together</h1>
        <p className="home-sub">One screen hosts, everyone joins with a PIN on their own device. Questions start easy and get harder — answer fast for more points.</p>
        <button className="big-btn" onClick={() => setMode("play")}>Join with a PIN</button>
        <button className="big-btn ghost" onClick={() => setMode("host")}>Host a game</button>
      </div>
    </div>
  );
}
