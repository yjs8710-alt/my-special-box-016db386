import { ArrowRight, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import logoImg from "@/assets/logo.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[520px] flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="absolute inset-0 bg-hero-overlay/70" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="flex flex-col items-center mb-10">
          <img src={logoImg} alt="집다 로고" className="h-28 sm:h-36 md:h-44 object-contain mb-4" />
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-medium tracking-wide">
            공인중개사 전용 부동산 플랫폼
          </p>
        </div>

        {/* Region Quick Button */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={() => navigate("/residential")}
            className="px-10 py-3 rounded-xl border-2 border-white/60 text-white text-lg font-extrabold hover:bg-white hover:text-primary transition-all duration-200 backdrop-blur-sm hover:shadow-lg"
          >
            청주
          </button>
        </div>
      </div>

      {/* 하단 안내 바 */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="flex items-center justify-center gap-3 py-4 px-4 backdrop-blur-md" style={{ background: "rgba(0,0,0,0.45)" }}>
          <MapPin className="w-5 h-5 text-accent flex-shrink-0" />
          <p className="text-white/80 text-sm sm:text-base">지역을 선택하면 지도 매물확인으로 이동합니다.</p>
          <button
            onClick={() => navigate("/residential")}
            className="px-5 py-1.5 rounded-lg border border-white/40 text-white text-sm font-bold hover:bg-white/10 transition-colors flex-shrink-0"
          >
            청주
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
