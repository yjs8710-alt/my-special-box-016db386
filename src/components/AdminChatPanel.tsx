import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Send, MessageCircle, Building2, ExternalLink, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Conv = {
  id: string;
  user_id: string;
  user_name: string;
  last_message: string;
  last_message_at: string;
  unread_for_admin: number;
  property_id?: string | null;
  agent_user_id?: string | null;
};

type PropInfo = { id: string; address: string | null; building_name: string | null; unit_number: string | null; reg_no: string | null };

type Msg = {
  id: string;
  sender_role: "user" | "admin" | "agent";
  content: string;
  created_at: string;
};


const AdminChatPanel = ({ adminUserId }: { adminUserId: string }) => {
  const [conversations, setConversations] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("chat_conversations")
      .select("id, user_id, user_name, last_message, last_message_at, unread_for_admin")
      .order("last_message_at", { ascending: false });
    setConversations((data ?? []) as Conv[]);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Realtime: any new message or conversation update refreshes list
  useEffect(() => {
    const ch = supabase
      .channel("admin-chat-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => {
        loadConversations();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as Msg & { conversation_id: string };
        if (activeId && m.conversation_id === activeId) {
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadConversations, activeId]);

  // Load messages on conversation select
  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("id, sender_role, content, created_at")
        .eq("conversation_id", activeId)
        .order("created_at", { ascending: true });
      setMessages((data ?? []) as Msg[]);
      await supabase.from("chat_conversations").update({ unread_for_admin: 0 }).eq("id", activeId);
    })();
  }, [activeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    setInput("");
    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: activeId,
      sender_id: adminUserId,
      sender_role: "admin",
      content: text,
    });
    if (!error) {
      const { data: cur } = await supabase
        .from("chat_conversations").select("unread_for_user").eq("id", activeId).single();
      await supabase.from("chat_conversations").update({
        last_message: text,
        last_message_at: new Date().toISOString(),
        unread_for_user: (cur?.unread_for_user ?? 0) + 1,
      }).eq("id", activeId);
    }
    setSending(false);
  };

  const active = conversations.find((c) => c.id === activeId);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-extrabold text-foreground">채팅 문의</h2>
        <p className="text-xs text-muted-foreground mt-0.5">사용자가 보낸 1:1 문의를 확인하고 답장하세요.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[480px]">
        {/* List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-border text-xs font-bold text-muted-foreground">
            대화 ({conversations.length})
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 && (
              <div className="text-center text-xs text-muted-foreground py-8">문의가 없습니다.</div>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`w-full text-left px-3 py-3 border-b border-border last:border-0 transition-colors ${
                  activeId === c.id ? "bg-muted/50" : "hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-foreground truncate">{c.user_name || "사용자"}</span>
                  {c.unread_for_admin > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-destructive-foreground bg-destructive shrink-0">
                      {c.unread_for_admin}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">{c.last_message || "(메시지 없음)"}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Conversation */}
        <div className="bg-card border border-border rounded-xl flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground gap-2">
              <MessageCircle className="w-4 h-4" /> 대화를 선택하세요
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border">
                <div className="text-sm font-bold text-foreground">{active.user_name}</div>
              </div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/10">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender_role === "admin" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                      m.sender_role === "admin"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-card border border-border rounded-bl-sm"
                    }`}>
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
                  placeholder="답장 입력"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatPanel;
