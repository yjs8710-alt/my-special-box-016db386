import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// 간단한 관리자 인증 (실제 서비스에서는 백엔드 인증 사용)
const ADMIN_ID = "admin";
const ADMIN_PW = "jibda2024!";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (id === ADMIN_ID && pw === ADMIN_PW) {
      sessionStorage.setItem("admin_auth", "true");
      navigate("/admin");
    } else {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: "hsl(var(--background))" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "hsl(var(--primary))" }}
          >
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <div
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ background: "hsl(var(--accent))" }}
              >
                <Home className="w-3 h-3 text-white" />
              </div>
              <span className="text-lg font-extrabold text-foreground">집다</span>
            </div>
            <p className="text-sm text-muted-foreground">관리자 전용 로그인</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl shadow-md p-8 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-id">관리자 아이디</Label>
            <Input
              id="admin-id"
              placeholder="아이디 입력"
              value={id}
              onChange={(e) => { setId(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="admin-pw">비밀번호</Label>
            <div className="relative">
              <Input
                id="admin-pw"
                type={showPw ? "text" : "password"}
                placeholder="비밀번호 입력"
                value={pw}
                onChange={(e) => { setPw(e.target.value); setError(""); }}
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

          <Button
            className="w-full rounded-full font-semibold mt-1"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            onClick={handleLogin}
            disabled={!id || !pw}
          >
            로그인
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-5">
          관리자 전용 페이지입니다. 일반 회원은{" "}
          <button
            className="font-semibold hover:underline"
            style={{ color: "hsl(var(--accent))" }}
            onClick={() => navigate("/")}
          >
            여기
          </button>
          를 이용하세요.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
