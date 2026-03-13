const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get("NAVER_CLIENT_ID");
    const clientSecret = Deno.env.get("NAVER_CLIENT_SECRET");

    // 1. 환경변수 로드 여부 로그
    console.log("[geocode] NAVER_CLIENT_ID loaded:", !!clientId);
    console.log("[geocode] NAVER_CLIENT_SECRET loaded:", !!clientSecret);
    if (clientId) {
      console.log("[geocode] NAVER_CLIENT_ID prefix:", clientId.substring(0, 6) + "...");
    }

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "Naver API credentials not configured" }),
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

    // 2. 정확한 URL 확인
    const url = `https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`;
    console.log("[geocode] Request URL:", url);

    // 3. 정확한 헤더 이름 확인
    const requestHeaders = {
      "X-NCP-APIGW-API-KEY-ID": clientId,
      "X-NCP-APIGW-API-KEY": clientSecret,
    };
    console.log("[geocode] Using headers: X-NCP-APIGW-API-KEY-ID, X-NCP-APIGW-API-KEY");

    const naverRes = await fetch(url, { headers: requestHeaders });

    // 4. 응답 status 로그
    console.log("[geocode] Naver API response status:", naverRes.status);

    const responseText = await naverRes.text();
    // 5. 응답 body 로그
    console.log("[geocode] Naver API response body:", responseText);

    if (!naverRes.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Naver API error: ${naverRes.status}`, body: responseText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(responseText);
    const addresses = data?.addresses;

    if (!addresses || addresses.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No results found for the given address" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const first = addresses[0];
    const lat = parseFloat(first.y);
    const lng = parseFloat(first.x);
    const roadAddress = first.roadAddress ?? "";
    const jibunAddress = first.jibunAddress ?? "";

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
