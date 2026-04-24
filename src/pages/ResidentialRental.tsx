import { useState, useMemo, useRef, useCallback } from "react";
import { useDBProperties } from "@/hooks/useDBProperties";
import { usePropertyFilter } from "@/hooks/usePropertyFilter";
import Header from "@/components/Header";
import MapView, { MapBounds } from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapFilterBar, { FilterState, DEFAULT_FILTERS, LandlordResult } from "@/components/MapFilterBar";
import { MapProperty } from "@/data/mapProperties";
import { RadiusCircle, isInsideRadius } from "@/lib/geoDistance";

const RESIDENTIAL_PROPERTIES: MapProperty[] = [];

const RESIDENTIAL_SUBTYPES = ["전체", "원룸", "투베이", "투룸", "쓰리룸", "주인세대", "아파트", "오피스텔", "빌라", "연립", "다세대"];

const RESIDENTIAL_DB_TYPES = ["원룸", "투베이", "투룸", "쓰리룸", "주인세대", "아파트", "오피스텔", "빌라", "고시원", "연립", "다세대", "주상복합", "단독주택", "다가구", "포룸"];

const ResidentialRental = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [suppressPan, setSuppressPan] = useState(false);
  const [pinnedAddress, setPinnedAddress] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [showAllFromSearch, setShowAllFromSearch] = useState(false);
  const [activeTypes, setActiveTypes] = useState<string[]>(["전체"]);
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [landlordResults, setLandlordResults] = useState<LandlordResult[]>([]);
  const [landlordLoading, setLandlordLoading] = useState(false);
  const [landlordSearched, setLandlordSearched] = useState(false);
  const mapBoundsRef = useRef<MapBounds | null>(null);
  const [radiusMode, setRadiusMode] = useState(false);
  const [radiusCircle, setRadiusCircle] = useState<RadiusCircle | null>(null);

  const { properties: dbProperties, refetch } = useDBProperties(RESIDENTIAL_DB_TYPES);

  const allProperties = useMemo(
    () => [...RESIDENTIAL_PROPERTIES, ...dbProperties.filter(p =>
      !p.type.includes("매매") &&
      !(p.note ?? "").includes("매매가:")
    )],
    [dbProperties]
  );

  const toggleType = (t: string) => {
    if (t === "전체") { setActiveTypes(["전체"]); return; }
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

  // 돋보기 클릭 → 현재 지도 화면 내 매물만 사이드바에 표시
  const handleSearchClick = useCallback(() => {
    const b = mapBoundsRef.current;
    setPinnedAddress(null);
    setSelectedId(null);
    setShowAllFromSearch(true);
    if (b) {
      // bounds 필터링은 sidebarProperties에서 처리
    }
  }, []);

  const handleBoundsChange = useCallback((b: MapBounds) => {
    mapBoundsRef.current = b;
  }, []);

  // 핀 클릭: 정확한 주소 매칭만, buildingName 제거
  const handlePinSelect = useCallback((id: number) => {
    const prop = filtered.find(p => p.id === id) ?? allProperties.find(p => p.id === id);
    if (!prop) return;
    setShowAllFromSearch(false);

    // 이미 선택된 핀 재클릭 → 해제 (지도 이동 없음)
    if (pinnedIds.includes(id)) {
      setSuppressPan(true);
      const next = pinnedIds.filter(x => x !== id);
      setPinnedIds(next);
      setSelectedId(null); // next[0]으로 이동하지 않음
      if (next.length === 0) setPinnedAddress(null);
      setTimeout(() => setSuppressPan(false), 100);
      return;
    }

    // 정확한 주소 매칭만 (buildingName 제거 → 다른 동네 묶임 방지)
    const sameAddrIds = allProperties
      .filter(p => p.address === prop.address)
      .map(p => p.id);

    setSuppressPan(false);
    setPinnedIds(prev => {
      const merged = [...prev];
      sameAddrIds.forEach(sid => { if (!merged.includes(sid)) merged.push(sid); });
      return merged;
    });
    setSelectedId(id);
    setPinnedAddress(prop.address);
  }, [filtered, allProperties, pinnedIds]);

  // 사이드바 매물: 반경 우선 → 돋보기 → 핀 선택 → 기본
  const sidebarProperties = useMemo(() => {
    if (radiusCircle) {
      return filtered.filter(p =>
        p.lat && p.lng && isInsideRadius(p.lat, p.lng, radiusCircle)
      );
    }
    if (showAllFromSearch) {
      const b = mapBoundsRef.current;
      if (b) return filtered.filter(p =>
        p.lat && p.lng &&
        p.lat >= b.swLat && p.lat <= b.neLat &&
        p.lng >= b.swLng && p.lng <= b.neLng
      );
      return filtered;
    }
    if (pinnedIds.length === 0) return filtered;
    return filtered.filter(p => pinnedIds.includes(p.id));
  }, [filtered, pinnedIds, showAllFromSearch, radiusCircle]);

  return (
    <div className="flex flex-col" style={{ height: "100vh", overflow: "hidden" }}>
      <Header onRegisterChange={setShowRegister} />

      {/* 주거 유형 탭 - 다중 선택 (모바일에서는 숨김) */}
      <div
        className="hidden md:flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto flex-shrink-0 sticky top-0 z-[900]"
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

        <div className="w-px h-4 mx-1 flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }} />
        {(["월세", "전세", "단기임대"] as const).map(dt => {
          const isActive = filters.dealType.includes(dt);
          const displayLabel = dt === "단기임대" ? "단기" : dt;
          return (
            <button
              key={dt}
              onClick={() => {
                setFilters(prev => ({
                  ...prev,
                  dealType: isActive
                    ? prev.dealType.filter(x => x !== dt)
                    : [...prev.dealType, dt],
                }));
              }}
              className="px-3.5 py-1 rounded-full text-[13px] font-extrabold border-2 whitespace-nowrap transition-all flex-shrink-0"
              style={
                isActive
                  ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))", boxShadow: "0 0 0 2px hsl(var(--accent) / 0.25)" }
                  : { background: "hsl(var(--accent) / 0.12)", color: "hsl(var(--accent))", borderColor: "hsl(var(--accent) / 0.5)" }
              }
            >
              {displayLabel}
            </button>
          );
        })}
        {(() => {
          const petKey = "애완동물가능";
          const isActive = filters.buildingOptions.includes(petKey);
          return (
            <button
              onClick={() => {
                setFilters(prev => ({
                  ...prev,
                  buildingOptions: isActive
                    ? prev.buildingOptions.filter(x => x !== petKey)
                    : [...prev.buildingOptions, petKey],
                }));
              }}
              className="px-3.5 py-1 rounded-full text-[13px] font-extrabold border-2 whitespace-nowrap transition-all flex-shrink-0"
              style={
                isActive
                  ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))", boxShadow: "0 0 0 2px hsl(var(--accent) / 0.25)" }
                  : { background: "hsl(var(--accent) / 0.12)", color: "hsl(var(--accent))", borderColor: "hsl(var(--accent) / 0.5)" }
              }
            >
              반려동물
            </button>
          );
        })()}
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
            onBoundsChange={handleBoundsChange}
            suppressPan={suppressPan}
            radiusMode={radiusMode}
            radiusCircle={radiusCircle}
            onRadiusChange={setRadiusCircle}
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
            radiusMode={radiusMode}
            radiusInfo={radiusCircle ? { radius: radiusCircle.radius } : null}
            onRadiusModeToggle={() => {
              if (radiusMode) {
                setRadiusMode(false);
                setRadiusCircle(null);
              } else {
                setRadiusMode(true);
              }
            }}
          />
        </div>
        <MapSidebar
          properties={sidebarProperties}
          referencePool={allProperties}
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
          onRefetch={refetch}
        />
      </main>
    </div>
  );
};

export default ResidentialRental;
