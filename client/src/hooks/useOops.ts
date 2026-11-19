import { createContext, useContext } from "react";

export interface OopsTarget {
  /** A translated name ("The full games list") or a brand ("Facebook"). */
  name: string;
  /** Brands read "Our Facebook page...", section names read "The full games list isn't...". */
  kind: "section" | "page";
}

interface OopsContextValue {
  open: (target: OopsTarget) => void;
}

export const OopsContext = createContext<OopsContextValue | null>(null);

export function useOops(): OopsContextValue {
  const context = useContext(OopsContext);
  if (!context) throw new Error("useOops must be used inside <OopsProvider>");
  return context;
}
