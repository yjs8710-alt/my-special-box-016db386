import { useEffect, useState } from "react";

/**
 * 새 Service Worker 가 설치되어 대기(waiting) 상태가 되면
 * 화면 상단에 "새 버전이 있습니다" 배너를 띄우고,
 * 사용자가 버튼을 누르면 SW 를 즉시 활성화(SKIP_WAITING) 한 뒤
 * 페이지를 새로고침해서 최신 빌드를 반영한다.
 */
export default function PwaUpdateBanner() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    const showBanner = (sw: ServiceWorker | null) => {
      if (cancelled) return;
      if (!sw) return;
      setWaitingWorker(sw);
      setVisible(true);
    };

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      // 이미 대기 중인 새 워커가 있으면 즉시 배너 노출
      if (reg.waiting && navigator.serviceWorker.controller) {
        showBanner(reg.waiting);
      }

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            showBanner(newWorker);
          }
        });
      });
    });

    // SW 가 보낸 업데이트 알림 수신 시에도 배너 노출
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_UPDATED") {
        navigator.serviceWorker.getRegistration().then((reg) => {
          showBanner(reg?.waiting ?? reg?.active ?? null);
        });
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  const handleUpdate = () => {
    try {
      waitingWorker?.postMessage("SKIP_WAITING");
    } catch {
      // ignore
    }
    // controllerchange 리스너(main.tsx)에서 자동 reload 되지만,
    // 폴백으로 약간의 지연 후 직접 새로고침
    setTimeout(() => {
      window.location.reload();
    }, 400);
  };

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 inset-x-0 z-[10300] flex items-center justify-between gap-3 bg-primary text-primary-foreground px-4 py-2 shadow-md text-sm"
    >
      <span className="truncate">새 버전이 있습니다.</span>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleUpdate}
          className="rounded-md bg-white/15 hover:bg-white/25 px-3 py-1 font-semibold transition-colors"
        >
          업데이트하기
        </button>
        <button
          onClick={() => setVisible(false)}
          aria-label="닫기"
          className="rounded-md px-2 py-1 hover:bg-white/15"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
