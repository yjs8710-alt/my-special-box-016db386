import { useEffect, useState, useCallback } from "react";
import { Bell } from "lucide-react";
import iconBellNew from "@/assets/icon-bell-new.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  variant?: "desktop" | "mobile";
}

const NotificationBell = ({ variant = "desktop" }: Props) => {
  const navigate = useNavigate();
  const { isAuthorized, user } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user?.userId) { setCount(0); return; }
    const { count: c } = await (supabase.from("notifications") as any)
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.userId)
      .eq("is_read", false);
    setCount(c ?? 0);
  }, [user?.userId]);

  useEffect(() => {
    if (!isAuthorized || !user?.userId) return;
    refresh();
    const ch = supabase
      .channel("user-notifications-bell")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.userId}`,
      }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAuthorized, user?.userId, refresh]);

  const prefetch = useCallback(() => {
    import("@/pages/NotificationsPage").catch(() => {});
  }, []);

  useEffect(() => { if (variant === "mobile") prefetch(); }, [variant, prefetch]);

  if (variant === "mobile") {
    return (
      <button
        onPointerDown={() => navigate(isAuthorized ? "/notifications" : "/login")}
        onTouchStart={prefetch}
        onMouseEnter={prefetch}
        className="relative flex flex-col items-center justify-center w-12 h-11 rounded-md active:opacity-70 transition-opacity"
        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" }}
        aria-label="알림"
        title="알림"
      >
        <img
          src={iconBellNew}
          alt=""
          className="w-7 h-7 object-contain"
          style={{ filter: "drop-shadow(0 0 6px hsl(var(--accent) / 0.7))" }}
        />
        <span className="text-[9px] font-bold text-white leading-tight mt-0.5">알림</span>
        {count > 0 && (
          <span className="absolute top-0.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center bg-destructive text-destructive-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(isAuthorized ? "/notifications" : "/login")}
      className="relative flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors hover:bg-white/10"
      style={{ color: "rgba(255,255,255,0.85)" }}
      title="알림"
      aria-label="알림"
    >
      <Bell className="w-3.5 h-3.5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-destructive text-destructive-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
