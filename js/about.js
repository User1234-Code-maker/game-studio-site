const slider = document.querySelector("[data-slider]");

if (slider) {
  const slides = Array.from(slider.querySelectorAll(".slider__slide"));
  const counter = slider.querySelector("[data-current]");
  const total = slider.querySelector("[data-total]");
  let index = 0;

  if (total) total.textContent = String(slides.length);

  function show(next) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-active", i === index);
    });
    if (counter) counter.textContent = String(index + 1);
  }

  slider.querySelector("[data-prev]").addEventListener("click", () => show(index - 1));
  slider.querySelector("[data-next]").addEventListener("click", () => show(index + 1));

  slider.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(index - 1);
    if (event.key === "ArrowRight") show(index + 1);
  });
}
