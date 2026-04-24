import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa_install_dismissed_at";
const DISMISS_DAYS = 7;

const InstallPWAPrompt = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 이미 설치됨 → 숨김
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    if (standalone) return;

    // 7일 내 거절했으면 숨김
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const diff = Date.now() - Number(dismissed);
      if (diff < DISMISS_DAYS * 24 * 60 * 60 * 1000) return;
    }

    // iframe 안에서는 숨김 (Lovable preview)
    try {
      if (window.self !== window.top) return;
    } catch {
      return;
    }

    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    setIsIOS(iOS);

    if (iOS) {
      // iOS는 beforeinstallprompt 미지원 → 안내 배너 표시
      setShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setShow(false);
      setDeferred(null);
    };
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferred(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
    setShowIOSGuide(false);
  };

  if (!show) return null;

  if (showIOSGuide) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 shadow-2xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-foreground">홈 화면에 추가하기</h3>
            <button onClick={handleDismiss} className="p-1 rounded-lg hover:bg-muted">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <ol className="text-sm text-foreground space-y-2.5 list-decimal list-inside">
            <li>Safari 하단의 <b>공유 버튼</b> <span className="inline-block px-1.5 py-0.5 rounded bg-muted text-xs">⬆️</span> 을 누르세요</li>
            <li><b>"홈 화면에 추가"</b>를 선택하세요</li>
            <li>우측 상단 <b>"추가"</b>를 눌러 완료하세요</li>
          </ol>
          <p className="text-[11px] text-muted-foreground mt-3">
            ※ Safari 브라우저에서만 가능합니다. (Chrome 불가)
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[360px] z-[9999]">
      <div
        className="rounded-2xl shadow-2xl border p-4 flex items-start gap-3"
        style={{
          background: "hsl(var(--card))",
          borderColor: "hsl(var(--border))",
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "hsl(var(--primary) / 0.12)" }}
        >
          <Smartphone className="w-5 h-5" style={{ color: "hsl(var(--primary))" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">집다 앱 설치</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            홈 화면에 추가하면 앱처럼 빠르게 사용할 수 있어요.
          </p>
          <div className="flex gap-2 mt-2.5">
            <button
              onClick={handleInstall}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Download className="w-3.5 h-3.5" />
              설치하기
            </button>
            <button
              onClick={handleDismiss}
              className="text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted"
            >
              나중에
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg hover:bg-muted flex-shrink-0"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default InstallPWAPrompt;
