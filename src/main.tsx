import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// SW unregister는 index.html의 인라인 스크립트에서 1회 처리합니다.
// 여기서 중복 실행하면 첫 렌더 직후 메인 스레드를 점유해 초기 진입이 느려집니다.

const forceFreshReload = () => {
  const KEY = "__jibda_chunk_recovery_at__";
  const last = Number(sessionStorage.getItem(KEY) || "0");
  if (Date.now() - last <= 10000) return;

  sessionStorage.setItem(KEY, String(Date.now()));

  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => regs.forEach((reg) => reg.unregister()));
    }
    if (typeof caches !== "undefined") {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  } catch {
    // 캐시 정리 실패 시에도 새로고침은 진행
  }

  const freshUrl = new URL(window.location.href);
  freshUrl.searchParams.set("v", String(Date.now()));
  freshUrl.searchParams.set("recover", "chunk");
  window.location.replace(freshUrl.toString());
};

// 빌드 후 오래된 청크를 참조해 동적 import가 실패하면 1회 강제 새로고침
if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    const msg = String(e?.message || "");
    const filename = String(e?.filename || "");
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("Loading chunk") ||
      filename.includes("/assets/")
    ) {
      forceFreshReload();
    }
  });
  window.addEventListener("unhandledrejection", (e) => {
    const msg = String((e as PromiseRejectionEvent)?.reason?.message || "");
    if (
      msg.includes("Failed to fetch dynamically imported module") ||
      msg.includes("Importing a module script failed") ||
      msg.includes("Loading chunk")
    ) {
      forceFreshReload();
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
