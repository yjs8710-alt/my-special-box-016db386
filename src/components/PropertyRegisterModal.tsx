import { useState } from "react";
import { X, Building2, Phone, MapPin, ChevronDown } from "lucide-react";

/* ─── Address Data ─── */
const SIDO_LIST = [
  "강원","경기","경남","경북","광주","대구","대전","부산",
  "서울","세종","울산","인천","전남","전북","제주","충남","충북",
];

const SIGUNGU_MAP: Record<string, string[]> = {
  충북: ["괴산군","단양군","보은군","영동군","옥천군","음성군","제천시","증평군","진천군",
         "청주시 상당구","청주시 서원구","청주시 청원구","청주시 흥덕구","충주시"],
  경기: ["수원시","성남시","고양시","용인시","부천시","안산시","화성시","남양주시","안양시","평택시"],
  서울: ["강남구","강동구","강북구","강서구","관악구","광진구","구로구","금천구","노원구","도봉구",
         "동대문구","동작구","마포구","서대문구","서초구","성동구","성북구","송파구","양천구","영등포구",
         "용산구","은평구","종로구","중구","중랑구"],
  경남: ["창원시","진주시","통영시","사천시","김해시","밀양시","거제시","양산시"],
  경북: ["포항시","경주시","김천시","안동시","구미시","영주시","영천시","상주시","문경시","경산시"],
  광주: ["동구","서구","남구","북구","광산구"],
  대구: ["중구","동구","서구","남구","북구","수성구","달서구","달성군"],
  대전: ["동구","중구","서구","유성구","대덕구"],
  부산: ["중구","서구","동구","영도구","부산진구","동래구","남구","북구","해운대구","사하구",
         "금정구","강서구","연제구","수영구","사상구","기장군"],
  세종: ["세종시"],
  울산: ["중구","남구","동구","북구","울주군"],
  인천: ["중구","동구","미추홀구","연수구","남동구","부평구","계양구","서구","강화군","옹진군"],
  전남: ["목포시","여수시","순천시","나주시","광양시"],
  전북: ["전주시","군산시","익산시","정읍시","남원시","김제시"],
  제주: ["제주시","서귀포시"],
  충남: ["천안시","공주시","보령시","아산시","서산시","논산시","계룡시","당진시"],
  강원: ["춘천시","원주시","강릉시","동해시","태백시","속초시","삼척시"],
};

const DONG_MAP: Record<string, string[]> = {
  // ── 상당구 (행정동 기준) ──────────────────────────────────
  "청주시 상당구": [
    "낭성면","미원면","가덕면","남일면","문의면",
    "중앙동","성안동","탑·대성동","영운동","금천동",
    "용담·명암·산성동","용암1동","용암2동",
  ],
  // ── 서원구 (행정동 기준) ──────────────────────────────────
  "청주시 서원구": [
    "남이면","현도면",
    "사직1동","사직2동","사창동","모충동","분평동","산남동",
    "수곡1동","수곡2동","성화·개신·죽림동",
  ],
  // ── 흥덕구 (행정동 기준) ──────────────────────────────────
  "청주시 흥덕구": [
    "오송읍","강내면","옥산면",
    "운천·신봉동","복대1동","복대2동","가경동",
    "봉명1동","봉명2·송정동","강서제1동","강서제2동",
  ],
  // ── 청원구 (행정동 기준) ──────────────────────────────────
  "청주시 청원구": [
    "내수읍","오창읍","북이면",
    "우암동","내덕1동","내덕2동","율량·사천동","오근장동",
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
}

const INITIAL: FormState = {
  brokerType: "일반중개", tradeType: "임대", buildingType: "단독건물",
  detailType: "",
  sido: "", sigungu: "", dong: "", lotNumber: "",
  buildingName: "", floor: "", unitNo: "", area: "",
  options: [], roomPassword: "", direction: "",
  vacancy: "공실",
  deposit: "", monthlyRent: "", managementFee: "",
  lhType: "관계없음", exitCleanFee: "", brokerFee: "",
  myMemo: "",
  description: "",
  contactBroker: "", contactOwner: "", contactTenant: "", contactManager: "",
  expose: true, allowAddressView: false,
};

const STEP_LABELS = ["기본 설정 및 주소", "옵션 및 조건", "연락처 및 노출"];

interface Props { onClose: () => void; }

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
    if (!form.sido) e.sido = "시/도를 선택해주세요";
    if (!form.sigungu) e.sigungu = "시/군/구를 선택해주세요";
    if (!form.dong) e.dong = "동을 선택해주세요";
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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
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
  const sigunguList = SIGUNGU_MAP[form.sido] ?? [];
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
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            {errors.sido && <p className="text-xs text-destructive">{errors.sido}</p>}
            <Select
              value={form.sido}
              onChange={(v) => { set("sido", v); set("sigungu", ""); set("dong", ""); }}
              placeholder="시/도"
              options={SIDO_LIST}
            />
          </div>
          <div className="flex flex-col gap-1">
            {errors.sigungu && <p className="text-xs text-destructive">{errors.sigungu}</p>}
            <Select
              value={form.sigungu}
              onChange={(v) => { set("sigungu", v); set("dong", ""); }}
              placeholder="시/군/구"
              options={sigunguList}
              disabled={!form.sido}
            />
          </div>
          <div className="flex flex-col gap-1">
            {errors.dong && <p className="text-xs text-destructive">{errors.dong}</p>}
            <Select
              value={form.dong}
              onChange={(v) => set("dong", v)}
              placeholder="동"
              options={dongList}
              disabled={!form.sigungu}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" placeholder="번지 (예: 123-4)"
              value={form.lotNumber}
              onChange={(e) => set("lotNumber", e.target.value)}
              className={ic(false) + " pl-9"}
            />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap">번지</span>
        </div>
        <p className="text-[11px] text-muted-foreground/60 -mt-1">
          도로명주소 불가 / 번지주소만 가능
        </p>
      </Section>

      {/* 건물이름 */}
      <Section label="건물이름">
        <input
          type="text" placeholder="건물 이름 (선택)"
          value={form.buildingName}
          onChange={(e) => set("buildingName", e.target.value)}
          className={ic(false)}
        />
      </Section>

      {/* 층수 / 호수 / 평수 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-foreground/70">층수</label>
          <Select
            value={form.floor}
            onChange={(v) => set("floor", v)}
            placeholder="선택"
            options={FLOOR_OPTIONS}
          />
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
        <input
          type="text" placeholder="방 비밀번호 입력"
          value={form.roomPassword}
          onChange={(e) => set("roomPassword", e.target.value)}
          className={ic(false)}
        />
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
          <AmountInput label="보증금" value={form.deposit} onChange={(v) => set("deposit", v)} />
          <AmountInput label="월세" value={form.monthlyRent} onChange={(v) => set("monthlyRent", v)} />
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
          placeholder="매물의 특징, 특이사항 등을 적어주세요."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          maxLength={300} rows={3}
          className={ic(false) + " resize-none"}
        />
        <p className="text-right text-[11px] text-muted-foreground mt-0.5">{form.description.length} / 300</p>
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
        className={`w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all appearance-none bg-background text-foreground border-border focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-40 disabled:cursor-not-allowed pr-8`}
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
