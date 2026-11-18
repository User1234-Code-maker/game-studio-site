/* Decorative stickers. One place to edit: the list below.
   [section selector, sticker file, side (l|r), top in px, size multiplier, rotation in degrees] */
(() => {
  const LAYOUT = [
    // Home
    [".trending", "coin", "l", 150, 0.9, -12],
    [".trending", "star", "r", 380, 0.8, 10],
    [".features", "bolt", "l", 130, 1, -10],
    [".features", "gem", "r", 320, 0.9, 12],
    [".projects", "trophy", "l", 120, 1, -8],
    [".projects", "sparkle", "r", 150, 0.7, 14],
    [".projects", "play", "r", 520, 0.85, -9],

    // About
    [".why", "gem", "r", 40, 0.85, 10],
    [".story", "dpad", "l", 130, 0.95, -10],
    [".team", "trophy", "r", 70, 0.95, 9],
    [".team", "star", "l", 280, 0.75, -12],

    // Contact
    [".contact-hero", "sparkle", "l", 110, 0.75, -10],
    [".contact-hero", "coin", "r", 150, 0.85, 12],
    [".say-hello", "heart", "l", 140, 0.85, -9],
    [".say-hello", "controller", "r", 420, 0.9, 10],

    // News
    [".news-hero", "controller", "r", 70, 0.85, 9],
    [".news-list", "coin", "l", 150, 0.85, -12],
    [".news-list", "bolt", "r", 760, 0.9, 10],
    [".news-list", "star", "l", 1180, 0.8, -10],
  ];

  const stickers = [];

  LAYOUT.forEach(([selector, name, side, top, size, rotation]) => {
    const section = document.querySelector(selector);
    if (!section) return;

    section.classList.add("has-stickers");
    const img = document.createElement("img");
    img.className = `sticker sticker--${side}`;
    img.src = `img/stickers/${name}.svg`;
    img.alt = "";
    img.width = 120;
    img.height = 120;
    img.loading = "lazy";
    img.decoding = "async";
    img.setAttribute("aria-hidden", "true");
    img.style.setProperty("--top", `${top}px`);
    img.style.setProperty("--r", `${rotation}deg`);
    section.append(img);
    stickers.push({ img, section, side, size });
  });

  // Each sticker lives in the free space beside the section's content. The
  // space is measured, so a sticker never covers text or pictures: if there is
  // not enough room (small screens, wide content) it is simply hidden.
  const CONTENT = "img:not(.sticker):not(.say-hello__curves):not(.map__land), p, h1, h2, h3, h4, article, form, .map, a, button, li, .why-card, .team-card";
  const MAX = 104;
  const MIN = 44;
  const GAP = 14;

  function place() {
    const width = document.documentElement.clientWidth;
    const bounds = new Map();
    stickers.forEach(({ section }) => {
      if (bounds.has(section)) return;
      let left = Infinity;
      let right = -Infinity;
      section.querySelectorAll(CONTENT).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
      });
      // Free space is measured from the edge of the window, not of the section.
      bounds.set(section, { left, right: width - right, box: section.getBoundingClientRect() });
    });

    stickers.forEach(({ img, section, side, size }) => {
      const { box, ...space } = bounds.get(section);
      const free = space[side === "l" ? "left" : "right"] - GAP * 2;
      const px = Math.min(MAX * size, free);
      const fits = Number.isFinite(free) && px >= MIN;
      img.hidden = !fits;
      if (!fits) return;

      const gapToEdge = (free - px) / 2 + GAP; // centred in the free space
      img.style.width = `${Math.round(px)}px`;
      if (side === "l") {
        img.style.left = `${Math.round(gapToEdge - box.left)}px`;
      } else {
        img.style.right = `${Math.round(gapToEdge - (width - box.right))}px`;
      }
    });
  }

  let timer = null;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(place, 120);
  };
  place();
  window.addEventListener("load", place);
  window.addEventListener("resize", schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);

  // Each sticker pops onto the page once, when it scrolls into view.
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.3 },
    );
    stickers.forEach(({ img }) => io.observe(img));
  } else {
    stickers.forEach(({ img }) => img.classList.add("in"));
  }
})();
