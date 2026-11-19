// GitHub Pages has no server-side routing: a request for /about returns 404.html.
// Serving the app shell as 404.html lets React Router handle every address.
import { copyFile } from "node:fs/promises";

await copyFile(new URL("../dist/index.html", import.meta.url), new URL("../dist/404.html", import.meta.url));
console.log("Created dist/404.html (single-page-app fallback for GitHub Pages)");
