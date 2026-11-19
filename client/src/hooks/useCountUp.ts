import { useEffect, useState } from "react";
import { useReducedMotion } from "./useMediaQuery";

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Counts from 0 to `end` over 1.2 s once `active` turns true (no animation with reduced motion). */
export function useCountUp(end: number, active: boolean): number {
  const reduced = useReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || reduced) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 1200);
      setValue(Math.round(end * easeOut(progress)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, end, reduced]);

  if (reduced) return active ? end : 0;
  return value;
}
