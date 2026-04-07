const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function searchKakao(query: string, apiKey: string) {
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
      KA: "sdk/1.0.0 os/web origin/https://lovable.app",
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.documents?.length > 0 ? data.documents[0] : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const kakaoApiKey = Deno.env.get("KAKAO_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!kakaoApiKey || !supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing env" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find properties with road addresses in lot_number
    const listRes = await fetch(
      `${supabaseUrl}/rest/v1/properties?status=eq.active&lot_number=not.like.*-*&lot_number=like.*%EB%A1%9C*&select=id,address,dong,lot_number,note&limit=100`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );
    // Also get properties with "길" in lot_number
    const listRes2 = await fetch(
      `${supabaseUrl}/rest/v1/properties?status=eq.active&lot_number=like.*%EA%B8%B8*&select=id,address,dong,lot_number,note&limit=100`,
      {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      }
    );

    const props1 = listRes.ok ? await listRes.json() : [];
    const props2 = listRes2.ok ? await listRes2.json() : [];
    
    // Deduplicate
    const seen = new Set<string>();
    const allProps = [...props1, ...props2].filter((p: { id: string; lot_number: string }) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      // Only process if lot_number contains Korean road patterns
      return /[가-힣].*(로|길)/.test(p.lot_number);
    });

    console.log(`[convert] Found ${allProps.length} properties with road addresses`);

    const results: { id: string; oldAddress: string; newAddress: string; status: string }[] = [];

    for (const prop of allProps) {
      try {
        // Geocode the road address
        const searchQuery = prop.address || `청주시 ${prop.dong} ${prop.lot_number}`;
        const result = await searchKakao(searchQuery, kakaoApiKey);
        
        if (!result) {
          // Try with just lot_number
          const result2 = await searchKakao(prop.lot_number, kakaoApiKey);
          if (!result2) {
            results.push({ id: prop.id, oldAddress: prop.address, newAddress: "", status: "not_found" });
            continue;
          }
          Object.assign(result, result2);
        }

        const jibunAddress = result?.address?.address_name ?? "";
        const roadAddress = result?.road_address?.address_name ?? prop.lot_number;
        const lat = parseFloat(result.y);
        const lng = parseFloat(result.x);

        if (!jibunAddress) {
          results.push({ id: prop.id, oldAddress: prop.address, newAddress: "", status: "no_jibun" });
          continue;
        }

        // Extract dong and lot from jibun address
        const jibunMatch = jibunAddress.match(/([가-힣]+[동리읍면])\s+([\d-]+)$/);
        if (!jibunMatch) {
          results.push({ id: prop.id, oldAddress: prop.address, newAddress: jibunAddress, status: "parse_fail" });
          continue;
        }

        const newDong = jibunMatch[1];
        const newLot = jibunMatch[2];
        
        // Reconstruct address parts from original
        const districtMatch = prop.address.match(/(청주시\s+[가-힣]+구)/);
        const district = districtMatch ? districtMatch[1] : "";
        const newAddress = ["충북", district, newDong, newLot].filter(Boolean).join(" ");

        // Preserve road address in note
        const noteStr = prop.note ?? "";
        const hasRoadInNote = /도로명[:\s]/.test(noteStr);
        const newNote = hasRoadInNote ? noteStr : [noteStr, `도로명: ${roadAddress}`].filter(Boolean).join("\n");

        // Update the property
        const updateRes = await fetch(
          `${supabaseUrl}/rest/v1/properties?id=eq.${prop.id}`,
          {
            method: "PATCH",
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
              "Content-Type": "application/json",
              Prefer: "return=minimal",
            },
            body: JSON.stringify({
              address: newAddress,
              dong: newDong,
              lot_number: newLot,
              lat: lat || undefined,
              lng: lng || undefined,
              note: newNote,
            }),
          }
        );

        results.push({
          id: prop.id,
          oldAddress: prop.address,
          newAddress,
          status: updateRes.ok ? "converted" : "update_fail",
        });

        // Rate limit - wait 200ms between geocode calls
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        results.push({ id: prop.id, oldAddress: prop.address, newAddress: "", status: `error: ${e}` });
      }
    }

    const converted = results.filter((r) => r.status === "converted").length;
    console.log(`[convert] Done: ${converted}/${allProps.length} converted`);

    return new Response(
      JSON.stringify({ total: allProps.length, converted, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
