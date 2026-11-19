import { test, expect } from "./fixtures.js";

test.describe("language and theme", () => {
  test("language switch changes the page, the <html lang>, and survives a reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /language: english/i }).click();
    await page.getByRole("option", { name: "Русский" }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(page.getByRole("link", { name: "О нас" }).first()).toBeVisible();

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "ru");
    await expect(page.getByRole("link", { name: "О нас" }).first()).toBeVisible();

    await page.getByRole("button", { name: /язык|language/i }).first().click();
    await page.getByRole("option", { name: "Español" }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "es");
    await page.expectClean();
  });

  test("no translation key leaks onto any page in any language", async ({ page }) => {
    const KEY = /\b(?:nav|header|home|about|news|contact|order|orderResult|errors|common|services|servicesPage|newsletter|footer|data)\.[A-Za-z0-9_.-]{2,}\b/;
    for (const lang of ["en", "ru", "es"]) {
      await page.addInitScript((l) => localStorage.setItem("lang", l), lang);
      for (const path of ["/", "/about", "/services", "/news", "/contact", "/order/cancel", "/nothing-here"]) {
        page.expectedMissing.push("/nothing-here");
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const text = await page.locator("body").innerText();
        expect(text.match(KEY)?.[0], `${lang} ${path}`).toBeUndefined();
      }
    }
  });

  test("theme toggle switches and is remembered", async ({ page }) => {
    await page.goto("/");
    const before = await page.locator("html").getAttribute("data-theme");
    await page.getByRole("button", { name: /switch to (light|dark)/i }).click();
    const after = await page.locator("html").getAttribute("data-theme");
    expect(after).not.toBe(before);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", after);
  });

  test("a bad value in localStorage does not break the page", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("lang", "<script>alert(1)</script>");
      localStorage.setItem("theme", "javascript:alert(1)");
    });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1").first()).toBeVisible();
    await page.expectClean();
  });
});

test.describe("forms", () => {
  test("newsletter: invalid address is explained, valid one is accepted", async ({ page }) => {
    await page.goto("/");
    const input = page.getByRole("textbox", { name: "Email address" });
    await input.scrollIntoViewIfNeeded();

    await input.fill("not-an-email");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("status").filter({ hasText: /valid email/i })).toBeVisible();

    await input.fill("e2e-news@example.com");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("status").filter({ hasText: /subscribed/i })).toBeVisible();
    await expect(input).toHaveValue("");

    // Subscribing again looks exactly the same (no way to probe who is subscribed).
    await input.fill("E2E-NEWS@example.com");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("status").filter({ hasText: /subscribed/i })).toBeVisible();
    await page.expectClean();
  });

  test("contact: empty form shows field errors, filled form is sent", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: /get in touch/i }).click();
    await expect(page.getByText(/enter your first name/i)).toBeVisible();
    await expect(page.getByText(/valid email/i).first()).toBeVisible();

    await page.getByLabel("First Name", { exact: true }).fill("Kate");
    await page.getByLabel("Last Name", { exact: true }).fill("Lee");
    await page.getByLabel("Email Address", { exact: true }).fill("kate@example.com");
    await page.getByLabel("Message", { exact: true }).fill("Hello! We want to talk about a mobile game.");
    await page.getByRole("button", { name: /get in touch/i }).click();
    await expect(page.getByText(/Thanks! We will get back to you/i)).toBeVisible();
    await expect(page.getByLabel("First Name", { exact: true })).toHaveValue("");
    await page.expectClean();
  });

  test("contact: the server says no, the page shows a friendly message", async ({ page }) => {
    await page.route("**/api/contact", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "x", code: "server_error" }) }),
    );
    await page.goto("/contact");
    await page.getByLabel("First Name", { exact: true }).fill("Kate");
    await page.getByLabel("Last Name", { exact: true }).fill("Lee");
    await page.getByLabel("Email Address", { exact: true }).fill("kate@example.com");
    await page.getByLabel("Message", { exact: true }).fill("Hello! We want to talk about a mobile game.");
    await page.getByRole("button", { name: /get in touch/i }).click();
    await expect(page.getByText(/something went wrong|could not send/i).first()).toBeVisible();
  });

  test("news search narrows the list and recovers", async ({ page }) => {
    await page.goto("/news");
    const search = page.getByRole("searchbox").or(page.getByRole("textbox", { name: /search/i })).first();
    const cards = page.locator("article");
    await expect(cards.first()).toBeVisible();
    const total = await cards.count();

    await search.fill("zzzzzz-no-such-article");
    await expect(cards).toHaveCount(0);

    await search.fill("");
    await expect(cards).toHaveCount(total);
    await page.expectClean();
  });
});

test.describe("services page", () => {
  test("lists every service with the server price and opens the order dialog", async ({ page }) => {
    await page.goto("/services");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator(".service-card")).toHaveCount(6);
    const pc = page.locator("#pc");
    await expect(pc.getByText("$2,000", { exact: true })).toBeVisible();
    await expect(pc.getByRole("listitem")).toHaveCount(3);

    await pc.getByRole("button", { name: /Order PC Game Development/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText("$2,000", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(pc.getByRole("button", { name: /Order PC/ })).toBeFocused();
  });

  test("is reachable from the menu and from the home page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Services", exact: true }).first().click();
    await expect(page).toHaveURL(/\/services$/);
    await page.goto("/");
    await page.getByRole("link", { name: "All services" }).click();
    await expect(page).toHaveURL(/\/services$/);
  });

  test("FAQ answers open and close", async ({ page }) => {
    await page.goto("/services");
    const item = page.locator(".faq details").first();
    await item.locator("summary").click();
    await expect(item).toHaveAttribute("open", "");
    await expect(item.getByText(/reserves a producer/i)).toBeVisible();
    await item.locator("summary").click();
    await expect(item).not.toHaveAttribute("open", "");
  });

  test("home: a service sinks a little on hover", async ({ page }) => {
    await page.goto("/");
    const card = page.getByRole("button", { name: /Order PC Game Development/ });
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await card.hover();
    await expect
      .poll(() => card.evaluate((el) => getComputedStyle(el).transform))
      .toMatch(/^matrix\(0\.9/);
  });

  test("the order dialog has no gradients", async ({ page }) => {
    await page.goto("/services");
    await page.getByRole("button", { name: /Order PC Game Development/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const gradients = await dialog.evaluate((root) => {
      const list = [root, ...root.querySelectorAll("*")];
      const own = list.flatMap((el) => [getComputedStyle(el), getComputedStyle(el, "::before"), getComputedStyle(el, "::after")]);
      return own.filter((style) => style.backgroundImage.includes("gradient")).map((s) => s.backgroundImage.slice(0, 60));
    });
    expect(gradients).toEqual([]);
  });
});

test.describe("order and payment", () => {
  async function openOrder(page, service = /Order Mobile Game Development/) {
    await page.goto("/");
    const card = page.getByRole("button", { name: service });
    await card.scrollIntoViewIfNeeded();
    await card.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    return dialog;
  }

  test("dialog: opens with the server price, closes with Escape and returns focus", async ({ page }) => {
    const dialog = await openOrder(page);
    await expect(dialog.getByText("$1,500", { exact: true })).toBeVisible();
    await expect(dialog.getByText(/test mode/i)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: /Order Mobile Game Development/ })).toBeFocused();
  });

  test("dialog: keyboard focus stays inside while it is open", async ({ page }) => {
    const dialog = await openOrder(page);
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(() => Boolean(document.activeElement?.closest("[role=dialog]")));
      expect(inside, `Tab #${i + 1} left the dialog`).toBe(true);
    }
    await expect(dialog).toBeVisible();
  });

  test("dialog: wrong e-mail is caught before anything is sent", async ({ page }) => {
    const dialog = await openOrder(page);
    let sent = false;
    page.on("request", (r) => {
      if (r.url().endsWith("/api/checkout")) sent = true;
    });
    await dialog.getByLabel(/email for the receipt/i).fill("nope");
    await dialog.getByRole("button", { name: /pay/i }).click();
    await expect(dialog.getByText(/valid email/i)).toBeVisible();
    expect(sent).toBe(false);
  });

  test("full cycle: order, go to Stripe, pay (signed webhook), see the confirmation", async ({ page, request }) => {
    const dialog = await openOrder(page, /Order PC Game Development/);
    await dialog.getByLabel(/email for the receipt/i).fill("buyer@example.com");

    await dialog.getByRole("button", { name: /pay \$2,000/i }).click();

    // The browser is sent to Stripe's page; the session id is the last part of its URL.
    await expect(page).toHaveURL(/^https:\/\/checkout\.stripe\.com\/c\/pay\/cs_test_/);
    await expect(page.getByRole("heading", { name: /Stripe Checkout/ })).toBeVisible();
    const id = page.url().split("/").pop();

    // Before the payment the success page says "processing".
    await page.goto(`/order/success?session_id=${id}`);
    await expect(page.getByRole("heading", { name: /being processed/i })).toBeVisible();

    // Stripe pays and calls our webhook.
    expect((await request.post(`/__e2e/pay/${id}`)).status()).toBe(200);
    await page.reload();
    await expect(page.getByRole("heading", { name: /payment received/i })).toBeVisible();
    await expect(page.getByText(/PC Game Development/).first()).toBeVisible();
    await page.expectClean();
  });

  test("cancel page and broken success links are explained, not crashed", async ({ page }) => {
    await page.goto("/order/cancel");
    await expect(page.getByRole("heading", { name: /payment cancelled/i })).toBeVisible();

    await page.goto("/order/success");
    await expect(page.getByRole("heading", { name: /could not check/i })).toBeVisible();

    await page.goto("/order/success?session_id=cs_test_doesnotexist");
    await expect(page.getByRole("heading", { name: /could not check/i })).toBeVisible();
    await page.expectClean();
  });

  test("the browser refuses to follow a redirect that is not Stripe", async ({ page }) => {
    await page.route("**/api/checkout", (route) =>
      route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: "cs_test_x", url: "https://evil.example/phish" }) }),
    );
    const dialog = await openOrder(page);
    await dialog.getByRole("button", { name: /pay/i }).click();
    await expect(dialog.getByText(/could not start the payment/i)).toBeVisible();
    await expect(page).toHaveURL(/localhost/);
  });
});
