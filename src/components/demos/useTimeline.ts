import { useCallback, useEffect, useRef, useState } from "react";

/** Clamped progress of `t` (0..1 global) inside the window [a, b]. */
export function seg(t: number, a: number, b: number) {
  if (b <= a) return t >= b ? 1 : 0;
  return Math.min(1, Math.max(0, (t - a) / (b - a)));
}

/** Gentle ease-out used across every demo so motion feels like one system. */
export function ease(x: number) {
  return 1 - Math.pow(1 - x, 3);
}

export function mix(a: number, b: number, k: number) {
  return a + (b - a) * k;
}

function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type Options = {
  /** Total loop length in milliseconds. */
  duration: number;
  loop?: boolean;
  /** Start automatically the first time the demo scrolls into view. */
  autoplayInView?: boolean;
};

/**
 * One requestAnimationFrame clock per demo. Returns normalized progress 0..1.
 * Under prefers-reduced-motion the timeline parks on its final frame.
 */
export function useTimeline({ duration, loop = true, autoplayInView = true }: Options) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const startedAt = useRef(0);
  const offset = useRef(0);

  useEffect(() => {
    if (!prefersReducedMotion()) return;
    setReduced(true);
    setT(1);
  }, []);

  useEffect(() => {
    if (reduced || !autoplayInView) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setPlaying(e.isIntersecting);
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, autoplayInView]);

  useEffect(() => {
    if (!playing || reduced) return;
    let raf = 0;
    startedAt.current = performance.now() - offset.current;
    const tick = (now: number) => {
      const elapsed = now - startedAt.current;
      if (elapsed >= duration && !loop) {
        offset.current = duration;
        setT(1);
        setPlaying(false);
        return;
      }
      offset.current = loop ? elapsed % duration : elapsed;
      setT(offset.current / duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, duration, loop, reduced]);

  const restart = useCallback(() => {
    offset.current = 0;
    setT(0);
    setPlaying(true);
  }, []);

  const toggle = useCallback(() => setPlaying((p) => !p), []);

  const seek = useCallback(
    (fraction: number) => {
      offset.current = fraction * duration;
      setT(fraction);
      setPlaying(true);
    },
    [duration],
  );

  return { ref, t, playing, reduced, restart, toggle, seek };
}
