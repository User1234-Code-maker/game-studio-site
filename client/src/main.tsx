import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./i18n";
import { ThemeProvider } from "@/components/ThemeProvider";
import { App } from "./App";

// Order matters: later files refine earlier ones (same order the pages used before).
import "./styles/main.css";
import "./styles/about.css";
import "./styles/contact.css";
import "./styles/news.css";
import "./styles/services.css";
import "./styles/effects.css";
import "./styles/theme.css";
import "./styles/oops.css";
import "./styles/stickers.css";
import "./styles/order.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root not found");

createRoot(root).render(
  <StrictMode>
    {/* BASE_URL is "/game-studio-site/" on GitHub Pages and "/" everywhere else. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
