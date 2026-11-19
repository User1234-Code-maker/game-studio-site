import { useInView } from "@/hooks/useInView";
import { useCountUp } from "@/hooks/useCountUp";

/** A number that counts up once when it scrolls into view, with a caption. */
export function CountStat({
  value,
  suffix = "",
  label,
}: {
  value: number;
  suffix?: string;
  label: string;
}) {
  const [ref, seen] = useInView<HTMLElement>({ rootMargin: "0px", threshold: 0.6 });
  const shown = useCountUp(value, seen);
  return (
    <div>
      <strong ref={ref}>
        {shown}
        {suffix}
      </strong>
      <span>{label}</span>
    </div>
  );
}
