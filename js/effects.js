(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Scroll reveal ---------- */
  const groups = [
    [".hero--info > *", ""],
    [".trending > .title, .trending h3, .trending .see-all", ""],
    [".trending .games .block", ""],
    [".big-text", ""],
    [".banner > *", ""],
    [".features .container > h3, .features .container > p", ""],
    [".features .info .block", ""],
    [".projects > h3, .projects > p", ""],
    [".projects .images img", ""],
    [".projects .see-all", ""],
    [".email > h3, .email > p, .email .block", ""],
    ["footer .block > div", ""],
    [".about-hero__info > *", ""],
    [".slider", "reveal--right"],
    [".why h2, .team h2", ""],
    [".why-card, .team-card", ""],
    [".story__img", "reveal--left"],
    [".story__text > *", ""],
    [".contact-hero > *:not(.map):not(.contact-hero__dot), .map-stats, .chips", ""],
    [".contact-info__follow, .contact-info__item", ""],
    [".say-hello h2, .say-hello__lead, .contact-form .field, .contact-form__actions", ""],
    [".news-hero > *:not(.news-hero__dot)", ""],
    [".news-big, .news-side", ""],
  ];

  const targets = [];
  groups.forEach(([selector, variant]) => {
    document.querySelectorAll(selector).forEach((el) => {
      if (el.classList.contains("reveal")) return;
      el.classList.add("reveal");
      if (variant) el.classList.add(variant);
      // Stagger siblings that belong to the same group.
      const siblings = Array.from(el.parentElement.children).filter((s) => s.matches(selector));
      const index = Math.max(0, siblings.indexOf(el));
      el.style.setProperty("--d", `${Math.min(index, 6) * 90}ms`);
      targets.push(el);
    });
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("in"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    targets.forEach((el) => io.observe(el));
  }

  /* ---------- Count-up numbers ---------- */
  const counters = document.querySelectorAll("[data-count]");
  function runCounter(el) {
    const end = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduceMotion) {
      el.textContent = end + suffix;
      return;
    }
    const duration = 1500;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(end * eased) + suffix;
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

  /* ---------- Progress bar + back to top ---------- */
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");

  const toTop = document.createElement("button");
  toTop.type = "button";
  toTop.className = "to-top";
  toTop.setAttribute("aria-label", "Back to top");
  toTop.innerHTML =
    '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13V3M3 7.500 8 2.500l5 5" fill="none" stroke="currentColor" stroke-width="1.800" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));
  document.body.append(bar, toTop);

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? window.scrollY / max : 0;
      bar.style.transform = `scaleX(${progress})`;
      toTop.classList.toggle("is-shown", window.scrollY > 700);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Pointer effects (desktop only) ---------- */
  if (canHover && !reduceMotion) {
    const spot = document.createElement("div");
    spot.className = "spotlight";
    spot.setAttribute("aria-hidden", "true");
    document.body.append(spot);

    let raf = 0;
    window.addEventListener(
      "pointermove",
      (event) => {
        spot.classList.add("is-on");
        if (raf) return;
        raf = requestAnimationFrame(() => {
          spot.style.setProperty("--mx", `${event.clientX}px`);
          spot.style.setProperty("--my", `${event.clientY}px`);
          raf = 0;
        });
      },
      { passive: true },
    );
    document.addEventListener("mouseleave", () => spot.classList.remove("is-on"));

    // 3D tilt on cards.
    document
      .querySelectorAll(".trending .games .block, .why-card, .team-card, .features .info .block")
      .forEach((card) => {
        card.setAttribute("data-tilt", "");
        card.addEventListener("pointermove", (event) => {
          const r = card.getBoundingClientRect();
          const px = (event.clientX - r.left) / r.width - 0.5;
          const py = (event.clientY - r.top) / r.height - 0.5;
          card.style.setProperty("--ry", `${(px * 8).toFixed(2)}deg`);
          card.style.setProperty("--rx", `${(-py * 8).toFixed(2)}deg`);
        });
        card.addEventListener("pointerleave", () => {
          card.style.setProperty("--rx", "0deg");
          card.style.setProperty("--ry", "0deg");
        });
      });
  }

  /* ---------- Contact form: shake invalid fields ---------- */
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
