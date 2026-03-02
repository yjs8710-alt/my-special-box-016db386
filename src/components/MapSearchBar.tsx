import { Search, SlidersHorizontal, X } from "lucide-react";

const TYPES = [
  { label: "전체", icon: "🗺" },
  { label: "상가", icon: "🏪" },
  { label: "사무실", icon: "🏢" },
  { label: "식당·카페", icon: "🍽" },
  { label: "공장·창고", icon: "🏭" },
  { label: "병원·학원", icon: "🏥" },
];

interface MapSearchBarProps {
  query: string;
  onQueryChange: (v: string) => void;
  activeType: string;
  onTypeChange: (v: string) => void;
}

const MapSearchBar = ({ query, onQueryChange, activeType, onTypeChange }: MapSearchBarProps) => (
  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-2xl px-4 pointer-events-none">
    <div className="pointer-events-auto bg-white rounded-xl shadow-2xl border border-border overflow-hidden">
      {/* Search row */}
      <div className="flex items-center gap-0">
        {/* Region */}
        <div className="flex items-center gap-1.5 px-4 border-r border-border h-12 flex-shrink-0 cursor-pointer hover:bg-muted/50 transition-colors">
          <span className="text-xs font-semibold text-primary whitespace-nowrap">서울 전체</span>
          <svg className="w-3 h-3 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Input */}
        <div className="flex items-center flex-1 px-3 gap-2">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="지역, 건물명, 역명으로 검색"
            className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground h-12"
          />
          {query && (
            <button onClick={() => onQueryChange("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter + Search button */}
        <div className="flex items-center gap-0 flex-shrink-0">
          <button className="flex items-center gap-1.5 px-3 h-12 border-l border-border text-muted-foreground hover:text-primary transition-colors">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-xs font-medium hidden sm:block">필터</span>
          </button>
          <button className="h-12 px-5 bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors rounded-r-xl">
            검색
          </button>
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex gap-1 px-3 py-2 bg-muted/30 border-t border-border overflow-x-auto scrollbar-none">
        {TYPES.map((t) => (
          <button
            key={t.label}
            onClick={() => onTypeChange(t.label)}
            className={`flex items-center gap-1 flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              activeType === t.label
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-foreground border border-border hover:border-primary hover:text-primary"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default MapSearchBar;
