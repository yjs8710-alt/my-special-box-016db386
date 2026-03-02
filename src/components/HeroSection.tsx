import { useState } from "react";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const categories = ["전체", "상가", "사무실", "식당·카페", "공장·창고", "병원·학원"];
const regions = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "제주", "울산", "수원", "전주", "청주"];


const HeroSection = () => {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  return (
    <section className="relative min-h-[520px] flex flex-col justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="absolute inset-0 bg-hero-overlay/80" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="text-center mb-8">
          <span className="inline-block bg-accent/20 text-accent text-xs font-bold px-3 py-1 rounded-full mb-4 border border-accent/30">
            100% 실매물 보장 플랫폼
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
            집을 찾다, <span className="text-accent">집다</span>
          </h1>
          <p className="text-base sm:text-lg text-white/80 font-light">
            전국 상가·사무실 공실 정보를 한 번에. 허위매물 없는 검증된 매물만 제공합니다.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 flex-wrap justify-center mb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col sm:flex-row mb-6">
          <div className="flex items-center gap-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-border min-w-[120px] cursor-pointer hover:bg-muted transition-colors">
            <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
            <span className="text-sm font-semibold text-primary">서울 전체</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="지역, 건물명, 역명 검색..."
            className="flex-1 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <Button
            size="lg"
            onClick={() => navigate("/map")}
            className="m-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 flex-shrink-0"
          >
            <Search className="w-4 h-4 mr-1" />
            검색
          </Button>
        </div>

        {/* Region Quick Buttons */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-white/60 text-xs font-medium">지역을 선택하면 지도 매물화면으로 이동합니다</p>
          <div className="flex flex-wrap justify-center gap-2">
            {regions.map((r) => (
              <button
                key={r}
                onClick={() => navigate("/map")}
                className="px-4 py-1.5 rounded-lg border border-white/40 text-white text-sm font-semibold hover:bg-white hover:text-primary transition-all duration-200 backdrop-blur-sm hover:shadow-md"
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-center gap-8 mt-8">
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

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40">
        <ArrowRight className="w-4 h-4 rotate-90 animate-bounce" />
      </div>
    </section>
  );
};

export default HeroSection;
