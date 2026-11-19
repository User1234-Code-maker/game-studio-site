import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NewsletterSection } from "./NewsletterForm";
import { renderApp } from "@/test/render";
import * as apiModule from "@/lib/api";

afterEach(() => vi.restoreAllMocks());

describe("NewsletterSection", () => {
  it("rejects a wrong address without calling the server", async () => {
    const user = userEvent.setup();
    const post = vi.spyOn(apiModule.api, "post");
    renderApp(<NewsletterSection />);

    await user.type(screen.getByLabelText("Email address"), "nope");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("status")).toHaveTextContent("Enter a valid email address.");
    expect(post).not.toHaveBeenCalled();
  });

  it("subscribes and clears the field", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiModule.api, "post").mockResolvedValue({
      kind: "ok",
      status: 201,
      data: { ok: true },
    });
    renderApp(<NewsletterSection />);

    await user.type(screen.getByLabelText("Email address"), "qa@example.com");
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("You are subscribed."),
    );
    expect(screen.getByLabelText("Email address")).toHaveValue("");
  });
});
