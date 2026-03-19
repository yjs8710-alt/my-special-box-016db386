import { useState, useMemo } from "react";
import { useDBProperties } from "@/hooks/useDBProperties";
import { usePropertyFilter } from "@/hooks/usePropertyFilter";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapFilterBar, { FilterState, DEFAULT_FILTERS } from "@/components/MapFilterBar";
import LandlordSearchModal from "@/components/LandlordSearchModal";
import { MapProperty } from "@/data/mapProperties";

// 토지 전용 mock 데이터
const LAND_PROPERTIES: MapProperty[] = [];

const LAND_SUBTYPES = ["전체", "대지", "임야", "농지"];

const LandSearch = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pinnedAddresses, setPinnedAddresses] = useState<string[]>([]);
  const [activeTypes, setActiveTypes] = useState<string[]>(["전체"]);
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [showLandlord, setShowLandlord] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // DB 매물 (토지)
  const { properties: dbProperties } = useDBProperties(["토지"]);

  // static + DB 합치기
  const allProperties = useMemo(
    () => [...LAND_PROPERTIES, ...dbProperties],
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

  // 토지 페이지: roomType 기준으로 필터 (지목 일치)
  const landTypeFilter = useMemo(() => {
    if (activeTypes.includes("전체")) return ["전체"];
    // roomType과 activeTypes 비교
    return activeTypes;
  }, [activeTypes]);

  const filtered = usePropertyFilter(allProperties, filters, landTypeFilter, query, propertyId);

  const activeType = activeTypes[0] ?? "전체";

  const handlePinSelect = (id: number) => {
    setSelectedId(id);
    const prop = filtered.find(p => p.id === id) ?? allProperties.find(p => p.id === id);
    if (!prop) return;
    const addr = prop.buildingName ?? prop.address;
    setPinnedAddresses(prev => prev.includes(addr) ? prev : [...prev, addr]);
  };

  return (
    <div className="flex flex-col" style={{ height: "100vh", overflow: "hidden" }}>
      <Header onRegisterChange={setShowRegister} />
      {showLandlord && <LandlordSearchModal onClose={() => setShowLandlord(false)} />}

      {/* 토지 유형 탭 - 다중 선택 */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto flex-shrink-0 sticky top-0 z-[900]"
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
            onTypeChange={(t) => toggleType(t)}
            query={query}
            onQueryChange={setQuery}
            propertyId={propertyId}
            onPropertyIdChange={setPropertyId}
            filters={filters}
            onFiltersChange={setFilters}
            onLandlordClick={() => setShowLandlord(true)}
            hideSearchBar={showRegister}
            showRoomTypes={false}
            showFloor={false}
            showBuildYear={false}
            showLandFilters={true}
          />
        </div>
        <MapSidebar
          properties={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDeselect={() => setSelectedId(null)}
          activeType={activeType}
          onTypeChange={(t) => toggleType(t)}
          pinnedAddresses={pinnedAddresses}
          onClearPin={() => { setPinnedAddresses([]); setSelectedId(null); }}
        />
      </main>
    </div>
  );
};

export default LandSearch;
