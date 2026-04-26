// 집다 PWA Service Worker
// ※ CACHE_NAME 의 버전 문자열을 바꾸면 자동으로 옛 캐시가 모두 제거되고
//    최신 빌드(index.html / JS / CSS / 이미지)가 다시 다운로드됩니다.
const CACHE_VERSION = "v2026-04-27-02";
const CACHE_NAME = `jibda-cache-${CACHE_VERSION}`;

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
      // 현재 버전이 아닌 모든 캐시(jibda-* 포함, 이전 prefix 도) 삭제
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

  // HTML 네비게이션: 항상 네트워크 우선 (HTML 은 절대 캐시에 저장하지 않음)
  if (req.mode === "navigate" || req.destination === "document") {
    event.respondWith(
      fetch(req, { cache: "no-store" }).catch(() =>
        caches.match("/").then((r) => r || Response.error())
      )
    );
    return;
  }

  if (url.pathname === "/" || url.pathname.endsWith(".html")) {
    event.respondWith(fetch(req, { cache: "no-store" }).catch(() => caches.match(req)));
    return;
  }

  // manifest.json 도 항상 네트워크 우선
  if (url.pathname.endsWith("/manifest.json") || url.pathname.endsWith(".webmanifest")) {
    event.respondWith(
      fetch(req, { cache: "no-store" }).catch(() => caches.match(req))
    );
    return;
  }

  // JS/CSS: 네트워크 우선, 실패 시 캐시 폴백
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

  // 이미지/폰트: 캐시 우선 + 백그라운드 갱신
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
