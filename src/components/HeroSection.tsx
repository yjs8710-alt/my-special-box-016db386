import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import logoImg from "@/assets/logo.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[520px] flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 sm:px-6 py-16 w-full">
        {/* 로고 */}
        <img src={logoImg} alt="집다 로고" className="h-28 sm:h-36 md:h-44 object-contain mb-6" />

        {/* 서브 텍스트 */}
        <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-medium tracking-wide mb-8">
          공인중개사 전용 부동산 플랫폼
        </p>

        {/* 청주 버튼 */}
        <button
          onClick={() => navigate("/residential")}
          className="px-12 py-3.5 rounded-xl border-2 border-white/60 text-white text-xl font-extrabold hover:bg-white hover:text-primary transition-all duration-200 backdrop-blur-sm hover:shadow-lg"
        >
          청주
        </button>
      </div>

      {/* 하단 안내 바 */}
      <div className="relative z-10 w-full">
        <div className="mx-auto max-w-3xl px-4 pb-6">
          <div className="flex items-center justify-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-6 py-3 border border-white/20">
            <MapPin className="w-5 h-5 text-accent flex-shrink-0" />
            <span className="text-white/80 text-sm font-medium">지역을 선택하면 지도 매물확인으로 이동합니다.</span>
            <button
              onClick={() => navigate("/residential")}
              className="ml-2 px-5 py-1.5 rounded-lg border border-white/40 text-white text-sm font-bold hover:bg-white hover:text-primary transition-all"
            >
              청주
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
