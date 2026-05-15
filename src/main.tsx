import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root");

const recoverFromStaleBuild = async () => {
  const recoveryKey = `jibda-entry-recovery:${__APP_BUILD_ID__}`;
  if (sessionStorage.getItem(recoveryKey) === "1") return;
  sessionStorage.setItem(recoveryKey, "1");

  await Promise.allSettled([
    navigator.serviceWorker?.getRegistrations().then((registrations) =>
      Promise.allSettled(registrations.map((registration) => registration.unregister()))
    ),
    "caches" in window ? caches.keys().then((keys) => Promise.allSettled(keys.map((key) => caches.delete(key)))) : Promise.resolve(),
  ]);

  const url = new URL(window.location.href);
  url.searchParams.set("app-recovery", __APP_BUILD_ID__);
  window.location.replace(url.toString());
};

window.addEventListener("unhandledrejection", (event) => {
  const message = event.reason instanceof Error ? event.reason.message : String(event.reason ?? "");
  if (/ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|module script/i.test(message)) {
    event.preventDefault();
    recoverFromStaleBuild();
  }
});

window.addEventListener("error", (event) => {
  const message = `${event.message || ""} ${event.filename || ""}`;
  if (/ChunkLoadError|Failed to fetch dynamically imported module|Importing a module script failed|Loading chunk|module script/i.test(message)) {
    event.preventDefault();
    recoverFromStaleBuild();
  }
}, true);

if (!root) {
  recoverFromStaleBuild();
} else {
  createRoot(root).render(<App />);
}
