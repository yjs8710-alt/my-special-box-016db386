import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import InstallAppModal from "@/components/InstallAppModal";

const Home = () => {
  const [showInstall, setShowInstall] = useState(false);
  const [hideInstallButton, setHideInstallButton] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);

    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia?.("(display-mode: standalone)").matches ||
        window.matchMedia?.("(display-mode: fullscreen)").matches ||
        window.matchMedia?.("(display-mode: minimal-ui)").matches ||
        // iOS Safari
        (window.navigator as any).standalone === true ||
        // Android TWA
        document.referrer.startsWith("android-app://");

      // 모바일이면서 앱(스탠드얼론)으로 실행 중이면 버튼 숨김
      setHideInstallButton(isMobile && isStandalone);
    };

    checkInstalled();
    const mql = window.matchMedia?.("(display-mode: standalone)");
    mql?.addEventListener?.("change", checkInstalled);
    return () => mql?.removeEventListener?.("change", checkInstalled);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative">
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

      <InstallAppModal open={showInstall} onClose={() => setShowInstall(false)} />

      <main className="flex-1">
        <HeroSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
