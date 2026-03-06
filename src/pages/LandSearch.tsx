import { useState, useMemo } from "react";
import { useDBProperties } from "@/hooks/useDBProperties";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapFilterBar, { FilterState, DEFAULT_FILTERS } from "@/components/MapFilterBar";
import LandlordSearchModal from "@/components/LandlordSearchModal";
import { MAP_PROPERTIES, MapProperty } from "@/data/mapProperties";
import property1 from "@/assets/property1.jpg";
import property2 from "@/assets/property2.jpg";
import property3 from "@/assets/property3.jpg";

// 토지 전용 mock 데이터
const LAND_PROPERTIES: MapProperty[] = [
  {
    id: 201,
    title: "성남 판교 대지 매매",
    buildingName: "",
    address: "경기도 성남시 분당구 판교동 123",
    type: "토지",
    roomType: "대지",
    area: "330㎡ (100평)",
    floor: "-",
    deposit: "15억원",
    monthly: "-",
    isNew: true,
    isHot: true,
    views: 2341,
    lat: 37.3948,
    lng: 127.1080,
    image: property1,
    description: "판교 테크노밸리 인근 대지. 용도지역: 제2종일반주거지역. 건폐율 60%, 용적률 200%.",
    contact: "031-1111-2222",
    agentName: "판교부동산",
    manageFee: "-",
    parking: "-",
    elevator: false,
    availableFrom: "즉시",
    totalFloors: "-",
    buildYear: "-",
    registeredDate: "2026-02-10",
    checkedDate: "2026-03-01",
  },
  {
    id: 202,
    title: "양평 임야 급매",
    buildingName: "",
    address: "경기도 양평군 양평읍 양근리 555",
    type: "토지",
    roomType: "임야",
    area: "3,300㎡ (1,000평)",
    floor: "-",
    deposit: "3억원",
    monthly: "-",
    isNew: false,
    isHot: false,
    views: 890,
    lat: 37.4914,
    lng: 127.4876,
    image: property2,
    description: "양평 임야 1,000평 급매. 계곡 인접, 전망 우수. 전원주택·펜션 개발 가능.",
    contact: "031-2222-3333",
    agentName: "양평토지",
    manageFee: "-",
    parking: "-",
    elevator: false,
    availableFrom: "즉시",
    totalFloors: "-",
    buildYear: "-",
    registeredDate: "2026-01-15",
    checkedDate: "2026-02-20",
  },
  {
    id: 203,
    title: "가평 농지 (전)",
    buildingName: "",
    address: "경기도 가평군 청평면 청평리 210",
    type: "토지",
    roomType: "농지",
    area: "1,650㎡ (500평)",
    floor: "-",
    deposit: "5억원",
    monthly: "-",
    isNew: true,
    isHot: false,
    views: 560,
    lat: 37.6180,
    lng: 127.4920,
    image: property3,
    description: "청평 수변 인근 농지. 농업진흥구역 외 농지로 전용 허가 가능.",
    contact: "031-3333-4444",
    agentName: "가평토지공인",
    manageFee: "-",
    parking: "-",
    elevator: false,
    availableFrom: "즉시",
    totalFloors: "-",
    buildYear: "-",
    registeredDate: "2026-01-20",
    checkedDate: "2026-02-25",
  },
  {
    id: 204,
    title: "강남 역삼동 나대지",
    buildingName: "",
    address: "서울특별시 강남구 역삼동 777-3",
    type: "토지",
    roomType: "대지",
    area: "165㎡ (50평)",
    floor: "-",
    deposit: "35억원",
    monthly: "-",
    isNew: false,
    isHot: true,
    views: 4120,
    lat: 37.5000,
    lng: 127.0368,
    image: property1,
    description: "강남 역삼동 나대지 50평. 상업지역, 용적률 800%. 신축 빌딩·오피스 개발 최적.",
    contact: "02-4444-5555",
    agentName: "강남토지공인",
    manageFee: "-",
    parking: "-",
    elevator: false,
    availableFrom: "협의",
    totalFloors: "-",
    buildYear: "-",
    registeredDate: "2026-02-03",
    checkedDate: "2026-03-02",
  },
  {
    id: 205,
    title: "용인 처인구 창고용 토지",
    buildingName: "",
    address: "경기도 용인시 처인구 남사면 완장리 300",
    type: "토지",
    roomType: "공장·창고",
    area: "6,600㎡ (2,000평)",
    floor: "-",
    deposit: "20억원",
    monthly: "-",
    isNew: false,
    isHot: false,
    views: 1230,
    lat: 37.1540,
    lng: 127.1710,
    image: property2,
    description: "용인 처인구 물류창고 용도 토지. 계획관리지역, 도로 접면 우수. 즉시 허가 가능.",
    contact: "031-5555-6666",
    agentName: "용인공업부동산",
    manageFee: "-",
    parking: "-",
    elevator: false,
    availableFrom: "즉시",
    totalFloors: "-",
    buildYear: "-",
    registeredDate: "2026-01-28",
    checkedDate: "2026-02-28",
  },
  {
    id: 206,
    title: "고양 일산 준주거지역 토지",
    buildingName: "",
    address: "경기도 고양시 일산서구 주엽동 78",
    type: "토지",
    roomType: "대지",
    area: "495㎡ (150평)",
    floor: "-",
    deposit: "18억원",
    monthly: "-",
    isNew: true,
    isHot: false,
    views: 780,
    lat: 37.6738,
    lng: 126.7582,
    image: property3,
    description: "일산 호수공원 인근 준주거지역 토지. 주거 및 상업 복합 개발 가능.",
    contact: "031-6666-7777",
    agentName: "일산토지",
    manageFee: "-",
    parking: "-",
    elevator: false,
    availableFrom: "즉시",
    totalFloors: "-",
    buildYear: "-",
    registeredDate: "2026-02-07",
    checkedDate: "2026-03-03",
  },
];

const LAND_SUBTYPES = ["전체", "대지", "임야", "농지", "공장·창고"];

const LandSearch = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTypes, setActiveTypes] = useState<string[]>(["전체"]);
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [showLandlord, setShowLandlord] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const toggleType = (t: string) => {
    if (t === "전체") {
      setActiveTypes(["전체"]);
      return;
    }
    setActiveTypes(prev => {
      const without전체 = prev.filter(x => x !== "전체");
      if (without전체.includes(t)) {
        const next = without전체.filter(x => x !== t);
        return next.length === 0 ? ["전체"] : next;
      }
      return [...without전체, t];
    });
  };

  const filtered = LAND_PROPERTIES.filter(p => {
    if (!activeTypes.includes("전체") && !activeTypes.includes(p.roomType ?? "")) return false;
    if (propertyId && !String(p.id).includes(propertyId)) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!p.address.toLowerCase().includes(q) && !p.title.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const activeType = activeTypes[0] ?? "전체";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {showLandlord && <LandlordSearchModal onClose={() => setShowLandlord(false)} />}

      {/* 토지 유형 탭 - 다중 선택 */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto"
        style={{ background: "hsl(var(--header-bg))" }}
      >
        <span className="text-white/50 text-xs font-semibold whitespace-nowrap">토지 유형</span>
        {LAND_SUBTYPES.map(t => {
          const isActive = activeTypes.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all flex-shrink-0"
              style={
                isActive
                  ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }
                  : { background: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }
              }
            >
              {t}
            </button>
          );
        })}
        {!activeTypes.includes("전체") && activeTypes.length > 1 && (
          <button
            onClick={() => setActiveTypes(["전체"])}
            className="ml-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border whitespace-nowrap flex-shrink-0 transition-all"
            style={{ color: "hsl(var(--destructive))", borderColor: "hsl(var(--destructive))", background: "transparent" }}
          >
            선택 삭제
          </button>
        )}
      </div>

      <main
        className="flex-1 relative overflow-hidden"
        style={{ height: "calc(100vh - 56px - 41px)" }}
      >
        <MapSidebar
          properties={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          activeType={activeType}
          onTypeChange={(t) => toggleType(t)}
        />
        <div className="flex-1 relative">
          <MapView
            properties={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <MapFilterBar
            activeType={activeType}
            onTypeChange={(t) => toggleType(t)}
            query={query}
            onQueryChange={setQuery}
            propertyId={propertyId}
            onPropertyIdChange={setPropertyId}
            filters={filters}
            onFiltersChange={setFilters}
            onLandlordClick={() => setShowLandlord(true)}
            showRoomTypes={false}
            showFloor={false}
            showBuildYear={false}
            showLandFilters={true}
          />
        </div>
      </main>
    </div>
  );
};

export default LandSearch;
