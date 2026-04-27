self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      } catch {
        // ignore
      }

      try {
        await self.registration.unregister();
      } catch {
        // ignore
      }

      const clientsList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      await Promise.all(clientsList.map((client) => client.navigate(client.url)));
    })()
  );
});

self.addEventListener("fetch", () => {
  return;
});