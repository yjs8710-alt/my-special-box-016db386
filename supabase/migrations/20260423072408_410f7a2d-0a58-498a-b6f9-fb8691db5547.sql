-- 1. agent_profiles에 휴대폰 인증 상태 컬럼 추가
ALTER TABLE public.agent_profiles
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;

-- 2. OTP 임시 저장 테이블
CREATE TABLE IF NOT EXISTS public.phone_otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  code_hash text NOT NULL,
  purpose text NOT NULL DEFAULT 'signup', -- 'signup' | 'login'
  attempts int NOT NULL DEFAULT 0,
  verified boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_phone_otp_phone ON public.phone_otp_codes(phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_otp_expires ON public.phone_otp_codes(expires_at);

ALTER TABLE public.phone_otp_codes ENABLE ROW LEVEL SECURITY;

-- 클라이언트에서 직접 접근 불가 (Edge Function의 service role만 사용)
CREATE POLICY "No direct access to otp codes"
  ON public.phone_otp_codes FOR ALL
  TO authenticated, anon
  USING (false)
  WITH CHECK (false);

-- 관리자만 조회 가능 (디버깅용)
CREATE POLICY "Admins can view otp codes"
  ON public.phone_otp_codes FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. 휴대폰 번호로 사용자가 이미 가입했는지 확인하는 함수
CREATE OR REPLACE FUNCTION public.is_phone_registered(_phone text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agent_profiles
    WHERE regexp_replace(phone, '[^0-9]', '', 'g') = regexp_replace(_phone, '[^0-9]', '', 'g')
  );
$$;