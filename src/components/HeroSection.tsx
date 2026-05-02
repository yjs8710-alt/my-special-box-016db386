import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ClipboardList, Search, User } from "lucide-react";
import heroBg from "@/assets/main-bg-20260427-v2-20260427.jpg";
import heroLogo from "@/assets/logo-zibda-active-20260427-v4.png";
import iconResidential from "@/assets/icon-residential-v2-20260427.png";
import iconCommercial from "@/assets/icon-commercial-v2-20260427.png";
import iconCollective from "@/assets/icon-collective-v2-20260427.png";
import iconLand from "@/assets/icon-land-v2-20260427.png";

const CATEGORIES = [
  { label: "주거·임대", path: "/residential", icon: iconResidential },
  { label: "상업·임대·매매", path: "/non-residential", icon: iconCommercial },
  { label: "집합건물·건물매매", path: "/collective-sale", icon: iconCollective },
  { label: "토지", path: "/land", icon: iconLand },
];

const APP_ACTIONS = [
  { label: "주거임대", path: "/residential", Icon: Search },
  { label: "내 매물", path: "/my-properties", Icon: ClipboardList },
  { label: "마이페이지", path: "/my-page", Icon: User },
];

const HeroSection = () => {
  const navigate = useNavigate();
  const [isAppMode] = useState(false);

  return (
    <section className="relative min-h-[calc(100vh-64px)] flex items-start md:items-center justify-center overflow-hidden">
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        loading="eager"
        decoding="async"
        // @ts-expect-error fetchpriority is valid HTML
        fetchpriority="high"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#071a3d]/70 via-[#0b234d]/45 to-[#071a3d]/70" />

      <div className="relative z-10 w-full flex flex-col items-center text-center gap-6 px-4 pt-6 md:pt-16 pb-16">
        {isAppMode && (
          <div className="md:hidden inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-primary/90 px-3 py-1.5 text-xs font-extrabold text-primary-foreground shadow-lg backdrop-blur-md">
            <CheckCircle2 className="h-4 w-4" />
            집다 앱으로 실행 중
          </div>
        )}

        <img
          src={heroLogo}
          alt="집다 로고"
          loading="eager"
          decoding="async"
          // @ts-expect-error fetchpriority is valid HTML
          fetchpriority="high"
          width={384}
          height={120}
          className="w-56 md:w-96 opacity-95 drop-shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
        />

        {/* 카테고리 그리드 — 모바일 전용 (데스크톱은 기존 빈 상태 유지) */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-md mt-2 md:hidden">
          {CATEGORIES.map(({ label, path, icon }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="group flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl border-2 border-white/50 bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-primary transition-all duration-200 shadow-lg"
            >
              <img src={icon} alt={label} loading="lazy" decoding="async" width={56} height={56} className="w-14 h-14 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.25)]" />
              <span className="text-sm font-bold leading-tight px-2">{label}</span>
            </button>
          ))}
        </div>

        {isAppMode && (
          <div className="md:hidden w-full max-w-md rounded-2xl border border-white/25 bg-white/10 p-3 shadow-2xl backdrop-blur-md">
            <div className="grid grid-cols-3 gap-2">
              {APP_ACTIONS.map(({ label, path, Icon }) => (
                <button
                  key={label}
                  onClick={() => navigate(path)}
                  className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl bg-white text-primary shadow-sm transition-colors hover:bg-white/90"
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                  <span className="text-[11px] font-extrabold leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>

  );
};

export default HeroSection;
