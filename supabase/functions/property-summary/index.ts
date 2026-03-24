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

    // ── 1. properties 테이블에서 property_id 및 실제 주소 조회 ──
    let pid = property_id;
    let propertyAddress = address;

    if (!pid && address) {
      // 정확히 일치하는 주소 우선, 없으면 ilike 검색
      const { data: exactProp } = await supabase
        .from("properties")
        .select("id, address, dong, lot_number")
        .eq("address", address)
        .limit(1)
        .maybeSingle();

      if (exactProp) {
        pid = exactProp.id;
        propertyAddress = exactProp.address;
      } else {
        const { data: likeProp } = await supabase
          .from("properties")
          .select("id, address, dong, lot_number")
          .ilike("address", `%${address}%`)
          .limit(1)
          .maybeSingle();

        if (likeProp) {
          pid = likeProp.id;
          propertyAddress = likeProp.address;
          if (propertyAddress !== address) {
            console.log("⚠️ [주소 불일치] 요청:", address, "| DB:", propertyAddress);
          }
        }
      }
    }

    console.log("📌 [property-summary] property_id:", pid, "| address:", propertyAddress);

    if (!pid) {
      console.log("❌ [property-summary] properties 테이블에서 매물을 찾을 수 없음:", address);
      return new Response(
        JSON.stringify({
          property_id: null,
          address: address,
          building_summary: null,
          land_summary: null,
          has_building: false,
          has_land: false,
          message: "매물 주소를 찾을 수 없습니다.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. building_summary, land_summary 조회 ──
    const [bRes, lRes] = await Promise.all([
      supabase.from("building_summary").select("*").eq("property_id", pid).maybeSingle(),
      supabase.from("land_summary").select("*").eq("property_id", pid).maybeSingle(),
    ]);

    console.log("📦 [building_summary]:", bRes.data ? "데이터 있음" : "없음", bRes.error?.message ?? "");
    console.log("🌍 [land_summary]:", lRes.data ? "데이터 있음" : "없음", lRes.error?.message ?? "");

    let buildingData = bRes.data;
    let landData = lRes.data;

    // ── 3. 데이터 없으면 테스트 데이터 생성 및 저장 ──
    if (!buildingData) {
      console.log("🏗️ [property-summary] building_summary 데이터 없음 → 테스트 데이터 생성");

      const newBuilding = {
        property_id: pid,
        building_name: propertyAddress.split(" ").slice(-2).join(" ") + " 건물",
        main_purpose: "제2종근린생활시설",
        approval_date: "2010-05-01",
        land_area: "285.0㎡",
        building_area: "198.5㎡",
        total_area: "423.7㎡",
        floors_above: "5",
        floors_below: "1",
        parking_count: "8",
        elevator: false,
      };

      const { data: insertedBuilding, error: buildingInsertErr } = await supabase
        .from("building_summary")
        .insert(newBuilding)
        .select()
        .single();

      if (buildingInsertErr) {
        console.error("❌ [building_summary insert 오류]:", buildingInsertErr.message);
      } else {
        buildingData = insertedBuilding;
        console.log("✅ [building_summary] 테스트 데이터 저장 완료");
      }
    }

    if (!landData) {
      console.log("🌱 [property-summary] land_summary 데이터 없음 → 테스트 데이터 생성");

      // dong, lot_number를 properties 테이블에서 조회
      const { data: propDetail } = await supabase
        .from("properties")
        .select("dong, lot_number")
        .eq("id", pid)
        .maybeSingle();

      const lotNumber = propDetail?.lot_number || "35-9";
      const dong = propDetail?.dong || propertyAddress.split(" ").slice(-2, -1)[0] || "";

      const newLand = {
        property_id: pid,
        lot_number: `${dong} ${lotNumber}`,
        land_category: "대",
        land_area: "285.0㎡",
        official_price: "1,250,000원/㎡",
        use_zone: "제2종일반주거지역",
        road_access: "소로한면",
      };

      const { data: insertedLand, error: landInsertErr } = await supabase
        .from("land_summary")
        .insert(newLand)
        .select()
        .single();

      if (landInsertErr) {
        console.error("❌ [land_summary insert 오류]:", landInsertErr.message);
      } else {
        landData = insertedLand;
        console.log("✅ [land_summary] 테스트 데이터 저장 완료");
      }
    }

    // ── 4. 최종 응답 반환 ──
    const result = {
      property_id: pid,
      address: propertyAddress ?? address,
      building_summary: buildingData ?? null,
      land_summary: landData ?? null,
      has_building: buildingData !== null,
      has_land: landData !== null,
    };

    console.log("📤 [property-summary] 응답:", {
      has_building: result.has_building,
      has_land: result.has_land,
    });

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
