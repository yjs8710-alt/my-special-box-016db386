import { useState } from "react";
import { Search, X, SlidersHorizontal, ChevronDown, Hash, MapPin } from "lucide-react";

const TYPES = [
  { label: "전체", icon: "🗺" },
  { label: "상가", icon: "🏪" },
  { label: "사무실", icon: "🏢" },
  { label: "식당·카페", icon: "🍽" },
  { label: "공장·창고", icon: "🏭" },
  { label: "병원·학원", icon: "🏥" },
];

const DEAL_TYPES = ["전체", "임대", "매매"];
const DEPOSIT_RANGES = ["전체", "~1천", "1천~5천", "5천~1억", "1억~"];
const MONTHLY_RANGES = ["전체", "~50만", "50~100만", "100~200만", "200만~"];
const AREA_RANGES = ["전체", "~10평", "10~30평", "30~50평", "50평~"];

interface MapFilterBarProps {
  activeType: string;
  onTypeChange: (v: string) => void;
  query: string;
  onQueryChange: (v: string) => void;
  propertyId: string;
  onPropertyIdChange: (v: string) => void;
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
}

export interface FilterState {
  dealType: string;
  depositRange: string;
  monthlyRange: string;
  areaRange: string;
}

const MapFilterBar = ({
  activeType,
  onTypeChange,
  query,
  onQueryChange,
  propertyId,
  onPropertyIdChange,
  filters,
  onFiltersChange,
}: MapFilterBarProps) => {
  const [showFilter, setShowFilter] = useState(false);

  const activeFilterCount = [
    filters.dealType !== "전체",
    filters.depositRange !== "전체",
    filters.monthlyRange !== "전체",
    filters.areaRange !== "전체",
  ].filter(Boolean).length;

  const resetFilters = () =>
    onFiltersChange({ dealType: "전체", depositRange: "전체", monthlyRange: "전체", areaRange: "전체" });

  return (
    <div
      className="absolute z-[1000] pointer-events-none"
      style={{ top: 16, left: 16, width: 320 }}
    >
      <div className="pointer-events-auto flex flex-col gap-2">
        {/* 매물번호 검색 */}
        <div
          className="flex items-center gap-2 bg-white rounded-xl px-3 h-10 border border-border"
          style={{ boxShadow: "0 4px 16px rgba(10,45,110,0.13)" }}
        >
          <Hash className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--accent))" }} />
          <input
            type="text"
            value={propertyId}
            onChange={(e) => onPropertyIdChange(e.target.value)}
            placeholder="매물번호로 검색 (예: 1023)"
            className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
          />
          {propertyId && (
            <button onClick={() => onPropertyIdChange("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 주소 검색 + 필터 버튼 */}
        <div
          className="flex items-center bg-white rounded-xl overflow-hidden border border-border"
          style={{ boxShadow: "0 4px 16px rgba(10,45,110,0.13)" }}
        >
          <div className="flex items-center flex-1 px-3 gap-2 h-10">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="주소, 건물명, 역명 검색"
              className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => onQueryChange("")} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="relative flex items-center gap-1 px-3 h-10 border-l border-border transition-colors"
            style={{ color: showFilter ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">필터</span>
            {activeFilterCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                style={{ background: "hsl(var(--accent))" }}
              >
                {activeFilterCount}
              </span>
            )}
          </button>
          <button
            className="flex items-center justify-center h-10 px-4 text-xs font-bold text-white rounded-r-xl transition-colors"
            style={{ background: "hsl(var(--primary))" }}
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 매물 유형 칩 */}
        <div
          className="flex gap-1.5 px-3 py-2 bg-white rounded-xl border border-border overflow-x-auto scrollbar-none"
          style={{ boxShadow: "0 2px 8px rgba(10,45,110,0.08)" }}
        >
          {TYPES.map((t) => (
            <button
              key={t.label}
              onClick={() => onTypeChange(t.label)}
              className="flex items-center gap-1 flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold transition-all border"
              style={
                activeType === t.label
                  ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
                  : { background: "transparent", color: "hsl(var(--foreground))", borderColor: "hsl(var(--border))" }
              }
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* 상세 필터 패널 */}
        {showFilter && (
          <div
            className="bg-white rounded-xl border border-border p-4 flex flex-col gap-3"
            style={{ boxShadow: "0 8px 32px rgba(10,45,110,0.15)" }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">상세 필터</span>
              {activeFilterCount > 0 && (
                <button onClick={resetFilters} className="text-[10px] text-muted-foreground hover:text-destructive transition-colors">
                  초기화
                </button>
              )}
            </div>

            {[
              { label: "거래 유형", key: "dealType" as const, options: DEAL_TYPES },
              { label: "보증금", key: "depositRange" as const, options: DEPOSIT_RANGES },
              { label: "월세", key: "monthlyRange" as const, options: MONTHLY_RANGES },
              { label: "면적", key: "areaRange" as const, options: AREA_RANGES },
            ].map(({ label, key, options }) => (
              <div key={key}>
                <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">{label}</p>
                <div className="flex flex-wrap gap-1">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => onFiltersChange({ ...filters, [key]: opt })}
                      className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                      style={
                        filters[key] === opt
                          ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }
                          : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                      }
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapFilterBar;
