// Service Worker — Muğla Monitör PWA + Offline Cache (M3)
// Handles: offline caching, push notifications, background sync

const CACHE_NAME = "mugla-monitor-v2";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico",
];

// ── Install: cache static assets ────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Non-fatal: continue even if some assets fail to cache
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  event.waitUntil(clients.claim());
});

// ── Fetch: stale-while-revalidate for pages, cache-first for static ──────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and external API requests
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Skip Supabase requests (always fresh)
  if (url.hostname.includes("supabase")) return;

  // Navigation requests: network-first, fallback to cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Static assets: cache-first
  if (url.pathname.match(/\.(js|css|ico|png|svg|woff2?)$/)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        });
      })
    );
    return;
  }
});

// ── Push: show notifications ────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || "Yeni bildirim",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    vibrate: [200, 100, 200],
    tag: data.tag || "mugla-alert",
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "Aç" },
      { action: "dismiss", title: "Kapat" },
    ],
  };

  if (data.severity === "critical") {
    options.requireInteraction = true;
    options.vibrate = [500, 200, 500, 200, 500];
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Muğla Monitör", options)
  );
});

// ── Notification click ──────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
