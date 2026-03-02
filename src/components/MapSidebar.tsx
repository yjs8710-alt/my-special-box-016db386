import { MapPin, Eye, ChevronRight, ChevronLeft, Heart } from "lucide-react";
import { useState } from "react";
import { MapProperty } from "@/data/mapProperties";

const TYPE_DOT: Record<string, string> = {
  "상가": "bg-primary",
  "사무실": "bg-purple-600",
  "식당·카페": "bg-accent",
  "공장·창고": "bg-green-600",
  "병원·학원": "bg-red-700",
};

const TYPE_BG: Record<string, string> = {
  "상가": "bg-primary/10 text-primary",
  "사무실": "bg-purple-50 text-purple-700",
  "식당·카페": "bg-orange-50 text-accent",
  "공장·창고": "bg-green-50 text-green-700",
  "병원·학원": "bg-red-50 text-red-700",
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

const MapSidebar = ({ properties, selectedId, onSelect }: MapSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="absolute left-0 top-0 bottom-0 z-[900] flex pointer-events-none">
      {/* Panel */}
      <aside
        className={`pointer-events-auto bg-white border-r border-border flex flex-col shadow-xl transition-all duration-300 ${
          collapsed ? "w-0 overflow-hidden opacity-0" : "w-[340px] opacity-100"
        }`}
        style={{ marginTop: "106px", height: "calc(100% - 106px)" }}
      >
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-muted/40 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {properties.length}
            </span>
            <span className="text-xs text-muted-foreground font-medium">개 매물</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>정렬:</span>
            <select className="text-xs bg-transparent outline-none font-medium text-foreground cursor-pointer">
              <option>최신순</option>
              <option>낮은 월세순</option>
              <option>조회순</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <MapPin className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">검색 결과가 없습니다</p>
              <p className="text-xs mt-1 opacity-70">다른 조건으로 검색해보세요</p>
            </div>
          ) : (
            properties.map((prop) => (
              <button
                key={prop.id}
                onClick={() => onSelect(prop.id)}
                className={`w-full text-left transition-all flex gap-0 group border-b border-border ${
                  selectedId === prop.id
                    ? "bg-primary/5 border-l-[3px] border-l-primary"
                    : "hover:bg-muted/40 border-l-[3px] border-l-transparent"
                }`}
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 flex-shrink-0 overflow-hidden m-3 rounded-lg">
                  <img
                    src={prop.image}
                    alt={prop.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <div className="flex-1 min-w-0 py-3 pr-3">
                  {/* Type + badges */}
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TYPE_BG[prop.type] ?? "bg-primary/10 text-primary"}`}>
                      {prop.type}
                    </span>
                    {prop.isNew && (
                      <span className="text-[10px] font-bold text-badge-new">NEW</span>
                    )}
                    {prop.isHot && (
                      <span className="text-[10px] font-bold text-badge-hot">HOT</span>
                    )}
                  </div>

                  <p className="text-sm font-bold text-foreground line-clamp-1 leading-tight">{prop.title}</p>

                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-xs text-muted-foreground line-clamp-1">{prop.address}</p>
                  </div>

                  <div className="flex items-center justify-between mt-1.5">
                    <div>
                      <span className="text-xs text-muted-foreground">보증 </span>
                      <span className="text-xs font-bold text-foreground">{prop.deposit}</span>
                      <span className="text-xs text-muted-foreground mx-1">/</span>
                      <span className="text-sm font-extrabold text-accent">{prop.monthly}</span>
                    </div>
                    <button
                      onClick={(e) => toggleLike(prop.id, e)}
                      className="w-6 h-6 flex items-center justify-center"
                    >
                      <Heart className={`w-3.5 h-3.5 transition-colors ${liked.has(prop.id) ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                    </button>
                  </div>

                  <p className="text-[11px] text-muted-foreground mt-0.5">{prop.area} · {prop.floor}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Toggle tab */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="pointer-events-auto self-start bg-white border border-l-0 border-border rounded-r-lg px-1 py-4 shadow-md hover:bg-muted/50 transition-colors"
        style={{ marginTop: "138px" }}
      >
        {collapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-foreground" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-foreground" />
        )}
      </button>
    </div>
  );
};

export default MapSidebar;
