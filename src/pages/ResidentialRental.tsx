import { useState } from "react";
import {
  Search, SlidersHorizontal, MapPin, Eye, Heart, Phone,
  ChevronDown, X, RotateCcw, Home, Building2, Layers, BedDouble, KeyRound
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MAP_PROPERTIES } from "@/data/mapProperties";
import { useNavigate } from "react-router-dom";

const SUBTYPES = [
  { key: "전체", label: "전체", icon: Home },
  { key: "원룸", label: "원룸", icon: KeyRound },
  { key: "투룸", label: "투룸", icon: BedDouble },
  { key: "쓰리룸+", label: "쓰리룸+", icon: Layers },
  { key: "오피스텔", label: "오피스텔", icon: Building2 },
];

const DEAL_TYPES = ["전체", "월세", "전세", "매매"];
const AREAS = ["전체", "10평 이하", "10~20평", "20~33평", "33~50평", "50평+"];
const DEPOSITS = ["전체", "1천만 이하", "1천~3천만", "3천~5천만", "5천~1억", "1억+"];
const MONTHLYS = ["전체", "30만 이하", "30~60만", "60~100만", "100~150만", "150만+"];
const FLOORS = ["전체", "1층", "2~5층", "6~10층", "11층+", "최고층"];
const REGIONS = ["전체", "강남·서초", "종로·중구", "마포·홍대", "여의도", "성수·건대", "신촌·연남", "잠실·송파", "판교·분당"];
const OPTIONS = ["에어컨", "세탁기", "냉장고", "인터넷", "주차", "엘리베이터", "반려동물", "신축"];
const SORT_OPTIONS = ["최신순", "조회수 높은순", "보증금 낮은순", "월세 낮은순", "면적 넓은순"];

// 주거형 임대 mock 데이터 (기존 + 복수 확장)
const BASE = MAP_PROPERTIES.slice(0, 6);
const PROPERTIES = [
  ...BASE,
  ...BASE.map((p, i) => ({
    ...p, id: p.id + 20 + i,
    title: p.title + " (유사매물)",
    isNew: i % 3 === 0,
    isHot: i % 4 === 0,
    views: Math.floor(Math.random() * 3000) + 200,
  })),
  ...BASE.map((p, i) => ({
    ...p, id: p.id + 40 + i,
    title: p.title + " 인근",
    isNew: false,
    isHot: i % 5 === 0,
    views: Math.floor(Math.random() * 1500) + 100,
  })),
];

export default function ResidentialRental() {
  const navigate = useNavigate();
  const [activeSubtype, setActiveSubtype] = useState("전체");
  const [activeDeal, setActiveDeal] = useState("전체");
  const [activeArea, setActiveArea] = useState("전체");
  const [activeDeposit, setActiveDeposit] = useState("전체");
  const [activeMonthly, setActiveMonthly] = useState("전체");
  const [activeFloor, setActiveFloor] = useState("전체");
  const [activeRegion, setActiveRegion] = useState("전체");
  const [activeOptions, setActiveOptions] = useState<string[]>([]);
  const [sort, setSort] = useState("최신순");
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleOption = (opt: string) =>
    setActiveOptions(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]);

  const filtered = PROPERTIES.filter(p => {
    if (search && !p.title.includes(search) && !p.address.includes(search)) return false;
    return true;
  });

  const activeFilterCount = [activeDeal, activeArea, activeDeposit, activeMonthly, activeFloor, activeRegion]
    .filter(v => v !== "전체").length + activeOptions.length;

  const resetFilters = () => {
    setActiveDeal("전체"); setActiveArea("전체"); setActiveDeposit("전체");
    setActiveMonthly("전체"); setActiveFloor("전체"); setActiveRegion("전체");
    setActiveOptions([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* 페이지 헤더 */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(220 60% 28%) 0%, hsl(220 80% 18%) 100%)" }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 30% 60%, white 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center gap-2 text-white/60 text-xs mb-3">
            <span className="cursor-pointer hover:text-white" onClick={() => navigate("/")}>홈</span>
            <ChevronDown className="w-3 h-3 -rotate-90" />
            <span className="text-white font-medium">주거형 임대</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">주거형 임대</h1>
          <p className="text-white/70 text-sm">원룸·투룸·오피스텔·아파트 등 주거형 공인중개 매물 전체</p>
          <div className="flex items-center gap-4 mt-4">
            {[
              { label: "전체 매물", value: PROPERTIES.length },
              { label: "신규 등록", value: PROPERTIES.filter(p => p.isNew).length },
              { label: "인기 매물", value: PROPERTIES.filter(p => p.isHot).length },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <p className="text-white/60 text-xs">{label}</p>
                <p className="text-white font-bold text-lg">{value}건</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 검색 + 필터 sticky bar */}
      <div className="sticky top-14 z-40 border-b border-border bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3">
          {/* 방 유형 탭 */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
            {SUBTYPES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSubtype(key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-all flex-shrink-0"
                style={
                  activeSubtype === key
                    ? { background: "hsl(220 80% 28%)", color: "#fff", borderColor: "hsl(220 80% 28%)" }
                    : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
            <div className="ml-2 flex items-center gap-1 border-l border-border pl-3">
              {DEAL_TYPES.map(v => (
                <button
                  key={v}
                  onClick={() => setActiveDeal(v)}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border whitespace-nowrap transition-all"
                  style={
                    activeDeal === v
                      ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }
                      : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* 검색 + 버튼 */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-muted rounded-xl px-3 h-10 border border-border">
              <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="지역, 건물명, 키워드 검색"
                className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
              {search && <button onClick={() => setSearch("")}><X className="w-3.5 h-3.5 text-muted-foreground" /></button>}
            </div>
            <button
              onClick={() => setShowFilter(v => !v)}
              className="relative flex items-center gap-1.5 px-4 h-10 rounded-xl border text-sm font-medium transition-colors"
              style={
                showFilter || activeFilterCount > 0
                  ? { background: "hsl(220 80% 28%)", color: "#fff", borderColor: "hsl(220 80% 28%)" }
                  : { background: "transparent", color: "hsl(var(--foreground))", borderColor: "hsl(var(--border))" }
              }
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              상세필터
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ background: "hsl(var(--accent))" }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/map")}
              className="flex items-center gap-1.5 px-4 h-10 rounded-xl text-sm font-medium"
              style={{ background: "hsl(var(--accent))", color: "#fff" }}
            >
              <MapPin className="w-3.5 h-3.5" />
              지도 보기
            </button>
          </div>
        </div>

        {/* 상세 필터 패널 */}
        {showFilter && (
          <div className="border-t border-border bg-white px-4 sm:px-6 py-4">
            <div className="max-w-screen-xl mx-auto flex flex-col gap-4">
              {[
                { label: "지역", options: REGIONS, active: activeRegion, set: setActiveRegion },
                { label: "층수", options: FLOORS, active: activeFloor, set: setActiveFloor },
                { label: "면적", options: AREAS, active: activeArea, set: setActiveArea },
                { label: "보증금", options: DEPOSITS, active: activeDeposit, set: setActiveDeposit },
                { label: "월세", options: MONTHLYS, active: activeMonthly, set: setActiveMonthly },
              ].map(({ label, options, active, set }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-10 pt-1.5 flex-shrink-0">{label}</span>
                  <div className="flex flex-wrap gap-1.5">
                    {options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => set(opt)}
                        className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                        style={
                          active === opt
                            ? { background: "hsl(220 80% 28%)", color: "#fff", borderColor: "hsl(220 80% 28%)" }
                            : { background: "transparent", color: "hsl(var(--foreground))", borderColor: "hsl(var(--border))" }
                        }
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {/* 옵션 */}
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-muted-foreground w-10 pt-1.5 flex-shrink-0">옵션</span>
                <div className="flex flex-wrap gap-1.5">
                  {OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => toggleOption(opt)}
                      className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                      style={
                        activeOptions.includes(opt)
                          ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }
                          : { background: "transparent", color: "hsl(var(--foreground))", borderColor: "hsl(var(--border))" }
                      }
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="flex items-center gap-1 text-xs text-destructive self-start">
                  <RotateCcw className="w-3 h-3" /> 필터 초기화
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 매물 목록 */}
      <main className="flex-1 max-w-screen-xl mx-auto px-4 sm:px-6 py-6 w-full">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-bold text-foreground">{filtered.length}건</span>의 매물
          </p>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background text-foreground outline-none cursor-pointer"
          >
            {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(property => (
            <div
              key={property.id}
              className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
              style={{ boxShadow: "0 2px 12px rgba(10,45,110,0.07)" }}
            >
              <div className="relative overflow-hidden aspect-[4/3]">
                <img src={property.image} alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {property.isNew && <span className="bg-badge-new text-white text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>}
                  {property.isHot && <span className="bg-badge-hot text-white text-xs font-bold px-2 py-0.5 rounded-full">HOT</span>}
                </div>
                <button onClick={e => toggleLike(property.id, e)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors">
                  <Heart className={`w-4 h-4 ${liked.has(property.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                </button>
                <div className="absolute bottom-3 left-3">
                  <span className="bg-primary/90 text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {property.type}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">{property.title}</h3>
                <div className="flex items-center gap-1 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground line-clamp-1">{property.address}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground">면적</p>
                    <p className="text-sm font-semibold text-foreground">{property.area}</p>
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground">층수</p>
                    <p className="text-sm font-semibold text-foreground">{property.floor}</p>
                  </div>
                </div>
                <div className="border-t border-border pt-3 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">보증금 / 월세</p>
                    <p className="font-bold text-primary text-sm">
                      {property.deposit} / <span className="text-accent">{property.monthly}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="text-xs">{property.views.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  className="mt-3 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: "hsl(220 80% 28% / 0.08)", color: "hsl(220 80% 28%)" }}
                >
                  <Phone className="w-3 h-3" />
                  중개사 문의
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Home className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">검색 결과가 없습니다</p>
            <p className="text-xs mt-1">조건을 변경하여 다시 검색해보세요</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="text-center mt-10">
            <Button variant="outline" className="px-8 rounded-full">더 보기</Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
