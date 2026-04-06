import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import logoImg from "@/assets/logo.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative w-full h-[calc(100vh-80px)] flex items-center justify-center">
      <img
        src={heroBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />

      <div className="relative z-10 flex flex-col items-center text-center gap-6">
        <img
          src={logoImg}
          alt="집다 로고"
          className="w-44 md:w-56 opacity-95 drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
        />
        <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
          집다
        </h1>
        <p className="text-white/80 text-lg md:text-xl">
          공인중개사 전용 부동산 플랫폼
        </p>
        <button
          onClick={() => navigate("/residential")}
          className="mt-4 px-8 py-4 rounded-xl bg-[#1e3a8a] text-white text-lg font-semibold hover:bg-[#1e40af] transition"
        >
          청주
        </button>
      </div>
    </div>
  );
};

export default HeroSection;
