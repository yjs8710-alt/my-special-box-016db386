import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const clearLegacyPwaState = () => {
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker.getRegistrations()
    .then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister().catch(() => undefined);
      });
    })
    .catch(() => undefined);

  if ("caches" in window) {
    caches.keys()
      .then((keys) => keys.forEach((key) => caches.delete(key).catch(() => undefined)))
      .catch(() => undefined);
  }
};

const root = document.getElementById("root");

if (!root) {
  console.error("React root element was not found.");
} else {
  clearLegacyPwaState();
  root.innerHTML = "";
  createRoot(root).render(<App />);
}
