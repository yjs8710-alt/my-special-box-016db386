import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";

/**
 * 모바일에서 뒤로가기 시 "Zibda를 종료하겠습니까?" 커스텀 확인을 띄운다.
 * window.confirm은 origin(jibda.co.kr)을 자동으로 노출하므로 사용하지 않는다.
 */
export const useExitConfirm = (enabled: boolean = true) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    const ua = navigator.userAgent || "";
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    if (!isMobile) return;

    window.history.pushState({ exitGuard: true }, "");

    const onPopState = () => {
      setOpen(true);
      // 다이얼로그를 띄우는 동안에도 가드를 다시 push해서 추가 popstate를 막는다
      window.history.pushState({ exitGuard: true }, "");
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [enabled]);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    // 가드 pop + 원래 뒤로가기 (총 2번)
    window.history.go(-2);
  }, []);

  const handleCancel = useCallback(() => {
    setOpen(false);
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
                style={{ background: "hsl(var(--accent))" }}
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
