import { useState } from "react";
import { Search, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const categories = ["전체", "상가", "사무실", "식당·카페", "공장·창고", "병원·학원"];
const regions = ["서울", "경기", "인천", "부산", "대구", "대전", "광주", "제주"];

const HeroSection = () => {
  const [activeCategory, setActiveCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("서울");

  return (
    <section className="relative min-h-[480px] flex flex-col justify-center overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-hero-overlay/75" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-3 leading-tight">
            공실 매물, 한 번에 찾기
          </h1>
          <p className="text-base sm:text-lg text-white/80 font-light">
            전국 상가·사무실 공실 정보를 빠르게 검색하세요
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
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col sm:flex-row">
          {/* Region Select */}
          <div className="flex items-center gap-1 px-4 py-3 border-b sm:border-b-0 sm:border-r border-border min-w-[130px] cursor-pointer hover:bg-muted transition-colors">
            <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="text-sm font-medium text-foreground bg-transparent outline-none cursor-pointer w-full"
            >
              {regions.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="지역, 건물명, 역명 검색..."
            className="flex-1 px-5 py-4 text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />

          {/* Search Button */}
          <Button
            size="lg"
            className="m-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 flex-shrink-0"
          >
            <Search className="w-4 h-4 mr-1" />
            검색
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-center gap-8 mt-6">
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
    </section>
  );
};

export default HeroSection;
