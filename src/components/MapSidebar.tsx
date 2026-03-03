import { MapPin, Phone, ChevronRight, ChevronLeft, Eye, Building2, CalendarCheck, KeyRound, StickyNote, Home, GripVertical, X, ZoomIn } from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { MapProperty } from "@/data/mapProperties";

const TYPE_BG: Record<string, string> = {
  "상가": "bg-primary/10 text-primary",
  "사무실": "bg-purple-50 text-purple-700",
  "식당·카페": "bg-orange-50 text-accent",
  "공장·창고": "bg-green-50 text-green-700",
  "병원·학원": "bg-red-50 text-red-700",
};

const OPTION_ICONS: Record<string, string> = {
  "냉장고": "🧊", "세탁기": "🫧", "드럼세탁기": "🌀", "건조기": "💨",
  "스타일러": "👔", "TV": "📺", "에어컨": "❄️", "가스레인지": "🔥",
  "인덕션": "⚡", "전자레인지": "📡", "침대": "🛏", "책상": "🪑",
  "옷장": "🚪", "전자키": "🔑", "주차": "🅿️",
};

/* Daily-limit helpers */
const today = () => new Date().toISOString().slice(0, 10);
const revealKey = (id: number, type: string) => `contact_reveal_${id}_${type}`;
const hasRevealedToday = (id: number, type: string) => localStorage.getItem(revealKey(id, type)) === today();
const markRevealed = (id: number, type: string) => localStorage.setItem(revealKey(id, type), today());

interface ContactRowProps {
  propId: number;
  type: "owner" | "manager";
  number: string;
}

const ContactRow = ({ propId, type, number }: ContactRowProps) => {
  const label = type === "owner" ? "건물주" : "관리인";
  const [revealed, setRevealed] = useState(() => hasRevealedToday(propId, type));

  const handleReveal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (revealed) return;
    markRevealed(propId, type);
    setRevealed(true);
  }, [revealed, propId, type]);

  return (
    <div className="flex items-center justify-between gap-1">
      <div className="flex items-center gap-1">
        <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
        <span className="text-[13px] font-semibold text-muted-foreground">{label}</span>
      </div>
      {revealed ? (
        <a
          href={`tel:${number}`}
          onClick={(e) => e.stopPropagation()}
          className="text-sm font-bold text-primary hover:underline"
        >
          {number}
        </a>
      ) : (
        <button
          type="button"
          onClick={handleReveal}
          className="flex items-center gap-1 text-[12px] font-semibold text-muted-foreground bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border rounded-lg px-2 py-0.5 transition-all"
        >
          <Eye className="w-3.5 h-3.5" />
          번호 보기
        </button>
      )}
    </div>
  );
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

const MIN_WIDTH = 200;
const MAX_WIDTH = 99999;

const MapSidebar = ({ properties, selectedId, onSelect }: MapSidebarProps) => {
  const defaultWidth = Math.round(window.innerWidth / 3);
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(defaultWidth);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(defaultWidth);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      // sidebar is on the right, dragging left = expand
      const delta = startX.current - ev.clientX;
      const newW = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(newW);
    };
    const onUp = () => {
      dragging.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [width]);

  return (
    <>
    {/* Lightbox */}
    {lightboxSrc && (
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={() => setLightboxSrc(null)}
      >
        <button
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
          onClick={() => setLightboxSrc(null)}
        >
          <X className="w-5 h-5 text-white" />
        </button>
        <img
          src={lightboxSrc}
          alt="매물 사진 확대"
          className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
    <div className="absolute right-0 top-0 bottom-0 z-[900] flex flex-row-reverse pointer-events-none">
      {/* Panel */}
      <aside
        className={`pointer-events-auto bg-white border-l border-border flex flex-col transition-[opacity] duration-300 ${
          collapsed ? "w-0 overflow-hidden opacity-0" : "opacity-100"
        }`}
        style={{
          width: collapsed ? 0 : width,
          marginTop: "106px",
          height: "calc(100% - 106px)",
          boxShadow: "-4px 0 24px rgba(10,45,110,0.12)",
        }}
      >
        {/* Drag handle — wider, always visible */}
        {!collapsed && (
          <div
            onMouseDown={onMouseDown}
            className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-10 group flex items-center justify-center"
            title="드래그하여 너비 조절"
          >
            <div className="w-1 h-12 rounded-full bg-border group-hover:bg-primary transition-colors" />
          </div>
        )}

        {/* Header */}
        <div
          className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0"
          style={{ background: "linear-gradient(to right, hsl(var(--primary)/0.04), hsl(var(--primary)/0.08))" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full shadow-sm">
              {properties.length}
            </span>
            <span className="text-xs text-muted-foreground font-semibold">개 매물</span>
          </div>
          <span className="text-[10px] text-muted-foreground">◀ 좌측 가장자리 드래그로 크기 조절</span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin bg-muted/20">
          {properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <MapPin className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">검색 결과가 없습니다</p>
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
                  {/* Horizontal card */}
                  <div className="flex items-stretch gap-0 h-40">
                    {/* Thumbnail */}
                    <div className="w-28 h-40 flex-shrink-0 overflow-hidden relative group/thumb">
                      <img src={prop.image} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <span className={`absolute top-1.5 left-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded shadow ${TYPE_BG[prop.type] ?? "bg-primary/10 text-primary"}`}>{prop.type}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setLightboxSrc(prop.image); }}
                        className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/30 transition-colors"
                      >
                        <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow-lg" />
                      </button>
                    </div>

                    {/* 건물명 + 호수 + 주소 */}
                    <div className="w-[200px] flex-shrink-0 flex flex-col justify-center px-3 gap-1 border-l border-border/30 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate leading-tight">{prop.buildingName ?? prop.title}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {prop.unitNumber && <span className="text-[12px] text-primary font-semibold bg-primary/10 px-1 rounded">{prop.unitNumber}</span>}
                        {prop.roomType && <span className="text-[12px] text-muted-foreground">{prop.roomType}</span>}
                      </div>
                      <p className="text-[12px] text-muted-foreground truncate">{prop.address}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[12px] text-muted-foreground">{prop.buildYear}</span>
                        <span className="text-[12px] text-muted-foreground">{prop.floor}</span>
                        <span className="text-[12px] text-muted-foreground">{prop.area}</span>
                      </div>
                    </div>

                    {/* 가격 */}
                    <div className="w-[130px] flex-shrink-0 flex flex-col justify-center px-3 gap-1 border-l border-border/30">
                      <p className="text-[12px] text-muted-foreground">보증금</p>
                      <p className="text-sm font-bold text-foreground truncate">{prop.deposit}</p>
                      <p className="text-[12px] text-muted-foreground mt-1">월세</p>
                      <p className="text-base font-extrabold text-accent leading-tight">{prop.monthly}</p>
                    </div>

                    {/* 옵션 */}
                    {prop.options && prop.options.length > 0 && (
                      <div className="w-[72px] flex-shrink-0 flex items-start flex-wrap gap-0.5 px-2 pt-3 border-l border-border/30">
                        {prop.options.slice(0, 9).map((opt) => (
                          <span key={opt} title={opt} className="text-base leading-none">{OPTION_ICONS[opt] ?? "•"}</span>
                        ))}
                        {prop.options.length > 9 && <span className="text-[10px] text-muted-foreground">+{prop.options.length - 9}</span>}
                      </div>
                    )}

                    {/* 비번·날짜·메모 */}
                    <div className="w-[120px] flex-shrink-0 flex flex-col justify-center gap-1.5 px-2 border-l border-border/30 min-w-0">
                      {prop.password && (
                        <div className="flex items-center gap-1">
                          <KeyRound className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-[12px] text-muted-foreground font-mono truncate">{prop.password}</span>
                        </div>
                      )}
                      {prop.checkedDate && (
                        <div className="flex items-center gap-1">
                          <CalendarCheck className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-[12px] text-muted-foreground truncate">{prop.checkedDate}</span>
                        </div>
                      )}
                      {prop.memo && (
                        <div className="flex items-start gap-1">
                          <StickyNote className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-[12px] text-muted-foreground line-clamp-2">{prop.memo}</span>
                        </div>
                      )}
                    </div>

                    {/* 연락처 */}
                    <div className="flex-1 min-w-[140px] flex flex-col justify-center gap-2 px-2 border-l border-border/30 min-w-0">
                      {prop.contactOwner && <ContactRow propId={prop.id} type="owner" number={prop.contactOwner} />}
                      {prop.contactManager && <ContactRow propId={prop.id} type="manager" number={prop.contactManager} />}
                      {!prop.contactOwner && !prop.contactManager && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="text-sm font-bold text-primary truncate">{prop.contact}</span>
                        </div>
                      )}
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
    </>
  );
};

export default MapSidebar;
