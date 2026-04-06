import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import logoImg from "@/assets/logo.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[520px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#071a3d]/70 via-[#0b234d]/45 to-[#071a3d]/70" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center gap-6 px-4 py-16">
        <img
          src={logoImg}
          alt="집다 로고"
          className="w-[220px] md:w-[320px] lg:w-[420px] xl:w-[520px] h-auto object-contain"
        />

        <p className="text-white font-semibold text-xl md:text-2xl drop-shadow-lg">
          공인중개사 전용 부동산 플랫폼
        </p>

        <button
          onClick={() => navigate("/residential")}
          className="px-8 py-4 rounded-xl border border-white/30 bg-[#0d2d68]/70 text-white font-bold text-xl hover:bg-white hover:text-primary transition-all duration-200"
        >
          청주
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
