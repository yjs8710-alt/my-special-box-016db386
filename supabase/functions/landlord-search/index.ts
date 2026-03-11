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
        .select("id, title, building_name, address, floor, area, monthly, deposit, images, note, agent_name, dong, lot_number, status, type, build_year, total_floors, available_from, room_type")
        .or(`address.ilike.%${keyword}%,building_name.ilike.%${keyword}%,title.ilike.%${keyword}%,dong.ilike.%${keyword}%,note.ilike.%${keyword}%,lot_number.ilike.%${keyword}%`)
        .limit(30),
      adminClient
        .from("cheongju_contacts")
        .select("id, district, dong, lot_number, phone, contact_owner, contact_manager, contact_broker, memo, is_visible")
        .or(`dong.ilike.%${keyword}%,lot_number.ilike.%${keyword}%,contact_owner.ilike.%${keyword}%,contact_manager.ilike.%${keyword}%,contact_broker.ilike.%${keyword}%,phone.ilike.%${keyword}%`)
        .limit(30),
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
        });
      }
    }

    const propDongLots = new Set(
      (propRes.data ?? []).map((r) => `${r.dong}_${r.lot_number}`)
    );

    if (!contactRes.error && contactRes.data) {
      for (const row of contactRes.data) {
        const owner = row.contact_owner ?? row.phone ?? "";
        const manager = row.contact_manager ?? "";
        const broker = row.contact_broker ?? "";
        if (!owner && !manager && !broker) continue;
        const key = `${row.dong}_${row.lot_number}`;
        if (propDongLots.has(key)) continue;
        const addrLabel = row.lot_number ? `${row.dong} ${row.lot_number}` : row.dong;
        results.push({
          id: `contact_${row.id}`,
          source: "contact",
          isVisible: row.is_visible,
          label: addrLabel,
          sublabel: `청주시 ${row.district} ${row.dong}`,
          contactOwner: owner,
          contactManager: manager,
          contactBroker: broker,
        });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
