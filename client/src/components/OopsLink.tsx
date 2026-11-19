import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from "react";
import { useOops } from "@/hooks/useOops";

type Props = Omit<ComponentPropsWithoutRef<"a">, "href" | "onClick"> & {
  /** Translated section name ("The full games list"), or a brand name for kind="page". */
  name: string;
  kind?: "section" | "page";
  children?: ReactNode;
};

/** A link that does not lead anywhere yet: opens the "Oops" dialog instead of navigating. */
export function OopsLink({ name, kind = "section", children, ...rest }: Props) {
  const { open } = useOops();
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    open({ name, kind });
  };
  return (
    <a href="#" onClick={onClick} {...rest}>
      {children}
    </a>
  );
}
