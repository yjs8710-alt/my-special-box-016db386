import { useState } from "react";
import { Search, Phone, X, MapPin, Building2, Eye, AlertCircle, BookUser, EyeOff, ChevronLeft, ChevronRight, Images, Home, Layers, Calendar, Ruler, ChevronRight as ArrowRight, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const today = () => new Date().toISOString().slice(0, 10);
const revealKey = (id: string) => `landlord_reveal_${id}`;
const hasRevealedToday = (id: string) => localStorage.getItem(revealKey(id)) === today();
const markRevealed = (id: string) => localStorage.setItem(revealKey(id), today());

// 집합건물 유형
const COMPLEX_TYPES = ["아파트", "오피스텔", "빌라", "연립", "다세대", "주상복합"];
const isComplexBuilding = (type?: string) => type ? COMPLEX_TYPES.some(t => type.includes(t)) : false;

interface SearchResult {
  id: string;
  source: "property" | "contact";
  status?: string;
  isVisible?: boolean;
  label: string;
  sublabel: string;
  badge?: string;
  price?: string;
  images?: string[];
  contactOwner: string;
  contactManager: string;
  contactBroker: string;
  unitNumber?: string;
  // extended property fields
  floor?: string;
  area?: string;
  deposit?: string;
  monthly?: string;
  type?: string;
  buildYear?: string;
  totalFloors?: string;
  availableFrom?: string;
  note?: string;
}

// ── Photo Lightbox ──────────────────────────────────────────────
interface LightboxProps {
  images: string[];
  startIndex: number;
  onClose: () => void;
}
const Lightbox = ({ images, startIndex, onClose }: LightboxProps) => {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-[10200] flex flex-col items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
      >
        <X className="w-4 h-4 text-white" />
      </button>
      <div className="relative flex items-center justify-center w-full max-w-2xl px-12" onClick={(e) => e.stopPropagation()}>
        {images.length > 1 && (
          <button onClick={prev} className="absolute left-2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        <img
          src={images[idx]}
          alt={`photo-${idx + 1}`}
          className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl"
        />
        {images.length > 1 && (
          <button onClick={next} className="absolute right-2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-1.5 mt-4 flex-wrap justify-center px-4" onClick={(e) => e.stopPropagation()}>
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${i === idx ? "border-white" : "border-white/30 opacity-60"}`}
            >
              <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <p className="text-white/60 text-xs mt-3">{idx + 1} / {images.length}</p>
    </div>
  );
};

// ── Phone Row ───────────────────────────────────────────────────
interface PhoneRowProps {
  label: string;
  phone: string;
  color: string;
  show: boolean;
  onReveal: () => void;
}
const PhoneRow = ({ label, phone, color, show, onReveal }: PhoneRowProps) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1.5">
      <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
    </div>
    {show ? (
      <a
        href={`tel:${phone}`}
        className="flex items-center gap-1.5 text-sm font-bold rounded-lg px-3 py-1.5 transition-colors"
        style={{ color, background: `${color}18` }}
      >
        <Phone className="w-3.5 h-3.5" />{phone}
      </a>
    ) : (
      <button
        onClick={onReveal}
        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all hover:scale-105"
        style={{ background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }}
      >
        <Eye className="w-3.5 h-3.5" />번호 공개
      </button>
    )}
  </div>
);

// ── Result Card ─────────────────────────────────────────────────
interface ResultCardProps {
  item: SearchResult;
  show: boolean;
  isApproved: boolean;
  onReveal: () => void;
  onLightbox: (images: string[], idx: number) => void;
}
const ResultCard = ({ item, show, isApproved, onReveal, onLightbox }: ResultCardProps) => {
  const phoneVisible = isApproved || show;
  const [expanded, setExpanded] = useState(false);
  const isContact = item.source === "contact";
  const isHidden = item.source === "property" && item.status !== "active";
  const isInvisible = item.source === "contact" && item.isVisible === false;
  const images = item.images ?? [];
  const hasImages = images.length > 0;

  // 집합건물 호수 표기
  const displayLabel = item.unitNumber && isComplexBuilding(item.type)
    ? `${item.label} ${item.unitNumber}호`
    : item.label;

  return (
    <div
      className="rounded-xl border overflow-hidden transition-all"
      style={{
        borderColor: "hsl(var(--border))",
        background: "hsl(var(--background))",
        opacity: isHidden || isInvisible ? 0.85 : 1,
      }}
    >
      {/* Photo strip (property only) */}
      {!isContact && hasImages && (
        <div className="relative">
          <div className="flex gap-0.5 h-28 overflow-hidden">
            {images.slice(0, 4).map((img, i) => (
              <button
                key={i}
                onClick={() => onLightbox(images, i)}
                className="flex-1 min-w-0 relative overflow-hidden hover:brightness-110 transition-all"
              >
                <img src={img} alt={`img-${i}`} className="w-full h-full object-cover" />
                {i === 3 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">+{images.length - 4}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          <button
            onClick={() => onLightbox(images, 0)}
            className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md bg-black/60 text-white backdrop-blur-sm hover:bg-black/80 transition-colors"
          >
            <Images className="w-3 h-3" />사진 {images.length}장
          </button>
        </div>
      )}

      <div className="p-3 flex flex-col gap-2">
        {/* Header row */}
        <div className="flex items-start gap-2">
          {!hasImages && (
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              {isContact
                ? <BookUser className="w-4 h-4 text-muted-foreground" />
                : <Building2 className="w-4 h-4 text-muted-foreground" />}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <p className="text-xs font-bold text-foreground">{displayLabel}</p>
              {isContact ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: "hsl(var(--accent)/0.15)", color: "hsl(var(--accent))" }}>연락처DB</span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}>매물</span>
              )}
              {isHidden && (
                <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">
                  <EyeOff className="w-2.5 h-2.5" />숨김
                </span>
              )}
              {isInvisible && (
                <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-muted text-muted-foreground">
                  <EyeOff className="w-2.5 h-2.5" />미노출
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">{item.sublabel}</p>
            {(item.badge || item.price) && (
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {item.badge && <span className="text-[10px] text-muted-foreground">{item.badge}</span>}
                {item.price && <span className="text-[10px] font-bold" style={{ color: "hsl(var(--accent))" }}>{item.price}</span>}
              </div>
            )}
          </div>
        </div>

        {/* Property detail grid */}
        {!isContact && (
          <>
            <div className="grid grid-cols-3 gap-1">
              {item.area && (
                <div className="bg-muted/60 rounded-lg px-2 py-1.5">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Ruler className="w-2.5 h-2.5 text-muted-foreground" />
                    <p className="text-[9px] text-muted-foreground">면적</p>
                  </div>
                  <p className="text-[11px] font-bold text-foreground">{item.area}㎡</p>
                </div>
              )}
              {item.floor && (
                <div className="bg-muted/60 rounded-lg px-2 py-1.5">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Layers className="w-2.5 h-2.5 text-muted-foreground" />
                    <p className="text-[9px] text-muted-foreground">층수</p>
                  </div>
                  <p className="text-[11px] font-bold text-foreground">{item.floor}{item.totalFloors ? `/${item.totalFloors}` : ""}층</p>
                </div>
              )}
              {item.type && (
                <div className="bg-muted/60 rounded-lg px-2 py-1.5">
                  <div className="flex items-center gap-1 mb-0.5">
                    <Home className="w-2.5 h-2.5 text-muted-foreground" />
                    <p className="text-[9px] text-muted-foreground">유형</p>
                  </div>
                  <p className="text-[11px] font-bold text-foreground truncate">{item.type}</p>
                </div>
              )}
            </div>

            {/* Price row */}
            {(item.deposit || item.monthly) && (
              <div className="flex items-center justify-between bg-primary/5 rounded-lg px-3 py-1.5 border border-primary/10">
                <span className="text-[10px] text-muted-foreground">보증금 / 월세</span>
                <span className="text-sm font-bold" style={{ color: "hsl(var(--primary))" }}>
                  {item.deposit || "–"}만 / <span style={{ color: "hsl(var(--accent))" }}>{item.monthly || "–"}만</span>
                </span>
              </div>
            )}

            {/* Extra info toggle */}
            {(item.buildYear || item.availableFrom || item.note) && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[10px] text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors self-start"
              >
                {expanded ? "접기 ▲" : "상세 정보 보기 ▼"}
              </button>
            )}
            {expanded && (
              <div className="flex flex-col gap-1 text-[11px] text-muted-foreground pl-1 border-l-2 border-border ml-1">
                {item.buildYear && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span>준공연도: <span className="text-foreground font-medium">{item.buildYear}</span></span>
                  </div>
                )}
                {item.availableFrom && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span>입주가능: <span className="text-foreground font-medium">{item.availableFrom}</span></span>
                  </div>
                )}
                {item.note && (
                  <p className="text-[10px] bg-muted/50 rounded px-2 py-1 mt-0.5">{item.note}</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Phone numbers */}
        <div className="border-t border-border/50 pt-2 flex flex-col gap-1.5">
          {isApproved && (
            <div className="flex items-center gap-1 mb-0.5">
              <ShieldCheck className="w-3 h-3" style={{ color: "hsl(var(--chart-2))" }} />
              <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--chart-2))" }}>승인 회원 — 제한없이 열람 가능</span>
            </div>
          )}
          {item.contactOwner ? (
            <PhoneRow label="소유주(임대인)" phone={item.contactOwner} color="hsl(var(--primary))" show={phoneVisible} onReveal={onReveal} />
          ) : (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">임대인 직접 연락처 미등록</span>
            </div>
          )}
          {item.contactManager && (
            <PhoneRow label="관리인" phone={item.contactManager} color="hsl(var(--chart-4))" show={phoneVisible} onReveal={onReveal} />
          )}
          {item.contactBroker && (
            <PhoneRow label="부동산" phone={item.contactBroker} color="hsl(var(--chart-3))" show={phoneVisible} onReveal={onReveal} />
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Panel (사이드 패널 형태, 모달 아님) ──────────────────────────────────
interface LandlordSearchModalProps {
  onClose: () => void;
}

const LandlordSearchModal = ({ onClose }: LandlordSearchModalProps) => {
  const { isAuthorized, isLoading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState<{ images: string[]; idx: number } | null>(null);

  const isApproved = !authLoading && isAuthorized;

  const handleReveal = (id: string) => {
    markRevealed(id);
    setRevealed((prev) => ({ ...prev, [id]: true }));
  };
  const isRevealed = (id: string) => isApproved || revealed[id] || hasRevealedToday(id);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearched(true);
    setLoading(true);
    setError("");
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("landlord-search", {
        body: { q: query.trim() },
      });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);
      setResults((data?.results ?? []) as SearchResult[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {lightbox && (
        <Lightbox
          images={lightbox.images}
          startIndex={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* 우측 사이드 패널 — 매물 사이드바와 동일한 스타일 */}
      <div
        className="flex flex-col border-l border-border bg-card"
        style={{
          width: "320px",
          height: "100%",
          flexShrink: 0,
          position: "relative",
          zIndex: 100,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(218 88% 32%))" }}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Phone className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">소유주 번호 찾기</p>
              <p className="text-[9px] text-white/70">숨김 매물·미노출 연락처 포함</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0 border-b border-border/40">
          <div className="flex gap-1.5">
            <div className="flex-1 flex items-center gap-1.5 bg-muted/40 border border-border rounded-lg px-2.5 h-9 focus-within:border-primary transition-colors">
              <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="동, 번지, 건물명, 전화번호"
                className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                autoFocus
              />
              {query && (
                <button onClick={() => { setQuery(""); setSearched(false); setResults([]); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              className="h-9 px-3 rounded-lg text-xs font-bold text-white transition-colors disabled:opacity-40 flex items-center"
              style={{ background: "hsl(var(--primary))" }}
            >
              {loading ? <span className="animate-pulse text-[10px]">...</span> : <Search className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Results list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
          {error && (
            <div className="py-3 flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}
          {searched && !loading && !error && results.length === 0 && (
            <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-7 h-7 opacity-30" />
              <p className="text-xs text-center">연락처가 등록된 결과가 없습니다.</p>
            </div>
          )}
          {!searched && (
            <div className="py-6 flex flex-col items-center gap-1.5 text-muted-foreground">
              <Search className="w-6 h-6 opacity-20" />
              <p className="text-[11px] text-center">동 이름, 번지수 또는 건물명을 입력 후 검색하세요.</p>
            </div>
          )}
          {loading && (
            <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">검색 중...</p>
            </div>
          )}

          {!loading && results.map((item) => (
            <ResultCard
              key={item.id}
              item={item}
              show={isRevealed(item.id)}
              isApproved={isApproved}
              onReveal={() => handleReveal(item.id)}
              onLightbox={(imgs, idx) => setLightbox({ images: imgs, idx })}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-3 pb-3 flex-shrink-0 border-t border-border/40 pt-2">
          {isApproved ? (
            <div className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3 h-3" style={{ color: "hsl(var(--chart-2))" }} />
              <p className="text-[9px] font-semibold" style={{ color: "hsl(var(--chart-2))" }}>
                승인된 회원 — 번호 제한없이 열람 가능
              </p>
            </div>
          ) : (
            <p className="text-[9px] text-muted-foreground text-center">
              연락처는 일 1회 열람 가능 · 승인 회원은 제한없이 조회
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default LandlordSearchModal;
