import { useNavigate, useLocation } from "react-router-dom";
import navHome from "@/assets/nav-0.png";
import navSearch from "@/assets/nav-1.png";
import navMy from "@/assets/nav-2.png";
import navCommunity from "@/assets/nav-3.png";
import navChat from "@/assets/nav-4.png";

const ITEMS = [
  { label: "홈", path: "/", icon: navHome, match: (p: string) => p === "/" },
  { label: "매물찾기", path: "/residential", icon: navSearch, match: (p: string) => p.startsWith("/residential") || p === "/apartment" || p === "/non-residential" || p === "/collective-sale" || p === "/land" || p === "/commercial" },
  { label: "내매물", path: "/my-properties", icon: navMy, match: (p: string) => p.startsWith("/my-properties") },
  { label: "커뮤니티", path: "/community", icon: navCommunity, match: (p: string) => p.startsWith("/community") },
  { label: "채팅문의", path: "/chat", icon: navChat, match: (p: string) => p.startsWith("/chat") },
];

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const HIDDEN_PREFIXES = ["/login", "/signup", "/forgot-password", "/reset-password", "/admin", "/share", "/property"];
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
      <ul className="flex items-stretch justify-around px-1 py-2.5">
        {ITEMS.map(({ label, path, icon, match }) => {
          const active = match(location.pathname);
          return (
            <li key={label} className="flex-1">
              <button
                onClick={() => navigate(path)}
                className="w-full flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all"
                aria-current={active ? "page" : undefined}
              >
                <img
                  src={icon}
                  alt={label}
                  className="w-5 h-5 object-contain shrink-0"
                  style={{
                    filter: active
                      ? "drop-shadow(0 0 8px rgba(168,85,247,0.7))"
                      : "drop-shadow(0 0 4px rgba(168,85,247,0.35))",
                    opacity: active ? 1 : 0.9,
                  }}
                />
                <span
                  className="text-[10px] font-bold leading-tight text-white"
                  style={{ opacity: active ? 1 : 0.75 }}
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
