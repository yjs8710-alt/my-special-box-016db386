import { useState } from "react";
import { X, Upload, MapPin, Building2, ChevronDown, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

const DEAL_TYPES = ["월세", "전세", "매매"] as const;
type DealType = typeof DEAL_TYPES[number];

const schema = z.object({
  address: z.string().trim().min(5, "주소를 입력해주세요").max(200),
  type: z.enum(["상가", "사무실", "식당·카페", "공장·창고", "병원·학원"], { errorMap: () => ({ message: "업종을 선택해주세요" }) }),
  area: z.string().trim().min(1, "면적을 입력해주세요").max(50),
  contact: z.string().trim().regex(/^[0-9\-]{9,14}$/, "올바른 연락처를 입력해주세요"),
  description: z.string().trim().min(10, "설명을 10자 이상 입력해주세요").max(1000),
});

type FormData = z.infer<typeof schema>;
const TYPES = ["상가", "사무실", "식당·카페", "공장·창고", "병원·학원"] as const;

interface UnitEntry {
  id: number;
  floor: string;
  unitNo: string;
  dealType: DealType;
  deposit: string;
  price: string;
}

interface Props { onClose: () => void; }

let unitIdSeq = 1;

const PropertyRegisterModal = ({ onClose }: Props) => {
  const [form, setForm] = useState<Partial<FormData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [units, setUnits] = useState<UnitEntry[]>([
    { id: unitIdSeq++, floor: "", unitNo: "", dealType: "월세", deposit: "", price: "" },
  ]);
  const [unitErrors, setUnitErrors] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  // 주소 기반 자동 제목 생성
  const autoTitle = (address: string, unit: UnitEntry) => {
    const base = address.replace("충청북도 청주시 ", "").replace("충청북도 ", "");
    const parts = [base, unit.floor && `${unit.floor}층`, unit.unitNo && `${unit.unitNo}호`].filter(Boolean);
    return parts.join(" ");
  };

  const addUnit = () => {
    setUnits((prev) => [...prev, { id: unitIdSeq++, floor: "", unitNo: "", dealType: "월세", deposit: "", price: "" }]);
  };

  const removeUnit = (id: number) => {
    if (units.length === 1) return;
    setUnits((prev) => prev.filter((u) => u.id !== id));
  };

  const updateUnit = (id: number, field: keyof Omit<UnitEntry, "id">, value: string) => {
    setUnits((prev) => prev.map((u) => u.id === id ? { ...u, [field]: value } : u));
    setUnitErrors((prev) => { const n = { ...prev }; delete n[id]; return n; });
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

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4"
      style={{ background: "rgba(10,20,50,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-card w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        style={{ boxShadow: "0 24px 64px rgba(10,45,110,0.25)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0"
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
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-5">

            {/* 기본 정보 */}
            <section>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</h3>
              <div className="flex flex-col gap-3">
                {/* 주소 */}
                <Field label="건물 주소" error={errors.address} required>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="예) 청주시 흥덕구 가경동 123-4"
                      value={form.address ?? ""}
                      onChange={(e) => set("address", e.target.value)}
                      maxLength={200}
                      className={inputCls(!!errors.address) + " pl-9"}
                    />
                  </div>
                  {form.address && units[0] && (
                    <p className="text-[11px] text-primary mt-1 ml-1">
                      📌 매물 제목 미리보기: <strong>{autoTitle(form.address, units[0])}</strong>
                      {units.length > 1 && ` 외 ${units.length - 1}개 호수`}
                    </p>
                  )}
                </Field>

                {/* 업종 */}
                <Field label="업종" error={errors.type} required>
                  <div className="relative">
                    <select
                      value={form.type ?? ""}
                      onChange={(e) => set("type", e.target.value)}
                      className={inputCls(!!errors.type) + " appearance-none cursor-pointer"}
                    >
                      <option value="">업종 선택</option>
                      {TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </Field>

                {/* 면적 */}
                <Field label="면적" error={errors.area} required>
                  <input
                    type="text"
                    placeholder="예) 85㎡ (25평)"
                    value={form.area ?? ""}
                    onChange={(e) => set("area", e.target.value)}
                    className={inputCls(!!errors.area)}
                  />
                </Field>
              </div>
            </section>

            {/* 호수별 임대조건 */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">호수별 임대 조건</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">같은 주소에 여러 호실이 있으면 추가하세요</p>
                </div>
                <button
                  type="button"
                  onClick={addUnit}
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
                      {/* 층수 */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-foreground/70">층수 <span className="text-accent">*</span></label>
                        <input
                          type="text" placeholder="예) 2"
                          value={unit.floor}
                          onChange={(e) => updateUnit(unit.id, "floor", e.target.value)}
                          className={inputCls(false) + " text-sm py-2"}
                        />
                      </div>
                      {/* 호수 */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-foreground/70">호수</label>
                        <input
                          type="text" placeholder="예) 201"
                          value={unit.unitNo}
                          onChange={(e) => updateUnit(unit.id, "unitNo", e.target.value)}
                          className={inputCls(false) + " text-sm py-2"}
                        />
                      </div>
                      {/* 거래 유형 */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-semibold text-foreground/70">거래 유형 <span className="text-accent">*</span></label>
                        <div className="flex gap-1">
                          {DEAL_TYPES.map((dt) => (
                            <button
                              key={dt} type="button"
                              onClick={() => updateUnit(unit.id, "dealType", dt)}
                              className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                                unit.dealType === dt
                                  ? dt === "월세" ? "bg-primary text-primary-foreground border-primary"
                                    : dt === "전세" ? "bg-purple-600 text-white border-purple-600"
                                    : "bg-accent text-accent-foreground border-accent"
                                  : "bg-background text-foreground border-border hover:border-primary"
                              }`}
                            >
                              {dt}
                            </button>
                          ))}
                        </div>
                      </div>
                      {/* 보증금 (월세/전세만) */}
                      {unit.dealType !== "매매" && (
                        <div className="flex flex-col gap-1">
                          <label className="text-[11px] font-semibold text-foreground/70">보증금</label>
                          <input
                            type="text" placeholder="예) 500만원"
                            value={unit.deposit}
                            onChange={(e) => updateUnit(unit.id, "deposit", e.target.value)}
                            className={inputCls(false) + " text-sm py-2"}
                          />
                        </div>
                      )}
                      {/* 금액 */}
                      <div className={`flex flex-col gap-1 ${unit.dealType === "매매" ? "col-span-2" : ""}`}>
                        <label className="text-[11px] font-semibold text-foreground/70">{priceLabel(unit.dealType)} <span className="text-accent">*</span></label>
                        <input
                          type="text"
                          placeholder={unit.dealType === "매매" ? "예) 3억 5,000만원" : unit.dealType === "전세" ? "예) 1억원" : "예) 80만원"}
                          value={unit.price}
                          onChange={(e) => updateUnit(unit.id, "price", e.target.value)}
                          className={inputCls(false) + " text-sm py-2"}
                        />
                      </div>
                    </div>

                    {/* 미리보기 타이틀 */}
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

            {/* 설명 */}
            <section>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">매물 설명</h3>
              <Field label="" error={errors.description}>
                <textarea
                  placeholder="매물의 특징, 주변 환경, 입주 가능일 등을 자세히 적어주세요. (10자 이상)"
                  value={form.description ?? ""}
                  onChange={(e) => set("description", e.target.value)}
                  maxLength={1000}
                  rows={3}
                  className={inputCls(!!errors.description) + " resize-none"}
                />
                <p className="text-right text-[11px] text-muted-foreground mt-1">{(form.description ?? "").length} / 1000</p>
              </Field>
            </section>

            {/* 연락처 */}
            <section>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">연락처</h3>
              <Field label="전화번호" error={errors.contact} required>
                <input
                  type="tel"
                  placeholder="예) 043-123-4567"
                  value={form.contact ?? ""}
                  onChange={(e) => set("contact", e.target.value)}
                  maxLength={14}
                  className={inputCls(!!errors.contact)}
                />
              </Field>
            </section>

            {/* Actions */}
            <div className="flex gap-3 pt-2 pb-1 flex-shrink-0 sticky bottom-0 bg-card">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                취소
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

const inputCls = (hasError: boolean) =>
  `w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all bg-background text-foreground placeholder:text-muted-foreground ${
    hasError
      ? "border-destructive focus:ring-2 focus:ring-destructive/20"
      : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
  }`;

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
