import { useState, useMemo, useRef, useCallback } from "react";
import { useExitConfirm } from "@/hooks/useExitConfirm";
import { useDBProperties } from "@/hooks/useDBProperties";
import { usePropertyFilter } from "@/hooks/usePropertyFilter";
import Header from "@/components/Header";
import MapView, { MapBounds } from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapFilterBar, { FilterState, DEFAULT_FILTERS, LandlordResult } from "@/components/MapFilterBar";
import PropertyDetailPanel from "@/components/PropertyDetailPanel";
import { MAP_PROPERTIES } from "@/data/mapProperties";

const COMMERCIAL_SUBTYPES = ["전체", "상가", "식당·카페", "사무실", "공장·창고", "병원·학원", "지식산업"];
const COMMERCIAL_DB_TYPES = ["상가", "식당·카페", "사무실", "공장·창고", "병원·학원", "지식산업"];

const CommercialRental = () => {
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

  const { properties: dbProperties, refetch } = useDBProperties(COMMERCIAL_DB_TYPES);
  const allProperties = useMemo(() => [...MAP_PROPERTIES, ...dbProperties], [dbProperties]);

  const toggleType = (t: string) => {
    if (t === "전체") { setActiveTypes(["전체"]); return; }
    setActiveTypes(prev => {
      const w = prev.filter(x => x !== "전체");
      if (w.includes(t)) { const n = w.filter(x => x !== t); return n.length === 0 ? ["전체"] : n; }
      return [...w, t];
    });
  };

  const filtered = usePropertyFilter(allProperties, filters, activeTypes, query, propertyId);
  const activeType = activeTypes[0] ?? "전체";

  const handleBoundsChange = useCallback((b: MapBounds) => { mapBoundsRef.current = b; }, []);

  const handleSearchClick = useCallback(() => {
    setPinnedIds([]); setPinnedAddress(null); setSelectedId(null); setShowAllFromSearch(true);
  }, []);

  const handlePinSelect = useCallback((id: number) => {
    const prop = filtered.find(p => p.id === id) ?? allProperties.find(p => p.id === id);
    if (!prop) return;
    setShowAllFromSearch(false);
    if (pinnedIds.includes(id)) {
      setSuppressPan(true);
      const next = pinnedIds.filter(x => x !== id);
      setPinnedIds(next);
      setSelectedId(null);
      if (next.length === 0) setPinnedAddress(null);
      setTimeout(() => setSuppressPan(false), 100);
      return;
    }
    const sameAddrIds = allProperties.filter(p => p.address === prop.address).map(p => p.id);
    setSuppressPan(false);
    setPinnedIds(prev => { const m = [...prev]; sameAddrIds.forEach(s => { if (!m.includes(s)) m.push(s); }); return m; });
    setSelectedId(id);
    setPinnedAddress(prop.address);
  }, [filtered, allProperties, pinnedIds]);

  const sidebarProperties = useMemo(() => {
    if (showAllFromSearch) {
      const b = mapBoundsRef.current;
      if (b) return filtered.filter(p => p.lat && p.lng && p.lat >= b.swLat && p.lat <= b.neLat && p.lng >= b.swLng && p.lng <= b.neLng);
      return filtered;
    }
    if (pinnedIds.length === 0) return filtered;
    return filtered.filter(p => pinnedIds.includes(p.id));
  }, [filtered, pinnedIds, showAllFromSearch]);

  return (
    <div className="flex flex-col" style={{ height: "100vh", overflow: "hidden" }}>
      <Header onRegisterChange={setShowRegister} onMenuOpenChange={setMobileMenuOpen} />

      <div
        className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto flex-shrink-0 sticky top-0 z-[900]"
        style={{ background: "hsl(var(--header-bg))" }}
      >
        <span className="text-white/50 text-xs font-semibold whitespace-nowrap">상가 유형</span>
        {COMMERCIAL_SUBTYPES.map(t => {
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
            hideSearchBar={showRegister || mobileMenuOpen}
            showCategoryChips={true}
            showRoomTypes={false}
          />
        </div>
        <MapSidebar
          properties={sidebarProperties}
          referencePool={allProperties}
          selectedId={selectedId}
          onSelect={(id) => {
            setSuppressPan(true);
            setSelectedId(id);
            setTimeout(() => setSuppressPan(false), 600);
          }}
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
          onRefetch={refetch}
        />
        {selectedId !== null && (() => {
          const selected = allProperties.find(p => p.id === selectedId) ?? null;
          return selected ? (
            <PropertyDetailPanel
              property={selected}
              onClose={() => setSelectedId(null)}
              sameProperties={allProperties.filter(p => p.address === selected.address && p.id !== selected.id)}
            />
          ) : null;
        })()}
      </main>
    </div>
  );
};

export default CommercialRental;
