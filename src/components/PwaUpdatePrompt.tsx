import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";

/**
 * PWA update prompt + production-grade SW registration.
 *
 * Behavior:
 * - Skips registration entirely inside Lovable preview iframes / preview hosts
 *   (prevents the editor preview from getting stuck on stale builds).
 * - In Naver / Kakao in-app browsers, appends a build-id query param on first
 *   visit to bust their aggressive HTML cache (no auto-redirect).
 * - When a new SW is waiting, shows an "업데이트" toast that triggers
 *   updateServiceWorker(true) → skipWaiting + reload all clients.
 */
export function PwaUpdatePrompt() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const host = window.location.hostname;
    const isPreviewHost =
      host.includes("id-preview--") ||
      host.includes("lovableproject.com") ||
      host.includes("lovable.dev");

    let inIframe = false;
    try {
      inIframe = window.self !== window.top;
    } catch {
      inIframe = true;
    }

    if (isPreviewHost || inIframe) {
      // Make sure no stale SW is left around in preview contexts
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => regs.forEach((r) => r.unregister()))
          .catch(() => {});
      }
      if (typeof caches !== "undefined") {
        caches
          .keys()
          .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
          .catch(() => {});
      }
      return;
    }

    // In-app browser cache busting (Naver / Kakao / Line / Instagram / Facebook)
    // 인앱 브라우저는 HTML/JS 캐시가 매우 공격적이라 단순 URL bump만으로는
    // 새 빌드가 반영되지 않음 → 빌드ID가 바뀌면 모든 캐시 + SW 제거 후 hard reload.
    const ua = navigator.userAgent || "";
    const isInApp = /NAVER|Whale|KAKAOTALK|kakaotalk|Line|Instagram|FBAN|FBAV/i.test(ua);
    if (isInApp) {
      const url = new URL(window.location.href);
      const current = url.searchParams.get("_bv");
      if (current !== __APP_BUILD_ID__) {
        url.searchParams.set("_bv", __APP_BUILD_ID__);

        // 캐시 + SW 정리 후 새 빌드로 강제 이동
        const purge = async () => {
          try {
            if (typeof caches !== "undefined") {
              const keys = await caches.keys();
              await Promise.all(keys.map((k) => caches.delete(k)));
            }
            if ("serviceWorker" in navigator) {
              const regs = await navigator.serviceWorker.getRegistrations();
              await Promise.all(regs.map((r) => r.unregister()));
            }
          } catch {
            // ignore
          } finally {
            // hard reload — 인앱 브라우저 HTML 캐시까지 우회
            window.location.replace(url.toString());
          }
        };
        purge();
        return; // 리로드 예정이므로 SW 등록 보류
      }

      // 빌드ID 일치 시: 진입 때마다 백그라운드에서 새 HTML이 있는지 확인
      // (HEAD 요청 → ETag/Last-Modified 변동 시 reload)
      fetch("/index.html", { cache: "no-store" })
        .then((res) => res.text())
        .then((html) => {
          const match = html.match(/__APP_BUILD_ID__\s*[:=]\s*"(\d+)"/);
          // 인앱에서는 위 패턴이 안 잡히므로 단순히 main.tsx 해시 변동을 본다
          const scriptMatch = html.match(/\/assets\/index-([a-zA-Z0-9_-]+)\.js/);
          const currentScript = document
            .querySelector('script[src*="/assets/index-"]')
            ?.getAttribute("src");
          if (
            scriptMatch &&
            currentScript &&
            !currentScript.includes(scriptMatch[1])
          ) {
            // 새 번들 감지 → 캐시 비우고 reload
            if (typeof caches !== "undefined") {
              caches.keys().then((keys) =>
                Promise.all(keys.map((k) => caches.delete(k))).then(() => {
                  window.location.reload();
                })
              );
            } else {
              window.location.reload();
            }
          }
        })
        .catch(() => {});
    }

    setEnabled(true);
  }, []);

  if (!enabled) return null;
  return <RegisterSW />;
}

function RegisterSW() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisteredSW(swUrl, registration) {
      if (!registration) return;
      // Periodically check for new deployments (every 30 min) and on focus
      const checkForUpdate = () => {
        registration.update().catch(() => {});
      };
      const interval = window.setInterval(checkForUpdate, 30 * 60 * 1000);
      window.addEventListener("focus", checkForUpdate);
      return () => {
        window.clearInterval(interval);
        window.removeEventListener("focus", checkForUpdate);
      };
    },
    onRegisterError(err) {
      // eslint-disable-next-line no-console
      console.warn("[PWA] SW registration failed", err);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 z-[10300] flex -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg"
    >
      <span className="text-sm text-foreground">
        새 버전이 준비되었어요.
      </span>
      <Button
        size="sm"
        onClick={() => {
          updateServiceWorker(true); // skipWaiting + reload
        }}
      >
        업데이트
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setNeedRefresh(false)}
      >
        나중에
      </Button>
    </div>
  );
}
