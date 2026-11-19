import { useMemo, type ComponentPropsWithoutRef, type ElementType } from "react";
import { cssVars, cx } from "@/lib/cx";
import { useInView } from "@/hooks/useInView";
import { useReducedMotion } from "@/hooks/useMediaQuery";

// Small deterministic scatter so every letter starts somewhere different.
const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

interface Letter {
  char: string;
  style: ReturnType<typeof cssVars>;
}

function split(text: string): Array<Letter[] | " "> {
  let count = 0;
  return text
    .split(/([ \t\n]+)/)
    .filter(Boolean)
    .map((part) => {
      if (/^[ \t\n]+$/.test(part)) return " " as const;
      return Array.from(part).map((char) => {
        const i = count++;
        return {
          char,
          style: cssVars({
            "--i": i,
            "--dx": `${Math.round((rand(i) - 0.5) * 60)}px`,
            "--dy": `${Math.round(24 + rand(i + 99) * 36)}px`,
            "--dr": `${Math.round((rand(i + 7) - 0.5) * 50)}deg`,
          }),
        };
      });
    });
}

type Props<T extends ElementType> = { as?: T; children: string } & Omit<
  ComponentPropsWithoutRef<T>,
  "children" | "as"
>;

/**
 * A headline that assembles from letters once, when it scrolls into view, and
 * never comes apart again. Screen readers get the whole text from aria-label.
 */
export function SplitHeading<T extends ElementType = "h2">({
  as,
  children: text,
  className,
  ...rest
}: Props<T>) {
  const Tag: ElementType = as ?? "h2";
  const reduced = useReducedMotion();
  const [ref, seen] = useInView<HTMLElement>({ rootMargin: "0px 0px -10% 0px", threshold: 0.2 });
  const words = useMemo(() => split(text), [text]);
  const letterCount = words.reduce((sum, word) => sum + (word === " " ? 0 : word.length), 0);

  if (reduced || letterCount === 0 || text.length > 110) {
    return (
      <Tag className={className} {...rest}>
        {text}
      </Tag>
    );
  }

  return (
    <Tag
      ref={ref}
      className={cx(className, "fx-split", seen && "in")}
      aria-label={text}
      // The whole headline takes at most ~0.7 s to assemble, however long it is.
      style={cssVars({ "--step": `${Math.min(26, Math.round(700 / letterCount))}ms` })}
      {...rest}
    >
      {words.map((word, index) =>
        word === " " ? (
          " "
        ) : (
          <span key={index} className="w" aria-hidden="true">
            {word.map((letter, position) => (
              <span key={position} className="ch" style={letter.style}>
                {letter.char}
              </span>
            ))}
          </span>
        ),
      )}
    </Tag>
  );
}
