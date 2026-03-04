import { MapPin, ChevronRight, ChevronLeft, X, ZoomIn, Phone, KeyRound, CalendarCheck, CalendarPlus, FileText, ExternalLink } from "lucide-react";
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
/* ── MemoNotepad ── 클릭 시 메모장(편집 가능) 팝업 */
interface MemoNotepadProps {
  propId: number;
  memoKey: string; // "building" | "room"
  emoji: string;
  label: string;
  initialText: string;
}
const MemoNotepad = ({ propId, memoKey, emoji, label, initialText }: MemoNotepadProps) => {
  const storageKey = `memo_${propId}_${memoKey}`;
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(() => localStorage.getItem(storageKey) ?? initialText);

  const handleChange = (v: string) => {
    setText(v);
    localStorage.setItem(storageKey, v);
  };

  return (
    <div className="relative flex items-center">
      <button
        type="button"
        title={label}
        onClick={(e) => { e.stopPropagation(); setOpen(v => !v); }}
        className="w-4 h-4 flex items-center justify-center text-[11px] leading-none hover:scale-125 transition-transform select-none flex-shrink-0"
      >
        {emoji}
      </button>
      {open && (
        <>
          {/* 배경 클릭 시 닫기 */}
          <div className="fixed inset-0 z-[8999]" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div
            className="fixed z-[9000] bg-white border border-border rounded-xl shadow-2xl w-[260px]"
            onClick={(e) => e.stopPropagation()}
            style={{
              boxShadow: "0 8px 32px rgba(10,45,110,0.22)",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* 메모장 헤더 */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-primary/5 rounded-t-xl">
              <div className="flex items-center gap-1.5">
                <span className="text-sm leading-none">{emoji}</span>
                <span className="text-[11px] font-bold text-foreground">{label}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                className="w-4 h-4 rounded-full bg-destructive hover:bg-destructive/80 transition-colors flex items-center justify-center"
              >
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
            {/* 메모 입력창 */}
            <div className="p-2.5">
              <textarea
                autoFocus
                value={text}
                onChange={(e) => handleChange(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                placeholder={`${label}를 입력하세요...`}
                rows={5}
                className="w-full text-[11px] text-foreground leading-relaxed resize-none outline-none bg-muted/50 border border-border rounded-lg px-2.5 py-2 placeholder:text-muted-foreground/50 focus:border-primary/40 transition-colors"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-[8px] text-primary/60 font-medium">✓ 자동저장</span>
                <span className="text-[8px] text-muted-foreground">{text.length}자</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

/* ── BuildingRegisterModal ── */
interface BuildingRegisterModalProps {
  address: string;
  onClose: () => void;
}
const BuildingRegisterModal = ({ address, onClose }: BuildingRegisterModalProps) => {
  const url = `https://cloud.eais.go.kr/molit/ru/aapa/RUAAPA01F01.do?srchAddr=${encodeURIComponent(address)}`;
  const [pos, setPos] = useState({ x: window.innerWidth / 2 - 450, y: window.innerHeight / 2 - 350 });
  const draggingModal = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onHeaderMouseDown = (e: React.MouseEvent) => {
    draggingModal.current = true;
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!draggingModal.current) return;
      setPos({ x: ev.clientX - dragOffset.current.x, y: ev.clientY - dragOffset.current.y });
    };
    const onUp = () => {
      draggingModal.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <>
      <div className="fixed inset-0 z-[9990] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-[9991] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ left: pos.x, top: pos.y, width: "min(900px, 92vw)", height: "min(700px, 88vh)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Draggable Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 flex-shrink-0 cursor-grab active:cursor-grabbing select-none"
          onMouseDown={onHeaderMouseDown}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">건물/토지대장 열람</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[400px]">{address}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onMouseDown={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-[11px] font-semibold text-primary"
            >
              <ExternalLink className="w-3 h-3" />
              새 탭에서 열기
            </a>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        {/* iframe */}
        <iframe
          src={url}
          className="flex-1 w-full border-0"
          title="건물/토지대장"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
        {/* Fallback notice */}
        <div className="px-4 py-2 bg-muted/30 border-t border-border flex-shrink-0">
          <p className="text-[10px] text-muted-foreground text-center">
            화면이 표시되지 않으면 <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline font-semibold">여기를 클릭</a>하여 세움터에서 직접 확인하세요.
          </p>
        </div>
      </div>
    </>
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
  topOffset?: number;
}

const MIN_WIDTH = 200;
const MAX_WIDTH = 99999;

const MapSidebar = ({ properties, selectedId, onSelect, topOffset = 0 }: MapSidebarProps) => {
  const defaultWidth = Math.round(window.innerWidth / 3);
  const [collapsed, setCollapsed] = useState(false);
  const [width, setWidth] = useState(defaultWidth);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [buildingRegisterAddr, setBuildingRegisterAddr] = useState<string | null>(null);
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
      {/* Building Register Modal */}
      {buildingRegisterAddr && (
        <BuildingRegisterModal address={buildingRegisterAddr} onClose={() => setBuildingRegisterAddr(null)} />
      )}
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
            marginTop: `${topOffset}px`,
            height: `calc(100% - ${topOffset}px)`,
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
                {[...properties].sort((a, b) => {
                  const isSaleA = a.type?.includes("매매") ? 1 : 0;
                  const isSaleB = b.type?.includes("매매") ? 1 : 0;
                  return isSaleA - isSaleB;
                }).map((prop) => {
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
                          {/* 보증금/월세 — 고정 너비 */}
                          <div className="flex flex-col justify-center px-1.5 gap-1 flex-shrink-0" style={{ width: "80px" }}>
                            <div className="flex items-center gap-1 h-4">
                              <span className="text-[9px] text-muted-foreground whitespace-nowrap w-[26px]">보증금</span>
                              <span className="text-[10px] font-bold text-foreground truncate">{prop.deposit}</span>
                            </div>
                            <div className="flex items-center gap-1 h-4">
                              <span className="text-[9px] text-muted-foreground whitespace-nowrap w-[26px]">월세</span>
                              <span className="text-[11px] font-extrabold text-accent leading-tight truncate">{prop.monthly}</span>
                            </div>
                          </div>
                          {/* 우측: 메모/날짜/비번/옵션 — 4줄 grid 균등, 고정 시작점 */}
                          <div
                            className="border-l border-border/20 flex-1 min-w-0"
                            style={{ display: "grid", gridTemplateRows: "repeat(4, 20px)", padding: "0 6px 0 10px", height: "80px", alignContent: "stretch" }}
                          >
                            {/* 줄1: 메모 이모티콘 */}
                            <div className="flex items-center gap-1 overflow-visible">
                              <MemoNotepad propId={prop.id} memoKey="building" emoji="🏢" label="건물메모" initialText={buildingMemo ?? ""} />
                              <MemoNotepad propId={prop.id} memoKey="room" emoji="🚪" label="방메모" initialText={roomMemo ?? ""} />
                            </div>
                            {/* 줄2: 등록일 / 확인일 — 가로 정렬 */}
                            <div className="flex flex-row items-center gap-2 overflow-hidden">
                              <div className="flex items-center gap-0.5" title="등록일">
                                <CalendarPlus className="w-2 h-2 text-muted-foreground flex-shrink-0" />
                                <span className="text-[8px] text-muted-foreground">{regDate ?? "-"}</span>
                              </div>
                              <div className="flex items-center gap-0.5" title="확인일">
                                <CalendarCheck className="w-2 h-2 text-primary flex-shrink-0" />
                                <span className="text-[8px] text-primary font-semibold">{chkDate ?? "-"}</span>
                              </div>
                            </div>
                            {/* 줄3: 건물비번 / 방비번 */}
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              {buildingPw ? (
                                <div className="flex items-center gap-0.5" title="건물 비밀번호">
                                  <KeyRound className="w-2 h-2 text-muted-foreground flex-shrink-0" />
                                  <span className="text-[8px] text-muted-foreground font-mono">건{buildingPw}</span>
                                </div>
                              ) : <span className="opacity-0 text-[8px]">-</span>}
                              {roomPw ? (
                                <div className="flex items-center gap-0.5" title="방 비밀번호">
                                  <KeyRound className="w-2 h-2 text-accent flex-shrink-0" />
                                  <span className="text-[8px] text-accent font-mono">방{roomPw}</span>
                                </div>
                              ) : null}
                            </div>
                            {/* 줄4: 옵션 아이콘 + 건물/토지대장 버튼 */}
                            <div className="flex items-center gap-0.5 overflow-hidden justify-between">
                              <div className="flex items-center gap-0.5 overflow-hidden flex-1">
                                {prop.options && prop.options.length > 0 ? (
                                  <>
                                    {prop.options.slice(0, 4).map((opt) => (
                                      <span key={opt} title={opt} className="text-[11px] leading-none">{OPTION_ICONS[opt] ?? "•"}</span>
                                    ))}
                                    {prop.options.length > 4 && <span className="text-[8px] text-muted-foreground">+{prop.options.length - 4}</span>}
                                  </>
                                ) : null}
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setBuildingRegisterAddr(prop.address); }}
                                title="건물/토지대장 열람 (세움터)"
                                className="flex items-center gap-0.5 px-1 h-4 rounded bg-primary/10 hover:bg-primary/20 transition-colors flex-shrink-0"
                              >
                                <FileText className="w-2 h-2 text-primary" />
                                <span className="text-[8px] text-primary font-semibold whitespace-nowrap">건물/토지대장</span>
                              </button>
                            </div>
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
          style={{ marginTop: `${topOffset + 32}px` }}
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
