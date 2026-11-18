/* Shared motion layer (all pages).
   Calm by design: blocks fade in once as they enter the viewport.
   No scroll listeners, no per-frame work: one IntersectionObserver. */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Blocks that fade in on first appearance. Whole groups reveal together,
     so cards keep their own hover transitions. */
  const REVEAL = [
    ".trending h3",
    ".trending .games",
    ".banner",
    ".features > .container > h3",
    ".features .info",
    ".projects > h3",
    ".projects .images",
    ".email .block",
    ".why h2",
    ".why__cards",
    ".story",
    ".team h2",
    ".team__cards",
    ".say-hello .container > *",
    ".contact-info",
    ".map-stats",
    ".chips",
    ".news-big",
    ".news-side-list",
  ];

  const targets = Array.from(new Set(REVEAL.flatMap((sel) => Array.from(document.querySelectorAll(sel)))));

  if (!reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    targets.forEach((el) => {
      el.classList.add("rv");
      io.observe(el);
    });
  }

  /* Count-up numbers, run once when visible */
  const counters = document.querySelectorAll("[data-count]");
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  function runCounter(el) {
    const end = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) {
      el.textContent = end + suffix;
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / 1200);
      el.textContent = Math.round(end * easeOut(t)) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (counters.length && "IntersectionObserver" in window) {
    const co = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          co.unobserve(entry.target);
        });
      },
      { threshold: 0.6 },
    );
    counters.forEach((el) => co.observe(el));
  } else {
    counters.forEach(runCounter);
  }

  /* Contact form: shake invalid fields */
  const contactForm = document.getElementById("contactForm");
  if (contactForm && !reduceMotion) {
    contactForm.addEventListener("submit", () => {
      requestAnimationFrame(() => {
        contactForm.querySelectorAll(".is-invalid").forEach((input) => {
          const field = input.closest(".field");
          field.classList.remove("is-error");
          void field.offsetWidth;
          field.classList.add("is-error");
        });
      });
    });
  }
})();
