const header = document.querySelector("header");
const menuToggle = document.querySelector(".menu-toggle");

function setMenu(open) {
  if (!header || !menuToggle) return;
  header.classList.toggle("menu-open", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
}

if (header && menuToggle) {
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
  emailForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const value = emailField.value.trim();
    emailMessage.classList.remove("error", "success");

    if (!emailPattern.test(value)) {
      emailMessage.textContent = "Enter a valid email address.";
      emailMessage.classList.add("error");
      return;
    }

    emailMessage.textContent = "Thanks! You are subscribed.";
    emailMessage.classList.add("success");
    emailField.value = "";
  });
}
