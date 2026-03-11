import { useState, useRef, useEffect } from "react";
import { Search, Phone, X, MapPin, Building2, Eye, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// 일일 열람 제한
const today = () => new Date().toISOString().slice(0, 10);
const revealKey = (id: string) => `landlord_reveal_${id}`;
const hasRevealedToday = (id: string) => localStorage.getItem(revealKey(id)) === today();
const markRevealed = (id: string) => localStorage.setItem(revealKey(id), today());

interface LandlordProperty {
  id: string;
  title: string;
  building_name: string | null;
  address: string;
  floor: string;
  area: string;
  monthly: string;
  deposit: string;
  images: string[];
  note: string | null;
  agent_name: string;
}

function parseContact(noteStr: string, key: string): string {
  const m = noteStr.match(new RegExp(`${key}[:\\s]+([0-9\\-]+)`));
  return m ? m[1].trim() : "";
}

interface LandlordSearchModalProps {
  onClose: () => void;
}

const LandlordSearchModal = ({ onClose }: LandlordSearchModalProps) => {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LandlordProperty[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const handleReveal = (id: string) => {
    markRevealed(id);
    setRevealed((prev) => ({ ...prev, [id]: true }));
  };

  const isRevealed = (id: string) => revealed[id] || hasRevealedToday(id);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearched(true);
    setLoading(true);
    const q = query.trim();

    const { data, error } = await supabase
      .from("properties")
      .select("id, title, building_name, address, floor, area, monthly, deposit, images, note, agent_name")
      .eq("status", "active")
      .or(`address.ilike.%${q}%,building_name.ilike.%${q}%,title.ilike.%${q}%,dong.ilike.%${q}%`)
      .limit(30);

    if (!error && data) {
      setResults(data as LandlordProperty[]);
    } else {
      setResults([]);
      if (error) console.error("[소유주검색] 오류:", error.message);
    }
    setLoading(false);
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
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="주소 또는 건물명 입력 (예: 개신동, 성화동)"
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
        </div>

        {/* Results */}
        <div className="px-5 pb-5 flex flex-col gap-2 max-h-[420px] overflow-y-auto">
          {searched && !loading && results.length === 0 && (
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

          {loading && (
            <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">검색 중...</p>
            </div>
          )}

          {!loading && results.map((prop) => {
            const noteStr = prop.note ?? prop.agent_name ?? "";
            const contactOwner = parseContact(noteStr, "건물주");
            const contactManager = parseContact(noteStr, "관리인");
            const hasLandlord = !!contactOwner;
            const show = isRevealed(prop.id);
            const thumb = Array.isArray(prop.images) && prop.images.length > 0 ? prop.images[0] : null;

            return (
              <div
                key={prop.id}
                className="rounded-xl border border-border bg-background p-3.5 flex flex-col gap-2"
              >
                {/* 매물 정보 */}
                <div className="flex items-start gap-2.5">
                  {thumb ? (
                    <img src={thumb} alt={prop.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{prop.building_name ?? prop.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{prop.address}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">{prop.floor}</span>
                      {prop.area && <><span className="text-[10px] text-muted-foreground">·</span><span className="text-[10px] text-muted-foreground">{prop.area}</span></>}
                      {prop.monthly && <span className="text-[10px] font-bold" style={{ color: "hsl(var(--accent))" }}>{prop.deposit ? `${prop.deposit}/` : ""}{prop.monthly}</span>}
                    </div>
                  </div>
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
                          href={`tel:${contactOwner}`}
                          className="flex items-center gap-1.5 text-sm font-bold rounded-lg px-3 py-1.5 transition-colors"
                          style={{ color: "hsl(var(--primary))", background: "hsl(var(--primary)/0.08)" }}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {contactOwner}
                        </a>
                      ) : (
                        <button
                          onClick={() => handleReveal(prop.id)}
                          className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all hover:scale-105"
                          style={{ background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }}
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
                    </div>
                  )}

                  {contactManager && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[11px] font-semibold text-muted-foreground">관리인</span>
                      </div>
                      {show ? (
                        <a
                          href={`tel:${contactManager}`}
                          className="flex items-center gap-1.5 text-xs font-bold rounded-lg px-3 py-1.5 transition-colors"
                          style={{ color: "hsl(var(--primary))", background: "hsl(var(--primary)/0.08)" }}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {contactManager}
                        </a>
                      ) : (
                        <button
                          onClick={() => handleReveal(prop.id)}
                          className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all hover:scale-105"
                          style={{ background: "hsl(var(--accent))", color: "#fff", borderColor: "hsl(var(--accent))" }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          번호 공개
                        </button>
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
