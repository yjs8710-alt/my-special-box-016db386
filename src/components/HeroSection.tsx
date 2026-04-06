import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import logoIcon from "@/assets/logo.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[520px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#071a3d]/70 via-[#0b234d]/45 to-[#071a3d]/70" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center gap-6 px-4 py-16">
        <div className="flex items-center justify-center gap-4">
          <img
            src={logoIcon}
            alt="집다 아이콘"
            className="w-24 md:w-32 lg:w-40 xl:w-48 h-auto object-contain shrink-0"
          />
          <span className="text-white font-extrabold tracking-tight leading-none text-5xl md:text-7xl lg:text-8xl xl:text-[110px] drop-shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
            집다
          </span>
        </div>

        <p className="text-white/90 font-semibold text-xl md:text-2xl tracking-wide drop-shadow-lg">
          공인중개사 전용 부동산 플랫폼
        </p>

        <button
          onClick={() => navigate("/residential")}
          className="mt-2 px-10 py-4 rounded-xl border border-white/30 bg-[#0d2d68]/70 text-white text-xl font-bold hover:bg-white hover:text-primary transition-all duration-200 backdrop-blur-sm drop-shadow-lg"
        >
          청주
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
