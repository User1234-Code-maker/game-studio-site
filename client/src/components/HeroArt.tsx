import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cx } from "@/lib/cx";
import { img } from "@/lib/assets";

// three.js is a separate chunk that loads after the page is idle.
const GamepadScene = lazy(() => import("./GamepadScene"));

function canUseWebGL(): boolean {
  if (typeof window === "undefined" || typeof WebGL2RenderingContext === "undefined") return false;
  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return !conn?.saveData;
}

/**
 * Hero picture. The still image is always in the page (it holds the layout and
 * is the fallback); a 3D gamepad takes over once it has rendered.
 */
export function HeroArt() {
  const { t } = useTranslation();
  const [mount, setMount] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!canUseWebGL()) return;
    const run = () => setMount(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(run, 400);
    return () => window.clearTimeout(id);
  }, []);

  const onReady = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);

  return (
    <>
      <img
        className={cx("hero__still", ready && "is-hidden")}
        fetchPriority="high"
        width={740}
        height={951}
        src={img("joystick.webp")}
        alt={t("home.heroAlt")}
      />
      {mount && !failed && (
        <Suspense fallback={null}>
          <div className={cx("hero__3d-wrap", ready && "is-ready")}>
            <GamepadScene onReady={onReady} onError={onError} />
          </div>
        </Suspense>
      )}
    </>
  );
}
