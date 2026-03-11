import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ─── Image Carousel Preview (사진 등록 캐러셀) ────────────────────────────────
function ImageCarouselPreview({ images, onRemove }: { images: string[]; onRemove: (url: string) => void }) {
  const [idx, setIdx] = useState(0);
  const safeIdx = Math.min(idx, images.length - 1);

  const handleRemove = useCallback((url: string) => {
    onRemove(url);
    setIdx((i) => Math.min(i, images.length - 2));
  }, [onRemove, images.length]);

  if (images.length === 0) return null;

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border bg-muted" style={{ height: 200 }}>
      {/* 슬라이드 */}
      <div
        className="flex h-full transition-transform duration-300"
        style={{ transform: `translateX(-${safeIdx * 100}%)`, width: `${images.length * 100}%` }}
      >
        {images.map((src) => (
          <div key={src} className="h-full flex-shrink-0" style={{ width: `${100 / images.length}%` }}>
            <img src={src} alt="매물 사진" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* 그라디언트 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={() => handleRemove(images[safeIdx])}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-destructive flex items-center justify-center transition-colors z-10"
      >
        <X className="w-3.5 h-3.5 text-white" />
      </button>

      {/* 대표 배지 */}
      {safeIdx === 0 && (
        <span className="absolute top-2 left-2 text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full z-10">대표</span>
      )}

      {/* 좌우 화살표 */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/75 flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            type="button"
            onClick={() => setIdx((i) => (i + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/75 flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
          {/* 인디케이터 */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i === safeIdx ? "#fff" : "rgba(255,255,255,0.45)" }}
              />
            ))}
          </div>
          {/* 장수 표시 */}
          <div className="absolute bottom-2 right-3 text-white text-[10px] font-bold bg-black/50 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
            {safeIdx + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
import { X, Phone, Eye, EyeOff, ChevronDown, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─── ContactField: 번호 입력 (기본 노출, 눈 아이콘으로 숨김 가능) ──────────────
function ContactField({
  fieldKey, label, placeholder, required, value, onChange,
}: {
  fieldKey: string; label: string; placeholder: string; required?: boolean;
  value: string; onChange: (v: string) => void;
}) {
  const [revealed, setRevealed] = useState(true); // 기본 노출
  const ic = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition";

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-foreground/70">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type={revealed ? "tel" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={ic + " pl-9 pr-9"}
        />
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          title={revealed ? "숨기기" : "번호 보기"}
        >
          {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}


// ─── Types ───────────────────────────────────────────────────────────────────
export type DBPropertyForm = {
  id?: string;
  created_at?: string;
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
};

// ─── Address Data (청주시 4개 구 고정) ──────────────────────────────────────
const FIXED_SIDO_ADMIN = "충북";
const CHEONGJU_SIGUNGU_ADMIN = [
  "청주시 상당구","청주시 서원구","청주시 청원구","청주시 흥덕구",
];
const DONG_MAP: Record<string, string[]> = {
  "청주시 상당구": [
    "낭성면","미원면","가덕면","남일면","문의면",
    "중앙동","성안동","탑동","대성동","영운동","금천동",
    "용담동","명암동","산성동","용암동",
  ],
  "청주시 서원구": [
    "남이면","현도면",
    "사직동","사창동","모충동","분평동","산남동","수곡동",
    "성화동","개신동","죽림동",
  ],
  "청주시 흥덕구": [
    "오송읍","강내면","옥산면",
    "운천동","신봉동","복대동","가경동","봉명동","강서동",
  ],
  "청주시 청원구": [
    "내수읍","오창읍","북이면",
    "우암동","내덕동","율량동","사천동","오근장동",
  ],
};

// ─── Constants ────────────────────────────────────────────────────────────────
const FLOOR_OPTIONS = [
  "지하5층","지하4층","지하3층","지하2층","지하1층","0층",
  "1층","2층","3층","4층","5층","6층","7층","8층","9층","10층","10층이상",
];
const ROOM_OPTIONS = [
  "냉장고","세탁기","드럼세탁기","건조기","스타일러","TV",
  "에어컨","가스레인지","인덕션","전자레인지","침대","책상",
  "옷장","전자키","복층","옥탑","테라스","주차",
];
const DIRECTION_OPTIONS = ["동","서","남","북","동남","남서","북동","북서"];
const LH_TYPES = ["관계없음","LH가능","LH불가"] as const;
const VACANCY_TYPES = ["공실","세입자 거주중"] as const;
const BROKER_TYPES = ["일반중개","공동중개"] as const;
const TRADE_TYPES = ["임대","매매"] as const;
const BUILDING_TYPES = ["단독건물","집합건물","토지"] as const;
const PROPERTY_TYPE_GROUPS = [
  { group: "주거형 임대", types: ["원룸","투베이","투룸","쓰리룸","주인세대","아파트","오피스텔","빌라","고시원"] },
  { group: "상가 임대", types: ["상가","식당·카페","사무실","공장·창고","병원·학원"] },
  { group: "주거형 외 임대·매매", types: ["상가임대","기타임대","원룸건물매매","주택매매","상가주택매매","상가건물매매","구분상가매매","창고/공장매매","숙박/팬션매매"] },
  { group: "토지", types: ["토지"] },
];

type LhType = typeof LH_TYPES[number];

const EMPTY: Omit<DBPropertyForm, "id" | "created_at"> = {
  title: "", building_name: "", address: "", dong: "", lot_number: "", district: "", type: "원룸",
  room_type: "", unit_number: "", area: "", floor: "", deposit: "", monthly: "",
  manage_fee: "", parking: "", elevator: false, available_from: "", total_floors: "",
  build_year: "", description: "", building_memo: "", room_memo: "", note: "",
  vacate_date: "", building_password: "", room_password: "", options: [], images: [],
  views: 0, lat: 0, lng: 0, is_new: false, is_hot: false, status: "active",
  registered_date: new Date().toISOString().slice(0, 10), checked_date: "",
  agent_name: "",
};

// Extended form state for admin (adds fields not in DBPropertyForm)
interface AdminFormExtended extends Omit<DBPropertyForm, "id" | "created_at"> {
  brokerType: typeof BROKER_TYPES[number];
  tradeType: typeof TRADE_TYPES[number];
  buildingType: typeof BUILDING_TYPES[number];
  direction: string;
  lhType: LhType;
  exitCleanFee: string;
  brokerFee: string;
  contactOwner: string;
  contactTenant: string;
  contactManager: string;
}

const EMPTY_EXTENDED: AdminFormExtended = {
  ...EMPTY,
  brokerType: "일반중개",
  tradeType: "임대",
  buildingType: "단독건물",
  direction: "",
  lhType: "관계없음",
  exitCleanFee: "",
  brokerFee: "",
  contactOwner: "",
  contactTenant: "",
  contactManager: "",
};

// ─── Shared UI Helpers ────────────────────────────────────────────────────────
const ic = `w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all bg-background text-foreground placeholder:text-muted-foreground border-border focus:border-primary focus:ring-2 focus:ring-primary/20`;

function Section({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-bold text-foreground">{label}</p>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Radio({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 cursor-pointer select-none" onClick={onClick}>
      <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${checked ? "border-primary" : "border-muted-foreground/40"}`}>
        {checked && <span className="w-2 h-2 rounded-full bg-primary" />}
      </span>
      <span className={`text-sm ${checked ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{children}</span>
    </label>
  );
}

function AmountInput({ label, value, onChange, placeholder = "만원", noUnit = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; noUnit?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-foreground/70">{label}</label>
      <div className="relative">
        <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
          className={ic + (noUnit ? "" : " pr-10")} />
        {!noUnit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">만원</span>}
      </div>
    </div>
  );
}

const AdminSelect = ({ value, onChange, placeholder, options, disabled }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[]; disabled?: boolean;
}) => (
  <div className="relative">
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled}
      className={`w-full px-3 py-2.5 text-sm rounded-xl border outline-none appearance-none bg-background text-foreground border-border focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-40 disabled:cursor-not-allowed pr-8`}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
  </div>
);

// ─── AdminPropertyFormModal ───────────────────────────────────────────────────
interface AdminPropertyFormModalProps {
  initial: Partial<DBPropertyForm> | null;
  onClose: () => void;
  onSaved?: () => void;
}

const AdminPropertyFormModal = ({ initial, onClose, onSaved }: AdminPropertyFormModalProps) => {
  const [form, setForm] = useState<AdminFormExtended>({
    ...EMPTY_EXTENDED,
    ...(initial ?? {}),
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof AdminFormExtended>(k: K, v: AdminFormExtended[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // 충북 고정 — 청주시 4개 구만 표시
  const [sigungu, setSigungu] = useState(form.district ? `청주시 ${form.district}` : "");
  const [dong, setDong] = useState(form.dong ?? "");
  const sigunguList = CHEONGJU_SIGUNGU_ADMIN;
  const dongList = DONG_MAP[sigungu] ?? [];

  const updateAddress = (sg: string, d: string, lot: string) => {
    const parts = [FIXED_SIDO_ADMIN, sg, d, lot].filter(Boolean);
    set("address", parts.join(" "));
    if (sg.includes("청주시 ")) set("district", sg.replace("청주시 ", ""));
    set("dong", d);
    set("lot_number", lot);
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));

    // 병렬 업로드: 각 파일에 고유 타임스탬프+인덱스로 경로 중복 방지
    const uploadResults = await Promise.all(
      fileArray.map(async (file, i) => {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const uniqueId = `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`;
        const path = `properties/${uniqueId}.${ext}`;
        const { error } = await supabase.storage
          .from("property-images")
          .upload(path, file, { upsert: false });
        if (error) {
          console.error(`이미지 업로드 실패 (${file.name}):`, error.message);
          return null;
        }
        const { data: urlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(path);
        return urlData?.publicUrl ?? null;
      })
    );

    const successUrls = uploadResults.filter((url): url is string => !!url);
    if (successUrls.length < fileArray.length) {
      alert(`${fileArray.length}장 중 ${successUrls.length}장 업로드 성공. 일부 실패했습니다.`);
    }
    if (successUrls.length > 0) {
      setForm((f) => ({ ...f, images: [...(f.images ?? []), ...successUrls] }));
    }
    // input 초기화 (같은 파일 재선택 가능하도록)
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUploading(false);
  };

  const toggleOption = (opt: string) => {
    setForm((f) => ({
      ...f,
      options: f.options.includes(opt) ? f.options.filter((o) => o !== opt) : [...f.options, opt],
    }));
  };

  const handleSave = async () => {
    if (!form.type) { alert("유형을 선택해주세요."); return; }
    if (!form.address.trim()) { alert("주소를 입력해주세요."); return; }
    setSaving(true);

    // 연락처 조합
    const contactParts = [
      form.contactOwner && `건물주:${form.contactOwner}`,
      form.agent_name && `부동산:${form.agent_name}`,
      form.contactTenant && `세입자:${form.contactTenant}`,
      form.contactManager && `관리인:${form.contactManager}`,
    ].filter(Boolean).join("|");

    const noteStr = [
      form.contactOwner && `건물주: ${form.contactOwner}`,
      form.agent_name && `부동산: ${form.agent_name}`,
      form.contactTenant && `세입자: ${form.contactTenant}`,
      form.contactManager && `관리인: ${form.contactManager}`,
    ].filter(Boolean).join("\n");

    const payload = {
      title: form.title || "",
      building_name: form.building_name || null,
      address: form.address || "",
      dong: form.dong ?? "",
      lot_number: form.lot_number ?? "",
      district: form.district || null,
      type: form.type || "",
      room_type: form.room_type || null,
      unit_number: form.unit_number || null,
      area: form.area ?? "",
      floor: form.floor ?? "",
      deposit: form.deposit ?? "",
      monthly: form.monthly ?? "",
      manage_fee: form.manage_fee ?? "",
      parking: form.parking ?? "",
      elevator: form.elevator ?? false,
      available_from: form.available_from ?? "",
      total_floors: form.total_floors ?? "",
      build_year: form.build_year ?? "",
      description: form.description ?? "",
      building_memo: form.building_memo || null,
      room_memo: form.room_memo || null,
      note: noteStr || form.note || null,
      vacate_date: form.vacate_date || null,
      building_password: form.building_password || null,
      room_password: form.room_password || null,
      options: Array.isArray(form.options) ? form.options : [],
      images: Array.isArray(form.images) ? form.images : [],
      views: Number(form.views) || 0,
      lat: Number(form.lat) || 0,
      lng: Number(form.lng) || 0,
      is_new: form.is_new ?? false,
      is_hot: form.is_hot ?? false,
      status: form.status ?? "active",
      registered_date: form.registered_date || new Date().toISOString().slice(0, 10),
      checked_date: form.checked_date || null,
      agent_name: contactParts || form.agent_name || "",
    };

    try {
      if (initial?.id) {
        const { error } = await supabase.from("properties").update(payload).eq("id", initial.id);
        if (error) { alert("수정 오류: " + error.message); return; }
      } else {
        const { error } = await supabase.from("properties").insert(payload);
        if (error) { alert("등록 오류: " + error.message); return; }
      }
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const STEP_LABELS = ["기본 설정 및 주소", "옵션 및 조건", "사진 및 기타"];

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
          style={{ background: "hsl(var(--header-bg))" }}>
          <div>
            <h3 className="text-base font-bold text-white">
              {initial?.id ? "매물 수정" : "매물 등록"}
            </h3>
            {initial?.id && (
              <p className="text-xs mt-0.5 text-white/60">{initial.address} {initial.unit_number ? `· ${initial.unit_number}호` : ""}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-2 flex-shrink-0">
          <div className="flex gap-1.5 mb-1.5">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= formStep ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{formStep}/3 {STEP_LABELS[formStep - 1]}</p>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">

          {/* ── STEP 1 ── */}
          {formStep === 1 && (
            <div className="flex flex-col gap-5">

              {/* 거래 방식 */}
              <Section label="거래 방식">
                <div className="flex gap-5">
                  {BROKER_TYPES.map((t) => <Radio key={t} checked={form.brokerType === t} onClick={() => set("brokerType", t)}>{t}</Radio>)}
                </div>
              </Section>

              {/* 거래 종류 */}
              <Section label="거래 종류">
                <div className="flex gap-5">
                  {TRADE_TYPES.map((t) => <Radio key={t} checked={form.tradeType === t} onClick={() => set("tradeType", t)}>{t}</Radio>)}
                </div>
              </Section>

              {/* 매물 종류 */}
              <Section label="매물 종류">
                <div className="flex gap-5">
                  {BUILDING_TYPES.map((t) => <Radio key={t} checked={form.buildingType === t} onClick={() => set("buildingType", t)}>{t}</Radio>)}
                </div>
              </Section>

              {/* 세부 종류 (유형) */}
              <Section label="세부 종류 (유형) *">
                {PROPERTY_TYPE_GROUPS.map(({ group, types }) => (
                  <div key={group} className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{group}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {types.map((t) => (
                        <button key={t} type="button" onClick={() => set("type", t)}
                          className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                          style={form.type === t
                            ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
                            : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </Section>

              {/* 주소 입력 */}
              <Section label="주소 입력">
                {/* 시/도 고정 배지 */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/30 bg-primary/5">
                  <span className="text-xs text-muted-foreground">시/도</span>
                  <span className="text-sm font-bold text-primary">충청북도 (충북)</span>
                  <span className="ml-auto text-[10px] text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">고정</span>
                </div>

                {/* 시/군/구 + 동 */}
                <div className="grid grid-cols-2 gap-2">
                  <AdminSelect value={sigungu} onChange={(v) => { setSigungu(v); setDong(""); updateAddress(v, "", form.lot_number); }} placeholder="시/군/구 선택" options={sigunguList} />
                  <AdminSelect value={dong} onChange={(v) => { setDong(v); updateAddress(sigungu, v, form.lot_number); }} placeholder="동/읍/면 선택" options={dongList} disabled={!sigungu} />
                </div>

                {/* 번지 */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" placeholder="번지 입력 (예: 123-4)" value={form.lot_number}
                      onChange={(e) => { set("lot_number", e.target.value); updateAddress(sigungu, dong, e.target.value); }}
                      className={ic + " pl-9"} />
                  </div>
                  <span className="self-center text-xs text-muted-foreground whitespace-nowrap">번지</span>
                </div>
                <p className="text-[11px] text-muted-foreground/60 -mt-1">도로명주소 불가 / 번지주소만 가능</p>
                {form.address && (
                  <p className="text-xs text-primary font-medium bg-primary/8 px-3 py-1.5 rounded-lg">📍 {form.address}</p>
                )}
              </Section>

              {/* 건물이름 / 매물명 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">건물이름</label>
                  <input type="text" placeholder="건물명 (선택)" value={form.building_name ?? ""} onChange={(e) => set("building_name", e.target.value)} className={ic} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">매물명 *</label>
                  <input type="text" placeholder="예) 흥덕구 원룸" value={form.title} onChange={(e) => set("title", e.target.value)} className={ic} />
                </div>
              </div>

              {/* 층수 / 호수 / 평수 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">층수</label>
                  <AdminSelect value={form.floor} onChange={(v) => set("floor", v)} placeholder="선택" options={FLOOR_OPTIONS} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">호수</label>
                  <input type="text" placeholder="직접입력" value={form.unit_number ?? ""} onChange={(e) => set("unit_number", e.target.value)} className={ic} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">평수</label>
                  <input type="text" placeholder="예) 15평" value={form.area} onChange={(e) => set("area", e.target.value)} className={ic} />
                </div>
              </div>

              {/* 전체 층수 / 건축연도 / 중개사 */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">전체 층수</label>
                  <input type="text" placeholder="예) 5층" value={form.total_floors} onChange={(e) => set("total_floors", e.target.value)} className={ic} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">건축연도</label>
                  <input type="text" placeholder="예) 2010" value={form.build_year} onChange={(e) => set("build_year", e.target.value)} className={ic} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">담당 중개사</label>
                  <input type="text" placeholder="담당자명" value={form.agent_name} onChange={(e) => set("agent_name", e.target.value)} className={ic} />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {formStep === 2 && (
            <div className="flex flex-col gap-5">

              {/* 요약 칩 */}
              <div className="flex gap-1.5 flex-wrap">
                {[form.brokerType, form.tradeType, form.buildingType, form.type].filter(Boolean).map((v) => (
                  <span key={v} className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">{v}</span>
                ))}
              </div>

              {/* 반려동물 */}
              <Section label="반려동물">
                <div className="flex gap-3">
                  {[
                    { key: "애완동물가능", label: "🐾 가능" },
                    { key: "애완동물불가", label: "🚫 불가" },
                  ].map(({ key, label }) => {
                    const isActive = form.options.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          // 가능/불가는 하나만 선택 (서로 배타적)
                          const other = key === "애완동물가능" ? "애완동물불가" : "애완동물가능";
                          setForm((f) => {
                            const without = f.options.filter((o) => o !== key && o !== other);
                            return { ...f, options: isActive ? without : [...without, key] };
                          });
                        }}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </Section>

              {/* 방 옵션 */}
              <Section label="방 옵션">
                <div className="flex flex-wrap gap-2">
                  {ROOM_OPTIONS.map((opt) => (
                    <button key={opt} type="button" onClick={() => toggleOption(opt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        form.options.includes(opt)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:border-primary/50"
                      }`}>{opt}</button>
                  ))}
                </div>
              </Section>

              {/* 방 비번 / 건물 비번 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">방 비번</label>
                  <input type="text" placeholder="방 비밀번호" value={form.room_password ?? ""} onChange={(e) => set("room_password", e.target.value)} className={ic} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">건물 비번</label>
                  <input type="text" placeholder="건물 비밀번호" value={form.building_password ?? ""} onChange={(e) => set("building_password", e.target.value)} className={ic} />
                </div>
              </div>

              {/* 방향 */}
              <Section label="방향">
                <div className="flex flex-wrap gap-2">
                  {DIRECTION_OPTIONS.map((d) => (
                    <button key={d} type="button" onClick={() => set("direction", form.direction === d ? "" : d)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        form.direction === d
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:border-primary/50"
                      }`}>{d}</button>
                  ))}
                </div>
              </Section>

              {/* 공실 여부 */}
              <Section label="현재 빈방 여부">
                <div className="flex gap-3">
                  {VACANCY_TYPES.map((t) => (
                    <button key={t} type="button" onClick={() => set("available_from", t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                        form.available_from === t
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:border-primary/50"
                      }`}>{t}</button>
                  ))}
                </div>
              </Section>

              {/* 금액 입력 */}
              <Section label="금액 입력">
                <p className="text-[11px] text-muted-foreground/70 -mt-1">단위: 만원</p>
                <div className="grid grid-cols-2 gap-3">
                  <AmountInput label="보증금" value={form.deposit} onChange={(v) => set("deposit", v)} />
                  <AmountInput label="월세" value={form.monthly} onChange={(v) => set("monthly", v)} />
                  <AmountInput label="관리비" value={form.manage_fee} onChange={(v) => set("manage_fee", v)} />
                  <AmountInput label="퇴실 청소비" value={form.exitCleanFee} onChange={(v) => set("exitCleanFee", v)} />
                  <div className="col-span-2">
                    <AmountInput label="중개보수" value={form.brokerFee} onChange={(v) => set("brokerFee", v)} placeholder="예) 협의" noUnit />
                  </div>
                </div>
              </Section>

              {/* LH 전세대출 */}
              <Section label="LH (전세대출)">
                <div className="flex gap-5">
                  {LH_TYPES.map((t) => (
                    <Radio key={t} checked={form.lhType === t} onClick={() => set("lhType", t)}>{t}</Radio>
                  ))}
                </div>
              </Section>

              {/* 체크박스 옵션 */}
              <div className="flex gap-6 flex-wrap">
                {[{ key: "elevator" as const, label: "엘리베이터" }, { key: "is_new" as const, label: "신규 매물" }, { key: "is_hot" as const, label: "인기 매물" }].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                    <input type="checkbox" checked={form[key] as boolean}
                      onChange={(e) => set(key, e.target.checked)} className="w-4 h-4 accent-primary" />
                    {label}
                  </label>
                ))}
              </div>

              {/* 퇴거일 */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">퇴거일</label>
                <input type="text" placeholder="예) 2026-05-01" value={form.vacate_date ?? ""} onChange={(e) => set("vacate_date", e.target.value)} className={ic} />
              </div>

              {/* 메모 */}
              <Section label="메모">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground">건물 메모</label>
                    <textarea rows={2} value={form.building_memo ?? ""} onChange={(e) => set("building_memo", e.target.value)}
                      className={ic + " resize-none"} placeholder="건물 관련 메모" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-muted-foreground">방 메모 (내 메모)</label>
                    <textarea rows={2} value={form.room_memo ?? ""} onChange={(e) => set("room_memo", e.target.value)}
                      className={ic + " resize-none"} placeholder="관리용 메모 (외부 비노출)" />
                  </div>
                </div>
              </Section>

              {/* 매물 소개 */}
              <Section label="매물 소개">
                <textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)}
                  className={ic + " resize-none"} placeholder="매물의 특징, 특이사항 등" maxLength={300} />
                <p className="text-right text-[11px] text-muted-foreground">{form.description.length} / 300</p>
              </Section>
            </div>
          )}

          {/* ── STEP 3 ── */}
          {formStep === 3 && (
            <div className="flex flex-col gap-5">

              {/* 연락처 */}
              <Section label="연락처">
                <div className="flex flex-col gap-3">
                  {[
                    { key: "contactOwner" as const, label: "건물주 연락처", placeholder: "예) 010-1234-5678", required: true },
                    { key: "agent_name" as const, label: "부동산 연락처", placeholder: "예) 043-123-4567" },
                    { key: "contactTenant" as const, label: "세입자 연락처", placeholder: "예) 010-9876-5432" },
                    { key: "contactManager" as const, label: "관리인 연락처", placeholder: "예) 010-5555-6666" },
                  ].map(({ key, label, placeholder, required }) => (
                    <ContactField
                      key={key}
                      fieldKey={key}
                      label={label}
                      placeholder={placeholder}
                      required={required}
                      value={form[key] as string}
                      onChange={(v) => set(key, v)}
                    />
                  ))}
                </div>
              </Section>




              {/* 이미지 업로드 — 캐러셀 프리뷰 */}
              <Section label="이미지 업로드">
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={(e) => handleImageUpload(e.target.files)} />
                {(form.images ?? []).length > 0 && (
                  <ImageCarouselPreview
                    images={form.images ?? []}
                    onRemove={(url) =>
                      setForm((f) => ({ ...f, images: (f.images ?? []).filter((u) => u !== url) }))
                    }
                  />
                )}
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-primary/30 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-primary/60 hover:bg-primary/5 transition-colors mt-1">
                  {uploading
                    ? <><span className="text-sm font-semibold text-primary">업로드 중...</span></>
                    : <>
                        <span className="text-sm font-semibold text-primary">📷 사진 추가</span>
                        <span className="text-[11px] text-muted-foreground">여러 장 동시 선택 가능 · JPG, PNG, WEBP</span>
                      </>
                  }
                </button>
              </Section>

              {/* 노출 상태 */}
              <Section label="노출 상태">
                <div className="flex gap-3">
                  {(["active", "hidden"] as const).map((s) => (
                    <button key={s} type="button" onClick={() => set("status", s)}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold border transition-all ${
                        form.status === s ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border"
                      }`}>
                      {s === "active" ? "✅ 노출" : "🔕 숨김"}
                    </button>
                  ))}
                </div>
              </Section>

              {/* 등록일 / 확인일 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">등록일</label>
                  <input type="date" value={form.registered_date} onChange={(e) => set("registered_date", e.target.value)} className={ic} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">확인일</label>
                  <input type="date" value={form.checked_date ?? ""} onChange={(e) => set("checked_date", e.target.value)} className={ic} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-border flex items-center gap-3">
          {/* 삭제 버튼 — 수정 모드에서만 표시 */}
          {initial?.id && (
            <button
              type="button"
              disabled={saving}
              onClick={async () => {
                if (!confirm("이 매물을 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.")) return;
                setSaving(true);
                try {
                  const { error } = await supabase.from("properties").delete().eq("id", initial.id!);
                  if (error) { alert("삭제 오류: " + error.message); return; }
                  onSaved?.();
                  onClose();
                } finally {
                  setSaving(false);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              삭제
            </button>
          )}
          {formStep > 1 && (
            <button type="button" onClick={() => setFormStep((s) => (s - 1) as 1 | 2 | 3)}
              className="px-4 py-2 rounded-full text-xs font-semibold border border-border text-foreground hover:bg-muted/50">
              이전
            </button>
          )}
          <div className="flex-1" />
          {formStep < 3 ? (
            <button type="button" onClick={() => setFormStep((s) => (s + 1) as 2 | 3)}
              className="px-6 py-2 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90">
              다음
            </button>
          ) : (
            <button type="button" onClick={handleSave} disabled={saving}
              className="px-6 py-2 rounded-full text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {saving ? "저장 중..." : (initial?.id ? "수정 완료" : "등록 완료")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPropertyFormModal;
