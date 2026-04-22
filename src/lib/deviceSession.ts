// 디바이스 세션 유틸 — 슬롯(모바일/데스크톱)별 단일 디바이스 정책
import { supabase } from "@/integrations/supabase/client";

const DEVICE_ID_KEY = "jipda_device_id_v1";

export type DeviceType = "mobile" | "desktop";

export function getDeviceType(): DeviceType {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  // 모바일/태블릿 판별 (iPad iOS13+ 포함)
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isIpadOS = ua.includes("Macintosh") && (navigator.maxTouchPoints || 0) > 1;
  return isMobileUA || isIpadOS ? "mobile" : "desktop";
}

export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36));
      localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
  } catch {
    return "anon-" + Math.random().toString(36).slice(2);
  }
}

/** 로그인 직후 호출: 같은 슬롯의 기존 디바이스를 밀어내고 본 디바이스를 활성화 */
export async function claimDeviceSlot(): Promise<void> {
  const deviceType = getDeviceType();
  const deviceId = getOrCreateDeviceId();
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
  await supabase.rpc("claim_device_slot", {
    _device_type: deviceType,
    _device_id: deviceId,
    _user_agent: ua,
  });
}

/** 현재 디바이스가 여전히 활성 슬롯의 주인인지 검증 */
export async function verifyDeviceSlot(): Promise<boolean> {
  const deviceType = getDeviceType();
  const deviceId = getOrCreateDeviceId();
  const { data, error } = await supabase.rpc("verify_device_slot", {
    _device_type: deviceType,
    _device_id: deviceId,
  });
  if (error) return true; // 네트워크 오류 시 강제 로그아웃 방지
  return data === true;
}
