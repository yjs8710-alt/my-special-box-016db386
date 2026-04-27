import { useEffect } from "react";

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

    const clearOldAppCache = async () => {
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister()));
        }
        if (typeof caches !== "undefined") {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        // 캐시 정리는 실패해도 앱 사용은 계속 가능해야 함
      }
    };

    const refreshOnceForBuild = async () => {
      await clearOldAppCache();
      if (isPreviewHost || inIframe) return;

      const storedBuildId = localStorage.getItem("jibda_build_id");
      const reloadKey = `jibda_reloaded_${__APP_BUILD_ID__}`;
      localStorage.setItem("jibda_build_id", __APP_BUILD_ID__);

      if (storedBuildId && storedBuildId !== __APP_BUILD_ID__ && !sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        const url = new URL(window.location.href);
        url.searchParams.set("_v", __APP_BUILD_ID__);
        window.location.replace(url.toString());
      }
    };

    refreshOnceForBuild();
  }, []);

  return null;
}
