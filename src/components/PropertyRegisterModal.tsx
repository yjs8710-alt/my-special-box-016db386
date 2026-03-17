import { useState, useRef } from "react";
import { X, Building2, Phone, MapPin, ChevronDown, ImagePlus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* ─── Address Data ─── */
const CHEONGJU_SIGUNGU = [
  "청주시 상당구","청주시 서원구","청주시 청원구","청주시 흥덕구",
];

const DONG_MAP: Record<string, string[]> = {
  "청주시 상당구": [
    "북문로1가","북문로2가","북문로3가",
    "남문로1가","남문로2가","남문로3가",
    "서문동","문화동","수동","영동","석교동",
    "용담동","명암동","산성동","금천동","용암동",
  ],
  "청주시 서원구": [
    "사직동","사창동","모충동","수곡동",
    "성화동","죽림동","개신동","분평동","산남동",
  ],
  "청주시 흥덕구": [
    "운천동","신봉동","복대동","가경동",
    "봉명동","송정동","송절동","강서1동","강서2동",
    "오송읍","옥산면",
  ],
  "청주시 청원구": [
    "우암동","내덕동","율량동","사천동","오근장동",
    "주성동","주중동","정상동","외남동","외평동","외하동","정하동",
    "내수읍","북이면","오창읍",
  ],
};

/* ─── Constants ─── */
const BROKER_TYPES = ["일반중개","공동중개"] as const;
const TRADE_TYPES = ["임대","매매"] as const;
const BUILDING_TYPES = ["단독건물","집합건물","토지"] as const;
const DETAIL_TYPES = [
  "원룸","투베이","투룸","쓰리룸","포룸",
  "주인세대","고시원","다가구","단독주택",
  "아파트","오피스텔","빌라",
  "상가","식당·카페","사무실","공장·창고","병원·학원","토지",
] as const;
const ROOM_OPTIONS = [
  "냉장고","세탁기","드럼세탁기","건조기","스타일러","TV",
  "에어컨","가스레인지","인덕션","전자레인지","침대","책상",
  "옷장","전자키","복층","옥탑","테라스","주차",
] as const;
const LH_TYPES = ["관계없음","LH가능","LH불가"] as const;
const VACANCY_TYPES = ["공실","세입자 거주중"] as const;
const FLOOR_OPTIONS = [
  "지하5층","지하4층","지하3층","지하2층","지하1층","0층",
  "1층","2층","3층","4층","5층","6층","7층","8층","9층","10층","10층이상",
];
const DIRECTION_OPTIONS = ["동","서","남","북","동남","남서","북동","북서"];

type BrokerType = typeof BROKER_TYPES[number];
type TradeType = typeof TRADE_TYPES[number];
type BuildingType = typeof BUILDING_TYPES[number];
type DetailType = typeof DETAIL_TYPES[number] | "";
type VacancyType = typeof VACANCY_TYPES[number];
type LhType = typeof LH_TYPES[number];

interface FormState {
  brokerType: BrokerType;
  tradeType: TradeType;
  buildingType: BuildingType;
  detailType: DetailType;
  sido: string;
  sigungu: string;
  dong: string;
  lotNumber: string;
  buildingName: string;
  floor: string;
  unitNo: string;
  area: string;
  options: string[];
  roomPassword: string;
  direction: string;
  vacancy: VacancyType;
  deposit: string;
  monthlyRent: string;
  managementFee: string;
  salePrice: string;
  keyMoney: string;
  lhType: LhType;
  exitCleanFee: string;
  brokerFee: string;
  myMemo: string;
  description: string;
  contactBroker: string;
  contactOwner: string;
  contactTenant: string;
  contactManager: string;
  expose: boolean;
  allowAddressView: boolean;
  images: string[];
}

const INITIAL: FormState = {
  brokerType: "일반중개", tradeType: "임대", buildingType: "단독건물",
  detailType: "",
  sido: "충북", sigungu: "", dong: "", lotNumber: "",
  buildingName: "", floor: "", unitNo: "", area: "",
  options: [], roomPassword: "", direction: "",
  vacancy: "공실",
  deposit: "", monthlyRent: "", managementFee: "",
  salePrice: "", keyMoney: "",
  lhType: "관계없음", exitCleanFee: "", brokerFee: "",
  myMemo: "",
  description: "",
  contactBroker: "", contactOwner: "", contactTenant: "", contactManager: "",
  expose: true, allowAddressView: false,
  images: [],
};

const STEP_LABELS = ["기본 설정 및 주소", "옵션 및 조건", "연락처 및 사진"];

interface Props { onClose: () => void; }

export default function PropertyRegisterModal({ onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const toggleOption = (opt: string) =>
    set("options", form.options.includes(opt)
      ? form.options.filter((o) => o !== opt)
      : [...form.options, opt]);

  /* ─── 이미지 업로드 ─── */
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `properties/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("property-images").upload(path, file, { upsert: false });
      if (error) { console.error("업로드 실패:", error.message); continue; }
      const { data: urlData } = supabase.storage.from("property-images").getPublicUrl(path);
      if (urlData?.publicUrl) newUrls.push(urlData.publicUrl);
    }
    if (newUrls.length > 0) setForm((f) => ({ ...f, images: [...f.images, ...newUrls] }));
    setUploading(false);
  };

  const removeImage = (url: string) =>
    setForm((f) => ({ ...f, images: f.images.filter((u) => u !== url) }));

  const setMainImage = (url: string) =>
    setForm((f) => ({ ...f, images: [url, ...f.images.filter((u) => u !== url)] }));

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.sigungu) e.sigungu = "시/군/구를 선택해주세요";
    if (!form.dong) e.dong = "동을 선택해주세요";
    if (!form.detailType) e.detailType = "세부 종류를 선택해주세요";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (form.tradeType === "매매") {
      if (!form.salePrice.trim()) e.amount = "매매가액을 입력해주세요";
    } else {
      if (!form.deposit.trim() && !form.monthlyRent.trim()) e.amount = "보증금 또는 월세를 입력해주세요";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!form.contactOwner.trim()) e.contactOwner = "건물주 연락처를 입력해주세요";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setSaving(true);
    setSaveError("");

    const address = ["충북", form.sigungu, form.dong, form.lotNumber].filter(Boolean).join(" ");
    const districtVal = form.sigungu ? form.sigungu.replace("청주시 ", "") : null;

    const contactParts = [
      form.contactOwner && `건물주:${form.contactOwner}`,
      form.contactBroker && `부동산:${form.contactBroker}`,
      form.contactTenant && `세입자:${form.contactTenant}`,
      form.contactManager && `관리인:${form.contactManager}`,
    ].filter(Boolean).join("|");

    const payload = {
      title: `${form.dong} ${form.detailType}${form.floor ? ` ${form.floor}` : ""}`,
      building_name: form.buildingName || null,
      address,
      dong: form.dong,
      lot_number: form.lotNumber,
      district: districtVal,
      type: form.detailType || (form.brokerType === "공동중개" ? "공동중개" : form.tradeType),
      room_type: form.detailType || null,
      unit_number: form.unitNo || null,
      area: form.area,
      floor: form.floor,
      deposit: form.tradeType === "매매" ? form.salePrice : form.deposit,
      monthly: form.tradeType === "매매" ? "" : form.monthlyRent,
      manage_fee: form.managementFee,
      parking: "",
      elevator: false,
      available_from: "",
      total_floors: "",
      build_year: "",
      description: form.description,
      room_memo: form.myMemo || null,
      room_password: form.roomPassword || null,
      options: form.options,
      images: form.images,
      views: 0,
      lat: 0,
      lng: 0,
      is_new: true,
      is_hot: false,
      status: "active" as const,
      registered_date: new Date().toISOString().split("T")[0],
      agent_name: contactParts,
      note: [
        form.contactOwner && `건물주: ${form.contactOwner}`,
        form.contactBroker && `부동산: ${form.contactBroker}`,
        form.contactTenant && `세입자: ${form.contactTenant}`,
        form.contactManager && `관리인: ${form.contactManager}`,
      ].filter(Boolean).join("\n") || null,
    };

    const { error } = await supabase.from("properties").insert(payload);
    setSaving(false);

    if (!error && form.dong) {
      // ── cheongju_contacts 동기화 ──────────────────────────────
      const contactDistrict = districtVal ?? "";
      const hasContact = form.contactOwner || form.contactManager || form.contactBroker;
      if (hasContact) {
        let q = supabase
          .from("cheongju_contacts")
          .select("id")
          .eq("dong", form.dong);
        if (form.lotNumber) q = q.eq("lot_number", form.lotNumber);
        const { data: existing } = await q.maybeSingle();

        if (existing) {
          const upd: Record<string, string | null> = {};
          if (form.contactOwner) { upd.contact_owner = form.contactOwner; upd.phone = form.contactOwner; }
          if (form.contactManager) upd.contact_manager = form.contactManager;
          if (form.contactBroker) upd.contact_broker = form.contactBroker;
          await supabase.from("cheongju_contacts").update(upd).eq("id", existing.id);
          await supabase.from("cheongju_contacts").insert({
            district: contactDistrict,
            dong: form.dong,
            lot_number: form.lotNumber || "",
            phone: form.contactOwner || "",
            contact_owner: form.contactOwner || null,
            contact_manager: form.contactManager || null,
            contact_broker: form.contactBroker || null,
            is_visible: true,
          });
        }
      }
    }

    if (error) {
      setSaveError("저장 중 오류가 발생했습니다: " + error.message);
      return;
    }

    setSubmitted(true);
  };

  const goNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) handleSubmit();
  };

  const goPrev = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  return (
    <div className="fixed inset-0 z-[10200] flex items-center justify-center p-4"
      style={{ background: "rgba(10,20,50,0.55)", backdropFilter: "blur(4px)" }}>
      <div className="bg-card w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(10,45,110,0.25)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
          style={{ background: "hsl(var(--header-bg))" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">매물 등록</h2>
              <p className="text-xs text-white/50">빠르고 간편하게 공실을 등록하세요</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors rounded-lg p-1.5 hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        {!submitted && (
          <div className="px-6 pt-4 pb-2 flex-shrink-0">
            <div className="flex gap-1.5 mb-2">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{step}/3 {STEP_LABELS[step - 1]}</p>
          </div>
        )}

        {/* Body */}
        {submitted ? <SuccessView onClose={onClose} /> : (
          <div className="overflow-y-auto flex-1 px-6 py-4">
            {step === 1 && <Step1 form={form} set={set} errors={errors} />}
            {step === 2 && <Step2 form={form} set={set} toggleOption={toggleOption} errors={errors} />}
            {step === 3 && (
              <Step3
                form={form}
                set={set}
                errors={errors}
                uploading={uploading}
                fileInputRef={fileInputRef}
                onImageUpload={handleImageUpload}
                onImageRemove={removeImage}
                onImageSetMain={setMainImage}
              />
            )}

            {saveError && (
              <p className="text-xs text-destructive text-center mt-2">{saveError}</p>
            )}

            {/* 숨김 파일 input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files)}
            />

            <div className="flex gap-3 pt-4 pb-2 sticky bottom-0 bg-card">
              <button type="button" onClick={step === 1 ? onClose : goPrev}
                disabled={saving || uploading}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors disabled:opacity-50">
                {step === 1 ? "취소" : "이전"}
              </button>
              <button type="button" onClick={goNext}
                disabled={saving || uploading}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors disabled:opacity-70"
                style={{ boxShadow: "0 4px 16px hsl(var(--primary)/0.3)" }}>
                {saving ? "등록 중..." : uploading ? "사진 업로드 중..." : step === 3 ? "매물 등록" : "다음"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Step 1 ─── */
function Step1({ form, set, errors }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void; errors: Record<string, string> }) {
  const sigunguList = CHEONGJU_SIGUNGU;
  const dongList = DONG_MAP[form.sigungu] ?? [];

  return (
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

      {/* 세부 종류 */}
      <Section label="세부 종류" error={errors.detailType}>
        <div className="flex flex-wrap gap-x-4 gap-y-2.5">
          {DETAIL_TYPES.map((t) => (
            <Radio key={t} checked={form.detailType === t} onClick={() => set("detailType", t)}>{t}</Radio>
          ))}
        </div>
      </Section>

      {/* 주소 입력 */}
      <Section label="주소 입력">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/30 bg-primary/5">
          <span className="text-xs text-muted-foreground">시/도</span>
          <span className="text-sm font-bold text-primary">충청북도 (충북)</span>
          <span className="ml-auto text-[10px] text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">고정</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            {errors.sigungu && <p className="text-xs text-destructive">{errors.sigungu}</p>}
            <Select value={form.sigungu} onChange={(v) => { set("sigungu", v); set("dong", ""); }} placeholder="시/군/구 선택" options={sigunguList} />
          </div>
          <div className="flex flex-col gap-1">
            {errors.dong && <p className="text-xs text-destructive">{errors.dong}</p>}
            <Select value={form.dong} onChange={(v) => set("dong", v)} placeholder="동/읍/면 선택" options={dongList} disabled={!form.sigungu} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="번지 입력 (예: 123-4)" value={form.lotNumber} onChange={(e) => set("lotNumber", e.target.value)} className={ic(false) + " pl-9"} />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">번지</span>
        </div>
        <p className="text-[11px] text-muted-foreground/60 -mt-1">도로명주소 불가 / 번지주소만 가능</p>
      </Section>

      {/* 건물이름 */}
      <Section label="건물이름">
        <input type="text" placeholder="건물 이름 (선택)" value={form.buildingName} onChange={(e) => set("buildingName", e.target.value)} className={ic(false)} />
      </Section>

      {/* 층수 / 호수 / 평수 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground/70">층수</label>
          <Select value={form.floor} onChange={(v) => set("floor", v)} placeholder="선택" options={FLOOR_OPTIONS} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground/70">호수</label>
          <input type="text" placeholder="직접입력" value={form.unitNo} onChange={(e) => set("unitNo", e.target.value)} className={ic(false)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground/70">평수</label>
          <input type="text" placeholder="예) 15평" value={form.area} onChange={(e) => set("area", e.target.value)} className={ic(false)} />
        </div>
      </div>
    </div>
  );
}

/* ─── Step 2 ─── */
function Step2({
  form, set, toggleOption, errors,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  toggleOption: (opt: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* 요약 칩 */}
      <div className="flex gap-1.5 flex-wrap">
        {[form.brokerType, form.tradeType, form.buildingType, form.detailType].filter(Boolean).map((v) => (
          <span key={v} className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">{v}</span>
        ))}
      </div>

      {/* 방 옵션 */}
      <Section label="방 옵션">
        <div className="flex flex-wrap gap-2">
          {ROOM_OPTIONS.map((opt) => (
            <button key={opt} type="button" onClick={() => toggleOption(opt)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                form.options.includes(opt)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              }`}>
              {opt}
            </button>
          ))}
        </div>
      </Section>

      {/* 방 비번 */}
      <Section label="방 비번">
        <input type="text" placeholder="방 비밀번호 입력" value={form.roomPassword} onChange={(e) => set("roomPassword", e.target.value)} className={ic(false)} />
      </Section>

      {/* 방향 */}
      <Section label="방향">
        <div className="flex flex-wrap gap-2">
          {DIRECTION_OPTIONS.map((d) => (
            <button key={d} type="button" onClick={() => set("direction", form.direction === d ? "" : d)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                form.direction === d
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              }`}>
              {d}
            </button>
          ))}
        </div>
      </Section>

      {/* 공실 여부 */}
      <Section label="현재 빈방 여부">
        <div className="flex gap-3">
          {VACANCY_TYPES.map((t) => (
            <button key={t} type="button" onClick={() => set("vacancy", t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                form.vacancy === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-primary/50"
              }`}>
              {t}
            </button>
          ))}
        </div>
      </Section>

      {/* 금액 입력 */}
      <Section label="금액 입력" error={errors.amount}>
        <p className="text-[11px] text-muted-foreground/70 -mt-1">단위: 만원</p>
        <div className="grid grid-cols-2 gap-3">
          {/* 매매 선택 시 매매가액 */}
          {form.tradeType === "매매" ? (
            <div className="col-span-2">
              <AmountInput label="매매가액 *" value={form.salePrice} onChange={(v) => set("salePrice", v)} placeholder="예) 15,000" />
            </div>
          ) : (
            <>
              <AmountInput label="보증금" value={form.deposit} onChange={(v) => set("deposit", v)} />
              <AmountInput label="월세" value={form.monthlyRent} onChange={(v) => set("monthlyRent", v)} />
            </>
          )}
          {/* 상가 유형 시 권리금 */}
          {["상가","식당·카페","사무실","공장·창고","병원·학원"].includes(form.detailType) && (
            <div className="col-span-2">
              <AmountInput label="권리금" value={form.keyMoney} onChange={(v) => set("keyMoney", v)} placeholder="없으면 0 또는 비워두기" />
            </div>
          )}
          <AmountInput label="관리비" value={form.managementFee} onChange={(v) => set("managementFee", v)} />
          <AmountInput label="퇴실 청소비" value={form.exitCleanFee} onChange={(v) => set("exitCleanFee", v)} />
          <div className="col-span-2">
            <AmountInput label="중개보수" value={form.brokerFee} onChange={(v) => set("brokerFee", v)} placeholder="예) 협의" noUnit />
          </div>
        </div>
      </Section>

      {/* LH 전세대출 */}
      <Section label="LH (전세대출)">
        <div className="flex gap-3">
          {LH_TYPES.map((t) => (
            <Radio key={t} checked={form.lhType === t} onClick={() => set("lhType", t)}>{t}</Radio>
          ))}
        </div>
      </Section>

      {/* 내 메모 */}
      <Section label="내 메모">
        <textarea
          placeholder="관리용 메모 (외부에 노출되지 않음)"
          value={form.myMemo}
          onChange={(e) => set("myMemo", e.target.value)}
          rows={2}
          className={ic(false) + " resize-none"}
        />
      </Section>
    </div>
  );
}

/* ─── Step 3 ─── */
function Step3({
  form, set, errors, uploading, fileInputRef, onImageUpload, onImageRemove, onImageSetMain,
}: {
  form: FormState;
  set: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  errors: Record<string, string>;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onImageUpload: (files: FileList | null) => Promise<void>;
  onImageRemove: (url: string) => void;
  onImageSetMain: (url: string) => void;
}) {
  const contacts: { key: keyof FormState; label: string; placeholder: string; required?: boolean }[] = [
    { key: "contactOwner", label: "건물주 연락처", placeholder: "예) 010-1234-5678", required: true },
    { key: "contactBroker", label: "부동산 연락처", placeholder: "예) 043-123-4567" },
    { key: "contactTenant", label: "세입자 연락처", placeholder: "예) 010-9876-5432" },
    { key: "contactManager", label: "관리인 연락처", placeholder: "예) 010-5555-6666" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* 매물 소개 */}
      <Section label="매물 소개">
        <textarea
          placeholder="매물의 특징, 특이사항 등을 적어주세요."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={300} rows={3}
          className={ic(false) + " resize-none"}
        />
        <p className="text-right text-[11px] text-muted-foreground mt-0.5">{form.description.length} / 300</p>
      </Section>

      {/* 매물 사진 */}
      <Section label="매물 사진">
        {/* 캐러셀 미리보기 */}
        {form.images.length > 0 && (
          <ImagePreviewCarousel images={form.images} onRemove={onImageRemove} onSetMain={onImageSetMain} />
        )}
        {/* 업로드 버튼 */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed transition-all hover:border-primary hover:bg-primary/5 disabled:opacity-50"
          style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
        >
          {uploading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">업로드 중...</span></>
          ) : (
            <><ImagePlus className="w-4 h-4" /><span className="text-sm font-medium">사진 추가 {form.images.length > 0 ? `(${form.images.length}장)` : "(여러 장 가능)"}</span></>
          )}
        </button>
        <p className="text-[11px] text-muted-foreground/60 -mt-1">첫 번째 사진이 대표 이미지로 설정됩니다</p>
      </Section>

      {/* 연락처 */}
      <Section label="연락처">
        <div className="flex flex-col gap-3">
          {contacts.map(({ key, label, placeholder, required }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground/70">
                {label} {required && <span className="text-destructive">*</span>}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="tel" placeholder={placeholder}
                  value={form[key] as string}
                  onChange={(e) => set(key, e.target.value)}
                  className={ic(!!(errors[key])) + " pl-9"}
                />
              </div>
              {errors[key] && <p className="text-xs text-destructive">{errors[key]}</p>}
            </div>
          ))}
        </div>
      </Section>

      {/* 노출 설정 */}
      <Section label="노출 설정">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
            <div>
              <p className="text-sm font-semibold text-foreground">매물 노출</p>
              <p className="text-xs text-muted-foreground">플랫폼에 매물을 공개합니다</p>
            </div>
            <OnOffToggle checked={form.expose} onClick={() => set("expose", !form.expose)} />
          </div>
          <div className="flex items-start justify-between p-3 rounded-xl border border-border bg-muted/20 gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">번지·호수 열람 허용</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                다른 중개사가 번지와 호수를 볼 수 없어요.<br />
                열람해야 번지·호수를 볼 수 있으며 열람 시 알림을 보내드려요.
              </p>
            </div>
            <OnOffToggle checked={form.allowAddressView} onClick={() => set("allowAddressView", !form.allowAddressView)} />
          </div>
        </div>
      </Section>
    </div>
  );
}

/* ─── Image Preview Carousel ─── */
function ImagePreviewCarousel({
  images,
  onRemove,
  onSetMain,
}: {
  images: string[];
  onRemove: (url: string) => void;
  onSetMain?: (url: string) => void;
}) {
  const [idx, setIdx] = useState(0);
  const safeIdx = Math.min(idx, images.length - 1);

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  const handleRemove = (url: string) => {
    const newLen = images.length - 1;
    if (safeIdx >= newLen && newLen > 0) setIdx(newLen - 1);
    onRemove(url);
  };

  const isMain = safeIdx === 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full rounded-xl overflow-hidden bg-muted border border-border" style={{ height: 200 }}>
        {/* 슬라이드 */}
        <div
          className="flex h-full transition-transform duration-300 ease-in-out"
          style={{ transform: `translateX(-${safeIdx * 100}%)`, width: `${images.length * 100}%` }}
        >
          {images.map((src, i) => (
            <div key={src} className="h-full flex-shrink-0 relative" style={{ width: `${100 / images.length}%` }}>
              <img src={src} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />

        {/* 삭제 버튼 */}
        <button
          type="button"
          onClick={() => handleRemove(images[safeIdx])}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-destructive flex items-center justify-center transition-colors"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>

        {/* 대표 뱃지 or 대표 설정 버튼 */}
        {isMain ? (
          <span className="absolute top-2 left-2 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">⭐ 대표</span>
        ) : (
          onSetMain && (
            <button
              type="button"
              onClick={() => { onSetMain(images[safeIdx]); setIdx(0); }}
              className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors"
              style={{ background: "rgba(0,0,0,0.55)", color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}
            >
              대표로 설정
            </button>
          )
        )}

        {/* 이전/다음 버튼 */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center backdrop-blur-sm transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </>
        )}

        {/* 인디케이터 + 장수 */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex flex-col items-center gap-1">
            <div className="flex gap-1">
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
          </div>
        )}

        {/* 장수 카운터 */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-3 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
            {safeIdx + 1} / {images.length}
          </div>
        )}
      </div>

      {/* 썸네일 스트립 */}
      {images.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIdx(i)}
              className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all"
              style={{ borderColor: i === safeIdx ? "hsl(var(--primary))" : "transparent" }}
            >
              <img src={src} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <span className="absolute bottom-0 left-0 right-0 text-center text-[7px] font-bold bg-primary/80 text-white leading-4">대표</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Success ─── */
function SuccessView({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 gap-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <span className="text-3xl">🎉</span>
      </div>
      <h3 className="text-lg font-extrabold text-foreground">등록 완료!</h3>
      <p className="text-sm text-muted-foreground text-center">
        매물이 즉시 등록되었습니다.<br />매물 목록에서 확인하세요.
      </p>
      <button onClick={onClose} className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
        확인
      </button>
    </div>
  );
}

/* ─── Shared UI Helpers ─── */
const ic = (hasError: boolean) =>
  `w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all bg-background text-foreground placeholder:text-muted-foreground ${
    hasError
      ? "border-destructive focus:ring-2 focus:ring-destructive/20"
      : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
  }`;

function Section({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <p className="text-sm font-bold text-foreground">{label}</p>}
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

function OnOffToggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all flex-shrink-0 ${
        checked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      }`}>
      {checked ? "ON" : "OFF"}
    </button>
  );
}

function Select({
  value, onChange, placeholder, options, disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all appearance-none bg-background text-foreground border-border focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-40 disabled:cursor-not-allowed pr-8"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

function AmountInput({
  label, value, onChange, placeholder = "만원", noUnit = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  noUnit?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-foreground/70">{label}</label>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={ic(false) + (noUnit ? "" : " pr-10")}
        />
        {!noUnit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">만원</span>
        )}
      </div>
    </div>
  );
}
