// 집다 Service Worker: 웹 화면 캐시에 관여하지 않음
// Naver/Kakao 내장 브라우저에서 오래된 화면이 남지 않도록 모든 Cache Storage 를 정리하고 네트워크만 사용합니다.
const CACHE_VERSION = "v2026-04-27-04";

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
