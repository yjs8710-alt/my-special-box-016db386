import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, MessageSquare,
  LogOut, Home, CheckCircle2, XCircle, Clock,
  Eye, Trash2, Pin, ShieldCheck, TrendingUp,
  ChevronDown, ChevronUp, Search, RefreshCw, AlertCircle,
  Plus, Pencil, EyeOff, Phone, MapPin, X, Save, Copy,
  ImagePlus, Loader2, ShieldAlert, UserMinus, UserCheck, Ban, Unlock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAP_PROPERTIES } from "@/data/mapProperties";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────
type MemberType = "대표중개사" | "소속중개사" | "중개보조원";

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
  email?: string;
  role?: "admin" | "user";        // user_roles에서 조회
  member_type?: MemberType;       // 대표중개사 / 소속중개사 / 중개보조원
  parent_user_id?: string | null; // 대표중개사 user_id
  is_active?: boolean;            // 사이트 접속 가능 여부
};

type DBProperty = {
  id: string;
  title: string;
  building_name?: string;
  address: string;
  dong: string;
  lot_number: string;
  district?: string;
  type: string;
  room_type?: string;
  unit_number?: string;
  area: string;
  floor: string;
  deposit: string;
  monthly: string;
  manage_fee: string;
  parking: string;
  elevator: boolean;
  available_from: string;
  total_floors: string;
  build_year: string;
  description: string;
  building_memo?: string;
  room_memo?: string;
  note?: string;
  vacate_date?: string;
  building_password?: string;
  room_password?: string;
  options: string[];
  images: string[];   // ← 추가
  views: number;
  lat: number;
  lng: number;
  is_new: boolean;
  is_hot: boolean;
  status: "active" | "hidden";
  registered_date: string;
  checked_date?: string;
  agent_name: string;
  created_at: string;
};

type CheongJuContact = {
  id: string;
  district: string;
  dong: string;
  phone: string;
  contact_owner?: string;
  contact_manager?: string;
  memo?: string;
};

const EMPTY_PROPERTY: Omit<DBProperty, "id" | "created_at"> = {
  title: "", building_name: "", address: "", dong: "", lot_number: "", district: "", type: "원룸",
  room_type: "", unit_number: "", area: "", floor: "", deposit: "", monthly: "",
  manage_fee: "", parking: "", elevator: false, available_from: "", total_floors: "",
  build_year: "", description: "", building_memo: "", room_memo: "", note: "",
  vacate_date: "", building_password: "", room_password: "", options: [], images: [],
  views: 0, lat: 0, lng: 0, is_new: false, is_hot: false, status: "active",
  registered_date: new Date().toISOString().slice(0, 10), checked_date: "",
  agent_name: "",
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

const NAV = [
  { key: "dashboard",  label: "대시보드",    icon: LayoutDashboard },
  { key: "members",    label: "회원 관리",    icon: Users },
  { key: "properties", label: "매물 관리",    icon: Building2 },
  { key: "contacts",   label: "청주 연락처",  icon: Phone },
  { key: "community",  label: "커뮤니티 관리", icon: MessageSquare },
];

const PROPERTY_TYPE_GROUPS: { group: string; types: string[] }[] = [
  {
    group: "주거형 임대",
    types: ["원룸", "투베이", "투룸", "쓰리룸", "주인세대", "아파트", "오피스텔", "빌라", "고시원"],
  },
  {
    group: "상가 임대",
    types: ["상가", "식당·카페", "사무실", "공장·창고", "병원·학원"],
  },
  {
    group: "주거형 외 임대·매매",
    types: ["상가임대", "기타임대", "원룸건물매매", "주택매매", "상가주택매매", "상가건물매매", "구분상가매매", "창고/공장매매", "숙박/팬션매매"],
  },
  {
    group: "토지",
    types: ["토지"],
  },
];
const ALL_PROPERTY_TYPES = PROPERTY_TYPE_GROUPS.flatMap((g) => g.types);
const CHEONGJU_DISTRICTS = ["서원구", "흥덕구", "상당구", "청원구"];

// ─── PropertyFormModal ───────────────────────────────────────────────────────
const PropertyFormModal = ({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<DBProperty> | null;
  onClose: () => void;
  onSave: (data: Omit<DBProperty, "id" | "created_at">) => Promise<void>;
}) => {
  const [form, setForm] = useState<Omit<DBProperty, "id" | "created_at">>({
    ...EMPTY_PROPERTY,
    ...(initial ?? {}),
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  // ── 이미지 업로드 ──────────────────────────────────────────────────────────
  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `properties/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from("property-images")
        .upload(path, file, { upsert: false });
      if (error) { alert("이미지 업로드 실패: " + error.message); continue; }
      const { data: urlData } = supabase.storage
        .from("property-images")
        .getPublicUrl(path);
      if (urlData?.publicUrl) newUrls.push(urlData.publicUrl);
    }
    if (newUrls.length > 0) {
      setForm((f) => ({ ...f, images: [...(f.images ?? []), ...newUrls] }));
    }
    setUploading(false);
  };

  const removeImage = (url: string) => {
    setForm((f) => ({ ...f, images: (f.images ?? []).filter((u) => u !== url) }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      alert("매물명을 입력해주세요.");
      return;
    }
    if (!form.address.trim()) {
      alert("주소를 입력해주세요.");
      return;
    }
    if (!form.type) {
      alert("유형을 선택해주세요.");
      return;
    }
    setSaving(true);
    try {
      await onSave(form);
    } catch (e) {
      console.error("매물 저장 오류:", e);
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: keyof typeof form; label: string; type?: string }[] = [
    { key: "title", label: "매물명" },
    { key: "building_name", label: "건물명" },
    { key: "address", label: "도로명 주소" },
    { key: "dong", label: "동 (洞)" },
    { key: "lot_number", label: "번지수 (지번)" },
    { key: "district", label: "구 (청주시)" },
    { key: "unit_number", label: "호수" },
    { key: "floor", label: "층수" },
    { key: "total_floors", label: "전체 층수" },
    { key: "area", label: "면적" },
    { key: "deposit", label: "보증금" },
    { key: "monthly", label: "월세" },
    { key: "manage_fee", label: "관리비" },
    { key: "parking", label: "주차" },
    { key: "available_from", label: "입주 가능일" },
    { key: "build_year", label: "건축연도" },
    { key: "agent_name", label: "중개사" },
    { key: "building_password", label: "건물 비번" },
    { key: "room_password", label: "방 비번" },
    { key: "vacate_date", label: "퇴거일" },
    { key: "lat", label: "위도", type: "number" },
    { key: "lng", label: "경도", type: "number" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 z-10" style={{ background: "hsl(var(--card))" }}>
          <h3 className="text-base font-bold text-foreground">
            {initial ? "매물 수정" : "매물 등록"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {/* 유형 선택 - 카테고리별 그룹 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">유형 *</label>
            {PROPERTY_TYPE_GROUPS.map(({ group, types }) => (
              <div key={group} className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold tracking-wide uppercase" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {group}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {types.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => set("type", t)}
                      className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                      style={
                        form.type === t
                          ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
                          : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 필드 그리드 */}
          <div className="grid grid-cols-2 gap-3">
            {fields.map(({ key, label, type }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">{label}</label>
                {key === "district" ? (
                  <select
                    value={form[key] as string ?? ""}
                    onChange={(e) => set(key, e.target.value)}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none"
                  >
                    <option value="">선택</option>
                    {CHEONGJU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    <option value="기타">기타</option>
                  </select>
                ) : (
                  <Input
                    type={type ?? "text"}
                    value={String(form[key] ?? "")}
                    onChange={(e) => set(key, type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                    className="h-9 text-sm"
                  />
                )}
              </div>
            ))}
          </div>

          {/* 설명 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">설명</label>
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none resize-none text-foreground"
            />
          </div>

          {/* 옵션 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">옵션 (쉼표로 구분)</label>
            <Input
              value={form.options.join(", ")}
              onChange={(e) => set("options", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
              placeholder="에어컨, 냉장고, 세탁기"
              className="h-9 text-sm"
            />
          </div>

          {/* 체크박스 */}
          <div className="flex gap-6">
            {[
              { key: "elevator", label: "엘리베이터" },
              { key: "is_new", label: "신규 매물" },
              { key: "is_hot", label: "인기 매물" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={(e) => set(key, e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                {label}
              </label>
            ))}
          </div>

          {/* 노출 상태 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-muted-foreground">노출 상태</label>
            <div className="flex gap-2">
              {(["active", "hidden"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  style={
                    form.status === s
                      ? { background: s === "active" ? "hsl(var(--chart-2))" : "hsl(var(--destructive))", color: "#fff", borderColor: "transparent" }
                      : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {s === "active" ? "노출중" : "노출종료"}
                </button>
              ))}
            </div>
          </div>

          {/* 사진 업로드 */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-muted-foreground">매물 사진</label>

            {/* 현재 업로드된 이미지 미리보기 */}
            {(form.images ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(form.images ?? []).map((url, i) => (
                  <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img src={url} alt={`사진 ${i + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center hover:bg-destructive transition-colors"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-primary text-white px-1.5 py-0.5 rounded-full">대표</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 업로드 버튼 */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all hover:border-primary"
              style={{ borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }}
            >
              {uploading
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">업로드 중...</span></>
                : <><ImagePlus className="w-4 h-4" /><span className="text-xs font-medium">사진 추가 (여러 장 선택 가능)</span></>
              }
            </button>
            {(form.images ?? []).length > 0 && (
              <p className="text-[10px] text-muted-foreground">
                첫 번째 사진이 대표 이미지로 사용됩니다. 드래그해서 순서 변경은 삭제 후 재업로드로 가능합니다.
              </p>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-2 sticky bottom-0" style={{ background: "hsl(var(--card))" }}>
          <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || uploading}>
            {saving ? "저장 중..." : <><Save className="w-3.5 h-3.5 mr-1" />저장</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── ContactEditModal ────────────────────────────────────────────────────────
const ContactEditModal = ({
  contact,
  onClose,
  onSave,
}: {
  contact: CheongJuContact | null;
  onClose: () => void;
  onSave: (updated: CheongJuContact) => Promise<void>;
}) => {
  const [form, setForm] = useState<CheongJuContact>(
    contact ?? { id: "", district: "", dong: "", phone: "", contact_owner: "", contact_manager: "", memo: "" }
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base font-bold text-foreground">
            {form.district} {form.dong} 연락처 {contact?.id ? "수정" : "등록"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted/50 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {!contact?.id && (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">구 *</label>
                <select
                  value={form.district}
                  onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none"
                >
                  <option value="">선택</option>
                  {CHEONGJU_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-muted-foreground">동/읍/면 *</label>
                <Input
                  value={form.dong}
                  onChange={(e) => setForm((f) => ({ ...f, dong: e.target.value }))}
                  placeholder="예: 복대동"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          )}
          {[
            { key: "phone", label: "대표 전화번호", placeholder: "043-XXX-XXXX" },
            { key: "contact_owner", label: "건물주 전화번호", placeholder: "010-XXXX-XXXX" },
            { key: "contact_manager", label: "관리인 전화번호", placeholder: "010-XXXX-XXXX" },
            { key: "memo", label: "메모", placeholder: "비고" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-muted-foreground">{label}</label>
              <Input
                value={(form as Record<string, string>)[key] ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="h-9 text-sm"
              />
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>취소</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "저장 중..." : <><Save className="w-3.5 h-3.5 mr-1" />저장</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState("dashboard");
  const [members, setMembers] = useState<AgentProfile[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberFilter, setMemberFilter] = useState("all");
  const [propertySearch, setPropertySearch] = useState("");
  const [postSearch, setPostSearch] = useState("");
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // 매물 관리 state
  const [dbProperties, setDbProperties] = useState<DBProperty[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [propertyModal, setPropertyModal] = useState<{ mode: "add" | "edit"; data: Partial<DBProperty> | null } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // 청주 연락처 state
  const [contacts, setContacts] = useState<CheongJuContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactModal, setContactModal] = useState<CheongJuContact | null | "new">(null);
  const [contactSearch, setContactSearch] = useState("");
  const [contactDistrictFilter, setContactDistrictFilter] = useState("전체");

  // ─── 세션 기반 관리자 인증 가드 ──────────────────────────────────────────
  useEffect(() => {
    const checkAdminAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/admin/login"); return; }
      const { data: roleData } = await supabase
        .from("user_roles").select("role")
        .eq("user_id", session.user.id).eq("role", "admin").maybeSingle();
      if (!roleData) { await supabase.auth.signOut(); navigate("/admin/login"); }
    };
    checkAdminAuth();
  }, [navigate]);

  // ─── 회원 불러오기 ───────────────────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    setMembersLoading(true); setMembersError("");
    const { data, error } = await supabase.from("agent_profiles").select("*").order("created_at", { ascending: false });
    if (error) { setMembersError("데이터 로드 오류: " + error.message); setMembersLoading(false); return; }

    // user_roles에서 각 회원의 등급 조회
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userIds = (data ?? []).map((m: any) => m.user_id as string);
    let roleMap: Record<string, "admin" | "user"> = {};
    if (userIds.length > 0) {
      const { data: rolesData } = await supabase.from("user_roles").select("user_id, role").in("user_id", userIds);
      if (rolesData) {
        roleMap = Object.fromEntries(rolesData.map((r: { user_id: string; role: "admin" | "user" }) => [r.user_id, r.role]));
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setMembers((data ?? []).map((m: any) => ({ ...m, role: roleMap[m.user_id] ?? "user" } as AgentProfile)));
    setMembersLoading(false);
  }, []);

  // ─── 매물(DB) 불러오기 ───────────────────────────────────────────────────
  const fetchProperties = useCallback(async () => {
    setPropertiesLoading(true);
    const { data, error } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
    if (!error && data) setDbProperties(data as DBProperty[]);
    setPropertiesLoading(false);
  }, []);

  // ─── 청주 연락처 불러오기 ────────────────────────────────────────────────
  const fetchContacts = useCallback(async () => {
    setContactsLoading(true);
    const { data, error } = await supabase.from("cheongju_contacts").select("*").order("district").order("dong");
    if (!error && data) setContacts(data as CheongJuContact[]);
    setContactsLoading(false);
  }, []);

  useEffect(() => { fetchMembers(); fetchProperties(); fetchContacts(); }, [fetchMembers, fetchProperties, fetchContacts]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/admin/login"); };

  // ─── 승인/거절 ───────────────────────────────────────────────────────────
  const updateMemberStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingId(id);
    const { error } = await supabase.from("agent_profiles").update({ status }).eq("id", id);
    setUpdatingId(null);
    if (error) { alert("상태 변경 오류: " + error.message); return; }
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
  };

  // ─── 등급(member_type) 변경 ──────────────────────────────────────────────
  const updateMemberType = async (id: string, member_type: MemberType) => {
    const { error } = await supabase.from("agent_profiles").update({ member_type }).eq("id", id);
    if (error) { alert("등급 변경 오류: " + error.message); return; }
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, member_type } : m));
  };

  // ─── 상위 부동산(parent) 변경 ────────────────────────────────────────────
  const updateParent = async (id: string, parent_user_id: string | null) => {
    const { error } = await supabase.from("agent_profiles").update({ parent_user_id }).eq("id", id);
    if (error) { alert("상위 부동산 변경 오류: " + error.message); return; }
    setMembers((prev) => prev.map((m) => m.id === id ? { ...m, parent_user_id } : m));
  };

  // ─── 접속 차단/허용 토글 ────────────────────────────────────────────────
  const toggleIsActive = async (m: AgentProfile) => {
    const newActive = !m.is_active;
    const { error } = await supabase.from("agent_profiles").update({ is_active: newActive }).eq("id", m.id);
    if (error) { alert("접속 상태 변경 오류: " + error.message); return; }
    setMembers((prev) => prev.map((p) => p.id === m.id ? { ...p, is_active: newActive } : p));
  };

  // ─── 회원 삭제 ──────────────────────────────────────────────────────────
  const deleteMember = async (m: AgentProfile) => {
    if (!window.confirm(`'${m.name}' 회원을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    const { error } = await supabase.from("agent_profiles").delete().eq("id", m.id);
    if (error) { alert("삭제 오류: " + error.message); return; }
    setMembers((prev) => prev.filter((p) => p.id !== m.id));
  };

  // ─── 매물 노출 토글 ──────────────────────────────────────────────────────
  const togglePropertyStatus = async (prop: DBProperty) => {
    setTogglingId(prop.id);
    const newStatus = prop.status === "active" ? "hidden" : "active";
    const { error } = await supabase.from("properties").update({ status: newStatus }).eq("id", prop.id);
    if (!error) setDbProperties((prev) => prev.map((p) => p.id === prop.id ? { ...p, status: newStatus } : p));
    else alert("상태 변경 오류: " + error.message);
    setTogglingId(null);
  };

  // ─── 매물 저장 (등록/수정) ────────────────────────────────────────────────
  const saveProperty = async (data: Omit<DBProperty, "id" | "created_at">) => {
    // 세션 확인 (RLS 통과를 위해 필수)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("세션이 만료되었습니다. 다시 로그인해주세요.");
      navigate("/admin/login");
      return;
    }

    // DB 컬럼과 정확히 매핑된 페이로드 (undefined/빈문자열 → null 처리)
    const payload = {
      title: data.title || "",
      building_name: data.building_name || null,
      address: data.address || "",
      dong: data.dong ?? "",
      lot_number: data.lot_number ?? "",
      district: data.district || null,
      type: data.type || "",
      room_type: data.room_type || null,
      unit_number: data.unit_number || null,
      area: data.area ?? "",
      floor: data.floor ?? "",
      deposit: data.deposit ?? "",
      monthly: data.monthly ?? "",
      manage_fee: data.manage_fee ?? "",
      parking: data.parking ?? "",
      elevator: data.elevator ?? false,
      available_from: data.available_from ?? "",
      total_floors: data.total_floors ?? "",
      build_year: data.build_year ?? "",
      description: data.description ?? "",
      building_memo: data.building_memo || null,
      room_memo: data.room_memo || null,
      note: data.note || null,
      vacate_date: data.vacate_date || null,
      building_password: data.building_password || null,
      room_password: data.room_password || null,
      options: Array.isArray(data.options) ? data.options : [],
      images: Array.isArray(data.images) ? data.images : [],
      views: Number(data.views) || 0,
      lat: Number(data.lat) || 0,
      lng: Number(data.lng) || 0,
      is_new: data.is_new ?? false,
      is_hot: data.is_hot ?? false,
      status: data.status ?? "active",
      registered_date: data.registered_date || new Date().toISOString().slice(0, 10),
      checked_date: data.checked_date || null,
      agent_name: data.agent_name ?? "",
    };

    if (propertyModal?.mode === "edit" && propertyModal.data?.id) {
      const { error } = await supabase.from("properties").update(payload).eq("id", propertyModal.data.id);
      if (error) {
        console.error("수정 오류:", error);
        alert("수정 오류: " + error.message);
        return;
      }
    } else {
      const { error } = await supabase.from("properties").insert(payload);
      if (error) {
        console.error("등록 오류:", error);
        alert("등록 오류: " + error.message);
        return;
      }
    }
    setPropertyModal(null);
    fetchProperties();
  };

  // ─── 연락처 저장 ─────────────────────────────────────────────────────────
  const saveContact = async (updated: CheongJuContact) => {
    if (updated.id) {
      const { error } = await supabase.from("cheongju_contacts")
        .update({ phone: updated.phone, contact_owner: updated.contact_owner, contact_manager: updated.contact_manager, memo: updated.memo })
        .eq("id", updated.id);
      if (error) { alert("수정 오류: " + error.message); return; }
    } else {
      const { error } = await supabase.from("cheongju_contacts")
        .insert({ district: updated.district, dong: updated.dong, phone: updated.phone, contact_owner: updated.contact_owner, contact_manager: updated.contact_manager, memo: updated.memo });
      if (error) { alert("등록 오류: " + error.message); return; }
    }
    setContactModal(null);
    fetchContacts();
  };

  const deletePost = (id: number) => setPosts((prev) => prev.filter((p) => p.id !== id));
  const togglePin = (id: number) => setPosts((prev) => prev.map((p) => p.id === id ? { ...p, pinned: !p.pinned } : p));

  // Stats
  const pendingCount = members.filter((m) => m.status === "pending").length;
  const approvedCount = members.filter((m) => m.status === "approved").length;
  const reportedPosts = posts.filter((p) => p.reported).length;
  // 매물: DB + static 합산
  const allProperties = [
    ...dbProperties,
    ...MAP_PROPERTIES.map((p) => ({ ...p, id: String(p.id), status: "active" as const, manage_fee: p.manageFee, available_from: p.availableFrom, total_floors: p.totalFloors, build_year: p.buildYear, building_name: p.buildingName, room_type: p.roomType, unit_number: p.unitNumber, building_memo: p.buildingMemo, room_memo: p.roomMemo, building_password: p.buildingPassword, room_password: p.roomPassword, vacate_date: p.vacateDate, checked_date: p.checkedDate, registered_date: p.registeredDate ?? "", is_new: p.isNew ?? false, is_hot: p.isHot ?? false, lat: p.lat, lng: p.lng, options: p.options ?? [], agent_name: p.agentName, created_at: "" })),
  ];

  const filteredMembers = members.filter((m) => {
    const matchFilter =
      memberFilter === "all" || memberFilter === "all_status"
        ? true
        : memberFilter === "role_admin"
        ? m.role === "admin"
        : memberFilter === "role_user"
        ? m.role !== "admin"
        : m.status === memberFilter; // pending / approved / rejected
    const matchSearch = !memberSearch || m.name.includes(memberSearch) || (m.email ?? "").includes(memberSearch) || m.agency_name.includes(memberSearch);
    return matchFilter && matchSearch;
  });

  const filteredDbProperties = dbProperties.filter((p) =>
    !propertySearch || p.title.includes(propertySearch) || p.address.includes(propertySearch) || p.agent_name.includes(propertySearch)
  );

  const filteredPosts = posts.filter((p) =>
    !postSearch || p.title.includes(postSearch) || p.author.includes(postSearch)
  );

  const filteredContacts = contacts.filter((c) => {
    const matchDist = contactDistrictFilter === "전체" || c.district === contactDistrictFilter;
    const matchSearch = !contactSearch || c.dong.includes(contactSearch) || c.phone.includes(contactSearch);
    return matchDist && matchSearch;
  });

  return (
    <div className="min-h-screen flex" style={{ background: "hsl(var(--background))" }}>
      {/* Modals */}
      {propertyModal && (
        <PropertyFormModal
          initial={propertyModal.data}
          onClose={() => setPropertyModal(null)}
          onSave={saveProperty}
        />
      )}
      {contactModal !== null && (
        <ContactEditModal
          contact={contactModal === "new" ? null : contactModal as CheongJuContact}
          onClose={() => setContactModal(null)}
          onSave={saveContact}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className="w-56 shrink-0 flex flex-col border-r sticky top-0 h-screen overflow-y-auto"
        style={{ background: "hsl(var(--header-bg))", borderColor: "hsl(var(--header-border))" }}
      >
        <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "hsl(var(--header-border))" }}>
          <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "hsl(var(--accent))" }}>
            <Home className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-extrabold text-white leading-none">집다</div>
            <div className="text-[10px] text-white/40 leading-none mt-0.5">관리자</div>
          </div>
        </div>
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
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "hsl(var(--destructive))" }}>{pendingCount}</span>
              )}
              {key === "community" && reportedPosts > 0 && (
                <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "hsl(var(--destructive))" }}>신고 {reportedPosts}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-3 py-4 border-t" style={{ borderColor: "hsl(var(--header-border))" }}>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm w-full transition-colors" style={{ color: "rgba(255,255,255,0.50)" }}>
            <LogOut className="w-4 h-4" />로그아웃
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 border-b px-6 py-3 flex items-center justify-between" style={{ background: "hsl(var(--card))", borderColor: "hsl(var(--border))" }}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color: "hsl(var(--primary))" }} />
            <h1 className="text-sm font-bold text-foreground">{NAV.find((n) => n.key === tab)?.label ?? "관리자"}</h1>
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "전체 회원", value: members.length, sub: `승인 대기 ${pendingCount}건`, icon: Users, color: "hsl(var(--primary))" },
                  { label: "승인된 회원", value: approvedCount, sub: "활성 중개사", icon: CheckCircle2, color: "hsl(var(--chart-2))" },
                  { label: "등록 매물(DB)", value: dbProperties.length, sub: `노출종료 ${dbProperties.filter((p) => p.status === "hidden").length}건`, icon: Building2, color: "hsl(var(--accent))" },
                  { label: "커뮤니티 게시글", value: posts.length, sub: `신고 게시글 ${reportedPosts}건`, icon: MessageSquare, color: "hsl(var(--chart-4))" },
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

              {/* 승인 대기 */}
              <div className="bg-card border border-border rounded-xl">
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" style={{ color: "hsl(var(--chart-4))" }} />승인 대기 회원
                  </h3>
                  <button className="text-xs font-medium" style={{ color: "hsl(var(--primary))" }} onClick={() => setTab("members")}>전체 보기 →</button>
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
                        <button onClick={() => updateMemberStatus(m.id, "approved")} disabled={updatingId === m.id} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "hsl(var(--chart-2) / 0.12)", color: "hsl(var(--chart-2))" }}>
                          <CheckCircle2 className="w-3 h-3" /> 승인
                        </button>
                        <button onClick={() => updateMemberStatus(m.id, "rejected")} disabled={updatingId === m.id} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: "hsl(var(--destructive) / 0.10)", color: "hsl(var(--destructive))" }}>
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

              {/* 인기 매물 */}
              <div className="bg-card border border-border rounded-xl">
                <div className="px-5 py-4 border-b border-border flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" style={{ color: "hsl(var(--accent))" }} />
                  <h3 className="text-sm font-bold text-foreground">인기 매물 TOP 5</h3>
                </div>
                <div className="divide-y divide-border">
                  {[...allProperties].sort((a, b) => b.views - a.views).slice(0, 5).map((p, i) => (
                    <div key={p.id} className="px-5 py-3 flex items-center gap-4">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={i === 0 ? { background: "hsl(var(--accent))", color: "#fff" } : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">{p.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{p.address}</div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Eye className="w-3 h-3" />{p.views.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 회원 관리 ── */}
          {tab === "members" && (() => {
            const MEMBER_TYPE_LABELS: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
              "대표중개사": { label: "대표중개사", color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.10)", emoji: "🏢" },
              "소속중개사": { label: "소속중개사", color: "hsl(var(--chart-2))", bg: "hsl(var(--chart-2) / 0.12)", emoji: "👔" },
              "중개보조원": { label: "중개보조원", color: "hsl(var(--chart-4))", bg: "hsl(var(--chart-4) / 0.12)", emoji: "🤝" },
            };
            // 대표중개사 목록 (parent 선택용)
            const mainAgents = members.filter(m => (m.member_type ?? "대표중개사") === "대표중개사" && m.role !== "admin");

            return (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">회원 관리</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    총 {members.length}명 · 관리자 {members.filter(m => m.role === "admin").length}명
                    · 대표 {members.filter(m => (m.member_type ?? "대표중개사") === "대표중개사" && m.role !== "admin").length}명
                    · 소속 {members.filter(m => m.member_type === "소속중개사").length}명
                    · 보조원 {members.filter(m => m.member_type === "중개보조원").length}명
                    · 승인대기 {pendingCount}명
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* 등급 필터 */}
                  <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/20 p-1">
                    {[
                      { key: "all", label: "전체" },
                      { key: "role_admin", label: "🛡관리자" },
                      { key: "대표중개사", label: "🏢대표" },
                      { key: "소속중개사", label: "👔소속" },
                      { key: "중개보조원", label: "🤝보조원" },
                    ].map((f) => (
                      <button key={f.key} onClick={() => setMemberFilter(f.key)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                        style={memberFilter === f.key
                          ? { background: "hsl(var(--primary))", color: "#fff" }
                          : { color: "hsl(var(--muted-foreground))" }
                        }>{f.label}</button>
                    ))}
                  </div>
                  {/* 상태 필터 */}
                  <div className="flex items-center gap-1 rounded-xl border border-border bg-muted/20 p-1">
                    {[
                      { key: "all_status", label: "전체상태" },
                      { key: "pending", label: "대기중" },
                      { key: "approved", label: "승인됨" },
                      { key: "rejected", label: "거절됨" },
                    ].map((f) => (
                      <button key={f.key} onClick={() => setMemberFilter(f.key)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                        style={memberFilter === f.key
                          ? { background: "hsl(var(--primary))", color: "#fff" }
                          : { color: "hsl(var(--muted-foreground))" }
                        }>{f.label}</button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input placeholder="이름·이메일·사무소 검색" className="pl-7 h-8 text-xs w-44" value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
                  </div>
                  <button onClick={fetchMembers} disabled={membersLoading} className="p-1.5 rounded-md transition-colors hover:bg-muted/50" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <RefreshCw className={`w-3.5 h-3.5 ${membersLoading ? "animate-spin" : ""}`} />
                  </button>
                </div>
              </div>
              {membersError && (
                <div className="flex items-center gap-2 rounded-xl p-3.5 text-sm" style={{ background: "hsl(var(--destructive) / 0.08)", color: "hsl(var(--destructive))" }}>
                  <AlertCircle className="w-4 h-4 shrink-0" />{membersError}
                </div>
              )}
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="hidden md:grid grid-cols-[1fr_1fr_90px_100px_80px_130px] text-xs font-semibold text-muted-foreground bg-muted/40 px-5 py-3 border-b border-border">
                  <span>이름 / 사무소</span><span>이메일 / 전화</span>
                  <span className="text-center">등급(역할)</span>
                  <span className="text-center">멤버 유형</span>
                  <span className="text-center">상태</span>
                  <span className="text-center">관리</span>
                </div>
                {membersLoading && <div className="py-16 text-center text-sm text-muted-foreground">불러오는 중...</div>}
                {!membersLoading && filteredMembers.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">해당 조건의 회원이 없습니다.</div>}
                {!membersLoading && filteredMembers.map((m) => {
                  const mt = (m.member_type ?? "대표중개사") as MemberType;
                  const mtStyle = MEMBER_TYPE_LABELS[mt] ?? MEMBER_TYPE_LABELS["대표중개사"];
                  const parentAgent = m.parent_user_id ? members.find(x => x.user_id === m.parent_user_id) : null;
                  // 이 사람의 하위 회원들
                  const subMembers = members.filter(x => x.parent_user_id === m.user_id);

                  return (
                    <div key={m.id} className={`border-b border-border last:border-0 ${expandedMember === m.id ? "bg-muted/20" : ""} ${!m.is_active ? "opacity-60" : ""}`}>
                      <div className="grid md:grid-cols-[1fr_1fr_90px_100px_80px_130px] items-center px-5 py-3.5 cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => setExpandedMember(expandedMember === m.id ? null : m.id)}>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-foreground">{m.name}</span>
                            {!m.is_active && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "hsl(var(--destructive) / 0.12)", color: "hsl(var(--destructive))" }}>접속차단</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">{m.agency_name}</div>
                          {subMembers.length > 0 && (
                            <div className="text-[10px] mt-0.5" style={{ color: "hsl(var(--chart-2))" }}>하위 {subMembers.length}명</div>
                          )}
                        </div>
                        <div className="hidden md:block">
                          <div className="text-xs text-foreground">{m.email ?? "-"}</div>
                          <div className="text-xs text-muted-foreground">{m.phone}</div>
                          {parentAgent && (
                            <div className="text-[10px] text-muted-foreground mt-0.5">상위: {parentAgent.agency_name}</div>
                          )}
                        </div>
                        {/* 역할 배지 */}
                        <div className="hidden md:flex justify-center">
                          {m.role === "admin" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--accent) / 0.15)", color: "hsl(var(--accent))" }}>🛡관리자</span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.10)", color: "hsl(var(--primary))" }}>👤중개사</span>
                          )}
                        </div>
                        {/* 멤버 유형 배지 */}
                        <div className="hidden md:flex justify-center">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: mtStyle.bg, color: mtStyle.color }}>
                            {mtStyle.emoji} {mtStyle.label}
                          </span>
                        </div>
                        {/* 승인 상태 */}
                        <div className="hidden md:flex justify-center">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: STATUS_LABEL[m.status].bg, color: STATUS_LABEL[m.status].color }}>
                            {STATUS_LABEL[m.status].label}
                          </span>
                        </div>
                        {/* 액션 버튼 */}
                        <div className="hidden md:flex justify-center items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {m.status !== "approved" && (
                            <button onClick={() => updateMemberStatus(m.id, "approved")} className="p-1.5 rounded-md" title="승인" style={{ color: "hsl(var(--chart-2))" }}>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {m.status !== "rejected" && (
                            <button onClick={() => updateMemberStatus(m.id, "rejected")} className="p-1.5 rounded-md" title="거절" style={{ color: "hsl(var(--destructive))" }}>
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button onClick={() => toggleIsActive(m)} className="p-1.5 rounded-md" title={m.is_active ? "접속 차단" : "접속 허용"} style={{ color: m.is_active ? "hsl(var(--chart-4))" : "hsl(var(--chart-2))" }}>
                            {m.is_active ? <Ban className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => deleteMember(m)} className="p-1.5 rounded-md" title="삭제" style={{ color: "hsl(var(--destructive))" }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {expandedMember === m.id ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                      </div>

                      {/* 확장 패널 */}
                      {expandedMember === m.id && (
                        <div className="mx-5 mb-4 rounded-xl p-4 flex flex-col gap-4 border" style={{ background: "hsl(var(--muted) / 0.4)", borderColor: "hsl(var(--border))" }}>
                          {/* 기본 정보 */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                            {[
                              { label: "사무소명", value: m.agency_name },
                              { label: "공인중개사 등록번호", value: m.license_number },
                              { label: "사업자 등록번호", value: m.business_number },
                              { label: "사무소 주소", value: m.agency_address },
                              { label: "이메일", value: m.email ?? "-" },
                              { label: "전화번호", value: m.phone },
                              { label: "가입일", value: m.created_at.slice(0, 10) },
                              { label: "역할", value: m.role === "admin" ? "🛡 관리자" : "👤 중개사" },
                              { label: "접속 상태", value: m.is_active !== false ? "✅ 허용" : "🚫 차단" },
                            ].map(({ label, value }) => (
                              <div key={label}>
                                <div className="text-muted-foreground mb-0.5">{label}</div>
                                <div className="font-medium text-foreground">{value}</div>
                              </div>
                            ))}
                          </div>

                          {/* 멤버 유형 변경 */}
                          {m.role !== "admin" && (
                            <div className="flex flex-col gap-2 pt-3 border-t border-border">
                              <p className="text-xs font-bold text-foreground">멤버 유형 변경</p>
                              <div className="flex gap-2 flex-wrap">
                                {(["대표중개사", "소속중개사", "중개보조원"] as MemberType[]).map((t) => (
                                  <button key={t}
                                    onClick={() => updateMemberType(m.id, t)}
                                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                                    style={mt === t
                                      ? { background: MEMBER_TYPE_LABELS[t].color, color: "#fff", borderColor: "transparent" }
                                      : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                                    }
                                  >
                                    {MEMBER_TYPE_LABELS[t].emoji} {t}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 상위 부동산 연결 (소속/보조원만) */}
                          {m.role !== "admin" && (mt === "소속중개사" || mt === "중개보조원") && (
                            <div className="flex flex-col gap-2 pt-3 border-t border-border">
                              <p className="text-xs font-bold text-foreground">상위(대표) 부동산 연결</p>
                              <div className="flex gap-2 flex-wrap">
                                <button
                                  onClick={() => updateParent(m.id, null)}
                                  className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                                  style={!m.parent_user_id
                                    ? { background: "hsl(var(--muted-foreground))", color: "#fff", borderColor: "transparent" }
                                    : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                                  }
                                >없음</button>
                                {mainAgents.map((a) => (
                                  <button key={a.id}
                                    onClick={() => updateParent(m.id, a.user_id)}
                                    className="px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                                    style={m.parent_user_id === a.user_id
                                      ? { background: "hsl(var(--chart-2))", color: "#fff", borderColor: "transparent" }
                                      : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                                    }
                                  >🏢 {a.agency_name} ({a.name})</button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 하위 회원 목록 */}
                          {subMembers.length > 0 && (
                            <div className="flex flex-col gap-2 pt-3 border-t border-border">
                              <p className="text-xs font-bold text-foreground">소속 하위 회원 ({subMembers.length}명)</p>
                              <div className="flex flex-col gap-1">
                                {subMembers.map((s) => (
                                  <div key={s.id} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs" style={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}>
                                    <div className="flex items-center gap-2">
                                      <span style={{ color: MEMBER_TYPE_LABELS[s.member_type ?? "소속중개사"]?.color }}>
                                        {MEMBER_TYPE_LABELS[s.member_type ?? "소속중개사"]?.emoji}
                                      </span>
                                      <span className="font-medium text-foreground">{s.name}</span>
                                      <span className="text-muted-foreground">{s.agency_name}</span>
                                      <span style={{ color: MEMBER_TYPE_LABELS[s.member_type ?? "소속중개사"]?.color }}>
                                        {s.member_type ?? "소속중개사"}
                                      </span>
                                    </div>
                                    <button onClick={() => deleteMember(s)} className="p-1 rounded" title="삭제" style={{ color: "hsl(var(--destructive))" }}>
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* 액션 버튼 */}
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
                            {m.status !== "approved" && (
                              <button onClick={() => updateMemberStatus(m.id, "approved")} className="flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs" style={{ background: "hsl(var(--chart-2) / 0.15)", color: "hsl(var(--chart-2))" }}>
                                <CheckCircle2 className="w-3.5 h-3.5" /> 승인하기
                              </button>
                            )}
                            {m.status !== "rejected" && (
                              <button onClick={() => updateMemberStatus(m.id, "rejected")} className="flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs" style={{ background: "hsl(var(--destructive) / 0.10)", color: "hsl(var(--destructive))" }}>
                                <XCircle className="w-3.5 h-3.5" /> 거절하기
                              </button>
                            )}
                            <button onClick={() => toggleIsActive(m)} className="flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs"
                              style={m.is_active !== false
                                ? { background: "hsl(var(--destructive) / 0.10)", color: "hsl(var(--destructive))" }
                                : { background: "hsl(var(--chart-2) / 0.15)", color: "hsl(var(--chart-2))" }
                              }>
                              {m.is_active !== false ? <><Ban className="w-3.5 h-3.5" /> 접속 차단</> : <><Unlock className="w-3.5 h-3.5" /> 접속 허용</>}
                            </button>
                            <button onClick={() => deleteMember(m)} className="flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs ml-auto" style={{ background: "hsl(var(--destructive) / 0.10)", color: "hsl(var(--destructive))" }}>
                              <Trash2 className="w-3.5 h-3.5" /> 계정 삭제
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })()}
          {/* ── 매물 관리 ── */}
          {tab === "properties" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">매물 관리</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    DB 등록 {dbProperties.length}개 · 노출종료 {dbProperties.filter((p) => p.status === "hidden").length}개
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input placeholder="매물명·주소·중개사 검색" className="pl-7 h-8 text-xs w-52" value={propertySearch} onChange={(e) => setPropertySearch(e.target.value)} />
                  </div>
                  <button onClick={fetchProperties} disabled={propertiesLoading} className="p-1.5 rounded-md hover:bg-muted/50" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <RefreshCw className={`w-3.5 h-3.5 ${propertiesLoading ? "animate-spin" : ""}`} />
                  </button>
                  <Button size="sm" onClick={() => setPropertyModal({ mode: "add", data: null })}>
                    <Plus className="w-3.5 h-3.5 mr-1" />매물 등록
                  </Button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="hidden md:grid grid-cols-[2fr_1fr_80px_70px_90px_200px] text-xs font-semibold text-muted-foreground bg-muted/40 px-5 py-3 border-b border-border">
                  <span>매물명 / 주소</span><span>중개사</span>
                  <span className="text-center">유형</span><span className="text-center">조회</span>
                  <span className="text-center">상태</span><span className="text-center">액션</span>
                </div>
                {propertiesLoading && <div className="py-16 text-center text-sm text-muted-foreground">불러오는 중...</div>}
                {!propertiesLoading && filteredDbProperties.length === 0 && (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    등록된 매물이 없습니다.
                    <div className="mt-3">
                      <Button size="sm" variant="outline" onClick={() => setPropertyModal({ mode: "add", data: null })}>
                        <Plus className="w-3.5 h-3.5 mr-1" />첫 매물 등록하기
                      </Button>
                    </div>
                  </div>
                )}
                {filteredDbProperties.map((p) => (
                  <div key={p.id} className={`grid md:grid-cols-[2fr_1fr_80px_70px_90px_200px] items-center px-5 py-3.5 border-b border-border last:border-0 transition-colors ${p.status === "hidden" ? "opacity-50" : "hover:bg-muted/20"}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{p.title}</span>
                        {p.status === "hidden" && <EyeOff className="w-3 h-3 shrink-0 text-muted-foreground" />}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{p.address}</div>
                    </div>
                    <div className="hidden md:block text-xs text-muted-foreground truncate">{p.agent_name}</div>
                    <div className="hidden md:flex justify-center">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--accent) / 0.12)", color: "hsl(var(--accent))" }}>{p.type}</span>
                    </div>
                    <div className="hidden md:flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />{p.views.toLocaleString()}
                    </div>
                    <div className="hidden md:flex justify-center">
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={p.status === "active"
                          ? { background: "hsl(var(--chart-2) / 0.12)", color: "hsl(var(--chart-2))" }
                          : { background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }
                        }>
                        {p.status === "active" ? "노출중" : "종료"}
                      </span>
                    </div>
                    <div className="hidden md:flex items-center justify-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setPropertyModal({ mode: "edit", data: p })}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full font-semibold transition-colors"
                        style={{ background: "hsl(var(--primary) / 0.10)", color: "hsl(var(--primary))" }}
                        title="수정"
                      >
                        <Pencil className="w-3 h-3" />수정
                      </button>
                      <button
                        onClick={() => {
                          // id, created_at 제외 + 날짜·상태 초기화하여 새 등록 폼 열기
                          const { id: _id, created_at: _ca, ...rest } = p;
                          setPropertyModal({
                            mode: "add",
                            data: {
                              ...rest,
                              status: "active",
                              registered_date: new Date().toISOString().slice(0, 10),
                              views: 0,
                            },
                          });
                        }}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full font-semibold transition-colors"
                        style={{ background: "hsl(var(--chart-4) / 0.12)", color: "hsl(var(--chart-4))" }}
                        title="이 매물 정보로 새로 등록"
                      >
                        <Copy className="w-3 h-3" />복사
                      </button>
                      <button
                        onClick={() => togglePropertyStatus(p)}
                        disabled={togglingId === p.id}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full font-semibold transition-colors"
                        style={p.status === "active"
                          ? { background: "hsl(var(--destructive) / 0.10)", color: "hsl(var(--destructive))" }
                          : { background: "hsl(var(--chart-2) / 0.12)", color: "hsl(var(--chart-2))" }
                        }
                        title={p.status === "active" ? "노출종료" : "노출재개"}
                      >
                        {p.status === "active" ? <><EyeOff className="w-3 h-3" />종료</> : <><Eye className="w-3 h-3" />재개</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 청주 연락처 관리 ── */}
          {tab === "contacts" && (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">청주시 지역별 연락처</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">주소(동)에 따른 전화번호 관리</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex gap-1">
                    {["전체", ...CHEONGJU_DISTRICTS].map((d) => (
                      <button key={d} onClick={() => setContactDistrictFilter(d)}
                        className="px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                        style={contactDistrictFilter === d
                          ? { background: "hsl(var(--primary))", color: "#fff", borderColor: "hsl(var(--primary))" }
                          : { borderColor: "hsl(var(--border))", color: "hsl(var(--muted-foreground))" }
                        }>{d}</button>
                    ))}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                    <Input placeholder="동 이름·전화번호 검색" className="pl-7 h-8 text-xs w-44" value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} />
                  </div>
                  <button onClick={fetchContacts} disabled={contactsLoading} className="p-1.5 rounded-md hover:bg-muted/50" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <RefreshCw className={`w-3.5 h-3.5 ${contactsLoading ? "animate-spin" : ""}`} />
                  </button>
                  <Button size="sm" onClick={() => setContactModal("new")}>
                    <Plus className="w-3.5 h-3.5 mr-1" />연락처 추가
                  </Button>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="hidden md:grid grid-cols-[80px_100px_160px_160px_160px_80px] text-xs font-semibold text-muted-foreground bg-muted/40 px-5 py-3 border-b border-border">
                  <span>구</span><span>동/읍/면</span>
                  <span>대표전화</span><span>건물주</span><span>관리인</span>
                  <span className="text-center">수정</span>
                </div>
                {contactsLoading && <div className="py-16 text-center text-sm text-muted-foreground">불러오는 중...</div>}
                {!contactsLoading && filteredContacts.length === 0 && (
                  <div className="py-16 text-center text-sm text-muted-foreground">등록된 연락처가 없습니다.</div>
                )}
                {filteredContacts.map((c) => (
                  <div key={c.id} className="grid md:grid-cols-[80px_100px_160px_160px_160px_80px] items-center px-5 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                      <MapPin className="w-3 h-3 shrink-0" style={{ color: "hsl(var(--accent))" }} />{c.district}
                    </div>
                    <div className="text-sm font-medium text-foreground">{c.dong}</div>
                    <div className="hidden md:flex items-center gap-1 text-xs">
                      {c.phone ? (
                        <a href={`tel:${c.phone}`} className="font-medium" style={{ color: "hsl(var(--primary))" }}>{c.phone}</a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="hidden md:block text-xs">
                      {c.contact_owner ? (
                        <a href={`tel:${c.contact_owner}`} className="font-medium" style={{ color: "hsl(var(--chart-2))" }}>{c.contact_owner}</a>
                      ) : <span className="text-muted-foreground">—</span>}
                    </div>
                    <div className="hidden md:block text-xs">
                      {c.contact_manager ? (
                        <a href={`tel:${c.contact_manager}`} className="font-medium" style={{ color: "hsl(var(--chart-4))" }}>{c.contact_manager}</a>
                      ) : <span className="text-muted-foreground">—</span>}
                    </div>
                    <div className="hidden md:flex justify-center">
                      <button
                        onClick={() => setContactModal(c)}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: "hsl(var(--primary) / 0.10)", color: "hsl(var(--primary))" }}
                      >
                        <Pencil className="w-3 h-3" />수정
                      </button>
                    </div>
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
                  <p className="text-xs text-muted-foreground mt-0.5">총 {posts.length}개 게시글 · 신고 {posts.filter((p) => p.reported).length}건</p>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input placeholder="제목·작성자 검색" className="pl-7 h-8 text-xs w-48" value={postSearch} onChange={(e) => setPostSearch(e.target.value)} />
                </div>
              </div>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="hidden md:grid grid-cols-[80px_1fr_80px_60px_60px_100px] text-xs font-semibold text-muted-foreground bg-muted/40 px-5 py-3 border-b border-border">
                  <span>분류</span><span>제목</span><span className="text-center">작성자</span>
                  <span className="text-center">조회</span><span className="text-center">신고</span><span className="text-center">관리</span>
                </div>
                {filteredPosts.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">게시글이 없습니다.</div>}
                {filteredPosts.map((p) => (
                  <div key={p.id} className={`grid md:grid-cols-[80px_1fr_80px_60px_60px_100px] items-center px-5 py-3.5 border-b border-border last:border-0 transition-colors ${p.reported ? "bg-destructive/[0.03]" : "hover:bg-muted/20"}`}>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit"
                      style={{ background: p.category === "notice" ? "hsl(218 88% 22% / 0.12)" : "hsl(var(--muted))", color: p.category === "notice" ? "hsl(218 88% 40%)" : "hsl(var(--muted-foreground))" }}>
                      {p.categoryLabel}
                    </span>
                    <div className="flex items-center gap-2 min-w-0">
                      {p.pinned && <Pin className="w-3 h-3 shrink-0 text-destructive" />}
                      <span className="text-sm font-medium text-foreground truncate">{p.title}</span>
                      {p.reported && <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "hsl(var(--destructive) / 0.12)", color: "hsl(var(--destructive))" }}>신고</span>}
                    </div>
                    <span className="hidden md:block text-xs text-muted-foreground text-center">{p.author}</span>
                    <span className="hidden md:flex items-center justify-center gap-0.5 text-xs text-muted-foreground"><Eye className="w-3 h-3" />{p.views}</span>
                    <div className="hidden md:flex justify-center">
                      {p.reported ? <span className="w-2 h-2 rounded-full" style={{ background: "hsl(var(--destructive))" }} /> : <span className="text-xs text-muted-foreground">-</span>}
                    </div>
                    <div className="hidden md:flex items-center justify-center gap-2">
                      <button onClick={() => togglePin(p.id)} className="p-1.5 rounded transition-colors" title={p.pinned ? "고정 해제" : "공지 고정"} style={{ color: p.pinned ? "hsl(var(--destructive))" : "hsl(var(--muted-foreground))" }}>
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deletePost(p.id)} className="p-1.5 rounded transition-colors" title="삭제" style={{ color: "hsl(var(--destructive))" }}>
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
