declare global {
  interface Window {
    kakao: any;
    __kakaoMapReady?: boolean;
    __kakaoMapLoadPromise?: Promise<any> | null;
  }
}

const KAKAO_JS_KEY = "9b1ab990830e8319b8bafb3104e5ae50";
const KAKAO_SCRIPT_ID = "kakao-map-sdk";
const KAKAO_SCRIPT_SRC = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=services`;
const DEFAULT_TIMEOUT_MS = 20000;

function isKakaoLoaded() {
  return Boolean(window.kakao?.maps?.LatLng);
}

function callMapsLoad(timeoutMs: number): Promise<any> {
  return new Promise((resolve, reject) => {
    if (isKakaoLoaded()) {
      window.__kakaoMapReady = true;
      resolve(window.kakao.maps);
      return;
    }
    if (!window.kakao?.maps?.load) {
      reject(new Error("카카오 SDK 전역이 준비되지 않았습니다."));
      return;
    }
    const timer = window.setTimeout(() => {
      reject(new Error("카카오 지도 SDK 초기화 시간이 초과되었습니다."));
    }, timeoutMs);
    try {
      window.kakao.maps.load(() => {
        window.clearTimeout(timer);
        window.__kakaoMapReady = true;
        resolve(window.kakao.maps);
      });
    } catch (err) {
      window.clearTimeout(timer);
      reject(err instanceof Error ? err : new Error("카카오 지도 SDK 초기화 실패"));
    }
  });
}

function injectScript(timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    // Reuse if already in DOM
    let script = document.getElementById(KAKAO_SCRIPT_ID) as HTMLScriptElement | null;

    if (script) {
      // If kakao global is already there, we're done
      if (window.kakao?.maps) {
        resolve();
        return;
      }
      // Otherwise wait for it to finish loading
      const onLoad = () => {
        script!.removeEventListener("load", onLoad);
        script!.removeEventListener("error", onError);
        window.clearTimeout(timer);
        resolve();
      };
      const onError = () => {
        script!.removeEventListener("load", onLoad);
        script!.removeEventListener("error", onError);
        window.clearTimeout(timer);
        script!.remove();
        reject(new Error("카카오 지도 SDK 스크립트 로딩 실패"));
      };
      const timer = window.setTimeout(() => {
        script!.removeEventListener("load", onLoad);
        script!.removeEventListener("error", onError);
        if (window.kakao?.maps) {
          resolve();
        } else {
          script!.remove();
          reject(new Error("카카오 지도 SDK 스크립트 로딩 시간이 초과되었습니다."));
        }
      }, timeoutMs);
      script.addEventListener("load", onLoad);
      script.addEventListener("error", onError);
      return;
    }

    script = document.createElement("script");
    script.id = KAKAO_SCRIPT_ID;
    script.src = KAKAO_SCRIPT_SRC;
    script.async = true;

    const onLoad = () => {
      script!.removeEventListener("load", onLoad);
      script!.removeEventListener("error", onError);
      window.clearTimeout(timer);
      resolve();
    };
    const onError = () => {
      script!.removeEventListener("load", onLoad);
      script!.removeEventListener("error", onError);
      window.clearTimeout(timer);
      script!.remove();
      reject(new Error("카카오 지도 SDK 스크립트를 불러오지 못했습니다."));
    };
    const timer = window.setTimeout(() => {
      script!.removeEventListener("load", onLoad);
      script!.removeEventListener("error", onError);
      if (window.kakao?.maps) {
        resolve();
      } else {
        script!.remove();
        reject(new Error("카카오 지도 SDK 스크립트 로딩 시간이 초과되었습니다."));
      }
    }, timeoutMs);

    script.addEventListener("load", onLoad);
    script.addEventListener("error", onError);
    document.head.appendChild(script);
  });
}

export async function loadKakaoMaps(options?: { retries?: number; timeoutMs?: number }) {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options?.retries ?? 3;

  if (isKakaoLoaded() && window.__kakaoMapReady) {
    return window.kakao.maps;
  }

  if (window.__kakaoMapLoadPromise) {
    return window.__kakaoMapLoadPromise;
  }

  window.__kakaoMapLoadPromise = (async () => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await injectScript(timeoutMs);
        const maps = await callMapsLoad(timeoutMs);
        return maps;
      } catch (err) {
        lastError = err;
        window.__kakaoMapReady = false;
        // Remove broken script before retry
        const broken = document.getElementById(KAKAO_SCRIPT_ID);
        if (broken) broken.remove();
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 500 * attempt));
        }
      }
    }
    window.__kakaoMapLoadPromise = null;
    throw lastError ?? new Error("카카오 지도 SDK를 불러오지 못했습니다.");
  })();

  try {
    return await window.__kakaoMapLoadPromise;
  } catch (err) {
    window.__kakaoMapLoadPromise = null;
    throw err;
  }
}
