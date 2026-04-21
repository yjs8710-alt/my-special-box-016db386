declare global {
  interface Window {
    kakao: any;
    __kakaoMapReady?: boolean;
    __kakaoMapLoadPromise?: Promise<any> | null;
  }
}

const KAKAO_JS_KEY = "9b1ab990830e8319b8bafb3104e5ae50";
const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 3;

function removeKakaoScripts() {
  document.querySelectorAll('script[src*="dapi.kakao.com/v2/maps/sdk.js"]').forEach((node) => node.remove());
}

function waitForKakaoMaps(timeoutMs: number) {
  return new Promise<any>((resolve, reject) => {
    if (!window.kakao?.maps?.load) {
      reject(new Error("카카오 지도 SDK가 초기화되지 않았습니다."));
      return;
    }

    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("카카오 지도 SDK 초기화 시간이 초과되었습니다."));
    }, timeoutMs);

    window.kakao.maps.load(() => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      window.__kakaoMapReady = true;
      resolve(window.kakao.maps);
    });
  });
}

function injectKakaoScript(timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=services`;
    script.async = true;

    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      script.remove();
      reject(new Error("카카오 지도 SDK 스크립트 로딩 시간이 초과되었습니다."));
    }, timeoutMs);

    script.onload = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve();
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      script.remove();
      reject(new Error("카카오 지도 SDK 스크립트를 불러오지 못했습니다."));
    };

    document.head.appendChild(script);
  });
}

export async function loadKakaoMaps(options?: { retries?: number; timeoutMs?: number }) {
  const retries = options?.retries ?? DEFAULT_RETRIES;
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  if (window.kakao?.maps && window.__kakaoMapReady) {
    return window.kakao.maps;
  }

  if (window.__kakaoMapLoadPromise) {
    return window.__kakaoMapLoadPromise;
  }

  window.__kakaoMapLoadPromise = (async () => {
    let lastError: unknown;

    for (let attempt = 1; attempt <= retries; attempt += 1) {
      try {
        if (window.kakao?.maps) {
          return await waitForKakaoMaps(timeoutMs);
        }

        removeKakaoScripts();
        window.__kakaoMapReady = false;
        await injectKakaoScript(timeoutMs);
        return await waitForKakaoMaps(timeoutMs);
      } catch (error) {
        lastError = error;
        window.__kakaoMapReady = false;
        removeKakaoScripts();
      }
    }

    window.__kakaoMapLoadPromise = null;
    throw lastError ?? new Error("카카오 지도 SDK를 불러오지 못했습니다.");
  })();

  try {
    return await window.__kakaoMapLoadPromise;
  } catch (error) {
    window.__kakaoMapLoadPromise = null;
    throw error;
  }
}