import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

if (typeof window !== "undefined") {
  void (async () => {
    try {
      const registrations = await navigator.serviceWorker?.getRegistrations?.();
      await Promise.all((registrations ?? []).map((registration) => registration.unregister()));
      if (typeof caches !== "undefined") {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch {
      // 캐시 정리는 실패해도 화면 렌더링은 계속합니다.
    }
  })();
}

createRoot(document.getElementById("root")!).render(<App />);
