import { useEffect } from "react";

export function PwaUpdatePrompt() {
  useEffect(() => {
    if (typeof window === "undefined") return;

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

    clearOldAppCache();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) clearOldAppCache();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") clearOldAppCache();
    };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
