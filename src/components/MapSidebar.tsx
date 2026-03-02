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
    <div className="absolute right-0 top-0 bottom-0 z-[900] flex flex-row-reverse pointer-events-none">
      {/* Panel */}
      <aside
        className={`pointer-events-auto bg-white border-l border-border flex flex-col transition-all duration-300 ${
          collapsed ? "w-0 overflow-hidden opacity-0" : "w-[340px] opacity-100"
        }`}
        style={{
          marginTop: "106px",
          height: "calc(100% - 106px)",
          boxShadow: "-4px 0 24px rgba(10,45,110,0.12)",
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0"
          style={{ background: "linear-gradient(to right, hsl(var(--primary)/0.04), hsl(var(--primary)/0.08))" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full shadow-sm">
              {properties.length}
            </span>
            <span className="text-xs text-muted-foreground font-semibold">개 매물</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium">정렬</span>
            <select className="text-xs bg-white border border-border rounded-lg px-2 py-1 outline-none font-semibold text-foreground cursor-pointer hover:border-primary transition-colors">
              <option>최신순</option>
              <option>낮은 월세순</option>
              <option>조회순</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin bg-muted/20">
          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <MapPin className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">검색 결과가 없습니다</p>
              <p className="text-xs mt-1 opacity-70">다른 조건으로 검색해보세요</p>
            </div>
          ) : (
            <div className="p-2 flex flex-col gap-2">
              {properties.map((prop) => (
                <button
                  key={prop.id}
                  onClick={() => onSelect(prop.id)}
                  className={`w-full text-left transition-all group rounded-xl overflow-hidden bg-white ${
                    selectedId === prop.id
                      ? "ring-2 ring-primary shadow-lg"
                      : "shadow-sm hover:shadow-md hover:ring-1 hover:ring-primary/30"
                  }`}
                >
                  <div className="flex gap-0">
                    {/* Thumbnail */}
                    <div className="w-[88px] h-[88px] flex-shrink-0 overflow-hidden relative">
                      <img
                        src={prop.image}
                        alt={prop.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {selectedId === prop.id && (
                        <div className="absolute inset-0 bg-primary/20" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 p-3">
                      {/* Type + badges */}
                      <div className="flex items-center gap-1 mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${TYPE_BG[prop.type] ?? "bg-primary/10 text-primary"}`}>
                          {prop.type}
                        </span>
                        {prop.isNew && (
                          <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">NEW</span>
                        )}
                        {prop.isHot && (
                          <span className="text-[9px] font-extrabold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md">HOT 🔥</span>
                        )}
                      </div>

                      <p className="text-sm font-bold text-foreground line-clamp-1 leading-tight">{prop.title}</p>

                      <div className="flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-[11px] text-muted-foreground line-clamp-1">{prop.address}</p>
                      </div>

                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[11px] text-muted-foreground">보증 {prop.deposit} /</span>
                          <span className="text-sm font-extrabold text-accent">{prop.monthly}</span>
                        </div>
                        <button
                          onClick={(e) => toggleLike(prop.id, e)}
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                        >
                          <Heart className={`w-3.5 h-3.5 transition-all ${liked.has(prop.id) ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground"}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Toggle tab */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="pointer-events-auto self-start bg-primary text-primary-foreground border-0 rounded-l-xl px-1.5 py-4 shadow-lg hover:bg-primary/90 transition-colors"
        style={{ marginTop: "138px" }}
      >
        {collapsed ? (
          <ChevronLeft className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};

export default MapSidebar;
