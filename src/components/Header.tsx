import { useState } from "react";
import { Menu, X, Bell, User, Home, Map, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import PropertyRegisterModal from "@/components/PropertyRegisterModal";

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
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 rounded bg-accent flex items-center justify-center">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-extrabold text-white tracking-tight">집다</span>
              </div>
              <span className="hidden sm:block text-xs text-white/40 font-light pl-2 border-l border-white/20">
                중개사 전용 플랫폼
              </span>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center">
              {/* 지도검색 */}
              <button
                onClick={() => navigate("/map")}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-4 text-white/80 hover:text-accent transition-colors whitespace-nowrap"
              >
                <Map className="w-3.5 h-3.5" />
                지도 검색
              </button>
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
            <div className="flex items-center gap-1.5">
              <button className="hidden md:flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 py-1.5 rounded transition-colors">
                <Bell className="w-4 h-4" />
                <span>알림</span>
              </button>
              <button className="hidden md:flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 py-1.5 rounded transition-colors" onClick={() => navigate("/login")}>
                <User className="w-4 h-4" />
                <span>로그인 / 회원가입</span>
              </button>
              <Button
                size="sm"
                onClick={() => setShowRegister(true)}
                className="hidden md:flex bg-accent hover:bg-accent/90 text-white font-semibold text-xs px-4 rounded-full"
              >
                매물 등록
              </Button>
              <button
                className="md:hidden text-white p-1"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
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
