import { useEffect, useState, useMemo } from "react";
import { Phone, MessageCircle, Search, Check, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Inquiry = {
  id: string;
  property_id: string | null;
  property_reg_no: string | null;
  agent_user_id: string | null;
  name: string;
  phone: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
};

type AgentInfo = { user_id: string; name: string; phone: string | null; company: string | null };

const AdminGuestInquiriesPanel = () => {
  const [items, setItems] = useState<Inquiry[]>([]);
  const [agents, setAgents] = useState<Record<string, AgentInfo>>({});
  const [filter, setFilter] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("guest_inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("문의 내역을 불러오지 못했습니다");
      setLoading(false);
      return;
    }
    const list = (data ?? []) as Inquiry[];
    setItems(list);
    const ids = Array.from(new Set(list.map((i) => i.agent_user_id).filter(Boolean))) as string[];
    if (ids.length) {
      const { data: ap } = await supabase
        .from("agent_profiles")
        .select("user_id, name, phone, company")
        .in("user_id", ids);
      const map: Record<string, AgentInfo> = {};
      (ap ?? []).forEach((a: any) => { map[a.user_id] = a; });
      setAgents(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Realtime
  useEffect(() => {
    const ch = supabase
      .channel("admin-inquiries")
      .on("postgres_changes", { event: "*", schema: "public", table: "guest_inquiries" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = items.filter((i) => {
      if (agentFilter !== "all" && (i.agent_user_id ?? "_none") !== agentFilter) return false;
      if (!q) return true;
      return (
        (i.name ?? "").toLowerCase().includes(q) ||
        (i.phone ?? "").includes(q) ||
        (i.message ?? "").toLowerCase().includes(q) ||
        (i.property_reg_no ?? "").includes(q)
      );
    });
    const map = new Map<string, Inquiry[]>();
    filtered.forEach((i) => {
      const key = i.agent_user_id ?? "_none";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(i);
    });
    return Array.from(map.entries());
  }, [items, filter, agentFilter]);

  const markRead = async (id: string, is_read: boolean) => {
    const { error } = await supabase.from("guest_inquiries").update({ is_read }).eq("id", id);
    if (error) return toast.error("업데이트 실패");
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, is_read } : i)));
  };

  const remove = async (id: string) => {
    if (!confirm("이 문의를 삭제할까요?")) return;
    const { error } = await supabase.from("guest_inquiries").delete().eq("id", id);
    if (error) return toast.error("삭제 실패");
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const agentOptions = useMemo(() => {
    const list = Object.values(agents);
    list.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    return list;
  }, [agents]);

  const totalUnread = items.filter((i) => !i.is_read).length;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-white">게스트 문의 내역</h2>
          <p className="text-xs text-white/60 mt-0.5">
            전체 {items.length}건 · 미확인 <span className="text-red-400 font-bold">{totalUnread}</span>건
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-md bg-white/10 text-white border border-white/20"
          >
            <option value="all">담당자 전체</option>
            <option value="_none">담당자 미지정</option>
            {agentOptions.map((a) => (
              <option key={a.user_id} value={a.user_id}>{a.name}{a.company ? ` (${a.company})` : ""}</option>
            ))}
          </select>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50" />
            <input
              type="text"
              placeholder="이름/번호/매물번호"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-xs pl-7 pr-2 py-1.5 rounded-md bg-white/10 text-white border border-white/20 placeholder-white/40"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-white/60 py-10 text-sm">불러오는 중...</div>
      ) : grouped.length === 0 ? (
        <div className="text-center text-white/60 py-10 text-sm">문의 내역이 없습니다</div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([agentId, list]) => {
            const a = agentId !== "_none" ? agents[agentId] : null;
            return (
              <div key={agentId} className="rounded-lg border border-white/10 overflow-hidden">
                <div className="px-4 py-2.5 bg-white/5 flex items-center justify-between">
                  <div className="text-sm font-bold text-white">
                    {a ? (
                      <>{a.name} <span className="text-xs font-normal text-white/60">{a.company ? `· ${a.company}` : ""} {a.phone ? `· ${a.phone}` : ""}</span></>
                    ) : (
                      <span className="text-white/70">담당자 미지정</span>
                    )}
                  </div>
                  <span className="text-xs text-white/60">{list.length}건</span>
                </div>
                <div className="divide-y divide-white/5">
                  {list.map((i) => (
                    <div key={i.id} className={`px-4 py-3 ${!i.is_read ? "bg-blue-500/5" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {!i.is_read && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500 text-white">NEW</span>
                            )}
                            {i.property_reg_no && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-white">NO.{i.property_reg_no}</span>
                            )}
                            <span className="text-sm font-bold text-white">{i.name}</span>
                            <a href={`tel:${i.phone.replace(/[^0-9]/g, "")}`} className="text-xs text-blue-300 hover:underline flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {i.phone}
                            </a>
                          </div>
                          {i.message && (
                            <p className="text-xs text-white/80 mt-1.5 whitespace-pre-wrap flex items-start gap-1">
                              <MessageCircle className="w-3 h-3 mt-0.5 shrink-0 text-white/40" />
                              <span>{i.message}</span>
                            </p>
                          )}
                          <p className="text-[10px] text-white/40 mt-1">{new Date(i.created_at).toLocaleString("ko-KR")}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => markRead(i.id, !i.is_read)}
                            className="p-1.5 rounded hover:bg-white/10 text-white/70"
                            title={i.is_read ? "미확인으로" : "확인 처리"}
                          >
                            <Check className={`w-3.5 h-3.5 ${i.is_read ? "text-green-400" : ""}`} />
                          </button>
                          <button onClick={() => remove(i.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-300" title="삭제">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminGuestInquiriesPanel;
