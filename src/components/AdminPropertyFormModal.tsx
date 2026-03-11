import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, ChevronLeft, ChevronRight, Eye, EyeOff, Phone, MapPin, ChevronDown } from "lucide-react";

// ─── Image Carousel Preview ───────────────────────────────────────────────────
const ImageCarouselPreview = ({ images, onRemove }: { images: string[]; onRemove: (i: number) => void }) => {
  const [idx, setIdx] = useState(0);
  const safeIdx = Math.min(idx, images.length - 1);
  if (images.length === 0) return null;
  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-border bg-muted" style={{ height: 200 }}>
      {/* 슬라이드 */}
      <div
        className="flex h-full transition-transform duration-300"
        style={{ transform: `translateX(-${safeIdx * 100}%)`, width: `${images.length * 100}%` }}
      >
        {images.map((src) => (
          <div key={src} style={{ width: `${100 / images.length}%` }} className="h-full flex-shrink-0">
            <img src={src} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      {/* 삭제 버튼 */}
      <button
        type="button"
        onClick={() => { onRemove(safeIdx); setIdx(Math.max(0, safeIdx - 1)); }}
        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center text-xs font-bold hover:bg-destructive"
      >✕</button>
      {/* 이전/다음 */}
      {images.length > 1 && <>
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
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === safeIdx ? "bg-white scale-125" : "bg-white/50"}`}
            />
          ))}
        </div>
      </>}
      {/* 장수 표시 */}
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold">
        {safeIdx + 1} / {images.length}
      </div>
    </div>
  );
};

// ─── Contact Field ────────────────────────────────────────────────────────────
const ContactField = ({ label, required, value, onChange }: {
  label: string; required?: boolean; value: string; onChange: (v: string) => void;
}) => {
  const [revealed, setRevealed] = useState(true);
  const ic = "w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border outline-none bg-background text-foreground border-border focus:border-primary focus:ring-2 focus:ring-primary/20";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-foreground/70">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type={revealed ? "tel" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="010-0000-0000"
          className={ic}
        />
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          title={revealed ? "숨기기" : "번호 보기"}
        >
          {revealed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface DBPropertyForm {
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
  status: string;
  registered_date: string;
  checked_date: string;
  agent_name: string;
}

interface AdminFormExtended extends DBPropertyForm {
  contactOwner: string;
  contactTenant: string;
  contactBroker: string;
  contactManager: string;
  tradeType: string;
  direction: string;
  isVacant: string;
  lhLoan: string;
  cleanFee: string;
  brokerFee: string;
}

// ─── Address Data (청주시 4개 구 고정) ──────────────────────────────────────
const FIXED_SIDO_ADMIN = "충북";
const CHEONGJU_SIGUNGU_ADMIN = [
  "청주시 상당구","청주시 서원구","청주시 청원구","청주시 흥덕구",
];
const DONG_MAP: Record<string, string[]> = {
  "청주시 상당구": [
    "낭성면","미원면","가덕면","남일면","문의면",
    "월오동","금천동","영운동","용암1동","용암2동",
    "용담·명암·산성동","중앙동","탑대성동","문화동","석교동","남문로1가동","남문로2가동",
    "수동","내덕1동","내덕2동",
  ],
  "청주시 서원구": [
    "모충동","산남동","분평동","수곡1동","수곡2동",
    "사창동","미평동","오동동","개신·죽림동","성화·개신·죽림동",
    "사직1동","사직2동","사직3동",
  ],
  "청주시 청원구": [
    "내수읍","북이면","오창읍","오송읍",
    "율량·사천동","우암동","중앙동","청원구청",
  ],
  "청주시 흥덕구": [
    "강내면","옥산면","오창읍일부",
    "봉명1동","봉명2·송정동","운천·신봉동","복대1동","복대2동",
    "가경동","개신동","죽림동","강서1동","강서2동",
  ],
};

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

const EMPTY_EXTENDED: AdminFormExtended = {
  ...EMPTY,
  contactOwner: "", contactTenant: "", contactBroker: "", contactManager: "",
  tradeType: "월세", direction: "", isVacant: "", lhLoan: "", cleanFee: "", brokerFee: "",
};

const PROPERTY_TYPES = ["원룸","투룸","쓰리룸","오피스텔","아파트","빌라","상가","사무실","식당·카페","공장·창고","병원·학원","토지"];
const ROOM_TYPES = ["원룸","투베이","투룸","쓰리룸","복층","펜트하우스"];
const TRADE_TYPES = ["월세","전세","매매"];
const DIRECTIONS = ["동","서","남","북","남동","남서","북동","북서"];
const VACANT_OPTIONS = ["공실","임차중","명도필요"];
const LH_OPTIONS = ["가능","불가"];
const BUILDING_OPTIONS = ["엘리베이터","주차","CCTV","도시가스","개별난방","반려동물가능","반려동물불가"];
const ic = "w-full px-3 py-2.5 text-sm rounded-xl border outline-none bg-background text-foreground border-border focus:border-primary focus:ring-2 focus:ring-primary/20";

interface AdminPropertyFormModalProps {
  initial: Partial<DBPropertyForm> | null;
  onClose: () => void;
  onSaved?: () => void;
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

const MoneyField = ({ label, value, onChange, placeholder, noUnit }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; noUnit?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-foreground/70">{label}</label>
    <div className="relative">
      <input type="text" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
        className={ic + (noUnit ? "" : " pr-10")} />
      {!noUnit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">만원</span>}
    </div>
  </div>
);

const Radio = ({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button type="button" onClick={onClick}
    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${checked ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/50"}`}
  >{children}</button>
);

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-2">
    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pb-1 border-b border-border">{label}</div>
    {children}
  </div>
);

const AdminPropertyFormModal = ({ initial, onClose, onSaved }: AdminPropertyFormModalProps) => {
  const parseContact = (raw: string, key: string) => {
    const m = raw.match(new RegExp(`${key}[:\\s]+([0-9][0-9\\-]+)`));
    return m ? m[1].trim() : "";
  };
  const rawContact = String((initial as any)?.note ?? (initial as any)?.agent_name ?? "");

  const [form, setForm] = useState<AdminFormExtended>({
    ...EMPTY_EXTENDED,
    ...(initial ?? {}),
    agent_name: parseContact(rawContact, "부동산") || String((initial as any)?.agent_name ?? ""),
    contactOwner: parseContact(rawContact, "건물주"),
    contactTenant: parseContact(rawContact, "세입자"),
    contactBroker: parseContact(rawContact, "부동산"),
    contactManager: parseContact(rawContact, "관리인"),
    images: Array.isArray((initial as any)?.images) ? (initial as any).images : [],
    lat: Number((initial as any)?.lat) || 0,
    lng: Number((initial as any)?.lng) || 0,
    dong: String((initial as any)?.dong ?? ""),
    lot_number: String((initial as any)?.lot_number ?? ""),
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formStep, setFormStep] = useState<1 | 2 | 3>(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 시/군/구, 동 상태
  const sigunguList = CHEONGJU_SIGUNGU_ADMIN;
  const [sigungu, setSigungu] = useState(form.district ? `청주시 ${form.district}` : "");
  const [dong, setDong] = useState(form.dong ?? "");
  const dongList = DONG_MAP[sigungu] ?? [];
  const [geocoding, setGeocoding] = useState(false);

  const set = <K extends keyof AdminFormExtended>(key: K, val: AdminFormExtended[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const geocodeAddress = useCallback((fullAddress: string) => {
    if (!fullAddress || !window.kakao?.maps?.services) return;
    setGeocoding(true);
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(fullAddress, (result: any[], status: string) => {
      setGeocoding(false);
      if (status === window.kakao.maps.services.Status.OK && result[0]) {
        setForm((f) => ({ ...f, lat: parseFloat(result[0].y), lng: parseFloat(result[0].x) }));
      }
    });
  }, []);

  const updateAddress = (sg: string, d: string, lot: string) => {
    const parts = [FIXED_SIDO_ADMIN, sg, d, lot].filter(Boolean);
    const fullAddress = parts.join(" ");
    set("address", fullAddress);
    if (sg.includes("청주시 ")) set("district", sg.replace("청주시 ", ""));
    set("dong", d);
    set("lot_number", lot);
    if (sg && d && lot) {
      if (window.kakao?.maps?.services) {
        geocodeAddress(fullAddress);
      } else {
        setTimeout(() => geocodeAddress(fullAddress), 1500);
      }
    }
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
        const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
        return urlData.publicUrl;
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
    const petPair = { "반려동물가능": "반려동물불가", "반려동물불가": "반려동물가능" };
    const other = petPair[opt as keyof typeof petPair];
    setForm((f) => {
      const isActive = f.options.includes(opt);
      const without = other ? f.options.filter((o) => o !== opt && o !== other) : f.options.filter((o) => o !== opt);
      return { ...f, options: isActive ? without : [...without, opt] };
    });
  };

  const buildNoteField = () => {
    const parts = [
      form.contactOwner && `건물주:${form.contactOwner}`,
      form.contactTenant && `세입자:${form.contactTenant}`,
      form.contactBroker && `부동산:${form.contactBroker}`,
      form.contactManager && `관리인:${form.contactManager}`,
    ].filter(Boolean);
    return parts.join("|");
  };

  const handleSave = async () => {
    if (!form.type) { alert("유형을 선택해주세요."); return; }
    if (!form.address.trim()) { alert("주소를 입력해주세요."); return; }
    if (!form.contactOwner.trim()) { alert("건물주 연락처를 입력해주세요."); return; }

    setSaving(true);
    const note = buildNoteField();

    const payload: Record<string, unknown> = {
      title: form.title || `${form.dong} ${form.lot_number} ${form.type}`,
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
      note: note || null,
      vacate_date: form.vacate_date || null,
      building_password: form.building_password || null,
      room_password: form.room_password || null,
      options: form.options ?? [],
      images: form.images ?? [],
      views: form.views ?? 0,
      lat: form.lat ?? 0,
      lng: form.lng ?? 0,
      is_new: form.is_new ?? false,
      is_hot: form.is_hot ?? false,
      status: form.status ?? "active",
      registered_date: form.registered_date || new Date().toISOString().slice(0, 10),
      checked_date: form.checked_date || null,
      agent_name: form.agent_name ?? "",
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2">
      <div className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden" style={{ maxHeight: "95vh" }}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0"
          style={{ background: "hsl(var(--header-bg))" }}>
          <div className="flex items-center gap-3">
            <span className="text-white font-bold text-sm">{initial?.id ? "매물 수정" : "매물 등록"}</span>
            <div className="flex gap-1.5">
              {([1,2,3] as const).map((s) => (
                <button key={s} type="button" onClick={() => setFormStep(s)}
                  className={`w-6 h-6 rounded-full text-[11px] font-bold transition-all ${formStep === s ? "bg-primary text-primary-foreground" : "bg-white/20 text-white/70 hover:bg-white/30"}`}
                >{s}</button>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-5">

          {/* ── STEP 1: 기본 정보 ── */}
          {formStep === 1 && <>
            <Section label="건물주 연락처 *">
              <ContactField label="건물주" required value={form.contactOwner} onChange={(v) => set("contactOwner", v)} />
            </Section>

            <Section label="주소">
              <div className="text-[10px] text-muted-foreground px-1">시/도: <span className="font-semibold text-foreground">{FIXED_SIDO_ADMIN}</span></div>
              {/* 시/군/구 + 동 */}
              <div className="grid grid-cols-2 gap-2">
                <AdminSelect value={sigungu} onChange={(v) => { setSigungu(v); setDong(""); updateAddress(v, "", form.lot_number); }} placeholder="시/군/구 선택" options={sigunguList} />
                <AdminSelect value={dong} onChange={(v) => { setDong(v); updateAddress(sigungu, v, form.lot_number); }} placeholder="동/읍/면 선택" options={dongList} disabled={!sigungu} />
              </div>
              {/* 번지 + 호수 */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="번지 입력 (예: 123-4)" value={form.lot_number}
                    onChange={(e) => { set("lot_number", e.target.value); updateAddress(sigungu, dong, e.target.value); }}
                    className={ic + " pl-9"} />
                </div>
                <input type="text" placeholder="호수 (예: 301호)" value={form.unit_number ?? ""}
                  onChange={(e) => set("unit_number", e.target.value)} className={ic + " w-28"} />
              </div>
              {/* 자동 완성된 주소 + 좌표 */}
              {form.address && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border">
                  <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">{form.address}</span>
                  {geocoding && <span className="text-[10px] text-primary animate-pulse ml-auto flex-shrink-0">좌표 검색중...</span>}
                  {!geocoding && form.lat !== 0 && (
                    <span className="text-[10px] text-green-500 ml-auto flex-shrink-0">
                      📍 {form.lat.toFixed(5)}, {form.lng.toFixed(5)}
                    </span>
                  )}
                </div>
              )}
            </Section>

            <Section label="건물명 / 유형">
              <input type="text" placeholder="건물명 (예: 청주 센트럴파크)" value={form.building_name ?? ""}
                onChange={(e) => set("building_name", e.target.value)} className={ic} />
              <AdminSelect value={form.type} onChange={(v) => set("type", v)} placeholder="유형 선택 *" options={PROPERTY_TYPES} />
              <div className="grid grid-cols-2 gap-2">
                <AdminSelect value={form.room_type ?? ""} onChange={(v) => set("room_type", v)} placeholder="방 구조" options={ROOM_TYPES} />
                <input type="text" placeholder="면적 (예: 33㎡)" value={form.area}
                  onChange={(e) => set("area", e.target.value)} className={ic} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="층수 (예: 3층)" value={form.floor}
                  onChange={(e) => set("floor", e.target.value)} className={ic} />
                <input type="text" placeholder="전체층 (예: 지상 5층)" value={form.total_floors}
                  onChange={(e) => set("total_floors", e.target.value)} className={ic} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="준공년도 (예: 2015년)" value={form.build_year}
                  onChange={(e) => set("build_year", e.target.value)} className={ic} />
                <div className="flex gap-2 flex-wrap">
                  {DIRECTIONS.map((d) => (
                    <Radio key={d} checked={form.direction === d} onClick={() => set("direction", d)}>{d}</Radio>
                  ))}
                </div>
              </div>
            </Section>

            <Section label="거래 유형 / 금액">
              <div className="flex gap-2 flex-wrap">
                {TRADE_TYPES.map((t) => <Radio key={t} checked={form.tradeType === t} onClick={() => set("tradeType", t)}>{t}</Radio>)}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MoneyField label="보증금" value={form.deposit} onChange={(v) => set("deposit", v)} placeholder="예: 500" />
                <MoneyField label="월세" value={form.monthly} onChange={(v) => set("monthly", v)} placeholder="예: 50" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MoneyField label="관리비" value={form.manage_fee} onChange={(v) => set("manage_fee", v)} placeholder="예: 10" />
                <MoneyField label="청소비" value={form.cleanFee} onChange={(v) => set("cleanFee", v)} placeholder="예: 10" />
              </div>
              <MoneyField label="중개보수" value={form.brokerFee} onChange={(v) => set("brokerFee", v)} placeholder="예: 협의" noUnit />
            </Section>
          </>}

          {/* ── STEP 2: 상세 정보 ── */}
          {formStep === 2 && <>
            <Section label="공실 / 대출">
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground self-center">공실여부</span>
                {VACANT_OPTIONS.map((v) => <Radio key={v} checked={form.isVacant === v} onClick={() => set("isVacant", v)}>{v}</Radio>)}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="퇴거일 (예: 2026-05-31)" value={form.vacate_date ?? ""}
                  onChange={(e) => set("vacate_date", e.target.value)} className={ic} />
                <input type="text" placeholder="입주가능일 (예: 즉시)" value={form.available_from}
                  onChange={(e) => set("available_from", e.target.value)} className={ic} />
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground self-center">LH 전세대출</span>
                {LH_OPTIONS.map((v) => <Radio key={v} checked={form.lhLoan === v} onClick={() => set("lhLoan", v)}>{v}</Radio>)}
              </div>
            </Section>

            <Section label="옵션 / 시설">
              <div className="flex flex-wrap gap-1.5">
                {BUILDING_OPTIONS.map((opt) => {
                  const isActive = form.options.includes(opt);
                  return (
                    <button key={opt} type="button" onClick={() => toggleOption(opt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${isActive ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/50"}`}
                    >
                      {opt === "반려동물가능" ? "🐾 반려동물가능" : opt === "반려동물불가" ? "🚫 반려동물불가" : opt}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="elevator" checked={form.elevator}
                    onChange={(e) => set("elevator", e.target.checked)} className="w-4 h-4" />
                  <label htmlFor="elevator" className="text-sm text-foreground">엘리베이터</label>
                </div>
                <input type="text" placeholder="주차 (예: 2대)" value={form.parking}
                  onChange={(e) => set("parking", e.target.value)} className={ic} />
              </div>
            </Section>

            <Section label="메모">
              <textarea placeholder="건물 메모" value={form.building_memo ?? ""}
                onChange={(e) => set("building_memo", e.target.value)}
                className={ic + " resize-none"} rows={2} />
              <textarea placeholder="방 메모" value={form.room_memo ?? ""}
                onChange={(e) => set("room_memo", e.target.value)}
                className={ic + " resize-none"} rows={2} />
              <textarea placeholder="특이사항" value={form.note ?? ""}
                onChange={(e) => set("note", e.target.value)}
                className={ic + " resize-none"} rows={2} />
              <textarea placeholder="매물 설명" value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className={ic + " resize-none"} rows={3} />
            </Section>

            <Section label="비밀번호">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">건물 비번</label>
                  <input type="text" placeholder="건물 비밀번호" value={form.building_password ?? ""} onChange={(e) => set("building_password", e.target.value)} className={ic} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">방 비번</label>
                  <input type="text" placeholder="방 비밀번호" value={form.room_password ?? ""} onChange={(e) => set("room_password", e.target.value)} className={ic} />
                </div>
              </div>
            </Section>

            <Section label="반려동물">
              <div className="flex gap-2">
                {(["반려동물가능", "반려동물불가"] as const).map((key) => {
                  const isActive = form.options.includes(key);
                  return (
                    <button key={key} type="button" onClick={() => toggleOption(key)}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${isActive ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/50"}`}
                    >
                      {key === "반려동물가능" ? "🐾 가능" : "🚫 불가"}
                    </button>
                  );
                })}
              </div>
            </Section>
          </>}

          {/* ── STEP 3: 연락처 / 등록 ── */}
          {formStep === 3 && <>
            <Section label="연락처">
              <ContactField label="건물주" required value={form.contactOwner} onChange={(v) => set("contactOwner", v)} />
              <ContactField label="세입자" value={form.contactTenant} onChange={(v) => set("contactTenant", v)} />
              <ContactField label="부동산" value={form.contactBroker} onChange={(v) => set("contactBroker", v)} />
              <ContactField label="관리인" value={form.contactManager} onChange={(v) => set("contactManager", v)} />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-foreground/70">담당 부동산명</label>
                <input type="text" placeholder="예: 청주공인중개" value={form.agent_name}
                  onChange={(e) => set("agent_name", e.target.value)} className={ic} />
              </div>
            </Section>

            <Section label="날짜 / 상태">
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">등록일</label>
                  <input type="date" value={form.registered_date}
                    onChange={(e) => set("registered_date", e.target.value)} className={ic} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-muted-foreground">확인일</label>
                  <input type="date" value={form.checked_date}
                    onChange={(e) => set("checked_date", e.target.value)} className={ic} />
                </div>
              </div>
              <div className="flex gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.is_new} onChange={(e) => set("is_new", e.target.checked)} className="w-4 h-4" />
                  신규
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.is_hot} onChange={(e) => set("is_hot", e.target.checked)} className="w-4 h-4" />
                  인기
                </label>
              </div>
            </Section>

            <Section label="이미지 업로드">
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={(e) => handleImageUpload(e.target.files)} />
              {(form.images ?? []).length > 0 && (
                <ImageCarouselPreview
                  images={form.images}
                  onRemove={(i) => setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                />
              )}
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="w-full py-3 rounded-xl border-2 border-dashed border-border hover:border-primary/50 text-sm text-muted-foreground hover:text-foreground transition-all disabled:opacity-50">
                {uploading ? "업로드 중..." : `+ 사진 추가 ${(form.images ?? []).length > 0 ? `(${form.images.length}장)` : ""}`}
              </button>
            </Section>
          </>}
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border flex-shrink-0 gap-2">
          {initial?.id && formStep === 3 ? (
            <button type="button"
              onClick={async () => {
                if (!confirm("정말 삭제하시겠습니까?")) return;
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
              className="px-4 py-2 rounded-full text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors">
              삭제
            </button>
          ) : <div />}

          <div className="flex gap-2">
            {formStep > 1 && (
              <button type="button" onClick={() => setFormStep((s) => (s - 1) as 1 | 2 | 3)}
                className="px-4 py-2 rounded-full text-xs font-bold border border-border hover:bg-muted transition-colors">
                이전
              </button>
            )}
            {formStep < 3 ? (
              <button type="button" onClick={() => setFormStep((s) => (s + 1) as 1 | 2 | 3)}
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
    </div>
  );
};

export default AdminPropertyFormModal;
