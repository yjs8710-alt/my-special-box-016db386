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
 * (비활성화됨) 인앱 브라우저에서 외부 Chrome/Safari 로 자동 이동시키는 로직.
 *
 * 자동 redirect 는 네이버/카카오 인앱에서 최신 배포가 안 보이거나 흰 화면이
 * 뜨는 등 부작용이 컸기 때문에 제거됨. 이 함수는 호환성을 위해 export 만
 * 유지하며 항상 false 를 반환한다. 사용자가 직접 "Chrome에서 열기" 버튼을
 * 눌렀을 때만 외부 브라우저 이동을 시도해야 한다.
 */
export function forceOpenInExternalBrowser(): boolean {
  return false;
}

/**
 * 사용자가 명시적으로 버튼을 눌렀을 때만 호출되는 외부 브라우저 열기.
 * 인앱 브라우저가 아니면 아무 것도 하지 않는다.
 */
export function openInExternalBrowser(): boolean {
  if (typeof window === "undefined") return false;
  if (!isInAppBrowser()) return false;

  const url = window.location.href;
  const ua = navigator.userAgent.toLowerCase();

  if (isAndroid()) {
    const cleanUrl = url.replace(/^https?:\/\//, "");
    const intentUrl = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;
    return true;
  }

  if (isIOS()) {
    if (ua.includes("kakaotalk")) {
      window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`;
      return true;
    }
    if (ua.includes("naver")) {
      window.location.href = `naversearchapp://inappbrowser/close?target=current&url=${encodeURIComponent(
        url
      )}`;
      return true;
    }
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
