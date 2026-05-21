import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { RootErrorBoundary } from "./components/RootErrorBoundary";
import { initSentry } from "./lib/sentry";

// ── Global error handler — shows errors even if React fails to mount ──────
window.addEventListener("error", (e) => {
  console.error("[GLOBAL ERROR]", e.error || e.message);
  const root = document.getElementById("root");
  if (root && !root.hasChildNodes()) {
    root.innerHTML = `<div style="padding:2rem;color:#fca5a5;background:#0f172a;min-height:100vh;font-family:monospace">
      <h1 style="color:#e5e7eb">Uygulama Hatası</h1>
      <pre style="margin-top:1rem;white-space:pre-wrap">${e.message || "Bilinmeyen hata"}</pre>
      <button onclick="location.reload()" style="margin-top:1rem;padding:8px 16px;background:#2563eb;color:white;border:none;border-radius:6px;cursor:pointer">Yeniden Yükle</button>
    </div>`;
  }
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("[UNHANDLED PROMISE]", e.reason);
});

// ── Sentry APM ────────────────────────────────────────────────────────────
initSentry();

createRoot(document.getElementById("root")!).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);
