/* Thin client for the Node.js API (server/).
   On static hosting (GitHub Pages) there is no API, so every call reports
   `offline: true` and callers fall back to a browser-only behaviour. */
window.siteApi = (() => {
  async function request(path, options = {}) {
    try {
      const response = await fetch(`/api${path}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const type = response.headers.get("content-type") || "";
      // No backend: the host answers with 404/405 or an HTML page.
      if (!type.includes("application/json")) return { offline: true };

      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    } catch {
      return { offline: true };
    }
  }

  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: "POST", body }),
  };
})();
