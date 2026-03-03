import { useState } from "react";
import { Search, X, SlidersHorizontal, Hash, MapPin, RotateCcw, Phone } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const CATEGORY_TYPES = [
  { label: "임대전체", group: "임대" },
  { label: "상가임대", group: "임대" },
  { label: "기타임대", group: "임대" },
  { label: "매매전체", group: "매매" },
  { label: "원룸건물매매", group: "매매" },
  { label: "주택매매", group: "매매" },
  { label: "상가주택매매", group: "매매" },
  { label: "상가건물매매", group: "매매" },
  { label: "구분상가매매", group: "매매" },
  { label: "창고/공장매매", group: "매매" },
  { label: "숙박/펜션매매", group: "매매" },
];

const ROOM_TYPES = ["전체", "원룸", "투룸", "쓰리룸+", "오피스텔", "투베이", "복층"];
const RESIDENTIAL_TYPES = ["전체", "원룸", "투베이", "투룸", "쓰리룸", "주인세대", "아파트", "오피스텔", "빌라"];
const DEAL_TYPES = ["전체", "임대", "매매"];
const BUILD_YEARS = ["전체", "1년 이내", "3년 이내", "5년 이내", "10년 이내", "15년 이상"];

const BUILDING_OPTIONS = [
  { key: "신축", label: "신축" },
  { key: "올리모델링", label: "올리모델링" },
  { key: "엘리베이터", label: "엘리베이터" },
  { key: "주차가능", label: "주차 가능" },
  { key: "반려동물가능", label: "반려동물 가능" },
  { key: "반려동물불가", label: "반려동물 불가" },
  { key: "보안카메라", label: "CCTV" },
  { key: "전기차충전", label: "전기차 충전" },
];

const ROOM_OPTIONS = [
  { key: "에어컨", label: "에어컨" },
  { key: "냉장고", label: "냉장고" },
  { key: "세탁기", label: "세탁기" },
  { key: "전자레인지", label: "전자레인지" },
  { key: "침대", label: "침대" },
  { key: "옷장", label: "옷장" },
  { key: "인터넷", label: "인터넷" },
  { key: "전자키", label: "전자키" },
  { key: "도시가스", label: "도시가스" },
  { key: "싱크대", label: "싱크대" },
];

export interface FilterState {
  dealType: string;
  roomTypes: string[];
  depositRange: [number, number];
  monthlyRange: [number, number];
  floorRange: [number, number];
  areaRange: [number, number];
  buildYear: string;
  buildingOptions: string[];
  roomOptions: string[];
}

export const DEFAULT_FILTERS: FilterState = {
  dealType: "전체",
  roomTypes: [],
  depositRange: [0, 50000],
  monthlyRange: [0, 1000],
  floorRange: [1, 30],
  areaRange: [0, 200],
  buildYear: "전체",
  buildingOptions: [],
  roomOptions: [],
};

interface MapFilterBarProps {
  activeType: string;
  onTypeChange: (v: string) => void;
  query: string;
  onQueryChange: (v: string) => void;
  propertyId: string;
  onPropertyIdChange: (v: string) => void;
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  onLandlordClick?: () => void;
  showCategoryChips?: boolean;
  showResidentialTypes?: boolean;
}

function formatManwon(v: number, max: number) {
  if (v >= max) return "무제한";
  if (v === 0) return "0";
  if (v >= 10000) return `${(v / 10000).toFixed(v % 10000 === 0 ? 0 : 1)}억`;
  return `${v.toLocaleString()}만`;
}
function formatArea(v: number, max: number) {
  if (v >= max) return "무제한";
  return `${v}평`;
}
function formatFloor(v: number, max: number) {
  if (v >= max) return "30층+";
  return `${v}층`;
}

// 입력 문자열 → 만원 단위 숫자
function parseManwon(s: string): number | null {
  const t = s.replace(/,/g, "").replace(/\s/g, "");
  if (t === "" || t === "무제한") return null;
  // 억 단위
  const uk = t.match(/^(\d+(?:\.\d+)?)억$/);
  if (uk) return Math.round(parseFloat(uk[1]) * 10000);
  const mk = t.match(/^(\d+(?:\.\d+)?)만?$/);
  if (mk) return Math.round(parseFloat(mk[1]));
  return null;
}

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold tracking-wide mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
    {children}
  </p>
);

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
      style={
        active
          ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }
          : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
      }
    >
      {children}
    </button>
  );
}

function toggleArr(arr: string[], val: string) {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

// 범위 입력 (슬라이더 + 텍스트 입력 두 칸)
function RangeInput({
  label,
  min,
  max,
  step,
  value,
  onChange,
  format,
  parse,
  ticks,
  unit,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  format: (v: number, max: number) => string;
  parse: (s: string) => number | null;
  ticks: string[];
  unit?: string;
}) {
  const [minText, setMinText] = useState("");
  const [maxText, setMaxText] = useState("");

  const applyMin = () => {
    const n = parse(minText);
    if (n !== null) {
      const clamped = Math.max(min, Math.min(n, value[1]));
      onChange([clamped, value[1]]);
    }
    setMinText("");
  };
  const applyMax = () => {
    const n = parse(maxText);
    if (n !== null) {
      const clamped = Math.min(max, Math.max(n, value[0]));
      onChange([value[0], clamped]);
    }
    setMaxText("");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <SectionLabel>{label}</SectionLabel>
        <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--primary))" }}>
          {format(value[0], max)} ~ {format(value[1], max)}
        </span>
      </div>
      {/* 텍스트 직접 입력 */}
      <div className="flex items-center gap-1 mb-2">
        <input
          type="text"
          value={minText}
          onChange={(e) => setMinText(e.target.value)}
          onBlur={applyMin}
          onKeyDown={(e) => e.key === "Enter" && applyMin()}
          placeholder={format(value[0], max)}
          className="flex-1 h-7 px-2 rounded-lg border border-border text-[11px] bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
        />
        <span className="text-[10px] text-muted-foreground">~</span>
        <input
          type="text"
          value={maxText}
          onChange={(e) => setMaxText(e.target.value)}
          onBlur={applyMax}
          onKeyDown={(e) => e.key === "Enter" && applyMax()}
          placeholder={format(value[1], max)}
          className="flex-1 h-7 px-2 rounded-lg border border-border text-[11px] bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
        />
        {unit && <span className="text-[10px] text-muted-foreground whitespace-nowrap">{unit}</span>}
      </div>
      <Slider
        min={min} max={max} step={step}
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
        className="w-full"
      />
      <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
        {ticks.map((t, i) => <span key={i}>{t}</span>)}
      </div>
    </div>
  );
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
  onLandlordClick,
  showCategoryChips = false,
  showResidentialTypes = false,
}: MapFilterBarProps) => {
  const [showFilter, setShowFilter] = useState(false);

  const set = <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
    onFiltersChange({ ...filters, [key]: val });

  const isDefault = (f: FilterState) =>
    f.dealType === "전체" &&
    f.roomTypes.length === 0 &&
    f.depositRange[0] === 0 && f.depositRange[1] === 50000 &&
    f.monthlyRange[0] === 0 && f.monthlyRange[1] === 1000 &&
    f.floorRange[0] === 1 && f.floorRange[1] === 30 &&
    f.areaRange[0] === 0 && f.areaRange[1] === 200 &&
    f.buildYear === "전체" &&
    f.buildingOptions.length === 0 &&
    f.roomOptions.length === 0;

  const activeFilterCount = [
    filters.dealType !== "전체",
    filters.roomTypes.length > 0,
    filters.depositRange[0] !== 0 || filters.depositRange[1] !== 50000,
    filters.monthlyRange[0] !== 0 || filters.monthlyRange[1] !== 1000,
    filters.floorRange[0] !== 1 || filters.floorRange[1] !== 30,
    filters.areaRange[0] !== 0 || filters.areaRange[1] !== 200,
    filters.buildYear !== "전체",
    filters.buildingOptions.length > 0,
    filters.roomOptions.length > 0,
  ].filter(Boolean).length;

  return (
    <div
      className="absolute z-[1000] pointer-events-none"
      style={{ top: 16, left: 16, width: 320 }}
    >
      <div className="pointer-events-auto flex flex-col gap-2">
        {/* 매물번호 검색 + 임대인 번호 찾기 */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 bg-white rounded-xl px-3 h-10 border border-border flex-1"
            style={{ boxShadow: "0 4px 16px rgba(10,45,110,0.13)" }}
          >
            <Hash className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--accent))" }} />
            <input
              type="text"
              value={propertyId}
              onChange={(e) => onPropertyIdChange(e.target.value)}
              placeholder="매물번호 검색 (예: 1023)"
              className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
            {propertyId && (
              <button onClick={() => onPropertyIdChange("")} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {onLandlordClick && (
            <button
              onClick={onLandlordClick}
              className="flex items-center gap-1.5 h-10 px-3 rounded-xl text-white text-xs font-bold flex-shrink-0 hover:scale-105 transition-all"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(218 88% 32%))", boxShadow: "0 4px 16px rgba(10,45,110,0.25)" }}
            >
              <Phone className="w-3.5 h-3.5" />
              임대인 번호
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
            onClick={() => setShowFilter((v) => !v)}
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
            className="flex items-center justify-center h-10 px-4 text-xs font-bold text-white rounded-r-xl"
            style={{ background: "hsl(var(--primary))" }}
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 상세 필터 패널 */}
        {showFilter && (
          <div
            className="bg-white rounded-xl border border-border flex flex-col overflow-hidden"
            style={{ boxShadow: "0 8px 32px rgba(10,45,110,0.15)", maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-white z-10">
              <span className="text-xs font-bold text-foreground">상세 필터</span>
              {!isDefault(filters) && (
                <button
                  onClick={() => onFiltersChange({ ...DEFAULT_FILTERS })}
                  className="flex items-center gap-1 text-[10px] font-medium transition-colors hover:text-destructive"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  <RotateCcw className="w-3 h-3" />
                  초기화
                </button>
              )}
            </div>

            <div className="px-4 py-3 flex flex-col gap-4">

              {/* 상가 카테고리 - showCategoryChips 일 때만 */}
              {showCategoryChips && (
                <div>
                  <SectionLabel>매물 유형</SectionLabel>
                  <div className="flex flex-wrap gap-1">
                    {["임대", "매매"].map((group) => (
                      <div key={group} className="w-full">
                        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {group}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {CATEGORY_TYPES.filter((t) => t.group === group).map((t) => (
                            <button
                              key={t.label}
                              onClick={() => onTypeChange(t.label)}
                              className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                              style={
                                activeType === t.label
                                  ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }
                                  : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                              }
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 주거 유형 - showResidentialTypes 일 때만 */}
              {showResidentialTypes && (
                <div>
                  <SectionLabel>임대 유형</SectionLabel>
                  <div className="flex flex-wrap gap-1">
                    {RESIDENTIAL_TYPES.map((v) => {
                      const isAll = v === "전체";
                      const active = isAll ? activeType === "전체" : activeType === v;
                      return (
                        <Chip
                          key={v}
                          active={active}
                          onClick={() => onTypeChange(v)}
                        >
                          {v}
                        </Chip>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 거래 유형 */}
              <div>
                <SectionLabel>거래 유형</SectionLabel>
                <div className="flex flex-wrap gap-1">
                  {DEAL_TYPES.map((v) => (
                    <Chip key={v} active={filters.dealType === v} onClick={() => set("dealType", v)}>{v}</Chip>
                  ))}
                </div>
              </div>

              {/* 방 종류 */}
              <div>
                <SectionLabel>방 종류</SectionLabel>
                <div className="flex flex-wrap gap-1">
                  {ROOM_TYPES.map((v) => {
                    const isAll = v === "전체";
                    const active = isAll ? filters.roomTypes.length === 0 : filters.roomTypes.includes(v);
                    return (
                      <Chip
                        key={v}
                        active={active}
                        onClick={() => {
                          if (isAll) set("roomTypes", []);
                          else set("roomTypes", toggleArr(filters.roomTypes, v));
                        }}
                      >
                        {v}
                      </Chip>
                    );
                  })}
                </div>
              </div>

              {/* 보증금 */}
              <RangeInput
                label="보증금"
                min={0} max={50000} step={500}
                value={filters.depositRange}
                onChange={(v) => set("depositRange", v)}
                format={formatManwon}
                parse={parseManwon}
                ticks={["0", "1억", "2억", "3억", "무제한"]}
              />

              {/* 월세 */}
              <RangeInput
                label="월세"
                min={0} max={1000} step={10}
                value={filters.monthlyRange}
                onChange={(v) => set("monthlyRange", v)}
                format={formatManwon}
                parse={parseManwon}
                ticks={["0", "250만", "500만", "750만", "무제한"]}
              />

              {/* 매매가 (보증금과 동일 슬라이더지만 별도 라벨) */}
              <RangeInput
                label="매매가"
                min={0} max={50000} step={500}
                value={filters.depositRange}
                onChange={(v) => set("depositRange", v)}
                format={formatManwon}
                parse={parseManwon}
                ticks={["0", "1억", "2억", "3억", "무제한"]}
              />

              {/* 층수 */}
              <RangeInput
                label="층수"
                min={1} max={30} step={1}
                value={filters.floorRange}
                onChange={(v) => set("floorRange", v)}
                format={formatFloor}
                parse={(s) => { const n = parseInt(s); return isNaN(n) ? null : n; }}
                ticks={["1층", "8층", "15층", "22층", "30층+"]}
                unit="층"
              />

              {/* 면적 */}
              <RangeInput
                label="면적 (평)"
                min={0} max={200} step={5}
                value={filters.areaRange}
                onChange={(v) => set("areaRange", v)}
                format={formatArea}
                parse={(s) => { const n = parseFloat(s.replace("평", "")); return isNaN(n) ? null : n; }}
                ticks={["0", "50평", "100평", "150평", "무제한"]}
                unit="평"
              />

              {/* 준공년도 */}
              <div>
                <SectionLabel>준공년도</SectionLabel>
                <div className="flex flex-wrap gap-1">
                  {BUILD_YEARS.map((v) => (
                    <Chip key={v} active={filters.buildYear === v} onClick={() => set("buildYear", v)}>{v}</Chip>
                  ))}
                </div>
              </div>

              {/* 건물 옵션 */}
              <div>
                <SectionLabel>건물 옵션</SectionLabel>
                <div className="flex flex-wrap gap-1">
                  {BUILDING_OPTIONS.map(({ key, label }) => (
                    <Chip
                      key={key}
                      active={filters.buildingOptions.includes(key)}
                      onClick={() => set("buildingOptions", toggleArr(filters.buildingOptions, key))}
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* 방 옵션 */}
              <div>
                <SectionLabel>방 옵션 (가구·가전)</SectionLabel>
                <div className="flex flex-wrap gap-1">
                  {ROOM_OPTIONS.map(({ key, label }) => (
                    <Chip
                      key={key}
                      active={filters.roomOptions.includes(key)}
                      onClick={() => set("roomOptions", toggleArr(filters.roomOptions, key))}
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
              </div>

            </div>

            {/* 적용 버튼 */}
            <div className="px-4 py-3 border-t border-border sticky bottom-0 bg-white">
              <button
                onClick={() => setShowFilter(false)}
                className="w-full h-9 rounded-full text-xs font-bold text-white transition-colors"
                style={{ background: "hsl(var(--primary))" }}
              >
                필터 적용
                {activeFilterCount > 0 && ` (${activeFilterCount}개 선택)`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapFilterBar;
