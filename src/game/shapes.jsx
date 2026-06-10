/* shapes.jsx — the four fixed colour/shape answer identities (Kahoot-style):
   option slots always map red triangle / blue diamond / yellow circle /
   green square, so players can answer on shape recognition alone. */

import React from "react";

export const SHAPES = [
  { id: "triangle", color: "#e21b3c", el: <polygon points="12,3 22,21 2,21" /> },
  { id: "diamond",  color: "#1368ce", el: <polygon points="12,2 22,12 12,22 2,12" /> },
  { id: "circle",   color: "#d89e00", el: <circle cx="12" cy="12" r="10" /> },
  { id: "square",   color: "#26890c", el: <rect x="3" y="3" width="18" height="18" rx="2.5" /> },
];

export function Shape({ i, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {SHAPES[i % SHAPES.length].el}
    </svg>
  );
}
