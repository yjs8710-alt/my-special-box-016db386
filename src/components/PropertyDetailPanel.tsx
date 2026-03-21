import {
  X, MapPin, Eye, Heart, Phone, Calendar, Building2, Car, Maximize2,
  Layers, BadgeCheck, Share2, ArrowUpRight, FileText, ExternalLink,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, EyeOff, Eye as EyeIcon,
  AlertTriangle, CheckCircle2, Send, ClipboardList,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { MapProperty } from "@/data/mapProperties";
import { supabase } from "@/integrations/supabase/client";
import { formatPhone } from "@/lib/utils";


interface PropertyDetailPanelProps {
  property: MapProperty | null;
  onClose: () => void;
  sameProperties?: MapProperty[]; // 동일 주소 다른 호실 매물
}

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  "상가":     { bg: "bg-primary",   text: "text-white" },
  "사무실":   { bg: "bg-purple-600", text: "text-white" },
  "식당·카페":{ bg: "bg-accent",    text: "text-white" },
  "공장·창고":{ bg: "bg-green-600", text: "text-white" },
  "병원·학원":{ bg: "bg-red-700",   text: "text-white" },
};

/* ─── 풀스크린 라이트박스 ─── */
interface LightboxUnit { label: string; images: string[] }
function Lightbox({ units, startUnitIdx = 0, startImgIdx = 0, onClose }: {
  units: LightboxUnit[];
  startUnitIdx?: number;
  startImgIdx?: number;
  onClose: () => void;
}) {
  const [unitIdx, setUnitIdx] = useState(startUnitIdx);
  const [imgIdx, setImgIdx] = useState(startImgIdx);
  const currentImages = units[unitIdx]?.images ?? [];

  const prev = useCallback(() => setImgIdx((i) => (i - 1 + currentImages.length) % currentImages.length), [currentImages.length]);
  const next = useCallback(() => setImgIdx((i) => (i + 1) % currentImages.length), [currentImages.length]);
  const handleUnitChange = (i: number) => { setUnitIdx(i); setImgIdx(0); };

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
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center backdrop-blur-sm transition-colors z-10"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {/* 호실 탭 — 2개 이상일 때만 */}
      {units.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 max-w-[80vw] flex-wrap justify-center" onClick={(e) => e.stopPropagation()}>
          {units.map((u, i) => (
            <button
              key={i}
              onClick={() => handleUnitChange(i)}
              className="px-3 py-1 rounded-full text-xs font-bold transition-all"
              style={i === unitIdx
                ? { background: "hsl(var(--primary))", color: "#fff" }
                : { background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)" }}
            >
              {u.label}
            </button>
          ))}
        </div>
      )}

      <div
        className={`absolute bg-black/50 text-white text-sm font-bold px-3 py-1 rounded-full backdrop-blur-sm z-10 ${units.length > 1 ? "top-14 right-4" : "top-4 left-1/2 -translate-x-1/2"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {imgIdx + 1} / {currentImages.length}
      </div>

      <div
        className="relative w-full h-full overflow-hidden"
        style={{ paddingTop: units.length > 1 ? "56px" : "0" }}
        onClick={(e) => e.stopPropagation()}
      >
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
              style={{ borderColor: i === imgIdx ? "hsl(var(--primary))" : "transparent", opacity: i === imgIdx ? 1 : 0.5 }}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── 전화번호 클릭시 노출 컴포넌트 ─── */
function RevealPhone({ label, phone }: { label: string; phone?: string }) {
  const [revealed, setRevealed] = useState(false);
  if (!phone) return null;

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl border border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Phone className="w-3 h-3 text-primary" />
        </div>
        <span className="text-xs font-semibold text-foreground">{label}</span>
      </div>
      {revealed ? (
        <div className="flex items-center gap-2">
          <a href={`tel:${phone}`} className="text-xs font-bold text-primary hover:underline">
            {phone}
          </a>
          <button
            onClick={() => setRevealed(false)}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            title="숨기기"
          >
            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
          style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}
        >
          <EyeIcon className="w-3 h-3" />
          번호 보기
        </button>
      )}
    </div>
  );
}

/* ─── 이미지 캐러셀 ─── */
function ImageCarousel({ images, title, onImageClick }: { images: string[]; title: string; onImageClick: (idx: number) => void }) {
  const [idx, setIdx] = useState(0);
  const imgs = images.filter(Boolean);

  if (imgs.length === 0) {
    return (
      <div className="relative flex-shrink-0 h-48 bg-muted flex items-center justify-center">
        <Building2 className="w-12 h-12 text-muted-foreground/30" />
      </div>
    );
  }

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i - 1 + imgs.length) % imgs.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i + 1) % imgs.length);
  };

  return (
    <div className="relative flex-shrink-0 h-48 overflow-hidden bg-muted">
      <div
        className="flex h-full transition-transform duration-300 ease-in-out cursor-zoom-in"
        style={{ transform: `translateX(-${idx * 100}%)`, width: `${imgs.length * 100}%` }}
        onClick={() => onImageClick(idx)}
      >
        {imgs.map((src, i) => (
          <div key={i} className="h-full flex-shrink-0" style={{ width: `${100 / imgs.length}%` }}>
            <img src={src} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
      {imgs.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center backdrop-blur-sm transition-colors">
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center backdrop-blur-sm transition-colors">
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1">
            {imgs.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i === idx ? "#fff" : "rgba(255,255,255,0.45)" }}
              />
            ))}
          </div>
          <div className="absolute top-3 left-3 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
            {idx + 1} / {imgs.length}
          </div>
        </>
      )}
      <div className="absolute bottom-3 right-3 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm pointer-events-none flex items-center gap-1">
        <Maximize2 className="w-2.5 h-2.5" />
        클릭하여 크게 보기
      </div>
    </div>
  );
}

/* ─── 오류제보 모달 ─── */
function ErrorReportModal({ property, onClose }: { property: MapProperty; onClose: () => void }) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from("property_reports").insert({
        property_id: String(property.id),
        property_title: property.title,
        property_address: property.address,
        report_type: "error_report",
        error_content: content.trim(),
        submitted_by: session?.user?.id ?? null,
      });
      if (error) throw error;
      setDone(true);
    } catch (e) {
      console.error("오류제보 저장 실패:", e);
      alert("제보 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border" style={{ background: "hsl(var(--destructive) / 0.08)" }}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" style={{ color: "hsl(var(--destructive))" }} />
            <h3 className="text-sm font-bold text-foreground">오류 제보</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted/50">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        {done ? (
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-10 h-10" style={{ color: "hsl(var(--chart-2))" }} />
            <p className="text-sm font-bold text-foreground">제보가 접수되었습니다</p>
            <p className="text-xs text-muted-foreground">관리자가 검토 후 처리할 예정입니다.</p>
            <button onClick={onClose} className="mt-2 px-5 py-2 rounded-full text-xs font-bold text-white" style={{ background: "hsl(var(--primary))" }}>확인</button>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">대상 매물</p>
              <p className="text-xs font-semibold text-foreground truncate">{property.title}</p>
              <p className="text-[11px] text-muted-foreground">{property.address}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">오류 내용 *</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="잘못된 정보, 허위 매물 등 오류 내용을 입력해주세요."
                rows={4}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || saving}
              className="w-full h-10 rounded-full text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ background: "hsl(var(--destructive))" }}
            >
              {saving ? "제출 중..." : "제보하기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 거래완료 모달 ─── */
function DealCompleteModal({ property, onClose }: { property: MapProperty; onClose: () => void }) {
  const [dealDate, setDealDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from("property_reports").insert({
        property_id: String(property.id),
        property_title: property.title,
        property_address: property.address,
        report_type: "deal_complete",
        deal_date: dealDate,
        deal_memo: memo.trim() || null,
        submitted_by: session?.user?.id ?? null,
      });
      if (error) throw error;
      setDone(true);
    } catch (e) {
      console.error("거래완료 저장 실패:", e);
      alert("처리 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border" style={{ background: "hsl(var(--chart-2) / 0.08)" }}>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" style={{ color: "hsl(var(--chart-2))" }} />
            <h3 className="text-sm font-bold text-foreground">거래 완료 처리</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted/50">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        {done ? (
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-10 h-10" style={{ color: "hsl(var(--chart-2))" }} />
            <p className="text-sm font-bold text-foreground">거래완료가 접수되었습니다</p>
            <p className="text-xs text-muted-foreground">관리자가 확인 후 매물 상태를 변경합니다.</p>
            <button onClick={onClose} className="mt-2 px-5 py-2 rounded-full text-xs font-bold text-white" style={{ background: "hsl(var(--primary))" }}>확인</button>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4">
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">대상 매물</p>
              <p className="text-xs font-semibold text-foreground truncate">{property.title}</p>
              <p className="text-[11px] text-muted-foreground">{property.address}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">거래 완료일</label>
              <input
                type="date"
                value={dealDate}
                onChange={(e) => setDealDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">메모 (선택)</label>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="거래 관련 메모를 입력하세요."
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full h-10 rounded-full text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ background: "hsl(var(--chart-2))" }}
            >
              {saving ? "처리 중..." : "거래완료 신청"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 임대제안서 모달 (호실별 보증금·월세 + 합계 + 융자금) ─── */
interface RoomRow { unit: string; deposit: string; monthly: string }

function RentalProposalModal({ property, onClose }: { property: MapProperty; onClose: () => void }) {
  const [proposerName, setProposerName] = useState("");
  const [proposerPhone, setProposerPhone] = useState("");
  const [proposerCompany, setProposerCompany] = useState("");
  const [period, setPeriod] = useState("");
  const [loanAmount, setLoanAmount] = useState(""); // 융자금
  const [loanItems, setLoanItems] = useState<{ label: string; amount: string }[]>([{ label: "", amount: "" }]); // 융자 내역
  const [content, setContent] = useState("");
  // 호실별 행
  const [rooms, setRooms] = useState<RoomRow[]>([{ unit: "", deposit: "", monthly: "" }]);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const ic = "w-full px-3 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20";

  const setRoom = (i: number, key: keyof RoomRow, v: string) =>
    setRooms((r) => r.map((row, idx) => idx === i ? { ...row, [key]: v } : row));

  const addRoom = () => setRooms((r) => [...r, { unit: "", deposit: "", monthly: "" }]);
  const removeRoom = (i: number) => setRooms((r) => r.filter((_, idx) => idx !== i));

  const setLoanItem = (i: number, key: "label" | "amount", v: string) =>
    setLoanItems((l) => l.map((row, idx) => idx === i ? { ...row, [key]: v } : row));
  const addLoanItem = () => setLoanItems((l) => [...l, { label: "", amount: "" }]);
  const removeLoanItem = (i: number) => setLoanItems((l) => l.filter((_, idx) => idx !== i));

  // 보증금 합계
  const totalDeposit = rooms.reduce((sum, r) => {
    const num = parseFloat(r.deposit.replace(/[^0-9.]/g, "")) || 0;
    return sum + num;
  }, 0);

  // 월세 합계
  const totalMonthly = rooms.reduce((sum, r) => {
    const num = parseFloat(r.monthly.replace(/[^0-9.]/g, "")) || 0;
    return sum + num;
  }, 0);

  // 융자 합계
  const totalLoan = loanItems.reduce((sum, l) => {
    const num = parseFloat(l.amount.replace(/[^0-9.]/g, "")) || 0;
    return sum + num;
  }, 0);

  // 동일 주소 매물에서 호실별 월세 자동 불러오기
  const loadRoomsFromDB = useCallback(async () => {
    if (!property.address) return;
    setLoadingRooms(true);
    try {
      const { data } = await supabase
        .from("properties")
        .select("unit_number,deposit,monthly")
        .eq("dong", property.address.split(" ").slice(-2, -1)[0] || "")
        .eq("lot_number", property.address.split(" ").slice(-1)[0] || "")
        .eq("status", "active")
        .order("unit_number", { ascending: true });

      if (data && data.length > 0) {
        const loaded: RoomRow[] = data.map((r) => ({
          unit: r.unit_number || "-",
          deposit: r.deposit || "",
          monthly: r.monthly || "",
        }));
        setRooms(loaded);
      }
    } catch (e) {
      console.error("호실 자동 로드 실패:", e);
    } finally {
      setLoadingRooms(false);
    }
  }, [property.address]);

  const handleSubmit = async () => {
    if (!proposerName.trim() || !proposerPhone.trim()) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // 호실별 내용을 proposal_content에 구조화
      const roomLines = rooms
        .filter(r => r.unit || r.deposit || r.monthly)
        .map(r => `[${r.unit || "-"}호] 보증금 ${r.deposit || "0"}만원 / 월세 ${r.monthly || "0"}만원`)
        .join("\n");

      const fullContent = [
        roomLines && `■ 호실별 임대 조건\n${roomLines}`,
        totalDeposit > 0 && `■ 보증금 합계: ${totalDeposit.toLocaleString()}만원`,
        loanAmount && `■ 융자금: ${loanAmount}만원`,
        content && `■ 추가 내용\n${content}`,
      ].filter(Boolean).join("\n\n");

      // 대표 보증금·월세 (첫 번째 유효 행 기준)
      const firstRoom = rooms.find(r => r.deposit || r.monthly);

      const { error } = await supabase.from("property_reports").insert({
        property_id: String(property.id),
        property_title: property.title,
        property_address: property.address,
        report_type: "rental_proposal",
        proposer_name: proposerName.trim(),
        proposer_phone: proposerPhone.trim(),
        proposer_company: proposerCompany.trim() || null,
        proposal_deposit: firstRoom?.deposit?.trim() || null,
        proposal_monthly: firstRoom?.monthly?.trim() || null,
        proposal_period: period.trim() || null,
        proposal_content: fullContent || null,
        submitted_by: session?.user?.id ?? null,
      });
      if (error) throw error;
      setDone(true);
    } catch (e) {
      console.error("임대제안서 저장 실패:", e);
      alert("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0" style={{ background: "hsl(var(--primary) / 0.08)" }}>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">임대 제안서 작성</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted/50">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {done ? (
          <div className="p-8 flex flex-col items-center gap-3 text-center">
            <Send className="w-10 h-10 text-primary" />
            <p className="text-sm font-bold text-foreground">임대 제안서가 전송되었습니다</p>
            <p className="text-xs text-muted-foreground">관리자가 확인 후 연락드립니다.</p>
            <button onClick={onClose} className="mt-2 px-5 py-2 rounded-full text-xs font-bold text-white" style={{ background: "hsl(var(--primary))" }}>확인</button>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-5 flex flex-col gap-5">

            {/* 대상 매물 */}
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">임대 제안 대상 매물</p>
              <p className="text-xs font-semibold text-foreground truncate">{property.title}</p>
              <p className="text-[11px] text-muted-foreground">{property.address}</p>
              <div className="flex gap-3 mt-1.5 text-[11px] text-muted-foreground">
                <span>현재 보증금: <strong className="text-foreground">{property.deposit}</strong></span>
                <span>월세: <strong className="text-foreground">{property.monthly}</strong></span>
              </div>
            </div>

            {/* 제안자 정보 */}
            <div>
              <p className="text-xs font-bold text-foreground mb-2">제안자 정보</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">이름 *</label>
                  <input value={proposerName} onChange={(e) => setProposerName(e.target.value)} placeholder="홍길동" className={ic} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">연락처 *</label>
                  <input value={proposerPhone} onChange={(e) => setProposerPhone(formatPhone(e.target.value))} placeholder="010-0000-0000" className={ic} />
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-muted-foreground">회사/부동산명 (선택)</label>
                <input value={proposerCompany} onChange={(e) => setProposerCompany(e.target.value)} placeholder="예) OO공인중개사" className={ic} />
              </div>
            </div>

            {/* 호실별 임대 조건 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-foreground">호실별 임대 조건</p>
                <button
                  type="button"
                  onClick={addRoom}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors"
                  style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
                >
                  + 호실 추가
                </button>
              </div>

              {/* 헤더 */}
              <div className="grid grid-cols-[60px_1fr_1fr_28px] gap-1.5 mb-1 px-0.5">
                <span className="text-[10px] font-bold text-muted-foreground text-center">호실</span>
                <span className="text-[10px] font-bold text-muted-foreground text-center">보증금 (만원)</span>
                <span className="text-[10px] font-bold text-muted-foreground text-center">월세 (만원)</span>
                <span />
              </div>

              <div className="flex flex-col gap-1.5">
                {rooms.map((row, i) => (
                  <div key={i} className="grid grid-cols-[60px_1fr_1fr_28px] gap-1.5 items-center">
                    <input
                      type="text"
                      placeholder="예) 101"
                      value={row.unit}
                      onChange={(e) => setRoom(i, "unit", e.target.value)}
                      className="px-2 py-2 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-center"
                    />
                    <input
                      type="text"
                      placeholder="500"
                      value={row.deposit}
                      onChange={(e) => setRoom(i, "deposit", e.target.value)}
                      className={ic}
                    />
                    <input
                      type="text"
                      placeholder="50"
                      value={row.monthly}
                      onChange={(e) => setRoom(i, "monthly", e.target.value)}
                      className={ic}
                    />
                    <button
                      type="button"
                      onClick={() => removeRoom(i)}
                      disabled={rooms.length === 1}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 hover:bg-destructive/10"
                    >
                      <X className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>

              {/* 보증금 합계 */}
              {totalDeposit > 0 && (
                <div className="mt-2 flex items-center justify-between px-3 py-2 rounded-xl border bg-primary/5"
                  style={{ borderColor: "hsl(var(--primary) / 0.3)" }}>
                  <span className="text-xs font-bold text-foreground">보증금 합계</span>
                  <span className="text-sm font-extrabold text-primary">{totalDeposit.toLocaleString()}만원</span>
                </div>
              )}
            </div>

            {/* 융자금 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="w-4 h-4 rounded text-[9px] font-black flex items-center justify-center" style={{ background: "hsl(0 85% 45%)", color: "#fff" }}>융</span>
                융자금 (만원)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="예) 5,000"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className={ic + " pr-10"}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">만원</span>
              </div>
              {loanAmount && (
                <p className="text-[11px] font-semibold" style={{ color: "hsl(0 85% 45%)" }}>
                  ⚠ 융자금 {loanAmount}만원
                </p>
              )}
            </div>

            {/* 계약 기간 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">계약 희망 기간</label>
              <input value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="예) 1년, 2년, 협의" className={ic} />
            </div>

            {/* 추가 내용 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">추가 제안 내용 (선택)</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="특별 요청사항, 입주 희망일, 업종 등을 자유롭게 작성해주세요."
                rows={3}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!proposerName.trim() || !proposerPhone.trim() || saving}
              className="w-full h-10 rounded-full text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Send className="w-4 h-4" />
              {saving ? "전송 중..." : "임대 제안서 전송"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const PropertyDetailPanel = ({ property, onClose, sameProperties = [] }: PropertyDetailPanelProps) => {
  const [liked, setLiked] = useState(false);
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [lightboxUnitIdx, setLightboxUnitIdx] = useState<number | null>(null);
  const [activeModal, setActiveModal] = useState<"error" | "deal" | "proposal" | null>(null);

  if (!property) return null;

  const buildingSearchUrl = `https://www.eais.go.kr`;
  const naverBuildingUrl = `https://land.naver.com/building/info?address=${encodeURIComponent(property.address)}`;
  const typeStyle = TYPE_STYLE[property.type] ?? { bg: "bg-primary", text: "text-white" };

  const allImages = (property.images && property.images.length > 0)
    ? property.images
    : property.image ? [property.image] : [];

  // 동일주소 호실별 라이트박스 유닛 구성
  const otherUnits = sameProperties
    .filter(p => p.id !== property.id && (p.images && p.images.length > 0 || p.image));
  const lightboxUnits: LightboxUnit[] = [
    { label: property.unitNumber ? `${property.unitNumber}호` : (property.title || "현재 매물"), images: allImages },
    ...otherUnits.map(p => ({
      label: p.unitNumber ? `${p.unitNumber}호` : (p.title || p.address),
      images: p.images && p.images.length > 0 ? p.images : p.image ? [p.image] : [],
    })),
  ].filter(u => u.images.length > 0);

  return (
    <>
      {/* ── 풀스크린 라이트박스 ── */}
      {lightboxUnitIdx !== null && (
        <Lightbox
          units={lightboxUnits}
          startUnitIdx={lightboxUnitIdx}
          onClose={() => setLightboxUnitIdx(null)}
        />
      )}

      {/* ── 액션 모달 ── */}
      {activeModal === "error" && <ErrorReportModal property={property} onClose={() => setActiveModal(null)} />}
      {activeModal === "deal" && <DealCompleteModal property={property} onClose={() => setActiveModal(null)} />}
      {activeModal === "proposal" && <RentalProposalModal property={property} onClose={() => setActiveModal(null)} />}

      <div className="absolute left-0 top-0 bottom-0 z-[900] w-[360px] bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">

        {/* ── Image Carousel ── */}
        <div className="relative">
          <ImageCarousel
            images={allImages}
            title={property.title}
            onImageClick={(i) => setLightboxUnitIdx(0)}
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 z-10" style={{ top: allImages.length > 1 ? "2.5rem" : "0.75rem" }}>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
              {property.type}
            </span>
            {property.isNew && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-badge-new text-white">NEW</span>}
            {property.isHot && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-badge-hot text-white">HOT</span>}
          </div>

          {/* Top-right controls */}
          <div className="absolute top-3 right-3 flex gap-1.5 z-10">
            <button onClick={() => setLiked(!liked)} className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition-colors">
              <Heart className={`w-3.5 h-3.5 ${liked ? "fill-red-400 text-red-400" : "text-white"}`} />
            </button>
            <button className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition-colors">
              <Share2 className="w-3.5 h-3.5 text-white" />
            </button>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition-colors">
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>

          {/* Bottom title overlay */}
          <div className="absolute bottom-3 left-4 right-4 z-10">
            <p className="text-white font-bold text-[15px] line-clamp-1 drop-shadow-sm">{property.title}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-white/70 flex-shrink-0" />
              <p className="text-white/80 text-xs line-clamp-1">{property.address}</p>
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">

          {/* Price block */}
          <div className="px-4 py-4 bg-primary/5 border-b border-border">
            {/* 임대 방식별 금액 파싱 (note 필드에 월세/반전세/전세 저장됨) */}
            {(() => {
              const note = property.note ?? "";
              const wolseMatch = note.match(/월세: 보증금 ([^\n/]+)만원 \/ 월세 ([^\n]+)만원/);
              const halfMatch = note.match(/반전세: 보증금 ([^\n/]+)만원 \/ 월세 ([^\n]+)만원/);
              const jeonseMatch = note.match(/전세: 보증금 ([^\n]+)만원/);
              const hasMultiRent = wolseMatch || halfMatch || jeonseMatch;

              return hasMultiRent ? (
                <div className="flex flex-col gap-2 mb-2">
                  {wolseMatch && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-medium">💰 월세</span>
                      <span className="text-sm font-extrabold text-foreground">
                        보증금 {wolseMatch[1]}만원 <span className="text-muted-foreground font-light">/</span> <span className="text-accent">월 {wolseMatch[2]}만원</span>
                      </span>
                    </div>
                  )}
                  {halfMatch && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-medium">🏠 반전세</span>
                      <span className="text-sm font-extrabold text-foreground">
                        보증금 {halfMatch[1]}만원 <span className="text-muted-foreground font-light">/</span> <span className="text-accent">월 {halfMatch[2]}만원</span>
                      </span>
                    </div>
                  )}
                  {jeonseMatch && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground font-medium">🏡 전세</span>
                      <span className="text-sm font-extrabold text-foreground">보증금 {jeonseMatch[1]}만원</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-[11px] text-muted-foreground font-medium mb-0.5">보증금 / 월세</p>
                    <p className="text-xl font-extrabold text-foreground leading-tight">
                      {property.deposit}
                      <span className="text-muted-foreground font-light mx-1.5 text-base">/</span>
                      <span className="text-accent">{property.monthly}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground">관리비</p>
                    <p className="text-sm font-semibold text-foreground">{property.manageFee}</p>
                  </div>
                </div>
              );
            })()}
            <div className="flex items-center gap-3 pt-2 border-t border-border/60">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="w-3 h-3" />
                <span>조회 {property.views.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-badge-new font-semibold">
                <BadgeCheck className="w-3 h-3" />
                <span>입주가능 {property.availableFrom}</span>
              </div>
            </div>
          </div>

            {/* ── 추가 조건 정보 (방향·빈방여부·LH·청소비·중개보수) ── */}
            {(() => {
              const note = property.note ?? "";
              const directionMatch = note.match(/방향[:\s]+([^\n|]+)/);
              const lhMatch = note.match(/LH[:\s]+([^\n|]+)/);
              const cleanMatch = note.match(/청소비[:\s]+([^\n|]+)/);
              const brokerFeeMatch = note.match(/중개보수[:\s]+([^\n|]+)/);

              const direction = directionMatch?.[1]?.trim();
              const lhType = lhMatch?.[1]?.trim();
              const cleanFee = cleanMatch?.[1]?.trim();
              const brokerFee = brokerFeeMatch?.[1]?.trim();
              const earlyExit = note.includes("중도퇴거:");
              const vacateDate = property.vacateDate;
              // 임대 매물 여부 (매매 타입 제외: 모든 임대 유형에 중도퇴거/퇴거일 항시 표시)
              const SALE_TYPES = ["매매","단독매매","건물매매","주택매매","상가주택매매","상가건물매매","구분상가매매","창고/공장매매","숙박/팬션매매","원룸건물매매"];
              const isRentType = !SALE_TYPES.includes(property.type);

              // 공실여부: 임대 매물일 때만 표시 (매매 타입 제외)
              const vacancy = isRentType && property.availableFrom &&
                (property.availableFrom === "공실" || property.availableFrom === "세입자 거주중")
                ? property.availableFrom : null;

              const items = [
                vacancy && { label: "빈방여부", value: vacancy, color: vacancy === "공실" ? "hsl(142 71% 45%)" : "hsl(25 95% 53%)" },
                direction && { label: "방향", value: direction + "향", color: "hsl(var(--foreground))" },
                lhType && lhType !== "관계없음" && { label: "LH 대출", value: lhType, color: lhType === "LH가능" ? "hsl(217 91% 60%)" : lhType === "LH불가" ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))" },
                cleanFee && { label: "퇴실청소비", value: cleanFee.endsWith("만원") ? cleanFee : `${cleanFee}만원`, color: "hsl(var(--foreground))" },
                brokerFee && { label: "중개수수료", value: brokerFee, color: "hsl(0 85% 45%)" },
                // 임대 매물은 항시 표시 (earlyExit 여부와 무관하게 세입자 중도퇴거 행 노출)
                isRentType && { label: "세입자 중도퇴거", value: earlyExit ? "중도퇴거 가능" : "해당없음", color: earlyExit ? "hsl(0 85% 45%)" : "hsl(var(--muted-foreground))" },
                // 임대 매물은 퇴거 예정일 항시 표시 (값 없으면 "-")
                isRentType && { label: "퇴거 예정일", value: vacateDate || "-", color: vacateDate ? "hsl(0 85% 45%)" : "hsl(var(--muted-foreground))" },
              ].filter(Boolean) as { label: string; value: string; color: string }[];

              if (items.length === 0) return null;
              return (
                <div className="mx-4 mb-3 rounded-xl border border-border bg-muted/30 overflow-hidden">
                  {items.map((item, i) => (
                    <div key={item.label} className={`flex items-center justify-between px-3 py-2 text-xs ${i > 0 ? "border-t border-border/50" : ""}`}>
                      <span className="text-muted-foreground font-medium">{item.label}</span>
                      <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              );
            })()}

          {/* Info grid */}
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">매물 정보</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <Maximize2 className="w-3.5 h-3.5" />, label: "면적",   value: (() => { const a = property.area || ""; const m = a.match(/\((\d+)평\)/) ?? a.match(/^(\d+)평/) ?? a.match(/^(\d+)$/); return m ? m[1] + "평" : a.split(" ")[0]; })(), sub: property.area.includes("(") ? property.area.split(" ")[1] : undefined },
                { icon: <Layers className="w-3.5 h-3.5" />,    label: "해당층", value: property.floor },
                { icon: <Building2 className="w-3.5 h-3.5" />, label: "건물층", value: property.totalFloors.replace("지상 ", "") },
                { icon: <Calendar className="w-3.5 h-3.5" />,  label: "준공",   value: property.buildYear.replace("년", ""), sub: "년" },
                { icon: <Car className="w-3.5 h-3.5" />,       label: "주차",   value: property.parking },
                { icon: <ArrowUpRight className="w-3.5 h-3.5" />, label: "엘리베이터", value: property.elevator ? "있음" : "없음" },
                ...((() => { const m = (property.note ?? "").match(/건평[:\s]+([^\n|]+)/); return m ? [{ icon: <Building2 className="w-3.5 h-3.5" />, label: "건평", value: m[1].trim() }] : []; })()),
                ...((() => { const m = (property.note ?? "").match(/동[(\（]棟[)\）][:\s：\s]*([^\n|]+)/); return m ? [{ icon: <Building2 className="w-3.5 h-3.5" />, label: "동", value: m[1].trim() }] : []; })()),
              ].map(({ icon, label, value, sub }) => (
                <div key={label} className="bg-muted/50 rounded-lg px-2.5 py-2 flex flex-col gap-0.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                    {icon}
                    <span className="text-[10px]">{label}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground leading-tight">{value}{sub && <span className="text-xs font-normal text-muted-foreground">{sub}</span>}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-2 bg-muted/50 my-2" />

          {/* Description */}
          <div className="px-4 pb-3">
            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">매물 설명</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
          </div>

          {/* ── 비밀번호 ── */}
          {(property.buildingPassword || property.roomPassword || property.password) && (
            <>
              <div className="h-2 bg-muted/50 my-2" />
              <div className="px-4 pb-3 flex flex-col gap-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">비밀번호</p>
                <div className="px-3 py-2.5 rounded-xl border border-border bg-muted/30 flex flex-col gap-2">
                  {property.buildingPassword && (
                    <div className="relative group cursor-default">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground font-medium">🏢 건물 공동현관</span>
                        <span className="text-base font-bold text-foreground tracking-widest">건{property.buildingPassword}</span>
                      </div>
                      {/* 호버 툴팁 */}
                      <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <div className="bg-foreground text-background text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap">
                          🏢 건물 공동현관 비밀번호
                          <div className="absolute top-full left-4 w-2 h-1.5 overflow-hidden">
                            <div className="w-2 h-2 bg-foreground rotate-45 -translate-y-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {property.buildingPassword && (property.roomPassword || property.password) && (
                    <div className="h-px bg-border" />
                  )}
                  {(property.roomPassword || property.password) && (
                    <div className="relative group cursor-default">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-muted-foreground font-medium">🚪 방(호실) 도어락</span>
                        <span className="text-base font-bold text-foreground tracking-widest">방{property.roomPassword || property.password}</span>
                      </div>
                      {/* 호버 툴팁 */}
                      <div className="pointer-events-none absolute left-0 bottom-full mb-1.5 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <div className="bg-foreground text-background text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap">
                          🚪 방(호실) 도어락 비밀번호
                          <div className="absolute top-full left-4 w-2 h-1.5 overflow-hidden">
                            <div className="w-2 h-2 bg-foreground rotate-45 -translate-y-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── 연락처 ── */}
          {(property.contactOwner || property.contactManager) && (
            <>
              <div className="h-2 bg-muted/50 my-2" />
              <div className="px-4 pb-3 flex flex-col gap-2">
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">연락처</p>
                <RevealPhone label="소유주" phone={property.contactOwner} />
                <RevealPhone label="관리인" phone={property.contactManager} />
                {property.contact && (
                  <div className="flex items-center justify-between py-2 px-3 rounded-xl border border-border bg-muted/30">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                        <Phone className="w-3 h-3 text-accent" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">부동산</span>
                    </div>
                    <a href={`tel:${property.contact}`} className="text-xs font-bold text-accent hover:underline">
                      {property.contact}
                    </a>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Divider */}
          <div className="h-2 bg-muted/50 my-2" />

          {/* 건축물대장 */}
          <div className="px-4 pb-3">
            <button onClick={() => setBuildingOpen(!buildingOpen)} className="w-full flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-bold text-foreground uppercase tracking-wide">건축물대장</span>
              </div>
              {buildingOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>

            {buildingOpen && (
              <div className="mt-2 rounded-xl border border-border overflow-hidden">
                <div className="px-3 py-2.5 bg-muted/40 border-b border-border">
                  <p className="text-[10px] text-muted-foreground font-medium mb-0.5">조회 주소</p>
                  <p className="text-xs font-semibold text-foreground">{property.address}</p>
                </div>
                <div className="px-3 py-3 grid grid-cols-2 gap-y-2 gap-x-4 bg-white text-xs">
                  <div><p className="text-[10px] text-muted-foreground">건물 유형</p><p className="font-semibold text-foreground">{property.type}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">준공연도</p><p className="font-semibold text-foreground">{property.buildYear}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">총 층수</p><p className="font-semibold text-foreground">{property.totalFloors}</p></div>
                  <div><p className="text-[10px] text-muted-foreground">엘리베이터</p><p className="font-semibold text-foreground">{property.elevator ? "있음" : "없음"}</p></div>
                </div>
                <div className="px-3 py-2.5 bg-muted/20 border-t border-border flex flex-col gap-2">
                  <p className="text-[10px] text-muted-foreground font-medium">공식 열람 (외부 연결)</p>
                  <div className="flex gap-2">
                    <a href={buildingSearchUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary/90 transition-colors">
                      <ExternalLink className="w-3 h-3" />세움터 열람
                    </a>
                    <a href={naverBuildingUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-accent text-white text-[11px] font-bold hover:bg-accent/90 transition-colors">
                      <ExternalLink className="w-3 h-3" />네이버 건물정보
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-2 bg-muted/50 my-2" />

          {/* Agent card */}
          <div className="px-4 pb-4">
            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">담당 공인중개사</p>
            <div className="border border-border rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{property.agentName}</p>
                <p className="text-xs text-muted-foreground">공인중개사</p>
              </div>
              {property.contact && (
                <a href={`tel:${property.contact}`} className="flex items-center gap-1.5 text-xs font-bold text-accent hover:underline">
                  <Phone className="w-3.5 h-3.5" />
                  {property.contact}
                </a>
              )}
            </div>
          </div>

          {/* ── 추가 액션 버튼 ── */}
          <div className="h-2 bg-muted/50 my-2" />
          <div className="px-4 pb-4 flex flex-col gap-2">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-1">기타 기능</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveModal("proposal")}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-primary/5 transition-colors"
                style={{ borderColor: "hsl(var(--primary) / 0.3)" }}
              >
                <ClipboardList className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-semibold text-foreground">임대제안서</span>
              </button>
              <button
                onClick={() => setActiveModal("deal")}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-chart-2/5 transition-colors"
                style={{ borderColor: "hsl(var(--chart-2) / 0.3)" }}
              >
                <CheckCircle2 className="w-4 h-4" style={{ color: "hsl(var(--chart-2))" }} />
                <span className="text-[11px] font-semibold text-foreground">거래완료</span>
              </button>
              <button
                onClick={() => setActiveModal("error")}
                className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-destructive/5 transition-colors"
                style={{ borderColor: "hsl(var(--destructive) / 0.3)" }}
              >
                <AlertTriangle className="w-4 h-4" style={{ color: "hsl(var(--destructive))" }} />
                <span className="text-[11px] font-semibold text-foreground">오류제보</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-white grid grid-cols-2 gap-2">
          <a
            href={`tel:${property.contactOwner ?? property.contact}`}
            className="flex items-center justify-center gap-1.5 h-11 rounded-lg border-2 border-primary text-primary text-sm font-bold hover:bg-primary hover:text-white transition-colors"
          >
            <Phone className="w-4 h-4" />
            전화 문의
          </a>
          <button
            onClick={() => setActiveModal("proposal")}
            className="flex items-center justify-center gap-1.5 h-11 rounded-lg text-white text-sm font-bold transition-colors"
            style={{ background: "hsl(var(--accent))" }}
          >
            <ClipboardList className="w-4 h-4" />
            임대 제안서
          </button>
        </div>
      </div>
    </>
  );
};

export default PropertyDetailPanel;
