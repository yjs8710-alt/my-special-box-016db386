import { useState } from "react";
import { Search, SlidersHorizontal, MapPin, Eye, Heart, Phone, ChevronDown, X, RotateCcw, Building2, Store, UtensilsCrossed, Briefcase, Warehouse } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { MAP_PROPERTIES } from "@/data/mapProperties";
import { useNavigate } from "react-router-dom";

const SUBTYPES = [
  { key: "전체", label: "전체", icon: Building2 },
  { key: "상가", label: "상가", icon: Store },
  { key: "식당·카페", label: "식당·카페", icon: UtensilsCrossed },
  { key: "사무실", label: "사무실", icon: Briefcase },
  { key: "창고·공장", label: "창고·공장", icon: Warehouse },
];

const AREAS = ["전체", "10평 이하", "10~30평", "30~50평", "50~100평", "100평+"];
const DEPOSITS = ["전체", "1천만 이하", "1천~3천만", "3천~5천만", "5천~1억", "1억+"];
const MONTHLYS = ["전체", "50만 이하", "50~150만", "150~300만", "300~500만", "500만+"];
const FLOORS = ["전체", "지하", "1층", "2층", "3층+"];
const REGIONS = ["전체", "강남·서초", "종로·중구", "마포·홍대", "여의도", "성수·건대", "신촌·연남", "잠실·송파", "판교·분당"];
const SORT_OPTIONS = ["최신순", "조회수 높은순", "보증금 낮은순", "월세 낮은순", "면적 넓은순"];

const COMMERCIAL_PROPERTIES = MAP_PROPERTIES.filter(p =>
  ["상가", "식당·카페", "사무실"].includes(p.type)
);

// Add extra mock commercial data
const EXTRA_PROPERTIES = [
  ...COMMERCIAL_PROPERTIES,
  ...COMMERCIAL_PROPERTIES.map(p => ({ ...p, id: p.id + 100, isNew: false, isHot: Math.random() > 0.7 })),
];

export default function CommercialRental() {
  const navigate = useNavigate();
  const [activeSubtype, setActiveSubtype] = useState("전체");
  const [activeArea, setActiveArea] = useState("전체");
  const [activeDeposit, setActiveDeposit] = useState("전체");
  const [activeMonthly, setActiveMonthly] = useState("전체");
  const [activeFloor, setActiveFloor] = useState("전체");
  const [activeRegion, setActiveRegion] = useState("전체");
  const [sort, setSort] = useState("최신순");
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const filtered = EXTRA_PROPERTIES.filter(p => {
    if (activeSubtype !== "전체" && p.type !== activeSubtype) return false;
    if (search && !p.title.includes(search) && !p.address.includes(search)) return false;
    return true;
  });

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const activeFilterCount = [activeArea, activeDeposit, activeMonthly, activeFloor, activeRegion].filter(v => v !== "전체").length;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Page Header */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(218 88% 22%) 100%)" }}
      >
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="relative max-w-screen-xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex items-center gap-2 text-white/60 text-xs mb-3">
            <span className="cursor-pointer hover:text-white" onClick={() => navigate("/")}>홈</span>
            <ChevronDown className="w-3 h-3 -rotate-90" />
            <span className="text-white font-medium">상가임대</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">상가임대</h1>
          <p className="text-white/70 text-sm">검증된 공인중개사가 등록한 상가·식당·카페·사무실 매물을 한눈에</p>
          <div className="flex items-center gap-4 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
              <p className="text-white/60 text-xs">전체 매물</p>
              <p className="text-white font-bold text-lg">{EXTRA_PROPERTIES.length}건</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
              <p className="text-white/60 text-xs">신규 등록</p>
              <p className="text-white font-bold text-lg">{EXTRA_PROPERTIES.filter(p => p.isNew).length}건</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
              <p className="text-white/60 text-xs">인기 매물</p>
              <p className="text-white font-bold text-lg">{EXTRA_PROPERTIES.filter(p => p.isHot).length}건</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="sticky top-14 z-40 border-b border-border bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3">
          {/* 업종 탭 */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            {SUBTYPES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveSubtype(key)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-all flex-shrink-0"
                style={
                  activeSubtype === key
                    ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
                    : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                }
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* 검색 + 필터 */}
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
                  ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
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
              className="flex items-center gap-1.5 px-4 h-10 rounded-xl border text-sm font-medium transition-colors"
              style={{ background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }}
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
                            ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
                            : { background: "transparent", color: "hsl(var(--foreground))", borderColor: "hsl(var(--border))" }
                        }
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setActiveArea("전체"); setActiveDeposit("전체"); setActiveMonthly("전체"); setActiveFloor("전체"); setActiveRegion("전체"); }}
                  className="flex items-center gap-1 text-xs text-destructive self-start"
                >
                  <RotateCcw className="w-3 h-3" /> 필터 초기화
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <main className="flex-1 max-w-screen-xl mx-auto px-4 sm:px-6 py-6 w-full">
        {/* 결과 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            총 <span className="font-bold text-foreground">{filtered.length}건</span>의 매물
          </p>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background text-foreground outline-none cursor-pointer"
            >
              {SORT_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* 매물 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(property => (
            <div
              key={property.id}
              className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
              style={{ boxShadow: "0 2px 12px rgba(10,45,110,0.07)" }}
            >
              {/* 이미지 */}
              <div className="relative overflow-hidden aspect-[4/3]">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-1.5">
                  {property.isNew && (
                    <span className="bg-badge-new text-white text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
                  )}
                  {property.isHot && (
                    <span className="bg-badge-hot text-white text-xs font-bold px-2 py-0.5 rounded-full">HOT</span>
                  )}
                </div>
                <button
                  onClick={e => toggleLike(property.id, e)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors"
                >
                  <Heart className={`w-4 h-4 ${liked.has(property.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                </button>
                <div className="absolute bottom-3 left-3">
                  <span className="bg-primary/90 text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {property.type}
                  </span>
                </div>
              </div>

              {/* 콘텐츠 */}
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

                {/* 문의 버튼 */}
                <button
                  className="mt-3 w-full flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))" }}
                >
                  <Phone className="w-3 h-3" />
                  중개사 문의
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 빈 결과 */}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">검색 결과가 없습니다</p>
            <p className="text-xs mt-1">조건을 변경하여 다시 검색해보세요</p>
          </div>
        )}

        {/* 더 보기 */}
        {filtered.length > 0 && (
          <div className="text-center mt-10">
            <Button variant="outline" className="px-8 rounded-full">
              더 보기
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
