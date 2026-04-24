import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import heroLogo from "@/assets/hero-logo.png";
import InstallAppCard from "@/components/InstallAppCard";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden">
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#071a3d]/70 via-[#0b234d]/45 to-[#071a3d]/70" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center gap-1 px-4 py-16">
        <img
          src={heroLogo}
          alt="집다 로고"
          className="w-72 md:w-96 opacity-95 drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
        />

        <button
          onClick={() => navigate("/residential")}
          className="mt-2 px-12 py-3 rounded-xl border-2 border-white/50 text-white text-xl font-bold hover:bg-white hover:text-primary transition-all duration-200 backdrop-blur-sm drop-shadow-lg"
        >
          청주
        </button>
      </div>

      {/* 우측 상단 앱 설치 카드 (데스크톱) */}
      <div className="hidden md:block absolute right-6 lg:right-10 top-6 z-20">
        <InstallAppCard />
      </div>

      {/* 모바일: 하단 고정 */}
      <div className="md:hidden absolute left-4 right-4 bottom-6 z-20 flex justify-center">
        <InstallAppCard />
      </div>
    </section>
  );
};

export default HeroSection;
