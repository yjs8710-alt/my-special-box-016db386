const MOBILE_INAPP_RELOAD_KEY = "jibda_mobile_inapp_fresh_20260427_03";
const MOBILE_INAPP_BUILD = "MOBILE_INAPP_FIX_20260427_03";

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
  url.searchParams.set("kakaoFresh", MOBILE_INAPP_BUILD);
  window.location.replace(url.toString());
};

const hasReloadedInThisSession = () => {
  try {
    return sessionStorage.getItem(MOBILE_INAPP_RELOAD_KEY) === "1";
  } catch {
    return false;
  }
};

const markReloadedInThisSession = () => {
  try {
    sessionStorage.setItem(MOBILE_INAPP_RELOAD_KEY, "1");
  } catch {
    // sessionStorage 접근이 제한된 인앱브라우저에서도 계속 진행합니다.
  }
};

if (typeof window !== "undefined" && isMobileInAppBrowser()) {
  void (async () => {
    try {
      localStorage.removeItem("jibda_mobile_inapp_fresh_20260427_01");
      localStorage.removeItem("jibda_mobile_inapp_fresh_20260427_02");
      localStorage.removeItem("jibda_buildVersion");
      localStorage.removeItem("jibda_build_id");
      localStorage.removeItem("jibda_build_version");
      localStorage.removeItem("jibda_cache_version");
      localStorage.removeItem("jibda_version");
    } catch {
      // localStorage 접근 실패는 무시합니다.
    }

    await clearServiceWorkersAndCaches();

    if (!hasReloadedInThisSession()) {
      markReloadedInThisSession();
      reloadWithFreshMobileParam();
    }
  })();
}