import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// 과거 PWA/서비스워커가 설치된 기기는 외부 도메인에서 오래된 앱 셸을 계속 잡을 수 있어 1회 kill-switch로 교체합니다.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  const SW_KILL_SWITCH_KEY = "__jibda_sw_kill_switch_20260515__";
  const isProductionDomain = /(^|\.)jibda\.co\.kr$|(^|\.)zibda\.co\.kr$/.test(window.location.hostname);

  if (isProductionDomain && !sessionStorage.getItem(SW_KILL_SWITCH_KEY)) {
    sessionStorage.setItem(SW_KILL_SWITCH_KEY, "1");
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
    });
  }
}

// 빌드 후 오래된 청크를 참조해 동적 import가 실패하면 1회 강제 새로고침
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    const msg = String(e?.message || "");
    if (msg.includes("Failed to fetch dynamically imported module") || msg.includes("Importing a module script failed")) {
      const KEY = "__chunk_reload_at__";
      const last = Number(sessionStorage.getItem(KEY) || "0");
      if (Date.now() - last > 10000) {
        sessionStorage.setItem(KEY, String(Date.now()));
        location.reload();
      }
    }
  });
  window.addEventListener("unhandledrejection", (e) => {
    const msg = String((e as PromiseRejectionEvent)?.reason?.message || "");
    if (msg.includes("Failed to fetch dynamically imported module") || msg.includes("Importing a module script failed")) {
      const KEY = "__chunk_reload_at__";
      const last = Number(sessionStorage.getItem(KEY) || "0");
      if (Date.now() - last > 10000) {
        sessionStorage.setItem(KEY, String(Date.now()));
        location.reload();
      }
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
