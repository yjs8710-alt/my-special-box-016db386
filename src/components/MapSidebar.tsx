import { MapPin, Eye, ChevronRight, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { MapProperty } from "@/data/mapProperties";

const TYPE_DOT: Record<string, string> = {
  "상가": "bg-primary",
  "사무실": "bg-purple-600",
  "식당·카페": "bg-accent",
  "공장·창고": "bg-green-600",
  "병원·학원": "bg-red-700",
};

interface MapSidebarProps {
  properties: MapProperty[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  activeType: string;
  onTypeChange: (type: string) => void;
  query?: string;
  onQueryChange?: (v: string) => void;
}

const MapSidebar = ({
  properties,
  selectedId,
  onSelect,
}: MapSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`absolute left-0 top-0 bottom-0 z-[900] flex transition-all duration-300 pointer-events-none`}
      style={{ top: "0" }}
    >
      {/* Panel */}
      <aside
        className={`pointer-events-auto bg-card/95 backdrop-blur-md border-r border-border flex flex-col shadow-xl transition-all duration-300 ${
          collapsed ? "w-0 overflow-hidden opacity-0" : "w-[340px] opacity-100"
        }`}
        style={{ marginTop: "116px", height: "calc(100% - 116px)" }}
      >
        {/* Count */}
        <div className="px-4 py-2 bg-muted/50 border-b border-border flex-shrink-0">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-primary">{properties.length}개</span> 매물
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <MapPin className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          ) : (
            properties.map((prop) => (
              <button
                key={prop.id}
                onClick={() => onSelect(prop.id)}
                className={`w-full text-left px-4 py-3 border-b border-border transition-colors flex items-start gap-3 group ${
                  selectedId === prop.id
                    ? "bg-primary/8 border-l-4 border-l-primary"
                    : "hover:bg-muted/60 border-l-4 border-l-transparent"
                }`}
              >
                <div className="mt-1 flex-shrink-0">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      TYPE_DOT[prop.type] ?? "bg-primary"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {prop.isNew && (
                      <span className="text-[10px] font-bold text-badge-new bg-badge-new/10 px-1.5 py-0.5 rounded-full">NEW</span>
                    )}
                    {prop.isHot && (
                      <span className="text-[10px] font-bold text-badge-hot bg-badge-hot/10 px-1.5 py-0.5 rounded-full">HOT</span>
                    )}
                    <span className="text-[10px] text-muted-foreground">{prop.type}</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{prop.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-xs text-muted-foreground line-clamp-1">{prop.address}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-sm font-bold text-primary">
                      {prop.deposit} / <span className="text-accent">{prop.monthly}</span>
                    </p>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      <span className="text-xs">{prop.views.toLocaleString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{prop.area} · {prop.floor}</p>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-2 group-hover:text-primary transition-colors" />
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="pointer-events-auto self-start mt-4 bg-card/95 backdrop-blur-md border border-border rounded-r-lg px-1.5 py-3 shadow-md hover:bg-card transition-colors"
        style={{ marginTop: "140px" }}
      >
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-foreground" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-foreground" />
        )}
      </button>
    </div>
  );
};

export default MapSidebar;
