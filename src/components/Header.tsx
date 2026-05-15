import { useState, useEffect, lazy, Suspense } from "react";
import { Menu, X, Bell, LogOut, Users, ShieldCheck, Building, ClipboardList, User, Download, Home, MessageCircle } from "lucide-react";
import logoImg from "@/assets/logo-zibda-active-opt.webp";
import iconMypageNew from "@/assets/icon-mypage-new.png";
import iconChat from "@/assets/icon-chat.png";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
const PropertyRegisterModal = lazy(() => import("@/components/PropertyRegisterModal"));
import AdminEditBar from "@/components/AdminEditBar";
const InstallAppModal = lazy(() => import("@/components/InstallAppModal"));
import { useAuth } from "@/hooks/useAuth";
import AdminNotificationBell from "@/components/AdminNotificationBell";
import NotificationBell from "@/components/NotificationBell";
import { GradientUserIcon, GradientLogoutIcon } from "@/components/icons/GradientIcons";

const NAV_ITEMS = [
  { label: "주거·임대", path: "/residential", icon: Building },
  { label: "상업·임대·매매", path: "/non-residential", icon: Building },
  { label: "집합건물·건물매매", path: "/collective-sale", icon: Building },
  { label: "토지", path: "/land", icon: Building },
  { label: "내 매물 관리", path: "/my-properties", icon: ClipboardList },
];

interface HeaderProps {
  onRegisterChange?: (open: boolean) => void;
  onMenuOpenChange?: (open: boolean) => void;
}

const Header = ({ onRegisterChange, onMenuOpenChange }: HeaderProps) => {
  const [menuOpen, _setMenuOpen] = useState(false);
  const setMenuOpen = (v: boolean) => {
    _setMenuOpen(v);
    onMenuOpenChange?.(v);
  };
  const [showRegister, setShowRegister] = useState(false);
  const [showInstall, setShowInstall] = useState(false);
  const [hideInstallButton, setHideInstallButton] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    const checkInstalled = () => {
      const isStandalone =
        window.matchMedia?.("(display-mode: standalone)").matches ||
        window.matchMedia?.("(display-mode: fullscreen)").matches ||
        window.matchMedia?.("(display-mode: minimal-ui)").matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.startsWith("android-app://");
      setHideInstallButton(isMobile && isStandalone);
    };
    checkInstalled();
    const mql = window.matchMedia?.("(display-mode: standalone)");
    mql?.addEventListener?.("change", checkInstalled);
    return () => mql?.removeEventListener?.("change", checkInstalled);
  }, []);

  const prefetchRoute = (path: string) => {
    if (path === "/residential" || path === "/apartment") import("@/pages/ResidentialRental").catch(() => {});
    else if (path === "/non-residential" || path === "/collective-sale") import("@/pages/NonResidentialRental").catch(() => {});
    else if (path === "/land") import("@/pages/LandSearch").catch(() => {});
    else if (path === "/my-properties") import("@/pages/MyProperties").catch(() => {});
    else if (path === "/my-page") import("@/pages/MyPage").catch(() => {});
    else if (path === "/my-info") import("@/pages/MyInfoPage").catch(() => {});
    else if (path === "/community") import("@/pages/Community").catch(() => {});
    else if (path === "/chat") import("@/pages/ChatPage").catch(() => {});
    else if (path === "/notifications") import("@/pages/NotificationsPage").catch(() => {});
    else if (path === "/admin") import("@/pages/AdminDashboard").catch(() => {});
  };

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthorized, user, logout } = useAuth();

  const openRegister = () => {
    window.dispatchEvent(new Event("close-map-filter"));
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
    <header className={`sticky top-0 flex-shrink-0 ${menuOpen ? "z-[1200]" : "z-[950]"}`} style={{ background: "hsl(var(--header-bg))" }}>
      {/* <AdminEditBar /> */}
      <Suspense fallback={null}>
        {showRegister && <PropertyRegisterModal onClose={closeRegister} />}
        {showInstall && <InstallAppModal open={showInstall} onClose={() => setShowInstall(false)} />}
      </Suspense>

      {/* 상단 바 */}
      <div className="border-b" style={{ borderColor: "hsl(var(--header-border))" }}>
        <div className="w-full pl-0 pr-3 sm:pr-5">
          <div className="flex items-center h-12 gap-0">

            {/* 로고 */}
            <div
              className="flex items-center cursor-pointer select-none flex-shrink-0 -ml-4 sm:ml-5 mr-0"
              onClick={() => navigate("/")}
            >
              <img src={logoImg} alt="집다 로고" loading="eager" decoding="async" width={200} height={80} className="h-24 md:h-20 w-auto object-contain object-left block mt-2" />
            </div>


            {/* 데스크톱 Nav */}
            <nav className="hidden md:flex items-center gap-0.5 flex-1 overflow-hidden">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.label}
                  onPointerEnter={() => prefetchRoute(item.path)}
                  onPointerDown={() => prefetchRoute(item.path)}
                  onClick={() => navigate(item.path)}
                  className="text-[12px] font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
                  style={
                    isActive(item.path)
                      ? { background: "rgba(255,255,255,0.12)", color: "white" }
                      : { color: "white" }
                  }
                >
                  {item.label}
                </button>
              ))}
              <button
                onPointerEnter={() => prefetchRoute("/community")}
                onPointerDown={() => prefetchRoute("/community")}
                onClick={() => navigate("/community")}
                className="flex items-center gap-1 text-[12px] font-medium px-3 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0"
                style={
                  isActive("/community")
                    ? { background: "rgba(255,255,255,0.12)", color: "white" }
                    : { color: "white" }
                }
              >
                <Users className="w-3.5 h-3.5" />
                커뮤니티
              </button>
            </nav>

            {/* 우측 액션 */}
            <div className="hidden md:flex items-center gap-1 ml-auto flex-shrink-0">
              <button
                onClick={() => window.dispatchEvent(new Event("open-chat-inquiry"))}
                className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg transition-all hover:bg-white/10"
                style={{ color: "white" }}
                title="채팅 문의"
              >
                <img src={iconChat} alt="" className="w-8 h-8 object-contain" />
                채팅문의
              </button>
              {user?.isAdmin ? <AdminNotificationBell /> : isAuthorized && <NotificationBell variant="desktop" />}

              {isAuthorized ? (
                <>
                   <button
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
                    onClick={() => navigate("/my-page")}
                  >
                    <span className="text-[11px] font-semibold text-white/80">{user?.memberType ?? "사용자"}</span>
                    <GradientUserIcon size={16} />
                  </button>

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
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors hover:bg-white/10"
                    onClick={handleLogout}
                    aria-label="로그아웃"
                    title="로그아웃"
                  >
                    <GradientLogoutIcon size={18} />
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
                  className="h-8 text-[12px] font-bold px-4 rounded-lg ml-1 text-white border-0 hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #d946ef 0%, #3b82f6 100%)" }}
                >
                  + 매물 등록
                </Button>
              )}
            </div>

            {/* 모바일: 알림 + 내정보 + 햄버거 */}
            <div className="md:hidden flex items-center ml-auto">
              <NotificationBell variant="mobile" />
              <button
                className="flex flex-col items-center justify-center w-12 h-11 rounded-md ml-1 active:opacity-70 transition-opacity"
                style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
                onPointerDown={() => {
                  if (!isAuthorized) { navigate("/login"); return; }
                  navigate("/my-info");
                }}
                onTouchStart={() => { import("@/pages/MyInfoPage").catch(() => {}); }}
                onMouseEnter={() => { import("@/pages/MyInfoPage").catch(() => {}); }}
                aria-label="내 정보"
                title="내 정보"
              >
                <img
                  src={iconMypageNew}
                  alt=""
                  className="w-7 h-7 object-contain"
                  style={{ filter: "drop-shadow(0 0 6px hsl(var(--accent) / 0.7))" }}
                />
              </button>
              <button
                className="text-white p-1 ml-1"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="메뉴"
              >
                {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {menuOpen && (
        <>
          {/* 배경 오버레이 — 메뉴 외부 터치 시 닫힘 */}
          <div
            className="md:hidden fixed inset-0 z-[9998]"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            className="md:hidden fixed left-0 right-0 top-12 z-[9999] border-t flex flex-col gap-0.5 py-2 px-3 overflow-y-auto"
            style={{
              background: "hsl(var(--header-bg))",
              borderColor: "hsl(var(--header-border))",
              maxHeight: "calc(100vh - 48px)",
            }}
          >
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                onPointerDown={() => prefetchRoute(item.path)}
                onClick={() => { navigate(item.path); setMenuOpen(false); }}
                className="text-left text-sm font-medium text-white/70 py-2 px-3 rounded-lg hover:bg-white/10 active:bg-white/15"
              >
                {item.label}
              </button>
            ))}
            <button
              onPointerDown={() => prefetchRoute("/community")}
              onClick={() => { navigate("/community"); setMenuOpen(false); }}
              className="text-left text-sm font-medium text-white/70 py-2 px-3 rounded-lg hover:bg-white/10 active:bg-white/15"
            >
              커뮤니티
            </button>
            {!hideInstallButton && (
              <button
                onClick={() => { setShowInstall(true); setMenuOpen(false); }}
                className="w-full text-left text-sm font-bold py-2 px-3 rounded-lg hover:bg-white/10 flex items-center gap-2 text-white"
              >
                <Download className="w-4 h-4" />
                앱 설치하기
              </button>
            )}
            <div className="pt-1 border-t mt-1" style={{ borderColor: "hsl(var(--header-border))" }}>
              {location.pathname !== "/" && (
                <Button
                  size="sm"
                  onClick={openRegister}
                  className="w-full rounded-lg font-bold text-white border-0 hover:opacity-90 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #d946ef 0%, #3b82f6 100%)" }}
                >
                  + 매물 등록
                </Button>
              )}
              {isAuthorized && (
                <>
                  <button
                    onClick={() => { navigate("/my-page"); setMenuOpen(false); }}
                    className="w-full text-left text-sm font-medium text-white/70 py-2 px-3 rounded-lg hover:bg-white/10"
                  >
                    마이페이지
                  </button>
                  {user?.isAdmin && (
                    <button
                      onClick={() => { navigate("/admin"); setMenuOpen(false); }}
                      className="w-full text-left text-sm font-bold py-2 px-3 rounded-lg hover:bg-white/10 flex items-center gap-2"
                      style={{ color: "hsl(var(--accent))" }}
                    >
                      <ShieldCheck className="w-4 h-4" />
                      관리자 모드
                    </button>
                  )}
                  <button
                    className="w-full text-sm text-white/50 font-medium py-2 mt-1"
                    onClick={handleLogout}
                  >
                    로그아웃
                  </button>
                </>
              )}
              {!isAuthorized && (
                <button
                  onClick={() => { navigate("/admin/login"); setMenuOpen(false); }}
                  className="w-full text-left text-sm font-medium text-white/70 py-2 px-3 rounded-lg hover:bg-white/10 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  로그인
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
