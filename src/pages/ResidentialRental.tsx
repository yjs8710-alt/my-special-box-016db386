import { useState, useMemo } from "react";
import { useDBProperties } from "@/hooks/useDBProperties";
import { usePropertyFilter } from "@/hooks/usePropertyFilter";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapFilterBar, { FilterState, DEFAULT_FILTERS } from "@/components/MapFilterBar";
import LandlordSearchModal from "@/components/LandlordSearchModal";
import PinClickPanel from "@/components/PinClickPanel";
import { MapProperty } from "@/data/mapProperties";

const RESIDENTIAL_PROPERTIES: MapProperty[] = [];

const RESIDENTIAL_SUBTYPES = ["전체", "원룸", "투베이", "투룸", "쓰리룸", "주인세대", "아파트", "오피스텔", "빌라", "연립", "다세대"];

const RESIDENTIAL_DB_TYPES = ["원룸", "투베이", "투룸", "쓰리룸", "주인세대", "아파트", "오피스텔", "빌라", "고시원", "연립", "다세대", "주상복합"];

const ResidentialRental = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [clickedProperties, setClickedProperties] = useState<MapProperty[]>([]);
  const [activeTypes, setActiveTypes] = useState<string[]>(["전체"]);
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [showLandlord, setShowLandlord] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // DB 매물 (주거형) - 매매 물건 제외
  const { properties: dbProperties } = useDBProperties(RESIDENTIAL_DB_TYPES);

  // static + DB 합치기 (매매 매물 제외)
  const allProperties = useMemo(
    () => [...RESIDENTIAL_PROPERTIES, ...dbProperties.filter(p =>
      !p.type.includes("매매") &&
      !(p.note ?? "").includes("매매가:")
    )],
    [dbProperties]
  );

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

  const filtered = usePropertyFilter(allProperties, filters, activeTypes, query, propertyId);

  const activeType = activeTypes[0] ?? "전체";

  // 핀 클릭 핸들러: 클릭 순서대로 우측 패널에 누적
  const handlePinSelect = (id: number) => {
    setSelectedId(id);
    const prop = filtered.find(p => p.id === id) ?? allProperties.find(p => p.id === id);
    if (!prop) return;
    setClickedProperties(prev => {
      // 이미 있으면 맨 앞으로 이동
      const existing = prev.filter(p => p.id !== id);
      return [prop, ...existing];
    });
  };

  return (
    <div className="flex flex-col" style={{ height: "100vh", overflow: "hidden" }}>
      <Header onRegisterChange={setShowRegister} />
      {showLandlord && <LandlordSearchModal onClose={() => setShowLandlord(false)} />}

      {/* 주거 유형 탭 - 다중 선택 */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto flex-shrink-0 sticky top-0 z-[900]"
        style={{ background: "hsl(var(--header-bg))" }}
      >
        <span className="text-white/50 text-xs font-semibold whitespace-nowrap flex-shrink-0">주거 유형</span>
        {RESIDENTIAL_SUBTYPES.map(t => {
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
        {/* 선택 삭제 */}
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
        className="flex-1 overflow-hidden flex relative"
        style={{ minHeight: 0 }}
      >
        <div className="flex-1 relative min-w-0">
          <MapView
            properties={filtered}
            selectedId={selectedId}
            onSelect={handlePinSelect}
          />
          <MapFilterBar
            activeType={activeType}
            activeTypes={activeTypes}
            onTypeChange={(t) => toggleType(t)}
            query={query}
            onQueryChange={setQuery}
            propertyId={propertyId}
            onPropertyIdChange={setPropertyId}
            filters={filters}
            onFiltersChange={setFilters}
            onLandlordClick={() => setShowLandlord(true)}
            hideSearchBar={showRegister}
            showResidentialTypes={true}
            showBuildingOptions={true}
            showRoomTypes={false}
          />
          {/* 핀 클릭 패널 (지도 위 우측 오버레이) */}
          {clickedProperties.length > 0 && (
            <PinClickPanel
              properties={clickedProperties}
              onClose={() => { setClickedProperties([]); setSelectedId(null); }}
              onSelectProperty={(id) => setSelectedId(id)}
              selectedId={selectedId}
            />
          )}
        </div>
        <MapSidebar
          properties={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDeselect={() => setSelectedId(null)}
          activeType={activeType}
          onTypeChange={(t) => toggleType(t)}
        />
      </main>
    </div>
  );
};

export default ResidentialRental;
