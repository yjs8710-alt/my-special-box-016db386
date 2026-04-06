import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import logoImg from "@/assets/logo.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[520px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#071a3d]/70 via-[#0b234d]/45 to-[#071a3d]/70" />

      <div className="relative z-10 flex flex-col items-center justify-center text-center gap-5 px-4 py-16">
        <img
          src={logoImg}
          alt="집다 로고"
          className="w-56 md:w-72 lg:w-96 h-auto object-contain opacity-95 drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        />

        <p className="text-lg sm:text-xl md:text-2xl text-white/90 font-medium tracking-wide drop-shadow-lg">
          공인중개사 전용 부동산 플랫폼
        </p>

        <button
          onClick={() => navigate("/residential")}
          className="mt-2 px-12 py-3 rounded-xl border-2 border-white/50 text-white text-xl font-bold hover:bg-white hover:text-primary transition-all duration-200 backdrop-blur-sm drop-shadow-lg"
        >
          청주
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
