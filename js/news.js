const searchForm = document.getElementById("newsSearch");

if (searchForm) {
  const input = document.getElementById("searchInput");
  const articles = Array.from(document.querySelectorAll(".news-big, .news-side"));
  const divider = document.querySelector(".news-main hr");
  const empty = document.getElementById("newsEmpty");

  function filter() {
    const query = input.value.trim().toLowerCase();
    let visible = 0;

    articles.forEach((article) => {
      const haystack = (article.textContent + " " + (article.dataset.search || "")).toLowerCase();
      const match = !query || haystack.includes(query);
      article.hidden = !match;
      if (match) visible += 1;
    });

    // The divider only makes sense when both large articles are visible.
    const bigVisible = document.querySelectorAll(".news-big:not([hidden])").length;
    if (divider) divider.hidden = bigVisible < 2;
    if (empty) empty.hidden = visible > 0;
  }

  searchForm.addEventListener("submit", (event) => event.preventDefault());
  input.addEventListener("input", filter);
}
