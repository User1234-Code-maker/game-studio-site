import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);

// jsdom has no matchMedia or IntersectionObserver.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
    onchange: null,
  }),
});

class FakeObserver {
  constructor(private callback: IntersectionObserverCallback) {}
  observe(target: Element) {
    // Everything counts as visible in tests.
    this.callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", FakeObserver);
Element.prototype.scrollIntoView = () => undefined;

// Real translations in tests, English by default.
import i18n from "@/i18n";
import { beforeEach } from "vitest";
beforeEach(async () => {
  localStorage.clear();
  await i18n.changeLanguage("en");
});
