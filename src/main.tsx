import { createRoot } from "react-dom/client";
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

// ── PWA Service Worker 완전 비활성화: 기존 등록 제거 + Cache Storage 삭제 ──
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((registration) => registration.unregister());
    }).catch(() => {});
  });
}

if ("caches" in window) {
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  }).catch(() => {});
}
