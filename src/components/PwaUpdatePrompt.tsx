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

    // In-app browser cache busting (Naver / Kakao) — one-time URL bump
    const ua = navigator.userAgent || "";
    const isInApp = /NAVER|Whale|KAKAOTALK|kakaotalk/i.test(ua);
    if (isInApp) {
      const url = new URL(window.location.href);
      const current = url.searchParams.get("_bv");
      if (current !== __APP_BUILD_ID__) {
        url.searchParams.set("_bv", __APP_BUILD_ID__);
        window.history.replaceState({}, "", url.toString());
      }
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
