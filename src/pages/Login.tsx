import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    navigate("/");
  };

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
              disabled={!email || !password}
            >
              로그인
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
