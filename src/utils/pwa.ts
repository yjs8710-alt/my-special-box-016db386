export function isStandaloneMode() {
  const displayModeStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIosStandalone = (window.navigator as any).standalone === true;
  const isAndroidTwa = document.referrer.includes("android-app://");
  const params = new URLSearchParams(window.location.search);
  const isPwaStartUrl = params.get("source") === "pwa" || params.has("standalone");

  return displayModeStandalone || isIosStandalone || isAndroidTwa || isPwaStartUrl;
}

export function isInAppBrowser() {
  const ua = navigator.userAgent.toLowerCase();

  return (
    ua.includes("kakaotalk") ||
    ua.includes("naver") ||
    ua.includes("line") ||
    ua.includes("fbav") ||
    ua.includes("instagram")
  );
}

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isAndroid() {
  return /android/i.test(navigator.userAgent);
}