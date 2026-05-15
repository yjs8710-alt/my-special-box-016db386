import { createRoot } from "react-dom/client";
import { Component, type ReactNode } from "react";
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

class AppCrashBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("App render failed", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", background: "#001743", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <main style={{ maxWidth: 420 }}>
          <strong style={{ display: "block", fontSize: 32, fontWeight: 900, marginBottom: 14 }}>Zibda</strong>
          <h1 style={{ fontSize: 21, lineHeight: 1.35, fontWeight: 900, margin: "0 0 10px" }}>화면을 다시 불러오고 있습니다</h1>
          <p style={{ fontSize: 14, lineHeight: 1.7, opacity: 0.75, margin: "0 0 20px" }}>일시적인 로딩 오류가 발생했습니다. 버튼을 누르면 최신 화면으로 다시 접속합니다.</p>
          <button onClick={() => window.location.replace("/")} style={{ height: 44, border: 0, borderRadius: 8, background: "#ff6a00", color: "#fff", fontSize: 14, fontWeight: 900, padding: "0 20px" }}>다시 접속</button>
        </main>
      </div>
    );
  }
}

const recoverFromStaleBuild = async () => {
  const recoveryKey = `jibda-entry-recovery:${__APP_BUILD_ID__}`;
  if (sessionStorage.getItem(recoveryKey) === "1") {
    return;
  }
  sessionStorage.setItem(recoveryKey, "1");

  await cleanupStaleRuntime();

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
  root.innerHTML = "";
  window.setTimeout(() => { cleanupStaleRuntime(); }, 3000);
  createRoot(root).render(
    <AppCrashBoundary>
      <App />
    </AppCrashBoundary>
  );
}
