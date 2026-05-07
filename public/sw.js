// Service Worker for Muğla Monitor Push Notifications
// Handles critical alerts: earthquake, fire, flood, security

const CACHE_NAME = "mugla-monitor-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Handle push messages
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || "Yeni bildirim",
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "mugla-alert",
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "Aç" },
      { action: "dismiss", title: "Kapat" },
    ],
  };

  // Critical alerts get requireInteraction
  if (data.severity === "critical") {
    options.requireInteraction = true;
    options.vibrate = [500, 200, 500, 200, 500];
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Muğla Monitor", options)
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
