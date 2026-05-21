import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { RootErrorBoundary } from "./components/RootErrorBoundary";
import { initSentry } from "./lib/sentry";

// ── Sentry APM (Madde 12) ────────────────────────────────────────────────
initSentry();

// ── Service Worker / PWA (Madde 10) ───────────────────────────────────────
// Only register SW in production when sw.js actually exists
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    // Check if sw.js exists before trying to register
    fetch("/sw.js", { method: "HEAD" })
      .then((res) => {
        if (res.ok) {
          navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
        }
      })
      .catch(() => {});
  });
}

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
