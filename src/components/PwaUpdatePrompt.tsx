import { useEffect } from "react";

const FRESH_CHECK_INTERVAL = 60_000;

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
      let hadLegacyCache = false;

      try {
        if ("serviceWorker" in navigator) {
          hadLegacyCache = Boolean(navigator.serviceWorker.controller);
          const regs = await navigator.serviceWorker.getRegistrations();
          hadLegacyCache = hadLegacyCache || regs.length > 0;
          await Promise.all(regs.map((r) => r.unregister()));
        }
        if (typeof caches !== "undefined") {
          const keys = await caches.keys();
          hadLegacyCache = hadLegacyCache || keys.length > 0;
          await Promise.all(keys.map((k) => caches.delete(k)));
        }
      } catch {
        // 캐시 정리는 실패해도 앱 사용은 계속 가능해야 함
      }

      return hadLegacyCache;
    };

    const moveToFreshUrl = (buildId: string) => {
      if (isPreviewHost || inIframe) return;

      const url = new URL(window.location.href);
      url.searchParams.set("_v", buildId);
      url.searchParams.set("_r", `${Date.now()}`);
      window.location.replace(url.toString());
    };

    const getLatestBuildId = async () => {
      try {
        const versionUrl = new URL("/version.json", window.location.origin);
        versionUrl.searchParams.set("_", `${Date.now()}`);
        const response = await fetch(versionUrl.toString(), {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });

        if (response.ok) {
          const data = await response.json();
          if (typeof data?.buildId === "string") return data.buildId;
        }
      } catch {
        // index.html 확인으로 대체
      }

      try {
        const htmlUrl = new URL(window.location.pathname || "/", window.location.origin);
        htmlUrl.searchParams.set("_fresh", `${Date.now()}`);
        const response = await fetch(htmlUrl.toString(), {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        const html = await response.text();
        return html.match(/<meta name="app-build-id" content="([^"]+)"/i)?.[1] ?? null;
      } catch {
        return null;
      }
    };

    const refreshOnceForBuild = async () => {
      if (isPreviewHost || inIframe) return;

      const hadLegacyCache = await clearOldAppCache();
      const legacyReloadKey = `jibda_legacy_cache_cleared_${__APP_BUILD_ID__}`;

      if (hadLegacyCache && !sessionStorage.getItem(legacyReloadKey)) {
        sessionStorage.setItem(legacyReloadKey, "1");
        moveToFreshUrl(__APP_BUILD_ID__);
        return;
      }

      const latestBuildId = await getLatestBuildId();
      const reloadKey = `jibda_reloaded_${latestBuildId ?? __APP_BUILD_ID__}`;
      localStorage.setItem("jibda_build_id", __APP_BUILD_ID__);

      if (latestBuildId && latestBuildId !== __APP_BUILD_ID__ && !sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, "1");
        await clearOldAppCache();
        moveToFreshUrl(latestBuildId);
      }
    };

    refreshOnceForBuild();

    const interval = window.setInterval(refreshOnceForBuild, FRESH_CHECK_INTERVAL);
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) refreshOnceForBuild();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") refreshOnceForBuild();
    };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
