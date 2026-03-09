import { MapPin, ChevronRight, ChevronLeft, X, ZoomIn, Phone, KeyRound, CalendarCheck, CalendarPlus, FileText, ExternalLink, CheckCircle, AlertCircle, Camera, ClipboardList, Send, Heart, Printer, Building2 } from "lucide-react";
import { useState, useCallback, useRef } from "react";
import { MapProperty } from "@/data/mapProperties";

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
      <div className="fixed inset-0 z-[9990] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9991] bg-white rounded-2xl shadow-2xl flex flex-col"
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
interface PhotoUploadModalProps { propId: number; address: string; onClose: () => void; }
const PhotoUploadModal = ({ propId, address, onClose }: PhotoUploadModalProps) => {
  const storageKey = `photos_${propId}`;
  const [photos, setPhotos] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) ?? "[]"); } catch { return []; }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotos(prev => {
          const next = [...prev, e.target?.result as string];
          localStorage.setItem(storageKey, JSON.stringify(next));
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx: number) => {
    setPhotos(prev => {
      const next = prev.filter((_, i) => i !== idx);
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-[9990] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9991] bg-white rounded-2xl shadow-2xl w-[min(480px,92vw)] flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Camera className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">사진 등록</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[300px]">{address}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-primary/30 rounded-xl py-6 flex flex-col items-center gap-2 hover:border-primary/60 hover:bg-primary/5 transition-colors mb-4"
          >
            <Camera className="w-8 h-8 text-primary/50" />
            <span className="text-sm font-semibold text-primary">사진 선택 / 드래그</span>
            <span className="text-[11px] text-muted-foreground">JPG, PNG, WEBP 등 이미지 파일</span>
          </button>
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((src, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {photos.length === 0 && <p className="text-center text-[11px] text-muted-foreground mt-2">등록된 사진이 없습니다</p>}
        </div>
        <div className="px-4 py-3 border-t border-border flex-shrink-0">
          <p className="text-[10px] text-muted-foreground text-center">✓ 사진은 이 기기에 임시 저장됩니다</p>
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
      <div className="fixed inset-0 z-[9990] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9991] bg-white rounded-2xl shadow-2xl flex flex-col"
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
  onDeleteProperties?: (ids: Set<number>) => void;
}

const MIN_WIDTH = 260;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 540;

const MapSidebar = ({ properties, selectedId, onSelect, topOffset = 0, onDeleteProperties }: MapSidebarProps) => {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem("sidebar_width");
    const parsed = saved ? Number(saved) : 0;
    // 저장값이 없거나 최소보다 작으면 새 기본값 사용
    return parsed >= MIN_WIDTH ? Math.min(MAX_WIDTH, parsed) : DEFAULT_WIDTH;
  });
  const [collapsed, setCollapsed] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [buildingRegisterAddr, setBuildingRegisterAddr] = useState<string | null>(null);
  const [photoUploadProp, setPhotoUploadProp] = useState<MapProperty | null>(null);
  const [leaseProposalProp, setLeaseProposalProp] = useState<MapProperty | null>(null);
  const [errorReportProp, setErrorReportProp] = useState<MapProperty | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [modalPos, setModalPos] = useState({ x: 0, y: 97 });
  const getModalInitPos = useCallback(() => {
    // x: 파란 드래그 라인(사이드바 우측 끝) 정확히 맞춤
    const x = width;
    // y: 헤더(56px) + 주거유형 탭바(41px) = 97px → 탭바 바로 아래
    const y = 97;
    return { x, y };
  }, [width]);

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
      {/* Photo Upload Modal */}
      {photoUploadProp && (
        <PhotoUploadModal
          propId={photoUploadProp.id}
          address={photoUploadProp.address}
          onClose={() => setPhotoUploadProp(null)}
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
              className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-10 flex items-center justify-center hover:bg-primary/10 transition-colors"
              title="드래그하여 너비 조절"
            >
              <div className="w-1.5 h-16 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors shadow" />
            </div>
          )}

          {/* Header */}
          <div
            className="border-b border-border flex-shrink-0"
            style={{ background: "linear-gradient(to right, hsl(var(--primary)/0.04), hsl(var(--primary)/0.08))" }}
          >
            {/* 액션 버튼들 */}
            <div className="px-3 py-2 flex items-center gap-1.5 flex-wrap">
              {/* 선택 인쇄 */}
              <button
                onClick={handleSelectPrint}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all"
                style={{ background: "white", color: "hsl(var(--primary))", borderColor: "hsl(var(--primary)/0.3)" }}
              >
                <Printer className="w-3 h-3" />
                선택인쇄
              </button>
              {/* 상세 인쇄 */}
              <button
                onClick={handleDetailPrint}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all"
                style={{ background: "hsl(var(--primary))", color: "white", borderColor: "hsl(var(--primary))" }}
              >
                <Printer className="w-3 h-3" />
                상세인쇄
              </button>
              {/* 구분선 */}
              <div className="w-px h-5 bg-border/60 mx-0.5" />
              {/* 인터넷등기소 */}
              <a
                href="https://www.iros.go.kr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all hover:opacity-80"
                style={{ background: "#f0f5ff", color: "#1a56db", borderColor: "#c7d7f8" }}
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
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all hover:opacity-80"
                style={{ background: "#f0fff4", color: "#166534", borderColor: "#bbf7d0" }}
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
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all hover:opacity-80"
                style={{ background: "#fffbeb", color: "#92400e", borderColor: "#fde68a" }}
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
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all hover:opacity-80"
                style={{ background: "#fdf4ff", color: "#7e22ce", borderColor: "#e9d5ff" }}
                title="홈택스"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                홈택스
              </a>
              {/* 구분선 */}
              <div className="w-px h-5 bg-border/60 mx-0.5" />
              {/* 네이버부동산 */}
              <a
                href="https://land.naver.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all hover:opacity-80"
                style={{ background: "#e8f5e9", color: "#03C75A", borderColor: "#b2dfdb" }}
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
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all hover:opacity-80"
                style={{ background: "#fff3e0", color: "#FF6D00", borderColor: "#ffcc80" }}
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
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all hover:opacity-80"
                style={{ background: "#fce4ec", color: "#e91e63", borderColor: "#f8bbd0" }}
                title="다방"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                다방
              </a>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto scrollbar-thin bg-muted/20">
            {properties.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <MapPin className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">검색 결과가 없습니다</p>
              </div>
            ) : (
              <div className="pt-2 pb-2 pr-2 pl-3 flex flex-col gap-1.5">
                 {[...properties].sort((a, b) => {
                  const isSaleA = a.type?.includes("매매") ? 1 : 0;
                  const isSaleB = b.type?.includes("매매") ? 1 : 0;
                  if (isSaleA !== isSaleB) return isSaleA - isSaleB;
                  // 최근 조사순 (확인일 내림차순)
                  const dateA = a.checkedDate ? new Date(a.checkedDate).getTime() : 0;
                  const dateB = b.checkedDate ? new Date(b.checkedDate).getTime() : 0;
                  return dateB - dateA;
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
                      onClick={() => onSelect(prop.id)}
                      className={`w-full text-left transition-all group rounded-xl overflow-hidden bg-white ${
                        selectedId === prop.id
                          ? "ring-2 ring-primary shadow-lg"
                          : "shadow-sm hover:shadow-md hover:ring-1 hover:ring-primary/30"
                      }`}
                    >
                      {/* Row: 3줄 고정 레이아웃 */}
                      <div className="flex items-stretch" style={{ width: "100%", height: "76px" }}>

                        {/* ①썸네일 76px */}
                        <div className="w-[76px] flex-shrink-0 overflow-hidden relative group/thumb" style={{ minHeight: "76px" }}>
                          {prop.image ? (
                            <img
                              src={prop.image}
                              alt={prop.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                          {prop.image && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setLightboxSrc(prop.image); }}
                              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/30 transition-colors"
                            >
                              <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow-lg" />
                            </button>
                          )}
                        </div>

                        {/* ②건물주/관리인 36px */}
                        <div className="w-[36px] flex-shrink-0 flex flex-col border-l border-border/30">
                          <ContactEmojiRow propId={prop.id} type="owner" number={prop.contactOwner ?? null} />
                          <ContactEmojiRow propId={prop.id} type="manager" number={prop.contactManager ?? prop.contact ?? null} />
                        </div>

                        {/* ③메인 정보 — 3줄 고정 레이아웃 */}
                        <div className="flex-1 min-w-0 flex flex-col border-l border-border/30 px-2" style={{ height: "76px", justifyContent: "space-evenly" }}>

                          {/* 1줄: 건물명 | 로드뷰 | 보증금/월세 | → 메모·날짜 우측끝 */}
                          <div className="flex items-center gap-1 overflow-hidden flex-nowrap" style={{ height: "22px" }}>
                            <p className="text-[12px] font-extrabold text-foreground truncate leading-none flex-shrink min-w-0">{prop.buildingName ?? prop.title}</p>
                            <a
                              href={`https://map.kakao.com/link/roadview/${prop.lat},${prop.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-shrink-0 px-1 py-0.5 rounded text-[8px] font-bold border transition-colors hover:bg-primary/10 whitespace-nowrap"
                              style={{ color: "hsl(var(--primary))", borderColor: "hsl(var(--primary)/0.3)" }}
                            >로드뷰</a>
                            <span className="flex-shrink-0 text-[11px] font-extrabold text-foreground whitespace-nowrap">{prop.deposit}</span>
                            <span className="flex-shrink-0 text-[9px] text-muted-foreground">/</span>
                            <span className="flex-shrink-0 text-[11px] font-extrabold whitespace-nowrap" style={{ color: "hsl(var(--accent))" }}>{prop.monthly}</span>
                            {/* 우측 끝 고정 */}
                            <span className="flex-1" />
                            <span className="flex-shrink-0 w-px h-3 bg-border/50" />
                            <MemoNotepad propId={prop.id} memoKey="building" emoji="🏢" label="건물메모" initialText={buildingMemo ?? ""} />
                            <MemoNotepad propId={prop.id} memoKey="room" emoji="🚪" label="방메모" initialText={roomMemo ?? ""} />
                            <span className="flex-shrink-0 text-[9px] font-bold text-muted-foreground whitespace-nowrap">
                              확인:{idx}{regDate ? ` 등록:${regDate.slice(2).replace(/-/g, ".")}` : ""}
                            </span>
                          </div>

                          {/* 2줄: 주소 | 층·호수 | 비번 — 높이 고정 */}
                          <div className="flex items-center gap-1 overflow-hidden flex-nowrap" style={{ height: "18px" }}>
                            <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap flex-shrink-0">{shortAddress(prop.address)}</span>
                            {prop.roomType && <span className="text-[9px] text-primary font-semibold bg-primary/10 px-1 rounded flex-shrink-0 whitespace-nowrap">{prop.roomType}</span>}
                            {prop.floor && <span className="text-[9px] text-muted-foreground font-semibold flex-shrink-0 whitespace-nowrap">{prop.floor}</span>}
                            {prop.unitNumber && <span className="text-[9px] text-accent font-semibold bg-accent/10 px-1 rounded flex-shrink-0 whitespace-nowrap">{prop.unitNumber}</span>}
                            {buildingPw && (
                              <>
                                <span className="flex-shrink-0 w-px h-3 bg-border/40" />
                                <div className="flex items-center gap-0.5 flex-shrink-0">
                                  <KeyRound className="w-2.5 h-2.5 text-muted-foreground" />
                                  <span className="text-[9px] font-extrabold text-muted-foreground font-mono whitespace-nowrap">건{buildingPw}</span>
                                </div>
                              </>
                            )}
                            {roomPw && (
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <KeyRound className="w-2.5 h-2.5 text-accent" />
                                <span className="text-[9px] font-extrabold text-accent font-mono whitespace-nowrap">방{roomPw}</span>
                              </div>
                            )}
                          </div>

                          {/* 3줄: 옵션 | 퇴거일 | 특이사항 — 높이 고정 */}
                          <div className="flex items-center gap-1 overflow-hidden flex-nowrap" style={{ height: "18px" }}>
                            {prop.options && prop.options.length > 0 ? (
                              <>
                                {prop.options.slice(0, 5).map((opt) => (
                                  <span key={opt} title={opt} className="text-[11px] leading-none flex-shrink-0">{OPTION_ICONS[opt] ?? "•"}</span>
                                ))}
                                {prop.options.length > 5 && <span className="text-[8px] text-muted-foreground flex-shrink-0">+{prop.options.length - 5}</span>}
                              </>
                            ) : <span className="text-[9px] text-muted-foreground/30 flex-shrink-0">옵션없음</span>}
                            {prop.vacateDate && (
                              <>
                                <span className="flex-shrink-0 w-px h-3 bg-border/40" />
                                <span className="text-[9px] font-bold flex-shrink-0 whitespace-nowrap" style={{ color: "hsl(var(--destructive))" }}>퇴거{prop.vacateDate}</span>
                              </>
                            )}
                            {prop.note && (
                              <>
                                <span className="flex-shrink-0 w-px h-3 bg-border/40" />
                                <span className="text-[9px] text-muted-foreground flex-shrink-0 truncate" title={prop.note}>※{prop.note}</span>
                              </>
                            )}
                          </div>

                        </div>
                      </div>

                    </button>

                    {/* 선택 시 액션 버튼들 */}
                    {selectedId === prop.id && (
                      <div className="grid grid-cols-5 border-t border-primary/20">
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
