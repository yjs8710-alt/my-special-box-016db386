import { useState, useCallback, useRef, useEffect, useMemo, forwardRef } from "react";
import ReactDOM from "react-dom";
import {
  MapPin,
  ChevronRight,
  ChevronLeft,
  X,
  ZoomIn,
  Phone,
  KeyRound,
  FileText,
  CheckCircle,
  AlertCircle,
  Camera,
  ClipboardList,
  Send,
  Heart,
  Printer,
  Building2,
  Pencil,
  PenLine,
  Upload,
  Trash2,
  Dog,
  Droplet,
  Tv,
  Wifi,
  Loader2,
  FileSearch,
} from "lucide-react";
import cctvIcon from "@/assets/cctv_icon-v2-20260427.png";
import remodelingIcon from "@/assets/remodeling_icon-v2-20260427.png";
import tvIcon from "@/assets/tv_icon-v2-20260427.png";
import waterIcon from "@/assets/water_icon-v2-20260427.png";
import elevatorIcon from "@/assets/elevator_icon-v2-20260427.png";
import internetIcon from "@/assets/internet_icon-v2-20260427.png";
import petIcon from "@/assets/pet_icon-v2-20260427.png";
import memoIcon from "@/assets/memo_icon_new-v2-20260427.png";
import femaleOnlyIcon from "@/assets/female_only_icon-v2-20260427.png";
import checkDateIcon from "@/assets/check_date_icon-v2-20260427.png";
import logoTransparent from "@/assets/logo-transparent-zibda-20260427-v2-20260427.png";
import zibdaPlaceholder from "@/assets/zibda-placeholder-20260427-v2-20260427.png";
import cameraIcon from "@/assets/camera_icon-v2-20260427.png";
import { supabase } from "@/integrations/supabase/client";
import { MapProperty } from "@/data/mapProperties";
import { shareMultipleToKakao, sharePropertyToKakao, AgencyInfo } from "@/lib/kakaoShare";
import kakaoTalkIcon from "@/assets/kakao-talk-icon-v2-20260427.png";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useAuth } from "@/hooks/useAuth";
import AdminPropertyFormModal from "@/components/AdminPropertyFormModal";
import PublicRecordModal from "@/components/PublicRecordModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronUp, ChevronDown } from "lucide-react";

/* ── LightboxModal: 호실별 탭 + 여러 장 사진 좌우 탐색 ── */
interface LightboxUnit {
  unitNumber?: string; // 호수 (e.g., "202호")
  roomType?: string;     // 방종류 (e.g., "원룸")
  label?: string;        // legacy fallback (단일 매물명 등)
  images: string[];
  isReference?: boolean; // 참고용 사진 여부
}
function LightboxModal({
  units,
  startUnitIdx = 0,
  startImgIdx = 0,
  onClose,
}: {
  units: LightboxUnit[];
  startUnitIdx?: number;
  startImgIdx?: number;
  onClose: () => void;
}) {
  const [unitIdx, setUnitIdx] = useState(startUnitIdx);
  const [imgIdx, setImgIdx] = useState(startImgIdx);
  // 모바일 감지 — 세로 스크롤 나열 모드
  const [isMobileView, setIsMobileView] = useState(false);
  useEffect(() => {
    const check = () => setIsMobileView(window.matchMedia("(max-width: 767px)").matches);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const currentImages = units[unitIdx]?.images ?? [];
  const prev = useCallback(
    () => setImgIdx((i) => (i - 1 + currentImages.length) % currentImages.length),
    [currentImages.length],
  );
  const next = useCallback(() => setImgIdx((i) => (i + 1) % currentImages.length), [currentImages.length]);

  // 호실 탭 변경 시 사진 인덱스 초기화
  const handleUnitChange = useCallback((i: number) => {
    setUnitIdx(i);
    setImgIdx(0);
  }, []);

  useEffect(() => {
    if (isMobileView) return; // 모바일은 키보드 좌/우 슬라이드 비활성
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onClose, isMobileView]);

  const hasTabs = units.length > 1 || units.some((u) => u.isReference);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-colors z-20"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* 호실 탭 — 2개 이상이거나 참고용이 있을 때 표시 */}
      {hasTabs && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 max-w-[80vw] flex-wrap justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {units.map((u, i) => {
            const isCurrent = i === unitIdx;
            const isRef = u.isReference;
            const unitLabel = u.unitNumber ?? u.label ?? "";
            const roomLabel = u.roomType ?? "";
            return (
              <button
                key={i}
                onClick={() => handleUnitChange(i)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center leading-tight"
                style={
                  isCurrent
                    ? { background: "hsl(var(--primary))", color: "#fff" }
                    : { background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }
                }
              >
                <span>{unitLabel}{isRef ? "(다른방)" : "(현재방)"}</span>
                {roomLabel && <span className="text-[10px] font-normal opacity-80 mt-0.5">{roomLabel}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* ── 모바일: 세로 스크롤 나열 ── */}
      {isMobileView ? (
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden w-full"
          style={{ paddingTop: hasTabs ? "72px" : "56px", paddingBottom: "32px" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 카운터 표시 제거 — 오로지 사진만 보이도록 */}
          {units[unitIdx]?.isReference && (
            <div className="text-center mb-3 px-4">
              <span className="text-sm font-bold px-4 py-1.5 rounded-full inline-block bg-white/10" style={{ color: "hsl(var(--primary))" }}>
                다른 매물 사진입니다. 참고용입니다.
              </span>
            </div>
          )}
          <div className="flex flex-col gap-3 px-3">
            {currentImages.map((src, i) => (
              <div key={i} className="w-full flex flex-col items-center">
                <img
                  src={src}
                  alt={`사진 ${i + 1}`}
                  className="w-full h-auto object-contain rounded-lg select-none"
                  draggable={false}
                  loading="lazy"
                />
                <span className="sr-only">{`사진 ${i + 1} / ${currentImages.length}`}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* 사진 카운터 — 데스크톱 */}
          <div
            className={`absolute bg-black/50 text-white text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm z-10 ${hasTabs ? "top-14 right-4" : "top-4 left-1/2 -translate-x-1/2"}`}
            onClick={(e) => e.stopPropagation()}
          >
            {imgIdx + 1} / {currentImages.length}
          </div>

          <div
            className="relative w-full h-full overflow-hidden"
            style={{ paddingTop: hasTabs ? "56px" : "0" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 슬라이드 트랙 */}
            <div
              className="flex h-full transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${imgIdx * 100}vw)`, width: `${currentImages.length * 100}vw` }}
            >
              {currentImages.map((src, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 h-full flex items-center justify-center px-16"
                  style={{ width: "100vw" }}
                >
                  <img
                    src={src}
                    alt={`사진 ${i + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg select-none"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
            {units[unitIdx]?.isReference && (
              <div
                className="absolute left-1/2 -translate-x-1/2 text-center z-10"
                style={{ bottom: currentImages.length > 1 ? "90px" : "20px" }}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-sm font-bold px-4 py-1.5 rounded-full" style={{ color: "hsl(var(--primary))" }}>
                  다른 매물 사진입니다. 참고용입니다.
                </span>
              </div>
            )}
            {currentImages.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center backdrop-blur-sm transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center backdrop-blur-sm transition-colors"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>
          {currentImages.length > 1 && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-4 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {currentImages.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all"
                  style={{
                    borderColor: i === imgIdx ? "hsl(var(--primary))" : "transparent",
                    opacity: i === imgIdx ? 1 : 0.5,
                  }}
                >
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 주소에서 시/군/구 앞까지 제거 (예: "충북 청주시 서원구 남문로1가 190" → "남문로1가 190")
const shortAddress = (addr: string) => {
  // "시 구" 또는 "시 군" 이후 문자열 추출
  const matchSiGu = addr.match(/(?:시|군)\s+(?:[가-힣]+구\s+)?(.+)/);
  if (matchSiGu) return matchSiGu[1].trim();
  // fallback: 동+번지 패턴
  const matchDong = addr.match(/([가-힣]+동)\s*([\d\-]+)?/);
  if (matchDong) return matchDong[2] ? `${matchDong[1]} ${matchDong[2]}` : matchDong[1];
  return addr;
};

const TYPE_BG: Record<string, string> = {
  상가: "bg-primary/10 text-primary",
  사무실: "bg-purple-50 text-purple-700",
  "식당·카페": "bg-orange-50 text-accent",
  "공장·창고": "bg-green-50 text-green-700",
  "병원·학원": "bg-red-50 text-red-700",
  연립: "bg-blue-50 text-blue-700",
  다세대: "bg-sky-50 text-sky-700",
  단독주택: "bg-amber-50 text-amber-700",
  빌라: "bg-indigo-50 text-indigo-700",
  아파트: "bg-teal-50 text-teal-700",
  오피스텔: "bg-violet-50 text-violet-700",
  원룸: "bg-pink-50 text-pink-700",
  투룸: "bg-rose-50 text-rose-700",
  쓰리룸: "bg-red-50 text-red-700",
  고시원: "bg-gray-100 text-gray-600",
  토지: "bg-lime-50 text-lime-700",
  건물매매: "bg-orange-100 text-orange-800",
  단독매매: "bg-yellow-50 text-yellow-700",
};

/* 옵션 SVG 아이콘 컴포넌트 */
const OptionSvgIcon = ({ name, size = 11 }: { name: string; size?: number }) => {
  const s = size;
  const icons: Record<string, JSX.Element> = {
    냉장고: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <line x1="5" y1="9" x2="19" y2="9" stroke="currentColor" strokeWidth="1.8" />
        <line x1="10" y1="5.5" x2="10" y2="7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="10" y1="13" x2="10" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    세탁기: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="2" width="18" height="20" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="14" r="4.5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="8" cy="5.5" r="1" fill="currentColor" />
        <circle cx="12" cy="5.5" r="1" fill="currentColor" />
      </svg>
    ),
    드럼세탁기: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="2" width="18" height="20" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="13" r="5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    건조기: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="2" width="18" height="20" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 12 Q12 8 15 12 Q12 16 9 12Z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>
    ),
    스타일러: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 8 Q12 6 16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    TV: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 19 L7 22M15 19 L17 22M7 22 h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    에어컨: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M6 17 Q9 14 12 17 Q15 14 18 17"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="8" cy="9" r="1" fill="currentColor" />
      </svg>
    ),
    가스레인지: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="8" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    인덕션: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="8" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5" />
        <circle cx="16" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5" />
      </svg>
    ),
    전자레인지: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="5" y="8" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="19" cy="12" r="1.2" fill="currentColor" />
      </svg>
    ),
    침대: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path
          d="M2 18V12C2 10.9 2.9 10 4 10H20C21.1 10 22 10.9 22 12V18"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M2 18H22M3 10V7M21 10V7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="6" y="7" width="5" height="3" rx="1" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
    책상: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M3 8H21V10H3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M5 10V18M19 10V18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
    옷장: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <line x1="12" y1="3" x2="12" y2="21" stroke="currentColor" strokeWidth="1.5" />
        <line x1="9.5" y1="12" x2="11" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="13" y1="12" x2="14.5" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
    전자키: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 8V6a4 4 0 1 1 8 0v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="14.5" r="1.5" fill="currentColor" />
      </svg>
    ),
    인터넷: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <path d="M5 12.55a11 11 0 0 1 14.08 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="12" cy="20" r="1.2" fill="currentColor" />
      </svg>
    ),
    주차: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M9 17V8h4a3 3 0 0 1 0 6H9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    애완동물가능: (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="currentColor">
        <ellipse cx="32" cy="44" rx="18" ry="11" />
        <circle cx="32" cy="26" r="12" />
        <ellipse cx="20" cy="14" rx="6" ry="8" transform="rotate(-15 20 14)" />
        <ellipse cx="44" cy="14" rx="6" ry="8" transform="rotate(15 44 14)" />
        <ellipse cx="25" cy="28" rx="2.5" ry="1.8" fill="white" />
        <ellipse cx="39" cy="28" rx="2.5" ry="1.8" fill="white" />
        <circle cx="25.5" cy="28" r="1.2" fill="#333" />
        <circle cx="39.5" cy="28" r="1.2" fill="#333" />
        <ellipse cx="32" cy="33" rx="3.5" ry="2" />
        <rect x="22" y="53" width="6" height="9" rx="3" />
        <rect x="36" y="53" width="6" height="9" rx="3" />
      </svg>
    ),
    반려동물_가능: (
      <svg width={s} height={s} viewBox="0 0 64 64" fill="currentColor">
        <ellipse cx="32" cy="44" rx="18" ry="11" />
        <circle cx="32" cy="26" r="12" />
        <ellipse cx="20" cy="14" rx="6" ry="8" transform="rotate(-15 20 14)" />
        <ellipse cx="44" cy="14" rx="6" ry="8" transform="rotate(15 44 14)" />
        <ellipse cx="25" cy="28" rx="2.5" ry="1.8" fill="white" />
        <ellipse cx="39" cy="28" rx="2.5" ry="1.8" fill="white" />
        <circle cx="25.5" cy="28" r="1.2" fill="#333" />
        <circle cx="39.5" cy="28" r="1.2" fill="#333" />
        <ellipse cx="32" cy="33" rx="3.5" ry="2" />
        <rect x="22" y="53" width="6" height="9" rx="3" />
        <rect x="36" y="53" width="6" height="9" rx="3" />
      </svg>
    ),
    애완동물불가: (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <line x1="5" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  };
  return icons[name] ?? <span className="text-[10px] leading-none">{name.slice(0, 1)}</span>;
};

const OPTION_ICONS: Record<string, string> = {
  냉장고: "냉장고",
  세탁기: "세탁기",
  드럼세탁기: "드럼세탁기",
  건조기: "건조기",
  스타일러: "스타일러",
  TV: "TV",
  유선TV: "유선TV",
  에어컨: "에어컨",
  가스레인지: "가스레인지",
  인덕션: "인덕션",
  전자레인지: "전자레인지",
  침대: "침대",
  책상: "책상",
  옷장: "옷장",
  전자키: "전자키",
  수도: "수도",
  인터넷: "인터넷",
  주차: "주차",
  CCTV: "CCTV",
  애완동물가능: "애완동물가능",
  애완동물불가: "애완동물불가",
  반려동물_가능: "반려동물_가능",
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
  number2?: string | null; // 소유주 2번째 연락처
}

/* 카카오 스타일 SVG 아이콘 */

const ContactIcon = forwardRef<SVGSVGElement, { type: string; active?: boolean }>(({ type, active }, ref) => {
  const color = active ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))";

  if (type === "owner")
    return (
      <svg ref={ref} width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
          fill={color}
        />
      </svg>
    );

  if (type === "manager")
    return (
      <svg ref={ref} width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" fill={color} />
        <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke={color} strokeWidth="2" />
      </svg>
    );

  if (type === "tenant")
    return (
      <svg ref={ref} width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="7" r="3.5" fill={color} />
        <path d="M5 20C5 16.134 8.134 13 12 13C15.866 13 19 16.134 19 20H5Z" fill={color} />
      </svg>
    );

  if (type === "broker")
    return (
      <svg ref={ref} width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="2.5" fill={color} />
      </svg>
    );

  return <svg ref={ref} />; // 🔥 중요 (null 금지)
});

ContactIcon.displayName = "ContactIcon";

const ContactEmojiRow = forwardRef<HTMLDivElement, ContactEmojiRowProps>(({ propId, type, number, number2 }, ref) => {
  const label = type === "owner" ? "소유주" : type === "tenant" ? "세입자" : type === "broker" ? "부동산" : "관리인";

  const [revealed, setRevealed] = useState(() => !!number && hasRevealedToday(propId, type));
  const [showPopup, setShowPopup] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [popupPos, setPopupPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const popupId = useMemo(() => `${propId}-${type}-${Math.random().toString(36).slice(2, 8)}`, [propId, type]);

  // 다른 연락처 팝업이 열리면 이 팝업 닫기
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail !== popupId) setShowPopup(false);
    };
    window.addEventListener("contact-popup-open", handler);
    return () => window.removeEventListener("contact-popup-open", handler);
  }, [popupId]);

  const typeColor: Record<string, string> = {
    owner: "hsl(var(--primary))",
    manager: "hsl(217 91% 60%)",
    tenant: "hsl(142 71% 45%)",
    broker: "hsl(25 95% 53%)",
  };

  if (!number) {
    return (
      <div
        ref={ref}
        className="flex-1 flex flex-col items-center justify-center border-b border-border/20 last:border-b-0 opacity-25 select-none"
      >
        <ContactIcon type={type} />
        <span className="text-[8px] text-muted-foreground mt-0.5 leading-none">{label}</span>
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!revealed) {
      markRevealed(propId, type);
      setRevealed(true);
    }
    if (!showPopup && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPopupPos({ top: rect.top + rect.height / 2, left: rect.right + 4 });
      // 다른 연락처 팝업 닫도록 알림
      window.dispatchEvent(new CustomEvent("contact-popup-open", { detail: popupId }));
    }
    setShowPopup((v) => !v);
  };

  return (
    <div
      ref={ref}
      className="flex-1 flex flex-col items-center justify-center border-b border-border/20 last:border-b-0 relative"
    >
      <button
        ref={btnRef}
        type="button"
        onClick={handleClick}
        title={label}
        className="flex flex-col items-center justify-center w-full h-full rounded transition-colors hover:bg-primary/10 group"
      >
        <span
          className="flex items-center justify-center w-5 h-5 rounded-full transition-all group-hover:scale-110"
          style={{ background: `${typeColor[type]}18` }}
        >
          <ContactIcon type={type} active />
        </span>
        <span className="text-[8px] mt-0.5 leading-none font-semibold" style={{ color: typeColor[type] }}>
          {label}
        </span>
      </button>

      {showPopup && ReactDOM.createPortal(
        <div
          className="fixed z-[9999] bg-white border border-border rounded-xl shadow-xl px-3 py-2 flex flex-col gap-1.5 whitespace-nowrap"
          style={{ top: popupPos.top, left: popupPos.left, transform: "translateY(-50%)", boxShadow: "0 4px 20px hsl(var(--primary)/0.15)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 첫 번째 연락처 */}
          <div className="flex items-center gap-2">
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
              style={{ background: `${typeColor[type]}20` }}
            >
              <ContactIcon type={type} active />
            </span>
            <span className="text-[9px] font-bold" style={{ color: typeColor[type] }}>
              {label}
            </span>
            <a
              href={`tel:${number}`}
              className="text-[12px] font-extrabold text-foreground hover:text-primary transition-colors tracking-tight"
            >
              {number}
            </a>
            {!number2 && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowPopup(false); }}
                className="ml-0.5 w-4 h-4 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors"
              >
                <X className="w-2.5 h-2.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* 두 번째 연락처 (소유주2) */}
          {number2 && (
            <div className="flex items-center gap-2">
              <span
                className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
                style={{ background: `${typeColor[type]}20` }}
              >
                <ContactIcon type={type} active />
              </span>
              <span className="text-[9px] font-bold" style={{ color: typeColor[type] }}>
                {label}2
              </span>
              <a
                href={`tel:${number2}`}
                className="text-[12px] font-extrabold text-foreground hover:text-primary transition-colors tracking-tight"
              >
                {number2}
              </a>
              <button
                onClick={(e) => { e.stopPropagation(); setShowPopup(false); }}
                className="ml-0.5 w-4 h-4 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors"
              >
                <X className="w-2.5 h-2.5 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
});

ContactEmojiRow.displayName = "ContactEmojiRow";

/* ── MemoNotepad ── DB 기반 사용자별 메모 (같은 사무소+관리자 열람 가능) */
interface MemoNotepadProps {
  propertyDbId: string | undefined; // DB UUID
  propId: number; // fallback for localStorage (non-DB properties)
  memoKey: string; // "building" | "room"
  icon: React.ReactNode;
  label: string;
  initialText: string; // 기존 property 테이블의 메모 (관리자용)
  userId?: string;
  isAdmin?: boolean;
}
const MemoNotepad = forwardRef<HTMLDivElement, MemoNotepadProps>(
  ({ propertyDbId, propId, memoKey, icon, label, initialText, userId, isAdmin }, ref) => {
    const [open, setOpen] = useState(false);
    const [myText, setMyText] = useState("");
    const [otherMemos, setOtherMemos] = useState<Array<{ user_id: string; content: string; name?: string }>>([]);
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // DB에서 메모 로드
    useEffect(() => {
      if (!open || !propertyDbId || !userId) return;
      setLoaded(false);
      (async () => {
        const { data } = await supabase
          .from("property_user_memos")
          .select("user_id, content")
          .eq("property_id", propertyDbId)
          .eq("memo_type", memoKey);

        if (data) {
          const mine = data.find((m) => m.user_id === userId);
          setMyText(mine?.content ?? "");
          const others = data.filter((m) => m.user_id !== userId && m.content.trim());
          // 작성자 이름 가져오기
          if (others.length > 0) {
            const userIds = others.map((m) => m.user_id);
            const { data: profiles } = await supabase
              .from("agent_profiles")
              .select("user_id, name")
              .in("user_id", userIds);
            const nameMap = new Map(profiles?.map((p) => [p.user_id, p.name]) ?? []);
            setOtherMemos(others.map((m) => ({ ...m, name: nameMap.get(m.user_id) ?? "알 수 없음" })));
          } else {
            setOtherMemos([]);
          }
        }
        setLoaded(true);
      })();
    }, [open, propertyDbId, userId, memoKey]);

    // 수동 저장
    const handleSave = async () => {
      if (!propertyDbId || !userId) return;
      setSaving(true);
      await supabase.from("property_user_memos").upsert(
        { property_id: propertyDbId, user_id: userId, memo_type: memoKey, content: myText },
        { onConflict: "property_id,user_id,memo_type" }
      );
      setSaving(false);
      setSaved(true);
    };
    const [saved, setSaved] = useState(false);

    // 비 DB 매물은 localStorage 폴백
    const isDbProp = !!propertyDbId;
    const storageKey = `memo_${propId}_${memoKey}`;
    const fallbackText = !isDbProp ? (localStorage.getItem(storageKey) ?? initialText) : "";

    const hasMemoContent = !!(initialText?.trim()) || !!(myText?.trim());

    return (
      <div ref={ref} className="relative inline-flex">
        <button
          type="button"
          title={label}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="w-5 h-5 flex items-center justify-center hover:scale-125 transition-transform select-none flex-shrink-0 rounded"
          style={{
            background: hasMemoContent ? "hsl(var(--destructive)/0.12)" : "hsl(var(--primary)/0.08)",
            border: hasMemoContent ? "2px solid hsl(var(--destructive))" : "1px solid hsl(var(--primary)/0.2)",
          }}
        >
          {icon}
        </button>
        {hasMemoContent && (
          <span
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white"
            style={{ background: "hsl(var(--destructive))" }}
          />
        )}

        {open && (
          <>
            <div
              className="fixed inset-0 z-[8999]"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
            />

            <div
              className="fixed z-[9000] bg-white border border-border rounded-xl shadow-2xl w-[300px]"
              onClick={(e) => e.stopPropagation()}
              style={{
                boxShadow: "0 8px 32px rgba(10,45,110,0.22)",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-primary/5 rounded-t-xl">
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-1 text-sm leading-none">{icon}</span>
                  <span className="text-[11px] font-bold text-foreground">{label}</span>
                  {saving && <span className="text-[9px] text-muted-foreground ml-1">저장 중...</span>}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                  }}
                  className="w-4 h-4 rounded-full bg-destructive hover:bg-destructive/80 flex items-center justify-center"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>

              <div className="p-2.5 space-y-2">
                {/* 내 메모 */}
                <div>
                  <p className="text-[10px] font-bold text-primary mb-1">내 메모</p>
                  {isDbProp ? (
                    <textarea
                      autoFocus
                      value={loaded ? myText : "불러오는 중..."}
                      onChange={(e) => setMyText(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={`${label}를 입력하세요...`}
                      rows={4}
                      disabled={!loaded}
                      className="w-full text-[11px] resize-none outline-none bg-muted/50 border border-border rounded-lg px-2.5 py-2"
                    />
                  ) : (
                    <textarea
                      autoFocus
                      value={fallbackText}
                      onChange={(e) => {
                        localStorage.setItem(storageKey, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      placeholder={`${label}를 입력하세요...`}
                      rows={4}
                      className="w-full text-[11px] resize-none outline-none bg-muted/50 border border-border rounded-lg px-2.5 py-2"
                    />
                  )}
                  {/* 저장 버튼 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                    if (isDbProp) {
                        handleSave().then(() => setOpen(false));
                      } else {
                        setSaved(true);
                        setTimeout(() => { setSaved(false); setOpen(false); }, 800);
                      }
                    }}
                    disabled={saving}
                    className="w-full mt-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                    style={{
                      background: saved ? "hsl(var(--stat-green, 142 71% 45%))" : "hsl(var(--primary))",
                      color: "white",
                    }}
                  >
                    {saving ? "저장 중..." : saved ? "✓ 저장 완료" : "저장"}
                  </button>
                </div>



                {/* 등록된 매물 메모 (관리자/등록자가 입력) */}
                {initialText?.trim() && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">등록 메모</p>
                    <div className="text-[11px] text-foreground bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 whitespace-pre-wrap">
                      {initialText}
                    </div>
                  </div>
                )}

                {/* 같은 사무소 다른 회원 메모 */}
                {otherMemos.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground mb-1">사무소 메모</p>
                    {otherMemos.map((m, i) => (
                      <div key={i} className="text-[11px] text-foreground bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-2 mb-1 whitespace-pre-wrap">
                        <span className="text-[10px] font-bold text-blue-600">{m.name}</span>
                        <p className="mt-0.5">{m.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  },
);

MemoNotepad.displayName = "MemoNotepad";

/* ── ErrorReportModal ── */
interface ErrorReportModalProps {
  prop: MapProperty;
  onClose: () => void;
}
const ErrorReportModal = ({ prop, onClose }: ErrorReportModalProps) => {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSend = async () => {
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;

      let proposerName: string | null = null;
      let proposerCompany: string | null = null;
      let proposerPhone: string | null = null;
      if (userId) {
        const { data: profile } = await supabase
          .from("agent_profiles")
          .select("name, agency_name, phone")
          .eq("user_id", userId)
          .maybeSingle();
        if (profile) {
          proposerName = profile.name;
          proposerCompany = profile.agency_name;
          proposerPhone = profile.phone;
        }
      }

      const propertyId = prop.dbId || String(prop.id);
      const { error } = await supabase.from("property_reports").insert({
        property_id: propertyId,
        property_title: prop.title || prop.address,
        property_address: prop.address,
        report_type: "error_report",
        submitted_by: userId,
        proposer_name: proposerName,
        proposer_company: proposerCompany,
        proposer_phone: proposerPhone,
        error_content: text.trim() || null,
      });
      if (error) throw error;
      setSent(true);
    } catch (e) {
      console.error("제보 저장 실패:", e);
      alert("제보 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[10050] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10051] bg-card rounded-2xl shadow-2xl flex flex-col"
        style={{ width: "min(420px, 92vw)", maxHeight: "88vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-border rounded-t-2xl flex-shrink-0"
          style={{ background: "hsl(var(--destructive)/0.06)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--destructive)/0.12)" }}
            >
              <AlertCircle className="w-4 h-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">오류 제보</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[280px]">
                {prop.buildingName ?? prop.title} {prop.unitNumber ?? ""}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {sent ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--chart-2)/0.1)" }}>
              <CheckCircle className="w-7 h-7" style={{ color: "hsl(var(--chart-2))" }} />
            </div>
            <p className="text-sm font-bold text-foreground">제보가 접수되었습니다</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">관리자가 검토 후 처리할 예정입니다.</p>
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
              <p className="text-muted-foreground">
                호수: {prop.unitNumber ?? "-"} · {prop.floor} · {prop.area}
              </p>
            </div>

            {/* 내용 (선택사항) */}
            <div>
              <p className="text-[11px] font-semibold text-foreground mb-1.5">
                오류 내용 <span className="text-muted-foreground font-normal">(선택)</span>
              </p>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="어떤 오류가 있는지 작성해 주세요."
                rows={4}
                className="w-full text-[12px] text-foreground leading-7 resize-none outline-none px-3 pt-2 pb-2 rounded-xl border border-border placeholder:text-muted-foreground/40"
                style={{ background: "hsl(var(--muted)/0.3)" }}
              />
            </div>

            {/* 전송 버튼 */}
            <button
              onClick={handleSend}
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "hsl(var(--destructive))", color: "#fff" }}
            >
              <Send className="w-4 h-4" />
              {saving ? "제출 중..." : "제보하기"}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

/* ── DealCompleteModal ── */
interface DealCompleteModalProps {
  prop: MapProperty;
  onClose: () => void;
  onComplete?: (propId: string) => void;
}
const DealCompleteModal = ({ prop, onClose, onComplete }: DealCompleteModalProps) => {
  const [dealDate, setDealDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id ?? null;

      // 제보자 프로필 조회
      let proposerName: string | null = null;
      let proposerCompany: string | null = null;
      let proposerPhone: string | null = null;
      if (userId) {
        const { data: profile } = await supabase
          .from("agent_profiles")
          .select("name, agency_name, phone")
          .eq("user_id", userId)
          .maybeSingle();
        if (profile) {
          proposerName = profile.name;
          proposerCompany = profile.agency_name;
          proposerPhone = profile.phone;
        }
      }

      const propertyId = prop.dbId || String(prop.id);
      const { error } = await supabase.from("property_reports").insert({
        property_id: propertyId,
        property_title: prop.title || prop.address,
        property_address: prop.address,
        report_type: "deal_complete",
        deal_date: dealDate,
        deal_memo: memo.trim() || null,
        submitted_by: userId,
        proposer_name: proposerName,
        proposer_company: proposerCompany,
        proposer_phone: proposerPhone,
      });
      if (error) throw error;
      setDone(true);
      const pid = prop.dbId || String(prop.id);
      onComplete?.(pid);
    } catch (e) {
      console.error("거래완료 저장 실패:", e);
      alert("처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[10050] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10051] bg-card border border-border rounded-2xl shadow-2xl flex flex-col"
        style={{ width: "min(400px, 92vw)", maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0"
          style={{ background: "hsl(var(--primary) / 0.08)" }}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            <h3 className="text-sm font-bold text-foreground">거래 완료 처리</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted/50">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        {done ? (
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle className="w-10 h-10" style={{ color: "hsl(var(--primary))" }} />
            <p className="text-sm font-bold text-foreground">거래완료가 접수되었습니다</p>
            <p className="text-xs text-muted-foreground">관리자가 확인 후 매물 상태를 변경합니다.</p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 rounded-full text-xs font-bold text-white"
              style={{ background: "hsl(var(--primary))" }}
            >
              확인
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-4">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">대상 매물</p>
                <p className="text-xs font-semibold text-foreground truncate">{prop.title}</p>
                <p className="text-[11px] text-muted-foreground">{prop.address}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">거래 완료일</label>
                <input
                  type="date"
                  value={dealDate}
                  onChange={(e) => setDealDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground outline-none focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-foreground">메모 (선택)</label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="특이사항이 있다면 입력하세요."
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="px-5 py-4 flex-shrink-0 border-t border-border">
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full h-10 rounded-full text-sm font-bold text-white transition-all disabled:opacity-50"
                style={{ background: "hsl(var(--primary))" }}
              >
                {saving ? "처리 중..." : "확인"}
              </button>
            </div>
          </>
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
    try {
      return JSON.parse(localStorage.getItem(storageKey) ?? "[]");
    } catch {
      return [];
    }
  });

  // 새로 선택(미리보기)된 파일들 (아직 저장 안 됨)
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState("");
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [pendingDragIdx, setPendingDragIdx] = useState<number | null>(null);
  const [pendingOverIdx, setPendingOverIdx] = useState<number | null>(null);

  // 저장된 사진 드래그 순서 변경
  const handleSavedDragStart = (e: React.DragEvent, i: number) => { setDragIdx(i); e.dataTransfer.effectAllowed = "move"; };
  const handleSavedDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setOverIdx(i); };
  const handleSavedDrop = async (e: React.DragEvent, dropI: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === dropI) { setDragIdx(null); setOverIdx(null); return; }
    const arr = [...savedPhotos];
    const [moved] = arr.splice(dragIdx, 1);
    arr.splice(dropI, 0, moved);
    if (isDBProperty) {
      await supabase.rpc("update_property_images", { _property_id: dbId, _images: arr });
    } else {
      localStorage.setItem(storageKey, JSON.stringify(arr));
    }
    setSavedPhotos(arr);
    onImagesUpdated?.(arr);
    setDragIdx(null); setOverIdx(null);
  };
  const handleSavedDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  // 대기 사진 드래그 순서 변경
  const handlePendingDragStart = (e: React.DragEvent, i: number) => { setPendingDragIdx(i); e.dataTransfer.effectAllowed = "move"; };
  const handlePendingDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setPendingOverIdx(i); };
  const handlePendingDrop = (e: React.DragEvent, dropI: number) => {
    e.preventDefault();
    if (pendingDragIdx === null || pendingDragIdx === dropI) { setPendingDragIdx(null); setPendingOverIdx(null); return; }
    const arrF = [...pendingFiles]; const [mf] = arrF.splice(pendingDragIdx, 1); arrF.splice(dropI, 0, mf);
    const arrP = [...pendingPreviews]; const [mp] = arrP.splice(pendingDragIdx, 1); arrP.splice(dropI, 0, mp);
    setPendingFiles(arrF); setPendingPreviews(arrP);
    setPendingDragIdx(null); setPendingOverIdx(null);
  };
  const handlePendingDragEnd = () => { setPendingDragIdx(null); setPendingOverIdx(null); };

  // 파일 선택 → 미리보기만 생성
  const handleSelectFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    const previews = await Promise.all(arr.map(readFileAsDataURL));
    setPendingFiles((prev) => [...prev, ...arr]);
    setPendingPreviews((prev) => [...prev, ...previews]);
    setSaved(false);
  };

  // 대기 사진 제거 (저장 전)
  const removePending = (idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
    setPendingPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // 대표사진 설정 (해당 사진을 배열 첫 번째로 이동)
  const setMainPhoto = async (idx: number) => {
    if (idx === 0) return;
    const next = [savedPhotos[idx], ...savedPhotos.filter((_, i) => i !== idx)];
    if (isDBProperty) {
      await supabase.rpc("update_property_images", { _property_id: dbId, _images: next });
    } else {
      localStorage.setItem(storageKey, JSON.stringify(next));
    }
    setSavedPhotos(next);
    onImagesUpdated?.(next);
  };

  // 저장된 사진 제거
  const removeSaved = async (idx: number) => {
    const url = savedPhotos[idx];
    if (isDBProperty) {
      const bucketBase = supabase.storage.from("property-images").getPublicUrl("").data.publicUrl.replace(/\/$/, "");
      const filePath = url.replace(bucketBase + "/", "");
      await supabase.storage.from("property-images").remove([filePath]);
      const next = savedPhotos.filter((_, i) => i !== idx);
      await supabase.rpc("update_property_images", { _property_id: dbId, _images: next });
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
        const { error } = await supabase.storage.from("property-images").upload(path, file, { upsert: false });
        if (!error) {
          const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
          newUrls.push(urlData.publicUrl);
        }
      }
      const merged = [...savedPhotos, ...newUrls];
      const { error: updateErr } = await supabase.rpc("update_property_images", { _property_id: dbId, _images: merged });
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
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-border rounded-t-2xl flex-shrink-0"
          style={{ background: "hsl(var(--primary)/0.05)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--primary)/0.1)" }}
            >
              <Camera className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">사진 등록</p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[340px]">
                {prop.buildingName ?? prop.title} · {prop.address}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {/* 파일 선택 드롭존 */}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleSelectFiles(e.target.files)}
          />
          <button
            disabled={saving}
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed rounded-xl py-5 flex flex-col items-center gap-1.5 transition-colors disabled:opacity-50"
            style={{ borderColor: "hsl(var(--primary)/0.3)" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary)/0.6)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "hsl(var(--primary)/0.3)")}
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
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: "hsl(var(--accent)/0.12)", color: "hsl(var(--accent))" }}
                >
                  {pendingPreviews.length}장
                </span>
                <span className="text-[10px] text-muted-foreground">— 드래그로 순서 변경</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {pendingPreviews.map((src, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => handlePendingDragStart(e, idx)}
                    onDragOver={(e) => handlePendingDragOver(e, idx)}
                    onDrop={(e) => handlePendingDrop(e, idx)}
                    onDragEnd={handlePendingDragEnd}
                    className="relative aspect-square rounded-xl overflow-hidden group border-2 cursor-grab active:cursor-grabbing"
                    style={{ borderColor: pendingOverIdx === idx ? "hsl(var(--primary))" : "hsl(var(--accent)/0.4)", opacity: pendingDragIdx === idx ? 0.4 : 1 }}
                  >
                    <img src={src} alt="" className="w-full h-full object-cover pointer-events-none" />
                    <button
                      onClick={() => removePending(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <span
                      className="absolute bottom-0 inset-x-0 text-center text-[8px] font-semibold text-white py-0.5"
                      style={{ background: "hsl(var(--accent)/0.7)" }}
                    >
                      미저장
                    </span>
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
                <span
                  className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                  style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}
                >
                  {savedPhotos.length}장
                </span>
                <span className="text-[10px] text-muted-foreground">— 드래그로 순서 변경</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {savedPhotos.map((src, idx) => (
                  <div
                    key={idx}
                    draggable
                    onDragStart={(e) => handleSavedDragStart(e, idx)}
                    onDragOver={(e) => handleSavedDragOver(e, idx)}
                    onDrop={(e) => handleSavedDrop(e, idx)}
                    onDragEnd={handleSavedDragEnd}
                    className="relative aspect-square rounded-xl overflow-hidden group border-2 transition-all cursor-grab active:cursor-grabbing"
                    style={{ borderColor: overIdx === idx ? "hsl(var(--accent))" : idx === 0 ? "hsl(var(--primary))" : "hsl(var(--border))", opacity: dragIdx === idx ? 0.4 : 1 }}
                  >
                    {idx === 0 ? (
                      <span
                        className="absolute top-1 left-1 z-10 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full"
                        style={{ background: "hsl(var(--primary))" }}
                      >
                        ⭐ 대표
                      </span>
                    ) : (
                      <button
                        onClick={() => setMainPhoto(idx)}
                        className="absolute top-1 left-1 z-10 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.4)" }}
                      >
                        대표설정
                      </button>
                    )}
                    <img src={src} alt="" className="w-full h-full object-cover pointer-events-none" />
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
interface UnitRow {
  id: string;
  unitNumber: string;
  type: string;
  floor: string;
  area: string;
  deposit: string;
  monthly: string;
  status: string; // 공실 | 임차중 | 기타
}
interface MortgageRow {
  id: string;
  creditor: string;
  amount: string;
}

interface LeaseProposalModalProps {
  prop: MapProperty;
  allProperties: MapProperty[];
  onClose: () => void;
  isAdmin?: boolean;
}
const LeaseProposalModal = ({ prop, allProperties, onClose, isAdmin }: LeaseProposalModalProps) => {
  const todayStr = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  const handlePrint = () => window.print();

  // 같은 주소(address)의 모든 호실 — 매매 타입 제외
  const sameBuilding = allProperties
    .filter((p) => p.address === prop.address && !p.type.includes("매매"))
    .sort((a, b) => (a.unitNumber ?? "").localeCompare(b.unitNumber ?? "", "ko"));
  const base = sameBuilding[0] ?? prop;

  // ── 편집 가능 상태 ──
  const [buildingInfoRows, setBuildingInfoRows] = useState<[string, string][]>([
    ["소재지", base.address],
    ["건물명", base.buildingName ?? base.title],
    ["건축연도", base.buildYear ?? ""],
    ["총 층수", base.totalFloors ?? ""],
    ["주차", base.parking ?? ""],
    ["엘리베이터", base.elevator ? "있음" : "없음"],
    ["관리비", base.manageFee ?? ""],
  ]);

  // ── 건축물대장 데이터 자동 로드 ──
  useEffect(() => {
    const loadBuildingSummary = async () => {
      if (!prop.dbId) return;
      try {
        const { data: bs } = await supabase
          .from("building_summary")
          .select("*")
          .eq("property_id", prop.dbId)
          .maybeSingle();
        if (bs) {
          setBuildingInfoRows([
            ["소재지", base.address],
            ["건물명", base.buildingName || bs.building_name || base.title],
            ["주용도", bs.main_purpose || ""],
            ["사용승인일", bs.approval_date || ""],
            ["연면적", bs.total_area ? `${bs.total_area}㎡` : ""],
            ["건축면적", bs.building_area ? `${bs.building_area}㎡` : ""],
            ["대지면적", bs.land_area ? `${bs.land_area}㎡` : ""],
            ["지상층수", bs.floors_above || base.totalFloors || ""],
            ["지하층수", bs.floors_below || ""],
            ["주차대수", bs.parking_count || base.parking || ""],
            ["엘리베이터", bs.elevator ? "있음" : "없음"],
            ["관리비", base.manageFee ?? ""],
          ]);
        }
      } catch (e) {
        console.warn("건축물대장 로드 실패:", e);
      }
    };
    loadBuildingSummary();
  }, [prop.dbId]);

  const PROPOSAL_PREFIX = "__PROPOSAL_JSON__";
  const defaultUnits = (): UnitRow[] =>
    sameBuilding.map((p) => ({
      id: String(p.id),
      unitNumber: p.unitNumber ?? "",
      type: p.type,
      floor: p.floor ?? "",
      area: p.area ?? "",
      deposit: p.deposit ?? "",
      monthly: p.monthly ?? "",
      status: p.availableFrom === "공실" ? "공실" : "임차중",
    }));

  // 저장된 제안서가 있으면 로드, 없으면 sameBuilding 기반 자동 생성
  const initial = (() => {
    const memo = prop.buildingMemo ?? "";
    if (memo.startsWith(PROPOSAL_PREFIX)) {
      try {
        const parsed = JSON.parse(memo.slice(PROPOSAL_PREFIX.length));
        return {
          units: parsed.units ?? [],
          mortgages: parsed.mortgages ?? [{ id: "1", creditor: "", amount: "" }],
          totalDeposit: parsed.totalDeposit ?? "",
          totalMortgage: parsed.totalMortgage ?? "",
          note: parsed.note ?? "",
          loaded: true,
        };
      } catch {
        // fallthrough
      }
    }
    return {
      units: defaultUnits(),
      mortgages: [{ id: "1", creditor: "", amount: "" }] as MortgageRow[],
      totalDeposit: "",
      totalMortgage: "",
      note: memo,
      loaded: false,
    };
  })();

  const [units, setUnits] = useState<UnitRow[]>(initial.units);
  const [mortgages, setMortgages] = useState<MortgageRow[]>(initial.mortgages);
  const [totalDepositInput, setTotalDepositInput] = useState(initial.totalDeposit);
  const [totalMortgageInput, setTotalMortgageInput] = useState(initial.totalMortgage);
  const [note, setNote] = useState(initial.note);
  const [saved, setSaved] = useState(false);

  // 호실 편집
  const updateUnit = (idx: number, key: keyof UnitRow, val: string) =>
    setUnits((prev) => prev.map((u, i) => (i === idx ? { ...u, [key]: val } : u)));
  const addUnit = () =>
    setUnits((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        unitNumber: "",
        type: "",
        floor: "",
        area: "",
        deposit: "",
        monthly: "",
        status: "공실",
      },
    ]);
  const removeUnit = (idx: number) => setUnits((prev) => prev.filter((_, i) => i !== idx));

  // 근저당 편집
  const updateMortgage = (idx: number, key: keyof MortgageRow, val: string) =>
    setMortgages((prev) => prev.map((m, i) => (i === idx ? { ...m, [key]: val } : m)));
  const addMortgage = () => setMortgages((prev) => [...prev, { id: Date.now().toString(), creditor: "", amount: "" }]);
  const removeMortgage = (idx: number) => setMortgages((prev) => prev.filter((_, i) => i !== idx));

  // 건물현황 편집
  const updateBuildingRow = (idx: number, val: string) =>
    setBuildingInfoRows((prev) => prev.map((r, i) => (i === idx ? [r[0], val] : r)));

  // 저장 (구조화된 JSON으로 building_memo에 저장)
  const handleSave = async () => {
    if (!prop.dbId) {
      alert("저장할 매물 ID가 없습니다.");
      return;
    }
    const payload = {
      units,
      mortgages,
      totalDeposit: totalDepositInput,
      totalMortgage: totalMortgageInput,
      note,
      buildingInfoRows,
    };
    const content = PROPOSAL_PREFIX + JSON.stringify(payload);
    const { error } = await supabase.from("properties").update({ building_memo: content }).eq("id", prop.dbId);
    if (error) {
      alert("저장 실패: " + error.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // 삭제 (DB에서도 완전 초기화)
  const handleDelete = async () => {
    if (!confirm("임대현황 내용을 초기화하시겠습니까?")) return;
    if (!prop.dbId) {
      alert("삭제할 매물 ID가 없습니다.");
      return;
    }
    const { error } = await supabase.from("properties").update({ building_memo: null }).eq("id", prop.dbId);
    if (error) {
      alert("삭제 실패: " + error.message);
      return;
    }
    setUnits([]);
    setMortgages([{ id: "1", creditor: "", amount: "" }]);
    setTotalDepositInput("");
    setTotalMortgageInput("");
    setNote("");
    alert("임대현황이 초기화되었습니다.");
  };

  const ic =
    "px-2 py-1 text-[11px] border border-border rounded bg-background text-foreground outline-none focus:border-primary w-full";

  return (
    <>
      <div className="fixed inset-0 z-[10050] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[10051] bg-white rounded-2xl shadow-2xl flex flex-col"
        style={{ width: "min(760px, 96vw)", maxHeight: "94vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">임대현황</p>
              <p className="text-[10px] text-muted-foreground">{isAdmin ? "직접 수정 후 저장할 수 있습니다" : "열람 전용"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 text-[11px] font-bold bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors"
            >
              🖨️ 인쇄
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                  style={{ background: "hsl(var(--primary))", color: "#fff" }}
                >
                  {saved ? "✓ 저장됨" : "💾 저장"}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                  style={{ background: "hsl(var(--destructive) / 0.12)", color: "hsl(var(--destructive))" }}
                  title="저장된 임대현황 초기화"
                >
                  🗑 삭제
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 타이틀 */}
          <div className="bg-primary rounded-xl px-6 py-4 text-center">
            <p className="text-base font-extrabold tracking-widest text-primary-foreground">임 대 제 안 서</p>
            <p className="text-[10px] text-primary-foreground/60 mt-0.5">{todayStr}</p>
          </div>

          {/* ① 건물 현황 - 편집 가능 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-primary rounded-full" />
              <p className="text-[12px] font-extrabold text-foreground">건물 현황</p>
            </div>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-[11px]">
                <tbody>
                  {buildingInfoRows.map(([label, value], i) => (
                    <tr key={label} className={i % 2 === 0 ? "bg-muted/30" : "bg-white"}>
                      <td className="px-3 py-1.5 font-semibold text-muted-foreground w-[90px] whitespace-nowrap border-r border-border/40">
                        {label}
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => updateBuildingRow(i, e.target.value)}
                          className={ic}
                          readOnly={!isAdmin}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ② 호수별 임대 현황 - 편집 가능 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-accent rounded-full" />
                <p className="text-[12px] font-extrabold text-foreground">호수별 임대 현황</p>
                <span className="text-[10px] text-muted-foreground">총 {units.length}개 호실</span>
              </div>
              {isAdmin && (
              <button
                onClick={addUnit}
                className="text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}
              >
                + 호실 추가
              </button>
              )}
            </div>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="px-2 py-2 text-left font-bold whitespace-nowrap">호수</th>
                    <th className="px-2 py-2 text-left font-bold whitespace-nowrap">유형</th>
                    <th className="px-2 py-2 text-left font-bold whitespace-nowrap">층</th>
                    <th className="px-2 py-2 text-left font-bold whitespace-nowrap">면적</th>
                    <th className="px-2 py-2 text-right font-bold whitespace-nowrap">보증금</th>
                    <th className="px-2 py-2 text-right font-bold whitespace-nowrap">월임대료</th>
                    <th className="px-2 py-2 text-center font-bold whitespace-nowrap w-[28px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {units.map((u, i) => (
                    <tr key={u.id} className={`border-t border-border/40 ${i % 2 === 0 ? "bg-white" : "bg-muted/20"}`}>
                      <td className="px-1 py-1">
                        <input
                          value={u.unitNumber}
                          onChange={(e) => updateUnit(i, "unitNumber", e.target.value)}
                          className={ic}
                          placeholder="호수"
                          readOnly={!isAdmin}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          value={u.type}
                          onChange={(e) => updateUnit(i, "type", e.target.value)}
                          className={ic}
                          placeholder="유형"
                          readOnly={!isAdmin}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          value={u.floor}
                          onChange={(e) => updateUnit(i, "floor", e.target.value)}
                          className={ic}
                          placeholder="층"
                          readOnly={!isAdmin}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          value={u.area}
                          onChange={(e) => updateUnit(i, "area", e.target.value)}
                          className={ic}
                          placeholder="면적"
                          readOnly={!isAdmin}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          value={u.deposit}
                          onChange={(e) => updateUnit(i, "deposit", e.target.value)}
                          className={ic + " text-right"}
                          placeholder="보증금"
                          readOnly={!isAdmin}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          value={u.monthly}
                          onChange={(e) => updateUnit(i, "monthly", e.target.value)}
                          className={ic + " text-right"}
                          placeholder="월세"
                          readOnly={!isAdmin}
                        />
                      </td>
                      <td className="px-1 py-1 text-center">
                        {isAdmin && (
                        <button
                          onClick={() => removeUnit(i)}
                          className="w-5 h-5 rounded-full bg-destructive/10 hover:bg-destructive flex items-center justify-center text-destructive hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* 보증금 합계 행 */}
                  <tr className="border-t-2 border-primary/30 bg-primary/5">
                    <td colSpan={4} className="px-3 py-2 text-right font-extrabold text-[11px] text-foreground">
                      보증금 합계
                    </td>
                    <td className="px-1 py-1" colSpan={2}>
                      <input
                        type="text"
                        value={totalDepositInput}
                        onChange={(e) => setTotalDepositInput(e.target.value)}
                        placeholder="합계 직접 입력"
                        className={ic + " text-right font-extrabold"}
                        style={{ borderColor: "hsl(var(--primary)/0.5)" }}
                        readOnly={!isAdmin}
                      />
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ③ 근저당 내역 - 편집 가능 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full" style={{ background: "hsl(0 85% 55%)" }} />
                <p className="text-[12px] font-extrabold text-foreground">근저당 내역</p>
              </div>
              {isAdmin && (
              <button
                onClick={addMortgage}
                className="text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
                style={{ background: "hsl(0 85% 96%)", color: "hsl(0 85% 45%)" }}
              >
                + 내역 추가
              </button>
              )}
            </div>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-[11px]">
                <thead>
                  <tr style={{ background: "hsl(0 85% 55%)" }} className="text-white">
                    <th className="px-3 py-2 text-left font-bold">채권자</th>
                    <th className="px-3 py-2 text-right font-bold">금액 (만원)</th>
                    <th className="px-2 py-2 w-[28px]"></th>
                  </tr>
                </thead>
                <tbody>
                  {mortgages.map((m, i) => (
                    <tr key={m.id} className={`border-t border-border/40 ${i % 2 === 0 ? "bg-white" : "bg-muted/20"}`}>
                      <td className="px-1 py-1">
                        <input
                          value={m.creditor}
                          onChange={(e) => updateMortgage(i, "creditor", e.target.value)}
                          className={ic}
                          placeholder="채권자명"
                          readOnly={!isAdmin}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          value={m.amount}
                          onChange={(e) => updateMortgage(i, "amount", e.target.value)}
                          className={ic + " text-right"}
                          placeholder="금액"
                          readOnly={!isAdmin}
                        />
                      </td>
                      <td className="px-1 py-1 text-center">
                        {isAdmin && (
                        <button
                          onClick={() => removeMortgage(i)}
                          className="w-5 h-5 rounded-full bg-destructive/10 hover:bg-destructive flex items-center justify-center text-destructive hover:text-white transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {/* 근저당 합계 행 */}
                  <tr className="border-t-2 bg-red-50" style={{ borderColor: "hsl(0 85% 75%)" }}>
                    <td className="px-3 py-2 text-right font-extrabold text-[11px] text-foreground">근저당 합계</td>
                    <td className="px-1 py-1">
                      <input
                        type="text"
                        value={totalMortgageInput}
                        onChange={(e) => setTotalMortgageInput(e.target.value)}
                        placeholder="합계 직접 입력"
                        className={ic + " text-right font-extrabold"}
                        style={{ borderColor: "hsl(0 85% 65%)" }}
                        readOnly={!isAdmin}
                      />
                    </td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ④ 특이사항 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-4 bg-muted-foreground/40 rounded-full" />
              <p className="text-[12px] font-extrabold text-foreground">특이사항</p>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="특이사항 등을 입력하세요"
              className="w-full px-3 py-2 text-[11px] rounded-xl border border-border bg-muted/20 text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary resize-none transition-colors"
              readOnly={!isAdmin}
            />
          </div>

          {/* 하단 저장 버튼 - 관리자만 */}
          {isAdmin && (
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
              style={{ background: "hsl(var(--primary))", color: "#fff" }}
            >
              💾 {saved ? "저장 완료!" : "저장하기"}
            </button>
          </div>
          )}
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
    if (!revealed) {
      markRevealed(propId, label);
      setRevealed(true);
    }
    setShowNum((v) => !v);
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
  isDealCompleted?: boolean;
}
const AddressToggleCard = forwardRef<HTMLDivElement, AddressToggleCardProps & { isAdmin?: boolean; userId?: string; listScrollRef?: React.RefObject<HTMLDivElement>; agencyInfo?: AgencyInfo; fallbackImage?: string; isMobile?: boolean; onOpenPhotos?: () => void; onOpenContacts?: () => void; hasReferencePhotos?: boolean }>(
  ({ prop, idx, buildingMemo, roomMemo, buildingPw, roomPw, regDate, chkDate, isAdmin, userId, isDealCompleted, listScrollRef, agencyInfo, fallbackImage, isMobile, onOpenPhotos, onOpenContacts, hasReferencePhotos }, ref) => {
    const [checking, setChecking] = useState(false);
    const isChecked = !!chkDate;

    const handleCheckToggle = async (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!isAdmin) return; // 관리자만 체크 가능
      if (!prop.memo) return; // DB 매물만 가능
      if (checking) return;
      // 스크롤 위치 보존
      const scrollEl = listScrollRef.current;
      const savedScroll = scrollEl?.scrollTop ?? 0;
      setChecking(true);
      // 토글: 확인일이 있으면 null로 초기화, 없으면 오늘로 설정
      const newCheckedDate = isChecked ? null : new Date().toISOString().slice(0, 10);
      await supabase.from("properties").update({ checked_date: newCheckedDate }).eq("id", prop.memo);
      setChecking(false);
      // 리렌더 후 스크롤 위치 복원 (realtime refetch 대기)
      const restore = () => { if (scrollEl) scrollEl.scrollTop = savedScroll; };
      requestAnimationFrame(restore);
      setTimeout(restore, 100);
      setTimeout(restore, 300);
      setTimeout(restore, 600);
    };
    const [showFullAddr, setShowFullAddr] = useState(false);
    const [showVacateInfo, setShowVacateInfo] = useState(false);
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

    const handleRoadviewOpen = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      if (!prop.lat || !prop.lng) {
        window.open(`https://map.kakao.com/?q=${encodeURIComponent(prop.address)}`, "_blank");
        return;
      }

      const popup = window.open("", "kakao-roadview-window", "width=" + screen.width + ",height=" + screen.height + ",left=0,top=0");
      if (!popup) {
        alert("팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.");
        return;
      }

      const payload = JSON.stringify({
        title: prop.buildingName ?? prop.title ?? "로드뷰",
        address: prop.address,
        lat: prop.lat,
        lng: prop.lng,
      }).replace(/</g, "\\u003c");

      const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${prop.buildingName ?? prop.title ?? "로드뷰"}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%;
      background: #f8fafc;
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", system-ui, sans-serif;
      letter-spacing: -0.01em;
      overflow: hidden;
      -webkit-font-smoothing: antialiased;
    }
    body { display: flex; flex-direction: column; }
    .toolbar {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(15,23,42,0.06);
      color: #0f172a; z-index: 10; flex-shrink: 0;
    }
    .toolbar h1 {
      font-size: 15px; font-weight: 700; flex: 1;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      color: #0f172a; letter-spacing: -0.02em;
    }
    .toolbar .addr {
      font-size: 12px; font-weight: 500; color: #64748b;
      margin-left: 10px; letter-spacing: -0.01em;
    }
    .toolbar button {
      padding: 8px 16px; border-radius: 10px; border: none;
      font-size: 13px; font-weight: 600; cursor: pointer;
      letter-spacing: -0.01em;
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
    }
    .toolbar button:hover { transform: translateY(-1px); }
    .btn-rv {
      background: #eff6ff; color: #2563eb;
      box-shadow: inset 0 0 0 1px #dbeafe;
    }
    .btn-rv.active {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: #fff;
      box-shadow: 0 4px 12px rgba(37,99,235,0.35);
    }
    .btn-map {
      background: #ecfdf5; color: #059669;
      box-shadow: inset 0 0 0 1px #d1fae5;
    }
    .btn-map.active {
      background: linear-gradient(135deg, #10b981, #059669);
      color: #fff;
      box-shadow: 0 4px 12px rgba(5,150,105,0.35);
    }
    .btn-close {
      background: #fef2f2; color: #dc2626;
      box-shadow: inset 0 0 0 1px #fecaca;
    }
    .btn-close:hover {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #fff;
      box-shadow: 0 4px 12px rgba(220,38,38,0.35);
    }
    .content { flex: 1; display: flex; position: relative; min-height: 0; background: #0f172a; }
    .panel { flex: 1; min-width: 0; min-height: 0; position: relative; }
    .panel.hidden { display: none; }
    #roadview, #map { width: 100%; height: 100%; }
    #status {
      position: absolute; inset: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px;
      background: rgba(15,23,42,0.94);
      backdrop-filter: blur(8px);
      color: #fff; text-align: center; padding: 24px; z-index: 5;
    }
    #status strong { font-size: 16px; font-weight: 700; letter-spacing: -0.01em; }
    #status span { font-size: 13px; color: #94a3b8; font-weight: 500; }
    .divider { width: 4px; background: #334155; cursor: col-resize; flex-shrink: 0; }
    .rv-pin {
      position: relative;
      display: flex; flex-direction: column; align-items: center;
      pointer-events: none;
      filter: drop-shadow(0 8px 18px rgba(15,23,42,0.55));
      animation: rv-pin-float 2.4s ease-in-out infinite;
    }
    @keyframes rv-pin-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    .rv-pin .pin-label {
      background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%);
      color: #fff;
      padding: 7px 14px 7px 12px;
      border-radius: 999px;
      font-size: 12px; font-weight: 700;
      letter-spacing: 0.02em;
      white-space: nowrap;
      border: 2px solid rgba(255,255,255,0.95);
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
      display: inline-flex; align-items: center; gap: 6px;
      box-shadow: 0 4px 14px rgba(59,130,246,0.45);
    }
    .rv-pin .pin-label .pin-ico {
      display: inline-flex; align-items: center; justify-content: center;
      width: 16px; height: 16px;
      border-radius: 50%;
      background: rgba(255,255,255,0.25);
      font-size: 10px;
    }
    .rv-pin .pin-tail {
      width: 0; height: 0;
      border-left: 9px solid transparent;
      border-right: 9px solid transparent;
      border-top: 13px solid #6366f1;
      margin-top: -1px;
    }
    .rv-pin .pin-dot {
      width: 16px; height: 16px;
      border-radius: 50%;
      background: radial-gradient(circle at 30% 30%, #c4b5fd, #6366f1 60%, #4338ca);
      border: 3px solid #fff;
      margin-top: 3px;
      box-shadow: 0 0 0 4px rgba(99,102,241,0.25);
    }
    @media (max-width: 640px) {
      .toolbar { padding: 10px 14px; gap: 6px; }
      .toolbar h1 { font-size: 13px; }
      .toolbar .addr { display: none; }
      .toolbar button { padding: 7px 12px; font-size: 12px; border-radius: 8px; }
      .rv-pin .pin-label { font-size: 11px; padding: 6px 12px; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <h1>${prop.buildingName ?? prop.title ?? "로드뷰"}<span class="addr">${prop.address}</span></h1>
    <button class="btn-rv active" id="btnRv" onclick="toggleView('rv')">로드뷰</button>
    <button class="btn-map" id="btnMap" onclick="toggleView('map')">지도</button>
    <button class="btn-close" onclick="window.close()">닫기</button>
  </div>
  <div class="content">
    <div class="panel" id="rvPanel">
      <div id="roadview"></div>
      <div id="status"><strong>가장 가까운 로드뷰를 찾는 중입니다.</strong><span>주변 도로를 자동 탐색하고 있습니다.</span></div>
    </div>
    <div class="panel hidden" id="mapPanel">
      <div id="map"></div>
    </div>
  </div>
  <script>
    var data, radii, statusEl, roadviewEl, mapEl, rvPanel, mapPanel, btnRv, btnMap, mapInstance, currentView, roadview;
    var sdkLoadAttempts = 0;
    var roadviewInitAttempts = 0;
    var MAX_SDK_ATTEMPTS = 4;
    var MAX_ROADVIEW_ATTEMPTS = 2;
    var SDK_TIMEOUT = 10000;
    var PANO_TIMEOUT = 4500;

    function setStatus(title, desc, showFallback) {
      var html = "<strong>" + title + "</strong><span>" + desc + "</span>";
      if (showFallback) {
        html += '<span style="margin-top:12px;"><a href="https://map.kakao.com/link/roadview/' + data.lat + ',' + data.lng + '" target="_blank" style="color:#60a5fa;text-decoration:underline;font-size:13px;">카카오맵에서 로드뷰 열기 →</a></span>';
      }
      statusEl.innerHTML = html;
      statusEl.style.display = "flex";
    }

    function toggleView(mode) {
      if (mode === "rv") {
        if (currentView === "rv") return;
        currentView = "rv";
      } else if (mode === "map") {
        if (currentView === "map") { currentView = "rv"; }
        else if (currentView === "rv") { currentView = "both"; }
        else { currentView = "rv"; }
      }

      rvPanel.classList.toggle("hidden", currentView === "map");
      mapPanel.classList.toggle("hidden", currentView === "rv");
      btnRv.classList.toggle("active", currentView === "rv" || currentView === "both");
      btnMap.classList.toggle("active", currentView === "map" || currentView === "both");

      setTimeout(function() {
        if (currentView !== "map" && roadview) try { roadview.relayout(); } catch(e) {}
        if (currentView !== "rv") {
          if (!mapInstance) initMap();
          else try { mapInstance.relayout(); } catch(e) {}
        }
      }, 100);
    }

    function initMap() {
      var pos = new kakao.maps.LatLng(data.lat, data.lng);
      mapInstance = new kakao.maps.Map(mapEl, { center: pos, level: 3 });
      new kakao.maps.Marker({ position: pos, map: mapInstance });
      var iwContent = '<div style="padding:8px 12px;font-size:12px;font-weight:700;color:#0f172a;font-family:Pretendard,-apple-system,BlinkMacSystemFont,Apple SD Gothic Neo,Malgun Gothic,sans-serif;letter-spacing:-0.01em;white-space:nowrap;">' +
        (data.title ? '<div style="color:#2563eb;font-size:11px;margin-bottom:2px;">' + data.title + '</div>' : '') +
        '<div>' + data.address + '</div></div>';
      var infowindow = new kakao.maps.InfoWindow({ content: iwContent, removable: false });
      infowindow.open(mapInstance, new kakao.maps.Marker({ position: pos, map: mapInstance }));
      mapInstance.addControl(new kakao.maps.ZoomControl(), kakao.maps.ControlPosition.RIGHT);
      mapInstance.addControl(new kakao.maps.MapTypeControl(), kakao.maps.ControlPosition.TOPRIGHT);
    }

    function initRoadview() {
      data = ${payload};
      radii = [30, 50, 100, 200, 400, 800, 1500, 3000];
      statusEl = document.getElementById("status");
      roadviewEl = document.getElementById("roadview");
      mapEl = document.getElementById("map");
      rvPanel = document.getElementById("rvPanel");
      mapPanel = document.getElementById("mapPanel");
      btnRv = document.getElementById("btnRv");
      btnMap = document.getElementById("btnMap");
      mapInstance = null;
      currentView = "rv";

      try {
        roadviewInitAttempts++;
        var position = new kakao.maps.LatLng(data.lat, data.lng);
        roadview = new kakao.maps.Roadview(roadviewEl);
        var roadviewClient = new kakao.maps.RoadviewClient();

        // 로드뷰 init 이벤트: 파노라마 이미지 안의 실제 좌표 위치에 핀 마커 표시
        kakao.maps.event.addListener(roadview, 'init', function() {
          try {
            var pinContent = '<div class="rv-pin">' +
              '<div class="pin-label"><span class="pin-ico">📍</span>현위치</div>' +
              '<div class="pin-tail"></div>' +
              '<div class="pin-dot"></div>' +
            '</div>';

            var pinOverlay = new kakao.maps.CustomOverlay({
              position: position,
              content: pinContent,
              xAnchor: 0.5,
              yAnchor: 1,
            });
            // 사람 시야 높이(약 2m) 정도 위에 띄워 잘 보이도록
            try { pinOverlay.setAltitude(2); } catch(e) {}
            pinOverlay.setMap(roadview);

            // 시점을 핀 위치로 자동 회전 (어디인지 바로 보이도록)
            try {
              var projection = roadview.getProjection();
              var viewpoint = projection.viewpointFromCoords(
                pinOverlay.getPosition(),
                pinOverlay.getAltitude ? pinOverlay.getAltitude() : 2
              );
              roadview.setViewpoint(viewpoint);
            } catch(e) {}
          } catch(e) {}
        });

        var searchNearest = function(index) {
          if (index === undefined) index = 0;
          var radius = radii[index];
          setStatus("가장 가까운 로드뷰를 찾는 중입니다.", radius + "m 반경까지 탐색 중");

          var settled = false;
          var timer = setTimeout(function() {
            if (settled) return;
            settled = true;
            // 응답 지연 시 다음 반경으로 진행
             if (index < radii.length - 1) {
              searchNearest(index + 1);
            } else {
               if (roadviewInitAttempts < MAX_ROADVIEW_ATTEMPTS) {
                 setStatus("로드뷰 응답이 지연되고 있습니다.", "자동으로 다시 연결하고 있습니다.");
                 setTimeout(initRoadview, 900);
               } else {
                 setStatus("로드뷰 응답이 지연되고 있습니다.", "잠시 후 다시 시도해주세요.", true);
               }
            }
          }, PANO_TIMEOUT);

          try {
            roadviewClient.getNearestPanoId(position, radius, function (panoId) {
              if (settled) return;
              settled = true;
              clearTimeout(timer);
              if (panoId) {
                try {
                  roadview.setPanoId(panoId, position);
                  statusEl.style.display = "none";
                  setTimeout(function () {
                    try { roadview.relayout(); } catch (e) {}
                  }, 120);
                } catch (e) {
                  setStatus("로드뷰 표시에 실패했습니다.", "카카오맵에서 직접 확인해주세요.", true);
                }
                return;
              }
              if (index < radii.length - 1) {
                searchNearest(index + 1);
                return;
              }
               if (roadviewInitAttempts < MAX_ROADVIEW_ATTEMPTS) {
                 setStatus("주변 로드뷰를 다시 찾고 있습니다.", "탐색 범위를 다시 확인 중입니다.");
                 setTimeout(initRoadview, 900);
                 return;
               }
               setStatus("주변에서 로드뷰를 찾지 못했습니다.", "이 위치에는 표시 가능한 로드뷰가 없습니다.", true);
            });
          } catch (e) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
             if (roadviewInitAttempts < MAX_ROADVIEW_ATTEMPTS) {
               setStatus("로드뷰 요청 중 오류가 발생했습니다.", "자동으로 다시 연결하고 있습니다.");
               setTimeout(initRoadview, 900);
               return;
             }
             setStatus("로드뷰 요청 중 오류가 발생했습니다.", "카카오맵에서 직접 확인해주세요.", true);
          }
        };

        searchNearest();
      } catch (error) {
         if (roadviewInitAttempts < MAX_ROADVIEW_ATTEMPTS) {
           setStatus("로드뷰를 불러오는 중입니다.", "초기화를 다시 시도하고 있습니다.");
           setTimeout(initRoadview, 900);
           return;
         }
         setStatus("로드뷰를 불러오지 못했습니다.", "잠시 후 다시 시도해주세요.", true);
      }
    }

    function loadSdk() {
      sdkLoadAttempts++;
      if (window.__kakaoRvLoaderPromise) {
        window.__kakaoRvLoaderPromise.then(initRoadview).catch(function() {
          setStatus("카카오 지도 SDK를 불러오지 못했습니다.", "네트워크를 확인하거나 카카오맵에서 직접 확인해주세요.", true);
        });
        return;
      }
      window.__kakaoRvLoaderPromise = new Promise(function(resolve, reject) {
        if (window.kakao && window.kakao.maps) {
          try {
            kakao.maps.load(function() { resolve(window.kakao.maps); });
            return;
          } catch (e) {}
        }

        var existing = document.getElementById("kakao-sdk-rv");
        if (existing) existing.parentNode.removeChild(existing);

        var sdkScript = document.createElement("script");
        sdkScript.id = "kakao-sdk-rv";
        sdkScript.src = "https://dapi.kakao.com/v2/maps/sdk.js?appkey=9b1ab990830e8319b8bafb3104e5ae50&autoload=false&libraries=services";
        sdkScript.async = true;

        var settled = false;
        var loadTimer = setTimeout(function() {
          if (settled) return;
          settled = true;
          sdkScript.remove();
          reject(new Error("timeout"));
        }, SDK_TIMEOUT);

        sdkScript.onload = function() {
          if (settled) return;
          try {
            kakao.maps.load(function() {
              if (settled) return;
              settled = true;
              clearTimeout(loadTimer);
              resolve(window.kakao.maps);
            });
          } catch (e) {
            settled = true;
            clearTimeout(loadTimer);
            reject(e);
          }
        };
        sdkScript.onerror = function() {
          if (settled) return;
          settled = true;
          clearTimeout(loadTimer);
          sdkScript.remove();
          reject(new Error("load_error"));
        };
        document.head.appendChild(sdkScript);
      }).then(function() {
        return initRoadview();
      }).catch(function(error) {
        window.__kakaoRvLoaderPromise = null;
         if (sdkLoadAttempts < MAX_SDK_ATTEMPTS) {
          setStatus("SDK 로딩 재시도 중...", "시도 " + (sdkLoadAttempts + 1) + "/" + MAX_SDK_ATTEMPTS);
           setTimeout(loadSdk, sdkLoadAttempts * 800);
          return;
        }
        setStatus("카카오 지도 SDK를 불러오지 못했습니다.", "네트워크를 확인하거나 카카오맵에서 직접 확인해주세요.", true);
        throw error;
      });
    }

    // 초기 statusEl 참조 + data 미리 세팅 (fallback 링크용)
    statusEl = document.getElementById("status");
    data = ${payload};
    loadSdk();
  </script>
</body>
</html>`;

      popup.document.open();
      popup.document.write(html);
      popup.document.close();
      popup.focus();
    };

    // 면적에서 평수만 추출 (예: "49㎡ (15.2평)" → "15.2평", "15" → "15평", "19.2평" → "19.2평")
    const pyeong = prop.area?.match(/\((\d+(?:\.\d+)?)평\)/) ?? prop.area?.match(/(\d+(?:\.\d+)?)\s*평/);
    const rawArea = pyeong ? pyeong[1] + "평" : prop.area ? prop.area.split(" ")[0] : "";
    const areaShort = rawArea && /^\d+(?:\.\d+)?$/.test(rawArea) ? rawArea + "평" : rawArea;
    // floor에서 층 숫자만 (예: "3층" → "3F")
    const floorShort = prop.floor ? prop.floor.replace(/층/g, "F").replace(/지상\s*/g, "") : "";
    // 연락처 버튼 목록
    const contacts: {
      label: string;
      short: string;
      num: string;
      color: React.CSSProperties;
      border: React.CSSProperties;
    }[] = [];
    if (prop.contactOwner)
      contacts.push({
        label: "건물주",
        short: "건물주",
        num: prop.contactOwner,
        color: { background: "#dcfce7", color: "#15803d", borderColor: "#86efac" },
        border: { background: "transparent", color: "#15803d", borderColor: "#86efac" },
      });
    if (prop.contactManager)
      contacts.push({
        label: "관리인",
        short: "관리인",
        num: prop.contactManager,
        color: { background: "#dbeafe", color: "#1d4ed8", borderColor: "#93c5fd" },
        border: { background: "transparent", color: "#1d4ed8", borderColor: "#93c5fd" },
      });
    if (prop.contact)
      contacts.push({
        label: "부동산",
        short: prop.agentName ? `${prop.agentName.slice(0, 3)}문의` : "부동산",
        num: prop.contact,
        color: { background: "#fff7ed", color: "#c2410c", borderColor: "#fdba74" },
        border: { background: "transparent", color: "#c2410c", borderColor: "#fdba74" },
      });

    // 모바일: 컴팩트 3행 레이아웃 (사용자 요청 사양)
    if (isMobile) {
      const buildYr = prop.buildYear ? prop.buildYear.replace(/[^0-9]/g, "").slice(0, 4) : "";
      const hasOwnPhotos = (prop.images && prop.images.length > 0) || (prop.image && prop.image.length > 0);
      const hasPhotos = hasOwnPhotos || !!hasReferencePhotos;
      const note = prop.note ?? "";
      const wolseMatch = note.match(/월세: 보증금 ([^\n/]+)만원 \/ 월세 ([^\n]+)만원/);
      const halfMatch = note.match(/반전세: 보증금 ([^\n/]+)만원 \/ 월세 ([^\n]+)만원/);
      const jeonseMatch = note.match(/전세: 보증금 ([^\n]+)만원/);
      const isSaleProp = note.includes("매매가:") || (!prop.monthly && !!prop.deposit);
      // 부가시설 아이콘 수집
      const opts = prop.options ?? [];
      const normalizedOpts = new Set(opts.map((o) => String(o).replace(/\s+/g, "").toLowerCase()));
      const hasOpt = (...c: string[]) => c.some((x) => normalizedOpts.has(x.replace(/\s+/g, "").toLowerCase()));
      const facilityBadges: JSX.Element[] = [];
      const fIcon = "flex-shrink-0 flex items-center justify-center w-6 h-6 rounded";
      const fImg = "w-5 h-5 object-contain";
      const fStyle = { imageRendering: '-webkit-optimize-contrast' as any };
      if (prop.elevator || hasOpt("엘리베이터"))
        facilityBadges.push(<span key="el" title="엘리베이터" className={fIcon} style={{ background: "#e0f2fe", border: "1px solid #7dd3fc" }}><img src={elevatorIcon} alt="" className={fImg} style={fStyle} /></span>);
      if (hasOpt("반려동물불가", "애완동물불가"))
        facilityBadges.push(<span key="pd" title="반려동물 불가" className={`${fIcon} relative`} style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}><img src={petIcon} alt="" className={fImg} style={fStyle} /><span className="absolute inset-0 flex items-center justify-center pointer-events-none"><svg width="20" height="20" viewBox="0 0 20 20"><line x1="3" y1="3" x2="17" y2="17" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" /></svg></span></span>);
      else if (hasOpt("반려동물가능", "애완동물가능"))
        facilityBadges.push(<span key="po" title="반려동물 가능" className={fIcon} style={{ background: "#fff7ed", border: "1px solid #fdba74" }}><img src={petIcon} alt="" className={fImg} style={fStyle} /></span>);
      ([
        ["수도", waterIcon, "#eff6ff", "#93c5fd"],
        ["인터넷", internetIcon, "#f0fdf4", "#86efac"],
        ["유선TV", tvIcon, "#faf5ff", "#d8b4fe"],
        ["CCTV", cctvIcon, "#fef2f2", "#fca5a5"],
        ["리모델링", remodelingIcon, "#fff7ed", "#fdba74"],
        ["여성전용", femaleOnlyIcon, "#fdf2f8", "#f9a8d4"],
      ] as const).forEach(([opt, src, bg, br]) => {
        if (!hasOpt(opt)) return;
        facilityBadges.push(<span key={opt} title={opt} className={fIcon} style={{ background: bg, border: `1px solid ${br}` }}><img src={src} alt="" className={fImg} style={fStyle} /></span>);
      });
      const FULL_OPT = ["냉장고", "세탁기", "에어컨", "TV", "전자레인지", "인터넷", "가스레인지", "수도"];
      const isFull = opts.includes("풀옵션") || FULL_OPT.every((o) => opts.includes(o));

      // 동(棟), 퇴거일, 중도퇴거, 거주중/공실 뱃지
      const dongMatch = note.match(/동\(棟\)[:\s]+([^\n|]+)/);
      const buildingDong = dongMatch?.[1]?.trim().replace(/동+\s*$/, "").trim();
      const earlyExit = note.includes("중도퇴거:");
      const isSalePropM = prop.type?.includes("매매");
      const vacancyM = !isSalePropM && prop.availableFrom && (prop.availableFrom === "공실" || prop.availableFrom === "세입자 거주중") ? prop.availableFrom : null;
      let vacatePast = false;
      let vacateLabel = "";
      if (prop.vacateDate) {
        const vacateStr = prop.vacateDate.replace(/[^0-9\-\/\.]/g, "").replace(/\./g, "-").replace(/\//g, "-");
        const vacateTime = new Date(vacateStr).getTime();
        vacatePast = !isNaN(vacateTime) && vacateTime < Date.now();
        if (!vacatePast && !isNaN(vacateTime)) vacateLabel = `퇴거 ${prop.vacateDate}`;
      }

      return (
        <div className="flex-1 min-w-0 flex flex-col px-2 py-1.5 gap-1">
          {/* 1행: 건물명 · 동(棟) · 주소(클릭→로드뷰) | 우측: 건물메모, 방메모 */}
          <div className="flex items-center gap-1 min-h-[22px]">
            <p className="text-[13px] font-extrabold text-foreground truncate leading-none flex-shrink min-w-0">
              {prop.buildingName ?? prop.title}
            </p>
            {/* 모바일에서 퇴거일/중도퇴거는 카드 선택 시 하단 액션 패널에 표시됨 */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowFullAddr((v) => !v); }}
              className="text-[11px] font-semibold whitespace-nowrap flex-shrink min-w-0 truncate underline decoration-dotted underline-offset-2"
              style={{ color: showFullAddr ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
              title="클릭하면 전체 주소 표시"
            >
              {showFullAddr ? prop.address : shortAddress(prop.address)}
            </button>
            {/* 로드뷰 버튼 */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRoadviewOpen(e); }}
              className="flex-shrink-0 px-1 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap"
              style={{ color: "hsl(var(--primary))", borderColor: "hsl(var(--primary)/0.3)" }}
            >
              로드뷰
            </button>
            {/* 도로명 버튼 (탭 시 도로명주소 모달 표시) */}
            {prop.roadAddress && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); alert(`도로명 주소\n\n${prop.roadAddress}`); }}
                className="flex-shrink-0 px-1 py-0.5 rounded text-[9px] font-bold border whitespace-nowrap"
                style={{ color: "hsl(var(--primary))", borderColor: "hsl(var(--primary)/0.3)" }}
                title={prop.roadAddress}
              >
                도로명
              </button>
            )}
            <span className="flex-1" />
            <MemoNotepad
              propertyDbId={prop.dbId || (prop.memo && prop.memo.length === 36 ? prop.memo : undefined)}
              propId={prop.id}
              memoKey="building"
              icon={<img src={memoIcon} alt="건물메모" className="w-3.5 h-3.5 object-contain" style={{ imageRendering: '-webkit-optimize-contrast' as any }} />}
              label="건물메모"
              initialText={buildingMemo ?? ""}
              userId={userId}
              isAdmin={isAdmin}
            />
            <MemoNotepad
              propertyDbId={prop.dbId || (prop.memo && prop.memo.length === 36 ? prop.memo : undefined)}
              propId={prop.id}
              memoKey="room"
              icon={<img src={memoIcon} alt="방메모" className="w-3.5 h-3.5 object-contain" style={{ imageRendering: '-webkit-optimize-contrast' as any }} />}
              label="방메모"
              initialText={roomMemo ?? ""}
              userId={userId}
              isAdmin={isAdmin}
            />
          </div>

          {/* 2행: 방유형(층)호수 · 가격 · 카메라 | 우측: 카카오톡 공유 */}
          <div className="flex items-center gap-1 flex-wrap min-h-[24px]">
            {(prop.type || floorShort || prop.unitNumber) && (
              <span className="flex-shrink-0 flex items-center gap-0.5 text-[12px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap" style={{ background: isDealCompleted ? "hsl(0 80% 95%)" : "hsl(var(--primary)/0.1)", color: isDealCompleted ? "hsl(0 70% 50%)" : "hsl(var(--primary))", border: `1.5px solid ${isDealCompleted ? "hsl(0 70% 70%)" : "hsl(var(--primary)/0.35)"}`, textDecoration: isDealCompleted ? "line-through" : "none" }}>
                {prop.type && <span>{prop.type}</span>}
                {prop.type === "원룸" && (prop.roomType === "오픈형" || prop.roomType === "분리형") && <span className="opacity-90">·{prop.roomType}</span>}
                {floorShort && <span className="opacity-80">({floorShort})</span>}
                {prop.unitNumber && <span>{buildingDong ? `${buildingDong}-${prop.unitNumber.replace(/호$/, "")}` : prop.unitNumber}</span>}
              </span>
            )}
            {/* 가격 */}
            {(wolseMatch || halfMatch || jeonseMatch) ? (
              <span className="flex-shrink-0 flex items-center gap-1 text-[12px] font-extrabold whitespace-nowrap">
                {wolseMatch && <span><span style={{ color: "hsl(var(--muted-foreground))" }}>월</span> {wolseMatch[1]}/<span style={{ color: "hsl(var(--accent))" }}>{wolseMatch[2]}</span></span>}
                {halfMatch && <span style={{ color: "#1d4ed8" }}>반{halfMatch[1]}/{halfMatch[2]}</span>}
                {jeonseMatch && <span style={{ color: "#15803d" }}>전{jeonseMatch[1]}</span>}
              </span>
            ) : (
              <span className="flex-shrink-0 flex items-center gap-0.5 whitespace-nowrap text-[12px] font-extrabold">
                {isSaleProp ? (
                  <><span style={{ color: "hsl(0 85% 55%)" }}>매</span><span style={{ color: "hsl(0 85% 45%)" }}>{prop.deposit}</span></>
                ) : (
                  <><span style={{ color: "hsl(var(--muted-foreground))" }}>월</span><span>{prop.deposit}</span><span style={{ color: "hsl(var(--border))" }}>/</span><span style={{ color: "hsl(var(--accent))" }}>{prop.monthly}</span></>
                )}
              </span>
            )}
            {/* 카메라 아이콘: 사진 있으면 진하게, 없으면 흰색. 클릭 시 사진 라이트박스 */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpenPhotos?.(); }}
              title={hasOwnPhotos ? "사진 보기" : hasReferencePhotos ? "다른 방 사진 보기" : "사진 없음"}
              className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded overflow-hidden transition-transform active:scale-95"
              style={{
                background: "transparent",
                border: "none",
                opacity: hasPhotos ? 1 : 0.4,
              }}
            >
              <img
                src={cameraIcon}
                alt="사진"
                className="w-8 h-8 object-contain"
                style={{ imageRendering: "auto", transform: "scale(1.35)" }}
                draggable={false}
              />
            </button>
            {/* 평수 표기 */}
            {prop.area && (
              <span className="flex-shrink-0 text-[11px] font-bold whitespace-nowrap" style={{ color: "hsl(var(--foreground)/0.75)" }}>
                {(() => {
                  const a = prop.area;
                  if (/평/.test(a)) return a;
                  const n = parseFloat(a.replace(/[^0-9.]/g, ""));
                  return !isNaN(n) && n > 0 ? `${(n / 3.3058).toFixed(1)}평` : a;
                })()}
              </span>
            )}
            <span className="flex-1" />
            {/* 카카오톡 공유 */}
            <button
              onClick={(e) => { e.stopPropagation(); sharePropertyToKakao(prop, agencyInfo, fallbackImage); }}
              title="카카오톡 공유"
              className="flex-shrink-0 flex items-center justify-center"
            >
              <img src={kakaoTalkIcon} alt="카카오톡 공유" className="w-8 h-8 object-contain" />
            </button>
          </div>

          {/* 3행: 준공년도 · 공실/거주중 · 부가시설 이모티콘 | 우측: 옵션(클릭 시 펼침) */}
          {(buildYr || vacancyM || vacatePast || facilityBadges.length > 0 || opts.length > 0) && (
            <div className="flex items-center gap-1 flex-wrap min-h-[24px]">
              {buildYr && (
                <span className="flex-shrink-0 text-[10px] font-black px-1 py-0.5 rounded whitespace-nowrap" style={{ background: "hsl(var(--primary)/0.12)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.3)", lineHeight: 1.2 }}>
                  준{buildYr}
                </span>
              )}
              {(vacancyM === "공실" || vacatePast) && (
                <span className="flex-shrink-0 text-[10px] font-extrabold px-1 py-0.5 rounded whitespace-nowrap" style={{ background: "hsl(142 70% 93%)", color: "hsl(142 60% 30%)", border: "1px solid hsl(142 60% 70%)" }}>
                  공실
                </span>
              )}
              {vacancyM === "세입자 거주중" && !vacatePast && (
                <span className="flex-shrink-0 text-[10px] font-extrabold px-1 py-0.5 rounded whitespace-nowrap" style={{ background: "hsl(38 95% 92%)", color: "hsl(25 90% 40%)", border: "1px solid hsl(38 80% 65%)" }}>
                  거주중
                </span>
              )}
              {facilityBadges}
              <span className="flex-1" />
              {opts.length > 0 && (
                <>
                  <div className="relative flex-shrink-0" onClick={(e) => { e.stopPropagation(); setShowOptPopup((v) => !v); }}>
                    {isFull ? (
                      <span className="flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap select-none" style={{ background: "linear-gradient(90deg, hsl(38 95% 88%), hsl(45 100% 82%))", color: "hsl(28 80% 35%)", border: "1.5px solid hsl(38 80% 70%)" }}>
                        풀옵션
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap select-none" style={{ background: "hsl(var(--muted))", color: "hsl(var(--foreground)/0.65)", border: "1.5px solid hsl(var(--border))" }}>
                        옵션 ▾
                      </span>
                    )}
                  </div>
                  {showOptPopup && (
                    <div
                      className="fixed inset-0 z-[10400] flex items-end sm:items-center justify-center bg-black/40"
                      onClick={(e) => { e.stopPropagation(); setShowOptPopup(false); }}
                    >
                      <div
                        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-4 w-full sm:w-auto sm:max-w-md max-h-[80dvh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-xs font-extrabold mb-2 pb-1.5 border-b border-border" style={{ color: "hsl(var(--primary))" }}>
                          {isFull ? "풀옵션 구성" : `옵션 항목 (${opts.length}개)`}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5">
                          {opts.map((opt) => (
                            <span key={opt} className="text-[12px] font-semibold text-foreground whitespace-nowrap">· {opt}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {showVacateInfo && (vacateLabel || earlyExit) && (
            <div
              className="fixed inset-0 z-[10300] flex items-end justify-center"
              onClick={(e) => { e.stopPropagation(); setShowVacateInfo(false); }}
            >
              <div className="absolute inset-0 bg-black/40" />
              <div
                className="relative w-full bg-white rounded-t-2xl shadow-2xl p-4 pb-6 max-w-md animate-in slide-in-from-bottom"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-extrabold text-foreground">퇴거 정보</h3>
                  <button
                    type="button"
                    onClick={() => setShowVacateInfo(false)}
                    className="text-[12px] font-bold text-muted-foreground px-2 py-1 rounded hover:bg-muted"
                  >
                    닫기 ✕
                  </button>
                </div>
                <div className="space-y-2.5">
                  {prop.vacateDate && !vacatePast && (
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "hsl(0 85% 96%)", border: "1px solid hsl(0 85% 80%)" }}>
                      <span className="text-[13px] font-bold" style={{ color: "hsl(0 85% 35%)" }}>퇴거 예정일</span>
                      <span className="text-[14px] font-extrabold" style={{ color: "hsl(0 85% 35%)" }}>{prop.vacateDate}</span>
                    </div>
                  )}
                  {earlyExit && (
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "hsl(0 85% 96%)", border: "1px solid hsl(0 85% 80%)" }}>
                      <span className="text-[13px] font-bold" style={{ color: "hsl(0 85% 35%)" }}>세입자 중도퇴거</span>
                      <span className="text-[14px] font-extrabold" style={{ color: "hsl(0 85% 35%)" }}>가능</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex-1 min-w-0 flex flex-col md:border-l md:border-border/30 px-2 py-1 gap-0.5">
        {/* 1줄: 준YYYY | 건물명 | 주소(토글) | 로드뷰 → 확인/등록 */}
        <div className="flex items-center gap-1 overflow-hidden flex-nowrap min-h-[22px]">
          {prop.buildYear && (
            <span
              className="flex-shrink-0 text-[10px] font-black px-1 py-0.5 whitespace-nowrap rounded"
              style={{
                background: "hsl(var(--primary) / 0.12)",
                color: "hsl(var(--primary))",
                border: "1px solid hsl(var(--primary) / 0.3)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              준{prop.buildYear.replace(/[^0-9]/g, "").slice(0, 4)}
            </span>
          )}
          <p className="text-[13px] font-extrabold text-foreground truncate leading-none flex-shrink min-w-0">
            {prop.buildingName ?? prop.title}
          </p>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowFullAddr((v) => !v);
            }}
            className="text-[12px] font-semibold whitespace-nowrap flex-shrink-0 transition-colors underline decoration-dotted underline-offset-2"
            style={{ color: showFullAddr ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
            title="클릭하면 전체 주소 표시"
          >
            {showFullAddr ? prop.address : shortAddress(prop.address)}
          </button>
          {/* 로드뷰 버튼 */}
          <button
            type="button"
            onClick={handleRoadviewOpen}
            className="flex-shrink-0 px-1 py-0.5 rounded text-[9px] font-bold border transition-colors hover:bg-primary/10 whitespace-nowrap"
            style={{ color: "hsl(var(--primary))", borderColor: "hsl(var(--primary)/0.3)" }}
          >
            로드뷰
          </button>
          {/* 도로명 버튼 (hover 시 도로명주소 표시) */}
          {prop.roadAddress && (
            <span
              className="flex-shrink-0 px-1 py-0.5 rounded text-[9px] font-bold border transition-colors hover:bg-primary/10 whitespace-nowrap relative group/road cursor-default"
              style={{ color: "hsl(var(--primary))", borderColor: "hsl(var(--primary)/0.3)" }}
              title={prop.roadAddress}
            >
              도로명
              <span className="absolute left-0 bottom-full mb-1 hidden group-hover/road:block bg-foreground text-background text-[10px] font-medium px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
                {prop.roadAddress}
              </span>
            </span>
          )}
          <span className="flex-1" />
          <MemoNotepad
            propertyDbId={prop.dbId || (prop.memo && prop.memo.length === 36 ? prop.memo : undefined)}
            propId={prop.id}
            memoKey="building"
            icon={<img src={memoIcon} alt="건물메모" className="w-3.5 h-3.5 object-contain" style={{ imageRendering: '-webkit-optimize-contrast' as any }} />}
            label="건물메모"
            initialText={buildingMemo ?? ""}
            userId={userId}
            isAdmin={isAdmin}
          />
          <MemoNotepad
            propertyDbId={prop.dbId || (prop.memo && prop.memo.length === 36 ? prop.memo : undefined)}
            propId={prop.id}
            memoKey="room"
            icon={<img src={memoIcon} alt="방메모" className="w-3.5 h-3.5 object-contain" style={{ imageRendering: '-webkit-optimize-contrast' as any }} />}
            label="방메모"
            initialText={roomMemo ?? ""}
            userId={userId}
            isAdmin={isAdmin}
          />
          {/* 확인 체크박스 — 확인일 기준 경과일(D+N) 자동 표시 (모든 회원에게 표시, 수정은 관리자만) */}
          {
            prop.memo &&
            (() => {
              // 확인일(chkDate) 기준 경과일
              const daysSince = chkDate ? Math.floor((Date.now() - new Date(chkDate).getTime()) / 86400000) : null;
              // 등록일(regDate) 기준 경과일
              const daysFromReg = regDate ? Math.floor((Date.now() - new Date(regDate).getTime()) / 86400000) : null;
              // 경과일: 확인일 있으면 확인일 기준, 없으면 등록일 기준
              const displayDays = daysSince ?? daysFromReg;
              return (
                <button
                  type="button"
                  title={
                    isChecked
                      ? `확인: ${chkDate} (확인 후 ${daysSince}일) | 등록: ${regDate}`
                      : `등록: ${regDate} (${daysFromReg}일 경과) — 클릭하여 확인 완료 표시`
                  }
                  onClick={handleCheckToggle}
                  disabled={checking || !isAdmin}
                  className="flex-shrink-0 flex items-center gap-0.5 px-1 py-0.5 rounded transition-all select-none"
                  style={{
                    background: isChecked ? "hsl(142 70% 93%)" : "hsl(var(--muted))",
                    border: `1.5px solid ${isChecked ? "hsl(142 60% 65%)" : "hsl(var(--border))"}`,
                    opacity: checking ? 0.5 : 1,
                    cursor: isAdmin ? "pointer" : "default",
                  }}
                >
                  <img 
                      src={checkDateIcon} 
                      alt="확인" 
                      className="w-5 h-5 object-contain" 
                      style={{ imageRendering: '-webkit-optimize-contrast' as any, opacity: isChecked ? 1 : 0.4 }} 
                    />
                  {/* 확인일 기준 경과일 (D+N), 없으면 등록일 기준 */}
                  <span
                    className="text-[10px] font-black whitespace-nowrap tabular-nums"
                    style={{ color: isChecked ? "hsl(142 60% 30%)" : "hsl(var(--muted-foreground))" }}
                  >
                    {displayDays !== null ? displayDays : "?"}
                  </span>
                </button>
              );
            })()}
          {/* 등록일 (최초 등록일자) */}
          {regDate && (
            <span
              className="flex-shrink-0 text-[10px] font-bold whitespace-nowrap tabular-nums"
              style={{ color: "#111" }}
            >
              {regDate.slice(2).replace(/-/g, ".")}
            </span>
          )}
        </div>


        {/* 2줄: [세부유형 (층) 호수] | 보증금/월세 관리비 몇평 | 옵션 | 비번 */}
        <div className="flex items-center gap-0.5 flex-wrap min-h-[22px]">
          {/* 남향 뱃지 */}
          {prop.note && /남향|북향|동향|서향/.test(prop.note) && (
            <span
              className="flex-shrink-0 text-[10px] font-bold px-1 py-0.5 rounded whitespace-nowrap"
              style={{ background: "#fff3e0", color: "#e65100", border: "1px solid #ffcc80" }}
            >
              {prop.note.match(/[남북동서]향/)?.[0]}
            </span>
          )}
          {/* ① 유형 + 층 + 동 + 호수를 하나의 네모칸에 */}
          {(prop.type || floorShort || prop.unitNumber) && (
            <span
              className="flex-shrink-0 flex items-center gap-0.5 text-[12px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap"
              style={{
                background: isDealCompleted ? "hsl(0 80% 95%)" : "hsl(var(--primary)/0.1)",
                color: isDealCompleted ? "hsl(0 70% 50%)" : "hsl(var(--primary))",
                border: `1.5px solid ${isDealCompleted ? "hsl(0 70% 70%)" : "hsl(var(--primary)/0.35)"}`,
                textDecoration: isDealCompleted ? "line-through" : "none",
                textDecorationColor: isDealCompleted ? "hsl(0 80% 50%)" : undefined,
                textDecorationThickness: isDealCompleted ? "2px" : undefined,
              }}
            >
              {prop.type && <span>{prop.type}</span>}
              {prop.type === "원룸" && (prop.roomType === "오픈형" || prop.roomType === "분리형") && (
                <span className="opacity-90">·{prop.roomType}</span>
              )}
              {floorShort && <span className="opacity-80">({floorShort})</span>}
              {(() => {
                const m = (prop.note ?? "").match(/동\(棟\)[:\s]+([^\n|]+)/);
                return m ? <span className="opacity-80">{m[1].trim()}</span> : null;
              })()}
              {prop.unitNumber && <span>{prop.unitNumber}</span>}
            </span>
          )}
          {/* 카카오톡 공유 아이콘 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              sharePropertyToKakao(prop, agencyInfo, fallbackImage);
            }}
            title="카카오톡 공유"
            className="flex-shrink-0 flex items-center justify-center transition-colors"
          >
            <img src={kakaoTalkIcon} alt="카카오톡 공유" className="w-10 h-10 object-contain" />
          </button>
          {/* 구분선 */}
          {(prop.type || floorShort || prop.unitNumber) && <span className="flex-shrink-0 w-px h-3.5 bg-border" />}
          {/* ④ 보증금/월세/관리비/평수 — 텍스트 스타일 (박스 없음) */}
          {(() => {
            const note = prop.note ?? "";
            const wolseMatch = note.match(/월세: 보증금 ([^\n/]+)만원 \/ 월세 ([^\n]+)만원/);
            const halfMatch = note.match(/반전세: 보증금 ([^\n/]+)만원 \/ 월세 ([^\n]+)만원/);
            const jeonseMatch = note.match(/전세: 보증금 ([^\n]+)만원/);
            const hasMulti = wolseMatch || halfMatch || jeonseMatch;

            if (hasMulti) {
              return (
                <div className="flex items-center gap-1 flex-shrink-0" style={isDealCompleted ? { textDecoration: "line-through", textDecorationColor: "hsl(0 80% 50%)", textDecorationThickness: "2px" } : undefined}>
                  {wolseMatch && (
                    <span
                      className="flex-shrink-0 text-[12px] font-extrabold whitespace-nowrap"
                      style={{ color: "hsl(var(--foreground))" }}
                    >
                      <span style={{ color: "hsl(var(--muted-foreground))" }}>월</span> {wolseMatch[1]}/
                      <span style={{ color: "hsl(var(--accent))" }}>{wolseMatch[2]}</span>
                      {prop.manageFee && prop.manageFee !== "0" && prop.manageFee !== "-" && (
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>
                          {" "}/ 관 {prop.manageFee}
                        </span>
                      )}
                    </span>
                  )}
                  {halfMatch && (
                    <span
                      className="flex-shrink-0 text-[12px] font-extrabold whitespace-nowrap"
                      style={{ color: "#1d4ed8" }}
                    >
                      반{halfMatch[1]}/{halfMatch[2]}
                      {prop.manageFee && prop.manageFee !== "0" && prop.manageFee !== "-" && (
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>
                          {" "}/ 관 {prop.manageFee}
                        </span>
                      )}
                    </span>
                  )}
                  {jeonseMatch && (
                    <span
                      className="flex-shrink-0 text-[12px] font-extrabold whitespace-nowrap"
                      style={{ color: "#15803d" }}
                    >
                      전{jeonseMatch[1]}
                      {prop.manageFee && prop.manageFee !== "0" && prop.manageFee !== "-" && (
                        <span style={{ color: "hsl(var(--muted-foreground))" }}>
                          {" "}/ 관 {prop.manageFee}
                        </span>
                      )}
                    </span>
                  )}
                  {areaShort && (
                    <>
                      <span className="text-[11px]" style={{ color: "hsl(var(--border))" }}>
                        ·
                      </span>
                      <span className="text-[11px] font-extrabold" style={{ color: "hsl(25 90% 40%)" }}>
                        {areaShort}
                      </span>
                    </>
                  )}
                </div>
              );
            }

            // 매매 여부 판별: note에 매매가 포함되거나 monthly가 비어있고 deposit이 있는 경우
            const isSaleProp = note.includes("매매가:") || (!prop.monthly && !!prop.deposit);
            return (
              <span className="flex-shrink-0 flex items-center gap-0.5 whitespace-nowrap" style={isDealCompleted ? { textDecoration: "line-through", textDecorationColor: "hsl(0 80% 50%)", textDecorationThickness: "2px" } : undefined}>
                {isSaleProp ? (
                  <>
                    <span className="text-[11px] font-bold" style={{ color: "hsl(0 85% 55%)" }}>
                      매
                    </span>
                    <span className="text-[12px] font-extrabold" style={{ color: "hsl(0 85% 45%)" }}>
                      {prop.deposit}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[11px] font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>
                      월
                    </span>
                    <span className="text-[12px] font-extrabold" style={{ color: "hsl(var(--foreground))" }}>
                      {prop.deposit}
                    </span>
                    <span className="text-[11px]" style={{ color: "hsl(var(--border))" }}>
                      /
                    </span>
                    <span className="text-[12px] font-extrabold" style={{ color: "hsl(var(--accent))" }}>
                      {prop.monthly}
                    </span>
                    {prop.manageFee && prop.manageFee !== "0" && prop.manageFee !== "-" && (
                      <>
                        <span className="text-[11px] mx-0.5" style={{ color: "hsl(var(--border))" }}>
                          /
                        </span>
                        <span className="text-[11px] font-bold" style={{ color: "hsl(var(--muted-foreground))" }}>
                          관
                        </span>
                        <span className="text-[11px] font-extrabold" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {prop.manageFee}
                        </span>
                      </>
                    )}
                  </>
                )}
                {areaShort && (
                  <>
                    <span className="text-[11px] mx-0.5" style={{ color: "hsl(var(--border))" }}>
                      ·
                    </span>
                    <span className="text-[11px] font-extrabold" style={{ color: "hsl(25 90% 40%)" }}>
                      {areaShort}
                    </span>
                  </>
                )}
              </span>
            );
          })()}
          {/* ⑨ 매매 타입 — 대지·건평 명시 태그 */}
          {(() => {
            const isSale = prop.type?.includes("매매");
            if (!isSale) return null;
            const note = prop.note ?? "";
            const landM = note.match(/대지[:\s]+([^\n|]+)/);
            const bldgM = note.match(/건평[:\s]+([^\n|]+)/);
            const landV = landM ? landM[1].trim() : null;
            const bldgV = bldgM ? bldgM[1].trim() : null;
            if (!landV && !bldgV) return null;
            return (
              <>
                <span className="flex-shrink-0 w-px h-3.5 bg-border" />
                {landV && (
                  <span
                    className="flex-shrink-0 flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
                    style={{
                      background: "hsl(142 60% 93%)",
                      color: "hsl(142 50% 30%)",
                      border: "1px solid hsl(142 50% 75%)",
                    }}
                  >
                    <span className="text-[10px] font-bold opacity-70">대지</span>
                    {landV}
                  </span>
                )}
                {bldgV && (
                  <span
                    className="flex-shrink-0 flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
                    style={{
                      background: "hsl(217 80% 93%)",
                      color: "hsl(217 60% 35%)",
                      border: "1px solid hsl(217 60% 75%)",
                    }}
                  >
                    <span className="text-[10px] font-bold opacity-70">건평</span>
                    {bldgV}
                  </span>
                )}
              </>
            );
          })()}
          <span className="flex-1" />
          {/* 아이콘 배지 (컴팩트, 인라인 — 옵션 앞) */}
          {(() => {
            const badges: JSX.Element[] = [];
            const opts = prop.options ?? [];
            const normalizedOpts = new Set(opts.map((opt) => String(opt).replace(/\s+/g, "").toLowerCase()));
            const hasOption = (...candidates: string[]) => candidates.some((c) => normalizedOpts.has(c.replace(/\s+/g, "").toLowerCase()));
            const iconCls = "flex-shrink-0 flex items-center justify-center w-6 h-6 rounded select-none";
            const imgCls = "w-5 h-5 object-contain";
            const imgStyle = { imageRendering: '-webkit-optimize-contrast' as any };

            if (prop.elevator || hasOption("엘리베이터"))
              badges.push(<span key="elevator" title="엘리베이터" className={iconCls} style={{ background: "#e0f2fe", border: "1px solid #7dd3fc" }}><img src={elevatorIcon} alt="엘리베이터" className={imgCls} style={imgStyle} /></span>);

            const petImg = <img src={petIcon} alt="반려동물" className={imgCls} style={imgStyle} />;
            if (hasOption("반려동물불가", "애완동물불가", "반려동물_불가")) {
              badges.push(
                <span key="pet-deny" title="반려동물 불가" className={`${iconCls} relative`} style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}>
                  {petImg}
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg width="20" height="20" viewBox="0 0 20 20"><line x1="3" y1="3" x2="17" y2="17" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" /></svg>
                  </span>
                </span>,
              );
            } else if (hasOption("반려동물가능", "애완동물가능", "반려동물_가능")) {
              badges.push(<span key="pet-ok" title="반려동물 가능" className={iconCls} style={{ background: "#fff7ed", border: "1px solid #fdba74" }}>{petImg}</span>);
            }

            const entries: [string, { src: string; alt: string; bg: string; border: string }][] = [
              ["수도", { src: waterIcon, alt: "수도", bg: "#eff6ff", border: "#93c5fd" }],
              ["인터넷", { src: internetIcon, alt: "인터넷", bg: "#f0fdf4", border: "#86efac" }],
              ["유선TV", { src: tvIcon, alt: "유선TV", bg: "#faf5ff", border: "#d8b4fe" }],
              ["CCTV", { src: cctvIcon, alt: "CCTV", bg: "#fef2f2", border: "#fca5a5" }],
              ["리모델링", { src: remodelingIcon, alt: "리모델링", bg: "#fff7ed", border: "#fdba74" }],
              ["여성전용", { src: femaleOnlyIcon, alt: "여성전용", bg: "#fdf2f8", border: "#f9a8d4" }],
            ];
            entries.forEach(([opt, d]) => {
              if (!hasOption(opt)) return;
              badges.push(<span key={opt} title={d.alt} className={iconCls} style={{ background: d.bg, border: `1px solid ${d.border}` }}><img src={d.src} alt={d.alt} className={imgCls} style={imgStyle} /></span>);
            });

            return badges;
          })()}
          {/* ⑦-b 옵션 텍스트 배지 — 호버 시 상세 목록 팝업 */}
          {prop.options &&
            prop.options.length > 0 &&
            (() => {
              const FULL_OPT = ["냉장고", "세탁기", "에어컨", "TV", "전자레인지", "인터넷", "가스레인지", "수도"];
              const isFull = prop.options!.includes("풀옵션") || FULL_OPT.every((o) => prop.options!.includes(o));
              return (
                <div
                  ref={optBadgeRef}
                  className="relative flex-shrink-0"
                  onMouseEnter={handleOptMouseEnter}
                  onMouseLeave={handleOptMouseLeave}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (showOptPopup) { setShowOptPopup(false); }
                    else { handleOptMouseEnter(); }
                  }}
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
                      style={{
                        background: "hsl(var(--muted))",
                        color: "hsl(var(--foreground)/0.65)",
                        border: "1.5px solid hsl(var(--border))",
                      }}
                    >
                      {`옵션 ▾`}
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
                      <p
                        className="text-[10px] font-extrabold mb-1.5 pb-1 border-b border-border"
                        style={{ color: "hsl(var(--primary))" }}
                      >
                        {isFull ? "풀옵션 구성" : `옵션 항목 (${prop.options!.length}개)`}
                      </p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {prop.options!.map((opt) => (
                          <span key={opt} className="text-[11px] font-semibold text-foreground whitespace-nowrap">
                            · {opt}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
        </div>

        {/* 3줄: 방향·공실·LH·청소비·중개보수 + 특이사항 */}
        {(() => {
          const note = prop.note ?? "";
          const dirMatch = note.match(/방향[:\s]+([^\n|]+)/);
          const lhMatch = note.match(/LH[:\s]+([^\n|]+)/);
          const cleanMatch = note.match(/청소비[:\s]+([^\n|]+)/);
          const brokerMatch = note.match(/중개보수[:\s]+([^\n|]+)/);
          const direction = dirMatch?.[1]?.trim();
          const lhVal = lhMatch?.[1]?.trim();
          const cleanFee = cleanMatch?.[1]?.trim();
          const brokerFee = brokerMatch?.[1]?.trim();
          // 공실 여부: 임대 타입만 표시 (매매 제외)
          const isSalePropCard = prop.type?.includes("매매");
          const vacancy =
            !isSalePropCard &&
            prop.availableFrom &&
            (prop.availableFrom === "공실" || prop.availableFrom === "세입자 거주중")
              ? prop.availableFrom
              : null;

          const chips: { label: string; value: string; bg: string; color: string; border: string }[] = [];
          if (vacancy)
            chips.push({
              label: vacancy === "공실" ? "공실" : "거주중",
              value: "",
              bg: vacancy === "공실" ? "hsl(142 70% 93%)" : "hsl(38 95% 92%)",
              color: vacancy === "공실" ? "hsl(142 60% 30%)" : "hsl(25 90% 40%)",
              border: vacancy === "공실" ? "hsl(142 60% 70%)" : "hsl(38 80% 65%)",
            });
          // 단기가능 배지
          if (!isSalePropCard && (prop.options ?? []).includes("단기가능"))
            chips.push({
              label: "단기",
              value: "",
              bg: "hsl(217 91% 93%)",
              color: "hsl(217 91% 35%)",
              border: "hsl(217 91% 65%)",
            });
          if (direction)
            chips.push({ label: direction + "향", value: "", bg: "#fff3e0", color: "#e65100", border: "#ffcc80" });
          if (lhVal && lhVal !== "관계없음")
            chips.push({
              label: lhVal,
              value: "",
              bg: lhVal === "LH가능" ? "hsl(217 91% 93%)" : "hsl(0 85% 93%)",
              color: lhVal === "LH가능" ? "hsl(217 91% 40%)" : "hsl(0 85% 45%)",
              border: lhVal === "LH가능" ? "hsl(217 91% 70%)" : "hsl(0 85% 70%)",
            });
          if (cleanFee)
            chips.push({
              label: `청소비 ${cleanFee}만`,
              value: "",
              bg: "hsl(var(--muted))",
              color: "hsl(var(--muted-foreground))",
              border: "hsl(var(--border))",
            });
          if (brokerFee)
            chips.push({
              label: `수수료 ${brokerFee}`,
              value: "",
              bg: "hsl(0 85% 93%)",
              color: "hsl(0 85% 45%)",
              border: "hsl(0 85% 70%)",
            });
          // 중도퇴거 여부
          const earlyExit = note.includes("중도퇴거:");
          if (earlyExit)
            chips.push({
              label: "중도퇴거",
              value: "",
              bg: "hsl(0 85% 93%)",
              color: "hsl(0 85% 40%)",
              border: "hsl(0 85% 70%)",
            });
          // 리모델링 배지
          if ((prop.options ?? []).some(o => o === "리모델링"))
            chips.push({
              label: "리모델링",
              value: "",
              bg: "hsl(30 100% 95%)",
              color: "hsl(20 90% 35%)",
              border: "hsl(30 80% 65%)",
            });
          // 퇴거 예정일 — 지났으면 공실 표시
          if (prop.vacateDate) {
            const vacateStr = prop.vacateDate.replace(/[^0-9\-\/\.]/g, "").replace(/\./g, "-").replace(/\//g, "-");
            const vacateTime = new Date(vacateStr).getTime();
            const isPast = !isNaN(vacateTime) && vacateTime < Date.now();
            if (isPast) {
              chips.push({
                label: "공실",
                value: "",
                bg: "hsl(142 50% 90%)",
                color: "hsl(142 60% 30%)",
                border: "hsl(142 50% 65%)",
              });
            } else {
              chips.push({
                label: `퇴거 ${prop.vacateDate}`,
                value: "",
                bg: "hsl(0 85% 93%)",
                color: "hsl(0 85% 35%)",
                border: "hsl(0 85% 65%)",
              });
            }
          }

          const hasChips = chips.length > 0;
          const hasDesc = !!prop.description?.trim();

          if (!hasChips && !hasDesc && !buildingPw && !roomPw) return null;
          return (
            <div className="flex items-center gap-1 min-h-[17px] overflow-hidden flex-wrap">
              {/* 왼쪽: 칩들과 특이사항 */}
              {chips.map((chip, i) => (
                <span
                  key={i}
                  className="flex-shrink-0 text-[10px] font-extrabold px-1.5 py-0.5 rounded whitespace-nowrap"
                  style={{ background: chip.bg, color: chip.color, border: `1px solid ${chip.border}` }}
                >
                  {chip.label}
                </span>
              ))}
              {hasDesc && (
                <>
                  {hasChips && <span className="flex-shrink-0 w-px h-3 bg-border" />}
                  <span
                    className="flex-shrink-0 text-[11px] font-extrabold whitespace-nowrap"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    특이
                  </span>
                  <span
                    className="text-[11px] font-extrabold leading-tight truncate"
                    style={{ color: "hsl(var(--foreground))" }}
                  >
                    {prop.description!.length > 40 ? prop.description!.slice(0, 40) + "…" : prop.description}
                  </span>
                </>
              )}

              {/* 우측 정렬을 위한 스페이서 */}
              <span className="flex-1" />

              {/* 오른쪽: 비밀번호 */}
              {(buildingPw || roomPw) && (
                <>
                  {buildingPw && (
                    <div className="relative group/bpw flex-shrink-0">
                      <span
                        className="text-[11px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded cursor-default select-none tracking-wide"
                        style={{ background: "hsl(220 25% 93%)", color: "hsl(220 45% 32%)", border: "1.5px solid hsl(220 25% 80%)", fontFamily: "'Pretendard', sans-serif", letterSpacing: "0.04em" }}
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
                        className="text-[11px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded cursor-default select-none tracking-wide"
                        style={{ background: "hsl(var(--accent)/0.12)", color: "hsl(var(--accent))", border: "1.5px solid hsl(var(--accent)/0.4)", fontFamily: "'Pretendard', sans-serif", letterSpacing: "0.04em" }}
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
            </div>
          );
        })()}
      </div>
    );
  },
);

/* ── LandlordPhoneRow ── */
AddressToggleCard.displayName = "AddressToggleCard";

/* ── LandlordPhoneRow ── */
const LandlordPhoneRow = ({ phone, label }: { phone: string; label: string }) => {
  const colorMap: Record<string, string> = {
    소유주: "hsl(var(--primary))",
    관리인: "hsl(217 91% 60%)",
    부동산: "hsl(25 95% 53%)",
  };
  const color = colorMap[label] ?? "hsl(var(--foreground))";
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <a
        href={`tel:${phone}`}
        className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg"
        style={{ color, background: `${color}18` }}
      >
        <Phone className="w-3 h-3" />
        {phone}
      </a>
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
  /** 핀 클릭 순서대로 쌓인 id 배열 */
  pinnedIds?: number[];
  onClearPinnedIds?: () => void;
  /** 소유주 번호 검색 결과 */
  landlordResults?: import("@/components/MapFilterBar").LandlordResult[];
  landlordLoading?: boolean;
  landlordSearched?: boolean;
  onRefetch?: () => void;
  /** 참고용 사진 검색용 전체 매물 풀 (필터링 전) */
  referencePool?: MapProperty[];
  /** 현재 지도 영역 — 모바일 시트 매물 갯수 표시용 */
  currentBounds?: { swLat: number; swLng: number; neLat: number; neLng: number } | null;
}

const MIN_WIDTH = 260;
const MAX_WIDTH = 700;
const DEFAULT_WIDTH = 540;

const MapSidebar = ({
  properties,
  selectedId,
  onSelect,
  onDeselect,
  topOffset = 0,
  onDeleteProperties,
  pinnedAddress,
  onClearPin,
  pinnedIds,
  onClearPinnedIds,
  landlordResults,
  landlordLoading,
  landlordSearched,
  onRefetch,
  referencePool,
  currentBounds,
}: MapSidebarProps) => {
  const { isAdmin } = useAdminAuth();
  const { user: authUser } = useAuth();
  const isMobile = useIsMobile();
  // 모바일 시트 단계: 0=닫힘(헤더만), 1=2/4(50%), 2=4/4(100%)
  // 매물정보 바를 누르면 0 → 1 → 2 → 0 순환
  const [mobileStep, setMobileStep] = useState<0 | 1 | 2>(0);
  const [adminEditProp, setAdminEditProp] = useState<MapProperty | null>(null);
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem("sidebar_width");
    const parsed = saved ? Number(saved) : 0;
    return parsed >= MIN_WIDTH ? Math.min(MAX_WIDTH, parsed) : DEFAULT_WIDTH;
  });
  const [collapsed, setCollapsed] = useState(false);
  const [lightbox, setLightbox] = useState<{ units: LightboxUnit[]; unitIdx: number } | null>(null);
  const [photoUploadProp, setPhotoUploadProp] = useState<MapProperty | null>(null);
  const [leaseProposalProp, setLeaseProposalProp] = useState<MapProperty | null>(null);
  const [errorReportProp, setErrorReportProp] = useState<MapProperty | null>(null);
  const [dealCompleteProp, setDealCompleteProp] = useState<MapProperty | null>(null);
  const [mobileContactsProp, setMobileContactsProp] = useState<MapProperty | null>(null);
  const [expandedContactsId, setExpandedContactsId] = useState<number | null>(null);
  const [dealCompletedIds, setDealCompletedIds] = useState<Set<string>>(new Set());

  // 기존 거래완료 제보 불러오기 — 매물이 active인 경우에만 취소선 표시
  useEffect(() => {
    const loadDealCompleted = async () => {
      const { data } = await supabase
        .from("property_reports")
        .select("property_id")
        .eq("report_type", "deal_complete")
        .neq("status", "rejected");
      if (data && data.length > 0) {
        // active 상태인 매물 중 거래완료 제보가 있는 것만 표시
        // → 재등록(active 복구) 시 관련 제보도 rejected 처리해야 취소선이 사라짐
        setDealCompletedIds(new Set(data.map((r) => r.property_id)));
      } else {
        setDealCompletedIds(new Set());
      }
    };
    loadDealCompleted();
  }, []);

  // 모바일: 매물 핀 선택만으로는 시트를 자동으로 펼치지 않음
  // (사용자가 매물 정보를 클릭하면 시트를 위로 올림 — 카드 onClick에서 처리)
  const listScrollRef = useRef<HTMLDivElement>(null);
  // 공유 시 사용할 중개사무소 정보
  const [myAgencyInfo, setMyAgencyInfo] = useState<AgencyInfo | undefined>(undefined);
  useEffect(() => {
    if (!authUser?.userId) { setMyAgencyInfo(undefined); return; }
    supabase
      .from("agent_profiles")
      .select("agency_name, name, phone, agency_phone, representative_name, agency_address, license_number")
      .eq("user_id", authUser.userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setMyAgencyInfo({ userId: authUser.userId, agencyName: data.agency_name, name: data.name, phone: data.phone, agencyPhone: data.agency_phone ?? "", representativeName: data.representative_name ?? "", agencyAddress: data.agency_address ?? "", licenseNumber: data.license_number ?? "" });
      });
  }, [authUser?.userId]);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set());
  const [modalPos, setModalPos] = useState({ x: 0, y: 97 });
  const [publicRecordAddress, setPublicRecordAddress] = useState<{ address: string; propertyId?: string } | null>(null);

  // 동일 주소 참고용 사진 (RLS 우회 RPC 사용 — 일반 사용자도 inactive/타카테고리 사진 조회 가능)
  const [inactiveRefMap, setInactiveRefMap] = useState<Map<string, { image: string; images: string[]; unitNumber: string; roomType: string; address: string }>>(new Map());
  useEffect(() => {
    let cancelled = false;
    const fetchInactiveRefs = async () => {
      const pool = referencePool && referencePool.length > 0 ? referencePool : properties;
      const noImageAddrs = pool
        .filter((p) => !p.image || p.image.length === 0)
        .map((p) => p.address)
        .filter((a, i, arr) => arr.indexOf(a) === i);
      if (noImageAddrs.length === 0) return;

      const { data } = await supabase.rpc("get_reference_images", { _addresses: noImageAddrs });

      if (!cancelled && data) {
        const map = new Map<string, { image: string; images: string[]; unitNumber: string; roomType: string; address: string }>();
        for (const row of data as Array<{ address: string; unit_number: string; room_type: string; images: string[] }>) {
          const imgs = row.images;
          if (imgs && imgs.length > 0 && imgs[0] && !map.has(row.address)) {
            map.set(row.address, {
              image: imgs[0],
              images: imgs,
              unitNumber: row.unit_number || "?",
              roomType: row.room_type || "",
              address: row.address,
            });
          }
        }
        setInactiveRefMap(map);
      }
    };
    fetchInactiveRefs();
    return () => { cancelled = true; };
  }, [properties, referencePool]);

  // 참고용 사진 찾기 헬퍼: 동일주소 active 매물(전체 풀) → inactive 매물 순
  const findRefImage = useCallback((prop: MapProperty, pool: MapProperty[]) => {
    // 항상 referencePool(전체)을 우선 검색하고, 없으면 전달받은 pool에서 찾음
    const searchPools = [referencePool, pool].filter(Boolean) as MapProperty[][];
    for (const sp of searchPools) {
      const sibling = sp.find(
        (p) => p.id !== prop.id && p.address === prop.address && p.image && p.image.length > 0
      );
      if (sibling) return {
        image: sibling.image,
        images: sibling.images && sibling.images.length > 0 ? sibling.images : [sibling.image],
        unitNumber: sibling.unitNumber || "?",
        roomType: sibling.roomType || "",
      };
    }
    // inactive 매물에서 찾기
    const inactive = inactiveRefMap.get(prop.address);
    if (inactive) return {
      image: inactive.image,
      images: inactive.images,
      unitNumber: inactive.unitNumber,
      roomType: inactive.roomType || "",
    };
    return null;
  }, [inactiveRefMap, referencePool]);

  // pinnedIds 모드: 클릭 순서대로 표시
  // pinnedAddress 모드: 동일 주소 필터
  // 둘 다 없으면 전체 표시
  const displayProperties = (() => {
    if (pinnedIds && pinnedIds.length > 0) {
      // 클릭 순서대로 정렬 (properties는 이미 부모에서 pinnedIds 기준 필터링됨)
      const idxMap = new Map(pinnedIds.map((id, i) => [id, i]));
      return [...properties].sort((a, b) => (idxMap.get(a.id) ?? 999) - (idxMap.get(b.id) ?? 999));
    }
    return properties;
  })();

  // 선택 인쇄: 체크된 매물만, 상세 인쇄: 모든 매물 상세
  const handleSelectPrint = () => {
    const list = properties.filter((p) => checkedIds.has(p.id));
    if (list.length === 0) {
      alert("인쇄할 매물을 선택해주세요.");
      return;
    }
    if (list.length > 10) {
      alert("선택인쇄는 최대 10개까지 가능합니다.");
      return;
    }
    const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

    // 관리자 여부에 따라 연락처 열 포함 여부 결정
    const showContacts = isAdmin;

    const shortAddress = (addr: string) => {
      if (!addr) return "-";
      const tokens = addr.trim().split(/\s+/);
      if (tokens.length >= 2) return tokens.slice(-2).join(" ");
      return addr;
    };

    const rows = list
      .map((p, i) => {
        const buildYearShort = p.buildYear ? p.buildYear.replace(/[^0-9]/g, "").slice(0, 4) : "";
        const roomTypeText = p.type === "원룸" && p.roomType ? p.roomType : (p.roomType ?? "-");
        const passwordCell = showContacts
          ? `<td style="font-size:10px;color:#333;line-height:1.6;text-align:center">
            ${p.buildingPassword || p.password ? `<span style="color:#15803d;font-weight:600">건물</span> ${p.buildingPassword ?? p.password}<br/>` : ""}
            ${p.roomPassword ? `<span style="color:#1d4ed8;font-weight:600">방</span> ${p.roomPassword}` : ""}
            ${!p.buildingPassword && !p.password && !p.roomPassword ? "-" : ""}
           </td>`
          : "";
        const contactCell = showContacts
          ? `<td style="font-size:10px;color:#333;line-height:1.6">
            ${p.contactOwner ? `<span style="color:#15803d;font-weight:600">건물주</span> ${p.contactOwner}<br/>` : ""}
            ${p.contactManager ? `<span style="color:#1d4ed8;font-weight:600">관리인</span> ${p.contactManager}<br/>` : ""}
            ${p.contactTenant ? `<span style="color:#7c3aed;font-weight:600">세입자</span> ${p.contactTenant}<br/>` : ""}
            ${!p.contactOwner && !p.contactManager && !p.contactTenant ? "-" : ""}
           </td>`
          : "";
        return `<tr>
        <td style="text-align:center;color:#888">${i + 1}</td>
        <td style="color:#555">${shortAddress(p.address)}</td>
        <td><strong>${p.buildingName ?? p.title}</strong></td>
        <td style="text-align:center"><span style="background:#e8f0ff;color:#1a56db;border-radius:4px;padding:2px 6px;font-size:10px">${p.type}</span></td>
        <td style="text-align:center;color:#555">${roomTypeText || "-"}</td>
        ${passwordCell}
        <td style="text-align:center">${[p.floor, p.unitNumber].filter(Boolean).join(" / ") || "-"}</td>
        <td style="text-align:center">${p.area ?? "-"}</td>
        <td style="text-align:center;line-height:1.5">
          <span style="color:#1a56db;font-weight:bold">${p.deposit || "-"}</span>
          <span style="color:#888"> / </span>
          <span style="color:#e11d48;font-weight:bold">${p.monthly || "-"}</span>
        </td>
        <td style="text-align:center;color:#555">${p.manageFee ?? "-"}</td>
        <td style="text-align:center">${p.availableFrom ?? "-"}</td>
        <td style="text-align:center;color:#555">${buildYearShort ? `${buildYearShort}년` : "-"}</td>
        ${contactCell}
      </tr>`;
      })
      .join("");

    const passwordHeader = showContacts ? `<th style="width:90px">비밀번호 (관리자용)</th>` : "";
    const contactHeader = showContacts ? `<th style="width:130px">연락처 (관리자용)</th>` : "";

    const adminWatermark = showContacts
      ? `<p style="font-size:11px;color:#e11d48;font-weight:600;margin-top:4px">🔒 관리자 전용 — 연락처 포함</p>`
      : "";

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
    .admin-badge { display:inline-block;background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;border-radius:4px;padding:2px 6px;font-size:10px;font-weight:700; }
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
      ${adminWatermark}
    </div>
    <div class="meta">
      출력일: ${today}
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:28px">No.</th>
        <th>주소</th>
        <th style="width:130px">건물명</th>
        <th style="width:65px">유형</th>
        <th style="width:60px">방유형</th>
        ${passwordHeader}
        <th style="width:80px">층 / 호수</th>
        <th style="width:70px">면적</th>
        <th style="width:130px">보증금 / 월세</th>
        <th style="width:60px">관리비</th>
        <th style="width:80px">입주가능일</th>
        <th style="width:55px">준공</th>
        ${contactHeader}
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">※ 본 자료는 참고용이며 실제 계약 조건과 다를 수 있습니다.${showContacts ? " | 🔒 이 문서에는 관리자 전용 연락처 정보가 포함되어 있습니다." : ""}</div>
  <div class="no-print" style="margin-top:20px;text-align:center">
    <button onclick="window.print()" style="padding:10px 28px;background:#1a56db;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;margin-right:8px">🖨️ 인쇄</button>
    <button onclick="window.close()" style="padding:10px 20px;background:#f0f0f0;color:#333;border:none;border-radius:8px;font-size:13px;cursor:pointer">닫기</button>
  </div>
</body>
</html>`;
    const w = window.open("", "_blank", "width=1100,height=700");
    w?.document.write(html);
    w?.document.close();
  };

  const handleDetailPrint = () => {
    const list = checkedIds.size > 0 ? properties.filter((p) => checkedIds.has(p.id)) : properties;
    const cards = list
      .map(
        (p) =>
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
      </div>`,
      )
      .join("");
    const html = `<html><head><title>매물 상세 인쇄</title><style>body{font-family:sans-serif;max-width:800px;margin:0 auto;padding:20px}@media print{body{padding:0}}</style></head><body><h2>매물 상세 목록 (${list.length}건)</h2>${cards}</body></html>`;
    const w = window.open("", "_blank");
    w?.document.write(html);
    w?.document.close();
    w?.print();
  };

  /* ── Resize drag ── */
  const dragging = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_WIDTH);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
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
    },
    [width],
  );

  return (
    <>
      {/* Public Record Modal */}
      {publicRecordAddress && (
        <PublicRecordModal
          address={publicRecordAddress.address}
          propertyId={publicRecordAddress.propertyId}
          onClose={() => setPublicRecordAddress(null)}
        />
      )}
      {/* Photo Upload Modal */}
      {photoUploadProp && (
        <PhotoUploadModal
          prop={photoUploadProp}
          onClose={() => setPhotoUploadProp(null)}
          onImagesUpdated={(imgs) => {
            // 실시간 반영: photoUploadProp의 이미지 업데이트
            setPhotoUploadProp((prev) => (prev ? { ...prev, images: imgs, image: imgs[0] ?? prev.image } : null));
            onRefetch?.();
          }}
        />
      )}
      {/* Lease Proposal Modal */}
      {leaseProposalProp && (
        <LeaseProposalModal
          prop={leaseProposalProp}
          allProperties={properties}
          onClose={() => setLeaseProposalProp(null)}
          isAdmin={isAdmin}
        />
      )}
      {/* Error Report Modal */}
      {errorReportProp && <ErrorReportModal prop={errorReportProp} onClose={() => setErrorReportProp(null)} />}
      {/* Deal Complete Modal */}
      {dealCompleteProp && <DealCompleteModal prop={dealCompleteProp} onClose={() => setDealCompleteProp(null)} onComplete={(pid) => setDealCompletedIds(prev => new Set(prev).add(pid))} />}
      {/* Admin Property Edit Modal */}
      {adminEditProp &&
        (() => {
          // agent_name(DB)에 저장된 연락처 문자열 파싱
          // 형식: "건물주:010-xxx|부동산:043-xxx|세입자:010-xxx|관리인:010-xxx"
          // 또는 note: "건물주: 010-xxx\n부동산: 043-xxx\n..."
          const rawContact = adminEditProp.agentName ?? adminEditProp.note ?? "";
          const parseC = (key: string) => {
            const pattern = key === "건물주"
              ? /건물주(?!2)[:\s]+([0-9][0-9\-]+)/
              : new RegExp(`${key}[:\\s]+([0-9][0-9\\-]+)`);
            const m = rawContact.match(pattern);
            return m ? m[1].trim() : "";
          };
          const parsedOwner = adminEditProp.contactOwner || parseC("건물주");
          const parsedOwner2 = adminEditProp.contactOwner2 || parseC("건물주2");
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
                      images:
                        adminEditProp.images && adminEditProp.images.length > 0
                          ? adminEditProp.images
                          : adminEditProp.image
                            ? [adminEditProp.image]
                            : [],
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
                      ...(parsedOwner ? { contactOwner: parsedOwner } : {}),
                      ...(parsedOwner2 ? { contactOwner2: parsedOwner2 } : {}),
                      ...(parsedTenant ? { contactTenant: parsedTenant } : {}),
                      ...(parsedManager ? { contactManager: parsedManager } : {}),
                    }
                  : null
              }
              onClose={() => setAdminEditProp(null)}
              onSaved={() => { setAdminEditProp(null); onRefetch?.(); }}
            />
          );
        })()}
      {/* Lightbox — 호실별 탭 + 여러 장 좌우 탐색 */}
      {lightbox && (
        <LightboxModal units={lightbox.units} startUnitIdx={lightbox.unitIdx} onClose={() => setLightbox(null)} />
      )}
      {/* 모바일 연락처 모달 — 입력된 연락처만 노출 */}
      {mobileContactsProp && ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[10000] bg-black/60 flex items-end md:items-center justify-center p-4"
          onClick={() => setMobileContactsProp(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: "hsl(var(--primary)/0.05)" }}>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
                <span className="font-extrabold text-[14px]">연락처</span>
              </div>
              <button onClick={() => setMobileContactsProp(null)} className="p-1 rounded hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 flex flex-col gap-2">
              {[
                { label: "소유주", num: mobileContactsProp.contactOwner?.trim() },
                { label: "소유주2", num: mobileContactsProp.contactOwner2?.trim() },
                { label: "관리인", num: mobileContactsProp.contactManager?.trim() },
                { label: "세입자", num: mobileContactsProp.contactTenant?.trim() },
              ]
                .filter((c) => c.num)
                .map((c) => (
                  <a
                    key={c.label}
                    href={`tel:${c.num}`}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border transition-colors hover:bg-primary/5"
                    style={{ borderColor: "hsl(var(--border))" }}
                  >
                    <span className="text-[12px] font-bold text-muted-foreground">{c.label}</span>
                    <span className="text-[14px] font-extrabold" style={{ color: "hsl(var(--primary))" }}>{c.num}</span>
                  </a>
                ))}
              {!(mobileContactsProp.contactOwner?.trim() || mobileContactsProp.contactOwner2?.trim() || mobileContactsProp.contactManager?.trim() || mobileContactsProp.contactTenant?.trim()) && (
                <p className="text-center text-[12px] text-muted-foreground py-4">등록된 연락처가 없습니다</p>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* 모바일에서 시트가 4/4(100%)로 펼쳐졌을 때 배경 어둡게 */}
      {isMobile && mobileStep === 2 && (
        <div
          className="fixed inset-0 bg-black/30 z-[55]"
          onClick={() => setMobileStep(1)}
        />
      )}

      {/* collapsed 시 absolute로 지도 위에 겹치게, 열릴 때는 flex로 공간 차지
          모바일(<768px): 하단 시트로 동작, mobileStep으로 높이 제어 */}
      <div
        className={isMobile ? "" : "flex h-full"}
        style={
          isMobile
            ? {
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                top: "auto",
                height:
                  mobileStep === 0
                    ? "56px"
                    : mobileStep === 1
                    ? "55vh"
                    : "calc(100vh - 100px)",
                maxHeight: "calc(100vh - 100px)",
                zIndex: 60,
                background: "white",
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                boxShadow: "0 -8px 24px rgba(0,0,0,0.18)",
                transition: "height 0.3s ease",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
              }
            : {
                position: collapsed ? "absolute" : "relative",
                right: 0,
                top: 0,
                bottom: 0,
                zIndex: collapsed ? 50 : "auto",
                flexShrink: 0,
              }
        }
      >
        {/* Toggle tab — 사이드바 왼쪽 (데스크톱 전용) */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="self-start bg-primary text-primary-foreground border-0 rounded-l-xl px-1.5 py-4 shadow-lg hover:bg-primary/90 transition-colors flex-shrink-0"
            style={{ marginTop: "32px" }}
          >
            {collapsed ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* 모바일 전용 peek 헤더 — 탭하면 단계적 확장 */}
        {isMobile && (
          <button
            onClick={() => setMobileStep((p) => (((p + 1) % 3) as 0 | 1 | 2))}
            className="flex-shrink-0 w-full px-4 pt-2 pb-2 flex flex-col items-stretch border-b border-border bg-white"
          >
            <span className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 mb-1.5" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--stat-green))" }} />
                <span className="text-sm font-bold text-foreground">매물정보</span>
                <span className="text-xs text-muted-foreground">({properties.filter((p) => p.lat !== 0 && p.lng !== 0).length}개)</span>
              </div>
              <div className="flex items-center gap-1">
                {mobileStep > 0 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileStep((p) => (p > 0 ? ((p - 1) as 0 | 1 | 2) : 0));
                    }}
                    className="p-1 rounded hover:bg-muted"
                    title="한 단계 줄이기"
                  >
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </span>
                )}
                {mobileStep < 2 && <ChevronUp className="w-5 h-5 text-muted-foreground" />}
                {mobileStep > 0 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMobileStep(0);
                      onDeselect?.();
                      onClearPinnedIds?.();
                      onClearPin?.();
                    }}
                    className="ml-1 p-1 rounded hover:bg-muted"
                    title="닫기"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </span>
                )}
              </div>
            </div>
            {mobileStep > 0 && (
              <div className="flex items-center justify-center gap-1 mt-1.5">
                {[1, 2].map((n) => (
                  <span
                    key={n}
                    className="h-1 rounded-full transition-all"
                    style={{
                      width: mobileStep >= n ? 16 : 8,
                      background: mobileStep >= n ? "hsl(var(--primary))" : "hsl(var(--border))",
                    }}
                  />
                ))}
              </div>
            )}
          </button>
        )}

        {/* Panel */}
        <aside
          className={`bg-white flex flex-col transition-all duration-300 ${
            isMobile
              ? "flex-1 w-full min-h-0"
              : `border-l border-border ${collapsed ? "w-0 overflow-hidden opacity-0 pointer-events-none" : "opacity-100"}`
          }`}
          style={
            isMobile
              ? { display: mobileStep === 0 ? "none" : "flex" }
              : {
                  width: collapsed ? 0 : width,
                  boxShadow: "-2px 0 16px rgba(10,45,110,0.08)",
                  flexShrink: 0,
                }
          }
        >
          {/* Drag handle — 데스크톱 전용 */}
          {!isMobile && !collapsed && (
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
          <div className="flex-shrink-0 border-b border-border" style={{ background: "hsl(var(--toolbar-bg))" }}>
            {/* 핀 클릭 누적 모드 배너 */}
            {pinnedIds && pinnedIds.length > 0 && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 border-b border-border/60"
                style={{ background: "hsl(var(--primary)/0.08)" }}
              >
                <span className="text-[10px] font-bold text-primary flex-1 min-w-0">핀 선택 {pinnedIds.length}개</span>
                <button
                  onClick={() => onClearPinnedIds?.()}
                  className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold border border-primary/30 hover:bg-primary/10 transition-colors flex-shrink-0"
                  style={{ color: "hsl(var(--primary))" }}
                >
                  <X className="w-2.5 h-2.5" />
                  전체보기
                </button>
              </div>
            )}
            {/* 주소 필터 모드 배너 (기존) */}
            {pinnedAddress && (!pinnedIds || pinnedIds.length === 0) && (
              <div
                className="flex items-center gap-2 px-3 py-1.5 border-b border-border/60"
                style={{ background: "hsl(var(--primary)/0.08)" }}
              >
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
            <div className="flex items-center gap-2 px-3 py-0.5 border-b border-border/60">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="min-w-0">
                  <p className="text-[13px] font-extrabold text-foreground leading-none">
                    {pinnedAddress && (!pinnedIds || pinnedIds.length === 0) && (
                      <span className="text-[10px] font-semibold text-primary">(동일주소)</span>
                    )}
                  </p>
                  <p className="text-[9px] text-muted-foreground mt-0.5">
                    {checkedIds.size > 0
                      ? `${checkedIds.size}개 선택됨`
                      : pinnedAddress && (!pinnedIds || pinnedIds.length === 0)
                        ? "핀 클릭 필터 중"
                        : ""}
                  </p>
                </div>
              </div>
            </div>
            {/* 외부링크 + 선택인쇄 바 (모바일에서는 숨김) */}
            <div className="hidden md:flex items-center gap-1 px-3 py-1.5 flex-wrap">
              {[
                {
                  label: "등기소",
                  url: "http://www.iros.go.kr",
                  bg: "hsl(220 60% 93%)",
                  color: "hsl(220 60% 30%)",
                  border: "hsl(220 50% 70%)",
                  icon: "https://www.iros.go.kr/favicon.ico",
                },
                {
                  label: "정부24",
                  url: "https://www.gov.kr",
                  bg: "hsl(200 60% 93%)",
                  color: "hsl(200 60% 30%)",
                  border: "hsl(200 50% 70%)",
                  icon: "/images/gov24-logo.png",
                },
                {
                  label: "토지e음",
                  url: "https://www.eum.go.kr",
                  bg: "hsl(140 50% 93%)",
                  color: "hsl(140 50% 25%)",
                  border: "hsl(140 40% 65%)",
                  icon: "https://www.google.com/s2/favicons?domain=eum.go.kr&sz=32",
                },
                {
                  label: "직방",
                  url: "https://www.zigbang.com",
                  bg: "hsl(15 80% 93%)",
                  color: "hsl(15 70% 30%)",
                  border: "hsl(15 60% 70%)",
                  icon: "https://www.zigbang.com/favicon.ico",
                },
                {
                  label: "다방",
                  url: "https://www.dabangapp.com",
                  bg: "hsl(270 50% 95%)",
                  color: "hsl(270 60% 20%)",
                  border: "hsl(270 40% 60%)",
                  icon: "/images/dabang-logo.png",
                },
                {
                  label: "네이버부동산",
                  url: "https://land.naver.com",
                  bg: "hsl(145 70% 93%)",
                  color: "hsl(145 60% 25%)",
                  border: "hsl(145 50% 65%)",
                  icon: "https://land.naver.com/favicon.ico",
                },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="toolbar-btn flex items-center gap-1 flex-shrink-0 no-underline text-[10px] font-bold px-2 py-1 rounded-md"
                  style={{ background: link.bg, color: link.color, border: `1px solid ${link.border}` }}
                >
                  <img
                    src={link.icon}
                    alt=""
                    className="w-3.5 h-3.5 rounded-sm object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="font-extrabold">{link.label}</span>
                </a>
              ))}
              <span className="flex-1 min-w-[4px]" />
              <button
                onClick={async () => {
                  const addr = window.prompt(
                    "건축물대장을 조회할 주소를 입력하세요\n\n" +
                    "✅ 지번 주소 (권장): 개신동 41-5, 분평동 1261, 사창동 225-7\n" +
                    "✅ 도로명 주소: 사직대로 160, 충북대로 1\n" +
                    "✅ 시/구 포함도 가능: 청주시 흥덕구 봉명동 769"
                  );
                  if (!addr?.trim()) return;
                  // 공백 정리 + "동225-7" → "동 225-7" 자동 보정
                  let query = addr.trim().replace(/\s+/g, " ");
                  query = query.replace(/([가-힣]+동|[가-힣]+리)(\d)/g, "$1 $2");
                  console.log("[건축물조회] 입력:", query);
                  try {
                    const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geocode`;
                    const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
                    const res = await fetch(endpoint, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", apikey: apiKey, Authorization: `Bearer ${apiKey}` },
                      body: JSON.stringify({ address: query }),
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok || !data?.success) {
                      console.warn("[건축물조회] geocode 실패:", res.status, data);
                      const notFound = data?.error === "No results found for the given address";
                      window.alert(
                        notFound
                          ? `'${query}' 주소를 찾을 수 없습니다.\n\n💡 다음을 확인해주세요:\n• 동/리 + 지번 형식 (예: 사창동 225-7)\n• 청주시를 포함 (예: 청주시 흥덕구 봉명동 769)\n• 도로명 주소는 '시/구' 포함 권장`
                          : `주소 조회에 실패했습니다.\n${data?.error || "잠시 후 다시 시도해주세요."}`
                      );
                      return;
                    }
                    const normalized = data.jibunAddress || data.roadAddress || query;
                    console.log("[건축물조회] → 정규화:", normalized);
                    setPublicRecordAddress({ address: normalized });
                  } catch (e) {
                    console.error("[건축물조회] 네트워크 오류:", e);
                    window.alert("주소 조회 중 네트워크 오류가 발생했습니다.\n인터넷 연결을 확인하고 다시 시도해주세요.");
                  }
                }}
                className="toolbar-btn flex items-center gap-0.5 flex-shrink-0"
                style={{
                  background: "hsl(30 80% 93%)",
                  color: "hsl(30 70% 25%)",
                  border: "1px solid hsl(30 60% 70%)",
                }}
              >
                <Building2 className="w-3 h-3" />
                건축물조회
              </button>
              <button
                onClick={handleSelectPrint}
                className="toolbar-btn flex items-center gap-0.5 flex-shrink-0"
                style={{
                  background: "hsl(217 91% 93%)",
                  color: "hsl(217 91% 35%)",
                  border: "1px solid hsl(217 80% 70%)",
                }}
              >
                <Printer className="w-3 h-3" />
                선택인쇄
              </button>
            </div>
          </div>

          {/* List */}
          <div ref={listScrollRef} className="flex-1 overflow-y-auto scrollbar-thin bg-muted/20">
            {/* 소유주 번호 검색 결과: 매물 카드와 동일한 레이아웃으로 표시 */}
            {landlordSearched ? (
              landlordLoading ? (
                <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" style={{ color: "hsl(var(--accent))" }} />
                  <p className="text-xs">검색 중...</p>
                </div>
              ) : (landlordResults ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Phone className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-sm font-medium">연락처가 등록된 결과가 없습니다</p>
                </div>
              ) : (
                <div className="pt-2 pb-2 pr-2 pl-3 flex flex-col gap-1.5">
                  {/* 소유주 검색 결과 헤더 배너 */}
                  <div
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5"
                    style={{ background: "hsl(var(--accent)/0.08)", border: "1px solid hsl(var(--accent)/0.2)" }}
                  >
                    <Phone className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(var(--accent))" }} />
                    <span className="text-[10px] font-bold" style={{ color: "hsl(var(--accent))" }}>
                      소유주 번호 검색 결과
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {(landlordResults ?? []).length}건 (숨김·미노출 포함)
                    </span>
                  </div>
                  {(landlordResults ?? []).map((item, idx) => {
                    const isHidden = item.source === "property" && item.status !== "active";
                    const isInvisible = item.source === "contact" && item.isVisible === false;
                    // LandlordResult → MapProperty 형태로 변환하여 카드 렌더링 재사용
                    const fakePropId = idx + 900000;
                    return (
                      <div key={item.id} className="flex flex-col">
                        <div
                          className={`w-full text-left transition-all group rounded-xl overflow-hidden bg-white shadow-sm ${isHidden || isInvisible ? "opacity-80" : ""}`}
                          style={{ border: "1px solid hsl(var(--border))" }}
                        >
                          {/* Row: 동일 3컬럼 레이아웃 */}
                          <div className="flex items-stretch" style={{ width: "100%", minHeight: "80px" }}>
                            {/* ①썸네일 + 참고용 사진 */}
                            <div
                              className="w-[96px] flex-shrink-0 overflow-hidden relative"
                              style={{ minHeight: "96px" }}
                            >
                              {(() => {
                                const hasOwn = item.images && item.images.length > 0 && item.images[0];
                                let refImg: string | null = null;
                                let refImages: string[] = [];
                                let refUnit = "";
                                if (!hasOwn) {
                                  // 동일 sublabel 다른 결과에서 찾기
                                  const sibling = (landlordResults ?? []).find(
                                    (r) => r.id !== item.id && r.sublabel === item.sublabel && r.images && r.images.length > 0 && r.images[0]
                                  );
                                  if (sibling) {
                                    refImg = sibling.images![0];
                                    refImages = sibling.images!;
                                    refUnit = sibling.unitNumber || "?";
                                  }
                                  // inactive 매물에서도 찾기
                                  if (!refImg) {
                                    const addr = item.sublabel || "";
                                    const inactive = inactiveRefMap.get(addr);
                                    if (inactive) {
                                      refImg = inactive.image;
                                      refImages = inactive.images;
                                      refUnit = inactive.unitNumber;
                                    }
                                  }
                                }
                                const showImg = hasOwn ? item.images![0] : refImg;
                                const isRef = !hasOwn && !!refImg;

                                if (showImg) {
                                  return (
                                    <>
                                      <img
                                        src={showImg}
                                        alt={item.label}
                                        loading="eager"
                                        decoding="async"
                                        referrerPolicy="no-referrer"
                                        className={`w-full h-full object-cover cursor-zoom-in ${isRef ? "opacity-70" : ""}`}
                                        style={{ imageRendering: "auto" }}
                                        onError={(e) => {
                                          const img = e.currentTarget;
                                          img.style.display = "none";
                                        }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const allWithImages = (landlordResults ?? []).filter(
                                            (r) => r.sublabel === item.sublabel && r.images && r.images.length > 0 && r.images[0]
                                          );
                                          const units: LightboxUnit[] = allWithImages.map((r) => ({
                                            label: r.unitNumber ? `${r.unitNumber}호` : r.label,
                                            images: r.images!,
                                            isReference: r.id !== item.id,
                                          }));
                                          if (isRef && units.length === 0) {
                                            units.push({ label: `${refUnit}호`, images: refImages, isReference: true });
                                          }
                                          if (units.length === 0) return;
                                          const currentIdx = isRef ? units.length - 1 : allWithImages.findIndex((r) => r.id === item.id);
                                          setLightbox({ units, unitIdx: Math.max(0, currentIdx) });
                                        }}
                                      />
                                      {isRef && (
                                        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                          <span className="text-[8px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] text-center leading-tight">
                                            참고용<br/>다른 호실 사진
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  );
                                }
                                return (
                                  <div className="w-full h-full flex items-center justify-center bg-muted overflow-hidden">
                                    <img src={zibdaPlaceholder} alt="집다 로고" className="w-full h-full object-contain select-none p-1" />
                                  </div>
    
                                );
                              })()}
                              {/* 순번 + 상태 배지 오버레이 */}
                              <div
                                className="absolute bottom-0 left-0 right-0 flex items-center gap-0.5 px-1 py-0.5"
                                style={{ background: "rgba(0,0,0,0.52)" }}
                              >
                                <span className="text-[9px] font-extrabold text-white leading-none">{idx + 1}.</span>
                                {isHidden && <span className="text-[8px] text-red-300 leading-none ml-0.5">숨김</span>}
                                {isInvisible && (
                                  <span className="text-[8px] text-yellow-300 leading-none ml-0.5">미노출</span>
                                )}
                                {item.images && item.images.length > 1 && (
                                  <span className="text-[8px] text-white/80 leading-none ml-auto">
                                    📷{item.images.length}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* ②연락처 컬럼 — 소유주/관리인/부동산 */}
                            <div className="w-[28px] flex-shrink-0 flex flex-col border-l border-border/30">
                              <ContactEmojiRow propId={fakePropId} type="owner" number={item.contactOwner || null} />
                              <ContactEmojiRow
                                propId={fakePropId + 1}
                                type="manager"
                                number={item.contactManager || null}
                              />
                              <ContactEmojiRow
                                propId={fakePropId + 2}
                                type="broker"
                                number={item.contactBroker || null}
                              />
                            </div>

                            {/* ③메인 정보 */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between px-2 py-1.5 gap-0.5">
                              {/* 1행: 건물명/주소 + 유형 배지 */}
                              <div className="flex items-start gap-1">
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-extrabold text-foreground leading-tight truncate">
                                    {item.label}
                                    {item.unitNumber && (
                                      <span
                                        className="ml-1 text-[11px] font-bold px-1 py-0.5 rounded"
                                        style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}
                                      >
                                        {item.unitNumber}호
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground truncate leading-tight">
                                    {item.sublabel}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                                  {item.type && (
                                    <span
                                      className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                                      style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}
                                    >
                                      {item.type}
                                    </span>
                                  )}
                                  <span
                                    className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                                    style={
                                      item.source === "contact"
                                        ? { background: "hsl(var(--accent)/0.12)", color: "hsl(var(--accent))" }
                                        : { background: "hsl(217 91% 60%/0.12)", color: "hsl(217 91% 45%)" }
                                    }
                                  >
                                    {item.source === "contact" ? "연락처DB" : "매물"}
                                  </span>
                                </div>
                              </div>

                              {/* 2행: 층·면적·금액 */}
                              {(item.badge || item.price) && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {item.badge && (
                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                      {item.badge}
                                    </span>
                                  )}
                                  {item.price && (
                                    <span className="text-[10px] font-bold" style={{ color: "hsl(var(--primary))" }}>
                                      {item.price}
                                    </span>
                                  )}
                                </div>
                              )}

                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : displayProperties.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <MapPin className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">검색 결과가 없습니다</p>
              </div>
            ) : (
              <div className="pt-2 pb-2 pr-2 pl-3 flex flex-col gap-1.5">
                {(pinnedIds && pinnedIds.length > 0
                  ? // 핀 클릭 순서 모드: displayProperties가 이미 순서대로 정렬됨
                    [...displayProperties]
                  : [...displayProperties].sort((a, b) => {
                      const isSaleA = a.type?.includes("매매") ? 1 : 0;
                      const isSaleB = b.type?.includes("매매") ? 1 : 0;
                      if (isSaleA !== isSaleB) return isSaleA - isSaleB;
                      // 등록일 내림차순 (최신 등록 우선)
                      const regA = a.registeredDate ? new Date(a.registeredDate).getTime() : 0;
                      const regB = b.registeredDate ? new Date(b.registeredDate).getTime() : 0;
                      return regB - regA;
                    })
                ).map((prop, idx) => {
                  const buildingMemo = prop.buildingMemo;
                  const roomMemo = prop.roomMemo;
                  const buildingPw = prop.buildingPassword ?? prop.password;
                  const roomPw = prop.roomPassword;
                  const regDate = prop.registeredDate;
                  const chkDate = prop.checkedDate;
                  const isDealCompleted = dealCompletedIds.has(prop.dbId || String(prop.id));
                  return (
                    <div key={prop.id} className="flex flex-col">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (isMobile) setMobileStep(2);
                          selectedId === prop.id ? onDeselect?.() : onSelect(prop.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (isMobile) setMobileStep(2);
                            selectedId === prop.id ? onDeselect?.() : onSelect(prop.id);
                          }
                        }}
                        className={`w-full text-left transition-all group rounded-xl overflow-hidden bg-white cursor-pointer ${
                          selectedId === prop.id
                            ? "ring-2 ring-primary shadow-lg"
                            : "shadow-sm hover:shadow-md hover:ring-1 hover:ring-primary/30"
                        }`}
                      >
                        {/* Row: 3줄 레이아웃 (모바일은 썸네일/연락처 숨겨 정보 잘림 방지) */}
                        <div className="flex items-stretch" style={{ width: "100%", height: isMobile ? "auto" : "96px", minHeight: isMobile ? "72px" : undefined }}>
                          {/* ①썸네일 96px — 고화질 렌더링 + 참고용 사진 */}
                          {!isMobile && <div
                            className="w-[96px] flex-shrink-0 overflow-hidden relative group/thumb"
                            style={{ minHeight: "96px" }}
                          >
                            {(() => {
                              const hasOwnImage = prop.image && prop.image.length > 0;
                              // 사진 없으면 동일 주소 active 매물 → inactive 매물에서 참고용 사진 찾기
                              const ref = !hasOwnImage ? findRefImage(prop, displayProperties) : null;
                              const showImage = hasOwnImage ? prop.image : ref?.image || null;
                              const isRef = !hasOwnImage && !!ref;

                              if (showImage) {
                                return (
                                  <>
                                    <img
                                      src={showImage}
                                      alt={prop.title}
                                      loading="eager"
                                      decoding="async"
                                      referrerPolicy="no-referrer"
                                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isRef ? "opacity-70" : ""}`}
                                      style={{
                                        imageRendering: "auto",
                                        WebkitBackfaceVisibility: "hidden",
                                        backfaceVisibility: "hidden",
                                      }}
                                      onError={(e) => {
                                        const img = e.currentTarget;
                                        img.onerror = null;
                                        img.style.display = "none";
                                        const parent = img.parentElement;
                                        if (!parent || parent.querySelector('[data-thumb-fallback="logo"]')) return;

                                        const fallback = document.createElement("div");
                                        fallback.setAttribute("data-thumb-fallback", "logo");
                                        fallback.className = "absolute inset-0 flex items-center justify-center bg-muted overflow-hidden pointer-events-none";

                                        const logo = document.createElement("img");
                                        logo.src = zibdaPlaceholder;
                                        logo.alt = "집다 로고";
                                        logo.className = "w-full h-full object-contain select-none p-1";

                                        fallback.appendChild(logo);
                                        parent.prepend(fallback);
                                      }}
                                    />
                                    {isRef && (
                                      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                        <span className="text-[8px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)] text-center leading-tight">
                                          참고용<br/>다른 호실 사진
                                        </span>
                                      </div>
                                    )}
                                  </>
                                );
                              }
                              return (
                              <div className="w-full h-full flex items-center justify-center bg-muted overflow-hidden">
                                <img src={zibdaPlaceholder} alt="집다 로고" className="w-full h-full object-contain select-none p-1" />
                              </div>
    
                              );
                            })()}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCheckedIds((prev) => {
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
                                  <path
                                    d="M1 3.5L3.5 6L8 1"
                                    stroke="white"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </button>
                            {(() => {
                              const hasOwnImages = (prop.images && prop.images.length > 0) || (prop.image && prop.image.length > 0);
                              const ref = !hasOwnImages ? findRefImage(prop, displayProperties) : null;
                              if (!hasOwnImages && !ref) return null;
                              return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!hasOwnImages && ref) {
                                    // 참고용 사진 lightbox
                                    setLightbox({
                                      units: [{
                                        unitNumber: ref.unitNumber,
                                        roomType: ref.roomType,
                                        label: `${ref.unitNumber}호${ref.roomType ? ` ${ref.roomType}` : ""}`,
                                        images: ref.images,
                                        isReference: true
                                      }],
                                      unitIdx: 0
                                    });
                                    return;
                                  }
                                  // 동일 주소의 매물들을 호실별로 묶어서 lightbox에 전달
                                  const sameAddr = properties.filter(
                                    (p) => p.address === prop.address && ((p.images && p.images.length > 0) || p.image),
                                  );
                                  const units: LightboxUnit[] =
                                    sameAddr.length > 1
                                      ? (() => {
                                          // 현재방을 첫 번째로, 나머지는 뒤에 배치
                                          const current = sameAddr.find((p) => p.id === prop.id);
                                          const others = sameAddr.filter((p) => p.id !== prop.id);
                                          const sorted = current ? [current, ...others] : sameAddr;
                                          return sorted.map((p) => ({
                                            unitNumber: p.unitNumber ? `${p.unitNumber}호` : undefined,
                                            roomType: p.roomType || undefined,
                                            label: (p.unitNumber ? `${p.unitNumber}호` : p.title || p.address) + (p.roomType ? ` ${p.roomType}` : ""),
                                            images: p.images && p.images.length > 0 ? p.images : p.image ? [p.image] : [],
                                            isReference: p.id !== prop.id,
                                          }));
                                        })()
                                      : [
                                          {
                                            unitNumber: prop.unitNumber ? `${prop.unitNumber}호` : undefined,
                                            roomType: prop.roomType || undefined,
                                            label: (prop.unitNumber ? `${prop.unitNumber}호` : prop.title) + (prop.roomType ? ` ${prop.roomType}` : ""),
                                            images:
                                              prop.images && prop.images.length > 0
                                                ? prop.images
                                                : prop.image
                                                  ? [prop.image]
                                                  : [],
                                            isReference: false,
                                          },
                                        ];
                                  setLightbox({ units, unitIdx: 0 });
                                }}
                                className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover/thumb:bg-black/30 transition-colors"
                              >
                                <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity drop-shadow-lg" />
                              </button>
                              );
                            })()}
                          </div>}

                          {/* ②연락처 이모티콘 컬럼 — 건물주/관리인/세입자 (모바일에서는 숨김) */}
                          {!isMobile && <div className="w-[28px] flex-shrink-0 flex flex-col border-l border-border/30">
                            <ContactEmojiRow propId={prop.id} type="owner" number={prop.contactOwner ?? null} number2={prop.contactOwner2 ?? null} />
                            <ContactEmojiRow propId={prop.id} type="manager" number={prop.contactManager ?? null} />
                            <ContactEmojiRow propId={prop.id} type="tenant" number={prop.contactTenant ?? null} />
                          </div>}

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
                            userId={authUser?.userId}
                            isDealCompleted={isDealCompleted}
                            listScrollRef={listScrollRef}
                            agencyInfo={myAgencyInfo}
                            isMobile={isMobile}
                            onOpenPhotos={() => {
                              const hasOwnImages = (prop.images && prop.images.length > 0) || (prop.image && prop.image.length > 0);
                              const ref = !hasOwnImages ? findRefImage(prop, displayProperties) : null;
                              if (!hasOwnImages && !ref) return;
                              if (!hasOwnImages && ref) {
                                setLightbox({
                                  units: [{
                                    unitNumber: ref.unitNumber,
                                    roomType: ref.roomType,
                                    label: `${ref.unitNumber}호${ref.roomType ? ` ${ref.roomType}` : ""}`,
                                    images: ref.images,
                                    isReference: true,
                                  }],
                                  unitIdx: 0,
                                });
                                return;
                              }
                              const sameAddr = properties.filter(
                                (p) => p.address === prop.address && ((p.images && p.images.length > 0) || p.image),
                              );
                              const units: LightboxUnit[] = sameAddr.length > 1
                                ? (() => {
                                    const current = sameAddr.find((p) => p.id === prop.id);
                                    const others = sameAddr.filter((p) => p.id !== prop.id);
                                    const sorted = current ? [current, ...others] : sameAddr;
                                    return sorted.map((p) => ({
                                      unitNumber: p.unitNumber ? `${p.unitNumber}호` : undefined,
                                      roomType: p.roomType || undefined,
                                      label: (p.unitNumber ? `${p.unitNumber}호` : p.title || p.address) + (p.roomType ? ` ${p.roomType}` : ""),
                                      images: p.images && p.images.length > 0 ? p.images : p.image ? [p.image] : [],
                                      isReference: p.id !== prop.id,
                                    }));
                                  })()
                                : [{
                                    unitNumber: prop.unitNumber ? `${prop.unitNumber}호` : undefined,
                                    roomType: prop.roomType || undefined,
                                    label: (prop.unitNumber ? `${prop.unitNumber}호` : prop.title) + (prop.roomType ? ` ${prop.roomType}` : ""),
                                    images: prop.images && prop.images.length > 0 ? prop.images : prop.image ? [prop.image] : [],
                                    isReference: false,
                                  }];
                              setLightbox({ units, unitIdx: 0 });
                            }}
                            fallbackImage={(() => {
                              const hasOwn = (prop.images && prop.images.length > 0) || (prop.image && prop.image.length > 0);
                              if (hasOwn) return undefined;
                              const ref = findRefImage(prop, displayProperties);
                              return ref?.image;
                            })()}
                            hasReferencePhotos={(() => {
                              const hasOwn = (prop.images && prop.images.length > 0) || (prop.image && prop.image.length > 0);
                              if (hasOwn) return false;
                              return !!findRefImage(prop, displayProperties);
                            })()}
                          />
                        </div>
                      </div>

                      {/* 선택 시 액션 버튼들 — 카드 너비에 균등 배분 */}
                      {selectedId === prop.id && isMobile && (() => {
                        const owner = prop.contactOwner?.trim();
                        const owner2 = prop.contactOwner2?.trim();
                        const manager = prop.contactManager?.trim();
                        const tenant = prop.contactTenant?.trim();
                        const hasAnyContact = !!(owner || owner2 || manager || tenant);
                        const note = prop.note ?? "";
                        const brokerMatch = note.match(/중개보수[:\s]+([^\n|]+)/);
                        const cleanMatch = note.match(/청소비[:\s]+([^\n|]+)/);
                        const dirMatch = note.match(/방향[:\s]+([^\n|]+)/);
                        const lhMatch = note.match(/LH[:\s]+([^\n|]+)/);
                        const brokerFee = brokerMatch?.[1]?.trim();
                        const cleanFee = cleanMatch?.[1]?.trim();
                        const direction = dirMatch?.[1]?.trim();
                        const lhVal = lhMatch?.[1]?.trim();
                        const memos = [prop.buildingMemo, prop.roomMemo].filter(Boolean).join(" / ");
                        // 퇴거 정보 (퇴거일/중도퇴거)
                        const earlyExitM = note.includes("중도퇴거:");
                        let vacateFutureLabel = "";
                        if (prop.vacateDate) {
                          const vacateStr = prop.vacateDate.replace(/[^0-9\-\/\.]/g, "").replace(/\./g, "-").replace(/\//g, "-");
                          const vacateTime = new Date(vacateStr).getTime();
                          if (!isNaN(vacateTime) && vacateTime >= Date.now()) vacateFutureLabel = prop.vacateDate;
                        }
                        return (
                          <div className="flex flex-col gap-1.5 px-2 py-2 border-t border-primary/15 bg-muted/30 text-[11px]">
                            {/* 최상단: 소유주/관리인 라벨 칩 — 클릭 시 모달에서 번호 공개 */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1 flex-wrap">
                                {!hasAnyContact && <span className="text-muted-foreground">연락처 없음</span>}
                                {(owner || owner2) && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setMobileContactsProp(prop); }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md font-bold text-[11px]"
                                    style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))", border: "1px solid hsl(var(--primary)/0.3)" }}
                                  >
                                    <Phone className="w-3 h-3" /> 소유주
                                  </button>
                                )}
                                {manager && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setMobileContactsProp(prop); }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md font-bold text-[11px]"
                                    style={{ background: "hsl(217 91% 93%)", color: "hsl(217 91% 35%)", border: "1px solid hsl(217 91% 65%)" }}
                                  >
                                    <Phone className="w-3 h-3" /> 관리인
                                  </button>
                                )}
                                {tenant && (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setMobileContactsProp(prop); }}
                                    className="flex items-center gap-1 px-2 py-1 rounded-md font-bold text-[11px]"
                                    style={{ background: "hsl(25 95% 93%)", color: "hsl(25 95% 35%)", border: "1px solid hsl(25 80% 65%)" }}
                                  >
                                    <Phone className="w-3 h-3" /> 세입자
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
                                {chkDate && <span>확인 {chkDate.slice(5)}</span>}
                                {regDate && <span>등록 {regDate.slice(5)}</span>}
                              </div>
                            </div>
                            {/* 퇴거 정보 행 (퇴거일/중도퇴거) */}
                            {(vacateFutureLabel || earlyExitM) && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {vacateFutureLabel && (
                                  <span className="px-2 py-1 rounded-md font-extrabold text-[11px]" style={{ background: "hsl(0 85% 93%)", color: "hsl(0 85% 35%)", border: "1px solid hsl(0 85% 65%)" }}>
                                    퇴거예정 {vacateFutureLabel}
                                  </span>
                                )}
                                {earlyExitM && (
                                  <span className="px-2 py-1 rounded-md font-extrabold text-[11px]" style={{ background: "hsl(0 85% 93%)", color: "hsl(0 85% 35%)", border: "1px solid hsl(0 85% 65%)" }}>
                                    중도퇴거
                                  </span>
                                )}
                              </div>
                            )}
                            {/* 2행: 현관비번/방비번 — 진한 글씨 | 우측: 방향 */}
                            {((prop.buildingPassword || prop.password || prop.roomPassword) || direction) && (
                              <div className="flex items-center gap-2 text-[12px] flex-wrap">
                                {(prop.buildingPassword || prop.password || prop.roomPassword) && (
                                  <>
                                    <KeyRound className="w-3.5 h-3.5 text-foreground flex-shrink-0" />
                                    {(prop.buildingPassword || prop.password) && (
                                      <span className="font-extrabold text-foreground"><span className="text-muted-foreground font-bold mr-0.5">현관</span>{prop.buildingPassword || prop.password}</span>
                                    )}
                                    {prop.roomPassword && (
                                      <span className="font-extrabold text-foreground"><span className="text-muted-foreground font-bold mr-0.5">방</span>{prop.roomPassword}</span>
                                    )}
                                  </>
                                )}
                                <span className="flex-1" />
                                {direction && (
                                  <span className="px-1.5 py-0.5 rounded font-bold text-[10px]" style={{ background: "#fff3e0", color: "#e65100", border: "1px solid #ffcc80" }}>{direction}향</span>
                                )}
                              </div>
                            )}
                            {/* 3행: 수수료/메모 등 부가 정보 */}
                            {(brokerFee || cleanFee || lhVal || memos) && (
                              <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                                {brokerFee && <span className="px-1.5 py-0.5 rounded font-bold" style={{ background: "hsl(0 85% 93%)", color: "hsl(0 85% 45%)", border: "1px solid hsl(0 85% 70%)" }}>수수료 {brokerFee}</span>}
                                {cleanFee && <span className="px-1.5 py-0.5 rounded font-bold bg-muted text-muted-foreground border border-border">청소비 {cleanFee}만</span>}
                                {lhVal && lhVal !== "관계없음" && <span className="px-1.5 py-0.5 rounded font-bold" style={{ background: "hsl(217 91% 93%)", color: "hsl(217 91% 35%)", border: "1px solid hsl(217 91% 65%)" }}>{lhVal}</span>}
                                {memos && <span className="text-foreground/70 truncate">📝 {memos}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      {selectedId === prop.id && (
                        <div className="flex w-full border-t border-primary/20 overflow-hidden rounded-b-xl">
                          {/* 수정 버튼: 관리자 또는 본인이 등록한 매물 */}
                          {(isAdmin || (authUser?.userId && prop.registeredBy && prop.registeredBy === authUser.userId)) && (
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
                              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 border-r border-primary/20 transition-colors hover:opacity-80 min-w-0"
                              style={{
                                background: prop.memo ? "hsl(var(--accent)/0.12)" : "hsl(var(--muted)/0.5)",
                              }}
                            >
                              <Pencil
                                className="w-3 h-3 flex-shrink-0"
                                style={{ color: prop.memo ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }}
                              />
                              <span
                                className="text-[8px] font-bold leading-none"
                                style={{ color: prop.memo ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }}
                              >
                                {prop.memo ? "수정" : "수정불가"}
                              </span>
                            </button>
                          )}
                          {/* 건축/토지 열람 버튼 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const pid = prop.dbId || (prop.memo && prop.memo.length === 36 ? prop.memo : undefined);
                              console.log(
                                "📄 [건축/토지 클릭] property 전체 객체:",
                                JSON.stringify({
                                  id: prop.id,
                                  dbId: prop.dbId,
                                  address: prop.address,
                                  memo: prop.memo,
                                }),
                              );
                              console.log("🆔 전달 property_id:", pid ?? "(없음)");
                              setPublicRecordAddress({ address: prop.address, propertyId: pid });
                            }}
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 border-r border-primary/20 transition-colors hover:opacity-80 min-w-0"
                            style={{ background: "hsl(142 50% 95%)" }}
                          >
                            <FileSearch className="w-3 h-3 flex-shrink-0" style={{ color: "hsl(142 60% 35%)" }} />
                            <span className="text-[8px] font-bold leading-none" style={{ color: "hsl(142 60% 35%)" }}>
                              건축/토지
                            </span>
                          </button>
                          {/* 사진등록 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPhotoUploadProp(prop);
                            }}
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 bg-blue-50 hover:bg-blue-100 transition-colors border-r border-primary/20 min-w-0"
                          >
                            <Camera className="w-3 h-3 text-blue-600 flex-shrink-0" />
                            <span className="text-[8px] font-bold text-blue-700 leading-none">사진등록</span>
                          </button>
                          {/* 임대현황 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLeaseProposalProp(prop);
                            }}
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 bg-purple-50 hover:bg-purple-100 transition-colors border-r border-primary/20 min-w-0"
                          >
                            <ClipboardList className="w-3 h-3 text-purple-600 flex-shrink-0" />
                            <span className="text-[8px] font-bold text-purple-700 leading-none">임대현황</span>
                          </button>
                          {/* 거래완료 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDealCompleteProp(prop);
                            }}
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 bg-green-50 hover:bg-green-100 transition-colors border-r border-primary/20 min-w-0"
                          >
                            <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                            <span className="text-[8px] font-bold text-green-700 leading-none">거래완료</span>
                          </button>
                          {/* 오류제보 */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setErrorReportProp(prop);
                            }}
                            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 bg-red-50 hover:bg-red-100 transition-colors min-w-0"
                          >
                            <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0" />
                            <span className="text-[8px] font-bold text-red-600 leading-none">오류제보</span>
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
