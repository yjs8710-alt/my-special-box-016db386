import { useState } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapFilterBar, { FilterState, DEFAULT_FILTERS } from "@/components/MapFilterBar";
import LandlordSearchModal from "@/components/LandlordSearchModal";
import { MAP_PROPERTIES } from "@/data/mapProperties";

const MapSearch = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState("전체");
  const [query, setQuery] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [showLandlord, setShowLandlord] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const filtered = MAP_PROPERTIES.filter((p) => {
    if (activeType !== "전체" && p.type !== activeType) return false;
    if (propertyId && !String(p.id).includes(propertyId)) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!p.address.toLowerCase().includes(q) && !p.title.toLowerCase().includes(q) && !(p.buildingName ?? "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selected = MAP_PROPERTIES.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {showLandlord && <LandlordSearchModal onClose={() => setShowLandlord(false)} />}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden" style={{ height: "calc(100vh - 56px)" }}>
        {/* Sidebar */}
        <MapSidebar
          properties={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          activeType={activeType}
          onTypeChange={setActiveType}
        />
        {/* Map */}
        <div className="flex-1 relative">
          <MapView
            properties={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          {/* Left top filter bar overlay */}
          <MapFilterBar
            activeType={activeType}
            onTypeChange={setActiveType}
            query={query}
            onQueryChange={setQuery}
            propertyId={propertyId}
            onPropertyIdChange={setPropertyId}
            filters={filters}
            onFiltersChange={setFilters}
            onLandlordClick={() => setShowLandlord(true)}
          />
        </div>
      </main>
    </div>
  );
};

export default MapSearch;
