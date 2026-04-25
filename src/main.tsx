import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { isStandaloneMode } from "@/utils/pwa";

createRoot(document.getElementById("root")!).render(<App />);

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

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (hasReloadedForUpdate) return;
          hasReloadedForUpdate = true;
          window.location.reload();
        });

        setInterval(checkForUpdates, 60 * 60 * 1000);

        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            checkForUpdates();
          }
        });

        window.addEventListener("focus", checkForUpdates);
      })
      .catch(() => {});
  });
}
