import { useState } from "react";
import { X, Upload, MapPin, Building2, ChevronDown } from "lucide-react";
import { z } from "zod";

const schema = z.object({
  title: z.string().trim().min(2, "제목을 입력해주세요").max(100),
  address: z.string().trim().min(5, "주소를 입력해주세요").max(200),
  type: z.enum(["상가", "사무실", "식당·카페", "공장·창고", "병원·학원"], { errorMap: () => ({ message: "업종을 선택해주세요" }) }),
  area: z.string().trim().min(1, "면적을 입력해주세요").max(50),
  floor: z.string().trim().min(1, "층수를 입력해주세요").max(20),
  deposit: z.string().trim().min(1, "보증금을 입력해주세요").max(50),
  monthly: z.string().trim().min(1, "월세를 입력해주세요").max(50),
  contact: z.string().trim().regex(/^[0-9\-]{9,14}$/, "올바른 연락처를 입력해주세요"),
  description: z.string().trim().min(10, "설명을 10자 이상 입력해주세요").max(1000),
});

type FormData = z.infer<typeof schema>;

const TYPES = ["상가", "사무실", "식당·카페", "공장·창고", "병원·학원"] as const;

interface Props {
  onClose: () => void;
}

const PropertyRegisterModal = ({ onClose }: Props) => {
  const [form, setForm] = useState<Partial<FormData>>({});
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const set = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof FormData, string>> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as keyof FormData;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setSubmitted(true);
  };

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
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              확인
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-4">
            {/* 매물 기본 정보 */}
            <section>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">기본 정보</h3>
              <div className="flex flex-col gap-3">
                {/* 제목 */}
                <Field label="매물 제목" error={errors.title} required>
                  <input
                    type="text"
                    placeholder="예) 강남역 초역세권 1층 상가"
                    value={form.title ?? ""}
                    onChange={(e) => set("title", e.target.value)}
                    maxLength={100}
                    className={inputCls(!!errors.title)}
                  />
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

                {/* 주소 */}
                <Field label="주소" error={errors.address} required>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="예) 서울특별시 강남구 역삼동 123-4"
                      value={form.address ?? ""}
                      onChange={(e) => set("address", e.target.value)}
                      maxLength={200}
                      className={inputCls(!!errors.address) + " pl-9"}
                    />
                  </div>
                </Field>
              </div>
            </section>

            {/* 상세 조건 */}
            <section>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">임대 조건</h3>
              <div className="grid grid-cols-2 gap-3">
                <Field label="면적" error={errors.area} required>
                  <input
                    type="text"
                    placeholder="예) 85㎡ (25평)"
                    value={form.area ?? ""}
                    onChange={(e) => set("area", e.target.value)}
                    className={inputCls(!!errors.area)}
                  />
                </Field>
                <Field label="층수" error={errors.floor} required>
                  <input
                    type="text"
                    placeholder="예) 1층"
                    value={form.floor ?? ""}
                    onChange={(e) => set("floor", e.target.value)}
                    className={inputCls(!!errors.floor)}
                  />
                </Field>
                <Field label="보증금" error={errors.deposit} required>
                  <input
                    type="text"
                    placeholder="예) 5,000만원"
                    value={form.deposit ?? ""}
                    onChange={(e) => set("deposit", e.target.value)}
                    className={inputCls(!!errors.deposit)}
                  />
                </Field>
                <Field label="월세" error={errors.monthly} required>
                  <input
                    type="text"
                    placeholder="예) 350만원"
                    value={form.monthly ?? ""}
                    onChange={(e) => set("monthly", e.target.value)}
                    className={inputCls(!!errors.monthly)}
                  />
                </Field>
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
                  rows={4}
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
                  placeholder="예) 02-1234-5678"
                  value={form.contact ?? ""}
                  onChange={(e) => set("contact", e.target.value)}
                  maxLength={14}
                  className={inputCls(!!errors.contact)}
                />
              </Field>
            </section>

            {/* Actions */}
            <div className="flex gap-3 pt-2 pb-1 flex-shrink-0 sticky bottom-0 bg-card">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
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
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
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
