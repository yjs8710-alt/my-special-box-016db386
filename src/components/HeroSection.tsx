import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[520px] flex flex-col justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="absolute inset-0 bg-hero-overlay/80" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="text-center mb-10">
          <span className="inline-block bg-accent/20 text-accent text-xs font-bold px-3 py-1 rounded-full mb-4 border border-accent/30">
            중개사 전용 플랫폼
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
            집을 찾다, <span className="text-accent">집다</span>
          </h1>
          <p className="text-base sm:text-lg text-white/80 font-light">
            청주 공실 임대 · 매매 정보를 중개사만을 위해. 허위매물 없는 검증된 매물만 제공합니다.
          </p>
        </div>

        {/* Region Quick Button - 청주만 */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-white/60 text-xs font-medium">지역을 선택하면 지도 매물화면으로 이동합니다</p>
          <button
            onClick={() => navigate("/map")}
            className="px-8 py-3 rounded-xl border-2 border-white/60 text-white text-lg font-extrabold hover:bg-white hover:text-primary transition-all duration-200 backdrop-blur-sm hover:shadow-lg"
          >
            청주
          </button>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-center gap-8 mt-10">
          {[
            { label: "전국 매물", value: "12,430+" },
            { label: "오늘 신규", value: "284" },
            { label: "이번 주 계약", value: "1,021" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/70 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40">
        <ArrowRight className="w-4 h-4 rotate-90 animate-bounce" />
      </div>
    </section>
  );
};

export default HeroSection;
