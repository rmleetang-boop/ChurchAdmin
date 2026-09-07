const CACHE_NAME = "churchflow-shell-v2";
const OFFLINE_PAGE = "/offline.html";

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const response = await fetch(OFFLINE_PAGE, { cache: "reload" });
    if (!response.ok) throw new Error("Offline page could not be loaded");
    const cache = await caches.open(CACHE_NAME);
    await cache.put(OFFLINE_PAGE, response);
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const obsolete = names.filter(name => name.startsWith("churchflow-shell-") && name !== CACHE_NAME);
    await Promise.all(obsolete.map(name => caches.delete(name)));
    await self.clients.claim();
    // Old HTML can fail before React starts, so recovery must not depend on React.
    if (obsolete.length) {
      const windows = await self.clients.matchAll({ type: "window" });
      await Promise.allSettled(windows.map(client => client.navigate(client.url)));
    }
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  // Never store authentication, private API responses or third-party requests.
  if (url.origin !== self.location.origin || url.pathname === "/api" || url.pathname.startsWith("/api/")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request, { cache: "no-store" }).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(OFFLINE_PAGE)) || Response.error();
    }));
    return;
  }

  // Only successful fingerprinted build assets are immutable. Never use HTML
  // as a fallback for a script: browsers reject it and leave an empty app root.
  if (!/^\/assets\/[^/]+-[\w-]{8,}\.[\w]+$/.test(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    if (cached) return cached;
    const response = await fetch(event.request);
    if (response.ok && !response.headers.get("content-type")?.includes("text/html")) {
      try { await cache.put(event.request, response.clone()); } catch { /* Cache quota must not break loading. */ }
    }
    return response;
  })());
});
