const header = document.querySelector("header");
const menuToggle = document.querySelector(".menu-toggle");

function setMenu(open) {
  if (!header || !menuToggle) return;
  header.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", t(open ? "Close menu" : "Open menu"));
}

if (header && menuToggle) {
  document.addEventListener("i18n:change", () => setMenu(header.classList.contains("menu-open")));
  setMenu(false);
  menuToggle.addEventListener("click", () => {
    setMenu(!header.classList.contains("menu-open"));
  });

  header.querySelectorAll("nav a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });
}

const emailForm = document.querySelector(".email-form");
const emailField = document.querySelector("#emailField");
const emailMessage = document.querySelector("#emailMessage");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

if (emailForm && emailField && emailMessage) {
  emailForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const value = emailField.value.trim();
    emailMessage.classList.remove("error", "success");

    if (!emailPattern.test(value)) {
      emailMessage.textContent = t("Enter a valid email address.");
      emailMessage.classList.add("error");
      return;
    }

    const reply = window.siteApi ? await window.siteApi.post("/subscribe", { email: value }) : { offline: true };
    const failed = !reply.offline && !reply.ok;

    emailMessage.textContent = failed
      ? t(reply.data?.error || "Could not subscribe. Please try again.")
      : reply.offline
        ? t("Thanks! This is a demo site, so nothing was saved.")
        : t(reply.data.message);
    emailMessage.classList.add(failed ? "error" : "success");
    if (!failed) emailField.value = "";
  });
}
