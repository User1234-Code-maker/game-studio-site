import { cx } from "@/lib/cx";
import { useInView } from "./useInView";
import { useReducedMotion } from "./useMediaQuery";

/**
 * Fade-in on first appearance. Returns [ref, className]:
 *   const [ref, revealClass] = useReveal<HTMLDivElement>();
 *   <div ref={ref} className={cx("games", revealClass)}>
 * With reduced motion the block is simply visible.
 */
export function useReveal<T extends Element>() {
  const reduced = useReducedMotion();
  const [ref, seen] = useInView<T>();
  return [ref, reduced ? "" : cx("rv", seen && "in")] as const;
}
