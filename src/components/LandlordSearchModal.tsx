import { useState, useRef } from "react";
import { Search, Phone, X, MapPin, Building2, Eye, AlertCircle, BookUser } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// 일일 열람 제한
const today = () => new Date().toISOString().slice(0, 10);
const revealKey = (id: string) => `landlord_reveal_${id}`;
const hasRevealedToday = (id: string) => localStorage.getItem(revealKey(id)) === today();
const markRevealed = (id: string) => localStorage.setItem(revealKey(id), today());

// 통합 결과 타입
interface SearchResult {
  id: string;
  source: "property" | "contact"; // 매물 or 청주연락처
  label: string;         // 건물명 or 동+번지
  sublabel: string;      // 주소 or 구+동
  badge?: string;        // 층, 면적 등
  price?: string;        // 월세 정보
  images?: string[];
  contactOwner: string;
  contactManager: string;
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
  const [results, setResults] = useState<SearchResult[]>([]);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

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

    // 두 테이블 병렬 조회
    const [propRes, contactRes] = await Promise.all([
      supabase
        .from("properties")
        .select("id, title, building_name, address, floor, area, monthly, deposit, images, note, agent_name, dong, lot_number")
        .eq("status", "active")
        .or(`address.ilike.%${q}%,building_name.ilike.%${q}%,title.ilike.%${q}%,dong.ilike.%${q}%`)
        .limit(20),
      supabase
        .from("cheongju_contacts")
        .select("id, district, dong, lot_number, phone, contact_owner, contact_manager, memo")
        .eq("is_visible", true)
        .or(`dong.ilike.%${q}%,lot_number.ilike.%${q}%,contact_owner.ilike.%${q}%,contact_manager.ilike.%${q}%,phone.ilike.%${q}%`)
        .limit(20),
    ]);

    const merged: SearchResult[] = [];

    // 매물 결과
    if (!propRes.error && propRes.data) {
      for (const row of propRes.data) {
        const noteStr = row.note ?? row.agent_name ?? "";
        const owner = parseContact(noteStr, "건물주");
        const manager = parseContact(noteStr, "관리인");
        if (!owner && !manager) continue; // 연락처 없는 매물은 제외
        merged.push({
          id: `prop_${row.id}`,
          source: "property",
          label: row.building_name ?? row.title,
          sublabel: row.address,
          badge: [row.floor, row.area ? `${row.area}㎡` : ""].filter(Boolean).join(" · "),
          price: row.monthly ? `${row.deposit ? row.deposit + "/" : ""}${row.monthly}만` : undefined,
          images: Array.isArray(row.images) ? row.images : [],
          contactOwner: owner,
          contactManager: manager,
        });
      }
    }

    // 청주연락처 결과 (매물 주소와 중복 방지: dong+lot_number 기준)
    const propDongLots = new Set(
      (propRes.data ?? []).map((r) => `${r.dong}_${r.lot_number}`)
    );

    if (!contactRes.error && contactRes.data) {
      for (const row of contactRes.data) {
        const owner = row.contact_owner ?? row.phone ?? "";
        const manager = row.contact_manager ?? "";
        if (!owner && !manager) continue; // 연락처 없는 항목 제외
        const key = `${row.dong}_${row.lot_number}`;
        if (propDongLots.has(key)) continue; // 이미 매물에서 노출된 경우 제외
        const addrLabel = row.lot_number
          ? `${row.dong} ${row.lot_number}`
          : row.dong;
        merged.push({
          id: `contact_${row.id}`,
          source: "contact",
          label: addrLabel,
          sublabel: `청주시 ${row.district} ${row.dong}`,
          contactOwner: owner,
          contactManager: manager,
        });
      }
    }

    setResults(merged);
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
              <p className="text-[10px] text-white/70">주소·건물명·동으로 소유주 연락처 조회</p>
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
                placeholder="동 이름, 번지수, 건물명 입력 (예: 개신동, 복대동)"
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
              매물 등록 정보 + 청주 연락처 DB 통합 검색 결과
            </p>
          )}
        </div>

        {/* Results */}
        <div className="px-5 pb-5 flex flex-col gap-2 max-h-[420px] overflow-y-auto">
          {searched && !loading && results.length === 0 && (
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
            const show = isRevealed(item.id);
            const thumb = item.images && item.images.length > 0 ? item.images[0] : null;
            const isContact = item.source === "contact";

            return (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-background p-3.5 flex flex-col gap-2"
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
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-foreground truncate">{item.label}</p>
                      {isContact && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: "hsl(var(--accent)/0.15)", color: "hsl(var(--accent))" }}>
                          연락처DB
                        </span>
                      )}
                      {!isContact && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: "hsl(var(--primary)/0.1)", color: "hsl(var(--primary))" }}>
                          매물
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "hsl(var(--primary))" }} />
                        <span className="text-[11px] font-semibold text-muted-foreground">소유주(임대인)</span>
                      </div>
                      {show ? (
                        <a
                          href={`tel:${item.contactOwner}`}
                          className="flex items-center gap-1.5 text-sm font-bold rounded-lg px-3 py-1.5 transition-colors"
                          style={{ color: "hsl(var(--primary))", background: "hsl(var(--primary)/0.08)" }}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {item.contactOwner}
                        </a>
                      ) : (
                        <button
                          onClick={() => handleReveal(item.id)}
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

                  {item.contactManager && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[11px] font-semibold text-muted-foreground">관리인</span>
                      </div>
                      {show ? (
                        <a
                          href={`tel:${item.contactManager}`}
                          className="flex items-center gap-1.5 text-xs font-bold rounded-lg px-3 py-1.5 transition-colors"
                          style={{ color: "hsl(var(--primary))", background: "hsl(var(--primary)/0.08)" }}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {item.contactManager}
                        </a>
                      ) : (
                        <button
                          onClick={() => handleReveal(item.id)}
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
