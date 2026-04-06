import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import logoImg from "@/assets/logo.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[520px] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[rgba(15,23,42,0.45)] via-[rgba(15,23,42,0.55)] to-[rgba(15,23,42,0.45)]" />

      <div className="relative z-10 flex flex-col items-center justify-center px-4 py-16">
        <img src={logoImg} alt="집다 로고" className="h-28 sm:h-36 md:h-44 object-contain mb-6 drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)]" />

        <p className="text-lg sm:text-xl md:text-2xl text-white font-medium tracking-wide mb-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          공인중개사 전용 부동산 플랫폼
        </p>

        <button
          onClick={() => navigate("/residential")}
          className="px-12 py-3.5 rounded-xl border-2 border-white/40 text-white text-xl font-extrabold hover:bg-white hover:text-primary transition-all duration-200 backdrop-blur-sm hover:shadow-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
        >
          청주
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
