/* shapes.jsx — the four fixed colour/shape answer identities (Kahoot-style):
   option slots always map red triangle / blue diamond / yellow circle /
   green square, so players can answer on shape recognition alone. Also the
   nickname Avatar (hue keyed off the first letter) shared by the host roster,
   standings and player screens. */

import React from "react";

export const SHAPES = [
  { id: "triangle", color: "#e1283c", el: <polygon points="12,3 22,21 2,21" /> },
  { id: "diamond",  color: "#1f6fe0", el: <polygon points="12,2 22,12 12,22 2,12" /> },
  { id: "circle",   color: "#f2a800", el: <circle cx="12" cy="12" r="10" /> },
  { id: "square",   color: "#1fa05b", el: <rect x="3" y="3" width="18" height="18" rx="2.5" /> },
];

export function Shape({ i, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {SHAPES[i % SHAPES.length].el}
    </svg>
  );
}

const AVATAR_HUES = [255, 22, 200, 145, 320, 48, 280];

export function Avatar({ name, size = 30 }) {
  const h = AVATAR_HUES[(name?.charCodeAt(0) || 0) % AVATAR_HUES.length];
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.42, background: `hsl(${h} 62% 52%)` }}>
      {(name?.[0] || "?").toUpperCase()}
    </span>
  );
}
