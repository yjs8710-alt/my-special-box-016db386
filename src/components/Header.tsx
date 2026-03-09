import { useState } from "react";
import { Menu, X, Bell, User, Home, Users, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import PropertyRegisterModal from "@/components/PropertyRegisterModal";
import AdminEditBar from "@/components/AdminEditBar";

const NAV_ITEMS = [
  { label: "주거형 임대", path: "/residential" },
  { label: "아파트/오피스텔", path: "/apartment" },
  { label: "주거형 외 임대·매매", path: "/non-residential" },
  { label: "토지", path: "/land" },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-[950]" style={{ background: "hsl(var(--header-bg))" }}>
      {showRegister && <PropertyRegisterModal onClose={() => setShowRegister(false)} />}
      {/* Top bar */}
      <div className="border-b" style={{ borderColor: "hsl(var(--header-border))" }}>
        <div className="w-full px-4 sm:px-6">
          <div className="flex items-center h-14">
            {/* Logo */}
            <div className="flex items-center gap-1.5 cursor-pointer mr-4" onClick={() => navigate("/")}>
              <div className="w-7 h-7 rounded bg-accent flex items-center justify-center">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-extrabold text-white tracking-tight">집다</span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center flex-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.path || "#"}
                  onClick={item.path ? (e) => { e.preventDefault(); navigate(item.path!); } : undefined}
                  className="text-sm font-medium px-4 py-4 text-white/80 hover:text-white transition-colors whitespace-nowrap"
                >
                  {item.label}
                </a>
              ))}
              {/* 커뮤니티 */}
              <button
                onClick={() => navigate("/community")}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-4 text-white/80 hover:text-accent transition-colors whitespace-nowrap"
              >
                <Users className="w-3.5 h-3.5" />
                커뮤니티
              </button>
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-1.5 ml-auto">
              <button className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 py-1.5 rounded transition-colors">
                <Bell className="w-4 h-4" />
                <span>알림</span>
              </button>
              <button className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 py-1.5 rounded transition-colors" onClick={() => navigate("/login")}>
                <User className="w-4 h-4" />
                <span>로그인 / 회원가입</span>
              </button>
              <button
                className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/90 px-2 py-1.5 rounded transition-colors border border-white/10 hover:border-white/30"
                onClick={() => navigate("/admin/login")}
                title="관리자 로그인"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>관리자</span>
              </button>
              <Button
                size="sm"
                onClick={() => setShowRegister(true)}
                className="bg-accent hover:bg-accent/90 text-white font-semibold text-xs px-4 rounded-full"
              >
                매물 등록
              </Button>
            </div>

            <button
              className="md:hidden text-white p-1 ml-auto"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-card border-t border-border px-4 py-3 flex flex-col gap-1 shadow-lg">
          {NAV_ITEMS.map((item) => (
            <a key={item.label} href="#" className="text-sm font-medium text-foreground py-2 border-b border-border last:border-0">
              {item.label}
            </a>
          ))}
          <Button size="sm" onClick={() => setShowRegister(true)} className="bg-accent text-white w-full mt-2 rounded-full font-semibold">
            매물 등록
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;
