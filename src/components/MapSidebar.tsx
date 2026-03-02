import { MapPin, Eye, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { MapProperty } from "@/data/mapProperties";

const TYPES = ["전체", "상가", "사무실", "식당·카페", "공장·창고", "병원·학원"];

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
}

const MapSidebar = ({
  properties,
  selectedId,
  onSelect,
  activeType,
  onTypeChange,
}: MapSidebarProps) => {
  const [query, setQuery] = useState("");

  const displayed = query
    ? properties.filter(
        (p) =>
          p.title.includes(query) ||
          p.address.includes(query) ||
          p.type.includes(query)
      )
    : properties;

  return (
    <aside className="w-full md:w-[360px] flex-shrink-0 bg-card border-r border-border flex flex-col h-64 md:h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-bold text-foreground mb-3">지도 매물 검색</h2>
        {/* Search input */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="지역, 건물명 검색..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background outline-none focus:border-primary transition-colors"
          />
        </div>
        {/* Type chips */}
        <div className="flex gap-1.5 flex-wrap">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => onTypeChange(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                activeType === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div className="px-4 py-2 bg-muted/50">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-primary">{displayed.length}개</span> 매물
        </p>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <MapPin className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">검색 결과가 없습니다</p>
          </div>
        ) : (
          displayed.map((prop) => (
            <button
              key={prop.id}
              onClick={() => onSelect(prop.id)}
              className={`w-full text-left px-4 py-3 border-b border-border transition-colors flex items-start gap-3 group ${
                selectedId === prop.id
                  ? "bg-primary/5 border-l-4 border-l-primary"
                  : "hover:bg-muted/60 border-l-4 border-l-transparent"
              }`}
            >
              {/* Type dot */}
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
  );
};

export default MapSidebar;
