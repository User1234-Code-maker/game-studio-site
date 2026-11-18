/* "Oops" dialog for links that go nowhere yet (this is a portfolio project).
   Any <a href="#"> opens it. Use data-oops="Name" on a link to say what is
   missing; otherwise the link's aria-label or text is used. */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let dialog = null;
  let lastFocus = null;

  function build() {
    dialog = document.createElement("div");
    dialog.className = "oops";
    dialog.hidden = true;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "oopsTitle");
    dialog.setAttribute("aria-describedby", "oopsText");
    dialog.innerHTML = `
      <div class="oops__backdrop"></div>
      <div class="oops__card">
        <button type="button" class="oops__close" aria-label="Close">&times;</button>
        <img class="oops__art" src="img/oops-controller.svg" alt="" width="240" height="180" />
        <h2 class="oops__title" id="oopsTitle" aria-label="Oops!"></h2>
        <p class="oops__text" id="oopsText"></p>
        <p class="oops__hint">Portfolio project: this link goes nowhere yet.</p>
        <button type="button" class="oops__ok">Got it</button>
      </div>`;

    const title = dialog.querySelector(".oops__title");
    Array.from("Oops!").forEach((letter, i) => {
      const span = document.createElement("span");
      span.className = "ch";
      span.setAttribute("aria-hidden", "true");
      span.style.setProperty("--i", i);
      span.textContent = letter;
      title.append(span);
    });

    dialog.querySelector(".oops__backdrop").addEventListener("click", close);
    dialog.querySelector(".oops__close").addEventListener("click", close);
    dialog.querySelector(".oops__ok").addEventListener("click", close);
    document.body.append(dialog);
  }

  const nameOf = (link) => {
    const label = link.dataset.oops || link.getAttribute("aria-label") || link.textContent.trim();
    return label ? label.charAt(0).toUpperCase() + label.slice(1).toLowerCase() : "This page";
  };

  function open(link) {
    if (!dialog) build();
    lastFocus = document.activeElement;
    const name = nameOf(link);
    // Network names are brands, so they stay capitalised as typed in the label.
    dialog.querySelector(".oops__text").textContent = link.dataset.oops
      ? `${link.dataset.oops} isn't plugged in yet.`
      : `Our ${name} page isn't plugged in yet.`;

    dialog.classList.remove("is-closing");
    dialog.hidden = false;
    document.documentElement.classList.add("oops-open");
    dialog.querySelector(".oops__ok").focus({ preventScroll: true });
  }

  function close() {
    if (!dialog || dialog.hidden) return;
    const finish = () => {
      dialog.hidden = true;
      dialog.classList.remove("is-closing");
      document.documentElement.classList.remove("oops-open");
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    if (reduceMotion) return finish();
    dialog.classList.add("is-closing");
    setTimeout(finish, 180);
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href="#"]');
    if (!link) return;
    event.preventDefault();
    open(link);
  });

  document.addEventListener("keydown", (event) => {
    if (!dialog || dialog.hidden) return;
    if (event.key === "Escape") return close();
    if (event.key !== "Tab") return;

    // Keep keyboard focus inside the dialog.
    const items = Array.from(dialog.querySelectorAll("button"));
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
})();
