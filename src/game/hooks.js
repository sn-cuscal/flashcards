import { useCallback, useEffect, useRef, useState } from "react";

/* One WebSocket per session, created lazily on the first send. While a
   session is active a dropped socket reconnects and replays the caller's
   rejoin message, so refreshes/blips don't kill the game. */
export function useGameSocket(wsUrl, { onMessage, makeRejoin }) {
  const [status, setStatus] = useState("idle");
  const wsRef = useRef(null);
  const activeRef = useRef(false);
  const queueRef = useRef([]);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  const makeRejoinRef = useRef(makeRejoin);
  makeRejoinRef.current = makeRejoin;

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return;
    setStatus("connecting");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => {
      setStatus("open");
      const rejoin = activeRef.current ? makeRejoinRef.current?.() : null;
      if (rejoin) ws.send(JSON.stringify(rejoin));
      for (const msg of queueRef.current.splice(0)) ws.send(JSON.stringify(msg));
    };
    ws.onmessage = (e) => {
      try {
        onMessageRef.current?.(JSON.parse(e.data));
      } catch { /* ignore malformed frames */ }
    };
    ws.onclose = () => {
      setStatus("closed");
      wsRef.current = null;
      if (activeRef.current) setTimeout(connect, 1200);
    };
  }, [wsUrl]);

  const send = useCallback((msg) => {
    activeRef.current = true;
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    else {
      queueRef.current.push(msg);
      connect();
    }
  }, [connect]);

  const close = useCallback(() => {
    activeRef.current = false;
    wsRef.current?.close();
  }, []);

  useEffect(() => close, [close]);

  return { send, close, status };
}

/* Client-side countdown for a question; the server stays authoritative (it
   rejects late answers), this only drives the ring + host auto-reveal.
   elapsedMs > 0 happens when rejoining mid-question. */
export function useCountdown(key, timeLimitSeconds, elapsedMs, onExpire) {
  const [remainingMs, setRemainingMs] = useState(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (key == null) {
      setRemainingMs(null);
      return undefined;
    }
    const limitMs = timeLimitSeconds * 1000;
    const startedAt = performance.now() - (elapsedMs || 0);
    setRemainingMs(Math.max(0, limitMs - (elapsedMs || 0)));
    const timer = setInterval(() => {
      const left = limitMs - (performance.now() - startedAt);
      if (left <= 0) {
        clearInterval(timer);
        setRemainingMs(0);
        onExpireRef.current?.();
      } else {
        setRemainingMs(left);
      }
    }, 100);
    return () => clearInterval(timer);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return remainingMs;
}

export function useSession(storageKey) {
  const read = () => {
    try {
      return JSON.parse(sessionStorage.getItem(storageKey)) || null;
    } catch {
      return null;
    }
  };
  const ref = useRef(read());
  return {
    get: () => ref.current,
    set: (value) => {
      ref.current = value;
      try {
        if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
        else sessionStorage.removeItem(storageKey);
      } catch { /* private mode etc — session survives in memory */ }
    },
  };
}
