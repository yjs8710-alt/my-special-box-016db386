import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logoImg from "@/assets/logo.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[560px] flex flex-col justify-center overflow-hidden bg-gradient-to-br from-[hsl(210,90%,15%)] via-[hsl(215,85%,22%)] to-[hsl(205,80%,30%)]">
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[hsl(210,90%,50%)] opacity-[0.07] blur-[120px] -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[hsl(200,90%,55%)] opacity-[0.06] blur-[100px] translate-y-1/3 -translate-x-1/4" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-16 w-full flex flex-col items-center">
        {/* Logo */}
        <div className="mb-8">
          <img
            src={logoImg}
            alt="집다 로고"
            className="h-24 sm:h-32 md:h-40 w-auto object-contain drop-shadow-lg"
          />
        </div>

        <p className="text-center text-white/70 text-sm sm:text-base font-light mb-2">
          — 쉽고 빠른 부동산 플랫폼 —
        </p>

        <p className="text-center text-white/55 text-xs sm:text-sm max-w-md mb-10 leading-relaxed">
          청주 공실 임대 · 매매 정보를 중개사만을 위해.<br />
          허위매물 없는 검증된 매물만 제공합니다.
        </p>

        {/* Region Quick Button */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-white/40 text-xs font-medium">지역을 선택하면 매물화면으로 이동합니다</p>
          <button
            onClick={() => navigate("/residential")}
            className="px-10 py-3 rounded-xl border-2 border-white/40 text-white text-lg font-extrabold hover:bg-white hover:text-primary transition-all duration-200 backdrop-blur-sm hover:shadow-lg"
          >
            청주
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30">
        <ArrowRight className="w-4 h-4 rotate-90 animate-bounce" />
      </div>
    </section>
  );
};

export default HeroSection;
