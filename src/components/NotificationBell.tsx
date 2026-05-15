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
      .channel(`user-notifications-bell-${variant}-${user.userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.userId}`,
      }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isAuthorized, user?.userId, refresh]);

  if (variant === "mobile") {
    return (
      <button
        onClick={() => navigate(isAuthorized ? "/notifications" : "/login")}
        className="relative flex items-center justify-center px-1"
        aria-label="알림"
        title="알림"
      >
        <img
          src={iconBellNew}
          alt=""
          className="object-contain"
          style={{ width: 88, height: 88, filter: "drop-shadow(0 0 6px hsl(var(--accent) / 0.7))" }}
        />
        {count > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center bg-destructive text-destructive-foreground">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate(isAuthorized ? "/notifications" : "/login")}
      className="relative flex items-center justify-center px-1.5 py-1 rounded-lg transition-colors hover:bg-white/10"
      title="알림"
      aria-label="알림"
    >
      <img
        src={iconBellNew}
        alt=""
        className="w-8 h-8 object-contain"
        style={{ filter: "drop-shadow(0 0 6px hsl(var(--accent) / 0.6))" }}
      />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-destructive text-destructive-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
};

export default NotificationBell;
