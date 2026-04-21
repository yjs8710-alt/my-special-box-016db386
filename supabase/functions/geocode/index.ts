const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function searchKakao(query: string, apiKey: string) {
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`;
  console.log("[geocode] Trying:", url);
  const res = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
      "KA": "sdk/1.0.0 os/web origin/https://lovable.app",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.documents?.length > 0 ? data.documents[0] : null;
}

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── JWT 인증 검증 ────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const _userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: _claimsData, error: _claimsErr } = await _userClient.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (_claimsErr || !_claimsData?.claims) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const kakaoApiKey = Deno.env.get("KAKAO_API_KEY");
    console.log("[geocode] KAKAO_API_KEY loaded:", !!kakaoApiKey);

    if (!kakaoApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Kakao API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const address = body?.address?.trim();

    if (!address) {
      return new Response(
        JSON.stringify({ success: false, error: "address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 폴백 전략: 여러 형식으로 순차 검색
    // 1) 원본 주소 그대로
    // 2) "충북 " 제거 (충청북도 생략)
    // 3) "청주시 " 앞 다 제거 → "청주시 XX구 XX동 번지"
    // 4) "XX구 XX동 번지" 만
    const candidates: string[] = [address];

    // "충북 청주시 서원구 사창동 1396" → 앞부분 축약 시도
    const withoutChungbuk = address.replace(/^충북\s*/, "");
    if (withoutChungbuk !== address) candidates.push(withoutChungbuk);

    // "청주시 ..." 만 남기기
    const cheongJuMatch = address.match(/(청주시\s+.+)/);
    if (cheongJuMatch) {
      const shorter = cheongJuMatch[1];
      if (!candidates.includes(shorter)) candidates.push(shorter);
    }

    // 구+동+번지 만 남기기 (예: "서원구 사창동 1396")
    const guDongMatch = address.match(/([가-힣]+구\s+[가-힣]+동\s+[\d-]+)/);
    if (guDongMatch) {
      const shorter = guDongMatch[1];
      if (!candidates.includes(shorter)) candidates.push(shorter);
    }

    // 동+번지 만 남기기 (예: "사창동 1396")
    const dongMatch = address.match(/([가-힣]+동\s+[\d-]+)/);
    if (dongMatch) {
      const shorter = "청주시 " + dongMatch[1];
      if (!candidates.includes(shorter)) candidates.push(shorter);
    }

    // 도로명 주소 폴백: "XX로 123" 또는 "XX길 123" 패턴에 "청주시" 붙이기
    const roadMatch = address.match(/([가-힣0-9]+(?:로|길)\s*[\d-]+(?:번길\s*[\d-]+)?)/);
    if (roadMatch) {
      const roadOnly = roadMatch[1];
      if (!candidates.includes(roadOnly)) candidates.push(roadOnly);
      const withCity = "청주시 " + roadOnly;
      if (!candidates.includes(withCity)) candidates.push(withCity);
      const withFull = "충북 청주시 " + roadOnly;
      if (!candidates.includes(withFull)) candidates.push(withFull);
    }

    console.log("[geocode] Fallback candidates:", candidates);

    let first = null;
    for (const candidate of candidates) {
      first = await searchKakao(candidate, kakaoApiKey);
      if (first) {
        console.log("[geocode] Found result with query:", candidate);
        break;
      }
    }

    if (!first) {
      console.log("[geocode] No results for any candidate");
      return new Response(
        JSON.stringify({ success: false, error: "No results found for the given address" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lat = parseFloat(first.y);
    const lng = parseFloat(first.x);
    const roadAddress = first.road_address?.address_name ?? "";
    const jibunAddress = first.address?.address_name ?? "";

    console.log("[geocode] Success:", lat, lng);
    return new Response(
      JSON.stringify({ success: true, lat, lng, roadAddress, jibunAddress }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[geocode] Exception:", String(e));
    return new Response(
      JSON.stringify({ success: false, error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
