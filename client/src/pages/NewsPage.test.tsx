import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsPage } from "./NewsPage";
import { renderApp } from "@/test/render";
import * as apiModule from "@/lib/api";

describe("NewsPage search", () => {
  it("filters articles in the browser when there is no backend", async () => {
    vi.spyOn(apiModule.api, "get").mockResolvedValue({ kind: "offline" });
    const user = userEvent.setup();
    renderApp(<NewsPage />);
    expect(screen.getAllByRole("article")).toHaveLength(9);

    await user.type(screen.getByRole("searchbox", { name: "Search articles" }), "rowing");
    await waitFor(() => expect(screen.getAllByRole("article").length).toBeLessThan(9));
    expect(screen.getAllByRole("article").length).toBeGreaterThan(0);

    await user.clear(screen.getByRole("searchbox"));
    await user.type(screen.getByRole("searchbox"), "zzzzzz");
    await waitFor(() => expect(screen.queryAllByRole("article")).toHaveLength(0));
    expect(screen.getByText("No articles found. Try another keyword.")).toBeVisible();
  });
});
