// Offline-Fähigkeit: alle Dateien liegen im Speicher; bei neuer Version CACHE hochzählen.
const CACHE = "kaffeekarte-v4";
const FILES = ["./", "./index.html", "./style.css?v=2", "./app.js?v=1", "./qr.html", "./qr.js?v=2", "./qrcode.js",
  "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png",
  "./theke/", "./theke/index.html", "./theke/theke.css?v=2", "./theke/store.js?v=2", "./theke/theke.js?v=2", "./theke/jsQR.js",
  "./theke/karten.html", "./theke/karten.js?v=2", "./theke/manifest.webmanifest"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  // Speicher zuerst (sofortiger Start, auch offline); im Hintergrund aktualisieren
  e.respondWith(caches.match(e.request, { ignoreSearch: e.request.mode === "navigate" }).then((hit) => {
    const net = fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
