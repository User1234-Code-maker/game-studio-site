// Runs before the page paints, so the saved theme never flashes the wrong colours.
// (A separate file instead of an inline script keeps the Content-Security-Policy strict.)
document.documentElement.classList.add("js");
try {
  document.documentElement.dataset.theme = localStorage.getItem("theme") === "light" ? "light" : "dark";
} catch {
  document.documentElement.dataset.theme = "dark";
}
