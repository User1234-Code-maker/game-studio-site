import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cx, cssVars } from "@/lib/cx";
import { img } from "@/lib/assets";
import { HQ_ID, MAP_HEIGHT, MAP_WIDTH, offices, officeStats } from "@/lib/data";
import { useInView } from "@/hooks/useInView";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useDynamicT } from "@/hooks/useDynamicT";
import type { Office } from "@/types/data";
import { CountStat } from "./CountStat";

interface Placement {
  below: boolean;
  shift: number;
}

const mapsUrl = (office: Office) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${office.address} ${office.city}`).replace(/%20/g, "+")}`;

/** Curved route from headquarters to the selected office, in map percent coordinates. */
function arcPath(from: Office, to: Office): string {
  const mx = (from.x + to.x) / 2;
  const my = Math.min(from.y, to.y) - Math.hypot(from.x - to.x, from.y - to.y) * 0.28;
  return `M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`;
}

/**
 * World map with one pin per office, plus a row of city chips.
 * Hover (mouse) previews an office, a click or tap pins it; Escape or a click
 * elsewhere closes it. The popup is kept inside the window.
 */
export function OfficeMap() {
  const { t, i18n } = useTranslation();
  const dt = useDynamicT();
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const [viewRef, seen] = useInView<HTMLDivElement>({ rootMargin: "0px", threshold: 0.25 });
  const mapRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number>(0);

  const [pinned, setPinned] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [placement, setPlacement] = useState<Placement>({ below: false, shift: 0 });
  const activeId = pinned ?? hovered;

  const hq = offices.find((office) => office.id === HQ_ID);
  const active = offices.find((office) => office.id === activeId);

  const chips = useMemo(
    () =>
      offices
        .map((office) => ({ id: office.id, city: dt(`data.offices.${office.id}.city`) }))
        .sort((a, b) => a.city.localeCompare(b.city, i18n.language)),
    // dt changes with the language
    [dt, i18n.language],
  );

  // Keep the popup inside the window and flip it below the pin near the top.
  useLayoutEffect(() => {
    const place = () => {
      if (!activeId) return;
      const pin = mapRef.current?.querySelector<HTMLElement>(`.pin[data-id="${activeId}"]`);
      const card = pin?.querySelector<HTMLElement>(".pin__card");
      if (!pin || !card) return;
      const rect = pin.getBoundingClientRect();
      const margin = 12;
      const half = card.offsetWidth / 2;
      let shift = 0;
      if (rect.left - half < margin) shift = margin - (rect.left - half);
      else if (rect.left + half > window.innerWidth - margin)
        shift = window.innerWidth - margin - (rect.left + half);
      setPlacement({ below: rect.top < card.offsetHeight + 40, shift });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [activeId, i18n.language]);

  // Click outside the pins and chips, or Escape, closes the popup.
  useEffect(() => {
    const closeAll = () => {
      setPinned(null);
      setHovered(null);
    };
    const onClick = (event: MouseEvent) => {
      if (!(event.target as Element).closest(".pin, .chip")) closeAll();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeAll();
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
      clearTimeout(hoverTimer.current);
    };
  }, []);

  const toggleOffice = (id: string) => {
    clearTimeout(hoverTimer.current);
    setPinned((current) => (current === id ? null : id));
    setHovered(null);
  };

  return (
    <>
      <div
        className={cx("map", seen && "is-visible")}
        id="officeMap"
        style={cssVars({ "--ratio": `${MAP_WIDTH} / ${MAP_HEIGHT}` })}
        ref={(node) => {
          mapRef.current = node;
          viewRef.current = node;
        }}
      >
        <img
          loading="lazy"
          decoding="async"
          className="map__land"
          src={img("world-map.svg")}
          alt=""
          width={MAP_WIDTH}
          height={MAP_HEIGHT}
        />
        <svg
          className="map__arcs"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className={cx("map__arc", hq && active && active !== hq && "is-on")}
            d={hq && active && active !== hq ? arcPath(hq, active) : ""}
          />
        </svg>
        {offices.map((office, index) => {
          const isOpen = office.id === activeId;
          const isHq = office.id === HQ_ID;
          const city = dt(`data.offices.${office.id}.city`);
          const country = dt(`data.offices.${office.id}.country`);
          const role = dt(`data.offices.${office.id}.role`);
          return (
            <div
              key={office.id}
              className={cx(
                "pin",
                `pin--${isHq ? "hq" : office.size}`,
                isOpen && "is-open",
                activeId && !isOpen && "is-dim",
              )}
              style={cssVars({ "--x": `${office.x}%`, "--y": `${office.y}%`, "--i": index })}
              data-id={office.id}
              onMouseEnter={() => {
                if (!canHover || pinned) return;
                clearTimeout(hoverTimer.current);
                setHovered(office.id);
              }}
              onMouseLeave={() => {
                if (!canHover || pinned) return;
                hoverTimer.current = window.setTimeout(() => setHovered(null), 180);
              }}
            >
              <button
                type="button"
                className="pin__btn"
                aria-expanded={isOpen}
                aria-controls={`card-${office.id}`}
                aria-label={t("contact.pinLabel", { city, country, role })}
                onClick={() => toggleOffice(office.id)}
                onFocus={() => {
                  if (!pinned) setHovered(office.id);
                }}
              >
                <span className="pin__pulse" />
                <span className="pin__dot" />
              </button>
              <div
                className={cx("pin__card", isOpen && placement.below && "is-below")}
                id={`card-${office.id}`}
                role="dialog"
                aria-label={t("contact.pinDialog", { city })}
                style={isOpen ? cssVars({ "--shift": `${placement.shift}px` }) : undefined}
              >
                <span className="pin__role">{role}</span>
                <p className="pin__city">
                  {city}
                  <small>{country}</small>
                </p>
                <p className="pin__address">{dt(`data.offices.${office.id}.address`)}</p>
                <a className="pin__phone" href={`tel:${office.phone.replace(/[^+\d]/g, "")}`}>
                  {office.phone}
                </a>
                <p className="pin__team">
                  <strong>{office.team}</strong> {t("contact.onSite")}
                </p>
                <a
                  className="pin__route"
                  href={mapsUrl(office)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("contact.directions")}
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="map-stats">
        <CountStat value={officeStats.offices} label={t("contact.stats.offices")} />
        <CountStat value={officeStats.countries} label={t("contact.stats.countries")} />
        <CountStat value={officeStats.people} suffix="+" label={t("contact.stats.people")} />
      </div>

      <div className="chips" role="group" aria-label={t("contact.chooseOffice")}>
        {chips.map(({ id, city }) => (
          <button
            key={id}
            type="button"
            className={cx("chip", id === activeId && "is-active")}
            onClick={() => {
              toggleOffice(id);
              mapRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            {city}
          </button>
        ))}
      </div>
    </>
  );
}
