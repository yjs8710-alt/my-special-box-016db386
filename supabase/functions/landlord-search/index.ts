import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 로컬 JWT 검증
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;

    // 서비스 키 클라이언트
    const adminClient = createClient(supabaseUrl, serviceKey);

    // admin 또는 승인된 중개사인지 확인
    const [roleRes, profileRes] = await Promise.all([
      adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle(),
      adminClient
        .from("agent_profiles")
        .select("status, is_active")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const isAdmin = !!roleRes.data;
    const isApprovedAgent =
      profileRes.data?.status === "approved" && profileRes.data?.is_active === true;

    if (!isAdmin && !isApprovedAgent) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { q } = await req.json();
    if (!q || typeof q !== "string" || q.trim().length < 1) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const keyword = q.trim();

    // 모든 매물 조회 (status 무관 — 숨김/종료 포함)
    const [propRes, contactRes] = await Promise.all([
      adminClient
        .from("properties")
        .select("id, title, building_name, address, floor, area, monthly, deposit, images, note, agent_name, dong, lot_number, status, type, build_year, total_floors, available_from, room_type, unit_number")
        .or(`address.ilike.%${keyword}%,building_name.ilike.%${keyword}%,title.ilike.%${keyword}%,dong.ilike.%${keyword}%,lot_number.ilike.%${keyword}%`)
        .limit(30),
      adminClient
        .from("cheongju_contacts")
        .select("id, district, dong, lot_number, unit_number, phone, contact_owner, contact_manager, contact_broker, memo, is_visible, building_name")
        .or(`dong.ilike.%${keyword}%,lot_number.ilike.%${keyword}%,building_name.ilike.%${keyword}%`)
        .limit(60),
    ]);

    const results: object[] = [];

    function parseContact(noteStr: string, key: string): string {
      const m = noteStr.match(new RegExp(`${key}[:\\s]+([0-9\\-]+)`));
      return m ? m[1].trim() : "";
    }

    if (!propRes.error && propRes.data) {
      for (const row of propRes.data) {
        const noteStr = row.note ?? row.agent_name ?? "";
        const owner = parseContact(noteStr, "건물주");
        const manager = parseContact(noteStr, "관리인");
        const broker = parseContact(noteStr, "부동산");
        if (!owner && !manager && !broker) continue;
        results.push({
          id: `prop_${row.id}`,
          source: "property",
          status: row.status,
          label: row.building_name ?? row.title,
          sublabel: row.address,
          badge: [row.floor, row.area ? `${row.area}㎡` : ""].filter(Boolean).join(" · "),
          price: row.monthly ? `${row.deposit ? row.deposit + "/" : ""}${row.monthly}만` : undefined,
          images: Array.isArray(row.images) ? row.images : [],
          contactOwner: owner,
          contactManager: manager,
          contactBroker: broker,
          floor: row.floor ?? undefined,
          area: row.area ?? undefined,
          deposit: row.deposit ?? undefined,
          monthly: row.monthly ?? undefined,
          type: row.room_type ?? row.type ?? undefined,
          buildYear: row.build_year ?? undefined,
          totalFloors: row.total_floors ?? undefined,
          availableFrom: row.available_from ?? undefined,
          note: row.note ?? undefined,
          unitNumber: row.unit_number ?? undefined,
        });
      }
    }

    // 매물 결과 중 실제로 소유주/관리인/부동산 연락처가 파싱된 (동+지번+호수)만 dedupe key로 사용
    // — 그렇지 않으면 705호처럼 매물엔 연락처가 없는데 청주연락처는 있어도 검색결과에서 사라짐
    const propKeys = new Set(
      results
        .filter((r: any) => r.source === "property" && (r.contactOwner || r.contactManager || r.contactBroker))
        .map((r: any) => {
          const row = (propRes.data ?? []).find((p) => `prop_${p.id}` === r.id);
          return row ? `${row.dong}_${row.lot_number}_${row.unit_number ?? ""}` : "";
        })
    );

    if (!contactRes.error && contactRes.data) {
      for (const row of contactRes.data) {
        const owner = row.contact_owner ?? row.phone ?? "";
        const manager = row.contact_manager ?? "";
        const broker = row.contact_broker ?? "";
        if (!owner && !manager && !broker) continue;
        const key = `${row.dong}_${row.lot_number}_${row.unit_number ?? ""}`;
        if (propKeys.has(key)) continue;
        const baseAddr = row.lot_number ? `${row.dong} ${row.lot_number}` : row.dong;
        const addrLabel = row.unit_number ? `${baseAddr} ${row.unit_number}호` : baseAddr;
        results.push({
          id: `contact_${row.id}`,
          source: "contact",
          isVisible: row.is_visible,
          label: row.building_name || addrLabel,
          sublabel: `청주시 ${row.district} ${addrLabel}`,
          contactOwner: owner,
          contactManager: manager,
          contactBroker: broker,
          unitNumber: row.unit_number ?? undefined,
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[landlord-search] error:", e);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
