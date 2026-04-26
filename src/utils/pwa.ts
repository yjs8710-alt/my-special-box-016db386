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

/**
 * 카카오톡/네이버/라인/페이스북/인스타그램 인앱 브라우저에서 접속 시
 * 자동으로 외부 Chrome(Android) 또는 Safari(iOS)로 강제 이동시킨다.
 *
 * - Android: `intent://` 스킴으로 Chrome을 직접 호출
 * - iOS: 카카오톡은 `kakaotalk://web/openExternal` 로 Safari 열기,
 *        그 외는 안내가 어려우므로 사용자에게 alert 후 클립보드 복사 시도
 *
 * @returns true 면 리다이렉트를 수행했음 (앱 렌더링 중단 권장)
 */
export function forceOpenInExternalBrowser(): boolean {
  if (typeof window === "undefined") return false;
  if (!isInAppBrowser()) return false;
  if (isStandaloneMode()) return false;

  // 네이버/카카오 인앱은 캐시가 매우 공격적이라 매 진입마다 외부 브라우저로 보낸다.
  // 그 외(라인/페북/인스타 등)는 무한 루프 방지를 위해 세션당 1회만 시도.
  const ua = navigator.userAgent.toLowerCase();
  const isAggressiveInApp = ua.includes("naver") || ua.includes("kakaotalk");
  if (!isAggressiveInApp) {
    try {
      if (sessionStorage.getItem("__jibda_external_redirect__") === "1") return false;
      sessionStorage.setItem("__jibda_external_redirect__", "1");
    } catch {
      // sessionStorage 접근 불가하면 그냥 진행
    }
  const url = window.location.href;

  if (isAndroid()) {
    // Android: Chrome intent 로 강제 오픈
    const cleanUrl = url.replace(/^https?:\/\//, "");
    const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
    return true;
  }

  if (isIOS()) {
    // iOS 카카오톡: 외부 브라우저(Safari)로 강제 오픈하는 전용 스킴
    if (ua.includes("kakaotalk")) {
      window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
      return true;
    }
    // iOS 네이버 앱: 외부 브라우저로 여는 공식 스킴
    if (ua.includes("naver")) {
      window.location.href = `naversearchapp://inappbrowser/close?target=current&url=${encodeURIComponent(
        url
      )}`;
      return true;
    }
    // 그 외 iOS 인앱(라인/페북/인스타): 자동 이동 불가 → 안내
    try {
      navigator.clipboard?.writeText(url).catch(() => {});
    } catch {
      // ignore
    }
    alert(
      "원활한 이용을 위해 Safari 등 기본 브라우저로 열어주세요.\n주소가 클립보드에 복사되었습니다."
    );
    return true;
  }

  return false;
}
