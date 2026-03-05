import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, MessageSquare,
  LogOut, Home, CheckCircle2, XCircle, Clock,
  Eye, Trash2, Pin, ShieldCheck, TrendingUp,
  ChevronDown, ChevronUp, Search, RefreshCw, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAP_PROPERTIES } from "@/data/mapProperties";
import { supabase } from "@/lib/supabase";

// ─── Types ───────────────────────────────────────────────────────────────────
type AgentProfile = {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  agency_name: string;
  license_number: string;
  business_number: string;
  agency_address: string;
  agree_marketing: boolean;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  // joined from auth.users via email lookup
  email?: string;
};

const MOCK_POSTS = [
  { id: 1, category: "notice", categoryLabel: "공지사항", title: "집다 플랫폼 서비스 오픈 안내", author: "관리자", date: "2026-03-01", views: 1240, reported: false, pinned: true },
  { id: 2, category: "info", categoryLabel: "정보공유", title: "2025년 상가 임대 시장 동향 분석", author: "김중개사", date: "2026-02-28", views: 532, reported: false, pinned: false },
  { id: 3, category: "qna", categoryLabel: "Q&A", title: "공동중개 수수료 정산 기준이 궁금합니다", author: "이공인", date: "2026-02-27", views: 311, reported: true, pinned: false },
  { id: 4, category: "free", categoryLabel: "자유게시판", title: "처음 가입했습니다. 잘 부탁드립니다!", author: "박부동산", date: "2026-02-26", views: 198, reported: false, pinned: false },
  { id: 5, category: "info", categoryLabel: "정보공유", title: "LH 전세대출 조건 변경 내용 정리", author: "최공인", date: "2026-02-24", views: 688, reported: false, pinned: false },
  { id: 6, category: "free", categoryLabel: "자유게시판", title: "허위 매물 신고합니다", author: "정중개", date: "2026-02-23", views: 421, reported: true, pinned: false },
];

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  pending:  { label: "대기중", color: "hsl(var(--chart-4))", bg: "hsl(var(--chart-4) / 0.12)" },
  approved: { label: "승인됨", color: "hsl(var(--chart-2))", bg: "hsl(var(--chart-2) / 0.12)" },
  rejected: { label: "거절됨", color: "hsl(var(--destructive))", bg: "hsl(var(--destructive) / 0.10)" },
};

// ─── Sidebar nav items ───────────────────────────────────────────────────────
const NAV = [
  { key: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { key: "members",   label: "회원 관리", icon: Users },
  { key: "properties",label: "매물 관리", icon: Building2 },
  { key: "community", label: "커뮤니티 관리", icon: MessageSquare },
];

// ─── Main Component ──────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [members, setMembers] = useState<AgentProfile[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [properties] = useState(MAP_PROPERTIES);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [propertySearch, setPropertySearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") !== "true") {
      navigate("/admin/login");
    }
  }, [navigate]);

  // ─── agent_profiles 불러오기 ─────────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
    setMembersError("");
    const { data, error } = await supabase
      .from("agent_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setMembersError("데이터를 불러오는 중 오류가 발생했습니다: " + error.message);
      setMembersLoading(false);
      return;
    }
    setMembers(data as AgentProfile[]);
    setMembersLoading(false);
  }, []);

  useEffect(() => {
    if (sessionStorage.getItem("admin_auth") === "true") {
      fetchMembers();
    }
  }, [fetchMembers]);

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    navigate("/admin/login");
  };

  // ─── 승인/거절 처리 ──────────────────────────────────────────────────────
  const updateMemberStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("agent_profiles")
      .update({ status })
      .eq("id", id);
    setUpdatingId(null);

    if (error) {
      alert("상태 변경 중 오류가 발생했습니다: " + error.message);
      return;
    }
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
  };

  const deletePost = (id: number) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const togglePin = (id: number) => {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, pinned: !p.pinned } : p));
  };

  // Stats
  const totalMembers  = members.length;
  const pendingCount  = members.filter((m) => m.status === "pending").length;
  const approvedCount = members.filter((m) => m.status === "approved").length;
  const totalProperties = properties.length;
  const totalPosts = posts.length;
  const reportedPosts = posts.filter((p) => p.reported).length;

  const filteredMembers = members.filter((m) => {
    const matchFilter = memberFilter === "all" || m.status === memberFilter;
    const matchSearch = !memberSearch ||
      m.name.includes(memberSearch) ||
      (m.email ?? "").includes(memberSearch) ||
      m.agency_name.includes(memberSearch);
    return matchFilter && matchSearch;
  });

  const filteredProperties = properties.filter((p) =>
    !propertySearch ||
    p.title.includes(propertySearch) ||
    p.address.includes(propertySearch) ||
    p.agentName.includes(propertySearch)
  );

  const filteredPosts = posts.filter((p) =>
    !postSearch || p.title.includes(postSearch) || p.author.includes(postSearch)
  );

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(var(--background))" }}>
      {/* ── Sidebar ── */}
      <aside
        className="w-56 shrink-0 flex flex-col border-r sticky top-0 h-screen overflow-y-auto"
        style={{ background: "hsl(var(--header-bg))", borderColor: "hsl(var(--header-border))" }}
      >
        {/* Logo */}
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "hsl(var(--header-border))" }}>
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "hsl(var(--accent))" }}>
            <Home className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white leading-none">집다</div>
            <div className="text-[10px] text-white/40 leading-none mt-0.5">관리자</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left w-full"
              style={
                tab === key
                  ? { background: "hsl(var(--accent) / 0.18)", color: "hsl(var(--accent))" }
                  : { color: "rgba(255,255,255,0.65)" }
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {key === "members" && pendingCount > 0 && (
                <span
                  className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: "hsl(var(--destructive))" }}
                >
                  {pendingCount}
                </span>
              )}
              {key === "community" && reportedPosts > 0 && (
                <span
                  className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: "hsl(var(--destructive))" }}
                >
                  신고 {reportedPosts}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t" style={{ borderColor: "hsl(var(--header-border))" }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full transition-colors"
            style={{ color: "rgba(255,255,255,0.50)" }}
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Header bar */}
        <div
          className="sticky top-0 z-10 border-b px-6 py-3 flex items-center justify-between"
          style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            <h1 className="text-sm font-bold text-foreground">
              {NAV.find((n) => n.key === tab)?.label ?? "관리자"}
            </h1>
          </div>
          <span className="text-xs text-muted-foreground">관리자 계정</span>
        </div>

        <div className="p-6">

          {/* ── 대시보드 ── */}
          {tab === "dashboard" && (
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-extrabold text-foreground mb-1">안녕하세요, 관리자님 👋</h2>
                <p className="text-sm text-muted-foreground">집다 플랫폼 현황을 확인하세요.</p>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "전체 회원", value: totalMembers, sub: `승인 대기 ${pendingCount}건`, icon: Users, color: "hsl(var(--primary))" },
                  { label: "승인된 회원", value: approvedCount, sub: "활성 중개사", icon: CheckCircle2, color: "hsl(var(--chart-2))" },
                  { label: "등록 매물", value: totalProperties, sub: "총 등록 매물 수", icon: Building2, color: "hsl(var(--accent))" },
                  { label: "커뮤니티 게시글", value: totalPosts, sub: `신고 게시글 ${reportedPosts}건`, icon: MessageSquare, color: "hsl(var(--chart-4))" },
                ].map(({ label, value, sub, icon: Icon, color }) => (
                  <div key={label} className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{label}</span>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-foreground">{value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent pending */}
              <div className="bg-card border border-border rounded-xl">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: "hsl(var(--chart-4))" }} />
                    승인 대기 회원
                  </h3>
                  <button
                    className="text-xs font-medium"
                    style={{ color: "hsl(var(--primary))" }}
                    onClick={() => setTab("members")}
                  >
                    전체 보기 →
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {members.filter((m) => m.status === "pending").slice(0, 5).map((m) => (
                    <div key={m.id} className="px-5 py-3 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{m.name}</span>
                          <span className="text-xs text-muted-foreground">{m.agency_name}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{m.email ?? m.phone} · 가입 {m.created_at.slice(0, 10)}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => updateMemberStatus(m.id, "approved")}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold transition-colors"
                          style={{ background: "hsl(var(--chart-2) / 0.12)", color: "hsl(var(--chart-2))" }}
                        >
                          <CheckCircle2 className="w-3 h-3" /> 승인
                        </button>
                        <button
                          onClick={() => updateMemberStatus(m.id, "rejected")}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold transition-colors"
                          style={{ background: "hsl(var(--destructive) / 0.10)", color: "hsl(var(--destructive))" }}
                        >
                          <XCircle className="w-3 h-3" /> 거절
                        </button>
                      </div>
                    </div>
                  ))}
                  {members.filter((m) => m.status === "pending").length === 0 && (
                    <div className="px-5 py-8 text-center text-sm text-muted-foreground">대기 중인 회원이 없습니다.</div>
                  )}
                </div>
              </div>

              {/* Trending */}
              <div className="bg-card border border-border rounded-xl">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: "hsl(var(--accent))" }} />
                  <h3 className="text-sm font-bold text-foreground">인기 매물 TOP 5</h3>
                </div>
                <div className="divide-y divide-border">
                  {[...properties].sort((a, b) => b.views - a.views).slice(0, 5).map((p, i) => (
                    <div key={p.id} className="px-5 py-3 flex items-center gap-4">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={
                          i === 0 ? { background: "hsl(var(--accent))", color: "#fff" }
                          : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                        }
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{p.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.address}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Eye className="w-3 h-3" />
                        {p.views.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 회원 관리 ── */}
          {tab === "members" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">회원 관리</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">총 {members.length}명 · 대기 {pendingCount}명</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {["all", "pending", "approved", "rejected"].map((f) => (
                    <button
                      key={f}
                      onClick={() => setMemberFilter(f)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                      style={
                        memberFilter === f
                          ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
                          : { background: "transparent", color: "hsl(var(--muted-foreground))", borderColor: "hsl(var(--border))" }
                      }
                    >
                      {f === "all" ? "전체" : f === "pending" ? "대기중" : f === "approved" ? "승인됨" : "거절됨"}
                    </button>
                  ))}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input
                      placeholder="이름·이메일·사무소 검색"
                      className="pl-7 h-8 text-xs w-48"
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Table header */}
                <div className="hidden md:grid grid-cols-[1fr_1fr_130px_100px_100px] text-xs font-semibold text-muted-foreground bg-muted/40 px-5 py-3 border-b border-border">
                  <span>이름 / 사무소</span>
                  <span>이메일 / 전화</span>
                  <span>등록번호</span>
                  <span className="text-center">상태</span>
                  <span className="text-center">액션</span>
                </div>
                {filteredMembers.length === 0 && (
                  <div className="py-16 text-center text-sm text-muted-foreground">해당 조건의 회원이 없습니다.</div>
                )}
                {filteredMembers.map((m, i) => (
                  <div key={m.id} className={`border-b border-border last:border-0 ${expandedMember === m.id ? "bg-muted/20" : ""}`}>
                    <div
                      className="grid md:grid-cols-[1fr_1fr_130px_100px_100px] items-center px-5 py-3.5 cursor-pointer hover:bg-muted/20 transition-colors"
                      onClick={() => setExpandedMember(expandedMember === m.id ? null : m.id)}
                    >
                      <div>
                        <div className="text-sm font-semibold text-foreground">{m.name}</div>
                        <div className="text-xs text-muted-foreground">{m.agency_name}</div>
                      </div>
                      <div className="hidden md:block">
                        <div className="text-xs text-foreground">{m.email ?? "-"}</div>
                        <div className="text-xs text-muted-foreground">{m.phone}</div>
                      </div>
                      <div className="hidden md:block">
                        <div className="text-xs text-foreground truncate">{m.license_number}</div>
                        <div className="text-xs text-muted-foreground">{m.business_number}</div>
                      </div>
                      <div className="hidden md:flex justify-center">
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: STATUS_LABEL[m.status].bg, color: STATUS_LABEL[m.status].color }}
                        >
                          {STATUS_LABEL[m.status].label}
                        </span>
                      </div>
                      <div className="hidden md:flex justify-center items-center gap-1.5">
                        {m.status !== "approved" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateMemberStatus(m.id, "approved"); }}
                            className="p-1.5 rounded-md transition-colors"
                            title="승인"
                            style={{ color: "hsl(var(--chart-2))" }}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {m.status !== "rejected" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); updateMemberStatus(m.id, "rejected"); }}
                            className="p-1.5 rounded-md transition-colors"
                            title="거절"
                            style={{ color: "hsl(var(--destructive))" }}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {expandedMember === m.id
                          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          : <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        }
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {expandedMember === m.id && (
                      <div
                        className="mx-5 mb-4 rounded-xl p-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs border"
                        style={{ background: "hsl(var(--muted) / 0.5)", borderColor: "hsl(var(--border))" }}
                      >
                        {[
                          { label: "사무소명", value: m.agency_name },
                          { label: "공인중개사 등록번호", value: m.license_number },
                          { label: "사업자 등록번호", value: m.business_number },
                          { label: "사무소 주소", value: m.agency_address },
                          { label: "이메일", value: m.email ?? "-" },
                          { label: "전화번호", value: m.phone },
                          { label: "가입일", value: m.created_at.slice(0, 10) },
                          { label: "상태", value: STATUS_LABEL[m.status].label },
                        ].map(({ label, value }) => (
                          <div key={label}>
                            <div className="text-muted-foreground mb-0.5">{label}</div>
                            <div className="font-medium text-foreground">{value}</div>
                          </div>
                        ))}
                        <div className="col-span-2 md:col-span-3 flex gap-2 mt-2 pt-2 border-t border-border">
                          {m.status !== "approved" && (
                            <button
                              onClick={() => updateMemberStatus(m.id, "approved")}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs"
                              style={{ background: "hsl(var(--chart-2) / 0.15)", color: "hsl(var(--chart-2))" }}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> 승인하기
                            </button>
                          )}
                          {m.status !== "rejected" && (
                            <button
                              onClick={() => updateMemberStatus(m.id, "rejected")}
                              className="flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs"
                              style={{ background: "hsl(var(--destructive) / 0.10)", color: "hsl(var(--destructive))" }}
                            >
                              <XCircle className="w-3.5 h-3.5" /> 거절하기
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 매물 관리 ── */}
          {tab === "properties" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">매물 관리</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">총 {properties.length}개 매물</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    placeholder="매물명·주소·중개사 검색"
                    className="pl-7 h-8 text-xs w-56"
                    value={propertySearch}
                    onChange={(e) => setPropertySearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="hidden md:grid grid-cols-[2fr_1fr_80px_80px_100px_100px] text-xs font-semibold text-muted-foreground bg-muted/40 px-5 py-3 border-b border-border">
                  <span>매물명 / 주소</span>
                  <span>중개사</span>
                  <span className="text-center">유형</span>
                  <span className="text-center">조회수</span>
                  <span className="text-center">보증금</span>
                  <span className="text-center">월세</span>
                </div>
                {filteredProperties.length === 0 && (
                  <div className="py-16 text-center text-sm text-muted-foreground">해당 매물이 없습니다.</div>
                )}
                {filteredProperties.map((p) => (
                  <div key={p.id} className="grid md:grid-cols-[2fr_1fr_80px_80px_100px_100px] items-center px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">{p.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{p.address}</div>
                    </div>
                    <div className="hidden md:block text-xs text-muted-foreground truncate">{p.agentName}</div>
                    <div className="hidden md:flex justify-center">
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "hsl(var(--accent) / 0.12)", color: "hsl(var(--accent))" }}
                      >
                        {p.type}
                      </span>
                    </div>
                    <div className="hidden md:flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />{p.views.toLocaleString()}
                    </div>
                    <div className="hidden md:block text-xs text-center text-foreground">{p.deposit}</div>
                    <div className="hidden md:block text-xs text-center text-foreground">{p.monthly}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 커뮤니티 관리 ── */}
          {tab === "community" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">커뮤니티 관리</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    총 {posts.length}개 게시글 · 신고 {posts.filter((p) => p.reported).length}건
                  </p>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    placeholder="제목·작성자 검색"
                    className="pl-7 h-8 text-xs w-48"
                    value={postSearch}
                    onChange={(e) => setPostSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="hidden md:grid grid-cols-[80px_1fr_80px_60px_60px_100px] text-xs font-semibold text-muted-foreground bg-muted/40 px-5 py-3 border-b border-border">
                  <span>분류</span>
                  <span>제목</span>
                  <span className="text-center">작성자</span>
                  <span className="text-center">조회</span>
                  <span className="text-center">신고</span>
                  <span className="text-center">관리</span>
                </div>
                {filteredPosts.length === 0 && (
                  <div className="py-16 text-center text-sm text-muted-foreground">게시글이 없습니다.</div>
                )}
                {filteredPosts.map((p) => (
                  <div
                    key={p.id}
                    className={`grid md:grid-cols-[80px_1fr_80px_60px_60px_100px] items-center px-5 py-3.5 border-b border-border last:border-0 transition-colors ${p.reported ? "bg-destructive/[0.03]" : "hover:bg-muted/20"}`}
                  >
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit"
                      style={{
                        background: p.category === "notice" ? "hsl(218 88% 22% / 0.12)" : "hsl(var(--muted))",
                        color: p.category === "notice" ? "hsl(218 88% 40%)" : "hsl(var(--muted-foreground))"
                      }}
                    >
                      {p.categoryLabel}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      {p.pinned && <Pin className="w-3 h-3 shrink-0 text-destructive" />}
                      <span className="text-sm font-medium text-foreground truncate">{p.title}</span>
                      {p.reported && (
                        <span
                          className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                          style={{ background: "hsl(var(--destructive) / 0.12)", color: "hsl(var(--destructive))" }}
                        >
                          신고
                        </span>
                      )}
                    </div>
                    <span className="hidden md:block text-xs text-muted-foreground text-center">{p.author}</span>
                    <span className="hidden md:flex items-center justify-center gap-0.5 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />{p.views}
                    </span>
                    <div className="hidden md:flex justify-center">
                      {p.reported
                        ? <span className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--destructive))" }} />
                        : <span className="text-xs text-muted-foreground">-</span>
                      }
                    </div>
                    <div className="hidden md:flex items-center justify-center gap-2">
                      <button
                        onClick={() => togglePin(p.id)}
                        className="p-1.5 rounded transition-colors"
                        title={p.pinned ? "고정 해제" : "공지 고정"}
                        style={{ color: p.pinned ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))" }}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deletePost(p.id)}
                        className="p-1.5 rounded transition-colors"
                        title="삭제"
                        style={{ color: "hsl(var(--destructive))" }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
