// 집다 Service Worker 제거용 파일: 더 이상 어떤 요청도 캐시하지 않으며 즉시 자신을 unregister 합니다.
const CACHE_VERSION = "v2-2026-04-27";

// 설치: 즉시 활성화
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

// 활성화: 모든 옛 캐시 삭제 + 즉시 클라이언트 제어
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      await self.clients.claim();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => {
        try {
          client.postMessage({ type: "SW_UPDATED", version: CACHE_VERSION });
        } catch {}
      });
    })()
  );
});

// 메시지로 즉시 갱신 트리거 가능
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// fetch 전략: 어떤 웹 화면/이미지/JS/CSS도 SW 캐시에 저장하거나 캐시에서 응답하지 않음
self.addEventListener("fetch", (event) => {
  if (event.request.method === "GET") {
    event.respondWith(fetch(event.request, { cache: "no-store" }));
  }
});
