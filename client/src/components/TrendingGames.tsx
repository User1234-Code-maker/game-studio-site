import { useRef, type PointerEvent } from "react";
import { useTranslation } from "react-i18next";
import { img } from "@/lib/assets";
import { cx } from "@/lib/cx";
import { useMediaQuery, useReducedMotion } from "@/hooks/useMediaQuery";
import { useReveal } from "@/hooks/useReveal";

const GAMES = [
  { n: 1, file: "game-1.webp", width: 252, height: 278 },
  { n: 2, file: "game-2.webp", width: 252, height: 277 },
  { n: 3, file: "game-3.webp", width: 252, height: 278 },
  { n: 4, file: "game-4.webp", width: 251, height: 277 },
];

/** Four game cards that tilt toward the pointer (mouse and pen only, not with reduced motion). */
export function TrendingGames() {
  const { t } = useTranslation();
  const [revealRef, revealClass] = useReveal<HTMLDivElement>();
  const reduced = useReducedMotion();
  const canHover = useMediaQuery("(hover: hover)");
  const tilt = !reduced && canHover;
  const frame = useRef(0);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!tilt || event.pointerType === "touch") return;
    const card = event.currentTarget;
    const { clientX, clientY } = event;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const image = card.querySelector<HTMLImageElement>(":scope > img");
      if (!image) return;
      const box = image.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((clientX - box.left) / box.width) * 2 - 1));
      const y = Math.max(-1, Math.min(1, ((clientY - box.top) / box.height) * 2 - 1));
      image.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
      image.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
      image.style.setProperty("--s", "1.03");
    });
  };

  const onLeave = (event: PointerEvent<HTMLDivElement>) => {
    cancelAnimationFrame(frame.current);
    const image = event.currentTarget.querySelector<HTMLImageElement>(":scope > img");
    ["--ry", "--rx", "--s"].forEach((name) => image?.style.removeProperty(name));
  };

  return (
    <div ref={revealRef} className={cx("games", revealClass)}>
      {GAMES.map(({ n, file, width, height }) => (
        <div key={n} className="block" onPointerMove={onMove} onPointerLeave={onLeave}>
          <img
            loading="lazy"
            decoding="async"
            width={width}
            height={height}
            src={img(file)}
            alt={t("home.trending.game", { n })}
          />
          <span>
            <img
              loading="lazy"
              decoding="async"
              width={19}
              height={25}
              src={img("icon-fire.svg")}
              alt=""
            />{" "}
            {t("home.trending.followers", { count: 40 })}
          </span>
        </div>
      ))}
    </div>
  );
}
