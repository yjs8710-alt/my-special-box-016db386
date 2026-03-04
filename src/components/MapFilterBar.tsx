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
  { label: "숙박/팬션매매", group: "매매" },
];

const ROOM_TYPES = ["전체", "원룸", "투룸", "쓰리룸+", "오피스텔", "투베이", "복층", "주인세대"];
const RESIDENTIAL_TYPES = ["전체", "원룸", "투베이", "투룸", "쓰리룸", "주인세대", "아파트", "오피스텔", "빌라", "고시원"];
const DEAL_TYPES_RESIDENTIAL = ["전체", "월세", "전세", "단기임대"];
const DEAL_TYPES_COMMERCIAL = ["전체", "임대", "매매"];
const BUILD_YEARS = ["전체", "1년 이내", "3년 이내", "5년 이내", "10년 이내", "15년 이내", "20년 이상"];

const LAND_CATEGORIES = [
  "전", "답", "과수원", "목장용지", "임야", "대", "공장용지", "주차장",
  "주유소용지", "창고용지", "잡종지", "묘지", "도로", "철도용지", "제방",
  "하천", "구거", "유지", "양어장", "수도용지", "공원", "체육용지",
  "유원지", "종교용지", "사적지", "광천지", "염전",
];

const ZONE_TYPES = [
  "보전관리지역", "생산관리지역", "계획관리지역", "농림지역", "자연환경보전지역",
  "1종전용주거지역", "2종전용주거지역", "3종전용주거지역",
  "1종일반주거지역", "2종일반주거지역", "3종일반주거지역", "준주거지역",
  "중심상업지역", "일반상업지역", "근린상업지역", "유통상업지역",
  "전용공업지역", "일반공업지역", "준공업지역",
  "녹지지역", "보전녹지지역", "생산녹지지역", "자연녹지지역",
];

const BUILDING_OPTIONS = [
  { key: "신축", label: "신축" },
  { key: "올리모델링", label: "올리모델링" },
  { key: "엘리베이터", label: "엘리베이터" },
  { key: "애완동물가능", label: "애완동물 가능" },
  { key: "애완동물불가", label: "애완동물 불가" },
  { key: "유선IPTV", label: "유선/IPTV" },
  { key: "수도세포함", label: "수도세 포함" },
  { key: "주차가능", label: "주차 가능" },
  { key: "무인택배함", label: "무인 택배함" },
  { key: "인터넷", label: "인터넷" },
  { key: "CCTV", label: "CCTV" },
  { key: "여성전용", label: "여성전용" },
];

const ROOM_OPTIONS = [
  { key: "테라스", label: "테라스" },
  { key: "옥탑", label: "옥탑" },
  { key: "복층", label: "복층" },
  { key: "지하", label: "지하" },
  { key: "주차", label: "주차" },
  { key: "LH가능", label: "LH가능" },
  { key: "동향", label: "동향" },
  { key: "서향", label: "서향" },
  { key: "남향", label: "남향" },
  { key: "북향", label: "북향" },
  { key: "냉장고", label: "냉장고" },
  { key: "세탁기", label: "세탁기" },
  { key: "드럼세탁기", label: "드럼세탁기" },
  { key: "건조기", label: "건조기" },
  { key: "스타일러", label: "스타일러" },
  { key: "TV", label: "TV" },
  { key: "에어컨", label: "에어컨" },
  { key: "가스레인지", label: "가스레인지" },
  { key: "인덕션", label: "인덕션" },
  { key: "전자레인지", label: "전자레인지" },
  { key: "침대", label: "침대" },
  { key: "책상", label: "책상" },
  { key: "옷장붙박이", label: "옷장(붙)" },
  { key: "전자키", label: "전자키" },
  { key: "베란다없음", label: "베란다없음" },
];

export interface FilterState {
  dealType: string[];
  roomTypes: string[];
  depositRange: [number, number];
  monthlyRange: [number, number];
  saleRange: [number, number];
  floorRange: [number, number];
  areaRange: [number, number];
  buildYear: string[];
  buildingOptions: string[];
  roomOptions: string[];
  landCategory: string[];
  zoneType: string[];
}

export const DEFAULT_FILTERS: FilterState = {
  dealType: [],
  roomTypes: [],
  depositRange: [0, 50000],
  monthlyRange: [0, 1000],
  saleRange: [0, 200000],
  floorRange: [-2, 30],
  areaRange: [0, 200],
  buildYear: [],
  buildingOptions: [],
  roomOptions: [],
  landCategory: [],
  zoneType: [],
};

interface MapFilterBarProps {
  activeType: string;
  activeTypes?: string[];
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
  nonResidentialSubtypes?: { label: string; group: string }[];
  showRoomTypes?: boolean;
  showFloor?: boolean;
  showBuildYear?: boolean;
  showBuildingOptions?: boolean;
  showLandFilters?: boolean;
}

function makeFormatManwon(max: number) {
  return (v: number) => {
    if (v >= max) return "무제한";
    if (v === 0) return "0";
    if (v >= 10000) return `${(v / 10000).toFixed(v % 10000 === 0 ? 0 : 1)}억`;
    return `${v.toLocaleString()}만`;
  };
}
function makeFormatArea(max: number) {
  return (v: number) => {
    if (v >= max) return "무제한";
    const sqm = (v * 3.30579).toFixed(2);
    return `${v}평(${sqm}㎡)`;
  };
}
function makeFormatFloor(min: number, max: number) {
  return (v: number) => {
    if (v >= max) return "무제한";
    return `${v}층`;
  };
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
  defaultValue,
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
  defaultValue: [number, number];
  onChange: (v: [number, number]) => void;
  format: (v: number) => string;
  parse: (s: string) => number | null;
  ticks: string[];
  unit?: string;
}) {
  const [minText, setMinText] = useState("");
  const [maxText, setMaxText] = useState("");

  const isDefault = value[0] === defaultValue[0] && value[1] === defaultValue[1];

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
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--primary))" }}>
            {format(value[0])} ~ {format(value[1])}
          </span>
          {!isDefault && (
            <button
              onClick={() => onChange(defaultValue)}
              className="text-[9px] px-1.5 py-0.5 rounded border transition-colors"
              style={{ color: "hsl(var(--destructive))", borderColor: "hsl(var(--destructive))", background: "transparent" }}
            >
              조건삭제
            </button>
          )}
        </div>
      </div>
      {/* 텍스트 직접 입력 */}
      <div className="flex items-center gap-1 mb-2">
        <input
          type="text"
          value={minText}
          onChange={(e) => setMinText(e.target.value)}
          onBlur={applyMin}
          onKeyDown={(e) => e.key === "Enter" && applyMin()}
          placeholder={format(value[0])}
          className="flex-1 h-7 px-2 rounded-lg border border-border text-[11px] bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
        />
        <span className="text-[10px] text-muted-foreground">~</span>
        <input
          type="text"
          value={maxText}
          onChange={(e) => setMaxText(e.target.value)}
          onBlur={applyMax}
          onKeyDown={(e) => e.key === "Enter" && applyMax()}
          placeholder={format(value[1])}
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
  activeTypes,
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
  nonResidentialSubtypes,
  showRoomTypes = true,
  showFloor = true,
  showBuildYear = true,
  showBuildingOptions = false,
  showLandFilters = false,
}: MapFilterBarProps) => {
  const [showFilter, setShowFilter] = useState(false);

  const set = <K extends keyof FilterState>(key: K, val: FilterState[K]) =>
    onFiltersChange({ ...filters, [key]: val });

  const isDefault = (f: FilterState) =>
    f.dealType.length === 0 &&
    f.roomTypes.length === 0 &&
    f.depositRange[0] === 0 && f.depositRange[1] === 50000 &&
    f.monthlyRange[0] === 0 && f.monthlyRange[1] === 1000 &&
    f.saleRange[0] === 0 && f.saleRange[1] === 200000 &&
    f.floorRange[0] === -2 && f.floorRange[1] === 30 &&
    f.areaRange[0] === 0 && f.areaRange[1] === 200 &&
    f.buildYear.length === 0 &&
    f.buildingOptions.length === 0 &&
    f.roomOptions.length === 0 &&
    f.landCategory.length === 0 &&
    f.zoneType.length === 0;

  const activeFilterCount = [
    filters.dealType.length > 0,
    filters.roomTypes.length > 0,
    filters.depositRange[0] !== 0 || filters.depositRange[1] !== 50000,
    filters.monthlyRange[0] !== 0 || filters.monthlyRange[1] !== 1000,
    filters.saleRange[0] !== 0 || filters.saleRange[1] !== 200000,
    filters.floorRange[0] !== -2 || filters.floorRange[1] !== 30,
    filters.areaRange[0] !== 0 || filters.areaRange[1] !== 200,
    filters.buildYear.length > 0,
    filters.buildingOptions.length > 0,
    filters.roomOptions.length > 0,
    filters.landCategory.length > 0,
    filters.zoneType.length > 0,
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
              건물주 번호 검색
            </button>
          )}
        </div>

        {/* 주소 검색 + 필터 버튼 */}
        <div
          className="flex items-center bg-white rounded-xl overflow-hidden border border-border"
          style={{ boxShadow: "0 4px 16px rgba(10,45,110,0.13)" }}
        >
          {/* 카테고리 선택 드롭다운 */}
          <div className="relative flex-shrink-0 border-r border-border">
            <button
              onClick={() => setShowCategoryDrop(v => !v)}
              className="flex items-center gap-1 h-10 px-2.5 text-[11px] font-bold text-foreground hover:bg-muted/40 transition-colors whitespace-nowrap"
            >
              <span className="max-w-[70px] truncate">{selectedCategory?.short ?? "전체"}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="flex-shrink-0"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
            {showCategoryDrop && (
              <>
                <div className="fixed inset-0 z-[1100]" onClick={() => setShowCategoryDrop(false)} />
                <div className="absolute left-0 top-full mt-1 z-[1101] bg-white border border-border rounded-xl shadow-2xl min-w-[220px] overflow-hidden">
                  {SEARCH_CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => { setSelectedCategory(cat); setShowCategoryDrop(false); }}
                      className="w-full text-left px-3 py-2.5 hover:bg-primary/5 transition-colors border-b border-border/50 last:border-b-0"
                    >
                      <p className="text-[11px] font-bold text-foreground">{cat.label}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5 leading-relaxed">{cat.desc}</p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

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
                          {CATEGORY_TYPES.filter((t) => t.group === group).map((t) => {
                            const arr = activeTypes ?? [activeType];
                            const active = arr.includes(t.label);
                            return (
                              <button
                                key={t.label}
                                onClick={() => onTypeChange(t.label)}
                                className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                                style={
                                  active
                                    ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }
                                    : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                                }
                              >
                                {t.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 비주거형 카테고리 - nonResidentialSubtypes 있을 때만 */}
              {nonResidentialSubtypes && nonResidentialSubtypes.length > 0 && (
                <div>
                  <SectionLabel>매물 유형</SectionLabel>
                  <div className="flex flex-wrap gap-1">
                    {["임대", "매매"].map((group) => (
                      <div key={group} className="w-full">
                        <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {group}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {nonResidentialSubtypes.filter((t) => t.group === group || (group === "임대" && t.group === "전체")).map((t) => {
                            const arr = activeTypes ?? [activeType];
                            const key = (t as any).key ?? t.label;
                            const active = arr.includes(key);
                            return (
                              <button
                                key={key}
                                onClick={() => onTypeChange(key)}
                                className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
                                style={
                                  active
                                    ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }
                                    : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                                }
                              >
                                {t.label}
                              </button>
                            );
                          })}
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
                      const arr = activeTypes ?? [activeType];
                      const active = isAll ? arr.includes("전체") || arr.length === 0 : arr.includes(v);
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
                  {(showResidentialTypes ? DEAL_TYPES_RESIDENTIAL : DEAL_TYPES_COMMERCIAL).map((v) => {
                    const isAll = v === "전체";
                    const active = isAll ? filters.dealType.length === 0 : filters.dealType.includes(v);
                    return (
                      <Chip key={v} active={active} onClick={() => {
                        if (isAll) set("dealType", []);
                        else set("dealType", toggleArr(filters.dealType, v));
                      }}>{v}</Chip>
                    );
                  })}
                </div>
              </div>


              {/* 방 종류 */}
              {showRoomTypes && (
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
              )}

              {/* 보증금 */}
              <RangeInput
                label="보증금"
                min={0} max={50000} step={500}
                value={filters.depositRange}
                defaultValue={[0, 50000]}
                onChange={(v) => set("depositRange", v)}
                format={makeFormatManwon(50000)}
                parse={parseManwon}
                ticks={["0", "1억", "2억", "3억", "무제한"]}
              />

              {/* 월세 */}
              <RangeInput
                label="월세"
                min={0} max={1000} step={10}
                value={filters.monthlyRange}
                defaultValue={[0, 1000]}
                onChange={(v) => set("monthlyRange", v)}
                format={makeFormatManwon(1000)}
                parse={parseManwon}
                ticks={["0", "250만", "500만", "750만", "무제한"]}
              />

              {/* 매매가 */}
              <RangeInput
                label="매매가"
                min={0} max={200000} step={1000}
                value={filters.saleRange}
                defaultValue={[0, 200000]}
                onChange={(v) => set("saleRange", v)}
                format={makeFormatManwon(200000)}
                parse={parseManwon}
                ticks={["0", "5억", "10억", "15억", "무제한"]}
              />

              {/* 층수 */}
              {showFloor && (
              <RangeInput
                label="층수"
                min={-2} max={30} step={1}
                value={filters.floorRange}
                defaultValue={[-2, 30]}
                onChange={(v) => set("floorRange", v)}
                format={makeFormatFloor(-2, 30)}
                parse={(s) => { const n = parseInt(s); return isNaN(n) ? null : n; }}
                ticks={["-2층", "0층", "10층", "20층", "무제한"]}
                unit="층"
              />
              )}

              {/* 면적 */}
              <RangeInput
                label="면적 (평)"
                min={0} max={200} step={5}
                value={filters.areaRange}
                defaultValue={[0, 200]}
                onChange={(v) => set("areaRange", v)}
                format={makeFormatArea(200)}
                parse={(s) => { const n = parseFloat(s.replace(/[평㎡()]/g, "")); return isNaN(n) ? null : n; }}
                ticks={["0", "50평", "100평", "150평", "무제한"]}
                unit="평"
              />

              {/* 준공년도 */}
              {showBuildYear && (
              <div>
                <SectionLabel>준공년도</SectionLabel>
                <div className="flex flex-wrap gap-1">
                  {BUILD_YEARS.map((v) => {
                    const isAll = v === "전체";
                    const active = isAll ? filters.buildYear.length === 0 : filters.buildYear.includes(v);
                    return (
                      <Chip key={v} active={active} onClick={() => {
                        if (isAll) set("buildYear", []);
                        else set("buildYear", toggleArr(filters.buildYear, v));
                      }}>{v}</Chip>
                    );
                  })}
                </div>
              </div>
              )}

              {/* 건물 옵션 */}
              {showBuildingOptions && (
              <div>
                <SectionLabel>옵션</SectionLabel>
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
              )}

              {/* 방 옵션 */}
              {showBuildingOptions && (
              <div>
                <SectionLabel>방 옵션</SectionLabel>
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
              )}

              {/* 지목 */}
              {showLandFilters && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <SectionLabel>지목</SectionLabel>
                  {filters.landCategory.length > 0 && (
                    <button
                      onClick={() => set("landCategory", [])}
                      className="text-[9px] px-1.5 py-0.5 rounded border transition-colors"
                      style={{ color: "hsl(var(--destructive))", borderColor: "hsl(var(--destructive))", background: "transparent" }}
                    >
                      선택 삭제
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {LAND_CATEGORIES.map((v) => (
                    <Chip
                      key={v}
                      active={filters.landCategory.includes(v)}
                      onClick={() => set("landCategory", toggleArr(filters.landCategory, v))}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
              </div>
              )}

              {/* 용도지역 */}
              {showLandFilters && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <SectionLabel>용도지역</SectionLabel>
                  {filters.zoneType.length > 0 && (
                    <button
                      onClick={() => set("zoneType", [])}
                      className="text-[9px] px-1.5 py-0.5 rounded border transition-colors"
                      style={{ color: "hsl(var(--destructive))", borderColor: "hsl(var(--destructive))", background: "transparent" }}
                    >
                      선택 삭제
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {ZONE_TYPES.map((v) => (
                    <Chip
                      key={v}
                      active={filters.zoneType.includes(v)}
                      onClick={() => set("zoneType", toggleArr(filters.zoneType, v))}
                    >
                      {v}
                    </Chip>
                  ))}
                </div>
              </div>
              )}


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
