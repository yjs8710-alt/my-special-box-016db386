import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Building2, Lock, Users, Trash2, Loader2, Save, Eye, EyeOff, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";

interface AgentProfile {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  agency_name: string;
  license_number: string;
  business_number: string;
  agency_address: string;
  member_type: string;
  status: string;
  is_active: boolean;
  parent_user_id: string | null;
  created_at: string;
}

const MyPage = () => {
  const navigate = useNavigate();
  const { isLoading: authLoading, isAuthorized, user } = useAuth();
  const { toast } = useToast();

  // Profile state
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Sub-members (for 대표중개사)
  const [subMembers, setSubMembers] = useState<AgentProfile[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Email
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthorized) {
      navigate("/login");
    }
  }, [authLoading, isAuthorized, navigate]);

  // Fetch profile
  useEffect(() => {
    if (!user?.userId) return;
    (async () => {
      setLoading(true);
      // Get email
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser?.email) setEmail(authUser.email);

      const { data } = await supabase
        .from("agent_profiles")
        .select("*")
        .eq("user_id", user.userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
        setName(data.name);
        setPhone(data.phone);
        setAgencyName(data.agency_name);
        setAgencyAddress(data.agency_address);
        setLicenseNumber(data.license_number);
        setBusinessNumber(data.business_number);
      }
      setLoading(false);
    })();
  }, [user?.userId]);

  // Fetch sub-members for 대표중개사
  useEffect(() => {
    if (!profile || profile.member_type !== "대표중개사") return;
    (async () => {
      setLoadingSubs(true);
      const { data } = await supabase
        .from("agent_profiles")
        .select("*")
        .eq("parent_user_id", profile.user_id);
      setSubMembers(data ?? []);
      setLoadingSubs(false);
    })();
  }, [profile]);

  const handleSaveAll = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("agent_profiles")
      .update({
        name,
        phone,
        agency_name: agencyName,
        agency_address: agencyAddress,
        license_number: licenseNumber,
        business_number: businessNumber,
      })
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast({ title: "저장 실패", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "정보가 저장되었습니다." });
      setProfile({
        ...profile,
        name, phone,
        agency_name: agencyName,
        agency_address: agencyAddress,
        license_number: licenseNumber,
        business_number: businessNumber,
      });
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: "비밀번호는 6자 이상이어야 합니다.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "새 비밀번호가 일치하지 않습니다.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast({ title: "비밀번호 변경 실패", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "비밀번호가 변경되었습니다." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleDeleteSubMember = async (sub: AgentProfile) => {
    if (!confirm(`${sub.name} 회원을 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`)) return;

    // Deactivate & disassociate
    const { error } = await supabase
      .from("agent_profiles")
      .update({ is_active: false, parent_user_id: null, status: "rejected" })
      .eq("id", sub.id);

    if (error) {
      toast({ title: "삭제 실패", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${sub.name} 회원이 삭제되었습니다.` });
      setSubMembers((prev) => prev.filter((m) => m.id !== sub.id));
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const isRepresentative = profile?.member_type === "대표중개사";

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      <Header />

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "hsl(var(--accent))" }}>
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">마이페이지</h1>
            <p className="text-xs text-muted-foreground">
              {profile?.member_type ?? "회원"} · {profile?.name}
            </p>
          </div>
        </div>

        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: isRepresentative ? "1fr 1fr 1fr" : "1fr 1fr" }}>
            <TabsTrigger value="info" className="text-xs gap-1">
              <User className="w-3.5 h-3.5" /> 내 정보
            </TabsTrigger>
            <TabsTrigger value="password" className="text-xs gap-1">
              <Lock className="w-3.5 h-3.5" /> 비밀번호
            </TabsTrigger>
            {isRepresentative && (
              <TabsTrigger value="members" className="text-xs gap-1">
                <Users className="w-3.5 h-3.5" /> 회원관리
              </TabsTrigger>
            )}
          </TabsList>

          {/* ─── 내 정보 ─── */}
          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold">회원/사업자 정보</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* 2-column definition list */}
                <div className="border-t" style={{ borderColor: "hsl(var(--border))" }}>
                  {([
                    [
                      { label: "이름", value: profile?.name ?? "", editable: true, field: "name" as const },
                      { label: "휴대폰 번호", value: phone, editable: true, field: "phone" as const },
                    ],
                    [
                      { label: "대표번호", value: profile?.phone ?? "", editable: false },
                      { label: "이메일", value: email, editable: false },
                    ],
                    [
                      { label: "사업자등록번호", value: businessNumber, editable: true, field: "businessNumber" as const },
                      { label: "중개사무소등록번호", value: licenseNumber, editable: true, field: "licenseNumber" as const },
                    ],
                    [
                      { label: "상호명", value: agencyName, editable: true, field: "agencyName" as const },
                      { label: "주소(신청용)", value: agencyAddress, editable: true, field: "agencyAddress" as const },
                    ],
                    [
                      { label: "회원유형", value: profile?.member_type ?? "", editable: false },
                      null,
                    ],
                  ] as const).map((row, ri) => (
                    <div
                      key={ri}
                      className="grid grid-cols-1 md:grid-cols-2 border-b last:border-b-0"
                      style={{ borderColor: "hsl(var(--border))" }}
                    >
                      {row.map((cell, ci) =>
                        cell ? (
                          <div
                            key={ci}
                            className={`px-5 py-3 ${ci === 0 && row[1] ? "md:border-r" : ""}`}
                            style={{ borderColor: "hsl(var(--border))" }}
                          >
                            <p className="text-xs font-semibold text-muted-foreground mb-1">{cell.label}</p>
                            {cell.editable && cell.field ? (
                              <Input
                                value={
                                  cell.field === "name" ? name
                                    : cell.field === "phone" ? phone
                                    : cell.field === "businessNumber" ? businessNumber
                                    : cell.field === "licenseNumber" ? licenseNumber
                                    : cell.field === "agencyName" ? agencyName
                                    : agencyAddress
                                }
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (cell.field === "name") setName(v);
                                  else if (cell.field === "phone") setPhone(v);
                                  else if (cell.field === "businessNumber") setBusinessNumber(v);
                                  else if (cell.field === "licenseNumber") setLicenseNumber(v);
                                  else if (cell.field === "agencyName") setAgencyName(v);
                                  else setAgencyAddress(v);
                                }}
                                className="h-8 text-sm"
                              />
                            ) : (
                              <p className="text-sm text-foreground">{cell.value || "—"}</p>
                            )}
                          </div>
                        ) : (
                          <div key={ci} className="hidden md:block" />
                        )
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 p-4">
                  <Button size="sm" onClick={handleSavePersonal} disabled={saving} className="text-xs gap-1">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    개인정보 저장
                  </Button>
                  <Button size="sm" onClick={handleSaveCompany} disabled={saving} className="text-xs gap-1" variant="outline">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    회사정보 저장
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── 비밀번호 변경 ─── */}
          <TabsContent value="password">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  비밀번호 변경
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">새 비밀번호</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="6자 이상"
                      className="text-sm pr-9"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                      onClick={() => setShowPasswords(!showPasswords)}
                    >
                      {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">새 비밀번호 확인</Label>
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="비밀번호 재입력"
                    className="mt-1 text-sm"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <Button
                    size="sm"
                    onClick={handleChangePassword}
                    disabled={changingPassword || !newPassword || !confirmPassword}
                    className="text-xs gap-1"
                  >
                    {changingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                    비밀번호 변경
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── 회원관리 (대표중개사 전용) ─── */}
          {isRepresentative && (
            <TabsContent value="members">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    하부 회원 관리
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      {subMembers.length}명
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSubs ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : subMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm text-muted-foreground">등록된 하부 회원이 없습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {subMembers.map((sub) => (
                        <div
                          key={sub.id}
                          className="flex items-center gap-3 p-3 rounded-lg border"
                          style={{ borderColor: "hsl(var(--border))" }}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                            style={{ background: "hsl(var(--accent))" }}
                          >
                            {sub.name[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{sub.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {sub.member_type}
                              </span>
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded"
                                style={{
                                  background: sub.is_active ? "hsl(142 76% 36% / 0.1)" : "hsl(0 84% 60% / 0.1)",
                                  color: sub.is_active ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)",
                                }}
                              >
                                {sub.is_active ? "활성" : "비활성"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{sub.phone} · {sub.agency_name}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                            onClick={() => handleDeleteSubMember(sub)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default MyPage;
