import { useState, useMemo } from "react";
import { useDBProperties } from "@/hooks/useDBProperties";
import { usePropertyFilter } from "@/hooks/usePropertyFilter";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapFilterBar, { FilterState, DEFAULT_FILTERS } from "@/components/MapFilterBar";
import LandlordSearchModal from "@/components/LandlordSearchModal";
import { MapProperty } from "@/data/mapProperties";

const NON_RESIDENTIAL_PROPERTIES: MapProperty[] = [];

const NON_RESIDENTIAL_SUBTYPES = [
  { label: "전체", group: "전체", key: "전체" },
  { label: "임대전체", group: "임대", key: "임대-전체" },
  { label: "상가", group: "임대", key: "상가" },
  { label: "사무실", group: "임대", key: "사무실" },
  { label: "공장·창고", group: "임대", key: "공장·창고" },
  { label: "매매전체", group: "매매", key: "매매-전체" },
  { label: "상가매매", group: "매매", key: "상가매매" },
  { label: "건물매매", group: "매매", key: "건물매매" },
];

const NON_RESIDENTIAL_DB_TYPES = [
  "상가", "사무실", "공장·창고",
  "상가매매", "건물매매",
  "상가임대", "기타임대",
];

const NonResidentialRental = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [pinnedAddresses, setPinnedAddresses] = useState<string[]>([]);
  const [activeTypes, setActiveTypes] = useState<string[]>(["전체"]);
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [showLandlord, setShowLandlord] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // DB 매물 (주거형 외 임대·매매)
  const { properties: dbProperties } = useDBProperties(NON_RESIDENTIAL_DB_TYPES);

  // static + DB 합치기
  const allProperties = useMemo(
    () => [...NON_RESIDENTIAL_PROPERTIES, ...dbProperties],
    [dbProperties]
  );

  const toggleType = (k: string) => {
    if (k === "전체") {
      setActiveTypes(["전체"]);
      return;
    }
    setActiveTypes(prev => {
      const without전체 = prev.filter(x => x !== "전체");
      if (without전체.includes(k)) {
        const next = without전체.filter(x => x !== k);
        return next.length === 0 ? ["전체"] : next;
      }
      return [...without전체, k];
    });
  };

  // key → DB type 변환 후 usePropertyFilter에 전달
  const nonResidentialTypeLabels = useMemo(() => {
    if (activeTypes.includes("전체")) return ["전체"];
    if (activeTypes.includes("임대-전체")) {
      return ["상가", "사무실", "공장·창고", "상가임대", "기타임대"];
    }
    if (activeTypes.includes("매매-전체")) {
      return ["상가매매", "건물매매"];
    }
    return activeTypes;
  }, [activeTypes]);

  const filtered = usePropertyFilter(allProperties, filters, nonResidentialTypeLabels, query, propertyId);

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

      {/* 유형 탭 - 다중 선택 */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b border-border overflow-x-auto flex-shrink-0 sticky top-0 z-[900]"
        style={{ background: "hsl(var(--header-bg))" }}
      >
        {/* 전체 */}
        {NON_RESIDENTIAL_SUBTYPES.filter(t => t.group === "전체").map(t => {
          const isActive = activeTypes.includes(t.key);
          return (
            <button key={t.key} onClick={() => toggleType(t.key)}
              className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all flex-shrink-0"
              style={isActive ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" } : { background: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }}
            >{t.label}</button>
          );
        })}

        <div className="w-px h-4 mx-1 flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }} />

        {/* 임대 그룹 */}
        <span className="text-white/40 text-[10px] font-semibold whitespace-nowrap flex-shrink-0">임대</span>
        {NON_RESIDENTIAL_SUBTYPES.filter(t => t.group === "임대").map(t => {
          const isActive = activeTypes.includes(t.key);
          return (
            <button key={t.key} onClick={() => toggleType(t.key)}
              className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all flex-shrink-0"
              style={isActive ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" } : { background: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }}
            >{t.label}</button>
          );
        })}

        <div className="w-px h-4 mx-1 flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }} />

        {/* 매매 그룹 */}
        <span className="text-white/40 text-[10px] font-semibold whitespace-nowrap flex-shrink-0">매매</span>
        {NON_RESIDENTIAL_SUBTYPES.filter(t => t.group === "매매").map(t => {
          const isActive = activeTypes.includes(t.key);
          return (
            <button key={t.key} onClick={() => toggleType(t.key)}
              className="px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap transition-all flex-shrink-0"
              style={isActive ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" } : { background: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.2)" }}
            >{t.label}</button>
          );
        })}

        {/* 선택 삭제 */}
        {!activeTypes.includes("전체") && (
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
            nonResidentialSubtypes={NON_RESIDENTIAL_SUBTYPES}
            showRoomTypes={false}
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

export default NonResidentialRental;
