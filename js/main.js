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
