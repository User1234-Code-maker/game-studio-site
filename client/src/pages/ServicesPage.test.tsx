import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServicesPage } from "./ServicesPage";
import { renderApp } from "@/test/render";
import { resetCatalogCache } from "@/hooks/useCatalog";
import * as apiModule from "@/lib/api";

beforeEach(() => resetCatalogCache());

describe("ServicesPage", () => {
  it("shows six services with their prices from the server", async () => {
    vi.spyOn(apiModule.api, "get").mockResolvedValue({
      kind: "ok",
      status: 200,
      data: {
        enabled: true,
        currency: "usd",
        items: [
          { id: "mobile", name: "Mobile", depositCents: 150_000 },
          { id: "pc", name: "PC", depositCents: 200_000 },
        ],
      },
    });
    renderApp(<ServicesPage />);
    const cards = screen.getAllByRole("heading", { level: 2 }).filter((h) => h.className.includes("service-card__title"));
    expect(cards).toHaveLength(6);
    await waitFor(() => expect(screen.getByText("$1,500")).toBeVisible());
    expect(screen.getByText("$2,000")).toBeVisible();
    // A service the server does not price shows no amount.
    const ps4 = screen.getByRole("heading", { name: "PS4 Game Development" }).closest("li")!;
    expect(within(ps4).queryByText(/\$/)).toBeNull();
  });

  it("without a backend the cards still work and show no prices", async () => {
    vi.spyOn(apiModule.api, "get").mockResolvedValue({ kind: "offline" });
    const user = userEvent.setup();
    renderApp(<ServicesPage />);
    expect(screen.queryByText(/\$\d/)).toBeNull();
    await user.click(screen.getByRole("button", { name: "Order PC Game Development" }));
    expect(await screen.findByRole("dialog")).toBeVisible();
    expect(await screen.findByText(/need the Node.js server/i)).toBeVisible();
  });

  it("each card button names its service", () => {
    vi.spyOn(apiModule.api, "get").mockResolvedValue({ kind: "offline" });
    renderApp(<ServicesPage />);
    expect(screen.getAllByRole("button", { name: /^Order / })).toHaveLength(6);
  });
});
