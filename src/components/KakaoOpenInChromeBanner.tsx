import { useEffect, useState } from "react";
import { X, ExternalLink } from "lucide-react";

const STORAGE_KEY = "kakao_chrome_banner_dismissed";

export const KakaoOpenInChromeBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const ua = navigator.userAgent || "";
    const isKakao = /KAKAOTALK/i.test(ua);
    const dismissed = sessionStorage.getItem(STORAGE_KEY) === "1";
    if (isKakao && !dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  const openInChrome = () => {
    const url = window.location.href;
    // KakaoTalk 인앱브라우저 외부 브라우저 열기 스킴
    window.location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(url);
  };

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  return (
    <div
      className="fixed left-0 right-0 z-[99999] bg-amber-500 text-black shadow-lg"
      style={{ top: 0 }}
      role="alert"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 text-sm font-medium leading-snug">
          <div className="font-bold">카카오톡 인앱브라우저에서 열렸습니다</div>
          <div className="text-xs mt-0.5 opacity-90">
            정상 이용을 위해 Chrome 등 외부 브라우저로 열어주세요.
          </div>
        </div>
        <button
          onClick={openInChrome}
          className="flex items-center gap-1 bg-black text-white px-3 py-2 rounded-md text-xs font-bold whitespace-nowrap"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          외부 열기
        </button>
        <button
          onClick={dismiss}
          aria-label="닫기"
          className="p-1 rounded hover:bg-black/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
