import { MapPin, ChevronRight, ChevronLeft, X, ZoomIn, Phone, KeyRound, FileText, ExternalLink, CheckCircle, AlertCircle, Camera, ClipboardList, Send, Heart, Printer, Building2, Pencil, Upload, Trash2, Dog, Droplet, Tv, Cctv, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useCallback, useRef, useEffect } from "react";
import { MapProperty } from "@/data/mapProperties";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminPropertyFormModal from "@/components/AdminPropertyFormModal";

/* ── LightboxModal: 여러 장 사진 좌우 탐색 ── */
function LightboxModal({ images, startIdx, onClose }: { images: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIdx);
  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-colors z-10">
        <X className="w-5 h-5 text-white" />
      </button>
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm z-10">
        {idx + 1} / {images.length}
      </div>
      <div className="relative w-full h-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* 슬라이드 트랙 */}
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${idx * 100}vw)`, width: `${images.length * 100}vw` }}
        >
          {images.map((src, i) => (
            <div key={i} className="flex-shrink-0 h-full flex items-center justify-center px-16" style={{ width: "100vw" }}>
              <img src={src} alt={`사진 ${i + 1}`} className="max-w-full max-h-full object-contain rounded-lg select-none" draggable={false} />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <>
            <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center backdrop-blur-sm transition-colors">
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center backdrop-blur-sm transition-colors">
              <ChevronRight className="w-6 h-6 text-white" />
            </button>
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 z-10" onClick={(e) => e.stopPropagation()}>
          {images.map((src, i) => (
            <button key={i} onClick={() => setIdx(i)} className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all" style={{ borderColor: i === idx ? "hsl(var(--primary))" : "transparent", opacity: i === idx ? 1 : 0.5 }}>
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


// 주소에서 동+번지수만 추출 (예: "서울시 강남구 역삼동 123-45" → "역삼동 123-45")
const shortAddress = (addr: string) => {
  const match = addr.match(/([가-힣]+동)\s*([\d\-]+)?/);
  if (match) return match[2] ? `${match[1]} ${match[2]}` : match[1];
  return addr;
};

const TYPE_BG: Record<string, string> = {
  "상가": "bg-primary/10 text-primary",
  "사무실": "bg-purple-50 text-purple-700",
  "식당·카페": "bg-orange-50 text-accent",
  "공장·창고": "bg-green-50 text-green-700",
  "병원·학원": "bg-red-50 text-red-700",
};

/* 옵션 SVG 아이콘 컴포넌트 */
const OptionSvgIcon = ({ name, size = 11 }: { name: string; size?: number }) => {
  const s = size;
  const icons: Record<string, JSX.Element> = {
    "냉장고":   <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/><line x1="5" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="1.8"/><line x1="10" y1="5.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><line x1="10" y1="13" x2="10" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    "세탁기":   <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="14" r="4.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="8" cy="5.5" r="1" fill="currentColor"/><circle cx="12" cy="5.5" r="1" fill="currentColor"/></svg>,
    "드럼세탁기":<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="13" r="5" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.5"/></svg>,
    "건조기":   <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="2" width="18" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 12 Q12 8 15 12 Q12 16 9 12Z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>,
    "스타일러": <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 8 Q12 6 16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/><path d="M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    "TV":       <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 19 L7 22M15 19 L17 22M7 22 h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    "에어컨":   <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M6 17 Q9 14 12 17 Q15 14 18 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/><circle cx="8" cy="9" r="1" fill="currentColor"/></svg>,
    "가스레인지":<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="8" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/><circle cx="16" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
    "인덕션":   <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="8" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5"/><circle cx="16" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5"/></svg>,
    "전자레인지":<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8"/><rect x="5" y="8" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.4"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/></svg>,
    "침대":     <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M2 18V12C2 10.9 2.9 10 4 10H20C21.1 10 22 10.9 22 12V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M2 18H22M3 10V7M21 10V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><rect x="6" y="7" width="5" height="3" rx="1" stroke="currentColor" strokeWidth="1.4"/></svg>,
    "책상":     <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 8H21V10H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M5 10V18M19 10V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    "옷장":     <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.8"/><line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5"/><line x1="9.5" y1="12" x2="11" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="13" y1="12" x2="14.5" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    "전자키":   <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 8V6a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="12" cy="14.5" r="1.5" fill="currentColor"/></svg>,
    "인터넷":   <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><path d="M12 3 Q8 12 12 21" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M12 3 Q16 12 12 21" stroke="currentColor" strokeWidth="1.5" fill="none"/><path d="M3 12 h18" stroke="currentColor" strokeWidth="1.5"/></svg>,
    "주차":     <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M9 17V8h4a3 3 0 0 1 0 6H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    "애완동물가능": <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="4.5" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="9.5" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="14.5" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.5"/><circle cx="19.5" cy="9" r="2" stroke="currentColor" strokeWidth="1.5"/><path d="M12 12 C7 12 5 16 5 19 Q8 22 12 22 Q16 22 19 19 C19 16 17 12 12 12Z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>,
    "애완동물불가": <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/><line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>,
  };
  return icons[name] ?? <span className="text-[10px] leading-none">{name.slice(0, 1)}</span>;
};

const OPTION_ICONS: Record<string, string> = {
  "냉장고": "냉장고", "세탁기": "세탁기", "드럼세탁기": "드럼세탁기", "건조기": "건조기",
  "스타일러": "스타일러", "TV": "TV", "에어컨": "에어컨", "가스레인지": "가스레인지",
  "인덕션": "인덕션", "전자레인지": "전자레인지", "침대": "침대", "책상": "책상",
  "옷장": "옷장", "전자키": "전자키", "인터넷": "인터넷", "주차": "주차",
  "애완동물가능": "애완동물가능", "애완동물불가": "애완동물불가",
};

/* Daily-limit helpers */
const today = () => new Date().toISOString().slice(0, 10);
const revealKey = (id: number, type: string) => `contact_reveal_${id}_${type}`;
const hasRevealedToday = (id: number, type: string) => localStorage.getItem(revealKey(id, type)) === today();
const markRevealed = (id: number, type: string) => localStorage.setItem(revealKey(id, type), today());

/* ── ContactEmojiRow ── */
interface ContactEmojiRowProps {
  propId: number;
  type: "owner" | "manager" | "tenant" | "broker";
  number: string | null;
}

/* 카카오 스타일 SVG 아이콘 */
const ContactIcon = ({ type, active }: { type: string; active?: boolean }) => {
  const color = active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))";
  if (type === "owner") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V10.5Z" fill={color} />
    </svg>
  );
  if (type === "manager") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" fill={color} />
      <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
  if (type === "tenant") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="7" r="3.5" fill={color} />
      <path d="M5 20C5 16.134 8.134 13 12 13C15.866 13 19 16.134 19 20H5Z" fill={color} />
      <path d="M18 9L20 11L23 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (type === "broker") return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="16" rx="2.5" fill={color} />
      <path d="M9 9H15M9 12H13" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 16L16 18L20 14" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return null;
};

const ContactEmojiRow = ({ propId, type, number }: ContactEmojiRowProps) => {
  const label = type === "owner" ? "소유주" : type === "tenant" ? "세입자" : type === "broker" ? "부동산" : "관리인";
  const [revealed, setRevealed] = useState(() => !!number && hasRevealedToday(propId, type));
  const [showPopup, setShowPopup] = useState(false);

  const typeColor: Record<string, string> = {
    owner: "hsl(var(--primary))",
    manager: "hsl(217 91% 60%)",
    tenant: "hsl(142 71% 45%)",
    broker: "hsl(25 95% 53%)",
  };

  if (!number) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center border-b border-border/20 last:border-b-0 opacity-25 select-none">
        <ContactIcon type={type} />
        <span className="text-[6px] text-muted-foreground mt-0.5 leading-none">{label}</span>
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
        className="flex flex-col items-center justify-center w-full h-full rounded transition-colors hover:bg-primary/10 group"
      >
        <span className="flex items-center justify-center w-5 h-5 rounded-full transition-all group-hover:scale-110"
          style={{ background: `${typeColor[type]}18` }}>
          <ContactIcon type={type} active />
        </span>
        <span className="text-[6px] mt-0.5 leading-none font-semibold" style={{ color: typeColor[type] }}>{label}</span>
      </button>
      {showPopup && (
        <div
          className="absolute left-full top-1/2 -translate-y-1/2 ml-1 z-[9000] bg-white border border-border rounded-xl shadow-xl px-3 py-2 flex items-center gap-2 whitespace-nowrap"
          style={{ boxShadow: "0 4px 20px hsl(var(--primary)/0.15)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0" style={{ background: `${typeColor[type]}20` }}>
            <ContactIcon type={type} active />
          </span>
          <span className="text-[9px] font-bold" style={{ color: typeColor[type] }}>{label}</span>
          <a href={`tel:${number}`} className="text-[12px] font-extrabold text-foreground hover:text-primary transition-colors tracking-tight">{number}</a>
          <button onClick={(e) => { e.stopPropagation(); setShowPopup(false); }} className="ml-0.5 w-4 h-4 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors">
            <X className="w-2.5 h-2.5 text-muted-foreground" />
          </button>
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
  icon: React.ReactNode;
  label: string;
  initialText: string;
}
const MemoNotepad = ({ propId, memoKey, icon, label, initialText }: MemoNotepadProps) => {
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
        className="w-[18px] h-[18px] flex items-center justify-center hover:scale-125 transition-transform select-none flex-shrink-0 rounded"
        style={{ background: "hsl(var(--primary)/0.08)", border: "1px solid hsl(var(--primary)/0.2)" }}
      >
        {icon}
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
                <span className="flex items-center gap-1 text-sm leading-none">{icon}</span>
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
  pos: { x: number; y: number };
  onPosChange: (pos: { x: number; y: number }) => void;
  /** 커스텀 URL (정부24, 토지이음 등). 없으면 세움터 주소검색 URL 사용 */
  customUrl?: string;
  /** 팝업 제목 */
  title?: string;
}
const BuildingRegisterModal = ({ address, onClose, pos, onPosChange, customUrl, title }: BuildingRegisterModalProps) => {
  const url = customUrl ?? `https://cloud.eais.go.kr/molit/ru/aapa/RUAAPA01F01.do?srchAddr=${encodeURIComponent(address)}`;
  const [isDragging, setIsDragging] = useState(false);
  const draggingModal = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onHeaderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    draggingModal.current = true;
    setIsDragging(true);
    dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    const onMove = (ev: MouseEvent) => {
      if (!draggingModal.current) return;
      onPosChange({ x: ev.clientX - dragOffset.current.x, y: ev.clientY - dragOffset.current.y });
    };
    const onUp = () => {
      draggingModal.current = false;
      setIsDragging(false);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <>
      <div className="fixed inset-0 z-[10050] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed z-[10051] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
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
              <p className="text-sm font-bold text-foreground">{title ?? "건물/토지대장 열람"}</p>
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
          {/* iframe - 드래그 중 마우스 이벤트 차단용 오버레이 포함 */}
          <div className="flex-1 relative min-h-0">
            {isDragging && <div className="absolute inset-0 z-10" />}
            <iframe
              src={url}
              className="w-full h-full border-0"
              title="건물/토지대장"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </div>
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

/* ── ErrorReportModal ── */
const ERROR_CATEGORIES = ["정보 오류", "사진 오류", "가격 오류", "연락처 오류", "이미 거래완료", "기타"];

interface ErrorReportModalProps { prop: MapProperty; onClose: () => void; }
const ErrorReportModal = ({ prop, onClose }: ErrorReportModalProps) => {
  const [category, setCategory] = useState(ERROR_CATEGORIES[0]);
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const ADMIN_EMAIL = "admin@yourdomain.com"; // 관리자 이메일로 변경하세요

  const handleSend = () => {
    if (!text.trim()) return;

    // 로컬 저장 (오류 이력)
    const key = `error_reports`;
    const prev = JSON.parse(localStorage.getItem(key) ?? "[]");
    const report = {
      id: Date.now(),
      propId: prop.id,
      address: prop.address,
      category,
      text,
      date: new Date().toLocaleString("ko-KR"),
    };
    localStorage.setItem(key, JSON.stringify([report, ...prev]));

    // 관리자 이메일 전송 (mailto)
    const subject = encodeURIComponent(`[오류제보] ${category} - ${prop.buildingName ?? prop.title} (${prop.unitNumber ?? ""})`);
    const body = encodeURIComponent(
      `■ 매물 ID: ${prop.id}\n■ 건물명: ${prop.buildingName ?? prop.title}\n■ 주소: ${prop.address}\n■ 호수: ${prop.unitNumber ?? "-"}\n\n■ 오류 유형: ${category}\n\n■ 오류 내용:\n${text}\n\n■ 제보일시: ${report.date}`
    );
    window.location.href = `mailto:${ADMIN_EMAIL}?subject=${subject}&body=${body}`;

    setSent(true);
  };

  return (
    <>
      <div className="fixed inset-0 z-[10050] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10051] bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ width: "min(460px, 92vw)", maxHeight: "88vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border rounded-t-2xl flex-shrink-0"
          style={{ background: "hsl(var(--destructive)/0.06)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--destructive)/0.12)" }}>
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">오류 제보</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[280px]">
                {prop.buildingName ?? prop.title} {prop.unitNumber ?? ""}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {sent ? (
          /* 전송 완료 */
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <p className="text-sm font-bold text-foreground">제보가 접수되었습니다</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              이메일 앱이 열리면 전송을 완료해 주세요.<br />
              제보 내용은 이 기기에도 저장되었습니다.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
            >
              닫기
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* 매물 정보 요약 */}
            <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-[11px] space-y-0.5">
              <p className="font-bold text-foreground">{prop.buildingName ?? prop.title}</p>
              <p className="text-muted-foreground">{prop.address}</p>
              <p className="text-muted-foreground">호수: {prop.unitNumber ?? "-"} · {prop.floor} · {prop.area}</p>
            </div>

            {/* 오류 유형 선택 */}
            <div>
              <p className="text-[11px] font-semibold text-foreground mb-2">오류 유형 선택</p>
              <div className="flex flex-wrap gap-1.5">
                {ERROR_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className="px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all"
                    style={
                      category === cat
                        ? { background: "hsl(var(--destructive))", color: "#fff", borderColor: "hsl(var(--destructive))" }
                        : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 메모장 */}
            <div>
              <p className="text-[11px] font-semibold text-foreground mb-1.5">오류 내용 작성</p>
              <div className="rounded-xl border border-border overflow-hidden" style={{ background: "hsl(var(--muted)/0.3)" }}>
                {/* 메모장 줄 배경 */}
                <div className="relative">
                  <textarea
                    autoFocus
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={`어떤 오류가 있는지 자세히 작성해 주세요.\n예) 월세가 실제와 다릅니다. 실제 월세는 400만원입니다.`}
                    rows={7}
                    className="w-full text-[12px] text-foreground leading-7 resize-none outline-none px-3 pt-2 pb-2 placeholder:text-muted-foreground/40"
                    style={{
                      background: "repeating-linear-gradient(transparent, transparent 27px, hsl(var(--border)) 27px, hsl(var(--border)) 28px)",
                      backgroundPositionY: "2px",
                    }}
                  />
                </div>
                <div className="flex justify-between items-center px-3 py-1.5 border-t border-border bg-muted/20">
                  <span className="text-[9px] text-primary/60 font-medium">✓ 작성 후 관리자에게 전송됩니다</span>
                  <span className="text-[9px] text-muted-foreground">{text.length}자</span>
                </div>
              </div>
            </div>

            {/* 전송 버튼 */}
            <button
              onClick={handleSend}
              disabled={!text.trim()}
              className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "hsl(var(--destructive))", color: "#fff" }}
            >
              <Send className="w-4 h-4" />
              관리자에게 전송
            </button>
          </div>
        )}
      </div>
    </>
  );
};

/* ── PhotoUploadModal ── */
interface PhotoUploadModalProps {
  prop: MapProperty;
  onClose: () => void;
  onImagesUpdated?: (images: string[]) => void;
}

/** 파일을 dataURL로 변환 */
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const PhotoUploadModal = ({ prop, onClose, onImagesUpdated }: PhotoUploadModalProps) => {
  const isDBProperty = !!prop.memo;
  const dbId = prop.memo;
  const storageKey = `photos_${prop.id}`;

  // 이미 저장된 사진
  const [savedPhotos, setSavedPhotos] = useState<string[]>(() => {
    if (isDBProperty) return prop.images ?? (prop.image ? [prop.image] : []);
    try { return JSON.parse(localStorage.getItem(storageKey) ?? "[]"); } catch { return []; }
  });

  // 새로 선택(미리보기)된 파일들 (아직 저장 안 됨)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState("");
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 파일 선택 → 미리보기만 생성
  const handleSelectFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    const previews = await Promise.all(arr.map(readFileAsDataURL));
    setPendingFiles(prev => [...prev, ...arr]);
    setPendingPreviews(prev => [...prev, ...previews]);
    setSaved(false);
  };

  // 대기 사진 제거 (저장 전)
  const removePending = (idx: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));
    setPendingPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // 저장된 사진 제거
  const removeSaved = async (idx: number) => {
    const url = savedPhotos[idx];
    if (isDBProperty) {
      const bucketBase = supabase.storage.from("property-images").getPublicUrl("").data.publicUrl.replace(/\/$/, "");
      const filePath = url.replace(bucketBase + "/", "");
      await supabase.storage.from("property-images").remove([filePath]);
      const next = savedPhotos.filter((_, i) => i !== idx);
      await supabase.from("properties").update({ images: next }).eq("id", dbId);
      setSavedPhotos(next);
      onImagesUpdated?.(next);
    } else {
      const next = savedPhotos.filter((_, i) => i !== idx);
      localStorage.setItem(storageKey, JSON.stringify(next));
      setSavedPhotos(next);
    }
  };

  // ── 저장하기 ──
  const handleSave = async () => {
    if (pendingFiles.length === 0) return;
    setSaving(true);
    setSaved(false);

    if (isDBProperty) {
      const newUrls: string[] = [];
      for (let i = 0; i < pendingFiles.length; i++) {
        setSaveProgress(`저장 중 ${i + 1} / ${pendingFiles.length}…`);
        const file = pendingFiles[i];
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${dbId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from("property-images")
          .upload(path, file, { upsert: false });
        if (!error) {
          const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
          newUrls.push(urlData.publicUrl);
        }
      }
      const merged = [...savedPhotos, ...newUrls];
      const { error: updateErr } = await supabase
        .from("properties")
        .update({ images: merged })
        .eq("id", dbId);
      if (!updateErr) {
        setSavedPhotos(merged);
        onImagesUpdated?.(merged);
        setPendingFiles([]);
        setPendingPreviews([]);
        setSaved(true);
      }
    } else {
      // Static: dataURL을 localStorage에 저장
      const merged = [...savedPhotos, ...pendingPreviews];
      localStorage.setItem(storageKey, JSON.stringify(merged));
      setSavedPhotos(merged);
      setPendingFiles([]);
      setPendingPreviews([]);
      setSaved(true);
    }

    setSaving(false);
    setSaveProgress("");
  };

  const totalCount = savedPhotos.length + pendingPreviews.length;

  return (
    <>
      <div className="fixed inset-0 z-[10050] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10051] bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ width: "min(560px, 94vw)", maxHeight: "88vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border rounded-t-2xl flex-shrink-0" style={{ background: "hsl(var(--primary)/0.05)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary)/0.1)" }}>
              <Camera className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">사진 등록</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[340px]">
                {prop.buildingName ?? prop.title} · {prop.address}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

          {/* 파일 선택 드롭존 */}
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleSelectFiles(e.target.files)} />
          <button
            disabled={saving}
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed rounded-xl py-5 flex flex-col items-center gap-1.5 transition-colors disabled:opacity-50"
            style={{ borderColor: "hsl(var(--primary)/0.3)" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "hsl(var(--primary)/0.6)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "hsl(var(--primary)/0.3)")}
          >
            <Camera className="w-7 h-7" style={{ color: "hsl(var(--primary)/0.5)" }} />
            <span className="text-sm font-semibold text-primary">사진 선택</span>
            <span className="text-[11px] text-muted-foreground">JPG · PNG · WEBP — 여러 장 동시 선택 가능</span>
          </button>

          {/* 새로 선택된 사진 (미리보기, 미저장) */}
          {pendingPreviews.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-foreground">새로 선택한 사진</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "hsl(var(--accent)/0.12)", color: "hsl(var(--accent))" }}>
                  {pendingPreviews.length}장
                </span>
                <span className="text-[10px] text-muted-foreground">— 아직 저장되지 않았습니다</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {pendingPreviews.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border-2" style={{ borderColor: "hsl(var(--accent)/0.4)" }}>
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePending(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <span className="absolute bottom-0 inset-x-0 text-center text-[8px] font-semibold text-white py-0.5" style={{ background: "hsl(var(--accent)/0.7)" }}>미저장</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 이미 저장된 사진 */}
          {savedPhotos.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold text-foreground">저장된 사진</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}>
                  {savedPhotos.length}장
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {savedPhotos.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-border">
                    {idx === 0 && (
                      <span className="absolute top-1 left-1 z-10 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full" style={{ background: "hsl(var(--primary))" }}>대표</span>
                    )}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeSaved(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalCount === 0 && (
            <p className="text-center text-[11px] text-muted-foreground py-4">사진을 선택해 주세요</p>
          )}
        </div>

        {/* 하단 푸터 — 저장 버튼 */}
        <div className="px-4 py-3 border-t border-border flex-shrink-0 flex items-center gap-3">
          <span className="text-[10px] text-muted-foreground flex-1">
            {isDBProperty ? "✓ 서버에 저장됩니다" : "✓ 이 기기에 저장됩니다"}
            {totalCount > 0 && <span className="ml-1 font-semibold text-primary">· 총 {totalCount}장</span>}
          </span>

          {saved && pendingFiles.length === 0 && (
            <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: "hsl(var(--primary))" }}>
              <CheckCircle className="w-3.5 h-3.5" /> 저장 완료
            </span>
          )}

          <button
            onClick={handleSave}
            disabled={pendingFiles.length === 0 || saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: "hsl(var(--primary))", color: "white" }}
          >
            {saving ? (
              <>
                <Upload className="w-4 h-4 animate-bounce" />
                {saveProgress || "저장 중…"}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                사진 저장하기
                {pendingFiles.length > 0 && <span className="ml-0.5 text-white/80">({pendingFiles.length})</span>}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

/* ── LeaseProposalModal ── */
interface LeaseProposalModalProps { prop: MapProperty; allProperties: MapProperty[]; onClose: () => void; }
const LeaseProposalModal = ({ prop, allProperties, onClose }: LeaseProposalModalProps) => {
  const todayStr = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  const handlePrint = () => window.print();

  // 같은 건물(buildingName 또는 title 기준)의 모든 호실
  const buildingKey = prop.buildingName ?? prop.title;
  const sameBuilding = allProperties.filter(
    p => (p.buildingName ?? p.title) === buildingKey
  ).sort((a, b) => (a.unitNumber ?? "").localeCompare(b.unitNumber ?? "", "ko"));

  // 건물 현황은 첫 번째 매물(또는 현재 매물)로
  const base = sameBuilding[0] ?? prop;

  const buildingInfo = [
    ["소재지", base.address],
    ["건물명", base.buildingName ?? base.title],
    ["건축연도", base.buildYear ?? "-"],
    ["총 층수", base.totalFloors ?? "-"],
    ["주차", base.parking ?? "-"],
    ["엘리베이터", base.elevator ? "있음" : "없음"],
    ["관리비", base.manageFee ?? "-"],
    ["입주가능일", base.availableFrom ?? "-"],
    ["담당 중개사", base.agentName ?? "-"],
  ];

  return (
    <>
      <div className="fixed inset-0 z-[10050] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10051] bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ width: "min(680px, 94vw)", maxHeight: "92vh" }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">임대제안서</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="px-2.5 py-1.5 text-[11px] font-bold bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors">🖨️ 인쇄</button>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* 타이틀 */}
          <div className="bg-primary rounded-xl px-6 py-4 text-center">
            <p className="text-base font-extrabold tracking-widest text-primary-foreground">임 대 제 안 서</p>
            <p className="text-[10px] text-primary-foreground/60 mt-0.5">Lease Proposal · {todayStr}</p>
          </div>

          {/* ① 건물 현황 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              <p className="text-[12px] font-extrabold text-foreground">건물 현황</p>
            </div>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-[11px]">
                <tbody>
                  {buildingInfo.map(([label, value], i) => (
                    <tr key={label} className={i % 2 === 0 ? "bg-muted/30" : "bg-white"}>
                      <td className="px-3 py-2 font-semibold text-muted-foreground w-[100px] whitespace-nowrap border-r border-border/40">{label}</td>
                      <td className="px-3 py-2 text-foreground font-medium">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ② 호수별 임대 현황 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-accent rounded-full" />
              <p className="text-[12px] font-extrabold text-foreground">호수별 임대 현황</p>
              <span className="text-[10px] text-muted-foreground ml-1">총 {sameBuilding.length}개 호실</span>
            </div>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="px-3 py-2 text-left font-bold whitespace-nowrap">호수</th>
                    <th className="px-3 py-2 text-left font-bold whitespace-nowrap">유형</th>
                    <th className="px-3 py-2 text-left font-bold whitespace-nowrap">층</th>
                    <th className="px-3 py-2 text-left font-bold whitespace-nowrap">면적</th>
                    <th className="px-3 py-2 text-right font-bold whitespace-nowrap">보증금</th>
                    <th className="px-3 py-2 text-right font-bold whitespace-nowrap">월 임대료</th>
                    <th className="px-3 py-2 text-center font-bold whitespace-nowrap">입주가능</th>
                  </tr>
                </thead>
                <tbody>
                  {sameBuilding.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`border-t border-border/40 ${p.id === prop.id ? "bg-accent/10 font-bold" : i % 2 === 0 ? "bg-white" : "bg-muted/20"}`}
                    >
                      <td className="px-3 py-2 font-semibold text-foreground whitespace-nowrap">
                        {p.unitNumber ?? "-"}
                        {p.id === prop.id && <span className="ml-1 text-[8px] bg-accent text-white px-1 rounded">선택</span>}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{p.type}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{p.floor ?? "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{p.area ?? "-"}</td>
                      <td className="px-3 py-2 text-right text-foreground font-semibold whitespace-nowrap">{p.deposit}</td>
                      <td className="px-3 py-2 text-right text-accent font-extrabold whitespace-nowrap">{p.monthly}</td>
                      <td className="px-3 py-2 text-center text-muted-foreground whitespace-nowrap">{p.availableFrom ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ③ 특이사항 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-muted-foreground/40 rounded-full" />
              <p className="text-[12px] font-extrabold text-foreground">특이사항 / 안내사항</p>
            </div>
            <div className="border border-border rounded-xl p-3 min-h-[56px] bg-muted/20">
              <p className="text-[11px] text-muted-foreground/50">{prop.buildingMemo ?? prop.memo ?? "※ 입력된 내용 없음"}</p>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

/* ── ContactRevealBtn ── 연락처 클릭 시 번호 인라인 표시 */
interface ContactRevealBtnProps {
  propId: number;
  label: string;
  shortLabel: string;
  number: string;
  colorStyle: React.CSSProperties;
  borderStyle: React.CSSProperties;
}
const ContactRevealBtn = ({ propId, label, shortLabel, number, colorStyle, borderStyle }: ContactRevealBtnProps) => {
  const [revealed, setRevealed] = useState(() => hasRevealedToday(propId, label));
  const [showNum, setShowNum] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!revealed) { markRevealed(propId, label); setRevealed(true); }
    setShowNum(v => !v);
  };

  if (showNum) {
    return (
      <a
        href={`tel:${number}`}
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold border whitespace-nowrap flex-shrink-0 transition-colors"
        style={colorStyle}
      >
        <Phone className="w-2.5 h-2.5 flex-shrink-0" />
        {number}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap flex-shrink-0 transition-all hover:opacity-80"
      style={borderStyle}
    >
      {shortLabel}
    </button>
  );
};

/* ── AddressToggleCard ── 매인정보 레이아웃 (이미지 참고 레이아웃) */
interface AddressToggleCardProps {
  prop: MapProperty;
  idx: number;
  buildingMemo: string | undefined;
  roomMemo: string | undefined;
  buildingPw: string | undefined;
  roomPw: string | undefined;
  regDate: string | undefined;
  chkDate: string | undefined;
}
const AddressToggleCard = ({ prop, idx, buildingMemo, roomMemo, buildingPw, roomPw, regDate, chkDate, isAdmin }: AddressToggleCardProps & { isAdmin?: boolean }) => {
  const [checking, setChecking] = useState(false);
  const isChecked = !!chkDate;

  const handleCheckToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!prop.memo) return; // DB 매물만 가능
    if (checking) return;
    setChecking(true);
    const newDate = isChecked ? null : new Date().toISOString().slice(0, 10);
    await supabase.from("properties").update({ checked_date: newDate }).eq("id", prop.memo);
    setChecking(false);
  };
  const [showFullAddr, setShowFullAddr] = useState(false);
  const [showOptPopup, setShowOptPopup] = useState(false);
  const optBadgeRef = useRef<HTMLDivElement>(null);
  const [optPopupStyle, setOptPopupStyle] = useState<React.CSSProperties>({});

  const optHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleOptMouseEnter = () => {
    if (optHoverTimer.current) clearTimeout(optHoverTimer.current);
    if (optBadgeRef.current) {
      const rect = optBadgeRef.current.getBoundingClientRect();
      const popupHeight = 200; // 팝업 예상 최대 높이
      const popupWidth = 200;
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;

      // 오른쪽 공간 확인 (사이드바 우측이 잘릴 수 있음)
      const sidebarRight = rect.left + 360; // 사이드바 대략 너비
      const overflowRight = rect.left + popupWidth > window.innerWidth;

      let leftPos = rect.left;
      if (overflowRight) {
        leftPos = Math.max(8, window.innerWidth - popupWidth - 8);
      }

      if (spaceAbove >= popupHeight || spaceAbove > spaceBelow) {
        // 위쪽에 표시
        setOptPopupStyle({
          position: "fixed",
          top: rect.top - 4,
          left: leftPos,
          transform: "translateY(-100%)",
        });
      } else {
        // 아래쪽에 표시
        setOptPopupStyle({
          position: "fixed",
          top: rect.bottom + 4,
          left: leftPos,
          transform: "none",
        });
      }
    }
    setShowOptPopup(true);
  };

  const handleOptMouseLeave = () => {
    if (optHoverTimer.current) clearTimeout(optHoverTimer.current);
    setShowOptPopup(false);
  };


  // 면적에서 평수만 추출 (예: "49㎡ (15평)" → "15평", "15" → "15평", "99㎡ (30평)" → "30평")
  const pyeong = prop.area?.match(/\((\d+)평\)/) ?? prop.area?.match(/(\d+)\s*평/);
  const rawArea = pyeong ? pyeong[1] + "평" : (prop.area ? prop.area.split(" ")[0] : "");
  const areaShort = rawArea && /^\d+$/.test(rawArea) ? rawArea + "평" : rawArea;
  // floor에서 층 숫자만 (예: "3층" → "3F")
  const floorShort = prop.floor ? prop.floor.replace(/층/g, "F").replace(/지상\s*/g, "") : "";
  // 연락처 버튼 목록
  const contacts: { label: string; short: string; num: string; color: React.CSSProperties; border: React.CSSProperties }[] = [];
  if (prop.contactOwner) contacts.push({
    label: "건물주", short: "건물주",
    num: prop.contactOwner,
    color: { background: "#dcfce7", color: "#15803d", borderColor: "#86efac" },
    border: { background: "transparent", color: "#15803d", borderColor: "#86efac" },
  });
  if (prop.contactManager) contacts.push({
    label: "관리인", short: "관리인",
    num: prop.contactManager,
    color: { background: "#dbeafe", color: "#1d4ed8", borderColor: "#93c5fd" },
    border: { background: "transparent", color: "#1d4ed8", borderColor: "#93c5fd" },
  });
  if (prop.contact) contacts.push({
    label: "부동산",
    short: prop.agentName ? `${prop.agentName.slice(0, 3)}문의` : "부동산",
    num: prop.contact,
    color: { background: "#fff7ed", color: "#c2410c", borderColor: "#fdba74" },
    border: { background: "transparent", color: "#c2410c", borderColor: "#fdba74" },
  });

  return (
    <div className="flex-1 min-w-0 flex flex-col border-l border-border/30 px-2 py-0.5 gap-0.5">

      {/* 1줄: 준YYYY | 건물명 | 주소(토글) | 로드뷰 → 확인/등록 */}
      <div className="flex items-center gap-1 overflow-hidden flex-nowrap min-h-[22px]">
        {prop.buildYear && (
          <span
            className="flex-shrink-0 text-[10px] font-black px-1 py-0.5 whitespace-nowrap"
            style={{ background: "#fff", color: "#111", border: "1.5px solid #111", borderRadius: "2px", letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            준{prop.buildYear.replace(/[^0-9]/g, "").slice(0, 4)}
          </span>
        )}
        <p className="text-[13px] font-extrabold text-foreground truncate leading-none flex-shrink min-w-0">{prop.buildingName ?? prop.title}</p>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowFullAddr(v => !v); }}
          className="text-[12px] font-semibold whitespace-nowrap flex-shrink-0 transition-colors underline decoration-dotted underline-offset-2"
          style={{ color: showFullAddr ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
          title="클릭하면 전체 주소 표시"
        >
          {showFullAddr ? prop.address : shortAddress(prop.address)}
        </button>
        {/* 로드뷰 버튼 */}
        <a
          href={prop.lat && prop.lng
            ? `https://map.kakao.com/link/roadview/${prop.lat},${prop.lng}`
            : `https://map.kakao.com/?q=${encodeURIComponent(prop.address)}&map_type=TYPE_ROADVIEW`}
          target="_blank" rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 px-1 py-0.5 rounded text-[9px] font-bold border transition-colors hover:bg-primary/10 whitespace-nowrap"
          style={{ color: "hsl(var(--primary))", borderColor: "hsl(var(--primary)/0.3)" }}
        >로드뷰</a>
        <span className="flex-1" />
        <MemoNotepad propId={prop.id} memoKey="building" icon={<Building2 className="w-3 h-3 text-primary" strokeWidth={2.5}/>} label="건물메모" initialText={buildingMemo ?? ""} />
        <MemoNotepad propId={prop.id} memoKey="room" icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14"/><path d="M2 20h20"/><path d="M14 12v.01"/></svg>} label="방메모" initialText={roomMemo ?? ""} />
        {/* 관리자 확인 체크박스 — 텍스트 없이 아이콘+D숫자만 */}
        {isAdmin && prop.memo && (() => {
          const daysSince = chkDate
            ? Math.floor((Date.now() - new Date(chkDate).getTime()) / 86400000)
            : null;
          return (
            <button
              type="button"
              title={isChecked ? `확인일: ${chkDate} (${daysSince}일 경과) — 클릭 시 초기화` : "오늘 확인 완료로 표시"}
              onClick={handleCheckToggle}
              disabled={checking}
              className="flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded transition-all hover:scale-105 select-none"
              style={{
                background: isChecked ? "hsl(142 70% 93%)" : "hsl(var(--muted))",
                border: `1.5px solid ${isChecked ? "hsl(142 60% 65%)" : "hsl(var(--border))"}`,
                opacity: checking ? 0.5 : 1,
              }}
            >
              {isChecked ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="hsl(142 60% 35%)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <rect x="1" y="1" width="8" height="8" rx="1.5" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5"/>
                </svg>
              )}
              <span className="text-[10px] font-black whitespace-nowrap tabular-nums" style={{ color: isChecked ? "hsl(142 60% 30%)" : "hsl(var(--muted-foreground))" }}>
                {isChecked ? daysSince : "?"}
              </span>
            </button>
          );
        })()}
        {/* 등록일 */}
        {regDate && (
          <span className="flex-shrink-0 text-[10px] font-bold whitespace-nowrap tabular-nums" style={{ color: "#111" }}>
            {regDate.slice(2).replace(/-/g, ".")}
          </span>
        )}
      </div>

      {/* 2줄: [세부유형 (층) 호수] | 보증금/월세 관리비 몇평 | 옵션 | 비번 */}
      <div className="flex items-center gap-1 overflow-hidden flex-nowrap min-h-[22px]">
        {/* 남향 뱃지 */}
        {prop.note && /남향|북향|동향|서향/.test(prop.note) && (
          <span className="flex-shrink-0 text-[10px] font-bold px-1 py-0.5 rounded whitespace-nowrap"
            style={{ background: "#fff3e0", color: "#e65100", border: "1px solid #ffcc80" }}>
            {prop.note.match(/[남북동서]향/)?.[0]}
          </span>
        )}
        {/* ① 세부유형 + 층 + 호수를 하나의 네모칸에 */}
        {(prop.roomType || floorShort || prop.unitNumber) && (
          <span className="flex-shrink-0 flex items-center gap-0.5 text-[12px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap"
            style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", border: "1.5px solid hsl(var(--primary)/0.35)" }}>
            {prop.roomType && <span>{prop.roomType}</span>}
            {floorShort && <span className="opacity-80">({floorShort})</span>}
            {prop.unitNumber && <span>{prop.unitNumber}</span>}
          </span>
        )}
        {/* 구분선 */}
        {(prop.roomType || floorShort || prop.unitNumber) && (
          <span className="flex-shrink-0 w-px h-3.5 bg-border" />
        )}
        {/* ④ 보증금/월세/관리비/평수 — 텍스트 스타일 (박스 없음) */}
        {(() => {
          const note = prop.note ?? "";
          const wolseMatch = note.match(/월세: 보증금 ([^\n/]+)만원 \/ 월세 ([^\n]+)만원/);
          const halfMatch  = note.match(/반전세: 보증금 ([^\n/]+)만원 \/ 월세 ([^\n]+)만원/);
          const jeonseMatch = note.match(/전세: 보증금 ([^\n]+)만원/);
          const hasMulti = wolseMatch || halfMatch || jeonseMatch;

          if (hasMulti) {
            return (
              <div className="flex items-center gap-1 flex-shrink-0">
                {wolseMatch && (
                  <span className="flex-shrink-0 text-[12px] font-extrabold whitespace-nowrap" style={{ color: "hsl(var(--foreground))" }}>
                    <span style={{ color: "hsl(var(--muted-foreground))" }}>월</span> {wolseMatch[1]}/<span style={{ color: "hsl(var(--accent))" }}>{wolseMatch[2]}</span>
                  </span>
                )}
                {halfMatch && (
                  <span className="flex-shrink-0 text-[12px] font-extrabold whitespace-nowrap" style={{ color: "#1d4ed8" }}>
                    반{halfMatch[1]}/{halfMatch[2]}
                  </span>
                )}
                {jeonseMatch && (
                  <span className="flex-shrink-0 text-[12px] font-extrabold whitespace-nowrap" style={{ color: "#15803d" }}>
                    전{jeonseMatch[1]}
                  </span>
                )}
              </div>
            );
          }

          return (
            <span className="flex-shrink-0 flex items-center gap-0.5 whitespace-nowrap">
              <span className="text-[11px] font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>월</span>
              <span className="text-[12px] font-extrabold" style={{ color: "hsl(var(--foreground))" }}>{prop.deposit}</span>
              <span className="text-[11px]" style={{ color: "hsl(var(--border))" }}>/</span>
              <span className="text-[12px] font-extrabold" style={{ color: "hsl(var(--accent))" }}>{prop.monthly}</span>
              {prop.manageFee && prop.manageFee !== "0" && prop.manageFee !== "-" && (
                <>
                  <span className="text-[11px] mx-0.5" style={{ color: "hsl(var(--border))" }}>/</span>
                  <span className="text-[11px] font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>관</span>
                  <span className="text-[11px] font-extrabold" style={{ color: "hsl(var(--muted-foreground))" }}>{prop.manageFee}</span>
                </>
              )}
              {areaShort && (
                <>
                  <span className="text-[11px] mx-0.5" style={{ color: "hsl(var(--border))" }}>·</span>
                  <span className="text-[11px] font-extrabold" style={{ color: "hsl(25 90% 40%)" }}>{areaShort}</span>
                </>
              )}
            </span>
          );
        })()}
        {/* ⑧ 비번 — flex-1 스페이서 앞에 배치해 잘리지 않도록 */}
        {(buildingPw || roomPw) && (
          <>
            <span className="flex-shrink-0 w-px h-3.5 bg-border" />
            <KeyRound className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(var(--foreground)/0.4)" }} />
            {buildingPw && (
              <div className="relative group/bpw flex-shrink-0">
                <span
                  className="text-[11px] font-extrabold font-mono whitespace-nowrap px-1.5 py-0.5 rounded cursor-default select-none"
                  style={{ background: "hsl(220 25% 93%)", color: "hsl(220 45% 32%)", border: "1.5px solid hsl(220 25% 80%)" }}
                >
                  건 {buildingPw}
                </span>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-[9999] opacity-0 group-hover/bpw:opacity-100 transition-opacity duration-150 whitespace-nowrap">
                  <div className="text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg" style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>
                    🏢 건물 공동현관 비밀번호
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0" style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "4px solid hsl(var(--foreground))" }} />
                  </div>
                </div>
              </div>
            )}
            {roomPw && (
              <div className="relative group/rpw flex-shrink-0">
                <span
                  className="text-[11px] font-extrabold font-mono whitespace-nowrap px-1.5 py-0.5 rounded cursor-default select-none"
                  style={{ background: "hsl(var(--accent)/0.12)", color: "hsl(var(--accent))", border: "1.5px solid hsl(var(--accent)/0.4)" }}
                >
                  방 {roomPw}
                </span>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-[9999] opacity-0 group-hover/rpw:opacity-100 transition-opacity duration-150 whitespace-nowrap">
                  <div className="text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg" style={{ background: "hsl(var(--foreground))", color: "hsl(var(--background))" }}>
                    🚪 방(호실) 도어락 비밀번호
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0" style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "4px solid hsl(var(--foreground))" }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <span className="flex-1" />
        {/* ⑨ 특수 아이콘 옵션 (반려동물/엘리베이터/수도/인터넷/유선TV/CCTV) — 아이콘만 표시 */}
        {(() => {
          type IconBadge = { icon: JSX.Element; title: string; bg: string; color: string; border: string };
          const badges: JSX.Element[] = [];
          const opts = prop.options ?? [];

          // 엘리베이터 (boolean 필드)
          if (prop.elevator) badges.push(
            <span key="elevator" title="엘리베이터" className="flex-shrink-0 flex items-center justify-center w-[24px] h-[24px] rounded select-none"
              style={{ background: "#e0f2fe", color: "#0369a1", border: "1.5px solid #7dd3fc" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M9 10l3-3 3 3M9 14l3 3 3-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          );

          // 옵션 배열 기반 아이콘 맵
          const ICON_MAP: Record<string, IconBadge> = {
            "반려동물가능":  { icon: <Dog size={14} strokeWidth={2}/>,   title: "반려동물 가능", bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
            "애완동물가능":  { icon: <Dog size={14} strokeWidth={2}/>,   title: "반려동물 가능", bg: "#fff7ed", color: "#c2410c", border: "#fdba74" },
            "반려동물불가":  { icon: <Dog size={14} strokeWidth={2}/>,   title: "반려동물 불가", bg: "#fef2f2", color: "#b91c1c", border: "#fca5a5" },
            "애완동물불가":  { icon: <Dog size={14} strokeWidth={2}/>,   title: "반려동물 불가", bg: "#fef2f2", color: "#b91c1c", border: "#fca5a5" },
            "수도":          { icon: <Droplet size={14} strokeWidth={2}/>, title: "수도",       bg: "#eff6ff", color: "#1d4ed8", border: "#93c5fd" },
            "인터넷":        { icon: <span className="text-[11px] font-black italic leading-none">e</span>, title: "인터넷", bg: "#f0fdf4", color: "#15803d", border: "#86efac" },
            "유선TV":        { icon: <Tv size={14} strokeWidth={2}/>,    title: "유선TV",      bg: "#faf5ff", color: "#7e22ce", border: "#d8b4fe" },
            "CCTV":          { icon: <Cctv size={14} strokeWidth={2}/>,  title: "CCTV",        bg: "#f8fafc", color: "#475569", border: "#cbd5e1" },
          };

          // 반려동물 불가는 금지선 오버레이
          const isPetDenied = opts.includes("반려동물불가") || opts.includes("애완동물불가");
          const isPetAllowed = opts.includes("반려동물가능") || opts.includes("애완동물가능");

          if (isPetDenied) {
            badges.push(
              <span key="pet-deny" title="반려동물 불가" className="flex-shrink-0 relative flex items-center justify-center w-[24px] h-[24px] rounded select-none"
                style={{ background: "#fef2f2", color: "#b91c1c", border: "1.5px solid #fca5a5" }}>
                <Dog size={14} strokeWidth={2}/>
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <svg width="18" height="18" viewBox="0 0 14 14"><line x1="2" y1="2" x2="12" y2="12" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round"/></svg>
                </span>
              </span>
            );
          } else if (isPetAllowed) {
            badges.push(
              <span key="pet-ok" title="반려동물 가능" className="flex-shrink-0 flex items-center justify-center w-[24px] h-[24px] rounded select-none"
                style={{ background: "#fff7ed", color: "#c2410c", border: "1.5px solid #fdba74" }}>
                <Dog size={14} strokeWidth={2}/>
              </span>
            );
          }

          const EXTRA_KEYS = ["수도", "인터넷", "유선TV", "CCTV"];
          opts.filter(o => EXTRA_KEYS.includes(o)).forEach(opt => {
            const d = ICON_MAP[opt];
            if (!d) return;
            badges.push(
              <span key={opt} title={d.title} className="flex-shrink-0 flex items-center justify-center w-[24px] h-[24px] rounded select-none"
                style={{ background: d.bg, color: d.color, border: `1.5px solid ${d.border}` }}>
                {d.icon}
              </span>
            );
          });

          return badges;
        })()}
        {/* ⑦-b 옵션 텍스트 배지 — 호버 시 상세 목록 팝업 */}
        {prop.options && prop.options.length > 0 && (() => {
          const FULL_OPT = ["냉장고", "세탁기", "에어컨", "TV", "전자레인지", "인터넷", "가스레인지"];
          const isFull = prop.options!.includes("풀옵션") || FULL_OPT.every(o => prop.options!.includes(o));
          return (
            <div
              ref={optBadgeRef}
              className="relative flex-shrink-0"
              onMouseEnter={handleOptMouseEnter}
              onMouseLeave={handleOptMouseLeave}
              onClick={(e) => e.stopPropagation()}
            >
              {isFull ? (
                <span
                  className="flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap cursor-default select-none"
                  style={{
                    background: "linear-gradient(90deg, hsl(38 95% 88%), hsl(45 100% 82%))",
                    color: "hsl(28 80% 35%)",
                    border: "1.5px solid hsl(38 80% 70%)",
                  }}
                >
                  풀옵션
                </span>
              ) : (
                <span
                  className="text-[10px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap cursor-default select-none"
                  style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground)/0.65)", border: "1.5px solid hsl(var(--border))" }}
                >
                  {`옵션(${prop.options!.length}) ▾`}
                </span>
              )}
              {/* 호버 팝업 — fixed로 overflow:hidden 탈출, 화면 경계 감지 */}
              {showOptPopup && (
                <div
                  className="fixed z-[9999] bg-white border border-border rounded-xl shadow-xl p-2.5"
                  style={{
                    ...optPopupStyle,
                    minWidth: "160px",
                    maxWidth: "220px",
                    boxShadow: "0 4px 20px hsl(var(--primary)/0.15)",
                  }}
                  onMouseEnter={() => setShowOptPopup(true)}
                  onMouseLeave={handleOptMouseLeave}
                >
                  <p className="text-[10px] font-extrabold mb-1.5 pb-1 border-b border-border" style={{ color: "hsl(var(--primary))" }}>
                    {isFull ? "풀옵션 구성" : `옵션 항목 (${prop.options!.length}개)`}
                  </p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {prop.options!.map((opt) => (
                      <span key={opt} className="text-[11px] font-semibold text-foreground whitespace-nowrap">· {opt}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      
      </div>

      {/* 3줄: 특이사항 (description만 표시 — note에는 연락처 저장됨) */}
      {prop.description && (() => {
        const text = prop.description;
        if (!text.trim()) return null;
        return (
          <div className="flex items-start gap-1 min-h-[17px] overflow-hidden">
            <span className="flex-shrink-0 text-[10px] font-extrabold mt-0.5 whitespace-nowrap"
              style={{ color: "hsl(var(--muted-foreground))" }}>특이</span>
            <span className="text-[11px] font-extrabold leading-tight truncate"
              style={{ color: "hsl(var(--foreground))" }}>
              {text.length > 60 ? text.slice(0, 60) + "…" : text}
            </span>
          </div>
        );
      })()}

    </div>
  );
};

/* ── MapSidebar ── */
interface MapSidebarProps {
  properties: MapProperty[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onDeselect?: () => void;
  activeType: string;
  onTypeChange: (type: string) => void;
  query?: string;
  onQueryChange?: (v: string) => void;
  topOffset?: number;
  onDeleteProperties?: (ids: Set<number>) => void;
  /** 핀 클릭 시 해당 주소로 필터링 */
  pinnedAddress?: string | null;
  onClearPin?: () => void;
}

const MIN_WIDTH = 260;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 540;

const MapSidebar = ({ properties, selectedId, onSelect, onDeselect, topOffset = 0, onDeleteProperties, pinnedAddress, onClearPin }: MapSidebarProps) => {
  const { isAdmin } = useAdminAuth();
  const [adminEditProp, setAdminEditProp] = useState<MapProperty | null>(null);
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem("sidebar_width");
    const parsed = saved ? Number(saved) : 0;
    // 저장값이 없거나 최소보다 작으면 새 기본값 사용
    return parsed >= MIN_WIDTH ? Math.min(MAX_WIDTH, parsed) : DEFAULT_WIDTH;
  });
  const [collapsed, setCollapsed] = useState(false);
  const [lightbox, setLightbox] = useState<{ images: string[]; idx: number } | null>(null);
  const [buildingRegisterAddr, setBuildingRegisterAddr] = useState<string | null>(null);
  const [photoUploadProp, setPhotoUploadProp] = useState<MapProperty | null>(null);
  const [leaseProposalProp, setLeaseProposalProp] = useState<MapProperty | null>(null);
  const [errorReportProp, setErrorReportProp] = useState<MapProperty | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [modalPos, setModalPos] = useState({ x: 0, y: 97 });
  // 상단 바 외부링크 팝업 (등기소/정부24/토지이음 등)
  const [externalModal, setExternalModal] = useState<{ url: string; title: string } | null>(null);
  const [externalModalPos, setExternalModalPos] = useState({ x: 0, y: 97 });
  const getModalInitPos = useCallback(() => {
    // x: 파란 드래그 라인(사이드바 우측 끝) 정확히 맞춤
    const x = width;
    // y: 헤더(56px) + 주거유형 탭바(41px) = 97px → 탭바 바로 아래
    const y = 97;
    return { x, y };
  }, [width]);
  const openExternalModal = useCallback((url: string, title: string) => {
    const pos = { x: width, y: 97 };
    setExternalModalPos(pos);
    setExternalModal({ url, title });
  }, [width]);

  // 핀 클릭 필터: pinnedAddress가 있으면 해당 주소(또는 동일 건물명) 매물만 표시
  const displayProperties = pinnedAddress
    ? properties.filter(p => p.address === pinnedAddress || p.buildingName === pinnedAddress)
    : properties;

  // 선택 인쇄: 체크된 매물만, 상세 인쇄: 모든 매물 상세
  const handleSelectPrint = () => {
    const list = properties.filter(p => checkedIds.has(p.id));
    if (list.length === 0) { alert("인쇄할 매물을 선택해주세요."); return; }
    const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
    const rows = list.map((p, i) =>
      `<tr>
        <td style="text-align:center;color:#888">${i + 1}</td>
        <td><strong>${p.buildingName ?? p.title}</strong><br/><span style="color:#888;font-size:10px">${p.unitNumber ?? ""}</span></td>
        <td style="color:#555">${p.address}</td>
        <td style="text-align:center">${p.floor ?? "-"}</td>
        <td style="text-align:center">${p.area ?? "-"}</td>
        <td style="text-align:center;color:#1a56db;font-weight:bold">${p.deposit}</td>
        <td style="text-align:center;color:#e11d48;font-weight:bold">${p.monthly}</td>
        <td style="text-align:center;color:#555">${p.manageFee ?? "-"}</td>
        <td style="text-align:center">${p.availableFrom ?? "-"}</td>
        <td style="text-align:center"><span style="background:#e8f0ff;color:#1a56db;border-radius:4px;padding:2px 6px;font-size:10px">${p.type}</span></td>
      </tr>`
    ).join("");
    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <title>선택 매물 목록 (${list.length}건)</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Apple SD Gothic Neo', '맑은 고딕', sans-serif; font-size: 12px; color: #111; background: #fff; padding: 24px; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; border-bottom: 2px solid #1a56db; padding-bottom: 10px; }
    .header h1 { font-size: 18px; font-weight: 700; color: #1a56db; }
    .header .meta { font-size: 11px; color: #888; text-align: right; line-height: 1.6; }
    table { border-collapse: collapse; width: 100%; }
    th { background: #1a56db; color: #fff; padding: 7px 8px; font-size: 11px; font-weight: 600; text-align: center; }
    td { border: 1px solid #e0e0e0; padding: 6px 8px; font-size: 11px; vertical-align: middle; }
    tr:nth-child(even) td { background: #f8faff; }
    tr:hover td { background: #eef3ff; }
    .footer { margin-top: 14px; font-size: 10px; color: #aaa; text-align: right; }
    @media print {
      body { padding: 10px; }
      .no-print { display: none !important; }
      tr:hover td { background: inherit; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>📋 선택 매물 목록</h1>
      <p style="font-size:12px;color:#555;margin-top:4px">총 <strong style="color:#1a56db">${list.length}건</strong> 선택</p>
    </div>
    <div class="meta">
      출력일: ${today}<br/>
      공실박스
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:28px">No.</th>
        <th style="width:130px">건물명 / 호수</th>
        <th>주소</th>
        <th style="width:40px">층</th>
        <th style="width:70px">면적</th>
        <th style="width:80px">보증금</th>
        <th style="width:80px">월세</th>
        <th style="width:60px">관리비</th>
        <th style="width:80px">입주가능일</th>
        <th style="width:65px">유형</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">※ 본 자료는 참고용이며 실제 계약 조건과 다를 수 있습니다.</div>
  <div class="no-print" style="margin-top:20px;text-align:center">
    <button onclick="window.print()" style="padding:10px 28px;background:#1a56db;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;margin-right:8px">🖨️ 인쇄</button>
    <button onclick="window.close()" style="padding:10px 20px;background:#f0f0f0;color:#333;border:none;border-radius:8px;font-size:13px;cursor:pointer">닫기</button>
  </div>
</body>
</html>`;
    const w = window.open("", "_blank", "width=1000,height=700");
    w?.document.write(html);
    w?.document.close();
  };

  const handleDetailPrint = () => {
    const list = checkedIds.size > 0 ? properties.filter(p => checkedIds.has(p.id)) : properties;
    const cards = list.map(p =>
      `<div style="border:1px solid #ddd;border-radius:8px;padding:16px;margin-bottom:16px;page-break-inside:avoid">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <strong style="font-size:14px">${p.buildingName ?? p.title}</strong>
          <span style="background:#e8f0ff;color:#1a56db;border-radius:4px;padding:2px 8px;font-size:11px">${p.type}</span>
        </div>
        <p style="margin:2px 0;font-size:12px;color:#555">📍 ${p.address} ${p.unitNumber ?? ""}</p>
        <p style="margin:2px 0;font-size:12px;color:#555">🏢 ${p.floor ?? "-"} / ${p.totalFloors ?? "-"} · ${p.area ?? "-"} · 준공 ${p.buildYear ?? "-"}</p>
        <p style="margin:6px 0;font-size:13px;font-weight:bold;color:#1a56db">보증금 ${p.deposit} / 월세 ${p.monthly}</p>
        <p style="margin:2px 0;font-size:11px;color:#777">관리비 ${p.manageFee ?? "-"} · 주차 ${p.parking ?? "-"} · 입주 ${p.availableFrom ?? "-"}</p>
        ${p.options && p.options.length > 0 ? `<p style="margin:4px 0;font-size:11px;color:#555">옵션: ${p.options.join(", ")}</p>` : ""}
      </div>`
    ).join("");
    const html = `<html><head><title>매물 상세 인쇄</title><style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px}@media print{body{padding:0}}</style></head><body><h2>매물 상세 목록 (${list.length}건)</h2>${cards}</body></html>`;
    const w = window.open("", "_blank"); w?.document.write(html); w?.document.close(); w?.print();
  };

  /* ── Resize drag ── */
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = startX.current - ev.clientX;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + delta));
      setWidth(newWidth);
      localStorage.setItem("sidebar_width", String(newWidth));
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
        <BuildingRegisterModal
          address={buildingRegisterAddr}
          onClose={() => setBuildingRegisterAddr(null)}
          pos={modalPos}
          onPosChange={setModalPos}
        />
      )}
      {/* External Link Modal (등기소/정부24/토지이음 등) */}
      {externalModal && (
        <BuildingRegisterModal
          address=""
          customUrl={externalModal.url}
          title={externalModal.title}
          onClose={() => setExternalModal(null)}
          pos={externalModalPos}
          onPosChange={setExternalModalPos}
        />
      )}
      {/* Photo Upload Modal */}
      {photoUploadProp && (
        <PhotoUploadModal
          prop={photoUploadProp}
          onClose={() => setPhotoUploadProp(null)}
          onImagesUpdated={(imgs) => {
            // 실시간 반영: photoUploadProp의 이미지 업데이트
            setPhotoUploadProp(prev => prev ? { ...prev, images: imgs, image: imgs[0] ?? prev.image } : null);
          }}
        />
      )}
      {/* Lease Proposal Modal */}
      {leaseProposalProp && (
        <LeaseProposalModal
          prop={leaseProposalProp}
          allProperties={properties}
          onClose={() => setLeaseProposalProp(null)}
        />
      )}
      {/* Error Report Modal */}
      {errorReportProp && (
        <ErrorReportModal
          prop={errorReportProp}
          onClose={() => setErrorReportProp(null)}
        />
      )}
      {/* Admin Property Edit Modal */}
      {adminEditProp && (() => {
        // agent_name(DB)에 저장된 연락처 문자열 파싱
        // 형식: "건물주:010-xxx|부동산:043-xxx|세입자:010-xxx|관리인:010-xxx"
        // 또는 note: "건물주: 010-xxx\n부동산: 043-xxx\n..."
        const rawContact = adminEditProp.agentName ?? adminEditProp.note ?? "";
        const parseC = (key: string) => {
          const m = rawContact.match(new RegExp(`${key}[:\\s]+([0-9][0-9\\-]+)`));
          return m ? m[1].trim() : "";
        };
        const parsedOwner = adminEditProp.contactOwner || parseC("건물주");
        const parsedBroker = adminEditProp.contact || parseC("부동산");
        const parsedTenant = parseC("세입자");
        const parsedManager = adminEditProp.contactManager || parseC("관리인");

        return (
          <AdminPropertyFormModal
            initial={
              adminEditProp.memo
                ? {
                    id: adminEditProp.memo,
                    title: adminEditProp.title,
                    building_name: adminEditProp.buildingName,
                    address: adminEditProp.address,
                    dong: adminEditProp.address?.split(" ").slice(-2, -1)[0] ?? "",
                    lot_number: adminEditProp.address?.split(" ").slice(-1)[0] ?? "",
                    district: adminEditProp.address?.match(/([가-힣]+구)/)?.[1],
                    type: adminEditProp.type,
                    room_type: adminEditProp.roomType ?? adminEditProp.type ?? "",
                    unit_number: adminEditProp.unitNumber,
                    area: adminEditProp.area ?? "",
                    floor: adminEditProp.floor ?? "",
                    deposit: adminEditProp.deposit?.replace(/[^0-9,]/g, "") ?? "",
                    monthly: adminEditProp.monthly?.replace(/[^0-9,]/g, "") ?? "",
                    manage_fee: adminEditProp.manageFee?.replace(/[^0-9,]/g, "") ?? "",
                    parking: adminEditProp.parking ?? "",
                    elevator: adminEditProp.elevator ?? false,
                    available_from: adminEditProp.availableFrom ?? "",
                    total_floors: adminEditProp.totalFloors?.replace(/[^0-9층]/g, "") ?? "",
                    build_year: adminEditProp.buildYear?.replace(/[^0-9]/g, "") ?? "",
                    description: adminEditProp.description ?? "",
                    building_memo: adminEditProp.buildingMemo ?? "",
                    room_memo: adminEditProp.roomMemo ?? "",
                    note: adminEditProp.note ?? "",
                    vacate_date: adminEditProp.vacateDate ?? "",
                    building_password: adminEditProp.buildingPassword ?? "",
                    room_password: adminEditProp.roomPassword ?? "",
                    options: adminEditProp.options ?? [],
                    images: adminEditProp.images && adminEditProp.images.length > 0
                      ? adminEditProp.images
                      : adminEditProp.image ? [adminEditProp.image] : [],
                    views: adminEditProp.views ?? 0,
                    lat: adminEditProp.lat ?? 0,
                    lng: adminEditProp.lng ?? 0,
                    is_new: adminEditProp.isNew ?? false,
                    is_hot: adminEditProp.isHot ?? false,
                    status: "active",
                    registered_date: adminEditProp.registeredDate ?? new Date().toISOString().slice(0, 10),
                    checked_date: adminEditProp.checkedDate ?? "",
                    // 연락처: 각 필드에 분리 배치 (담당중개사 필드에 묶지 않음)
                    agent_name: parsedBroker,
                    // 아래는 AdminFormExtended 확장 필드로 초기화됨
                    ...(parsedOwner   ? { contactOwner:   parsedOwner   } : {}),
                    ...(parsedTenant  ? { contactTenant:  parsedTenant  } : {}),
                    ...(parsedManager ? { contactManager: parsedManager } : {}),
                  }
                : null
            }
            onClose={() => setAdminEditProp(null)}
            onSaved={() => setAdminEditProp(null)}
          />
        );
      })()}
      {/* Lightbox — 여러 장 좌우 탐색 */}
      {lightbox && (
        <LightboxModal
          images={lightbox.images}
          startIdx={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* collapsed 시 absolute로 지도 위에 겹치게, 열릴 때는 flex로 공간 차지 */}
      <div
        className="flex h-full"
        style={{
          position: collapsed ? "absolute" : "relative",
          right: 0,
          top: 0,
          bottom: 0,
          zIndex: collapsed ? 50 : "auto",
          flexShrink: 0,
        }}
      >
        {/* Toggle tab — 사이드바 왼쪽 */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="self-start bg-primary text-primary-foreground border-0 rounded-l-xl px-1.5 py-4 shadow-lg hover:bg-primary/90 transition-colors flex-shrink-0"
          style={{ marginTop: "32px" }}
        >
          {collapsed ? (
            <ChevronLeft className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Panel */}
        <aside
          className={`bg-white border-l border-border flex flex-col transition-all duration-300 ${
            collapsed ? "w-0 overflow-hidden opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{
            width: collapsed ? 0 : width,
            boxShadow: "-2px 0 16px rgba(10,45,110,0.08)",
            flexShrink: 0,
          }}
        >
          {/* Drag handle — 사이드바 왼쪽 끝 */}
          {!collapsed && (
            <div
              onMouseDown={onMouseDown}
              className="absolute top-0 bottom-0 w-3 cursor-col-resize z-10 flex items-center justify-center hover:bg-primary/10 transition-colors"
              style={{ left: "0px" }}
              title="드래그하여 너비 조절"
            >
              <div className="w-1.5 h-16 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors shadow" />
            </div>
          )}

          {/* Header */}
          {/* ── 사이드바 헤더 ── */}
          <div
            className="flex-shrink-0 border-b border-border"
            style={{ background: "hsl(var(--toolbar-bg))" }}
          >
            {/* 핀 선택 모드 배너 */}
            {pinnedAddress && (
              <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/60"
                style={{ background: "hsl(var(--primary)/0.08)" }}>
                <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                <span className="text-[10px] font-bold text-primary flex-1 min-w-0 truncate">{pinnedAddress}</span>
                <button
                  onClick={() => onClearPin?.()}
                  className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold border border-primary/30 hover:bg-primary/10 transition-colors flex-shrink-0"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  <X className="w-2.5 h-2.5" />
                  전체보기
                </button>
              </div>
            )}
            {/* 상단: 주요 액션 */}
            <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold text-foreground leading-none">
                    {pinnedAddress && <span className="text-[10px] font-semibold text-primary">(동일주소)</span>}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {checkedIds.size > 0 ? `${checkedIds.size}개 선택됨` : pinnedAddress ? "핀 클릭 필터 중" : ""}
                  </p>
                </div>
              </div>
              {/* 인쇄 버튼 제거 */}
              <span className="flex-1" />
              {/* 선택인쇄 — 우측 파란색 */}
              <button
                onClick={handleSelectPrint}
                className="toolbar-btn flex items-center gap-0.5 ml-auto"
                style={{ background: "hsl(217 91% 93%)", color: "hsl(217 91% 35%)", border: "1px solid hsl(217 80% 70%)" }}
              >
                <Printer className="w-3 h-3" />
                선택인쇄
              </button>
            </div>
            {/* 외부 링크 바 */}
            <div className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto scrollbar-none flex-nowrap">
              {/* 구분선 */}
              <div className="w-px h-4 bg-border/60 mr-0.5 flex-shrink-0" />
              {/* 인터넷등기소 */}
              <a
                href="https://www.iros.go.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="toolbar-btn"
                title="인터넷등기소"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                등기소
              </a>
              {/* 정부24 */}
              <a
                href="https://www.gov.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="toolbar-btn"
                title="정부24"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                정부24
              </a>
              {/* 토지e음 */}
              <a
                href="https://www.eum.go.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="toolbar-btn"
                title="토지이음"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                토지e음
              </a>
              {/* 홈택스 */}
              <a
                href="https://www.hometax.go.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="toolbar-btn"
                title="홈택스"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                홈택스
              </a>
              {/* 구분선 */}
              <div className="w-px h-4 bg-border/60 mx-0.5 flex-shrink-0" />
              {/* 네이버부동산 */}
              <a
                href="https://land.naver.com"
                target="_blank"
                rel="noopener noreferrer"
                className="toolbar-btn"
                title="네이버부동산"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                네이버
              </a>
              {/* 직방 */}
              <a
                href="https://www.zigbang.com"
                target="_blank"
                rel="noopener noreferrer"
                className="toolbar-btn"
                title="직방"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                직방
              </a>
              {/* 다방 */}
              <a
                href="https://www.dabangapp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="toolbar-btn"
                title="다방"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                다방
              </a>
              <span className="flex-1" />
              {/* 선택인쇄 — 우측 끝 파란색 */}
              <button
                onClick={handleSelectPrint}
                className="toolbar-btn flex items-center gap-0.5"
                style={{ background: "hsl(217 91% 93%)", color: "hsl(217 91% 35%)", border: "1px solid hsl(217 80% 70%)" }}
              >
                <Printer className="w-2.5 h-2.5" />
                선택인쇄
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin bg-muted/20">
            {displayProperties.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <MapPin className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">검색 결과가 없습니다</p>
              </div>
            ) : (
              <div className="pt-2 pb-2 pr-2 pl-3 flex flex-col gap-1.5">
                 {[...displayProperties]
                  .sort((a, b) => {
                  const isSaleA = a.type?.includes("매매") ? 1 : 0;
                  const isSaleB = b.type?.includes("매매") ? 1 : 0;
                  if (isSaleA !== isSaleB) return isSaleA - isSaleB;
                  // 등록일 내림차순 (최신 등록 우선)
                  const regA = a.registeredDate ? new Date(a.registeredDate).getTime() : 0;
                  const regB = b.registeredDate ? new Date(b.registeredDate).getTime() : 0;
                  return regB - regA;
                }).map((prop, idx) => {
                  const buildingMemo = prop.buildingMemo ?? prop.memo;
                  const roomMemo = prop.roomMemo;
                  const buildingPw = prop.buildingPassword ?? prop.password;
                  const roomPw = prop.roomPassword;
                  const regDate = prop.registeredDate;
                  const chkDate = prop.checkedDate;

                  return (
                    <div key={prop.id} className="flex flex-col">
                    <button
                      onClick={() => selectedId === prop.id ? onDeselect?.() : onSelect(prop.id)}
                      className={`w-full text-left transition-all group rounded-xl overflow-hidden bg-white ${
                        selectedId === prop.id
                          ? "ring-2 ring-primary shadow-lg"
                          : "shadow-sm hover:shadow-md hover:ring-1 hover:ring-primary/30"
                      }`}
                    >
                      {/* Row: 3줄 레이아웃 */}
                      <div className="flex items-stretch" style={{ width: "100%", minHeight: "80px" }}>

                        {/* ①썸네일 96px — 고화질 렌더링 */}
                        <div className="w-[96px] flex-shrink-0 overflow-hidden relative group/thumb" style={{ minHeight: "96px" }}>
                          {prop.image ? (
                            <img
                              src={prop.image}
                              alt={prop.title}
                              loading="eager"
                              decoding="async"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              style={{ imageRendering: "auto", WebkitBackfaceVisibility: "hidden" }}
                            />
                          ) : (
                            /* 이미지 없는 DB 매물 placeholder */
                            <div className="w-full h-full flex flex-col items-center justify-center gap-0.5"
                              style={{ background: "hsl(var(--muted))" }}>
                              <Building2 className="w-5 h-5" style={{ color: "hsl(var(--muted-foreground))" }} />
                              <span className="text-[8px] font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>사진없음</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCheckedIds(prev => {
                                const next = new Set(prev);
                                next.has(prop.id) ? next.delete(prop.id) : next.add(prop.id);
                                return next;
                              });
                            }}
                            className="absolute top-1 left-1 z-10 w-4 h-4 rounded flex items-center justify-center transition-all"
                            style={{
                              background: checkedIds.has(prop.id) ? "hsl(var(--primary))" : "rgba(255,255,255,0.85)",
                              border: `1.5px solid ${checkedIds.has(prop.id) ? "hsl(var(--primary))" : "rgba(150,150,150,0.6)"}`,
                              boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                            }}
                          >
                            {checkedIds.has(prop.id) && (
                              <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                          <span className={`absolute bottom-1 right-1 text-[8px] font-bold px-1 py-0.5 rounded shadow ${TYPE_BG[prop.type] ?? "bg-primary/10 text-primary"}`}>
                            {prop.type}
                          </span>
                          {/* 순번 + 등록일 — 하단 좌측 오버레이 */}
                          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-0.5 px-1 py-0.5" style={{ background: "rgba(0,0,0,0.52)" }}>
                            <span className="text-[9px] font-extrabold text-white leading-none flex-shrink-0">{idx}.</span>
                            {regDate && <span className="text-[8px] text-white/80 leading-none truncate">{regDate}</span>}
                          </div>
                          {(prop.images && prop.images.length > 0 ? prop.images : prop.image ? [prop.image] : []).length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const imgs = prop.images && prop.images.length > 0 ? prop.images : prop.image ? [prop.image] : [];
                                setLightbox({ images: imgs, idx: 0 });
                              }}
                              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/30 transition-colors"
                            >
                              <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow-lg" />
                            </button>
                          )}
                        </div>

                        {/* ②연락처 이모티콘 컬럼 — 건물주/관리인/세입자 */}
                        <div className="w-[28px] flex-shrink-0 flex flex-col border-l border-border/30">
                          <ContactEmojiRow propId={prop.id} type="owner" number={prop.contactOwner ?? null} />
                          <ContactEmojiRow propId={prop.id} type="manager" number={prop.contactManager ?? null} />
                          <ContactEmojiRow propId={prop.id} type="tenant" number={prop.contactTenant ?? null} />
                        </div>

                         {/* ③메인 정보 — 3줄 고정 레이아웃 */}
                        <AddressToggleCard
                          prop={prop}
                          idx={idx}
                          buildingMemo={buildingMemo}
                          roomMemo={roomMemo}
                          buildingPw={buildingPw}
                          roomPw={roomPw}
                          regDate={regDate}
                          chkDate={chkDate}
                          isAdmin={isAdmin}
                        />
                      </div>

                    </button>

                    {/* 선택 시 액션 버튼들 */}
                    {selectedId === prop.id && (
                      <div className={`grid border-t border-primary/20 ${isAdmin ? "grid-cols-6" : "grid-cols-5"}`}>
                        {/* 관리자 수정 버튼 - 관리자 로그인 시 항상 표시 */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!prop.memo) {
                                alert("static 샘플 매물은 수정할 수 없습니다.\nDB에 등록된 매물만 수정 가능합니다.");
                                return;
                              }
                              setAdminEditProp(prop);
                            }}
                            className="flex flex-col items-center justify-center gap-0.5 py-2 border-r border-primary/20 transition-colors hover:opacity-80"
                            style={{
                              background: prop.memo
                                ? "hsl(var(--accent)/0.12)"
                                : "hsl(var(--muted)/0.5)",
                            }}
                          >
                            <Pencil className="w-3 h-3" style={{ color: prop.memo ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }} />
                            <span className="text-[9px] font-bold" style={{ color: prop.memo ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }}>
                              {prop.memo ? "수정" : "수정불가"}
                            </span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setModalPos(getModalInitPos()); setBuildingRegisterAddr(prop.address); }}
                          className="flex flex-col items-center justify-center gap-0.5 py-2 bg-primary/10 hover:bg-primary/20 transition-colors border-r border-primary/20"
                        >
                          <FileText className="w-3 h-3 text-primary" />
                          <span className="text-[9px] font-bold text-primary">건물/토지대장</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setPhotoUploadProp(prop); }}
                          className="flex flex-col items-center justify-center gap-0.5 py-2 bg-blue-50 hover:bg-blue-100 transition-colors border-r border-primary/20"
                        >
                          <Camera className="w-3 h-3 text-blue-600" />
                          <span className="text-[9px] font-bold text-blue-700">사진등록</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setLeaseProposalProp(prop); }}
                          className="flex flex-col items-center justify-center gap-0.5 py-2 bg-purple-50 hover:bg-purple-100 transition-colors border-r border-primary/20"
                        >
                          <ClipboardList className="w-3 h-3 text-purple-600" />
                          <span className="text-[9px] font-bold text-purple-700">임대제안서</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); alert(`[거래완료] 매물 ID: ${prop.id}\n${prop.address}`); }}
                          className="flex flex-col items-center justify-center gap-0.5 py-2 bg-green-50 hover:bg-green-100 transition-colors border-r border-primary/20"
                        >
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          <span className="text-[9px] font-bold text-green-700">거래완료</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setErrorReportProp(prop); }}
                          className="flex flex-col items-center justify-center gap-0.5 py-2 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <AlertCircle className="w-3 h-3 text-red-500" />
                          <span className="text-[9px] font-bold text-red-600">오류제보</span>
                        </button>
                      </div>
                    )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
};

export default MapSidebar;
