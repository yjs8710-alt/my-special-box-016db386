import { useNavigate } from "react-router-dom";
import { Building, Store, Building2, Trees } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import heroLogo from "@/assets/hero-logo.png";
import InstallAppCard from "@/components/InstallAppCard";

const CATEGORIES = [
  { label: "주거·임대", path: "/residential", Icon: Building },
  { label: "상업·임대·매매", path: "/non-residential", Icon: Store },
  { label: "집합건물·건물매매", path: "/collective-sale", Icon: Building2 },
  { label: "토지", path: "/land", Icon: Trees },
];

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-start md:items-center justify-center overflow-hidden">
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#071a3d]/70 via-[#0b234d]/45 to-[#071a3d]/70" />

      <div className="relative z-10 w-full flex flex-col items-center text-center gap-6 px-4 pt-6 md:pt-16 pb-16">
        <img
          src={heroLogo}
          alt="집다 로고"
          className="w-56 md:w-96 opacity-95 drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
        />

        {/* 카테고리 그리드 — 모바일/데스크톱 모두 노출 */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 w-full max-w-md md:max-w-2xl mt-2">
          {CATEGORIES.map(({ label, path, Icon }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="group flex flex-col items-center justify-center gap-2 aspect-square md:aspect-auto md:py-8 rounded-2xl border-2 border-white/50 bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-primary transition-all duration-200 shadow-lg"
            >
              <Icon className="w-7 h-7 md:w-9 md:h-9" strokeWidth={1.8} />
              <span className="text-sm md:text-lg font-bold leading-tight px-2">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 우측 상단 앱 설치 카드 (데스크톱) */}
      <div className="hidden md:block absolute right-6 lg:right-10 top-6 z-20">
        <InstallAppCard />
      </div>
    </section>
  );
};

export default HeroSection;
