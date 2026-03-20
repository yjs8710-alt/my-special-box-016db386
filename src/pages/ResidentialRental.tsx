import { useState, useMemo, useRef, useCallback } from "react";
import { useDBProperties } from "@/hooks/useDBProperties";
import { usePropertyFilter } from "@/hooks/usePropertyFilter";
import Header from "@/components/Header";
import MapView, { MapBounds } from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapFilterBar, { FilterState, DEFAULT_FILTERS, LandlordResult } from "@/components/MapFilterBar";
import { MapProperty } from "@/data/mapProperties";

const RESIDENTIAL_PROPERTIES: MapProperty[] = [];

const RESIDENTIAL_SUBTYPES = ["전체", "원룸", "투베이", "투룸", "쓰리룸", "주인세대", "아파트", "오피스텔", "빌라", "연립", "다세대"];

const RESIDENTIAL_DB_TYPES = ["원룸", "투베이", "투룸", "쓰리룸", "주인세대", "아파트", "오피스텔", "빌라", "고시원", "연립", "다세대", "주상복합"];

const ResidentialRental = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pinnedAddress, setPinnedAddress] = useState<string | null>(null);
  // pinnedIds: 비어 있으면 "전체 표시", 값이 있으면 해당 id들만 사이드바에 표시
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [showAllFromSearch, setShowAllFromSearch] = useState(false);
  const [activeTypes, setActiveTypes] = useState<string[]>(["전체"]);
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [landlordResults, setLandlordResults] = useState<LandlordResult[]>([]);
  const [landlordLoading, setLandlordLoading] = useState(false);
  const [landlordSearched, setLandlordSearched] = useState(false);

  // DB 매물 (주거형) - 매매 물건 제외
  const { properties: dbProperties } = useDBProperties(RESIDENTIAL_DB_TYPES);

  // static + DB 합치기 (매매 매물 제외: type에 '매매' 포함되거나 note에 '매매가:' 포함된 것)
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

  // 돋보기 버튼 클릭 → 현재 filtered 전체를 사이드바에 표시
  const handleSearchClick = () => {
    setPinnedIds([]);
    setPinnedAddress(null);
    setSelectedId(null);
    setShowAllFromSearch(true);
  };

  // 핀 클릭 핸들러:
  // - 처음 클릭 → 해당 핀의 주소 기준 매물들만 표시 (pinnedIds 설정)
  // - 이미 pinnedIds에 있는 핀 추가 클릭 → 누적
  // - 이미 선택된 핀 재클릭 → 해제
  const handlePinSelect = (id: number) => {
    const prop = filtered.find(p => p.id === id) ?? allProperties.find(p => p.id === id);
    if (!prop) return;

    setShowAllFromSearch(false);

    // 이미 선택된 핀 재클릭 → 해당 핀만 해제
    if (pinnedIds.includes(id)) {
      const next = pinnedIds.filter(x => x !== id);
      setPinnedIds(next);
      if (selectedId === id) {
        setSelectedId(next.length > 0 ? next[0] : null);
      }
      if (next.length === 0) {
        setPinnedAddress(null);
        setSelectedId(null);
      }
      return;
    }

    // 같은 주소의 모든 매물 id 수집 (새 핀 클릭 시 해당 주소 그룹 누적)
    const sameAddrIds = allProperties
      .filter(p => p.address === prop.address || (prop.buildingName && p.buildingName === prop.buildingName))
      .map(p => p.id);

    setPinnedIds(prev => {
      const merged = [...prev];
      sameAddrIds.forEach(sid => { if (!merged.includes(sid)) merged.push(sid); });
      return merged;
    });
    setSelectedId(id);
    setPinnedAddress(prop.address);
  };

  // 사이드바에 표시할 매물: pinnedIds가 있으면 그것만, showAllFromSearch면 filtered 전체, 아니면 filtered 전체
  const sidebarProperties = useMemo(() => {
    if (showAllFromSearch || pinnedIds.length === 0) return filtered;
    return filtered.filter(p => pinnedIds.includes(p.id));
  }, [filtered, pinnedIds, showAllFromSearch]);

  return (
    <div className="flex flex-col" style={{ height: "100vh", overflow: "hidden" }}>
      <Header onRegisterChange={setShowRegister} />

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
            onLandlordResults={(results, loading, searched) => {
              setLandlordResults(results);
              setLandlordLoading(loading);
              setLandlordSearched(searched);
            }}
            onSearchClick={handleSearchClick}
            hideSearchBar={showRegister}
            showResidentialTypes={true}
            showBuildingOptions={true}
            showRoomTypes={false}
          />
        </div>
        <MapSidebar
          properties={sidebarProperties}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDeselect={() => setSelectedId(null)}
          activeType={activeType}
          onTypeChange={(t) => toggleType(t)}
          pinnedAddress={pinnedAddress}
          onClearPin={() => { setPinnedAddress(null); setSelectedId(null); }}
          pinnedIds={pinnedIds}
          onClearPinnedIds={() => {
            setPinnedIds([]);
            setPinnedAddress(null);
            setSelectedId(null);
            setShowAllFromSearch(false);
          }}
          landlordResults={landlordResults}
          landlordLoading={landlordLoading}
          landlordSearched={landlordSearched}
        />
      </main>
    </div>
  );
};

export default ResidentialRental;
