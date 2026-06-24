import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { hasOpenOverlay } from "@/lib/overlayGuard";

/**
 * 모바일 / Capacitor 네이티브에서 뒤로가기 시 "Zibda를 종료하겠습니까?" 다이얼로그.
 * - 네이티브: @capacitor/app 의 backButton 리스너로 처리, "종료" 시 App.exitApp() 호출
 * - 웹/PWA: popstate 가드 사용
 */
export const useExitConfirm = (enabled: boolean = true) => {
  const [open, setOpen] = useState(false);
  const isNativeRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let cleanupListener: (() => void) | undefined;
    let cleanupPop: (() => void) | undefined;

    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (Capacitor.isNativePlatform()) {
          isNativeRef.current = true;
          const { App } = await import("@capacitor/app");
          const handle = await App.addListener("backButton", () => {
            if (hasOpenOverlay()) return;
            if (window.history.length > 1 && window.location.pathname !== "/") {
              window.history.back();
              return;
            }
            setOpen(true);
          });
          cleanupListener = () => {
            try { handle.remove(); } catch {}
          };
          return;
        }
      } catch {}

      // 웹/PWA 경로
      const ua = navigator.userAgent || "";
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
      if (!isMobile) return;

      window.history.pushState({ exitGuard: true }, "");
      const onPopState = () => {
        if (hasOpenOverlay()) return;
        setOpen(true);
        window.history.pushState({ exitGuard: true }, "");
      };
      window.addEventListener("popstate", onPopState);
      cleanupPop = () => window.removeEventListener("popstate", onPopState);
    })();

    return () => {
      cleanupListener?.();
      cleanupPop?.();
    };
  }, [enabled]);

  const handleConfirm = useCallback(async () => {
    setOpen(false);
    try {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        const { App } = await import("@capacitor/app");
        await App.exitApp();
        return;
      }
    } catch {}
    try { window.close(); } catch {}
    try { window.open("", "_self")?.close(); } catch {}
    setTimeout(() => {
      try {
        if (window.history.length > 1) window.history.go(-2);
        else window.location.href = "about:blank";
      } catch {}
    }, 50);
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
    // 네이티브에서는 popstate를 사용하지 않으므로 push 불필요. 웹은 다시 가드 push.
    if (!isNativeRef.current) {
      try { window.history.pushState({ exitGuard: true }, ""); } catch {}
    }
  }, []);

  const dialog = open
    ? createPortal(
        <div
          className="fixed inset-0 z-[20000] flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={handleCancel}
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-background shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-6 pb-5 text-center">
              <p className="text-base font-semibold text-foreground">
                Zibda를 종료하겠습니까?
              </p>
            </div>
            <div className="grid grid-cols-2 border-t border-border">
              <button
                onClick={handleCancel}
                className="py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                className="py-3 text-sm font-semibold text-white border-l border-border transition-colors"
                style={{ background: "linear-gradient(90deg, #ff6ec4 0%, #a78bfa 50%, #60a5fa 100%)" }}
              >
                종료
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return { ExitConfirmDialog: () => dialog };
};
