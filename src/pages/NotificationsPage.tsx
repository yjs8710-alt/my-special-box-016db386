import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Bell, Check, Trash2, ChevronLeft, AlertCircle, FileText, CheckCircle2, Eye, MessageCircle, Phone, X, User2 } from "lucide-react";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  id: string;
  type: "report" | "proposal" | "transaction" | "view" | "guest_inquiry" | "chat_inquiry" | string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

const TYPE_META: Record<string, { label: string; Icon: any; color: string }> = {
  report:         { label: "신고",       Icon: AlertCircle,  color: "#f97316" },
  proposal:       { label: "제안",       Icon: FileText,     color: "#a78bfa" },
  transaction:    { label: "거래완료",   Icon: CheckCircle2, color: "#22c55e" },
  view:           { label: "조회",       Icon: Eye,          color: "#60a5fa" },
  guest_inquiry:  { label: "매물문의",   Icon: MessageCircle, color: "#e11d48" },
  chat_inquiry:   { label: "채팅문의",   Icon: MessageCircle, color: "#0ea5e9" },
};

type InquiryDetail = {
  id: string;
  name: string;
  phone: string;
  message: string | null;
  created_at: string;
  property_reg_no: string | null;
  property_dong?: string | null;
  property_lot?: string | null;
  user_id?: string | null;
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthorized, user, isLoading } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<InquiryDetail | null>(null);

  const load = useCallback(async () => {
    if (!user?.userId) return;
    setLoading(true);
    const { data } = await (supabase.from("notifications") as any)
      .select("*")
      .eq("user_id", user.userId)
      .order("created_at", { ascending: false })
      .limit(200);
    setItems((data ?? []) as Notification[]);
    setLoading(false);
  }, [user?.userId]);

  useEffect(() => {
    if (!isLoading && !isAuthorized) navigate("/login");
  }, [isLoading, isAuthorized, navigate]);

  useEffect(() => {
    if (!user?.userId) return;
    load();
    const ch = supabase
      .channel("notifications-page")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.userId}`,
      }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user?.userId, load]);

  const openChatFromConversation = useCallback(async (cid: string) => {
    const { data: conv } = await supabase
      .from("chat_conversations")
      .select("id, agent_user_id, property_id, user_name")
      .eq("id", cid)
      .maybeSingle();
    if (!conv) return;
    let propertyTitle: string | undefined;
    if (conv.property_id) {
      const { data: prop } = await supabase
        .from("properties")
        .select("reg_no, dong, lot_number")
        .eq("id", conv.property_id)
        .maybeSingle();
      if (prop) {
        const reg = prop.reg_no ? `[NO.${prop.reg_no}] ` : "";
        const addr = [prop.dong, prop.lot_number].filter(Boolean).join(" ");
        propertyTitle = `${reg}${addr}`.trim() || undefined;
      }
    }
    window.dispatchEvent(new CustomEvent("open-chat-inquiry", {
      detail: {
        conversationId: cid,
        agentUserId: conv.agent_user_id,
        propertyId: conv.property_id,
        propertyTitle,
        agentName: conv.user_name,
      },
    }));
  }, []);

  const openInquiryDetail = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("guest_inquiries")
      .select("id, name, phone, message, created_at, property_reg_no, property_id, user_id" as any)
      .eq("id", id)
      .maybeSingle();
    if (!data) return;
    const d: any = data;
    let dong: string | null = null, lot: string | null = null;
    if (d.property_id) {
      const { data: prop } = await supabase
        .from("properties")
        .select("dong, lot_number")
        .eq("id", d.property_id)
        .maybeSingle();
      dong = prop?.dong ?? null;
      lot = prop?.lot_number ?? null;
    }
    setDetail({
      id: d.id,
      name: d.name,
      phone: d.phone,
      message: d.message,
      created_at: d.created_at,
      property_reg_no: d.property_reg_no,
      property_dong: dong,
      property_lot: lot,
      user_id: d.user_id ?? null,
    });
  }, []);

  const startChatFromInquiry = useCallback(async (inq: InquiryDetail) => {
    const { data: cid, error } = await (supabase as any).rpc("start_chat_from_inquiry", { _inquiry_id: inq.id });
    if (error || !cid) {
      console.error("[start_chat_from_inquiry]", error);
      alert("이 문의는 비회원 게스트 문의입니다.\n채팅 대신 전화로 연락해주세요.");
      return;
    }
    setDetail(null);
    await openChatFromConversation(cid as string);
  }, []);

  // 알림 링크 클릭 시 처리(URL 쿼리)
  useEffect(() => {
    const chat = searchParams.get("chat");
    const inquiry = searchParams.get("inquiry");
    if (chat) {
      openChatFromConversation(chat);
      setSearchParams({}, { replace: true });
    } else if (inquiry) {
      openInquiryDetail(inquiry);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, openChatFromConversation, openInquiryDetail]);

  const markRead = async (id: string) => {
    await (supabase.from("notifications") as any).update({ is_read: true }).eq("id", id);
  };
  const markAllRead = async () => {
    if (!user?.userId) return;
    await (supabase.from("notifications") as any)
      .update({ is_read: true })
      .eq("user_id", user.userId)
      .eq("is_read", false);
  };
  const remove = async (id: string) => {
    await (supabase.from("notifications") as any).delete().eq("id", id);
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read) await markRead(n.id);
    if (!n.link) return;
    // 링크가 외부/다른 경로면 그대로 이동
    if (!n.link.startsWith("/notifications")) {
      navigate(n.link);
      return;
    }
    // /notifications?chat=... 또는 ?inquiry=...
    const qs = n.link.includes("?") ? n.link.slice(n.link.indexOf("?") + 1) : "";
    const params = new URLSearchParams(qs);
    const cid = params.get("chat");
    const iid = params.get("inquiry");
    if (cid) await openChatFromConversation(cid);
    else if (iid) await openInquiryDetail(iid);
  };

  const unread = items.filter(i => !i.is_read).length;

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ background: "hsl(var(--background))" }}>
      <Header />

      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-md hover:bg-muted">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-foreground" />
            <h1 className="text-lg font-bold">알림</h1>
            {unread > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              className="ml-auto text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              모두 읽음
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground text-center py-12">불러오는 중…</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">알림이 없습니다.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.view;
              const Icon = meta.Icon;
              return (
                <li
                  key={n.id}
                  className="flex items-start gap-3 p-3 rounded-xl border bg-card"
                  style={{
                    borderColor: n.is_read ? "hsl(var(--border))" : "hsl(var(--accent) / 0.5)",
                    background: n.is_read ? "hsl(var(--card))" : "hsl(var(--accent) / 0.06)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${meta.color}22`, color: meta.color }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <button
                    className="flex-1 text-left min-w-0"
                    onClick={() => handleClick(n)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${meta.color}22`, color: meta.color }}>
                        {meta.label}
                      </span>
                      {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-destructive" />}
                    </div>
                    <p className="text-sm font-semibold mt-1 truncate">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.created_at).toLocaleString("ko-KR")}
                    </p>
                  </button>
                  <button
                    onClick={() => remove(n.id)}
                    className="p-1 text-muted-foreground hover:text-destructive flex-shrink-0"
                    aria-label="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 게스트 매물 문의 상세 */}
      {detail && (
        <div className="fixed inset-0 z-[10200] flex items-end md:items-center justify-center p-3 md:p-6" style={{ background: "rgba(0,0,0,0.55)" }} onClick={() => setDetail(null)}>
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ background: "hsl(var(--header-bg))" }}>
              <div className="flex items-center gap-2 text-white">
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm font-bold">매물 문의 상세</span>
              </div>
              <button onClick={() => setDetail(null)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {(detail.property_reg_no || detail.property_dong) && (
                <div className="text-[12px] bg-muted rounded-lg px-3 py-2 text-foreground">
                  {detail.property_reg_no ? <span className="font-bold mr-2">[NO.{detail.property_reg_no}]</span> : null}
                  <span>{[detail.property_dong, detail.property_lot].filter(Boolean).join(" ")}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <User2 className="w-4 h-4 text-muted-foreground" />
                <span className="font-semibold">{detail.name}</span>
              </div>
              <a
                href={`tel:${detail.phone.replace(/[^0-9]/g, "")}`}
                className="flex items-center gap-2 text-sm font-bold text-primary"
              >
                <Phone className="w-4 h-4" /> {detail.phone}
              </a>
              <div className="rounded-lg border p-3 text-sm whitespace-pre-wrap bg-muted/40">
                {detail.message || "문의 메시지 없음"}
              </div>
              <p className="text-[11px] text-muted-foreground text-right">
                {new Date(detail.created_at).toLocaleString("ko-KR")}
              </p>
              <a
                href={`tel:${detail.phone.replace(/[^0-9]/g, "")}`}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm"
              >
                <Phone className="w-4 h-4" /> 바로 전화 걸기
              </a>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
};

export default NotificationsPage;
