import type { CSSProperties } from "react";

/** Joins class names, skipping anything falsy: cx("a", isOn && "b"). */
export const cx = (...names: Array<string | false | null | undefined>): string =>
  names.filter(Boolean).join(" ");

/** Lets TypeScript accept CSS custom properties in a style prop. */
export const cssVars = (vars: Record<string, string | number>): CSSProperties =>
  vars as unknown as CSSProperties;
