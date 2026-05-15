// 서비스워커 제거용 kill-switch.
// 예전 서비스워커가 빈 화면/구버전 앱을 계속 제공하는 기기를 강제로 정상 네트워크 로딩으로 되돌립니다.
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

// fetch 핸들러 없음: 모든 요청은 브라우저/서버 기본 캐시 정책을 따릅니다.
