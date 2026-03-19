import { useState, useMemo } from "react";
import { usePropertyFilter } from "@/hooks/usePropertyFilter";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapFilterBar, { FilterState, DEFAULT_FILTERS } from "@/components/MapFilterBar";
import LandlordSearchModal from "@/components/LandlordSearchModal";
import { useDBProperties } from "@/hooks/useDBProperties";
import { MapProperty } from "@/data/mapProperties";

const APARTMENT_PROPERTIES: MapProperty[] = [];

const APARTMENT_SUBTYPES = ["아파트", "오피스텔", "연립/다세대", "분양권"];
const APARTMENT_DEAL_TYPES = ["매매", "전세", "월세"];

const APARTMENT_DB_TYPES = ["아파트", "오피스텔", "연립", "다세대", "주상복합"];

const ApartmentRental = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pinnedAddress, setPinnedAddress] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [activeDealTypes, setActiveDealTypes] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [showLandlord, setShowLandlord] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // DB 매물 (아파트/오피스텔)
  const { properties: dbProperties } = useDBProperties(APARTMENT_DB_TYPES);

  // static + DB 합치기
  const allProperties = useMemo(
    () => [...APARTMENT_PROPERTIES, ...dbProperties],
    [dbProperties]
  );

  const toggleType = (t: string) => {
    setActiveTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const toggleDealType = (t: string) => {
    setActiveDealTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  // activeTypes가 빈 배열이면 전체 표시 (아파트 페이지 특성)
  const aptTypeFilter = activeTypes.length === 0 ? ["전체"] : activeTypes;
  const filtered = usePropertyFilter(allProperties, filters, aptTypeFilter, query, propertyId);

  const activeType = activeTypes[0] ?? "전체";

  const handlePinSelect = (id: number) => {
    setSelectedId(id);
    setPinnedIds(prev => {
      const without = prev.filter(x => x !== id);
      return [id, ...without];
    });
    const prop = filtered.find(p => p.id === id) ?? allProperties.find(p => p.id === id);
    if (prop) setPinnedAddress(prop.address);
  };

  return (
    <div className="flex flex-col" style={{ height: "100vh", overflow: "hidden" }}>
      <Header onRegisterChange={setShowRegister} />
      {showLandlord && <LandlordSearchModal onClose={() => setShowLandlord(false)} />}

      <div
        className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto flex-shrink-0 sticky top-0 z-[900]"
        style={{ background: "hsl(var(--header-bg))" }}
      >
        {/* 종류 */}
        <span className="text-white/40 text-[10px] font-semibold whitespace-nowrap flex-shrink-0">종 류</span>
        {APARTMENT_SUBTYPES.map(t => {
          const isActive = activeTypes.includes(t);
          return (
            <button key={t} onClick={() => toggleType(t)}
              className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all flex-shrink-0"
              style={isActive ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" } : { background: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }}
            >{t}</button>
          );
        })}
        {activeTypes.length > 0 && (
          <button onClick={() => setActiveTypes([])}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold border whitespace-nowrap flex-shrink-0 transition-all"
            style={{ color: "hsl(var(--destructive))", borderColor: "hsl(var(--destructive))", background: "transparent" }}
          >선택 삭제</button>
        )}

        <div className="w-px h-4 mx-1 flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }} />

        {/* 매전월 */}
        <span className="text-white/40 text-[10px] font-semibold whitespace-nowrap flex-shrink-0">매전월</span>
        {APARTMENT_DEAL_TYPES.map(t => {
          const isActive = activeDealTypes.includes(t);
          return (
            <button key={t} onClick={() => toggleDealType(t)}
              className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all flex-shrink-0"
              style={isActive ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" } : { background: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }}
            >{t}</button>
          );
        })}
        {activeDealTypes.length > 0 && (
          <button onClick={() => setActiveDealTypes([])}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold border whitespace-nowrap flex-shrink-0 transition-all"
            style={{ color: "hsl(var(--destructive))", borderColor: "hsl(var(--destructive))", background: "transparent" }}
          >선택 삭제</button>
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
            showCategoryChips={false}
            showRoomTypes={false}
            showApartmentFilters={true}
            apartmentActiveTypes={activeTypes}
            onApartmentTypeChange={toggleType}
            onClearApartmentTypes={() => setActiveTypes([])}
            apartmentDealTypes={activeDealTypes}
            onApartmentDealTypeChange={toggleDealType}
            onClearApartmentDealTypes={() => setActiveDealTypes([])}
          />
        </div>
        <MapSidebar
          properties={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDeselect={() => setSelectedId(null)}
          activeType={activeType}
          onTypeChange={(t) => toggleType(t)}
          pinnedAddress={pinnedAddress}
          onClearPin={() => { setPinnedAddress(null); setSelectedId(null); }}
        />
      </main>
    </div>
  );
};

export default ApartmentRental;
