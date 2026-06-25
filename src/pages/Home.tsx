import { useEffect, useState, lazy, Suspense } from "react";
import { Download } from "lucide-react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
const InstallAppModal = lazy(() => import("@/components/InstallAppModal"));

const Home = () => {
  const [showInstall, setShowInstall] = useState(false);
  const [hideInstallButton, setHideInstallButton] = useState(false);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.time("Home:firstRender");
      requestAnimationFrame(() => {
        console.timeEnd("Home:firstRender");
      });
    }
  }, []);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    const INSTALLED_KEY = "jibda_pwa_installed_v1";

    const markInstalled = () => {
      try { localStorage.setItem(INSTALLED_KEY, "1"); } catch {}
      setHideInstallButton(true);
    };

    const checkInstalled = async () => {
      const isStandalone =
        window.matchMedia?.("(display-mode: standalone)").matches ||
        window.matchMedia?.("(display-mode: fullscreen)").matches ||
        window.matchMedia?.("(display-mode: minimal-ui)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.startsWith("android-app://");

      if (isStandalone) {
        markInstalled();
        return;
      }

      // 과거에 설치 감지된 적이 있으면 계속 숨김
      try {
        if (localStorage.getItem(INSTALLED_KEY) === "1") {
          setHideInstallButton(true);
          return;
        }
      } catch {}

      // Chrome/Android: 설치된 관련 PWA 조회
      try {
        const nav: any = navigator;
        if (typeof nav.getInstalledRelatedApps === "function") {
          const apps = await nav.getInstalledRelatedApps();
          if (Array.isArray(apps) && apps.length > 0) {
            markInstalled();
            return;
          }
        }
      } catch {}

      // 데스크톱은 버튼 노출 의미 없음 → 숨김
      setHideInstallButton(!isMobile);
    };

    checkInstalled();
    const mql = window.matchMedia?.("(display-mode: standalone)");
    mql?.addEventListener?.("change", checkInstalled);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      mql?.removeEventListener?.("change", checkInstalled);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);



  return (
    <div className="h-screen md:h-auto md:min-h-screen flex flex-col relative overflow-hidden md:overflow-visible">
      <Header />

      {/* 우측 상단 플로팅 "모바일 앱 설치" 버튼 (메인 화면 전용) */}
      {!hideInstallButton && (
      <button
        onClick={() => setShowInstall(true)}
        className="fixed top-16 right-4 sm:top-20 sm:right-6 z-[900] flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-xl animate-fade-in"
        style={{
          background: "hsl(var(--header-bg))",
          color: "white",
          border: "1px solid hsl(var(--header-border))",
        }}
        aria-label="모바일 앱 설치 안내 열기"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-bold whitespace-nowrap">모바일 앱 설치</span>
        <span className="hidden sm:inline text-[10px] font-semibold px-1.5 py-0.5 rounded ml-1" style={{ background: "hsl(var(--accent))", color: "white" }}>
          Chrome 권장
        </span>
      </button>
      )}

      {showInstall && (
        <Suspense fallback={null}>
          <InstallAppModal open={showInstall} onClose={() => setShowInstall(false)} />
        </Suspense>
      )}

      <main className="flex-1 overflow-hidden md:overflow-visible">
        <HeroSection />
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
};

export default Home;
