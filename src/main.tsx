import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// ── PWA Service Worker 등록 (프리뷰 iframe / Lovable 호스트 제외) ──
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const host = window.location.hostname;
const isPreviewHost =
  host.includes("id-preview--") ||
  host.includes("lovableproject.com") ||
  host.includes("lovable.app") === false && host.includes("lovable") ||
  host === "localhost";

const isProductionHost =
  host.endsWith("lovable.app") || host === "jibda.co.kr" || host.endsWith(".jibda.co.kr");

if (isPreviewHost || isInIframe) {
  // 프리뷰/iframe 에서는 SW 등록 금지 + 기존 SW 제거
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => r.unregister());
    });
  }
} else if (isProductionHost && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    import("virtual:pwa-register").then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        // 새 버전 감지 → 즉시 SW 활성화 후 페이지 리로드 (사용자 별도 조작 불필요)
        onNeedRefresh() {
          updateSW(true);
        },
        // 매 1시간마다 새 버전 체크 (앱이 켜져 있는 동안)
        onRegisteredSW(swUrl, registration) {
          if (!registration) return;
          setInterval(() => {
            registration.update().catch(() => {});
          }, 60 * 60 * 1000);
        },
      });

      // 앱이 다시 포그라운드로 올 때마다 즉시 업데이트 체크
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          navigator.serviceWorker.getRegistration().then((reg) => {
            reg?.update().catch(() => {});
          });
        }
      });
    });
  });
}
