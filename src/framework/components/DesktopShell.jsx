/* DesktopShell.jsx — responsive shell around the app. On phones it is a
   transparent passthrough: the app fills the viewport. On wider screens it
   places a branded panel (driven entirely by config + data, never hardcoded)
   beside the portrait app column on a calm backdrop. */

import React from 'react'
import { U } from '../lib/u.js'

export function DesktopShell({ config, data, quiz, children }) {
  const cards = data?.cards ?? [];
  const categories = data?.categories ?? [];
  const questions = (quiz?.categories ?? []).reduce((n, c) => n + (c.questions?.length ?? 0), 0);

  return (
    <div className="shell">
      <aside className="shell-aside">
        <div className="shell-kicker">{config.home.eyebrow}</div>
        <h1 className="shell-headline">{config.home.title}</h1>
        {config.footer && <p className="shell-sub">{config.footer}</p>}

        {categories.length > 0 && (
          <div className="shell-decks">
            {categories.map((cat) => (
              <span
                key={cat.id}
                className="shell-deck"
                style={{ background: U.catTint(cat.hue), color: U.catInk(cat.hue) }}
              >
                {cards.filter((c) => c.cat === cat.id).length}
              </span>
            ))}
          </div>
        )}

        <div className="shell-meta">
          {cards.length} cards · {categories.length} decks
          {questions > 0 && <> · {questions} quiz questions</>}
        </div>
      </aside>

      <div className="shell-device">{children}</div>
    </div>
  );
}
