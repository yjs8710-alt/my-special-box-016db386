import { useEffect, useState } from "react";
import { Download, Smartphone, Check } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallAppCardProps {
  variant?: "floating" | "inline";
}

const InstallAppCard = ({ variant = "inline" }: InstallAppCardProps) => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    setIsIOS(iOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => {
      setInstalled(true);
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
    if (!deferred) {
      // 데스크톱이거나 지원 안 되는 경우 → 가이드 띄우기
      setShowIOSGuide(true);
      return;
    }
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferred(null);
  };

  if (installed) {
    return (
      <div className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md p-5 text-white text-center">
        <Check className="w-6 h-6 mx-auto mb-1.5 text-emerald-300" />
        <p className="text-sm font-bold">앱이 설치되어 있습니다</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border border-white/25 bg-white/10 backdrop-blur-md p-5 text-white shadow-2xl w-[260px]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight">집다 앱 설치</p>
            <p className="text-[11px] text-white/70 leading-tight mt-2">
              {isIOS ? "공유 → 홈 화면에 추가" : "버튼 한 번으로 설치"}
            </p>
          </div>
        </div>
        <div className="mb-6" />
        <button
          onClick={handleInstall}
          className="w-full flex items-center justify-center gap-1.5 text-sm font-bold px-3 py-2.5 rounded-xl bg-white text-primary hover:bg-white/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          {isIOS ? "설치 방법 보기" : deferred ? "지금 설치하기" : "홈 화면에 추가"}
        </button>
      </div>

      {showIOSGuide && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowIOSGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-foreground mb-3">홈 화면에 추가하는 방법</h3>
            {isIOS ? (
              <ol className="text-sm text-foreground space-y-2.5 list-decimal list-inside">
                <li>Safari 하단의 <b>공유 버튼</b> ⬆️ 을 누르세요</li>
                <li><b>"홈 화면에 추가"</b>를 선택하세요</li>
                <li>우측 상단 <b>"추가"</b>를 눌러 완료하세요</li>
              </ol>
            ) : (
              <ol className="text-sm text-foreground space-y-2.5 list-decimal list-inside">
                <li>주소창 우측의 <b>설치 아이콘</b> 또는 <b>⋮ 메뉴</b>를 누르세요</li>
                <li><b>"앱 설치"</b> 또는 <b>"홈 화면에 추가"</b>를 선택하세요</li>
                <li>확인을 눌러 설치를 완료하세요</li>
              </ol>
            )}
            <p className="text-[11px] text-muted-foreground mt-3">
              ※ 모바일 브라우저(Safari/Chrome)에서 가장 잘 동작합니다.
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-4 py-2 rounded-lg bg-primary text-white text-sm font-bold"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallAppCard;
