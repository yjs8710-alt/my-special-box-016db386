import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { address, property_id } = await req.json();

    console.log("🔍 [property-summary] 요청:", { address, property_id });

    if (!address && !property_id) {
      return new Response(
        JSON.stringify({ error: "address 또는 property_id가 필요합니다" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // property_id가 있으면 우선 사용, 없으면 address로 properties 테이블에서 조회
    let pid = property_id;
    let propertyAddress = address;

    if (!pid && address) {
      const { data: prop } = await supabase
        .from("properties")
        .select("id, address, dong, lot_number")
        .ilike("address", `%${address}%`)
        .limit(1)
        .maybeSingle();

      if (prop) {
        pid = prop.id;
        propertyAddress = prop.address;
      }
    }

    console.log("📌 [property-summary] property_id:", pid, "| address:", propertyAddress);

    // building_summary, land_summary 조회
    const [bRes, lRes] = await Promise.all([
      pid
        ? supabase.from("building_summary").select("*").eq("property_id", pid).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      pid
        ? supabase.from("land_summary").select("*").eq("property_id", pid).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    console.log("📦 [building_summary]:", bRes.data ? "데이터 있음" : "없음", bRes.error?.message ?? "");
    console.log("🌍 [land_summary]:", lRes.data ? "데이터 있음" : "없음", lRes.error?.message ?? "");

    const result = {
      property_id: pid ?? null,
      address: propertyAddress ?? address,
      building_summary: bRes.data ?? null,
      land_summary: lRes.data ?? null,
      has_building: bRes.data !== null,
      has_land: lRes.data !== null,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("❌ [property-summary] 오류:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
