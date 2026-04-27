import { useState } from "react";
import { Download } from "lucide-react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import InstallAppModal from "@/components/InstallAppModal";

const Home = () => {
  const [showInstall, setShowInstall] = useState(false);

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />

      {/* 우측 상단 플로팅 "앱 설치" 버튼 (메인 화면 전용) */}
      <button
        onClick={() => setShowInstall(true)}
        className="fixed top-16 right-4 sm:top-20 sm:right-6 z-[900] flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 hover:shadow-xl animate-fade-in"
        style={{
          background: "hsl(var(--accent))",
          color: "white",
          border: "2px solid rgba(255,255,255,0.2)",
        }}
        aria-label="앱 설치 안내 열기"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-bold whitespace-nowrap">앱 설치</span>
        <span className="hidden sm:inline text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/20 ml-1">
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
