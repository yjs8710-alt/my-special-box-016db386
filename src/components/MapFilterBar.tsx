import { useState } from "react";
import { Search, X, SlidersHorizontal, Hash, MapPin, RotateCcw, Phone } from "lucide-react";
import { Slider } from "@/components/ui/slider";

const TYPES: { label: string; icon: string }[] = [];

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
  depositRange: [number, number]; // 만원 단위, 0~50000
  monthlyRange: [number, number]; // 만원 단위, 0~1000
  floorRange: [number, number];   // 1~30
  areaRange: [number, number];    // 평, 0~200
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


        {/* 매물 유형 칩 */}
        <div
          className="bg-white rounded-xl border border-border px-3 py-2 flex flex-wrap gap-1.5"
          style={{ boxShadow: "0 4px 16px rgba(10,45,110,0.10)" }}
        >
          {CATEGORY_TYPES.map((t) => (
            <button
              key={t.label}
              onClick={() => onTypeChange(t.label)}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all"
              style={
                activeType === t.label
                  ? { background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }
                  : t.group === "매매"
                  ? { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                  : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 상세 필터 패널 */}
        {showFilter && (
          <div
            className="bg-white rounded-xl border border-border flex flex-col overflow-hidden"
            style={{ boxShadow: "0 8px 32px rgba(10,45,110,0.15)", maxHeight: "calc(100vh - 260px)", overflowY: "auto" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-white z-10"
            >
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

              {/* 보증금 슬라이더 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel>보증금</SectionLabel>
                  <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--primary))" }}>
                    {formatManwon(filters.depositRange[0], 50000)} ~ {formatManwon(filters.depositRange[1], 50000)}
                  </span>
                </div>
                <Slider
                  min={0} max={50000} step={500}
                  value={filters.depositRange}
                  onValueChange={(v) => set("depositRange", v as [number, number])}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>0</span><span>1억</span><span>2억</span><span>3억</span><span>무제한</span>
                </div>
              </div>

              {/* 월세 슬라이더 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel>월세</SectionLabel>
                  <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--primary))" }}>
                    {formatManwon(filters.monthlyRange[0], 1000)} ~ {formatManwon(filters.monthlyRange[1], 1000)}
                  </span>
                </div>
                <Slider
                  min={0} max={1000} step={10}
                  value={filters.monthlyRange}
                  onValueChange={(v) => set("monthlyRange", v as [number, number])}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>0</span><span>250만</span><span>500만</span><span>750만</span><span>무제한</span>
                </div>
              </div>

              {/* 층수 슬라이더 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel>층수</SectionLabel>
                  <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--primary))" }}>
                    {formatFloor(filters.floorRange[0], 30)} ~ {formatFloor(filters.floorRange[1], 30)}
                  </span>
                </div>
                <Slider
                  min={1} max={30} step={1}
                  value={filters.floorRange}
                  onValueChange={(v) => set("floorRange", v as [number, number])}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>1층</span><span>8층</span><span>15층</span><span>22층</span><span>30층+</span>
                </div>
              </div>

              {/* 면적 슬라이더 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel>면적 (평)</SectionLabel>
                  <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--primary))" }}>
                    {formatArea(filters.areaRange[0], 200)} ~ {formatArea(filters.areaRange[1], 200)}
                  </span>
                </div>
                <Slider
                  min={0} max={200} step={5}
                  value={filters.areaRange}
                  onValueChange={(v) => set("areaRange", v as [number, number])}
                  className="w-full"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground mt-1">
                  <span>0</span><span>50평</span><span>100평</span><span>150평</span><span>무제한</span>
                </div>
              </div>

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
