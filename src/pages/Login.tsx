import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Eye, EyeOff, Clock, XCircle, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

type ApprovalStatus = "approved" | "pending" | "rejected" | null;

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError("");

    // 1. 로그인
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.user) {
      setLoading(false);
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    // 2. agent_profiles 에서 승인 상태 + 접속 차단 여부 확인
    const { data: profile } = await supabase
      .from("agent_profiles")
      .select("status, is_active")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    setLoading(false);

    if (!profile) {
      await supabase.auth.signOut();
      setError("가입 신청 정보를 찾을 수 없습니다. 회원가입을 먼저 완료해 주세요.");
      return;
    }

    // 접속 차단된 계정
    if (profile.is_active === false) {
      await supabase.auth.signOut();
      setError("관리자에 의해 접속이 차단된 계정입니다. 관리자에게 문의해 주세요.");
      return;
    }

    if (profile.status === "approved") {
      navigate("/");
    } else {
      await supabase.auth.signOut();
      setApprovalStatus(profile.status as ApprovalStatus);
    }
  };

  // ── 심사 대기 / 거절 안내 화면 ─────────────────────────────────────────────
  if (approvalStatus === "pending" || approvalStatus === "rejected") {
    const isPending = approvalStatus === "pending";
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "hsl(var(--background))" }}
      >
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
          {/* Icon */}
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
            style={{
              background: isPending
                ? "hsl(var(--chart-4) / 0.12)"
                : "hsl(var(--destructive) / 0.10)",
            }}
          >
            {isPending
              ? <Clock className="w-10 h-10" style={{ color: "hsl(var(--chart-4))" }} />
              : <XCircle className="w-10 h-10" style={{ color: "hsl(var(--destructive))" }} />
            }
          </div>

          {/* Title */}
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-extrabold text-foreground">
              {isPending ? "심사 대기 중" : "가입이 거절되었습니다"}
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isPending
                ? <>
                    가입 신청이 접수되었습니다.<br />
                    관리자 심사 후 이메일로 승인 결과를 안내해 드립니다.<br />
                    <span className="font-semibold text-foreground">영업일 기준 1~3일</span> 소요될 수 있습니다.
                  </>
                : <>
                    가입 신청이 승인되지 않았습니다.<br />
                    자세한 사유는 가입 시 등록한 이메일을 확인하거나,<br />
                    고객센터로 문의해 주세요.
                  </>
              }
            </p>
          </div>

          {/* Info card */}
          <div
            className="w-full rounded-2xl p-5 flex flex-col gap-3 text-left"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            {isPending ? (
              <>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(var(--chart-2))" }} />
                  <span className="text-sm text-foreground">가입 신청서 접수 완료</span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(var(--chart-4))" }} />
                  <span className="text-sm text-muted-foreground">관리자 서류 검토 중</span>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
                  <span className="text-sm text-muted-foreground">이메일로 승인 결과 안내 예정</span>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "hsl(var(--muted-foreground))" }} />
                <span className="text-sm text-muted-foreground">
                  문의: <strong className="text-foreground">support@jipda.kr</strong>
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2.5 w-full">
            <Button
              className="w-full rounded-full font-semibold"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
              onClick={() => setApprovalStatus(null)}
            >
              로그인으로 돌아가기
            </Button>
            {approvalStatus === "rejected" && (
              <button
                className="text-sm font-semibold hover:underline"
                style={{ color: "hsl(var(--accent))" }}
                onClick={() => navigate("/signup")}
              >
                재신청하기
              </button>
            )}
            <button
              className="text-sm text-muted-foreground hover:underline"
              onClick={() => navigate("/")}
            >
              메인으로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 기본 로그인 폼 ─────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "hsl(var(--background))" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: "hsl(var(--header-bg))", borderColor: "hsl(var(--header-border))" }}
      >
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div
            className="flex items-center gap-1.5 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ background: "hsl(var(--accent))" }}
            >
              <Home className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold text-white tracking-tight">집다</span>
          </div>
          <span className="text-sm text-white/60">중개사 전용 플랫폼</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-sm flex flex-col gap-6">

          {/* Logo area */}
          <div className="text-center flex flex-col items-center gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "hsl(var(--primary))" }}
            >
              <Home className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-foreground">로그인</h1>
              <p className="text-sm text-muted-foreground mt-1">공인중개사 전용 서비스입니다</p>
            </div>
          </div>

          {/* Card */}
          <div className="bg-card border border-border rounded-2xl shadow-md p-8 flex flex-col gap-5">

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="login-email">이메일</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-pw">비밀번호</Label>
                <button
                  className="text-xs hover:underline"
                  style={{ color: "hsl(var(--primary))" }}
                  onClick={() => navigate("/forgot-password")}
                  type="button"
                >
                  비밀번호 찾기
                </button>
              </div>
              <div className="relative">
                <Input
                  id="login-pw"
                  type={showPw ? "text" : "password"}
                  placeholder="비밀번호 입력"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-destructive -mt-1">{error}</p>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(c) => setRemember(!!c)}
              />
              <label
                htmlFor="remember"
                className="text-sm text-muted-foreground cursor-pointer select-none"
              >
                로그인 상태 유지
              </label>
            </div>

            <Button
              className="w-full rounded-full font-semibold"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
              onClick={handleLogin}
              disabled={!email || !password || loading}
            >
              {loading ? "로그인 중..." : "로그인"}
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
              <span className="text-xs text-muted-foreground">또는</span>
              <div className="flex-1 h-px" style={{ background: "hsl(var(--border))" }} />
            </div>

            {/* SNS login */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-full border text-sm font-medium transition-colors hover:bg-muted/50"
                style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google로 로그인
              </button>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-medium transition-colors"
                style={{ background: "#FEE500", color: "#3C1E1E" }}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C7.03 3 3 6.36 3 10.5c0 2.67 1.64 5.02 4.12 6.43l-.94 3.5 3.98-2.62c.59.08 1.19.12 1.84.12 4.97 0 9-3.36 9-7.5S16.97 3 12 3z"/>
                </svg>
                카카오로 로그인
              </button>
            </div>
          </div>

          {/* Footer links */}
          <div className="text-center text-sm text-muted-foreground">
            계정이 없으신가요?{" "}
            <button
              className="font-semibold hover:underline"
              style={{ color: "hsl(var(--accent))" }}
              onClick={() => navigate("/signup")}
            >
              회원가입 신청
            </button>
          </div>

          <div
            className="rounded-xl p-3.5 text-xs text-center leading-relaxed"
            style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
          >
            본 서비스는 <strong className="text-foreground">공인중개사 전용</strong>으로 운영됩니다.
            <br />가입 신청 후 관리자 승인이 완료되어야 이용 가능합니다.
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
