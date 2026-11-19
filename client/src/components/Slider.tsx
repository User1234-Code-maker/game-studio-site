import { useEffect, useState } from "react";
import { cx } from "@/lib/cx";
import { useReducedMotion } from "@/hooks/useMediaQuery";

export interface Slide {
  src: string;
  alt: string;
}

const INTERVAL = 9000;

/** Cross-fading image showcase. Pauses in a hidden tab; stays still with reduced motion. */
export function Slider({ slides, label }: { slides: Slide[]; label: string }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced || slides.length < 2) return;
    let timer = 0;
    const start = () => {
      stop();
      timer = window.setInterval(
        () => setIndex((current) => (current + 1) % slides.length),
        INTERVAL,
      );
    };
    const stop = () => clearInterval(timer);
    const onVisibility = () => (document.hidden ? stop() : start());

    document.addEventListener("visibilitychange", onVisibility);
    start();
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduced, slides.length]);

  return (
    <div className="slider" aria-roledescription="carousel" aria-label={label}>
      <div className="slider__slides">
        {slides.map((slide, position) => (
          <img
            key={slide.src}
            className={cx("slider__slide", position === index && "is-active")}
            src={slide.src}
            alt={slide.alt}
            width={1600}
            height={900}
            {...(position === 0
              ? { fetchPriority: "high" as const }
              : { loading: "lazy" as const, decoding: "async" as const })}
          />
        ))}
      </div>
    </div>
  );
}
