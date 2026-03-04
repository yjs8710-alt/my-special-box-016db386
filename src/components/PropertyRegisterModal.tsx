import { useState } from "react";
import {
  X, Upload, MapPin, Building2, Plus, Trash2, Phone, ChevronDown,
} from "lucide-react";

/* ─── Types & Constants ─── */
const BROKER_TYPES = ["일반중개", "공동중개"] as const;
const TRADE_TYPES = ["임대", "매매"] as const;
const BUILDING_TYPES = ["일반건물", "집합건물", "토지"] as const;
const DETAIL_TYPES = [
  "원룸", "투베이", "투룸", "쓰리룸", "포룸",
  "주인", "고시원", "다가구", "단독주택", "토지", "상가", "사무실", "창고/공장",
] as const;
const ROOM_OPTIONS = [
  "냉장고", "세탁기", "드럼세탁기", "건조기", "스타일러", "TV",
  "에어컨", "가스레인지", "인덕션", "전자레인지", "침대", "책상",
  "옷장", "전자키", "복층", "옥탑", "테라스", "주차",
] as const;
const LH_TYPES = ["관계없음", "LH가능", "LH불가"] as const;
const VACANCY_TYPES = ["공실", "세입자 거주중"] as const;

type BrokerType = typeof BROKER_TYPES[number];
type TradeType = typeof TRADE_TYPES[number];
type BuildingType = typeof BUILDING_TYPES[number];
type DetailType = typeof DETAIL_TYPES[number] | "";
type VacancyType = typeof VACANCY_TYPES[number];
type LhType = typeof LH_TYPES[number];

interface FormState {
  // Step 1
  brokerType: BrokerType;
  tradeType: TradeType;
  buildingType: BuildingType;
  detailType: DetailType;
  address: string;
  floor: string;
  unitNo: string;
  area: string;
  // Step 2
  options: string[];
  vacancy: VacancyType;
  deposit: string;
  monthlyRent: string;
  managementFee: string;
  shortTerm: boolean;
  lhType: LhType;
  exitCleanFee: string;
  brokerFee: string;
  // Step 3
  description: string;
  contactBroker: string;
  contactOwner: string;
  contactTenant: string;
  contactManager: string;
  expose: boolean;
  allowAddressView: boolean;
}

const INITIAL: FormState = {
  brokerType: "일반중개", tradeType: "임대", buildingType: "일반건물",
  detailType: "", address: "", floor: "", unitNo: "", area: "",
  options: [], vacancy: "공실",
  deposit: "", monthlyRent: "", managementFee: "",
  shortTerm: false, lhType: "관계없음",
  exitCleanFee: "", brokerFee: "",
  description: "", contactBroker: "", contactOwner: "",
  contactTenant: "", contactManager: "",
  expose: true, allowAddressView: false,
};

const STEP_LABELS = ["기본 설정 및 주소", "옵션 및 조건", "연락처 및 노출"];

interface Props { onClose: () => void; }

/* ─── Main ─── */
export default function PropertyRegisterModal({ onClose }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  };

  const toggleOption = (opt: string) =>
    set("options", form.options.includes(opt)
      ? form.options.filter((o) => o !== opt)
      : [...form.options, opt]);

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.address.trim()) e.address = "주소를 입력해주세요";
    if (!form.detailType) e.detailType = "세부 종류를 선택해주세요";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.deposit.trim() && !form.monthlyRent.trim()) e.amount = "보증금 또는 월세를 입력해주세요";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep3 = () => {
    const e: Record<string, string> = {};
    if (!form.contactBroker.trim()) e.contactBroker = "부동산 연락처를 입력해주세요";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
    else if (step === 3 && validateStep3()) setSubmitted(true);
  };

  const goPrev = () => {
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
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
            {step === 3 && <Step3 form={form} set={set} errors={errors} />}

            {/* Actions */}
            <div className="flex gap-3 pt-4 pb-2 sticky bottom-0 bg-card">
              <button type="button" onClick={step === 1 ? onClose : goPrev}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors">
                {step === 1 ? "취소" : "이전"}
              </button>
              <button type="button" onClick={goNext}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors"
                style={{ boxShadow: "0 4px 16px hsl(var(--primary)/0.3)" }}>
                {step === 3 ? "매물 등록 신청" : "다음"}
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
  return (
    <div className="flex flex-col gap-5">
      <Section label="거래 방식">
        <div className="flex gap-5">
          {BROKER_TYPES.map((t) => <Radio key={t} checked={form.brokerType === t} onClick={() => set("brokerType", t)}>{t}</Radio>)}
        </div>
      </Section>

      <Section label="거래 종류">
        <div className="flex gap-5">
          {TRADE_TYPES.map((t) => <Radio key={t} checked={form.tradeType === t} onClick={() => set("tradeType", t)}>{t}</Radio>)}
        </div>
      </Section>

      <Section label="매물 종류">
        <div className="flex gap-5">
          {BUILDING_TYPES.map((t) => <Radio key={t} checked={form.buildingType === t} onClick={() => set("buildingType", t)}>{t}</Radio>)}
        </div>
      </Section>

      <Section label="세부 종류" error={errors.detailType}>
        <div className="flex flex-wrap gap-x-5 gap-y-2.5">
          {DETAIL_TYPES.map((t) => (
            <Radio key={t} checked={form.detailType === t} onClick={() => set("detailType", t)}>{t}</Radio>
          ))}
        </div>
      </Section>

      <Section label="주소 입력" error={errors.address}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" placeholder="예) 청주시 흥덕구 가경동 123-4"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className={ic(!!errors.address) + " pl-9"}
            />
          </div>
          <button type="button" className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors whitespace-nowrap">
            주소검색
          </button>
        </div>
      </Section>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground/70">층수</label>
          <input type="text" placeholder="예) 2" value={form.floor} onChange={(e) => set("floor", e.target.value)} className={ic(false)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground/70">호수</label>
          <input type="text" placeholder="예) 201" value={form.unitNo} onChange={(e) => set("unitNo", e.target.value)} className={ic(false)} />
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

      {/* 공실 여부 */}
      <Section label="현재 공실 여부">
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

      {/* 금액 */}
      <Section label="금액 입력" error={errors.amount}>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground/70">보증금</label>
            <input type="text" placeholder="예) 500만원" value={form.deposit} onChange={(e) => set("deposit", e.target.value)} className={ic(false)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground/70">월세</label>
            <input type="text" placeholder="예) 50만원" value={form.monthlyRent} onChange={(e) => set("monthlyRent", e.target.value)} className={ic(false)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground/70">관리비</label>
            <input type="text" placeholder="예) 5만원" value={form.managementFee} onChange={(e) => set("managementFee", e.target.value)} className={ic(false)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-foreground/70">퇴실 청소비</label>
            <input type="text" placeholder="예) 10만원" value={form.exitCleanFee} onChange={(e) => set("exitCleanFee", e.target.value)} className={ic(false)} />
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <label className="text-xs font-semibold text-foreground/70">중개 보수</label>
            <input type="text" placeholder="예) 협의" value={form.brokerFee} onChange={(e) => set("brokerFee", e.target.value)} className={ic(false)} />
          </div>
        </div>
      </Section>

      {/* 단기 임대 */}
      <Section label="">
        <div className="flex items-center gap-3">
          <Toggle checked={form.shortTerm} onClick={() => set("shortTerm", !form.shortTerm)} />
          <span className="text-sm font-semibold text-foreground">단기 임대 가능</span>
        </div>
      </Section>

      {/* LH 전세대출 */}
      <Section label="LH 전세대출">
        <div className="flex gap-3">
          {LH_TYPES.map((t) => (
            <Radio key={t} checked={form.lhType === t} onClick={() => set("lhType", t)}>{t}</Radio>
          ))}
        </div>
      </Section>
    </div>
  );
}

/* ─── Step 3 ─── */
function Step3({ form, set, errors }: { form: FormState; set: <K extends keyof FormState>(k: K, v: FormState[K]) => void; errors: Record<string, string> }) {
  const contacts: { key: keyof FormState; label: string; placeholder: string; required?: boolean }[] = [
    { key: "contactBroker", label: "부동산 연락처", placeholder: "예) 043-123-4567", required: true },
    { key: "contactOwner", label: "건물주 연락처", placeholder: "예) 010-1234-5678" },
    { key: "contactTenant", label: "세입자 연락처", placeholder: "예) 010-9876-5432" },
    { key: "contactManager", label: "관리인 연락처", placeholder: "예) 010-5555-6666" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* 매물 소개 */}
      <Section label="매물 소개">
        <textarea
          placeholder="매물의 특징, 주변 환경, 입주 가능일, 특이사항 등을 자세히 적어주세요."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={1000} rows={4}
          className={ic(false) + " resize-none"}
        />
        <p className="text-right text-[11px] text-muted-foreground mt-1">{form.description.length} / 1000</p>
      </Section>

      {/* 사진 업로드 */}
      <Section label="사진 업로드">
        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-5 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
          <Upload className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-sm text-muted-foreground group-hover:text-primary font-medium">사진 업로드 (최대 10장)</span>
          <span className="text-xs text-muted-foreground/60">JPG, PNG, WEBP</span>
          <input type="file" accept="image/*" multiple className="hidden" />
        </label>
      </Section>

      {/* 연락처 */}
      <Section label="연락처">
        <div className="flex flex-col gap-3">
          {contacts.map(({ key, label, placeholder, required }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-foreground/70">
                {label} {required && <span className="text-accent">*</span>}
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
            <Toggle checked={form.expose} onClick={() => set("expose", !form.expose)} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
            <div>
              <p className="text-sm font-semibold text-foreground">번지·호수 열람 허용</p>
              <p className="text-xs text-muted-foreground">상세 주소를 방문자에게 공개합니다</p>
            </div>
            <Toggle checked={form.allowAddressView} onClick={() => set("allowAddressView", !form.allowAddressView)} />
          </div>
        </div>
      </Section>
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
      <h3 className="text-lg font-extrabold text-foreground">등록 신청 완료!</h3>
      <p className="text-sm text-muted-foreground text-center">
        매물 검토 후 1~2 영업일 내에 게시됩니다.<br />궁금한 점은 고객센터로 문의해주세요.
      </p>
      <button onClick={onClose} className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors">
        확인
      </button>
    </div>
  );
}

/* ─── Shared UI ─── */
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

function Toggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition-all duration-200 flex-shrink-0 ${checked ? "bg-primary" : "bg-muted"}`}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}
