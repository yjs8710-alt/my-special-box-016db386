const MOBILE_INAPP_RELOAD_KEY = "jibda_mobile_inapp_fresh_20260427_01";

const isMobileInAppBrowser = () => {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  return /KakaoTalk|KAKAOTALK|NAVER|Whale|inapp/i.test(userAgent);
};

const clearServiceWorkersAndCaches = async () => {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch {
    // 캐시 초기화 실패가 앱 실행을 막지 않도록 무시합니다.
  }

  try {
    if (typeof caches !== "undefined") {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }
  } catch {
    // 캐시 초기화 실패가 앱 실행을 막지 않도록 무시합니다.
  }
};

const reloadWithFreshMobileParam = () => {
  const url = new URL(window.location.href);
  url.searchParams.set("mobileFresh", `${Date.now()}`);
  window.location.replace(url.toString());
};

if (typeof window !== "undefined" && isMobileInAppBrowser()) {
  void (async () => {
    await clearServiceWorkersAndCaches();

    if (!sessionStorage.getItem(MOBILE_INAPP_RELOAD_KEY)) {
      sessionStorage.setItem(MOBILE_INAPP_RELOAD_KEY, "1");
      reloadWithFreshMobileParam();
    }
  })();
}