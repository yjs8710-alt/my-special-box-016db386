import { useEffect, useState } from "react";
import { Download, Smartphone, Check, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallAppCardProps {
  variant?: "floating" | "inline";
}

type DeviceKind = "ios" | "android" | "desktop";
type GuideKind = "ios" | "android" | "inapp" | "desktop";

const detectDevice = (): {
  kind: DeviceKind;
  isInApp: boolean;
} => {
  const ua = window.navigator.userAgent || "";
  const iOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
  const android = /Android/i.test(ua);

  // 카카오톡, 네이버앱, 인스타그램, 페이스북, 라인 등 인앱 브라우저 감지
  const isInApp =
    /KAKAOTALK|NAVER\(inapp|FB_IAB|FBAN|FBAV|Instagram|Line\/|wv\)/i.test(ua) &&
    !/Chrome\/\d+\.\d+ Mobile Safari/.test(ua.replace(/; wv\)/, ""));

  if (iOS) return { kind: "ios", isInApp };
  if (android) return { kind: "android", isInApp };
  return { kind: "desktop", isInApp };
};

const InstallAppCard = ({ variant = "inline" }: InstallAppCardProps) => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [device, setDevice] = useState<DeviceKind>("desktop");
  const [isInApp, setIsInApp] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [guide, setGuide] = useState<GuideKind | null>(null);

  useEffect(() => {
    const checkStandalone = () => {
      const mql = window.matchMedia("(display-mode: standalone)");
      const isStandalone =
        mql.matches ||
        // @ts-expect-error iOS Safari only
        window.navigator.standalone === true ||
        document.referrer.startsWith("android-app://");
      if (isStandalone) setInstalled(true);
      return isStandalone;
    };

    if (checkStandalone()) return;

    const d = detectDevice();
    setDevice(d.kind);
    setIsInApp(d.isInApp);

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

    // display-mode 가 도중에 바뀌는 경우 (설치 직후 등) 감지
    const mql = window.matchMedia("(display-mode: standalone)");
    const mqlHandler = (e: MediaQueryListEvent) => {
      if (e.matches) setInstalled(true);
    };
    mql.addEventListener?.("change", mqlHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
      mql.removeEventListener?.("change", mqlHandler);
    };
  }, []);

  const openInExternalBrowser = () => {
    const url = window.location.href;
    const ua = window.navigator.userAgent || "";

    if (/Android/i.test(ua)) {
      // Android Chrome intent — 카카오톡/네이버 인앱에서 Chrome으로 강제 이동
      const cleaned = url.replace(/^https?:\/\//, "");
      window.location.href = `intent://${cleaned}#Intent;scheme=https;package=com.android.chrome;end`;
      return;
    }

    // iOS 인앱: 클립보드 복사 후 안내
    navigator.clipboard?.writeText(url).then(
      () => toast.success("주소가 복사되었습니다. Safari에 붙여넣어 열어주세요."),
      () => toast.error("주소 복사에 실패했습니다.")
    );
  };

  const handleInstall = async () => {
    // 인앱 브라우저는 PWA 설치 불가 → 외부 브라우저로 안내
    if (isInApp) {
      setGuide("inapp");
      return;
    }

    if (device === "ios") {
      setGuide("ios");
      return;
    }

    if (deferred) {
      try {
        await deferred.prompt();
        const { outcome } = await deferred.userChoice;
        if (outcome === "accepted") setInstalled(true);
        setDeferred(null);
        return;
      } catch {
        // fallthrough → 가이드 표시
      }
    }

    // Android Chrome인데 아직 prompt 이벤트가 안 옴 → 수동 안내
    setGuide(device === "android" ? "android" : "desktop");
  };

  if (installed) {
    // 앱이 이미 설치되어 있으면 카드 자체를 렌더링하지 않음
    return null;
  }

  const subText = isInApp
    ? "외부 브라우저에서 설치"
    : device === "ios"
    ? "공유 → 홈 화면에 추가"
    : "버튼 한 번으로 설치";

  const buttonText = isInApp
    ? "Chrome으로 열기"
    : device === "ios"
    ? "설치 방법 보기"
    : deferred
    ? "지금 설치하기"
    : "홈 화면에 추가";

  return (
    <>
      <div className="rounded-2xl border border-white/25 bg-white/10 backdrop-blur-md p-5 text-white shadow-2xl w-full max-w-[260px]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-extrabold leading-tight">집다 앱 설치</p>
            <p className="text-[11px] text-white/70 leading-tight mt-2">{subText}</p>
          </div>
        </div>
        <div className="mb-6" />
        <button
          onClick={handleInstall}
          className="w-full flex items-center justify-center gap-1.5 text-sm font-bold px-3 py-2.5 rounded-xl bg-white text-primary hover:bg-white/90 transition-colors"
        >
          {isInApp ? <ExternalLink className="w-4 h-4" /> : <Download className="w-4 h-4" />}
          {buttonText}
        </button>
      </div>

      {guide && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setGuide(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card border border-border p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-foreground mb-3">
              {guide === "inapp" ? "외부 브라우저로 열어주세요" : "홈 화면에 추가하는 방법"}
            </h3>

            {guide === "ios" && (
              <ol className="text-sm text-foreground space-y-2.5 list-decimal list-inside">
                <li>
                  Safari 하단의 <b>공유 버튼</b> ⬆️ 을 누르세요
                </li>
                <li>
                  <b>"홈 화면에 추가"</b>를 선택하세요
                </li>
                <li>
                  우측 상단 <b>"추가"</b>를 눌러 완료하세요
                </li>
              </ol>
            )}

            {guide === "android" && (
              <ol className="text-sm text-foreground space-y-2.5 list-decimal list-inside">
                <li>
                  주소창 우측의 <b>⋮ 메뉴</b>를 누르세요
                </li>
                <li>
                  <b>"앱 설치"</b> 또는 <b>"홈 화면에 추가"</b>를 선택하세요
                </li>
                <li>확인을 눌러 설치를 완료하세요</li>
              </ol>
            )}

            {guide === "desktop" && (
              <ol className="text-sm text-foreground space-y-2.5 list-decimal list-inside">
                <li>
                  주소창 우측의 <b>설치 아이콘</b> 또는 <b>⋮ 메뉴</b>를 누르세요
                </li>
                <li>
                  <b>"앱 설치"</b>를 선택하세요
                </li>
              </ol>
            )}

            {guide === "inapp" && (
              <div className="space-y-3">
                <p className="text-sm text-foreground">
                  카카오톡·네이버 등 인앱 브라우저에서는 앱 설치가 지원되지 않습니다.
                  <br />
                  <b>Chrome 또는 Safari</b>에서 열어주세요.
                </p>
                <button
                  onClick={openInExternalBrowser}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-primary text-white text-sm font-bold"
                >
                  {device === "ios" ? (
                    <>
                      <Copy className="w-4 h-4" /> 주소 복사 (Safari에 붙여넣기)
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" /> Chrome으로 열기
                    </>
                  )}
                </button>
                {device === "ios" && (
                  <p className="text-[11px] text-muted-foreground">
                    또는 우측 상단 메뉴(···) → <b>"Safari로 열기"</b>를 선택하세요.
                  </p>
                )}
              </div>
            )}

            {guide !== "inapp" && (
              <p className="text-[11px] text-muted-foreground mt-3">
                ※ Chrome / Safari 에서 가장 잘 동작합니다.
              </p>
            )}

            <button
              onClick={() => setGuide(null)}
              className="w-full mt-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-bold"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallAppCard;
