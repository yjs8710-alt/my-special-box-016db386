import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

type Msg = {
  id: string;
  sender_role: "user" | "admin";
  content: string;
  created_at: string;
};

const ChatInquiryWidget = () => {
  const { isAuthorized, user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hide for admin (admin uses dashboard chat)
  if (user?.isAdmin) return null;

  const ensureConversation = useCallback(async () => {
    if (!user) return null;
    const { data: existing } = await supabase
      .from("chat_conversations")
      .select("id, unread_for_user")
      .eq("user_id", user.userId)
      .maybeSingle();
    if (existing) {
      setConversationId(existing.id);
      setUnread(existing.unread_for_user ?? 0);
      return existing.id;
    }
    // fetch agent name
    const { data: prof } = await supabase
      .from("agent_profiles")
      .select("name, agency_name")
      .eq("user_id", user.userId)
      .maybeSingle();
    const name = prof ? `${prof.name}${prof.agency_name ? ` (${prof.agency_name})` : ""}` : "사용자";
    const { data: created, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: user.userId, user_name: name })
      .select("id")
      .single();
    if (error) return null;
    setConversationId(created.id);
    return created.id;
  }, [user]);

  // Load conversation + unread when authorized
  useEffect(() => {
    if (!isAuthorized || !user) return;
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("id, unread_for_user")
        .eq("user_id", user.userId)
        .maybeSingle();
      if (!mounted) return;
      if (data) {
        setConversationId(data.id);
        setUnread(data.unread_for_user ?? 0);
      }
    })();
    return () => { mounted = false; };
  }, [isAuthorized, user]);

  // Realtime subscription
  useEffect(() => {
    if (!conversationId) return;
    const ch = supabase
      .channel(`chat-user-${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const m = payload.new as Msg;
        setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
        if (m.sender_role === "admin" && !open) setUnread((u) => u + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, open]);

  // Load messages when opening
  useEffect(() => {
    if (!open) return;
    (async () => {
      let cid = conversationId;
      if (!cid) cid = await ensureConversation();
      if (!cid) return;
      const { data } = await supabase
        .from("chat_messages")
        .select("id, sender_role, content, created_at")
        .eq("conversation_id", cid)
        .order("created_at", { ascending: true });
      setMessages((data ?? []) as Msg[]);
      // mark read
      await supabase.from("chat_conversations").update({ unread_for_user: 0 }).eq("id", cid);
      setUnread(0);
    })();
  }, [open, conversationId, ensureConversation]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || !user || sending) return;
    setSending(true);
    let cid = conversationId;
    if (!cid) cid = await ensureConversation();
    if (!cid) { setSending(false); return; }
    setInput("");
    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: cid,
      sender_id: user.userId,
      sender_role: "user",
      content: text,
    });
    if (!error) {
      await supabase.from("chat_conversations").update({
        last_message: text,
        last_message_at: new Date().toISOString(),
        unread_for_admin: (await supabase.from("chat_conversations").select("unread_for_admin").eq("id", cid).single()).data?.unread_for_admin
          ? undefined : 1,
      }).eq("id", cid);
      // Simpler: increment via RPC-less approach
      await supabase.rpc as never; // noop placeholder
    }
    setSending(false);
  };

  const handleClick = () => {
    if (!isAuthorized) {
      navigate("/login");
      return;
    }
    setOpen((v) => !v);
  };

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={handleClick}
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[1100] w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform"
        style={{ background: "hsl(var(--accent))" }}
        aria-label="채팅 문의"
      >
        <MessageCircle className="w-6 h-6" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center bg-destructive text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Top header button (also accessible from header — hint) */}
      {open && (
        <div
          className="fixed z-[1150] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden
            inset-x-3 bottom-20 top-16
            md:inset-auto md:bottom-24 md:right-6 md:w-[380px] md:h-[520px] md:top-auto"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border" style={{ background: "hsl(var(--header-bg))" }}>
            <div className="flex items-center gap-2 text-white">
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm font-bold">관리자 채팅 문의</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/20">
            {messages.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-8">
                관리자에게 문의 내용을 남겨주세요.<br />최대한 빠르게 답변드리겠습니다.
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender_role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                    m.sender_role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-3 border-t border-border">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="메시지를 입력하세요"
              className="flex-1 h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="h-9 w-9 rounded-lg flex items-center justify-center text-white disabled:opacity-50"
              style={{ background: "hsl(var(--accent))" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatInquiryWidget;
