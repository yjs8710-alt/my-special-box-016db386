import { useAuth } from "./useAuth";

/**
 * 게스트(비로그인) 여부.
 * 로그인 인증되지 않은 사용자는 일부 민감정보(연락처/호수/비밀번호/로드뷰/도로명/메모)를 볼 수 없다.
 * 상세주소도 동까지만 보여준다.
 */
export function useIsGuest(): boolean {
  const { isAuthorized, isLoading } = useAuth();
  if (isLoading) return true;
  return !isAuthorized;
}

/** 동/읍/면까지만 노출 (예: "충북 청주시 상당구 용암동 123-4" → "용암동") */
export function addressToDong(addr?: string | null): string {
  if (!addr) return "";
  const m = addr.match(/[가-힣]+(동|읍|면|리)/);
  return m ? m[0] : addr;
}
