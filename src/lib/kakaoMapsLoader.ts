declare global {
  interface Window {
    kakao: any;
    __kakaoMapReady?: boolean;
    __kakaoMapLoadPromise?: Promise<any> | null;
  }
}

const KAKAO_JS_KEY = "9b1ab990830e8319b8bafb3104e5ae50";
const DEFAULT_TIMEOUT_MS = 20000;
const DEFAULT_RETRIES = 6;
const KAKAO_SCRIPT_ID = "kakao-map-sdk";
const KAKAO_SCRIPT_SRC = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=services`;
const SCRIPT_POLL_INTERVAL_MS = 80;

function isKakaoMapsAvailable() {
  return Boolean(window.kakao?.maps?.load);
}

function markScriptStatus(script: HTMLScriptElement, status: "loading" | "loaded" | "error") {
  script.dataset.kakaoStatus = status;
}

function getScriptStatus(script: HTMLScriptElement) {
  return script.dataset.kakaoStatus;
}

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

function removeKakaoScripts() {
  getKakaoScripts().forEach((script) => script.remove());
}

function waitForKakaoGlobal(timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    if (isKakaoMapsAvailable()) {
      resolve();
      return;
    }

    let settled = false;
    let pollTimer = 0;

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutTimer);
      window.clearInterval(pollTimer);
      callback();
    };

    const timeoutTimer = window.setTimeout(() => {
      finish(() => reject(new Error("카카오 지도 SDK 스크립트 실행 시간이 초과되었습니다.")));
    }, timeoutMs);

    pollTimer = window.setInterval(() => {
      if (!isKakaoMapsAvailable()) return;
      finish(resolve);
    }, SCRIPT_POLL_INTERVAL_MS);
  });
}

function waitForKakaoMaps(timeoutMs: number) {
  return waitForKakaoGlobal(timeoutMs).then(
    () =>
      new Promise<any>((resolve, reject) => {
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
      })
  );
}

function waitForExistingScript(script: HTMLScriptElement, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    if (isKakaoMapsAvailable()) {
      markScriptStatus(script, "loaded");
      resolve();
      return;
    }

    let settled = false;
    let pollTimer = 0;
    const cleanup = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      window.clearTimeout(timer);
      window.clearInterval(pollTimer);
    };

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };

    const handleLoad = () => {
      waitForKakaoGlobal(timeoutMs)
        .then(() => finish(() => {
          markScriptStatus(script, "loaded");
          resolve();
        }))
        .catch(() => finish(() => {
          markScriptStatus(script, "error");
          reject(new Error("카카오 지도 SDK 스크립트가 불완전하게 로드되었습니다."));
        }));
    };

    const handleError = () => {
      finish(() => {
        markScriptStatus(script, "error");
        reject(new Error("카카오 지도 SDK 스크립트를 불러오지 못했습니다."));
      });
    };

    const timer = window.setTimeout(() => {
      if (isKakaoMapsAvailable()) {
        finish(() => {
          markScriptStatus(script, "loaded");
          resolve();
        });
        return;
      }

      finish(() => {
        markScriptStatus(script, "error");
        reject(new Error("카카오 지도 SDK 스크립트 로딩 시간이 초과되었습니다."));
      });
    }, timeoutMs);

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });

    pollTimer = window.setInterval(() => {
      if (!isKakaoMapsAvailable()) return;
      finish(() => {
        markScriptStatus(script, "loaded");
        resolve();
      });
    }, SCRIPT_POLL_INTERVAL_MS);

    if ((script as HTMLScriptElement & { readyState?: string }).readyState === "complete" || getScriptStatus(script) === "loaded") {
      handleLoad();
    }
  });
}

function injectKakaoScript(timeoutMs: number) {
  const existing = getPrimaryScript();
  if (existing && getScriptStatus(existing) !== "error") {
    return waitForExistingScript(existing, timeoutMs);
  }

  if (existing) {
    existing.remove();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = KAKAO_SCRIPT_ID;
    script.src = KAKAO_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    markScriptStatus(script, "loading");
    // Append immediately so concurrent callers can find & reuse this script
    // instead of creating duplicates that then remove each other.
    document.head.appendChild(script);

    let settled = false;
    let pollTimer = 0;
    const cleanup = () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
      window.clearTimeout(timer);
      window.clearInterval(pollTimer);
    };

    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      cleanup();
      callback();
    };

    const handleLoad = () => {
      waitForKakaoGlobal(timeoutMs)
        .then(() => finish(() => {
          markScriptStatus(script, "loaded");
          cleanupDuplicateScripts(script);
          resolve();
        }))
        .catch(() => finish(() => {
          markScriptStatus(script, "error");
          script.remove();
          reject(new Error("카카오 지도 SDK 스크립트가 불완전하게 로드되었습니다."));
        }));
    };

    const handleError = () => {
      finish(() => {
        markScriptStatus(script, "error");
        script.remove();
        reject(new Error("카카오 지도 SDK 스크립트를 불러오지 못했습니다."));
      });
    };

    const timer = window.setTimeout(() => {
      if (isKakaoMapsAvailable()) {
        finish(() => {
          markScriptStatus(script, "loaded");
          cleanupDuplicateScripts(script);
          resolve();
        });
        return;
      }

      finish(() => {
        markScriptStatus(script, "error");
        script.remove();
        reject(new Error("카카오 지도 SDK 스크립트 로딩 시간이 초과되었습니다."));
      });
    }, timeoutMs);

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    pollTimer = window.setInterval(() => {
      if (!isKakaoMapsAvailable()) return;
      finish(() => {
        markScriptStatus(script, "loaded");
        cleanupDuplicateScripts(script);
        resolve();
      });
    }, SCRIPT_POLL_INTERVAL_MS);
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

        if (attempt < retries) {
          removeKakaoScripts();
        }

        if (attempt < retries) {
          await sleep(Math.min(4000, 500 * attempt));
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