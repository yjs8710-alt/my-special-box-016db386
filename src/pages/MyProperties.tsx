import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Pencil, Trash2, Eye, EyeOff, Plus,
  Search, RefreshCw, ChevronDown, ChevronUp,
  ImagePlus, Loader2, X, Save, Phone, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import PropertyRegisterModal from "@/components/PropertyRegisterModal";

// ─── Types ──────────────────────────────────────────────────────────────────
type DBProperty = {
  id: string;
  title: string;
  building_name?: string;
  address: string;
  dong: string;
  lot_number: string;
  district?: string;
  type: string;
  room_type?: string;
  unit_number?: string;
  area: string;
  floor: string;
  deposit: string;
  monthly: string;
  manage_fee: string;
  parking: string;
  elevator: boolean;
  available_from: string;
  total_floors: string;
  build_year: string;
  description: string;
  building_memo?: string;
  room_memo?: string;
  note?: string;
  vacate_date?: string;
  building_password?: string;
  room_password?: string;
  options: string[];
  images: string[];
  views: number;
  lat: number;
  lng: number;
  is_new: boolean;
  is_hot: boolean;
  status: "active" | "hidden";
  registered_date: string;
  checked_date?: string;
  agent_name: string;
  registered_by?: string | null;
  created_at: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const CHEONGJU_SIGUNGU = [
  "청주시 상당구","청주시 서원구","청주시 흥덕구","청주시 청원구",
];
const DONG_MAP: Record<string, string[]> = {
  "청주시 상당구": ["북문로1가","북문로2가","북문로3가","남문로1가","남문로2가","남문로3가","서문동","문화동","수동","영동","석교동","용담동","명암동","산성동","금천동","용암동","용정동"],
  "청주시 서원구": ["사직동","사창동","모충동","수곡동","성화동","죽림동","개신동","분평동","산남동"],
  "청주시 흥덕구": ["운천동","신봉동","복대동","가경동","봉명동","송정동","송절동","강서1동","강서2동","오송읍","옥산면"],
  "청주시 청원구": ["우암동","내덕동","율량동","사천동","오근장동","주성동","주중동","정상동","외남동","외평동","외하동","정하동","내수읍","북이면","오창읍"],
};
const ROOM_OPTIONS = [
  "냉장고","세탁기","드럼세탁기","건조기","스타일러","TV",
  "에어컨","가스레인지","인덕션","전자레인지","침대","책상",
  "옷장","전자키","복층","옥탑","테라스","주차",
];
const ALL_TYPES = [
  "원룸","투베이","투룸","쓰리룸","주인세대","아파트","오피스텔","빌라","고시원",
  "상가","식당·카페","사무실","공장·창고","병원·학원","토지","건물매매",
  "상가임대","기타임대","원룸건물매매","주택매매","상가주택매매","상가건물매매","구분상가매매","창고/공장매매","숙박/팬션매매",
];
const FLOOR_OPTIONS = ["지하5층","지하4층","지하3층","지하2층","지하1층","0층","1층","2층","3층","4층","5층","6층","7층","8층","9층","10층","10층이상"];
const EMPTY_PROPERTY: Omit<DBProperty, "id" | "created_at"> = {
  title:"", building_name:"", address:"", dong:"", lot_number:"", district:"", type:"원룸",
  room_type:"", unit_number:"", area:"", floor:"", deposit:"", monthly:"",
  manage_fee:"", parking:"", elevator:false, available_from:"", total_floors:"",
  build_year:"", description:"", building_memo:"", room_memo:"", note:"",
  vacate_date:"", building_password:"", room_password:"", options:[], images:[],
  views:0, lat:0, lng:0, is_new:false, is_hot:false, status:"active",
  registered_date: new Date().toISOString().slice(0,10), checked_date:"", agent_name:"",
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────
const EditModal = ({
  initial,
  onClose,
  onSave,
}: {
  initial: DBProperty;
  onClose: () => void;
  onSave: (data: Omit<DBProperty, "id" | "created_at">) => Promise<void>;
}) => {
  const [form, setForm] = useState<Omit<DBProperty, "id" | "created_at">>({ ...EMPTY_PROPERTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const [sigungu, setSigungu] = useState(form.district ? `청주시 ${form.district}` : "");
  const [dong, setDong] = useState(form.dong ?? "");
  const dongList = DONG_MAP[sigungu] ?? [];

  const updateAddress = (sg: string, d: string, lot: string) => {
    const parts = ["충북", sg, d, lot].filter(Boolean);
    set("address", parts.join(" "));
    if (sg.includes("청주시 ")) set("district", sg.replace("청주시 ", ""));
    set("dong", d);
    set("lot_number", lot);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `properties/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("property-images").upload(path, file, { upsert: false });
      if (error) { alert("이미지 업로드 실패: " + error.message); continue; }
      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
      if (urlData?.publicUrl) newUrls.push(urlData.publicUrl);
    }
    if (newUrls.length > 0) setForm(f => ({ ...f, images: [...(f.images ?? []), ...newUrls] }));
    setUploading(false);
  };

  const toggleOption = (opt: string) =>
    setForm(f => ({ ...f, options: f.options.includes(opt) ? f.options.filter(o => o !== opt) : [...f.options, opt] }));

  const handleSave = async () => {
    if (!form.type) { alert("유형을 선택해주세요."); return; }
    if (!form.address.trim()) { alert("주소를 입력해주세요."); return; }
    setSaving(true);
    try { await onSave(form); } catch (e) { console.error(e); } finally { setSaving(false); }
  };

  const ic = "w-full px-3 py-2 text-sm rounded-lg border border-border outline-none transition-all bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" /> 매물 수정
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted/60 text-muted-foreground transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* 기본 정보 */}
          <section>
            <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">기본 정보</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">제목 *</label>
                <input className={ic} value={form.title} onChange={e => set("title", e.target.value)} placeholder="매물 제목" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">유형 *</label>
                <select className={ic} value={form.type} onChange={e => set("type", e.target.value)}>
                  {ALL_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">건물명</label>
                <input className={ic} value={form.building_name ?? ""} onChange={e => set("building_name", e.target.value)} placeholder="건물명" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">구</label>
                <select className={ic} value={sigungu} onChange={e => { setSigungu(e.target.value); setDong(""); updateAddress(e.target.value, "", form.lot_number ?? ""); }}>
                  <option value="">구 선택</option>
                  {CHEONGJU_SIGUNGU.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">동</label>
                <select className={ic} value={dong} onChange={e => { setDong(e.target.value); updateAddress(sigungu, e.target.value, form.lot_number ?? ""); }}>
                  <option value="">동 선택</option>
                  {dongList.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">지번</label>
                <input className={ic} value={form.lot_number ?? ""} onChange={e => { set("lot_number", e.target.value); updateAddress(sigungu, dong, e.target.value); }} placeholder="123-4" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">호수</label>
                <input className={ic} value={form.unit_number ?? ""} onChange={e => set("unit_number", e.target.value)} placeholder="101호" />
              </div>
            </div>
          </section>

          {/* 면적/층 */}
          <section>
            <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">면적 및 층</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">면적</label>
                <input className={ic} value={form.area} onChange={e => set("area", e.target.value)} placeholder="33㎡" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">층</label>
                <select className={ic} value={form.floor} onChange={e => set("floor", e.target.value)}>
                  <option value="">선택</option>
                  {FLOOR_OPTIONS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">총 층수</label>
                <input className={ic} value={form.total_floors} onChange={e => set("total_floors", e.target.value)} placeholder="5층" />
              </div>
            </div>
          </section>

          {/* 가격 */}
          <section>
            <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">가격 정보</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">보증금</label>
                <input className={ic} value={form.deposit} onChange={e => set("deposit", e.target.value)} placeholder="1000만원" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">월세</label>
                <input className={ic} value={form.monthly} onChange={e => set("monthly", e.target.value)} placeholder="50만원" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">관리비</label>
                <input className={ic} value={form.manage_fee} onChange={e => set("manage_fee", e.target.value)} placeholder="5만원" />
              </div>
            </div>
          </section>

          {/* 상세 */}
          <section>
            <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">상세 정보</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">주차</label>
                <input className={ic} value={form.parking} onChange={e => set("parking", e.target.value)} placeholder="1대" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">준공연도</label>
                <input className={ic} value={form.build_year} onChange={e => set("build_year", e.target.value)} placeholder="2020년" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">입주 가능일</label>
                <input className={ic} value={form.available_from} onChange={e => set("available_from", e.target.value)} placeholder="즉시" />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.elevator} onChange={e => set("elevator", e.target.checked)} className="w-4 h-4 rounded accent-primary" />
                  <span className="text-sm text-foreground">엘리베이터</span>
                </label>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground mb-1 block">설명</label>
                <textarea className={`${ic} resize-none`} rows={3} value={form.description} onChange={e => set("description", e.target.value)} placeholder="매물 설명" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">건물 메모</label>
                <textarea className={`${ic} resize-none`} rows={2} value={form.building_memo ?? ""} onChange={e => set("building_memo", e.target.value)} placeholder="건물 특이사항" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">방 메모</label>
                <textarea className={`${ic} resize-none`} rows={2} value={form.room_memo ?? ""} onChange={e => set("room_memo", e.target.value)} placeholder="방 특이사항" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">건물 비밀번호</label>
                <input className={ic} value={form.building_password ?? ""} onChange={e => set("building_password", e.target.value)} placeholder="1234#" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">방 비밀번호</label>
                <input className={ic} value={form.room_password ?? ""} onChange={e => set("room_password", e.target.value)} placeholder="5678*" />
              </div>
            </div>
          </section>

          {/* 옵션 */}
          <section>
            <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">옵션</h3>
            <div className="flex flex-wrap gap-2">
              {ROOM_OPTIONS.map(opt => (
                <button key={opt} type="button" onClick={() => toggleOption(opt)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={form.options.includes(opt)
                    ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderColor: "hsl(var(--primary))" }
                    : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                  }>
                  {opt}
                </button>
              ))}
            </div>
          </section>

          {/* 이미지 */}
          <section>
            <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">사진</h3>
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={e => handleImageUpload(e.target.files)} />
            <div className="flex flex-wrap gap-2">
              {(form.images ?? []).map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setForm(f => ({ ...f, images: f.images.filter(u => u !== url) }))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                disabled={uploading}>
                {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ImagePlus className="w-5 h-5" /><span className="text-[10px]">추가</span></>}
              </button>
            </div>
          </section>

          {/* 상태 */}
          <section>
            <h3 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-wide">노출 상태</h3>
            <div className="flex gap-3">
              {(["active", "hidden"] as const).map(s => (
                <button key={s} type="button" onClick={() => set("status", s)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all"
                  style={form.status === s
                    ? { background: s === "active" ? "hsl(var(--chart-2) / 0.15)" : "hsl(var(--muted))", borderColor: s === "active" ? "hsl(var(--chart-2))" : "hsl(var(--border))", color: s === "active" ? "hsl(var(--chart-2))" : "hsl(var(--muted-foreground))" }
                    : { background: "transparent", borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                  }>
                  {s === "active" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {s === "active" ? "노출" : "숨김"}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted/40 transition-colors">취소</button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-lg transition-all disabled:opacity-60"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteConfirmModal = ({ title, onConfirm, onCancel }: { title: string; onConfirm: () => void; onCancel: () => void }) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--destructive) / 0.12)" }}>
          <Trash2 className="w-5 h-5" style={{ color: "hsl(var(--destructive))" }} />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">매물 삭제</p>
          <p className="text-xs text-muted-foreground mt-0.5">이 작업은 되돌릴 수 없습니다.</p>
        </div>
      </div>
      <p className="text-sm text-foreground">
        <span className="font-semibold">"{title}"</span> 매물을 삭제하시겠습니까?
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-2 text-sm font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted/40 transition-colors">취소</button>
        <button onClick={onConfirm} className="flex-1 py-2 text-sm font-bold rounded-lg transition-colors"
          style={{ background: "hsl(var(--destructive))", color: "white" }}>삭제</button>
      </div>
    </div>
  </div>
);

// ─── Property Row ─────────────────────────────────────────────────────────────
const PropertyRow = ({
  prop,
  onEdit,
  onDelete,
  onToggleStatus,
  isAdmin,
  registrantInfo,
}: {
  prop: DBProperty;
  onEdit: (p: DBProperty) => void;
  onDelete: (p: DBProperty) => void;
  onToggleStatus: (p: DBProperty) => void;
  isAdmin?: boolean;
  registrantInfo?: { name: string; email?: string } | null;
}) => {
  const [expanded, setExpanded] = useState(false);

  // 관리자 뷰에서 등록자 표시: registrantInfo(프로필 기반) > agent_name 순으로
  const displayRegistrant = registrantInfo?.name || prop.agent_name || null;

  return (
    <div className="border border-border rounded-xl overflow-hidden" style={{ background: "hsl(var(--card))" }}>
      {/* 요약 행 */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setExpanded(e => !e)}>
        {/* 상태 dot */}
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: prop.status === "active" ? "hsl(var(--chart-2))" : "hsl(var(--muted-foreground))" }} />

        {/* 썸네일 */}
        {prop.images?.[0] ? (
          <img src={prop.images[0]} alt="" className="w-12 h-10 rounded-lg object-cover flex-shrink-0 border border-border" />
        ) : (
          <div className="w-12 h-10 rounded-lg flex-shrink-0 border border-border flex items-center justify-center" style={{ background: "hsl(var(--muted))" }}>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">{prop.title}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "hsl(var(--accent) / 0.12)", color: "hsl(var(--accent))" }}>
              {prop.type}
            </span>
            {prop.status === "hidden" && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                숨김
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{prop.address}</span>
            {prop.unit_number && <span className="flex-shrink-0">· {prop.unit_number}</span>}
          </div>
          {/* 관리자 전용: 등록자 정보 */}
          {isAdmin && displayRegistrant && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
                style={{ background: "hsl(var(--primary) / 0.08)", color: "hsl(var(--primary))", borderColor: "hsl(var(--primary) / 0.25)" }}>
                👤 {displayRegistrant}
              </span>
              {!registrantInfo && !prop.agent_name && (
                <span className="text-[10px] text-muted-foreground">등록자 정보 없음</span>
              )}
            </div>
          )}
          {isAdmin && !displayRegistrant && (
            <div className="mt-0.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded-full border"
                style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }}>
                👤 등록자 미상
              </span>
            </div>
          )}
        </div>

        <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0 text-xs text-right">
          <span className="font-semibold text-foreground">{prop.deposit}/{prop.monthly || "—"}</span>
          <span className="text-muted-foreground">
            {prop.manage_fee && prop.manage_fee !== "0" && prop.manage_fee !== "-" ? `관${prop.manage_fee} · ` : ""}
            {prop.area}
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
          <button onClick={e => { e.stopPropagation(); onToggleStatus(prop); }}
            className="p-1.5 rounded-lg transition-colors hover:bg-muted/60"
            title={prop.status === "active" ? "숨김 처리" : "노출 처리"}
            style={{ color: prop.status === "active" ? "hsl(var(--chart-2))" : "hsl(var(--muted-foreground))" }}>
            {prop.status === "active" ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button onClick={e => { e.stopPropagation(); onEdit(prop); }}
            className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(prop); }}
            className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
            style={{ color: "hsl(var(--destructive))" }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {/* 상세 확장 */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border/50 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
          {[
            ["보증금", prop.deposit], ["월세", prop.monthly], ["관리비", prop.manage_fee],
            ["면적", prop.area], ["층", prop.floor], ["총층수", prop.total_floors],
            ["주차", prop.parking], ["준공연도", prop.build_year], ["엘리베이터", prop.elevator ? "있음" : "없음"],
            ["입주가능일", prop.available_from], ["등록일", prop.registered_date], ["조회수", String(prop.views)],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k}>
              <span className="text-muted-foreground">{k}: </span>
              <span className="font-medium text-foreground">{v}</span>
            </div>
          ))}
          {prop.building_password && (
            <div><span className="text-muted-foreground">건물PW: </span><span className="font-medium text-foreground">{prop.building_password}</span></div>
          )}
          {prop.room_password && (
            <div><span className="text-muted-foreground">방PW: </span><span className="font-medium text-foreground">{prop.room_password}</span></div>
          )}
          {prop.options?.length > 0 && (
            <div className="col-span-2 sm:col-span-3">
              <span className="text-muted-foreground">옵션: </span>
              <span className="font-medium text-foreground">{prop.options.join(", ")}</span>
            </div>
          )}
          {prop.description && (
            <div className="col-span-2 sm:col-span-3">
              <span className="text-muted-foreground">설명: </span>
              <span className="text-foreground">{prop.description}</span>
            </div>
          )}
          {prop.note && (
            <div className="col-span-2 sm:col-span-3">
              <span className="text-muted-foreground">메모: </span>
              <span className="text-foreground">{prop.note}</span>
            </div>
          )}
          {(prop.images?.length ?? 0) > 0 && (
            <div className="col-span-2 sm:col-span-3 flex gap-2 flex-wrap mt-1">
              {prop.images.map((url, i) => (
                <img key={i} src={url} alt="" className="w-16 h-14 rounded-lg object-cover border border-border" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const MyProperties = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [properties, setProperties] = useState<DBProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "hidden">("all");
  const [agentTab, setAgentTab] = useState<string>("전체");
  const [editTarget, setEditTarget] = useState<DBProperty | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DBProperty | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [agentName, setAgentName] = useState("");
  // 관리자 전용: user_id → {name, email} 맵
  const [registrantMap, setRegistrantMap] = useState<Record<string, { name: string; email?: string }>>({});

  // 프로필 및 매물 로드
  useEffect(() => {
    if (authLoading) return;
    if (!user?.userId) { navigate("/login"); return; }

    const load = async () => {
      setLoading(true);

      // 관리자 여부 확인
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.userId)
        .eq("role", "admin")
        .maybeSingle();

      const isAdmin = !!roleData;

      if (isAdmin) {
        // 관리자: 전체 매물 + agent_profiles 매핑 조회
        setAgentName("관리자");
        const [{ data: props }, { data: profiles }] = await Promise.all([
          supabase.from("properties").select("*").order("registered_date", { ascending: false }),
          supabase.from("agent_profiles").select("user_id, name, phone"),
        ]);
        if (props) setProperties(props as DBProperty[]);
        if (profiles) {
          const map: Record<string, { name: string; email?: string }> = {};
          profiles.forEach(p => { map[p.user_id] = { name: p.name }; });
          setRegistrantMap(map);
        }
        setLoading(false);
        return;
      }

      // 일반 사용자: agent_profiles에서 이름 조회
      // 본인 registered_by OR agent_name 기준 매물 조회
      const { data: profile } = await supabase
        .from("agent_profiles")
        .select("name")
        .eq("user_id", user.userId)
        .maybeSingle();

      const name = profile?.name ?? "";
      setAgentName(name);

      if (!name && !user.userId) { setLoading(false); return; }

      // registered_by = 본인 userId OR agent_name = 본인 이름 (둘 다 커버)
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .or(`registered_by.eq.${user.userId}${name ? `,agent_name.eq.${name}` : ""}`)
        .order("registered_date", { ascending: false });

      if (!error && data) setProperties(data as DBProperty[]);
      setLoading(false);
    };

    load();
  }, [user, authLoading, navigate]);

  // Realtime 구독
  useEffect(() => {
    if (!agentName) return;
    const channel = supabase
      .channel("my-properties-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "properties" }, async () => {
        const isAdmin = agentName === "관리자";
        let q = supabase.from("properties").select("*").order("registered_date", { ascending: false });
        if (!isAdmin) q = (q as ReturnType<typeof supabase.from>).eq("agent_name", agentName) as typeof q;
        const { data } = await q;
        if (data) setProperties(data as DBProperty[]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [agentName]);

  const handleEdit = async (data: Omit<DBProperty, "id" | "created_at">) => {
    if (!editTarget) return;
    const { error } = await supabase.from("properties").update(data).eq("id", editTarget.id);
    if (error) { alert("수정 오류: " + error.message); return; }
    setProperties(prev => prev.map(p => p.id === editTarget.id ? { ...p, ...data } : p));
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("properties").delete().eq("id", deleteTarget.id);
    if (error) { alert("삭제 오류: " + error.message); return; }
    setProperties(prev => prev.filter(p => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleToggleStatus = async (prop: DBProperty) => {
    const newStatus = prop.status === "active" ? "hidden" : "active";
    const { error } = await supabase.from("properties").update({ status: newStatus }).eq("id", prop.id);
    if (error) { alert("상태 변경 오류: " + error.message); return; }
    setProperties(prev => prev.map(p => p.id === prop.id ? { ...p, status: newStatus } : p));
  };

  const isAdminView = agentName === "관리자";

  // 등록자 탭 목록 (관리자 전용)
  const agentList = isAdminView
    ? ["전체", ...Array.from(new Set(properties.map(p => p.agent_name).filter(Boolean))).sort()]
    : [];

  const filtered = properties.filter(p => {
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchSearch = !search || p.title.includes(search) || p.address.includes(search) || p.type.includes(search);
    const matchAgent = !isAdminView || agentTab === "전체" || p.agent_name === agentTab;
    return matchStatus && matchSearch && matchAgent;
  });

  const activeCount = properties.filter(p => p.status === "active").length;
  const hiddenCount = properties.filter(p => p.status === "hidden").length;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))" }}>
      <Header onRegisterChange={setShowRegister} />
      {showRegister && <PropertyRegisterModal onClose={() => setShowRegister(false)} />}
      {editTarget && <EditModal initial={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} />}
      {deleteTarget && <DeleteConfirmModal title={deleteTarget.title} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      <div className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              {agentName === "관리자" ? "전체 임대·매매 관리" : "내 임대·매매 관리"}
            </h1>
            {agentName && (
              <p className="text-sm text-muted-foreground mt-1">
                {agentName === "관리자"
                  ? "모든 담당자의 매물을 조회·관리합니다"
                  : <><span className="font-semibold text-foreground">{agentName}</span> 담당 매물 관리</>
                }
              </p>
            )}
          </div>
          <Button
            onClick={() => setShowRegister(true)}
            className="flex items-center gap-2 text-sm font-bold"
            style={{ background: "hsl(var(--accent))", color: "white", border: "none" }}
          >
            <Plus className="w-4 h-4" />
            매물 등록
          </Button>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "전체 매물", value: properties.length, color: "hsl(var(--primary))" },
            { label: "노출 중", value: activeCount, color: "hsl(var(--chart-2))" },
            { label: "숨김", value: hiddenCount, color: "hsl(var(--muted-foreground))" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-xl border border-border p-4 text-center" style={{ background: "hsl(var(--card))" }}>
              <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* 관리자 전용: 등록자별 탭 필터 */}
        {isAdminView && agentList.length > 1 && (
          <div className="mb-4 -mx-1 px-1 overflow-x-auto">
            <div className="flex gap-1.5 min-w-max pb-1">
              {agentList.map(agent => {
                const count = agent === "전체"
                  ? properties.length
                  : properties.filter(p => p.agent_name === agent).length;
                const isActive = agentTab === agent;
                return (
                  <button
                    key={agent}
                    onClick={() => setAgentTab(agent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all whitespace-nowrap flex-shrink-0"
                    style={isActive
                      ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderColor: "hsl(var(--primary))" }
                      : { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                    }
                  >
                    {agent === "전체" ? "👥" : "👤"} {agent}
                    <span
                      className="text-[10px] font-bold px-1 py-0.5 rounded-full min-w-[18px] text-center"
                      style={isActive
                        ? { background: "rgba(255,255,255,0.25)", color: "inherit" }
                        : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                      }
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 검색 & 필터 */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="pl-9 h-9 text-sm" placeholder="제목, 주소, 유형 검색" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-1.5">
            {(["all", "active", "hidden"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                style={statusFilter === s
                  ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))", borderColor: "hsl(var(--primary))" }
                  : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                }>
                {s === "all" ? "전체" : s === "active" ? "노출" : "숨김"}
              </button>
            ))}
          </div>
          <button onClick={() => { setLoading(true); setTimeout(() => setLoading(false), 300); }}
            className="p-2 rounded-lg border border-border text-muted-foreground hover:bg-muted/40 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* 매물 목록 */}
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">불러오는 중...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Building2 className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {properties.length === 0 ? "등록된 매물이 없습니다." : "검색 결과가 없습니다."}
            </p>
            {properties.length === 0 && (
              <Button onClick={() => setShowRegister(true)} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" /> 첫 매물 등록하기
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(prop => (
              <PropertyRow
                key={prop.id}
                prop={prop}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
                onToggleStatus={handleToggleStatus}
                isAdmin={agentName === "관리자"}
                registrantInfo={agentName === "관리자" && prop.registered_by ? registrantMap[prop.registered_by] ?? null : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProperties;
