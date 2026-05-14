import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { GradientBellIcon } from "@/components/icons/GradientIcons";

const AdminNotificationBell = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    const [chats, reports] = await Promise.all([
      supabase.from("chat_conversations").select("unread_for_admin"),
      supabase.from("property_reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    const chatUnread = (chats.data ?? []).reduce((s: number, r: any) => s + (r.unread_for_admin ?? 0), 0);
    const reportPending = reports.count ?? 0;
    setCount(chatUnread + reportPending);
  }, []);

  useEffect(() => {
    refresh();
    const ch = supabase
      .channel("admin-bell")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "property_reports" }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refresh]);

  return (
    <button
      onClick={() => navigate("/admin")}
      className="relative flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-lg transition-colors hover:bg-white/10"
      style={{ color: "rgba(255,255,255,0.85)" }}
      title="관리자 알림"
      aria-label="관리자 알림"
    >
      <GradientBellIcon size={20} />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-destructive text-destructive-foreground">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
};

export default AdminNotificationBell;
