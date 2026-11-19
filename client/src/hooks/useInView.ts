import { useEffect, useRef, useState } from "react";

interface Options {
  rootMargin?: string;
  threshold?: number;
}

/**
 * One-shot visibility: becomes true the first time the element scrolls into
 * view and stays true. Without IntersectionObserver support it is true at once.
 */
export function useInView<T extends Element>({
  rootMargin = "0px 0px -8% 0px",
  threshold = 0.08,
}: Options = {}) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    const element = ref.current;
    if (seen || !element) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [seen, rootMargin, threshold]);

  return [ref, seen] as const;
}
