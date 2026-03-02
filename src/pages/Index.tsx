import { useState } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import MapSidebar from "@/components/MapSidebar";
import MapSearchBar from "@/components/MapSearchBar";
import { MAP_PROPERTIES } from "@/data/mapProperties";

const Index = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeType, setActiveType] = useState("전체");
  const [query, setQuery] = useState("");

  const filtered = MAP_PROPERTIES
    .filter((p) => activeType === "전체" || p.type === activeType)
    .filter((p) =>
      !query || p.title.includes(query) || p.address.includes(query) || p.type.includes(query)
    );

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 relative flex overflow-hidden">
        {/* Full-screen map behind everything */}
        <div className="absolute inset-0">
          <MapView
            properties={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {/* Floating search bar on top of map */}
        <MapSearchBar
          query={query}
          onQueryChange={setQuery}
          activeType={activeType}
          onTypeChange={setActiveType}
        />

        {/* Sidebar overlaid on left */}
        <MapSidebar
          properties={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
          activeType={activeType}
          onTypeChange={setActiveType}
          query={query}
          onQueryChange={setQuery}
        />
      </div>
    </div>
  );
};

export default Index;
