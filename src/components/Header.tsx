import { useState } from "react";
import { Menu, X, Bell, User, ChevronDown, Home, Map, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import PropertyRegisterModal from "@/components/PropertyRegisterModal";

const NAV_ITEMS = [
  { label: "주거형 임대", sub: ["원룸", "투룸", "쓰리룸+"] },
  { label: "상가임대", sub: ["1층 상가", "2층 이상", "지하 상가"] },
  { label: "주거형 외 임대", sub: ["사무실", "공장·창고", "병원·학원", "상가 매매", "사무실 매매", "토지 매매"] },
  { label: "토지", sub: ["대지", "임야", "농지"] },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<string | null>(null);
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
              {/* 커뮤니티 */}
              <button
                onClick={() => navigate("/community")}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-4 text-white/80 hover:text-accent transition-colors whitespace-nowrap"
              >
                <Users className="w-3.5 h-3.5" />
                커뮤니티
              </button>
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setActiveNav(item.label)}
                  onMouseLeave={() => setActiveNav(null)}
                >
                  <a
                    href="#"
                    className={`flex items-center gap-0.5 text-sm font-medium px-4 py-4 transition-colors whitespace-nowrap ${
                      activeNav === item.label
                        ? "text-accent"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    {item.label}
                    <ChevronDown className="w-3 h-3 opacity-60" />
                  </a>
                  {/* Dropdown */}
                  {activeNav === item.label && (
                    <div className="absolute top-full left-0 bg-card border border-border rounded-lg shadow-xl py-1 min-w-[140px] z-50">
                      {item.sub.map((s) => (
                        <a
                          key={s}
                          href="#"
                          className="block px-4 py-2 text-sm text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
                        >
                          {s}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <button className="hidden md:flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 py-1.5 rounded transition-colors">
                <Bell className="w-4 h-4" />
                <span>알림</span>
              </button>
              <button className="hidden md:flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 py-1.5 rounded transition-colors" onClick={() => navigate("/signup")}>
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
