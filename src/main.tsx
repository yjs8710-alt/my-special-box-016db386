import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// 운영 도메인/설치앱에 남은 예전 서비스워커·캐시가 빈 화면 빌드를 붙잡는 문제를 차단합니다.
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  const runServiceWorkerCleanup = () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    }).catch(() => undefined);
    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      }).catch(() => undefined);
    }
  };

  runServiceWorkerCleanup();
  navigator.serviceWorker.ready.then(() => runServiceWorkerCleanup()).catch(() => undefined);
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
