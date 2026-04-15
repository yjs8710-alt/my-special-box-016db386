import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Eye, EyeOff, CheckCircle2, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { formatPhone } from "@/lib/utils";

const STEPS = ["기본 정보", "자격 인증", "약관 동의"];

const SignupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    passwordConfirm: "",
    memberType: "",
    agencyName: "",
    agencyPhone: "",
    licenseNumber: "",
    businessNumber: "",
    agencyAddress: "",
    agreeAll: false,
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleAgreeAll = (checked: boolean) => {
    setForm((f) => ({
      ...f,
      agreeAll: checked,
      agreeTerms: checked,
      agreePrivacy: checked,
      agreeMarketing: checked,
    }));
  };

  const handleAgreeSingle = (key: "agreeTerms" | "agreePrivacy" | "agreeMarketing", checked: boolean) => {
    const next = { ...form, [key]: checked };
    next.agreeAll = next.agreeTerms && next.agreePrivacy && next.agreeMarketing;
    setForm(next);
  };

  const canNext0 =
    form.name.trim() &&
    form.phone.trim() &&
    form.email.trim() &&
    form.password.length >= 8 &&
    form.password === form.passwordConfirm &&
    form.memberType;

  const canNext1 =
    form.agencyName.trim() &&
    form.agencyPhone.trim() &&
    form.licenseNumber.trim() &&
    form.businessNumber.trim() &&
    form.agencyAddress.trim();

  const canSubmit = form.agreeTerms && form.agreePrivacy;

  const handleNext = () => { setError(""); setStep((s) => s + 1); };
  const handleBack = () => { setError(""); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    // 1. Supabase 이메일/비밀번호 회원가입
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError) {
      setLoading(false);
      if (signUpError.message.includes("already registered") || signUpError.message.includes("already been registered")) {
        setError("이미 가입된 이메일입니다. 로그인 페이지에서 로그인해 주세요.");
      } else {
        setError(signUpError.message || "회원가입에 실패했습니다. 다시 시도해 주세요.");
      }
      return;
    }

    const userId = signUpData.user?.id;
    if (!userId) {
      setLoading(false);
      setError("회원가입 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
      return;
    }

    // 2. 중개사 프로필 저장
    const { error: profileError } = await supabase.from("agent_profiles").insert({
      user_id: userId,
      name: form.name.trim(),
      phone: form.phone.trim(),
      agency_name: form.agencyName.trim(),
      agency_phone: form.agencyPhone.trim(),
      license_number: form.licenseNumber.trim(),
      business_number: form.businessNumber.trim(),
      agency_address: form.agencyAddress.trim(),
      agree_marketing: form.agreeMarketing,
      member_type: form.memberType,
      status: "pending",
    });

    setLoading(false);

    if (profileError) {
      setError("프로필 저장 중 오류가 발생했습니다: " + profileError.message);
      return;
    }

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "hsl(var(--background))" }}>
        <div className="bg-card rounded-2xl shadow-lg p-10 max-w-md w-full flex flex-col items-center gap-5 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "hsl(var(--primary) / 0.08)" }}>
            <CheckCircle2 className="w-9 h-9" style={{ color: "hsl(var(--primary))" }} />
          </div>
          <h2 className="text-xl font-bold text-foreground">가입 신청이 완료되었습니다</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            관리자가 <strong className="text-foreground">{form.licenseNumber}</strong>(공인중개사 등록번호) 및{" "}
            <strong className="text-foreground">{form.businessNumber}</strong>(사업자 등록번호)를
            확인 후 승인 처리합니다.
            <br /><br />
            승인 결과는 <strong className="text-foreground">{form.email}</strong>로 안내드립니다.
          </p>
          <Button
            className="w-full rounded-full font-semibold mt-2"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            onClick={() => navigate("/")}
          >
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b" style={{ background: "hsl(var(--header-bg))", borderColor: "hsl(var(--header-border))" }}>
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "hsl(var(--accent))" }}>
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold text-white tracking-tight">집다</span>
          </div>
          <span className="text-sm text-white/60">중개사 회원가입</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-lg">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((label, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                    style={
                      i < step
                        ? { background: "hsl(var(--primary))", color: "#fff" }
                        : i === step
                        ? { background: "hsl(var(--accent))", color: "#fff" }
                        : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                    }
                  >
                    {i < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span
                    className="text-[10px] font-medium whitespace-nowrap"
                    style={{ color: i === step ? "hsl(var(--accent))" : "hsl(var(--muted-foreground))" }}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="w-12 h-0.5 mb-4 transition-all"
                    style={{ background: i < step ? "hsl(var(--primary))" : "hsl(var(--border))" }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="bg-card rounded-2xl shadow-md p-8 border border-border">
            {/* Step 0: 기본 정보 */}
            {step === 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-foreground mb-1">기본 정보 입력</h2>

                {/* 회원 유형 선택 */}
                <div className="flex flex-col gap-2">
                  <Label>회원 유형 <span className="text-destructive">*</span></Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "대표중개사", label: "부동산 대표자", desc: "대표 공인중개사" },
                      { value: "소속중개사", label: "소속공인중개사", desc: "소속 공인중개사" },
                      { value: "중개보조원", label: "중개보조원", desc: "중개 보조 직원" },
                    ].map(({ value, label, desc }) => {
                      const isActive = form.memberType === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => set("memberType", value)}
                          className="flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 transition-all text-center"
                          style={
                            isActive
                              ? { borderColor: "hsl(var(--accent))", background: "hsl(var(--accent) / 0.08)" }
                              : { borderColor: "hsl(var(--border))", background: "transparent" }
                          }
                        >
                          <span
                            className="text-xs font-bold leading-tight"
                            style={{ color: isActive ? "hsl(var(--accent))" : "hsl(var(--foreground))" }}
                          >
                            {label}
                          </span>
                          <span className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label>이름 <span className="text-destructive">*</span></Label>
                    <Input placeholder="홍길동" value={form.name} onChange={(e) => set("name", e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>휴대폰 번호 <span className="text-destructive">*</span></Label>
                    <Input placeholder="010-0000-0000" value={form.phone} onChange={(e) => set("phone", formatPhone(e.target.value))} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>이메일 <span className="text-destructive">*</span></Label>
                  <Input type="email" placeholder="example@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>비밀번호 <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPw ? "text" : "password"}
                      placeholder="8자 이상 입력"
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      className="pr-10"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPw(!showPw)}>
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>비밀번호 확인 <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      type={showPwConfirm ? "text" : "password"}
                      placeholder="비밀번호 재입력"
                      value={form.passwordConfirm}
                      onChange={(e) => set("passwordConfirm", e.target.value)}
                      className="pr-10"
                    />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPwConfirm(!showPwConfirm)}>
                      {showPwConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {form.passwordConfirm && form.password !== form.passwordConfirm && (
                    <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다.</p>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: 자격 인증 */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground mb-0.5">자격 인증 정보</h2>
                  <p className="text-xs text-muted-foreground">관리자가 아래 정보를 확인 후 승인 처리합니다.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>부동산 중개사무소명 <span className="text-destructive">*</span></Label>
                  <Input placeholder="예) 집다공인중개사사무소" value={form.agencyName} onChange={(e) => set("agencyName", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>대표번호 <span className="text-destructive">*</span></Label>
                  <Input placeholder="043-000-0000" value={form.agencyPhone} onChange={(e) => set("agencyPhone", formatPhone(e.target.value))} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>공인중개사 등록번호 <span className="text-destructive">*</span></Label>
                  <Input placeholder="예) 11350-2024-00001" value={form.licenseNumber} onChange={(e) => set("licenseNumber", e.target.value)} />
                  <p className="text-xs text-muted-foreground">등록증에 표기된 번호를 입력해 주세요.</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>사업자 등록번호 <span className="text-destructive">*</span></Label>
                  <Input placeholder="000-00-00000" value={form.businessNumber} onChange={(e) => set("businessNumber", e.target.value)} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>사무소 주소 <span className="text-destructive">*</span></Label>
                  <Input placeholder="예) 서울시 강남구 테헤란로 123" value={form.agencyAddress} onChange={(e) => set("agencyAddress", e.target.value)} />
                </div>
                <div className="rounded-lg p-3 text-xs text-muted-foreground leading-relaxed" style={{ background: "hsl(var(--muted))" }}>
                  ℹ️ 입력하신 공인중개사 등록번호 및 사업자 등록번호는 관리자가 직접 확인 후 승인합니다. 허위 정보 입력 시 이용이 제한될 수 있습니다.
                </div>
              </div>
            )}

            {/* Step 2: 약관 동의 */}
            {step === 2 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-foreground mb-1">약관 동의</h2>
                <div className="rounded-xl border border-border p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 pb-3 border-b border-border">
                    <Checkbox
                      id="agreeAll"
                      checked={form.agreeAll}
                      onCheckedChange={(c) => toggleAgreeAll(!!c)}
                    />
                    <label htmlFor="agreeAll" className="text-sm font-semibold text-foreground cursor-pointer">전체 동의</label>
                  </div>
                  {[
                    { id: "agreeTerms", key: "agreeTerms" as const, label: "[필수] 이용약관 동의", required: true },
                    { id: "agreePrivacy", key: "agreePrivacy" as const, label: "[필수] 개인정보 수집·이용 동의", required: true },
                    { id: "agreeMarketing", key: "agreeMarketing" as const, label: "[선택] 마케팅 정보 수신 동의", required: false },
                  ].map(({ id, key, label }) => (
                    <div key={id} className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={form[key]}
                        onCheckedChange={(c) => handleAgreeSingle(key, !!c)}
                      />
                      <label htmlFor={id} className="text-sm text-foreground cursor-pointer flex-1">{label}</label>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: "hsl(var(--primary) / 0.06)", color: "hsl(var(--primary))" }}>
                  가입 신청 후 관리자 승인까지 <strong>1~2 영업일</strong>이 소요될 수 있습니다.
                  승인 결과는 입력하신 이메일 <strong>{form.email}</strong>로 발송됩니다.
                </div>
                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <Button
                  variant="outline"
                  className="flex-1 rounded-full gap-1"
                  onClick={handleBack}
                  disabled={loading}
                >
                  <ArrowLeft className="w-4 h-4" />
                  이전
                </Button>
              )}
              {step < 2 ? (
                <Button
                  className="flex-1 rounded-full font-semibold gap-1"
                  style={{ background: "hsl(var(--accent))", color: "#fff" }}
                  disabled={step === 0 ? !canNext0 : !canNext1}
                  onClick={handleNext}
                >
                  다음
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  className="flex-1 rounded-full font-semibold"
                  style={{ background: "hsl(var(--primary))", color: "#fff" }}
                  disabled={!canSubmit || loading}
                  onClick={handleSubmit}
                >
                  {loading ? "신청 중..." : "가입 신청하기"}
                </Button>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-5">
            이미 계정이 있으신가요?{" "}
            <button className="font-semibold hover:underline" style={{ color: "hsl(var(--primary))" }} onClick={() => navigate("/login")}>
              로그인
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default SignupPage;
