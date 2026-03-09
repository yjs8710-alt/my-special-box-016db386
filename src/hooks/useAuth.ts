import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuthStatus = "loading" | "authorized" | "unauthorized";

interface AuthUser {
  userId: string;
  memberType: string;
  isAdmin: boolean;
}

let cachedStatus: AuthStatus = "loading";
let cachedUser: AuthUser | null = null;
let listeners: Array<(s: AuthStatus, u: AuthUser | null) => void> = [];

function notify(s: AuthStatus, u: AuthUser | null) {
  cachedStatus = s;
  cachedUser = u;
  listeners.forEach((fn) => fn(s, u));
}

async function checkSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
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

  if (!profile || profile.status !== "approved" || profile.is_active === false) {
    await supabase.auth.signOut();
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

supabase.auth.onAuthStateChange((_event, session) => {
  if (!session) {
    notify("unauthorized", null);
  } else {
    checkSession();
  }
});

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
