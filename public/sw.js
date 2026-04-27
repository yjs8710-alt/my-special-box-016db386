self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch {
        // ignore
      }

      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      await Promise.all(
        clientsList.map((client) => {
          const url = new URL(client.url);
          url.searchParams.set("v", `${Date.now()}`);
          return client.navigate(url.toString());
        })
      );
    })()
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request, { cache: "no-store" }));
});