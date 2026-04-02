import { useState } from "react";
import { Menu, X, Bell, LogOut, Home, Users, ShieldCheck, ChevronDown, Building, ClipboardList, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import PropertyRegisterModal from "@/components/PropertyRegisterModal";
import AdminEditBar from "@/components/AdminEditBar";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { label: "주거형 임대", path: "/residential", icon: Building },
  { label: "아파트/오피스텔", path: "/apartment", icon: Building },
  { label: "주거형 외 임대·매매", path: "/non-residential", icon: Building },
  { label: "토지", path: "/land", icon: Building },
  { label: "내 임대·매매 관리", path: "/my-properties", icon: ClipboardList },
];

interface HeaderProps {
  onRegisterChange?: (open: boolean) => void;
}

const Header = ({ onRegisterChange }: HeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthorized, user, logout } = useAuth();

  const openRegister = () => {
    setShowRegister(true);
    onRegisterChange?.(true);
  };
  const closeRegister = () => {
    setShowRegister(false);
    onRegisterChange?.(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-[950] flex-shrink-0" style={{ background: "hsl(var(--header-bg))" }}>
      <AdminEditBar />
      {showRegister && <PropertyRegisterModal onClose={closeRegister} />}

      {/* 상단 바 */}
      <div className="border-b" style={{ borderColor: "hsl(var(--header-border))" }}>
        <div className="w-full px-3 sm:px-5">
          <div className="flex items-center h-12 gap-1">

            {/* 로고 */}
            <div
              className="flex items-center gap-2 cursor-pointer mr-3 select-none flex-shrink-0"
              onClick={() => navigate("/")}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "hsl(var(--accent))" }}
              >
                <Home className="w-4 h-4 text-white" />
              </div>
              <span
                className="text-[15px] font-extrabold tracking-tight text-white hidden sm:block"
                style={{ letterSpacing: "-0.02em" }}
              >
                집다
              </span>
              <span
                className="text-[10px] font-medium hidden lg:block px-1.5 py-0.5 rounded"
                style={{
                  background: "hsl(var(--header-border))",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                공인중개사 전용
              </span>
            </div>


            {/* 데스크톱 Nav */}
            <nav className="hidden md:flex items-center gap-0.5 flex-1 overflow-hidden">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className="text-[12px] font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
                  style={
                    isActive(item.path)
                      ? { background: "rgba(255,255,255,0.12)", color: "white" }
                      : { color: "rgba(255,255,255,0.65)" }
                  }
                >
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => navigate("/community")}
                className="flex items-center gap-1 text-[12px] font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
                style={
                  isActive("/community")
                    ? { background: "rgba(255,255,255,0.12)", color: "white" }
                    : { color: "rgba(255,255,255,0.65)" }
                }
              >
                <Users className="w-3.5 h-3.5" />
                커뮤니티
              </button>
            </nav>

            {/* 우측 액션 */}
            <div className="hidden md:flex items-center gap-1 ml-auto flex-shrink-0">
              <button
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors"
                style={{ color: "rgba(255,255,255,0.6)" }}
              >
                <Bell className="w-3.5 h-3.5" />
              </button>

              {isAuthorized ? (
                <>
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                  >
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold text-white flex-shrink-0"
                      style={{ background: "hsl(var(--accent))" }}
                    >
                      {user?.memberType?.[0] ?? "U"}
                    </div>
                    <span className="text-[11px] font-semibold text-white/80">{user?.memberType ?? "사용자"}</span>
                    <ChevronDown className="w-3 h-3 text-white/40" />
                  </div>

                  {user?.isAdmin && (
                    <button
                      className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.7)",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                      onClick={() => navigate("/admin")}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      관리자
                    </button>
                  )}

                  <button
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ color: "rgba(255,255,255,0.55)" }}
                    onClick={handleLogout}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <button
                  className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.7)",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                  onClick={() => navigate("/admin/login")}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  관리자
                </button>
              )}

              {location.pathname !== "/" && (
                <Button
                  size="sm"
                  onClick={openRegister}
                  className="h-8 text-[12px] font-bold px-4 rounded-lg ml-1"
                  style={{ background: "hsl(var(--accent))", color: "white", border: "none" }}
                >
                  + 매물 등록
                </Button>
              )}
            </div>

            {/* 모바일 햄버거 */}
            <button
              className="md:hidden text-white p-1 ml-auto"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <div className="md:hidden border-t flex flex-col gap-0.5 py-2 px-3"
          style={{ background: "hsl(var(--header-bg))", borderColor: "hsl(var(--header-border))" }}>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => { navigate(item.path); setMenuOpen(false); }}
              className="text-left text-sm font-medium text-white/70 py-2 px-3 rounded-lg hover:bg-white/10"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => { navigate("/community"); setMenuOpen(false); }}
            className="text-left text-sm font-medium text-white/70 py-2 px-3 rounded-lg hover:bg-white/10"
          >
            커뮤니티
          </button>
          <div className="pt-1 border-t mt-1" style={{ borderColor: "hsl(var(--header-border))" }}>
            {location.pathname !== "/" && (
              <Button
                size="sm"
                onClick={openRegister}
                className="w-full rounded-lg font-bold"
                style={{ background: "hsl(var(--accent))", color: "white", border: "none" }}
              >
                + 매물 등록
              </Button>
            )}
            {isAuthorized && (
              <button
                className="w-full text-sm text-white/50 font-medium py-2 mt-1"
                onClick={handleLogout}
              >
                로그아웃
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
