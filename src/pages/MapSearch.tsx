import { useState } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import { MAP_PROPERTIES } from "@/data/mapProperties";

const MapSearch = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState("전체");

  const filtered = activeType === "전체"
    ? MAP_PROPERTIES
    : MAP_PROPERTIES.filter((p) => p.type === activeType);

  const selected = MAP_PROPERTIES.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
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
        </div>
      </main>
    </div>
  );
};

export default MapSearch;
