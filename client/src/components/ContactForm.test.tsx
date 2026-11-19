import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "./ContactForm";
import { renderApp } from "@/test/render";
import * as apiModule from "@/lib/api";

afterEach(() => vi.restoreAllMocks());

async function fillValid(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("First Name"), "Ada");
  await user.type(screen.getByLabelText("Last Name"), "Lovelace");
  await user.type(screen.getByLabelText("Email Address"), "ada@example.com");
  await user.type(screen.getByLabelText("Message"), "Hello, I would like to talk about a project.");
}

describe("ContactForm", () => {
  it("shows an error under every empty field and focuses the first one", async () => {
    const user = userEvent.setup();
    const post = vi.spyOn(apiModule.api, "post");
    renderApp(<ContactForm />);

    await user.click(screen.getByRole("button", { name: "Get in touch" }));

    expect(screen.getByText("Please enter your first name.")).toBeInTheDocument();
    expect(screen.getByText("Please enter your last name.")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(screen.getByText("Message should be at least 10 characters.")).toBeInTheDocument();
    expect(screen.getByLabelText("First Name")).toHaveFocus();
    expect(post).not.toHaveBeenCalled();
  });

  it("clears an error as soon as the field is fixed", async () => {
    const user = userEvent.setup();
    renderApp(<ContactForm />);
    const email = screen.getByLabelText("Email Address");

    await user.type(email, "nope");
    await user.tab();
    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();

    await user.type(email, "@example.com");
    expect(screen.queryByText("Enter a valid email address.")).not.toBeInTheDocument();
  });

  it("sends the trimmed values and thanks the visitor", async () => {
    const user = userEvent.setup();
    const post = vi
      .spyOn(apiModule.api, "post")
      .mockResolvedValue({ kind: "ok", status: 201, data: { ok: true } });
    renderApp(<ContactForm />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Get in touch" }));

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Thanks! We will get back to you soon."),
    );
    expect(post).toHaveBeenCalledWith("/contact", {
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      message: "Hello, I would like to talk about a project.",
    });
    expect(screen.getByLabelText("First Name")).toHaveValue("");
  });

  it("is honest in demo mode (no backend)", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiModule.api, "post").mockResolvedValue({ kind: "offline" });
    renderApp(<ContactForm />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Get in touch" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("demo site"));
  });

  it("shows the server's field errors in the current language", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiModule.api, "post").mockResolvedValue({
      kind: "error",
      status: 422,
      code: "validation_failed",
      details: { email: "invalid_email" },
    });
    renderApp(<ContactForm />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Get in touch" }));

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
  });

  it("shows rate limiting as a message, not a crash", async () => {
    const user = userEvent.setup();
    vi.spyOn(apiModule.api, "post").mockResolvedValue({
      kind: "error",
      status: 429,
      code: "rate_limited",
    });
    renderApp(<ContactForm />);

    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Get in touch" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Too many requests"));
  });
});
