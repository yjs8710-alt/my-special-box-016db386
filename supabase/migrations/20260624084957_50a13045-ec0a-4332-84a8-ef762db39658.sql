
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS landlord_phone text;
REVOKE SELECT (landlord_phone) ON public.properties FROM anon;
COMMENT ON COLUMN public.properties.landlord_phone IS '임대인(소유주) 연락처 - 비공개. 비로그인 사용자에게 노출 금지.';
