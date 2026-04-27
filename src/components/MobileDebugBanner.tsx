import { useEffect, useState } from "react";
import { X } from "lucide-react";

const detectBrowser = (ua: string) => {
  if (/KAKAOTALK/i.test(ua)) return "Kakao";
  if (/NAVER\(inapp/i.test(ua) || /NAVER/i.test(ua)) return "Naver";
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  return "Other";
};

export const MobileDebugBanner = () => {
  const [open, setOpen] = useState(true);
  const [serverVersion, setServerVersion] = useState<string>("loading...");

  useEffect(() => {
    fetch(`/version.json?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setServerVersion(String(d.buildVersion ?? "n/a")))
      .catch(() => setServerVersion("fetch-failed"));
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          top: 4,
          right: 4,
          zIndex: 999999,
          background: "rgba(220,38,38,0.95)",
          color: "white",
          fontSize: 10,
          padding: "2px 6px",
          borderRadius: 4,
          border: "none",
        }}
      >
        DEBUG
      </button>
    );
  }

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const browser = detectBrowser(ua);
  const bundleVersion =
    typeof __APP_BUILD_VERSION__ !== "undefined" ? __APP_BUILD_VERSION__ : "n/a";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999999,
        background: "rgba(15,23,42,0.96)",
        color: "#fff",
        fontSize: 10,
        lineHeight: 1.35,
        padding: "6px 24px 6px 8px",
        fontFamily: "monospace",
        borderBottom: "1px solid #f59e0b",
        wordBreak: "break-all",
      }}
    >
      <button
        onClick={() => setOpen(false)}
        aria-label="close"
        style={{
          position: "absolute",
          top: 2,
          right: 2,
          background: "transparent",
          color: "#fff",
          border: "none",
          padding: 4,
        }}
      >
        <X size={12} />
      </button>
      <div><b>URL:</b> {typeof window !== "undefined" ? window.location.href : ""}</div>
      <div><b>Host:</b> {typeof window !== "undefined" ? window.location.hostname : ""}</div>
      <div>
        <b>Build:</b> {bundleVersion} {" | "}
        <b>Server:</b> {serverVersion} {" "}
        {bundleVersion !== "n/a" && serverVersion !== "loading..." && serverVersion !== "fetch-failed" && (
          <span style={{ color: bundleVersion === serverVersion ? "#22c55e" : "#ef4444" }}>
            {bundleVersion === serverVersion ? "✓ MATCH" : "✗ STALE"}
          </span>
        )}
      </div>
      <div>
        <b>Browser:</b>{" "}
        <span
          style={{
            color: browser === "Kakao" ? "#fbbf24" : browser === "Naver" ? "#22c55e" : "#60a5fa",
            fontWeight: "bold",
          }}
        >
          {browser}
        </span>
      </div>
      <div style={{ opacity: 0.7 }}><b>UA:</b> {ua}</div>
    </div>
  );
};

export default MobileDebugBanner;
