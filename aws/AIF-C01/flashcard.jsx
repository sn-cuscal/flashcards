/* flashcard.jsx — flip (robust half-turn, single face) + swipe-to-grade, in 3 styles */

function FaceContent({ side, card, cat, styleId, showUse, onToggleUse }) {
  const hue = cat.hue;
  const chipStyle =
    styleId === "tinted"
      ? { background: U.catSolid(hue), color: "#fff" }
      : { background: U.catTint(hue), color: U.catInk(hue) };
  const dotColor = styleId === "tinted" ? "rgba(255,255,255,0.85)" : U.catSolid(hue);
  const aLabelStyle = styleId === "tinted" ? { color: U.catDeep(hue) } : undefined;
  const qColor = styleId === "tinted" ? { color: U.catDeep(hue) } : undefined;

  return (
    <React.Fragment>
      <span className="fc-chip" style={chipStyle}>
        <i style={{ background: dotColor }} />
        {cat.name}
      </span>

      {side === "front" ? (
        <React.Fragment>
          <div className="fc-body">
            <div className="fc-q" style={qColor}>{card.front}</div>
          </div>
          <div className="fc-hint"><Ic.flip /> Tap to reveal</div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="fc-body">
            <div className="fc-aLabel" style={aLabelStyle}>Answer</div>
            <div className="fc-rule" style={styleId === "tinted" ? { background: `oklch(0.86 0.04 ${hue})` } : undefined} />
            <div className="fc-a" style={qColor}>{card.back}</div>
            {card.use && (
              <div className="fc-use-slot">
                <div className={"fc-use" + (showUse ? " show" : "")} aria-hidden={!showUse}>
                  <span className="fc-use-k" style={aLabelStyle}>Purpose</span>
                  <span className="fc-use-t" style={styleId === "tinted" ? { color: U.catDeep(hue) } : undefined}>{card.use}</span>
                </div>
                <button
                  className={"fc-use-btn" + (showUse ? " hide" : "")}
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onToggleUse(); }}
                ><Ic.info /> Show purpose</button>
              </div>
            )}
            {card.tag && <div className="fc-tag">{card.tag}</div>}
          </div>
          <div className="fc-hint" style={qColor}>Swipe ← learning&nbsp;&nbsp;·&nbsp;&nbsp;got it →</div>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

function Flashcard({ card, cat, styleId, flipped, exiting, onFlip, onGrade }) {
  // ---- flip (scaleX squeeze — reliable, no 3D) ----
  const [face, setFace] = React.useState(flipped ? "back" : "front");
  const [sq, setSq] = React.useState(false);
  const [showUse, setShowUse] = React.useState(false);
  const animating = React.useRef(false);

  React.useEffect(() => {
    const target = flipped ? "back" : "front";
    if (target === face || animating.current) return;
    animating.current = true;
    setSq(true);
    const t = setTimeout(() => {
      setFace(target);
      setSq(false);
      setTimeout(() => { animating.current = false; }, 170);
    }, 155);
    return () => clearTimeout(t);
  }, [flipped]);

  // ---- swipe ----
  const [drag, setDrag] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const start = React.useRef(null);
  const moved = React.useRef(0);
  const THRESH = 95;

  function down(e) {
    if (exiting) return;
    start.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    moved.current = 0;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function move(e) {
    if (start.current == null) return;
    const dx = e.clientX - start.current.x, dy = e.clientY - start.current.y;
    moved.current = Math.max(moved.current, Math.abs(dx) + Math.abs(dy));
    if (Math.abs(dx) > Math.abs(dy) || Math.abs(drag) > 4) setDrag(dx);
  }
  function up(e) {
    if (start.current == null) return;
    const dx = e.clientX - start.current.x;
    const quick = Date.now() - start.current.t < 280;
    start.current = null;
    setDragging(false);
    if (Math.abs(dx) > THRESH || (quick && Math.abs(dx) > 55)) { onGrade(dx > 0); setDrag(0); return; }
    if (moved.current < 9) onFlip();
    setDrag(0);
  }

  // ---- transforms: outer wrapper = drag/fly, inner = flip turn ----
  let wrapStyle;
  if (exiting) {
    const off = exiting === "r" ? 460 : -460, rot = exiting === "r" ? 18 : -18;
    wrapStyle = { transform: `translateX(${off}px) rotate(${rot}deg)`, opacity: 0, transition: "transform .3s ease-in, opacity .3s ease-in" };
  } else {
    wrapStyle = {
      transform: `translateX(${drag}px) rotate(${drag * 0.035}deg)`,
      transition: dragging ? "none" : "transform .35s cubic-bezier(.2,.8,.2,1)",
    };
  }

  const prog = Math.min(1, Math.abs(drag) / THRESH);
  const rHint = exiting === "r" ? 1 : (drag > 0 ? prog : 0);
  const lHint = exiting === "l" ? 1 : (drag < 0 ? prog : 0);

  return (
    <React.Fragment>
      <div className="swipe-hint l" style={{ opacity: lHint }}>Still learning</div>
      <div className="swipe-hint r" style={{ opacity: rHint }}>Got it</div>
      <div
        className="fc-drag"
        style={{ ...wrapStyle, width: "100%", maxWidth: 340, height: 440, touchAction: "pan-y" }}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      >
        <div
          className={"fc st-" + styleId}
          style={{
            transform: sq ? "scaleX(0.04)" : "none",
            transition: "transform .155s ease-in-out",
          }}
        >
          <div className="fc-face" style={{ position: "static", height: "100%" }}>
            <FaceContent side={face} card={card} cat={cat} styleId={styleId} showUse={showUse} onToggleUse={() => setShowUse((v) => !v)} />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

window.Flashcard = Flashcard;
