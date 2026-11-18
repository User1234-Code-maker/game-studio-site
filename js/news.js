const searchForm = document.getElementById("newsSearch");

if (searchForm) {
  const input = document.getElementById("searchInput");
  const articles = Array.from(document.querySelectorAll(".news-big, .news-side"));
  const divider = document.querySelector(".news-main hr");
  const empty = document.getElementById("newsEmpty");
  let timer = null;
  let latest = 0;

  function render(matches) {
    let visible = 0;
    articles.forEach((article) => {
      const match = matches(article);
      article.hidden = !match;
      if (match) visible += 1;
    });

    // The divider only makes sense when both large articles are visible.
    const bigVisible = document.querySelectorAll(".news-big:not([hidden])").length;
    if (divider) divider.hidden = bigVisible < 2;
    if (empty) empty.hidden = visible > 0;
  }

  // Browser-only search, used when there is no API (static hosting).
  function localMatch(query) {
    return (article) => {
      const text = (article.textContent + " " + (article.dataset.search || "")).toLowerCase();
      return !query || text.includes(query);
    };
  }

  async function search() {
    const query = input.value.trim().toLowerCase();
    if (!query) return render(() => true);

    const request = ++latest;
    const reply = window.siteApi ? await window.siteApi.get(`/news?q=${encodeURIComponent(query)}`) : { offline: true };
    if (request !== latest) return; // a newer search is already running

    if (reply.ok) {
      const ids = new Set(reply.data.items.map((item) => item.id));
      render((article) => ids.has(article.dataset.id));
    } else {
      render(localMatch(query));
    }
  }

  searchForm.addEventListener("submit", (event) => event.preventDefault());
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(search, 200);
  });
}
