// 집다 PWA Service Worker
// 배포할 때마다 CACHE_VERSION 을 갱신하면 자동으로 캐시가 교체됩니다.
const CACHE_NAME = "jibda-pwa-v20260426-02";
const APP_SHELL = [
  "/",
  "/?source=pwa&v=20260426-02",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
];

// 설치: 앱 셸 프리캐시
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 옛 버전 캐시 모두 제거
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve(false);
          })
        )
      )
  );
  self.clients.claim();
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

  // HTML 네비게이션: 네트워크 우선, 실패 시 캐시된 "/" 폴백 (오프라인용)
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put("/", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("/").then((r) => r || Response.error()))
    );
    return;
  }

  // 정적 자산: 캐시 우선, 백그라운드 갱신
  if (
    req.destination === "image" ||
    req.destination === "script" ||
    req.destination === "style" ||
    req.destination === "font"
  ) {
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
