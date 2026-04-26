import { createRoot } from "react-dom/client";
import { toast } from "sonner";
import App from "./App.tsx";
import "./index.css";
import { isStandaloneMode, forceOpenInExternalBrowser } from "@/utils/pwa";
import { APP_VERSION } from "@/lib/appVersion";

// ── 버전 변경 감지 → 옛 cache storage 전부 삭제 + 1회 자동 새로고침 ──
// localStorage 에 저장된 마지막 실행 버전과 현재 빌드 버전이 다르면
// (= 새 배포가 처음 실행됨) 모든 캐시를 비우고 강제 reload 한다.
// 네이버 인앱 / PWA 처럼 SW 갱신이 늦는 환경에서도 즉시 최신 화면이 보이게 한다.
(function ensureLatestVersion() {
  try {
    const KEY = "__jibda_app_version__";
    const last = localStorage.getItem(KEY);
    if (last !== APP_VERSION) {
      localStorage.setItem(KEY, APP_VERSION);
      if (last && "caches" in window) {
        // 한 번만(직전 버전이 존재할 때만) 캐시 정리 + 새로고침
        caches.keys().then((keys) => {
          Promise.all(keys.map((k) => caches.delete(k))).finally(() => {
            // 무한루프 방지: 같은 세션에서 한 번만
            if (!sessionStorage.getItem("__jibda_version_reloaded__")) {
              sessionStorage.setItem("__jibda_version_reloaded__", "1");
              window.location.reload();
            }
          });
        });
      }
    }
  } catch {
    // ignore (사파리 시크릿 등)
  }
})();


// 자동 새로고침 직전에 사용자에게 한 번 토스트로 알린다.
function notifyAutoUpdateAndReload() {
  try {
    toast.success("새 버전 적용 중...", {
      description: "잠시 후 자동으로 새로고침됩니다.",
      duration: 1500,
    });
  } catch {
    // toast 가 아직 마운트 전이어도 무시하고 그냥 reload
  }
  setTimeout(() => {
    window.location.reload();
  }, 800);
}

// 카카오/네이버 등 인앱 브라우저에서 접속하면 외부 Chrome/Safari 로 강제 이동
// (프리뷰/iframe 환경에서는 실행 금지)
const _host = window.location.hostname;
const _isPreview =
  _host.includes("id-preview--") ||
  _host.includes("lovableproject.com") ||
  _host === "localhost" ||
  _host === "127.0.0.1";

let _redirected = false;
if (!_isPreview) {
  _redirected = forceOpenInExternalBrowser();
}

if (!_redirected) {
  createRoot(document.getElementById("root")!).render(<App />);
}

console.log("PWA standalone:", isStandaloneMode());
console.log("UserAgent:", navigator.userAgent);
console.log("Display mode:", window.matchMedia("(display-mode: standalone)").matches);
console.log("PWA update note: 배포 후 기존 설치 앱 삭제 → 브라우저 캐시 삭제 → 재설치해야 최신 앱 모드와 캐시가 적용됩니다.");

// ── PWA Service Worker 등록 (프리뷰 iframe / Lovable 호스트 제외) ──
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const host = window.location.hostname;

// Lovable 에디터/프리뷰 호스트만 명확히 차단
const isPreviewHost =
  host.includes("id-preview--") ||
  host.includes("lovableproject.com") ||
  host === "localhost" ||
  host === "127.0.0.1";

// 프로덕션: 그 외 모든 호스트 (lovable.app, jibda.co.kr, 커스텀 도메인 등)
const isProductionHost = !isPreviewHost;

if (isPreviewHost || isInIframe) {
  // 프리뷰/iframe 에서는 SW 등록 금지 + 기존 SW 제거
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
} else if (isProductionHost && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    let hasReloadedForUpdate = false;

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        const checkForUpdates = () => {
          registration.update().catch(() => {});
        };

        // 새 SW 가 설치되면 즉시 활성화하도록 메시지 전송
        const promoteWaiting = () => {
          if (registration.waiting) {
            registration.waiting.postMessage("SKIP_WAITING");
          }
        };

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // 대기 중인 새 워커를 즉시 활성화
              newWorker.postMessage("SKIP_WAITING");
            }
          });
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (hasReloadedForUpdate) return;
          hasReloadedForUpdate = true;
          notifyAutoUpdateAndReload();
        });

        // SW 가 활성화 후 보내는 업데이트 알림 처리 → 즉시 새로고침
        navigator.serviceWorker.addEventListener("message", (event) => {
          if (event.data?.type === "SW_UPDATED") {
            if (hasReloadedForUpdate) return;
            hasReloadedForUpdate = true;
            notifyAutoUpdateAndReload();
          }
        });

        // 주기적/포커스 시 업데이트 확인 (1시간 → 10분으로 단축)
        setInterval(checkForUpdates, 10 * 60 * 1000);

        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            checkForUpdates();
            promoteWaiting();
          }
        });

        window.addEventListener("focus", () => {
          checkForUpdates();
          promoteWaiting();
        });

        // 초기 로드 시에도 즉시 한 번 체크
        checkForUpdates();
      })
      .catch(() => {});
  });
}
