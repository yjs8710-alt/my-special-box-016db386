import { useState } from "react";
import { X, Upload, MapPin, Building2, ChevronDown, Plus, Trash2, Phone } from "lucide-react";
import { z } from "zod";

/* ─── Constants ─── */
const DEAL_TYPES = ["월세", "전세", "매매"] as const;
type DealType = typeof DEAL_TYPES[number];

const BROKER_TYPES = ["일반중개", "공동중개"] as const;
type BrokerType = typeof BROKER_TYPES[number];

const TRADE_TYPES = ["임대", "매매"] as const;
type TradeType = typeof TRADE_TYPES[number];

const BUILDING_TYPES = ["일반건물", "집합건물", "토지"] as const;
type BuildingType = typeof BUILDING_TYPES[number];

const DETAIL_TYPES = [
  "원룸", "미투(1.5룸)", "두룸", "정투룸", "미쓰(미니쓰리룸)", "쓰리룸",
  "포룸", "주인", "고시원", "상가", "사무실", "창고/공장", "숙박/펜션",
] as const;
type DetailType = typeof DETAIL_TYPES[number];

const schema = z.object({
  address: z.string().trim().min(5, "주소를 입력해주세요").max(200),
  contact: z.string().trim().regex(/^[0-9\-]{9,14}$/, "올바른 연락처를 입력해주세요"),
  description: z.string().trim().min(10, "설명을 10자 이상 입력해주세요").max(1000),
});
type FormData = z.infer<typeof schema>;

interface UnitEntry {
  id: number;
  floor: string;
  unitNo: string;
  dealType: DealType;
  deposit: string;
  price: string;
}

interface Step1Data {
  brokerType: BrokerType;
  tradeType: TradeType;
  buildingType: BuildingType;
  detailType: DetailType | "";
}

interface Props { onClose: () => void; }
let unitIdSeq = 1;

/* ─── Main Component ─── */
const PropertyRegisterModal = ({ onClose }: Props) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [step1, setStep1] = useState<Step1Data>({
    brokerType: "일반중개",
    tradeType: "임대",
    buildingType: "일반건물",
    detailType: "",
  });
  const [step1Error, setStep1Error] = useState("");

  const [form, setForm] = useState<Partial<FormData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [units, setUnits] = useState<UnitEntry[]>([
    { id: unitIdSeq++, floor: "", unitNo: "", dealType: "월세", deposit: "", price: "" },
  ]);
  const [unitErrors, setUnitErrors] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const setF = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const autoTitle = (address: string, unit: UnitEntry) => {
    const base = address.replace("충청북도 청주시 ", "").replace("충청북도 ", "");
    const parts = [base, unit.floor && `${unit.floor}층`, unit.unitNo && `${unit.unitNo}호`].filter(Boolean);
    return parts.join(" ");
  };

  const addUnit = () =>
    setUnits((prev) => [...prev, { id: unitIdSeq++, floor: "", unitNo: "", dealType: "월세", deposit: "", price: "" }]);

  const removeUnit = (id: number) => {
    if (units.length === 1) return;
    setUnits((prev) => prev.filter((u) => u.id !== id));
  };

  const updateUnit = (id: number, field: keyof Omit<UnitEntry, "id">, value: string) => {
    setUnits((prev) => prev.map((u) => u.id === id ? { ...u, [field]: value } : u));
    setUnitErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const handleStep1Next = () => {
    if (!step1.detailType) { setStep1Error("세부 종류를 선택해주세요"); return; }
    setStep1Error("");
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    const fieldErrors: Partial<Record<keyof FormData, string>> = {};
    if (!result.success) {
      result.error.errors.forEach((err) => {
        const key = err.path[0] as keyof FormData;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
    }
    const uErrors: Record<number, string> = {};
    units.forEach((u) => {
      if (!u.floor) uErrors[u.id] = "층수를 입력하세요";
      else if (!u.price) uErrors[u.id] = "금액을 입력하세요";
    });
    setUnitErrors(uErrors);
    if (Object.keys(fieldErrors).length > 0 || Object.keys(uErrors).length > 0) return;
    setSubmitted(true);
  };

  const priceLabel = (dealType: DealType) =>
    dealType === "매매" ? "매매가" : dealType === "전세" ? "전세금" : "월세";

  const STEP_LABELS = ["기본 설정 및 주소", "상세 정보"];

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{ background: "rgba(10,20,50,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="bg-card w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(10,45,110,0.25)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
          style={{ background: "hsl(var(--header-bg))" }}
        >
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

        {/* Step Indicator */}
        {!submitted && (
          <div className="px-6 pt-4 pb-2 flex-shrink-0">
            <div className="flex gap-1.5 mb-2">
              {[1, 2].map((s) => (
                <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{step}/2 {STEP_LABELS[step - 1]}</p>
          </div>
        )}

        {/* Content */}
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
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
        ) : step === 1 ? (
          /* ── STEP 1 ── */
          <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">

            {/* 거래 방식 */}
            <section>
              <SectionLabel>거래 방식</SectionLabel>
              <div className="flex gap-4">
                {BROKER_TYPES.map((bt) => (
                  <RadioOption key={bt} checked={step1.brokerType === bt} onClick={() => setStep1((p) => ({ ...p, brokerType: bt }))}>
                    {bt}
                  </RadioOption>
                ))}
              </div>
            </section>

            {/* 거래 종류 */}
            <section>
              <SectionLabel>거래 종류</SectionLabel>
              <div className="flex gap-4">
                {TRADE_TYPES.map((tt) => (
                  <RadioOption key={tt} checked={step1.tradeType === tt} onClick={() => setStep1((p) => ({ ...p, tradeType: tt }))}>
                    {tt}
                  </RadioOption>
                ))}
              </div>
            </section>

            {/* 매물 종류 */}
            <section>
              <SectionLabel>매물 종류 <Tag>단독건물 (집합건물 아님)</Tag></SectionLabel>
              <div className="flex gap-4">
                {BUILDING_TYPES.map((bt) => (
                  <RadioOption key={bt} checked={step1.buildingType === bt} onClick={() => setStep1((p) => ({ ...p, buildingType: bt }))}>
                    {bt}
                  </RadioOption>
                ))}
              </div>
            </section>

            {/* 세부 종류 */}
            <section>
              <SectionLabel>세부 종류</SectionLabel>
              <div className="flex flex-wrap gap-x-5 gap-y-2.5">
                {DETAIL_TYPES.map((dt) => (
                  <RadioOption key={dt} checked={step1.detailType === dt} onClick={() => { setStep1((p) => ({ ...p, detailType: dt })); setStep1Error(""); }}>
                    {dt}
                  </RadioOption>
                ))}
              </div>
              {step1Error && <p className="text-xs text-destructive mt-2">{step1Error}</p>}
            </section>

            {/* 주소 */}
            <section>
              <SectionLabel>주소 입력</SectionLabel>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="예) 청주시 흥덕구 가경동 123-4"
                    value={form.address ?? ""}
                    onChange={(e) => setF("address", e.target.value)}
                    className={inputCls(!!errors.address) + " pl-9"}
                  />
                </div>
                <button
                  type="button"
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors whitespace-nowrap"
                >
                  주소검색
                </button>
              </div>
              {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
            </section>

            {/* Next */}
            <div className="flex gap-3 pt-2 pb-1 sticky bottom-0 bg-card">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                취소
              </button>
              <button type="button" onClick={handleStep1Next}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors"
                style={{ boxShadow: "0 4px 16px hsl(var(--primary)/0.3)" }}
              >
                다음
              </button>
            </div>
          </div>
        ) : (
          /* ── STEP 2 ── */
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">

            {/* 선택 요약 */}
            <div className="flex gap-1.5 flex-wrap">
              {[step1.brokerType, step1.tradeType, step1.buildingType, step1.detailType].filter(Boolean).map((v) => (
                <span key={v} className="text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-full">{v}</span>
              ))}
            </div>

            {/* 호수별 임대조건 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">호수별 임대 조건</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">같은 주소에 여러 호실이 있으면 추가하세요</p>
                </div>
                <button
                  type="button" onClick={addUnit}
                  className="flex items-center gap-1 text-xs font-bold text-primary border border-primary/30 px-2.5 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> 호실 추가
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {units.map((unit, idx) => (
                  <div key={unit.id}
                    className={`border rounded-xl p-4 relative transition-all ${unitErrors[unit.id] ? "border-destructive bg-destructive/5" : "border-border bg-muted/20"}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-extrabold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {idx + 1}번 호실
                        {unit.floor && unit.unitNo && ` · ${unit.floor}층 ${unit.unitNo}호`}
                      </span>
                      {units.length > 1 && (
                        <button type="button" onClick={() => removeUnit(unit.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-foreground/70">층수 <span className="text-accent">*</span></label>
                        <input type="text" placeholder="예) 2" value={unit.floor}
                          onChange={(e) => updateUnit(unit.id, "floor", e.target.value)}
                          className={inputCls(false) + " text-sm py-2"} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-foreground/70">호수</label>
                        <input type="text" placeholder="예) 201" value={unit.unitNo}
                          onChange={(e) => updateUnit(unit.id, "unitNo", e.target.value)}
                          className={inputCls(false) + " text-sm py-2"} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-foreground/70">거래 유형 <span className="text-accent">*</span></label>
                        <div className="flex gap-1">
                          {DEAL_TYPES.map((dt) => (
                            <button key={dt} type="button" onClick={() => updateUnit(unit.id, "dealType", dt)}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                                unit.dealType === dt
                                  ? dt === "월세" ? "bg-primary text-primary-foreground border-primary"
                                    : dt === "전세" ? "bg-purple-600 text-white border-purple-600"
                                    : "bg-accent text-accent-foreground border-accent"
                                  : "bg-background text-foreground border-border hover:border-primary"
                              }`}
                            >{dt}</button>
                          ))}
                        </div>
                      </div>
                      {unit.dealType !== "매매" && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-semibold text-foreground/70">보증금</label>
                          <input type="text" placeholder="예) 500만원" value={unit.deposit}
                            onChange={(e) => updateUnit(unit.id, "deposit", e.target.value)}
                            className={inputCls(false) + " text-sm py-2"} />
                        </div>
                      )}
                      <div className={`flex flex-col gap-1 ${unit.dealType === "매매" ? "col-span-2" : ""}`}>
                        <label className="text-[11px] font-semibold text-foreground/70">{priceLabel(unit.dealType)} <span className="text-accent">*</span></label>
                        <input type="text"
                          placeholder={unit.dealType === "매매" ? "예) 3억 5,000만원" : unit.dealType === "전세" ? "예) 1억원" : "예) 80만원"}
                          value={unit.price}
                          onChange={(e) => updateUnit(unit.id, "price", e.target.value)}
                          className={inputCls(false) + " text-sm py-2"} />
                      </div>
                    </div>

                    {form.address && unit.floor && (
                      <p className="text-[11px] text-muted-foreground mt-2 bg-muted/50 px-2 py-1 rounded-lg">
                        📌 {autoTitle(form.address, unit)}
                        {unit.dealType === "매매" ? ` · 매매 ${unit.price}` : ` · ${unit.dealType} ${unit.deposit ? unit.deposit + " / " : ""}${unit.price}`}
                      </p>
                    )}
                    {unitErrors[unit.id] && <p className="text-xs text-destructive mt-1">{unitErrors[unit.id]}</p>}
                  </div>
                ))}
              </div>
            </section>

            {/* 사진 업로드 */}
            <section>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">사진 업로드</h3>
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-6 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all group">
                <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-sm text-muted-foreground group-hover:text-primary font-medium">사진을 드래그하거나 클릭해서 업로드</span>
                <span className="text-xs text-muted-foreground/60">최대 10장 · JPG, PNG, WEBP</span>
                <input type="file" accept="image/*" multiple className="hidden" />
              </label>
            </section>

            {/* 매물 설명 */}
            <section>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">매물 설명</h3>
              <Field label="" error={errors.description}>
                <textarea
                  placeholder="매물의 특징, 주변 환경, 입주 가능일 등을 자세히 적어주세요. (10자 이상)"
                  value={form.description ?? ""}
                  onChange={(e) => setF("description", e.target.value)}
                  maxLength={1000} rows={3}
                  className={inputCls(!!errors.description) + " resize-none"}
                />
                <p className="text-right text-[11px] text-muted-foreground mt-1">{(form.description ?? "").length} / 1000</p>
              </Field>
            </section>

            {/* 연락처 */}
            <section>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">연락처</h3>
              <Field label="전화번호" error={errors.contact} required>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="tel" placeholder="예) 043-123-4567"
                    value={form.contact ?? ""}
                    onChange={(e) => setF("contact", e.target.value)}
                    maxLength={14}
                    className={inputCls(!!errors.contact) + " pl-9"}
                  />
                </div>
              </Field>
            </section>

            {/* Actions */}
            <div className="flex gap-3 pt-2 pb-1 flex-shrink-0 sticky bottom-0 bg-card">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                이전
              </button>
              <button type="submit"
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-extrabold hover:bg-primary/90 transition-colors"
                style={{ boxShadow: "0 4px 16px hsl(var(--primary)/0.3)" }}
              >
                매물 등록 신청
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* ─── Helpers ─── */
const inputCls = (hasError: boolean) =>
  `w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all bg-background text-foreground placeholder:text-muted-foreground ${
    hasError
      ? "border-destructive focus:ring-2 focus:ring-destructive/20"
      : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
  }`;

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm font-bold text-foreground mb-2.5 flex items-center gap-2">{children}</p>
);

const Tag = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[10px] font-bold text-destructive border border-destructive/40 px-1.5 py-0.5 rounded-full">{children}</span>
);

const RadioOption = ({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: React.ReactNode }) => (
  <label className="flex items-center gap-1.5 cursor-pointer select-none" onClick={onClick}>
    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
      checked ? "border-primary" : "border-muted-foreground/40"
    }`}>
      {checked && <span className="w-2 h-2 rounded-full bg-primary" />}
    </span>
    <span className={`text-sm ${checked ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{children}</span>
  </label>
);

const Field = ({
  label, error, required, children,
}: {
  label: string; error?: string; required?: boolean; children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label className="text-xs font-semibold text-foreground/80">
        {label} {required && <span className="text-accent">*</span>}
      </label>
    )}
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
);

export default PropertyRegisterModal;
