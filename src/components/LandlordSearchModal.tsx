import { useState } from "react";
import { Search, Phone, X, MapPin, Building2, Eye, AlertCircle, BookUser, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// 일일 열람 제한
const today = () => new Date().toISOString().slice(0, 10);
const revealKey = (id: string) => `landlord_reveal_${id}`;
const hasRevealedToday = (id: string) => localStorage.getItem(revealKey(id)) === today();
const markRevealed = (id: string) => localStorage.setItem(revealKey(id), today());

interface SearchResult {
  id: string;
  source: "property" | "contact";
  status?: string;       // 매물 상태 (active/hidden)
  isVisible?: boolean;   // 연락처 노출 여부
  label: string;
  sublabel: string;
  badge?: string;
  price?: string;
  images?: string[];
  contactOwner: string;
  contactManager: string;
  contactBroker: string;
}

interface LandlordSearchModalProps {
  onClose: () => void;
}

// 번호 공개 행 컴포넌트
const PhoneRow = ({
  label,
  phone,
  id,
  color,
  isRevealed,
  onReveal,
}: {
  label: string;
  phone: string;
  id: string;
  color: string;
  isRevealed: boolean;
  onReveal: () => void;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-1.5">
      <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
      <span className="text-[11px] font-semibold text-muted-foreground">{label}</span>
    </div>
    {isRevealed ? (
      <a
        href={`tel:${phone}`}
        className="flex items-center gap-1.5 text-sm font-bold rounded-lg px-3 py-1.5 transition-colors"
        style={{ color, background: `${color}18` }}
      >
        <Phone className="w-3.5 h-3.5" />
        {phone}
      </a>
    ) : (
      <button
        onClick={onReveal}
        className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all hover:scale-105"
        style={{ background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }}
      >
        <Eye className="w-3.5 h-3.5" />
        번호 공개
      </button>
    )}
  </div>
);

const LandlordSearchModal = ({ onClose }: LandlordSearchModalProps) => {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [error, setError] = useState("");

  const handleReveal = (id: string) => {
    markRevealed(id);
    setRevealed((prev) => ({ ...prev, [id]: true }));
  };

  const isRevealed = (id: string) => revealed[id] || hasRevealedToday(id);

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
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const PhoneRow = ({
    label,
    phone,
    id,
    color,
  }: {
    label: string;
    phone: string;
    id: string;
    color: string;
  }) => {
    const show = isRevealed(id);
    return (
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
            <Phone className="w-3.5 h-3.5" />
            {phone}
          </a>
        ) : (
          <button
            onClick={() => handleReveal(id)}
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all hover:scale-105"
            style={{ background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }}
          >
            <Eye className="w-3.5 h-3.5" />
            번호 공개
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[10100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-border"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(218 88% 32%))" }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Phone className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">소유주 번호 찾기</p>
              <p className="text-[10px] text-white/70">주소·건물명·동으로 소유주 연락처 조회 (미노출 포함)</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-muted/40 border border-border rounded-xl px-3 h-10 focus-within:border-primary transition-colors">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="동 이름, 번지수, 건물명, 전화번호 입력"
                className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                autoFocus
              />
              {query && (
                <button onClick={() => { setQuery(""); setSearched(false); setResults([]); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={!query.trim() || loading}
              className="h-10 px-4 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40"
              style={{ background: "hsl(var(--primary))" }}
            >
              {loading ? <span className="animate-pulse text-xs">...</span> : <Search className="w-4 h-4" />}
            </button>
          </div>
          {searched && !loading && (
            <p className="text-[10px] text-muted-foreground mt-1.5 pl-1">
              매물(숨김 포함) + 청주 연락처DB 전체 통합 검색 결과
            </p>
          )}
        </div>

        {/* Results */}
        <div className="px-5 pb-5 flex flex-col gap-2 max-h-[420px] overflow-y-auto">
          {error && (
            <div className="py-4 flex items-center gap-2 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {searched && !loading && !error && results.length === 0 && (
            <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-8 h-8 opacity-30" />
              <p className="text-sm">연락처가 등록된 검색 결과가 없습니다.</p>
              <p className="text-xs">다른 주소나 동 이름으로 검색해보세요.</p>
            </div>
          )}

          {!searched && (
            <div className="py-6 flex flex-col items-center gap-1.5 text-muted-foreground">
              <Search className="w-7 h-7 opacity-20" />
              <p className="text-xs">동 이름, 번지수 또는 건물명을 입력 후 검색하세요.</p>
            </div>
          )}

          {loading && (
            <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">검색 중...</p>
            </div>
          )}

          {!loading && results.map((item) => {
            const thumb = item.images && item.images.length > 0 ? item.images[0] : null;
            const isContact = item.source === "contact";
            const isHidden = item.source === "property" && item.status !== "active";
            const isInvisible = item.source === "contact" && item.isVisible === false;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-background p-3.5 flex flex-col gap-2"
                style={isHidden || isInvisible ? { borderColor: "hsl(var(--muted))", opacity: 0.85 } : {}}
              >
                {/* 매물/연락처 정보 */}
                <div className="flex items-start gap-2.5">
                  {!isContact && thumb ? (
                    <img src={thumb} alt={item.label} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      {isContact
                        ? <BookUser className="w-5 h-5 text-muted-foreground" />
                        : <Building2 className="w-5 h-5 text-muted-foreground" />
                      }
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <p className="text-xs font-bold text-foreground truncate">{item.label}</p>
                      {/* 출처 배지 */}
                      {isContact ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: "hsl(var(--accent)/0.15)", color: "hsl(var(--accent))" }}>
                          연락처DB
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}>
                          매물
                        </span>
                      )}
                      {/* 숨김 상태 배지 */}
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
                    <p className="text-[11px] text-muted-foreground truncate">{item.sublabel}</p>
                    {(item.badge || item.price) && (
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {item.badge && <span className="text-[10px] text-muted-foreground">{item.badge}</span>}
                        {item.price && (
                          <span className="text-[10px] font-bold" style={{ color: "hsl(var(--accent))" }}>{item.price}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 연락처 */}
                <div className="border-t border-border/50 pt-2 flex flex-col gap-1.5">
                  {item.contactOwner ? (
                    <PhoneRow label="소유주(임대인)" phone={item.contactOwner} id={item.id} color="hsl(var(--primary))" />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">임대인 직접 연락처 미등록</span>
                    </div>
                  )}
                  {item.contactManager && (
                    <PhoneRow label="관리인" phone={item.contactManager} id={item.id} color="hsl(var(--chart-4))" />
                  )}
                  {item.contactBroker && (
                    <PhoneRow label="부동산" phone={item.contactBroker} id={item.id} color="hsl(var(--chart-3))" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 안내 */}
        <div className="px-5 pb-4">
          <p className="text-[10px] text-muted-foreground text-center">
            ℹ️ 연락처는 일 1회 열람 가능하며, 무분별한 조회는 제한될 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandlordSearchModal;
