import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// 기존에 등록되었던 Service Worker 1회 정리 (자동 redirect/캐시 로직 없음).
// 새 코드 추가 없이, 과거 SW 가 남아 옛 번들을 서빙하는 것만 차단한다.
if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});
  if (typeof caches !== "undefined") {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .catch(() => {});
  }
}

createRoot(document.getElementById("root")!).render(<App />);
