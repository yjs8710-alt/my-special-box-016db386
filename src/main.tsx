import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");

const cleanupStaleRuntime = async () => {
  await Promise.allSettled([
    navigator.serviceWorker?.getRegistrations().then((registrations) =>
      Promise.allSettled(registrations.map((registration) => registration.unregister()))
    ),
    "caches" in window ? caches.keys().then((keys) => Promise.allSettled(keys.map((key) => caches.delete(key)))) : Promise.resolve(),
  ]);
};

if (!root) {
  cleanupStaleRuntime();
} else {
  root.innerHTML = "";
  cleanupStaleRuntime();
  createRoot(root).render(<App />);
}
