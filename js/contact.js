const form = document.getElementById("contactForm");

if (form) {
  const status = document.getElementById("contactStatus");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const rules = {
    firstName: (v) => (v ? "" : "Please enter your first name."),
    lastName: (v) => (v ? "" : "Please enter your last name."),
    contactEmail: (v) => (emailPattern.test(v) ? "" : "Enter a valid email address."),
    contactMessage: (v) => (v.length >= 10 ? "" : "Message should be at least 10 characters."),
  };

  function validate(input) {
    const message = rules[input.id](input.value.trim());
    const error = input.parentElement.querySelector(".field__error");
    error.textContent = message;
    input.classList.toggle("is-invalid", Boolean(message));
    input.setAttribute("aria-invalid", message ? "true" : "false");
    return !message;
  }

  const inputs = Array.from(form.querySelectorAll("input, textarea"));

  inputs.forEach((input) => {
    input.addEventListener("blur", () => validate(input));
    input.addEventListener("input", () => {
      if (input.classList.contains("is-invalid")) validate(input);
    });
  });

  const fieldIds = { firstName: "firstName", lastName: "lastName", email: "contactEmail", message: "contactMessage" };
  const submitButton = form.querySelector('[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const results = inputs.map(validate);
    status.classList.remove("success");

    if (!results.every(Boolean)) {
      status.textContent = "";
      inputs.find((input) => input.classList.contains("is-invalid")).focus();
      return;
    }

    submitButton.disabled = true;
    const value = (id) => document.getElementById(id).value.trim();
    const reply = await window.siteApi.post("/contact", {
      firstName: value("firstName"),
      lastName: value("lastName"),
      email: value("contactEmail"),
      message: value("contactMessage"),
    });
    submitButton.disabled = false;

    if (reply.offline) {
      // Static hosting: nothing can store the message, so say so honestly.
      status.textContent = "Thanks! This is a demo site, so the message was not sent.";
      status.classList.add("success");
      form.reset();
    } else if (reply.ok) {
      status.textContent = reply.data.message;
      status.classList.add("success");
      form.reset();
    } else if (reply.status === 422) {
      Object.entries(reply.data.details || {}).forEach(([key, message]) => {
        const input = document.getElementById(fieldIds[key]);
        if (!input) return;
        input.parentElement.querySelector(".field__error").textContent = message;
        input.classList.add("is-invalid");
      });
      status.textContent = "";
    } else {
      status.textContent = reply.data?.error || "Could not send the message. Please try again.";
    }
  });
}

/* ---------- Interactive office map ---------- */
const officeMap = document.getElementById("officeMap");

if (officeMap) {
  const pins = Array.from(officeMap.querySelectorAll(".pin"));
  const chips = Array.from(document.querySelectorAll(".chip"));
  const arc = officeMap.querySelector(".map__arc");
  const hq = officeMap.querySelector(`.pin[data-id="${officeMap.dataset.hq}"]`);
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let pinned = null;
  let closeTimer = null;

  // Reveal animation when the map scrolls into view.
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          officeMap.classList.add("is-visible");
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(officeMap);
  } else {
    officeMap.classList.add("is-visible");
  }

  const pos = (pin) => ({
    x: parseFloat(pin.style.getPropertyValue("--x")),
    y: parseFloat(pin.style.getPropertyValue("--y")),
  });

  // Keep the popup inside the viewport and flip it below the pin near the top.
  function placeCard(pin) {
    const card = pin.querySelector(".pin__card");
    card.style.setProperty("--shift", "0px");
    card.classList.remove("is-below");

    const pinRect = pin.getBoundingClientRect();
    if (pinRect.top < card.offsetHeight + 40) card.classList.add("is-below");

    const margin = 12;
    const half = card.offsetWidth / 2;
    const center = pinRect.left;
    let shift = 0;
    if (center - half < margin) shift = margin - (center - half);
    else if (center + half > window.innerWidth - margin) shift = window.innerWidth - margin - (center + half);
    card.style.setProperty("--shift", `${shift}px`);
  }

  function drawArc(pin) {
    if (!arc || !hq || pin === hq) {
      arc && arc.classList.remove("is-on");
      return;
    }
    const a = pos(hq);
    const b = pos(pin);
    const mx = (a.x + b.x) / 2;
    const my = Math.min(a.y, b.y) - Math.hypot(a.x - b.x, a.y - b.y) * 0.28;
    arc.setAttribute("d", `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`);
    arc.classList.add("is-on");
  }

  function open(pin) {
    clearTimeout(closeTimer);
    pins.forEach((p) => {
      const isThis = p === pin;
      p.classList.toggle("is-open", isThis);
      p.classList.toggle("is-dim", !isThis);
      p.querySelector(".pin__btn").setAttribute("aria-expanded", String(isThis));
    });
    chips.forEach((c) => c.classList.toggle("is-active", c.dataset.target === pin.dataset.id));
    placeCard(pin);
    drawArc(pin);
  }

  function closeAll() {
    pinned = null;
    pins.forEach((p) => {
      p.classList.remove("is-open", "is-dim");
      p.querySelector(".pin__btn").setAttribute("aria-expanded", "false");
    });
    chips.forEach((c) => c.classList.remove("is-active"));
    arc && arc.classList.remove("is-on");
  }

  pins.forEach((pin) => {
    const btn = pin.querySelector(".pin__btn");

    btn.addEventListener("click", (event) => {
      event.stopPropagation();
      if (pinned === pin) {
        closeAll();
      } else {
        pinned = pin;
        open(pin);
      }
    });

    if (canHover) {
      pin.addEventListener("mouseenter", () => {
        if (!pinned) open(pin);
      });
      pin.addEventListener("mouseleave", () => {
        if (pinned) return;
        closeTimer = setTimeout(closeAll, 180);
      });
    }

    btn.addEventListener("focus", () => {
      if (!pinned) open(pin);
    });
  });

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const pin = pins.find((p) => p.dataset.id === chip.dataset.target);
      if (!pin) return;
      if (pinned === pin) {
        closeAll();
        return;
      }
      pinned = pin;
      open(pin);
      officeMap.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".pin, .chip")) closeAll();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAll();
  });

  window.addEventListener("resize", () => {
    const current = pins.find((p) => p.classList.contains("is-open"));
    if (current) placeCard(current);
  });
}
