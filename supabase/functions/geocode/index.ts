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

    const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
    console.log("[geocode] Kakao request URL:", url);

    const kakaoRes = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${kakaoApiKey}`,
      },
    });

    console.log("[geocode] Kakao API response status:", kakaoRes.status);

    const responseText = await kakaoRes.text();
    console.log("[geocode] Kakao API response body:", responseText);

    if (!kakaoRes.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Kakao API error: ${kakaoRes.status}`, body: responseText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = JSON.parse(responseText);
    const documents = data?.documents;

    if (!documents || documents.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No results found for the given address" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const first = documents[0];
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
