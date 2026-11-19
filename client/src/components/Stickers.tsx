import { useEffect, useLayoutEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { img } from "@/lib/assets";
import { cssVars } from "@/lib/cx";
import { useInView } from "@/hooks/useInView";

export interface StickerSpec {
  name:
    | "bolt"
    | "coin"
    | "controller"
    | "dpad"
    | "gem"
    | "heart"
    | "play"
    | "sparkle"
    | "star"
    | "trophy";
  side: "l" | "r";
  /** Distance from the top of the section, px. */
  top: number;
  /** Size multiplier. */
  size: number;
  /** Rotation, degrees. */
  rotation: number;
}

// Everything that counts as "content": a sticker never covers any of it.
const CONTENT =
  "img:not(.sticker):not(.say-hello__curves):not(.map__land), p, h1, h2, h3, h4, article, form, .map, a, button, li, .why-card, .team-card";
const MAX = 104;
const MIN = 44;
const GAP = 14;

function Sticker({
  spec,
  innerRef,
}: {
  spec: StickerSpec;
  innerRef: (el: HTMLImageElement | null) => void;
}) {
  const [ref, seen] = useInView<HTMLImageElement>({ rootMargin: "0px", threshold: 0.3 });
  return (
    <img
      ref={(el) => {
        ref.current = el;
        innerRef(el);
      }}
      className={`sticker sticker--${spec.side}${seen ? " in" : ""}`}
      src={img(`stickers/${spec.name}.svg`)}
      alt=""
      aria-hidden="true"
      width={120}
      height={120}
      loading="lazy"
      decoding="async"
      style={cssVars({ "--top": `${spec.top}px`, "--r": `${spec.rotation}deg` })}
    />
  );
}

/**
 * Decorative stickers in the side margins of the parent section (give that
 * section the class "has-stickers"). Each sticker lives in the free space
 * beside the content. The space is measured, so a sticker never covers text
 * or pictures: if there is not enough room it is hidden.
 */
export function Stickers({ items }: { items: StickerSpec[] }) {
  const { i18n } = useTranslation();
  const nodes = useRef<Array<HTMLImageElement | null>>([]);

  useLayoutEffect(() => {
    const place = () => {
      const first = nodes.current.find(Boolean);
      const section = first?.parentElement;
      if (!section) return;

      const width = document.documentElement.clientWidth;
      let left = Infinity;
      let right = -Infinity;
      section.querySelectorAll(CONTENT).forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        left = Math.min(left, rect.left);
        right = Math.max(right, rect.right);
      });
      const box = section.getBoundingClientRect();
      const space = { l: left, r: width - right };

      items.forEach((spec, index) => {
        const node = nodes.current[index];
        if (!node) return;
        const free = space[spec.side] - GAP * 2;
        const px = Math.min(MAX * spec.size, free);
        const fits = Number.isFinite(free) && px >= MIN;
        node.hidden = !fits;
        if (!fits) return;

        const edge = (free - px) / 2 + GAP; // centred in the free space
        node.style.width = `${Math.round(px)}px`;
        if (spec.side === "l") node.style.left = `${Math.round(edge - box.left)}px`;
        else node.style.right = `${Math.round(edge - (width - box.right))}px`;
      });
    };

    place();
    let timer = 0;
    const schedule = () => {
      clearTimeout(timer);
      timer = window.setTimeout(place, 120);
    };
    window.addEventListener("resize", schedule);
    window.addEventListener("load", place);
    void document.fonts?.ready.then(place);
    // Text length changes with the language, so the free space changes too.
    schedule();
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", place);
    };
  }, [items, i18n.language]);

  // Sections load images and data late; measure once more after the first paint.
  useEffect(() => {
    const timer = setTimeout(() => window.dispatchEvent(new Event("resize")), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {items.map((spec, index) => (
        <Sticker
          key={`${spec.name}-${spec.side}-${spec.top}`}
          spec={spec}
          innerRef={(el) => {
            nodes.current[index] = el;
          }}
        />
      ))}
    </>
  );
}
