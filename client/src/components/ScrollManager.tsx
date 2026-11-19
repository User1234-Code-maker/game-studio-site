import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Scrolls to the top on a new page, or to the #section when the link has one. */
export function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // The target may mount a moment after navigation, so wait one frame.
      const frame = requestAnimationFrame(() =>
        document.getElementById(hash.slice(1))?.scrollIntoView(),
      );
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
