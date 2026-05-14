import { Home, Search, ClipboardList, Users, MessageCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const ITEMS = [
  { label: "홈", path: "/", Icon: Home, match: (p: string) => p === "/" },
  { label: "매물찾기", path: "/residential", Icon: Search, match: (p: string) => p.startsWith("/residential") || p === "/apartment" || p === "/non-residential" || p === "/collective-sale" || p === "/land" || p === "/commercial" },
  { label: "내매물", path: "/my-properties", Icon: ClipboardList, match: (p: string) => p.startsWith("/my-properties") },
  { label: "커뮤니티", path: "/community", Icon: Users, match: (p: string) => p.startsWith("/community") },
  { label: "채팅문의", path: "/chat", Icon: MessageCircle, match: (p: string) => p.startsWith("/chat") },
];

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on home page, auth, admin, and share routes
  const HIDDEN_PREFIXES = ["/login", "/signup", "/forgot-password", "/reset-password", "/admin", "/share", "/property"];
  if (location.pathname === "/") return null;
  if (HIDDEN_PREFIXES.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <nav
      className="md:hidden fixed left-2 right-2 z-[900] rounded-2xl border backdrop-blur-md"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
        background: "hsl(var(--header-bg) / 0.92)",
        borderColor: "hsl(var(--header-border))",
        boxShadow: "0 0 24px hsl(var(--accent) / 0.25), 0 8px 24px rgba(0,0,0,0.4)",
      }}
      aria-label="모바일 메인 메뉴"
    >
      <ul className="flex items-stretch justify-around px-1 py-2">
        {ITEMS.map(({ label, path, Icon, match }) => {
          const active = match(location.pathname);
          return (
            <li key={label} className="flex-1">
              <button
                onClick={() => navigate(path)}
                className="w-full flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all"
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className="w-6 h-6"
                  style={{
                    color: active ? "#a78bfa" : "rgba(255,255,255,0.55)",
                    filter: active ? "drop-shadow(0 0 6px hsl(var(--accent) / 0.7))" : "none",
                  }}
                  strokeWidth={active ? 2.4 : 2}
                />
                <span
                  className="text-[10px] font-bold leading-tight"
                  style={{
                    color: active ? "#fff" : "rgba(255,255,255,0.55)",
                  }}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MobileBottomNav;
