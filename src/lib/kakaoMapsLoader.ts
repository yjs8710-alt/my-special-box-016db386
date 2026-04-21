declare global {
  interface Window {
    kakao: any;
    __kakaoMapReady?: boolean;
    __kakaoMapLoadPromise?: Promise<any> | null;
  }
}

const KAKAO_JS_KEY = "9b1ab990830e8319b8bafb3104e5ae50";
const DEFAULT_TIMEOUT_MS = 10000;
const DEFAULT_RETRIES = 4;
const KAKAO_SCRIPT_ID = "kakao-map-sdk";
const KAKAO_SCRIPT_SRC = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=services`;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getKakaoScripts() {
  return Array.from(document.querySelectorAll<HTMLScriptElement>('script[src*="dapi.kakao.com/v2/maps/sdk.js"]'));
}

function cleanupDuplicateScripts(activeScript?: HTMLScriptElement | null) {
  getKakaoScripts().forEach((script) => {
    if (activeScript && script === activeScript) return;
    if (script.id === KAKAO_SCRIPT_ID && !activeScript) return;
    script.remove();
  });
}

function getPrimaryScript() {
  return document.getElementById(KAKAO_SCRIPT_ID) as HTMLScriptElement | null;
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

    try {
      window.kakao.maps.load(() => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        window.__kakaoMapReady = true;
        resolve(window.kakao.maps);
      });
    } catch (error) {
      window.clearTimeout(timer);
      reject(error instanceof Error ? error : new Error("카카오 지도 SDK 초기화에 실패했습니다."));
    }
  });
}

function waitForExistingScript(script: HTMLScriptElement, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    if (window.kakao?.maps?.load) {
      resolve();
      return;
    }

    let settled = false;
    const cleanup = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      window.clearTimeout(timer);
    };

    const handleLoad = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };

    const handleError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("카카오 지도 SDK 스크립트를 불러오지 못했습니다."));
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("카카오 지도 SDK 스크립트 로딩 시간이 초과되었습니다."));
    }, timeoutMs);

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
  });
}

function injectKakaoScript(timeoutMs: number) {
  const existing = getPrimaryScript();
  if (existing) {
    cleanupDuplicateScripts(existing);
    return waitForExistingScript(existing, timeoutMs);
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = KAKAO_SCRIPT_ID;
    script.src = KAKAO_SCRIPT_SRC;
    script.async = true;

    let settled = false;
    const cleanup = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      window.clearTimeout(timer);
    };

    const handleLoad = () => {
      if (settled) return;
      settled = true;
      cleanup();
      cleanupDuplicateScripts(script);
      resolve();
    };

    const handleError = () => {
      if (settled) return;
      settled = true;
      cleanup();
      script.remove();
      reject(new Error("카카오 지도 SDK 스크립트를 불러오지 못했습니다."));
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      script.remove();
      reject(new Error("카카오 지도 SDK 스크립트 로딩 시간이 초과되었습니다."));
    }, timeoutMs);

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
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
        if (window.kakao?.maps?.load) {
          return await waitForKakaoMaps(timeoutMs);
        }

        window.__kakaoMapReady = false;
        await injectKakaoScript(timeoutMs);
        return await waitForKakaoMaps(timeoutMs);
      } catch (error) {
        lastError = error;
        window.__kakaoMapReady = false;

        const activeScript = getPrimaryScript();
        if (activeScript && attempt < retries) {
          activeScript.remove();
        }

        if (attempt < retries) {
          await sleep(Math.min(1500, attempt * 400));
        }
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