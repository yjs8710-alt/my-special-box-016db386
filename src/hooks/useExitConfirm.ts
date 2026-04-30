import { useEffect } from "react";

/**
 * 모바일에서 뒤로가기 버튼을 눌렀을 때 "Zibda를 종료하겠습니까?" 확인을 띄운다.
 * - 모바일(또는 PWA standalone) 환경에서만 동작
 * - 사용자가 확인을 누르면 실제로 뒤로가기 진행, 취소하면 현재 페이지 유지
 */
export const useExitConfirm = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const ua = navigator.userAgent || "";
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    if (!isMobile) return;

    window.history.pushState({ exitGuard: true }, "");

    const onPopState = () => {
      const ok = window.confirm("Zibda를 종료하겠습니까?");
      if (ok) {
        window.history.back();
      } else {
        window.history.pushState({ exitGuard: true }, "");
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [enabled]);
};
