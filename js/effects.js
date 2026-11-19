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

  /* Headlines assemble from letters once, when they come into view.
     They never come apart again: the effect is a one-time arrival, not a scroll toy. */
  const SPLIT = [
    ".hero--info h1",
    ".about-hero h1",
    ".contact-hero h1",
    ".news-hero h1",
    ".trending h3",
    ".banner h3",
    ".features > .container > h3",
    ".projects > h3",
    ".why h2",
    ".story h2",
    ".team h2",
    ".say-hello h2",
  ];

  // Small deterministic scatter so every letter starts somewhere different.
  const rand = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  function splitHeading(el) {
    const label = el.textContent.replace(/\s+/g, " ").trim();
    if (!label || label.length > 110) return false;
    // Remember the English text so the headline can be rebuilt in another language.
    if (!el.dataset.en) el.dataset.en = window.i18n ? window.i18n.toEnglish(label) : label;

    let count = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) return frag.append(" ");
            const word = document.createElement("span");
            word.className = "w";
            for (const letter of part) {
              const ch = document.createElement("span");
              ch.className = "ch";
              ch.textContent = letter;
              ch.style.setProperty("--i", count);
              ch.style.setProperty("--dx", `${Math.round((rand(count) - 0.5) * 60)}px`);
              ch.style.setProperty("--dy", `${Math.round(24 + rand(count + 99) * 36)}px`);
              ch.style.setProperty("--dr", `${Math.round((rand(count + 7) - 0.5) * 50)}deg`);
              word.append(ch);
              count += 1;
            }
            frag.append(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    };

    walk(el);
    el.setAttribute("aria-label", label);
    el.querySelectorAll(".w").forEach((w) => w.setAttribute("aria-hidden", "true"));
    // The whole headline takes at most ~0.7s to assemble, however long it is.
    el.style.setProperty("--step", `${Math.min(26, Math.round(700 / count))}ms`);
    el.classList.add("fx-split");
    return true;
  }

  if (!reduceMotion && "IntersectionObserver" in window) {
    const so = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          so.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.2 },
    );
    const headings = new Set(SPLIT.flatMap((sel) => Array.from(document.querySelectorAll(sel))));
    headings.forEach((el) => {
      // A heading that is also in the reveal list would animate twice.
      el.classList.remove("rv");
      if (splitHeading(el)) so.observe(el);
    });

    // Language change: rebuild the letters from the new text, already assembled.
    document.addEventListener("i18n:change", () => {
      headings.forEach((el) => {
        if (!el.dataset.en) return;
        const wasIn = el.classList.contains("in");
        el.classList.remove("fx-split", "in");
        el.textContent = window.t(el.dataset.en);
        if (splitHeading(el) && wasIn) el.classList.add("in");
      });
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

  /* Trending cards: 3D tilt toward the pointer (mouse and pen only) */
  if (!reduceMotion && matchMedia("(hover: hover)").matches) {
    document.querySelectorAll(".trending .games .block").forEach((card) => {
      const img = card.querySelector(":scope > img");
      if (!img) return;
      let frame = 0;
      card.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const box = img.getBoundingClientRect();
          const x = Math.max(-1, Math.min(1, ((event.clientX - box.left) / box.width) * 2 - 1));
          const y = Math.max(-1, Math.min(1, ((event.clientY - box.top) / box.height) * 2 - 1));
          img.style.setProperty("--ry", (x * 12).toFixed(2) + "deg");
          img.style.setProperty("--rx", (-y * 10).toFixed(2) + "deg");
          img.style.setProperty("--s", "1.03");
        });
      });
      card.addEventListener("pointerleave", () => {
        cancelAnimationFrame(frame);
        img.style.removeProperty("--ry");
        img.style.removeProperty("--rx");
        img.style.removeProperty("--s");
      });
    });
  }
})();
