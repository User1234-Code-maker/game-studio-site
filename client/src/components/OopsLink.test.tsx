import { describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OopsLink } from "./OopsLink";
import { renderApp } from "@/test/render";

describe("OopsLink", () => {
  it("opens an accessible dialog instead of navigating, closes on Escape and returns focus", async () => {
    const user = userEvent.setup();
    renderApp(<OopsLink name="The full games list">SEE ALL</OopsLink>);
    const link = screen.getByRole("link", { name: "SEE ALL" });

    await user.click(link);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveTextContent("The full games list isn't plugged in yet.");
    expect(screen.getByRole("button", { name: "Got it" })).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(link).toHaveFocus();
  });

  it("keeps keyboard focus inside the dialog", async () => {
    const user = userEvent.setup();
    renderApp(
      <OopsLink name="Facebook" kind="page">
        f
      </OopsLink>,
    );
    await user.click(screen.getByRole("link"));
    expect(screen.getByRole("dialog")).toHaveTextContent("Our Facebook page isn't plugged in yet.");

    await user.tab(); // Got it -> wraps to the first button (close)
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
  });
});
