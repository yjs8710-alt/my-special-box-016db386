import { MapPin, ChevronRight, ChevronLeft, X, ZoomIn, Phone, KeyRound, CalendarCheck, CalendarPlus } from "lucide-react";
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

/* ── ContactEmojiRow ── */
interface ContactEmojiRowProps {
  propId: number;
  type: "owner" | "manager";
  number: string | null;
}

const ContactEmojiRow = ({ propId, type, number }: ContactEmojiRowProps) => {
  const emoji = type === "owner" ? "🏠" : "👤";
  const label = type === "owner" ? "건물주" : "관리인";
  const [revealed, setRevealed] = useState(() => !!number && hasRevealedToday(propId, type));
  const [showPopup, setShowPopup] = useState(false);

  if (!number) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center border-b border-border/20 last:border-b-0 opacity-20 select-none">
        <span className="text-sm leading-none">{emoji}</span>
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!revealed) { markRevealed(propId, type); setRevealed(true); }
    setShowPopup(v => !v);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center border-b border-border/20 last:border-b-0 relative">
      <button
        type="button"
        onClick={handleClick}
        title={label}
        className="flex flex-col items-center justify-center w-full h-full hover:bg-primary/10 transition-colors"
      >
        <span className="text-sm leading-none">{emoji}</span>
        <span className="text-[7px] text-muted-foreground mt-0.5 leading-none">{label}</span>
      </button>
      {showPopup && (
        <div
          className="absolute left-full top-1/2 -translate-y-1/2 ml-1 z-[9000] bg-white border border-border rounded-lg shadow-xl px-2 py-1.5 flex items-center gap-1.5 whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          <Phone className="w-3 h-3 text-primary flex-shrink-0" />
          <span className="text-[9px] text-muted-foreground font-semibold">{label}</span>
          <a href={`tel:${number}`} className="text-[11px] font-bold text-primary hover:underline">{number}</a>
          <button onClick={(e) => { e.stopPropagation(); setShowPopup(false); }} className="text-muted-foreground hover:text-foreground ml-0.5 text-xs leading-none">✕</button>
        </div>
      )}
    </div>
  );
};

/* ── MemoPopup ── (건물메모 / 방메모 이모티콘 클릭 팝업) */
interface MemoPopupProps {
  emoji: string;
  label: string;
  text: string;
}
const MemoPopup = ({ emoji, label, text }: MemoPopupProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex items-center">
      <button
        type="button"
        title={label}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="text-base leading-none hover:scale-125 transition-transform"
      >
        {emoji}
      </button>
      {open && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-[9000] bg-white border border-border rounded-lg shadow-xl px-2.5 py-2 min-w-[140px] max-w-[220px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-foreground">{label}</span>
            <button onClick={(e) => { e.stopPropagation(); setOpen(false); }} className="text-muted-foreground hover:text-foreground text-xs leading-none ml-2">✕</button>
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug whitespace-pre-wrap">{text}</p>
        </div>
      )}
    </div>
  );
};

/* ── MapSidebar ── */
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
          {/* Drag handle */}
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
              <div className="p-2 flex flex-col gap-1.5">
                {properties.map((prop) => {
                  const buildingMemo = prop.buildingMemo ?? prop.memo;
                  const roomMemo = prop.roomMemo;
                  const buildingPw = prop.buildingPassword ?? prop.password;
                  const roomPw = prop.roomPassword;
                  const regDate = prop.registeredDate;
                  const chkDate = prop.checkedDate;

                  return (
                    <button
                      key={prop.id}
                      onClick={() => onSelect(prop.id)}
                      className={`w-full text-left transition-all group rounded-xl overflow-hidden bg-white ${
                        selectedId === prop.id
                          ? "ring-2 ring-primary shadow-lg"
                          : "shadow-sm hover:shadow-md hover:ring-1 hover:ring-primary/30"
                      }`}
                    >
                      {/* Row 1: main info */}
                      <div className="flex items-stretch gap-0 h-20">
                        {/* Thumbnail + 연락처 이모티콘 */}
                        <div className="flex-shrink-0 flex flex-row items-stretch">
                          <div className="w-20 h-20 overflow-hidden relative group/thumb flex-shrink-0">
                            <img
                              src={prop.image}
                              alt={prop.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <span className={`absolute top-1 left-1 text-[8px] font-bold px-1 py-0.5 rounded shadow ${TYPE_BG[prop.type] ?? "bg-primary/10 text-primary"}`}>
                              {prop.type}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); setLightboxSrc(prop.image); }}
                              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/30 transition-colors"
                            >
                              <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow-lg" />
                            </button>
                          </div>
                          {/* 건물주 / 관리인 이모티콘 */}
                          <div className="w-[38px] flex flex-col border-l border-border/30">
                            <ContactEmojiRow propId={prop.id} type="owner" number={prop.contactOwner ?? null} />
                            <ContactEmojiRow propId={prop.id} type="manager" number={prop.contactManager ?? prop.contact ?? null} />
                          </div>
                        </div>

                        {/* 건물명 + 주소 */}
                        <div className="w-[130px] flex-shrink-0 flex flex-col justify-center px-2 gap-0.5 border-l border-border/30 min-w-0">
                          <div className="flex items-center gap-1 flex-wrap min-w-0">
                            <p className="text-[11px] font-bold text-foreground truncate leading-tight">{prop.buildingName ?? prop.title}</p>
                            {prop.roomType && <span className="text-[9px] text-primary font-semibold bg-primary/10 px-1 rounded flex-shrink-0">{prop.roomType}</span>}
                            {prop.unitNumber && <span className="text-[9px] text-accent font-semibold bg-accent/10 px-1 rounded flex-shrink-0">{prop.unitNumber}</span>}
                          </div>
                          <p className="text-[9px] text-muted-foreground truncate">{prop.address}</p>
                          <div className="flex items-center gap-1 flex-wrap">
                            <span className="text-[9px] text-muted-foreground">{prop.floor}</span>
                            <span className="text-[9px] text-muted-foreground">{prop.area}</span>
                          </div>
                        </div>

                        {/* 가격 + 우측 정보 */}
                        <div className="flex-1 flex flex-row items-stretch border-l border-border/30 min-w-0">
                          {/* 보증금/월세 */}
                          <div className="flex flex-col justify-center px-1.5 gap-0.5 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-muted-foreground whitespace-nowrap">보증금</span>
                              <span className="text-[10px] font-bold text-foreground truncate">{prop.deposit}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[9px] text-muted-foreground whitespace-nowrap">월세</span>
                              <span className="text-[11px] font-extrabold text-accent leading-tight truncate">{prop.monthly}</span>
                            </div>
                          </div>
                          {/* 우측: 메모/날짜/비번/옵션 */}
                          <div className="flex flex-col justify-center gap-0.5 px-1 border-l border-border/20 min-w-0 flex-1">
                            {/* 메모 이모티콘 */}
                            {(buildingMemo || roomMemo) && (
                              <div className="flex items-center gap-1">
                                {buildingMemo && <MemoPopup emoji="🏢" label="건물메모" text={buildingMemo} />}
                                {roomMemo && <MemoPopup emoji="🚪" label="방메모" text={roomMemo} />}
                              </div>
                            )}
                            {/* 등록일 / 확인일 */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {regDate && (
                                <div className="flex items-center gap-0.5" title="등록일">
                                  <CalendarPlus className="w-2 h-2 text-muted-foreground flex-shrink-0" />
                                  <span className="text-[8px] text-muted-foreground">{regDate}</span>
                                </div>
                              )}
                              {chkDate && (
                                <div className="flex items-center gap-0.5" title="확인일">
                                  <CalendarCheck className="w-2 h-2 text-primary flex-shrink-0" />
                                  <span className="text-[8px] text-primary font-semibold">{chkDate}</span>
                                </div>
                              )}
                            </div>
                            {/* 건물비번 / 방비번 */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {buildingPw && (
                                <div className="flex items-center gap-0.5" title="건물 비밀번호">
                                  <KeyRound className="w-2 h-2 text-muted-foreground flex-shrink-0" />
                                  <span className="text-[8px] text-muted-foreground font-mono">건{buildingPw}</span>
                                </div>
                              )}
                              {roomPw && (
                                <div className="flex items-center gap-0.5" title="방 비밀번호">
                                  <KeyRound className="w-2 h-2 text-accent flex-shrink-0" />
                                  <span className="text-[8px] text-accent font-mono">방{roomPw}</span>
                                </div>
                              )}
                            </div>
                            {/* 옵션 아이콘 */}
                            {prop.options && prop.options.length > 0 && (
                              <div className="flex items-center gap-0.5 flex-wrap">
                                {prop.options.slice(0, 6).map((opt) => (
                                  <span key={opt} title={opt} className="text-[11px] leading-none">{OPTION_ICONS[opt] ?? "•"}</span>
                                ))}
                                {prop.options.length > 6 && <span className="text-[8px] text-muted-foreground">+{prop.options.length - 6}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
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
