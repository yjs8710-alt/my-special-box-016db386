import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { claimDeviceSlot, verifyDeviceSlot, verifyPcIpAllowed, getDeviceType, getOrCreateDeviceId } from "@/lib/deviceSession";

type AuthStatus = "loading" | "authorized" | "unauthorized";

interface AuthUser {
  userId: string;
  memberType: string;
  isAdmin: boolean;
}

let cachedStatus: AuthStatus = "loading";
let cachedUser: AuthUser | null = null;
let listeners: Array<(s: AuthStatus, u: AuthUser | null) => void> = [];
let deviceChannel: ReturnType<typeof supabase.channel> | null = null;
let kickedOut = false;

function notify(s: AuthStatus, u: AuthUser | null) {
  cachedStatus = s;
  cachedUser = u;
  listeners.forEach((fn) => fn(s, u));
}

async function forceLogoutDueToDeviceConflict() {
  if (kickedOut) return;
  kickedOut = true;
  try { await supabase.auth.signOut(); } catch {}
  if (typeof window !== "undefined") {
    alert("다른 기기에서 동일한 계정으로 로그인되어 이 기기는 로그아웃됩니다.\n(휴대폰 1대 + PC 1대만 동시 사용 가능)");
  }
  notify("unauthorized", null);
}

async function forceLogoutDueToIpRestriction() {
  if (kickedOut) return;
  kickedOut = true;
  try { await supabase.auth.signOut(); } catch {}
  if (typeof window !== "undefined") {
    alert("이 PC는 등록된 사무실 IP가 아니어서 접속할 수 없습니다.\n관리자에게 PC 허용 IP 등록을 요청하세요.");
  }
  notify("unauthorized", null);
}

function teardownDeviceChannel() {
  if (deviceChannel) {
    try { supabase.removeChannel(deviceChannel); } catch {}
    deviceChannel = null;
  }
}

function setupDeviceChannel(userId: string) {
  teardownDeviceChannel();
  const myDeviceId = getOrCreateDeviceId();
  const myDeviceType = getDeviceType();
  deviceChannel = supabase
    .channel(`device-sessions-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "user_active_sessions", filter: `user_id=eq.${userId}` },
      (payload: any) => {
        const row = (payload.new ?? payload.old) as { device_type?: string; device_id?: string } | null;
        if (!row) return;
        if (row.device_type === myDeviceType && row.device_id !== myDeviceId) {
          forceLogoutDueToDeviceConflict();
        }
      }
    )
    .subscribe();
}

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    teardownDeviceChannel();
    notify("unauthorized", null);
    return;
  }

  // 관리자 여부 확인
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (roleData) {
    notify("authorized", { userId: session.user.id, memberType: "관리자", isAdmin: true });
    return;
  }

  // 중개사 프로필 확인
  const { data: profile } = await supabase
    .from("agent_profiles")
    .select("status, is_active, member_type")
    .eq("user_id", session.user.id)
    .maybeSingle();

  // 미승인(pending/rejected) 또는 비활성 계정 → 강제 로그아웃
  if (!profile || profile.status !== "approved" || profile.is_active === false) {
    await supabase.auth.signOut();
    teardownDeviceChannel();
    notify("unauthorized", null);
    return;
  }

  notify("authorized", {
    userId: session.user.id,
    memberType: profile.member_type,
    isAdmin: false,
  });
}

// 앱 시작 시 한번 체크
checkSession();

supabase.auth.onAuthStateChange(async (event, session) => {
  if (!session) {
    teardownDeviceChannel();
    notify("unauthorized", null);
    return;
  }

  // 로그인/세션 갱신 시: 디바이스 슬롯 클레임 + 검증 + 채널 구독
  if (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") {
    kickedOut = false;
    try {
      await claimDeviceSlot();
    } catch {}
    setupDeviceChannel(session.user.id);
    // PC 허용 IP 검증 (PC 한정, 모바일은 통과)
    const ipOk = await verifyPcIpAllowed();
    if (!ipOk) {
      await forceLogoutDueToIpRestriction();
      return;
    }
    // 탭 복귀 후 정합성 재검증
    const ok = await verifyDeviceSlot();
    if (!ok) {
      await forceLogoutDueToDeviceConflict();
      return;
    }
  }

  checkSession();
});

// 탭이 다시 보일 때 디바이스 슬롯 정합성 재검증
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState !== "visible") return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const ok = await verifyDeviceSlot();
    if (!ok) await forceLogoutDueToDeviceConflict();
  });
}

export function useAuth() {
  const [status, setStatus] = useState<AuthStatus>(cachedStatus);
  const [user, setUser] = useState<AuthUser | null>(cachedUser);

  useEffect(() => {
    setStatus(cachedStatus);
    setUser(cachedUser);
    const fn = (s: AuthStatus, u: AuthUser | null) => {
      setStatus(s);
      setUser(u);
    };
    listeners.push(fn);
    return () => {
      listeners = listeners.filter((l) => l !== fn);
    };
  }, []);

  const logout = useCallback(async () => {
    teardownDeviceChannel();
    await supabase.auth.signOut();
    notify("unauthorized", null);
  }, []);

  return {
    isLoading: status === "loading",
    isAuthorized: status === "authorized",
    user,
    logout,
  };
}
