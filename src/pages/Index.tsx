import { useState, useMemo } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapSearchBar from "@/components/MapSearchBar";
import PropertyDetailPanel from "@/components/PropertyDetailPanel";
import { MAP_PROPERTIES } from "@/data/mapProperties";
import { useDBProperties } from "@/hooks/useDBProperties";
import { useHiddenMockIds } from "@/hooks/useHiddenMockIds";

const Index = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState("전체");
  const [query, setQuery] = useState("");

  const { properties: dbProperties } = useDBProperties();
  const { hiddenIds: hiddenMockIds } = useHiddenMockIds();

  const allProperties = useMemo(() => {
    const dbIds = new Set(dbProperties.map((p) => p.id));
    const merged = [
      ...dbProperties,
      ...MAP_PROPERTIES.filter((p) => !dbIds.has(p.id) && !hiddenMockIds.has(p.id)),
    ];
    // 최신 등록순 정렬
    return merged.sort((a, b) => {
      const da = a.registeredDate ?? "";
      const db2 = b.registeredDate ?? "";
      return da > db2 ? -1 : da < db2 ? 1 : 0;
    });
  }, [dbProperties, hiddenMockIds]);

  const filtered = allProperties
    .filter((p) => activeType === "전체" || p.type === activeType)
    .filter((p) =>
      !query || p.title.includes(query) || p.address.includes(query) || p.type.includes(query)
    );

  const selected = allProperties.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 relative flex overflow-hidden">
        {/* Full-screen map */}
        <div className="absolute inset-0">
          <MapView
            properties={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Floating search bar */}
        <MapSearchBar
          query={query}
          onQueryChange={setQuery}
          activeType={activeType}
          onTypeChange={setActiveType}
        />

        {/* Left sidebar */}
        <MapSidebar
          properties={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onDeselect={() => setSelectedId(null)}
          activeType={activeType}
          onTypeChange={setActiveType}
          query={query}
          onQueryChange={setQuery}
        />

        {/* Right detail panel */}
        {selected && (
          <PropertyDetailPanel
            property={selected}
            onClose={() => setSelectedId(null)}
            sameProperties={allProperties.filter(p => p.address === selected.address && p.id !== selected.id)}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
