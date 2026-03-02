import { Search } from "lucide-react";

const TYPES = ["전체", "상가", "사무실", "식당·카페", "공장·창고", "병원·학원"];

interface MapSearchBarProps {
  query: string;
  onQueryChange: (v: string) => void;
  activeType: string;
  onTypeChange: (v: string) => void;
}

const MapSearchBar = ({ query, onQueryChange, activeType, onTypeChange }: MapSearchBarProps) => (
  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-xl px-4 pointer-events-none">
    <div className="pointer-events-auto bg-card/95 backdrop-blur-md rounded-2xl shadow-xl border border-border overflow-hidden">
      {/* Search input */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="지역, 건물명, 역명 검색..."
          className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
        />
      </div>
      {/* Type filter */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => onTypeChange(t)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
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
  </div>
);

export default MapSearchBar;
