import { useState, useRef } from "react";
import { Search, Phone, X, MapPin, Building2, Eye, EyeOff, AlertCircle, ChevronRight } from "lucide-react";
import { MAP_PROPERTIES } from "@/data/mapProperties";

// 일일 열람 제한
const today = () => new Date().toISOString().slice(0, 10);
const revealKey = (id: number) => `landlord_reveal_${id}`;
const hasRevealedToday = (id: number) => localStorage.getItem(revealKey(id)) === today();
const markRevealed = (id: number) => localStorage.setItem(revealKey(id), today());

interface LandlordSearchModalProps {
  onClose: () => void;
}

const LandlordSearchModal = ({ onClose }: LandlordSearchModalProps) => {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const results = searched && query.trim()
    ? MAP_PROPERTIES.filter((p) => {
        const q = query.trim().toLowerCase();
        return (
          p.address.toLowerCase().includes(q) ||
          (p.buildingName ?? "").toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q)
        );
      })
    : [];

  const handleReveal = (id: number) => {
    markRevealed(id);
    setRevealed((prev) => ({ ...prev, [id]: true }));
  };

  const isRevealed = (id: number) => revealed[id] || hasRevealedToday(id);

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
              <p className="text-[10px] text-white/70">주소 또는 건물명으로 소유주 연락처 조회</p>
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
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
                onKeyDown={(e) => e.key === "Enter" && setSearched(true)}
                placeholder="주소 또는 건물명 입력 (예: 강남구 역삼동)"
                className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                autoFocus
              />
              {query && (
                <button onClick={() => { setQuery(""); setSearched(false); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => setSearched(true)}
              disabled={!query.trim()}
              className="h-10 px-4 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="px-5 pb-5 flex flex-col gap-2 max-h-[420px] overflow-y-auto">
          {searched && query.trim() && results.length === 0 && (
            <div className="py-10 flex flex-col items-center gap-2 text-muted-foreground">
              <AlertCircle className="w-8 h-8 opacity-30" />
              <p className="text-sm">검색 결과가 없습니다.</p>
              <p className="text-xs">다른 주소나 건물명으로 검색해보세요.</p>
            </div>
          )}

          {!searched && (
            <div className="py-6 flex flex-col items-center gap-1.5 text-muted-foreground">
              <Search className="w-7 h-7 opacity-20" />
              <p className="text-xs">주소 또는 건물명을 입력 후 검색하세요.</p>
            </div>
          )}

          {results.map((prop) => {
            const show = isRevealed(prop.id);
            const hasLandlord = !!prop.contactOwner;

            return (
              <div
                key={prop.id}
                className="rounded-xl border border-border bg-background p-3.5 flex flex-col gap-2"
              >
                {/* 매물 정보 */}
                <div className="flex items-start gap-2.5">
                  <img src={prop.image} alt={prop.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{prop.buildingName ?? prop.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{prop.address}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">{prop.floor}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{prop.area}</span>
                      <span className="text-[10px] font-bold" style={{ color: "hsl(var(--accent))" }}>{prop.monthly}</span>
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}
                  >
                    #{prop.id}
                  </span>
                </div>

                {/* 연락처 */}
                <div className="border-t border-border/50 pt-2 flex flex-col gap-1.5">
                  {hasLandlord ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
                        <span className="text-[11px] font-semibold text-muted-foreground">소유주(임대인)</span>
                      </div>
                      {show ? (
                        <a
                          href={`tel:${prop.contactOwner}`}
                          className="flex items-center gap-1.5 text-sm font-bold rounded-lg px-3 py-1.5 transition-colors"
                          style={{ color: "hsl(var(--primary))", background: "hsl(var(--primary)/0.08)" }}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {prop.contactOwner}
                        </a>
                      ) : (
                        <button
                          onClick={() => handleReveal(prop.id)}
                          className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all hover:scale-105"
                          style={{ 
                            background: "hsl(var(--accent))", 
                            color: "#fff", 
                            borderColor: "hsl(var(--accent))" 
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          번호 공개
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">임대인 직접 연락처 미등록</span>
                      <span className="text-[11px] text-muted-foreground ml-auto">{prop.contact}</span>
                    </div>
                  )}

                  {prop.contactManager && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[11px] font-semibold text-muted-foreground">관리인</span>
                      </div>
                      {show ? (
                        <a
                          href={`tel:${prop.contactManager}`}
                          className="flex items-center gap-1.5 text-xs font-bold rounded-lg px-3 py-1.5 transition-colors"
                          style={{ color: "hsl(var(--primary))", background: "hsl(var(--primary)/0.08)" }}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {prop.contactManager}
                        </a>
                      ) : (
                        !hasLandlord ? (
                          <button
                            onClick={() => handleReveal(prop.id)}
                            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all hover:scale-105"
                            style={{ background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            번호 공개
                          </button>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">●●●-●●●●-●●●●</span>
                        )
                      )}
                    </div>
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
