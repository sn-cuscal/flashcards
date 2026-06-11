/* GameApp.jsx — entry for the live multiplayer quiz: pick a role, then the
   Host or Player view owns its socket and screen flow. A saved session in
   sessionStorage routes straight back into the running game on refresh, and a
   ?pin= link (the lobby QR code) lands straight on the player join form. */

import React, { useState } from "react";
import { HostView } from "./HostView.jsx";
import { PlayerView } from "./PlayerView.jsx";

function initialMode() {
  try {
    if (sessionStorage.getItem("play.host")) return "host";
    if (sessionStorage.getItem("play.player")) return "play";
  } catch { /* no sessionStorage */ }
  if (new URLSearchParams(location.search).get("pin")) return "play";
  return null;
}

export function GameApp({ config, banks }) {
  const [mode, setMode] = useState(initialMode);

  if (mode === "host") return <HostView config={config} banks={banks} onExit={() => setMode(null)} />;
  if (mode === "play") return <PlayerView config={config} onExit={() => setMode(null)} />;

  return (
    <div className="play-root">
      <div className="home">
        <span className="brand-mark xl">T</span>
        <h1 className="home-title display">Trivia</h1>
        <p className="home-sub">One screen hosts, everyone joins with a PIN on their own device. Questions start easy and get harder — answer fast for more points.</p>
        <button className="btn btn-primary big" onClick={() => setMode("play")}>Join with a PIN</button>
        <button className="btn big" onClick={() => setMode("host")}>Host a game</button>
      </div>
    </div>
  );
}
