import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type AdminStatus = "loading" | "admin" | "none";

let cachedStatus: AdminStatus = "loading";
let listeners: Array<(s: AdminStatus) => void> = [];

function notifyListeners(s: AdminStatus) {
  cachedStatus = s;
  listeners.forEach((fn) => fn(s));
}

async function checkAdminSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    notifyListeners("none");
    return;
  }
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", session.user.id)
    .eq("role", "admin")
    .maybeSingle();
  notifyListeners(data ? "admin" : "none");
}

// 앱 시작 시 한번 체크
checkAdminSession();

// 인증 상태 변화 구독 (로그인/로그아웃)
supabase.auth.onAuthStateChange((_event, session) => {
  if (!session) {
    notifyListeners("none");
  } else {
    checkAdminSession();
  }
});

export function useAdminAuth() {
  const [status, setStatus] = useState<AdminStatus>(cachedStatus);

  useEffect(() => {
    setStatus(cachedStatus);
    listeners.push(setStatus);
    return () => {
      listeners = listeners.filter((fn) => fn !== setStatus);
    };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    notifyListeners("none");
  }, []);

  return {
    isAdmin: status === "admin",
    isLoading: status === "loading",
    logout,
  };
}
