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
      registerSW({ immediate: true });
    });
  });
}
