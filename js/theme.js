/* Theme switcher. The saved choice is applied by a tiny inline script in
   <head> (so the page never flashes the wrong colours); this file adds the
   button and keeps things in sync. Dark is the default look. */
(() => {
  const root = document.documentElement;
  const header = document.querySelector("header");
  if (!header) return;

  const sun =
    '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.300v2.200M2.500 12h2.200M19.300 12h2.200M5.300 5.300l1.600 1.600M17.100 17.100l1.600 1.600M5.300 18.700l1.600-1.600M17.100 6.900l1.600-1.600"/></svg>';
  const moon =
    '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.500A8.500 8.500 0 0 1 9.500 4a8.500 8.500 0 1 0 10.500 10.500Z"/></svg>';

  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-toggle";
  button.innerHTML = sun + moon;
  header.append(button);

  const meta = document.querySelector('meta[name="theme-color"]');

  function paint() {
    const light = root.dataset.theme === "light";
    button.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
    button.title = light ? "Dark theme" : "Light theme";
    if (meta) meta.content = light ? "#f6f3ef" : "#0b0601";
  }

  function apply(theme) {
    root.dataset.theme = theme;
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* private mode: the choice just lasts for this visit */
    }
    paint();
  }

  button.addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    // A native cross-fade where supported; instant everywhere else.
    if (document.startViewTransition && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.startViewTransition(() => apply(next));
    } else {
      apply(next);
    }
  });

  paint();
})();
