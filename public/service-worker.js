// 서비스워커 제거용 kill-switch.
// 과거에 /service-worker.js 경로로 설치된 경우까지 함께 정리합니다.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      await Promise.all(
        clients.map((client) => {
          const url = new URL(client.url);
          if (url.searchParams.get("sw-cleanup") === "1") return Promise.resolve(client);
          url.searchParams.set("sw-cleanup", "1");
          return client.navigate(url.toString());
        })
      );
      await self.registration.unregister();
    })()
  );
});