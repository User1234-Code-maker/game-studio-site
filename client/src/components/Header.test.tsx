import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "./Header";
import { renderApp } from "@/test/render";
import i18n from "@/i18n";

describe("Header", () => {
  it("marks the current page and toggles the mobile menu", async () => {
    const user = userEvent.setup();
    renderApp(<Header page="about" />);

    expect(screen.getByRole("link", { name: "About us" }).closest("li")).toHaveClass("active");
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(screen.getByRole("button", { name: "Close menu" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    await user.click(screen.getByRole("link", { name: "News" }));
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  it("switches the theme and remembers it", async () => {
    const user = userEvent.setup();
    document.documentElement.dataset.theme = "dark";
    renderApp(<Header />);

    await user.click(screen.getByRole("button", { name: "Switch to light theme" }));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("theme")).toBe("light");
    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument();
  });

  it("changes the language from the dropdown with the keyboard", async () => {
    const user = userEvent.setup();
    renderApp(<Header />);

    await user.click(screen.getByRole("button", { name: /Language: English/ }));
    await user.click(screen.getByRole("option", { name: "Русский" }));

    expect(i18n.language).toBe("ru");
    expect(document.documentElement.lang).toBe("ru");
    expect(localStorage.getItem("lang")).toBe("ru");
    expect(screen.getByRole("link", { name: "Главная" })).toBeInTheDocument();
  });
});
