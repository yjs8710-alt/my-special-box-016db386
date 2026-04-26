// 집다 PWA Service Worker
// 배포할 때마다 CACHE_VERSION 을 갱신하면 자동으로 캐시가 교체됩니다.
const CACHE_NAME = "jibda-pwa-v20260426-04";
const APP_SHELL = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
];

// 설치: 앱 셸 프리캐시 + 즉시 활성화
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 옛 버전 캐시 모두 제거 + 즉시 클라이언트 제어
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : Promise.resolve(false)))
      );
      await self.clients.claim();
      // 모든 열린 클라이언트에 새 버전 알림 → 강제 새로고침
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => {
        try {
          client.postMessage({ type: "SW_UPDATED", version: CACHE_NAME });
        } catch {}
      });
    })()
  );
});

// 메시지로 즉시 갱신 트리거 가능
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

// fetch 전략
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // GET 이외 요청은 패스
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 외부 도메인(API, 카카오 SDK 등)은 캐시하지 않음
  if (url.origin !== self.location.origin) return;

  // Supabase / functions / auth 등 동적 경로는 절대 캐싱 안 함
  if (
    url.pathname.startsWith("/auth") ||
    url.pathname.startsWith("/functions") ||
    url.pathname.startsWith("/rest") ||
    url.pathname.startsWith("/realtime")
  ) {
    return;
  }

  // HTML 네비게이션: 항상 네트워크 우선, 캐시는 오프라인 폴백 용도로만 사용 (절대 HTML 을 캐시에 저장하지 않음)
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(req, { cache: "no-store" }).catch(() =>
        caches.match("/").then((r) => r || Response.error())
      )
    );
    return;
  }

  // index.html 자체 요청도 절대 캐싱 안 함
  if (url.pathname === "/" || url.pathname.endsWith(".html")) {
    event.respondWith(fetch(req, { cache: "no-store" }).catch(() => caches.match(req)));
    return;
  }

  // JS/CSS: 네트워크 우선 (최신 빌드 해시 즉시 반영), 실패 시 캐시 폴백
  if (req.destination === "script" || req.destination === "style") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 이미지/폰트: 캐시 우선 + 백그라운드 갱신 (성능)
  if (req.destination === "image" || req.destination === "font") {
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
        return cached || fetchPromise;
      })
    );
  }
});
