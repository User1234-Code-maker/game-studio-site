import { useEffect, useState } from "react";
import { api, type ServicesResponse } from "@/lib/api";

export type Catalog =
  | { state: "loading" }
  | { state: "offline" }
  | { state: "disabled" }
  | { state: "ready"; currency: string; deposits: Record<string, number> };

// One request per page load, shared by the services page and the order dialog.
let pending: Promise<Catalog> | null = null;

function load(): Promise<Catalog> {
  pending ??= api
    .get<ServicesResponse>("/services")
    .then((reply): Catalog => {
      if (reply.kind !== "ok") return { state: "offline" };
      if (!reply.data.enabled) return { state: "disabled" };
      return {
        state: "ready",
        currency: reply.data.currency,
        deposits: Object.fromEntries(reply.data.items.map((item) => [item.id, item.depositCents])),
      };
    })
    .catch((): Catalog => ({ state: "offline" }));
  return pending;
}

/** Test helper: forget the cached answer. */
export function resetCatalogCache() {
  pending = null;
}

/** The price list from the server. Starts loading when `needed` becomes true. */
export function useCatalog(needed = true): Catalog {
  const [catalog, setCatalog] = useState<Catalog>({ state: "loading" });

  useEffect(() => {
    if (!needed) return;
    let active = true;
    void load().then((result) => {
      if (active) setCatalog(result);
    });
    return () => {
      active = false;
    };
  }, [needed]);

  return catalog;
}
