import { useState, useMemo, useRef, useCallback } from "react";
import { useDBProperties } from "@/hooks/useDBProperties";
import { usePropertyFilter } from "@/hooks/usePropertyFilter";
import Header from "@/components/Header";
import MapView, { MapBounds } from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapFilterBar, { FilterState, DEFAULT_FILTERS, LandlordResult } from "@/components/MapFilterBar";
import { MapProperty } from "@/data/mapProperties";

const LAND_PROPERTIES: MapProperty[] = [];

const LAND_SUBTYPES = ["전체", "대지", "임야", "농지"];

const LandSearch = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [pinnedAddress, setPinnedAddress] = useState<string | null>(null);
  const [showAllFromSearch, setShowAllFromSearch] = useState(false);
  const [activeTypes, setActiveTypes] = useState<string[]>(["전체"]);
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [landlordResults, setLandlordResults] = useState<LandlordResult[]>([]);
  const [landlordLoading, setLandlordLoading] = useState(false);
  const [landlordSearched, setLandlordSearched] = useState(false);

  const { properties: dbProperties } = useDBProperties(["토지"]);

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

  const landTypeFilter = useMemo(() => {
    if (activeTypes.includes("전체")) return ["전체"];
    return activeTypes;
  }, [activeTypes]);

  const filtered = usePropertyFilter(allProperties, filters, landTypeFilter, query, propertyId);

  const activeType = activeTypes[0] ?? "전체";

  const handleSearchClick = () => {
    setPinnedIds([]);
    setPinnedAddress(null);
    setSelectedId(null);
    setShowAllFromSearch(true);
  };

  const handlePinSelect = (id: number) => {
    const prop = filtered.find(p => p.id === id) ?? allProperties.find(p => p.id === id);
    if (!prop) { setSelectedId(prev => prev === id ? null : id); return; }
    setShowAllFromSearch(false);
    if (pinnedIds.includes(id)) {
      const next = pinnedIds.filter(x => x !== id);
      setPinnedIds(next);
      if (selectedId === id) setSelectedId(next.length > 0 ? next[0] : null);
      if (next.length === 0) { setPinnedAddress(null); setSelectedId(null); }
      return;
    }
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

  const sidebarProperties = useMemo(() => {
    if (showAllFromSearch || pinnedIds.length === 0) return filtered;
    return filtered.filter(p => pinnedIds.includes(p.id));
  }, [filtered, pinnedIds, showAllFromSearch]);

  return (
    <div className="flex flex-col" style={{ height: "100vh", overflow: "hidden" }}>
      <Header onRegisterChange={setShowRegister} />

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
            onLandlordResults={(results, loading, searched) => {
              setLandlordResults(results);
              setLandlordLoading(loading);
              setLandlordSearched(searched);
            }}
            onSearchClick={handleSearchClick}
            hideSearchBar={showRegister}
            showRoomTypes={false}
            showFloor={false}
            showBuildYear={false}
            showLandFilters={true}
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
            setPinnedIds([]); setPinnedAddress(null); setSelectedId(null); setShowAllFromSearch(false);
          }}
          landlordResults={landlordResults}
          landlordLoading={landlordLoading}
          landlordSearched={landlordSearched}
        />
      </main>
    </div>
  );
};

export default LandSearch;
