import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── 국토교통부 건축물대장 API (data.go.kr) ──────────────────────────────────
const BUILDING_API_BASE = "http://apis.data.go.kr/1613000/BldRgstHubService";

/**
 * 주소 → 시군구코드 + 법정동코드 + 지번 파싱
 * 예) "충북 청주시 서원구 사직동 358-5"
 *    → { sigunguCd: "43113", bjdongCd: "43113116", bun: "0358", ji: "0005" }
 */
function parseKoreanAddress(address: string) {
  // 충청북도/충북 → 43
  // 청주시 서원구 → 43113
  // 청주시 청원구 → 43114
  // 청주시 상당구 → 43111
  // 청주시 흥덕구 → 43112

  const sigunguMap: Record<string, string> = {
    "청주시 상당구": "43111",
    "청주시 흥덕구": "43112",
    "청주시 서원구": "43113",
    "청주시 청원구": "43114",
    "청원군": "43720",
    "충주시": "43130",
    "제천시": "43150",
    "보은군": "43720",
    "옥천군": "43730",
    "영동군": "43740",
    "증평군": "43745",
    "진천군": "43750",
    "괴산군": "43760",
    "음성군": "43770",
    "단양군": "43800",
  };

  // 동 코드 매핑 (청주시 서원구 주요 동)
  const bjdongMap: Record<string, string> = {
    "사직동": "43113116",
    "사창동": "43113113",
    "산남동": "43113114",
    "분평동": "43113115",
    "수곡동": "43113117",
    "성화동": "43113104",
    "개신동": "43113103",
    "죽림동": "43113118",
    "남이면": "43113380",
    "모충동": "43113111",
    "용암동": "43111107",
    "내덕동": "43111104",
    "율량동": "43111108",
    "방서동": "43111109",
    "운동동": "43111110",
    "오근장동": "43111111",
    "송정동": "43112109",
    "복대동": "43112110",
    "가경동": "43112107",
    "강서동": "43112108",
    "봉명동": "43112105",
    "사직동흥덕구": "43112111",
    "신봉동": "43112113",
    "옥산면": "43114350",
    "내수읍": "43114250",
    "북이면": "43114390",
  };

  // 시군구 코드 추출
  let sigunguCd = "";
  for (const [key, code] of Object.entries(sigunguMap)) {
    if (address.includes(key)) {
      sigunguCd = code;
      break;
    }
  }

  // 법정동 코드 추출
  let bjdongCd = "";
  for (const [dong, code] of Object.entries(bjdongMap)) {
    if (address.includes(dong.replace("흥덕구", "").replace("서원구", ""))) {
      bjdongCd = code;
      break;
    }
  }

  // 지번 파싱 (예: 358-5 → bun=0358, ji=0005)
  const lotMatch = address.match(/(\d+)(?:-(\d+))?(?:\s*$)/);
  let bun = "0000";
  let ji = "0000";
  if (lotMatch) {
    bun = lotMatch[1].padStart(4, "0");
    ji = (lotMatch[2] || "0").padStart(4, "0");
  }

  console.log("🗺️ [주소 파싱]", { address, sigunguCd, bjdongCd, bun, ji });
  return { sigunguCd, bjdongCd, bun, ji };
}

/**
 * 건축물대장 표제부 조회 (getBrTitleInfo)
 * 건물명, 주용도, 연면적, 사용승인일, 층수, 주차, 엘리베이터 등
 */
async function fetchBuildingTitle(
  sigunguCd: string,
  bjdongCd: string,
  bun: string,
  ji: string,
  apiKey: string
) {
  const params = new URLSearchParams({
    serviceKey: apiKey,
    sigunguCd,
    bjdongCd,
    bun,
    ji,
    numOfRows: "10",
    pageNo: "1",
    _type: "json",
  });

  const url = `${BUILDING_API_BASE}/getBrTitleInfo?${params}`;
  console.log("🏢 [건축물대장 표제부 API 호출]", url.replace(apiKey, "***"));

  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log("🏢 [건축물대장 표제부 응답 원문]", text.substring(0, 500));

    const data = JSON.parse(text);
    const items = data?.response?.body?.items?.item;
    if (!items) return null;

    const item = Array.isArray(items) ? items[0] : items;
    return item;
  } catch (e) {
    console.error("❌ [건축물대장 표제부 오류]", e);
    return null;
  }
}

/**
 * 건축물대장 기본개요 조회 (getBrBasisOulnInfo)
 * 건물 기본 정보
 */
async function fetchBuildingBasic(
  sigunguCd: string,
  bjdongCd: string,
  bun: string,
  ji: string,
  apiKey: string
) {
  const params = new URLSearchParams({
    serviceKey: apiKey,
    sigunguCd,
    bjdongCd,
    bun,
    ji,
    numOfRows: "10",
    pageNo: "1",
    _type: "json",
  });

  const url = `${BUILDING_API_BASE}/getBrBasisOulnInfo?${params}`;
  console.log("📋 [건축물대장 기본개요 API 호출]", url.replace(apiKey, "***"));

  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log("📋 [건축물대장 기본개요 응답 원문]", text.substring(0, 500));

    const data = JSON.parse(text);
    const items = data?.response?.body?.items?.item;
    if (!items) return null;

    const item = Array.isArray(items) ? items[0] : items;
    return item;
  } catch (e) {
    console.error("❌ [건축물대장 기본개요 오류]", e);
    return null;
  }
}

/**
 * 층별 개요 조회 (getBrFlrOulnInfo)
 */
async function fetchBuildingFloors(
  sigunguCd: string,
  bjdongCd: string,
  bun: string,
  ji: string,
  apiKey: string
) {
  const params = new URLSearchParams({
    serviceKey: apiKey,
    sigunguCd,
    bjdongCd,
    bun,
    ji,
    numOfRows: "20",
    pageNo: "1",
    _type: "json",
  });

  const url = `${BUILDING_API_BASE}/getBrFlrOulnInfo?${params}`;
  console.log("🏗️ [층별 개요 API 호출]", url.replace(apiKey, "***"));

  try {
    const res = await fetch(url);
    const text = await res.text();
    const data = JSON.parse(text);
    const items = data?.response?.body?.items?.item;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  } catch (e) {
    console.error("❌ [층별 개요 오류]", e);
    return [];
  }
}

/**
 * API 응답 → building_summary 형식으로 변환
 */
function mapBuildingData(titleItem: any, basicItem: any, floorItems: any[]) {
  const item = titleItem || basicItem;
  if (!item) return null;

  // 층수 계산
  const floorsAbove = item.grndFlrCnt ? String(item.grndFlrCnt) : null;
  const floorsBelow = item.ugrndFlrCnt ? String(item.ugrndFlrCnt) : null;

  // 연면적
  const totalArea = item.totArea ? `${Number(item.totArea).toFixed(1)}㎡` : null;
  const buildingArea = item.archArea ? `${Number(item.archArea).toFixed(1)}㎡` : null;
  const landArea = item.platArea ? `${Number(item.platArea).toFixed(1)}㎡` : null;

  // 주용도
  const mainPurpose = item.mainPurpsCdNm || item.etcPurps || null;

  // 사용승인일 (YYYYMMDD → YYYY-MM-DD)
  let approvalDate = null;
  if (item.useAprDay && item.useAprDay.length === 8) {
    approvalDate = `${item.useAprDay.slice(0, 4)}-${item.useAprDay.slice(4, 6)}-${item.useAprDay.slice(6, 8)}`;
  }

  // 건물명
  const buildingName = item.bldNm || item.platGbCd === "0" ? item.bldNm : null;

  // 엘리베이터
  const elevator = (item.elevCnt && Number(item.elevCnt) > 0) ||
    (item.emgElevCnt && Number(item.emgElevCnt) > 0);

  // 주차 대수
  const parkingCount = item.indrMechUtcnt
    ? String(Number(item.indrMechUtcnt || 0) + Number(item.oudrMechUtcnt || 0) + Number(item.indrAutoUtcnt || 0) + Number(item.oudrAutoUtcnt || 0))
    : null;

  return {
    building_name: buildingName || null,
    main_purpose: mainPurpose,
    approval_date: approvalDate,
    land_area: landArea,
    building_area: buildingArea,
    total_area: totalArea,
    floors_above: floorsAbove,
    floors_below: floorsBelow,
    parking_count: parkingCount,
    elevator: !!elevator,
    // 추가 정보 (프론트 표시용)
    _raw: {
      hhldCnt: item.hhldCnt ? String(item.hhldCnt) : null,       // 세대수
      fmlyCnt: item.fmlyCnt ? String(item.fmlyCnt) : null,        // 가구수
      bcRat: item.bcRat ? `${item.bcRat}%` : null,                // 건폐율
      vlRat: item.vlRatEstmTotArea ? null : (item.vlRat ? `${item.vlRat}%` : null), // 용적률
      strctCdNm: item.strctCdNm || null,                          // 구조
      roofCdNm: item.roofCdNm || null,                            // 지붕
      floors: floorItems.map((f) => ({
        flrNo: f.flrNo,
        flrNoNm: f.flrNoNm,
        area: f.area ? `${Number(f.area).toFixed(1)}㎡` : null,
        mainPurpsCdNm: f.mainPurpsCdNm,
      })),
    },
  };
}

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
    const dataGoKrApiKey = Deno.env.get("DATA_GO_KR_API_KEY");

    console.log("🔑 [DATA_GO_KR_API_KEY 로드됨]:", !!dataGoKrApiKey);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── 1. properties 테이블에서 property_id 및 실제 주소 조회 ──
    let pid = property_id;
    let propertyAddress = address;

    if (!pid && address) {
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
      return new Response(
        JSON.stringify({
          property_id: null,
          address,
          building_summary: null,
          land_summary: null,
          has_building: false,
          has_land: false,
          message: "매물 주소를 찾을 수 없습니다.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. DB에서 기존 데이터 조회 ──
    const [bRes, lRes] = await Promise.all([
      supabase.from("building_summary").select("*").eq("property_id", pid).maybeSingle(),
      supabase.from("land_summary").select("*").eq("property_id", pid).maybeSingle(),
    ]);

    let buildingData = bRes.data;
    let landData = lRes.data;

    console.log("📦 [building_summary]:", buildingData ? "DB 데이터 있음" : "없음");
    console.log("🌍 [land_summary]:", landData ? "DB 데이터 있음" : "없음");

    // ── 3. data.go.kr API로 실제 데이터 조회 ──
    if ((!buildingData || !landData) && dataGoKrApiKey) {
      console.log("🌐 [data.go.kr API 조회 시작] 주소:", propertyAddress);

      const { sigunguCd, bjdongCd, bun, ji } = parseKoreanAddress(propertyAddress);

      if (sigunguCd && bjdongCd) {
        // 병렬로 건축물대장 표제부 + 기본개요 + 층별 조회
        const [titleItem, basicItem, floorItems] = await Promise.all([
          fetchBuildingTitle(sigunguCd, bjdongCd, bun, ji, dataGoKrApiKey),
          fetchBuildingBasic(sigunguCd, bjdongCd, bun, ji, dataGoKrApiKey),
          fetchBuildingFloors(sigunguCd, bjdongCd, bun, ji, dataGoKrApiKey),
        ]);

        console.log("📊 [표제부]:", titleItem ? "데이터 있음" : "없음");
        console.log("📊 [기본개요]:", basicItem ? "데이터 있음" : "없음");
        console.log("📊 [층별 개요]:", floorItems.length, "건");

        const mappedBuilding = mapBuildingData(titleItem, basicItem, floorItems);

        // 건축물대장 저장/업데이트
        if (!buildingData) {
          if (mappedBuilding) {
            console.log("✅ [data.go.kr] 건축물대장 실제 데이터 저장");
            const { data: inserted } = await supabase
              .from("building_summary")
              .insert({
                property_id: pid,
                building_name: mappedBuilding.building_name,
                main_purpose: mappedBuilding.main_purpose,
                approval_date: mappedBuilding.approval_date,
                land_area: mappedBuilding.land_area,
                building_area: mappedBuilding.building_area,
                total_area: mappedBuilding.total_area,
                floors_above: mappedBuilding.floors_above,
                floors_below: mappedBuilding.floors_below,
                parking_count: mappedBuilding.parking_count,
                elevator: mappedBuilding.elevator,
              })
              .select()
              .single();

            if (inserted) {
              // _raw 추가 정보 병합
              buildingData = { ...inserted, _raw: mappedBuilding._raw };
            }
          } else {
            // API에서 데이터 없음 → 기본 fallback 저장
            console.log("⚠️ [data.go.kr] 건축물대장 데이터 없음 → 기본 데이터 저장");
            const fallback = {
              property_id: pid,
              building_name: null,
              main_purpose: "조회 결과 없음",
              approval_date: null,
              land_area: null,
              building_area: null,
              total_area: null,
              floors_above: null,
              floors_below: null,
              parking_count: null,
              elevator: false,
            };
            const { data: inserted } = await supabase
              .from("building_summary")
              .insert(fallback)
              .select()
              .single();
            if (inserted) buildingData = inserted;
          }
        }

        // 토지 정보는 건축물대장 표제부의 platArea(대지면적), 법정동 코드에서 추출
        if (!landData) {
          const titleOrBasic = titleItem || basicItem;
          const dong = propertyAddress.match(/([가-힣]+동|[가-힣]+면|[가-힣]+읍)/)?.[1] || "";
          const lotNumber = titleOrBasic
            ? `${dong} ${bun.replace(/^0+/, "")}-${ji.replace(/^0+/, "")}`
            : `${propertyAddress.split(" ").slice(-2, -1)[0] || ""} ${propertyAddress.split(" ").slice(-1)[0] || ""}`;

          const landInsertData = {
            property_id: pid,
            lot_number: lotNumber,
            land_category: titleOrBasic?.lndcgrCdNm || "대",
            land_area: titleOrBasic?.platArea ? `${Number(titleOrBasic.platArea).toFixed(1)}㎡` : null,
            official_price: null,  // 공시지가는 별도 API 필요
            use_zone: titleOrBasic?.mainPurpsCdNm || null,
            road_access: null,
          };

          console.log("🌱 [토지 정보 저장]", landInsertData);
          const { data: insertedLand } = await supabase
            .from("land_summary")
            .insert(landInsertData)
            .select()
            .single();
          if (insertedLand) landData = insertedLand;
        }
      } else {
        console.log("⚠️ [주소 파싱 실패] 시군구코드 또는 법정동코드를 찾을 수 없음");
        // 주소 파싱 실패 → 기본 fallback
        if (!buildingData) {
          const { data: inserted } = await supabase
            .from("building_summary")
            .insert({
              property_id: pid,
              building_name: null,
              main_purpose: null,
              approval_date: null,
              land_area: null,
              building_area: null,
              total_area: null,
              floors_above: null,
              floors_below: null,
              parking_count: null,
              elevator: false,
            })
            .select()
            .single();
          if (inserted) buildingData = inserted;
        }

        if (!landData) {
          const propDetail = await supabase
            .from("properties")
            .select("dong, lot_number")
            .eq("id", pid)
            .maybeSingle();

          const { data: inserted } = await supabase
            .from("land_summary")
            .insert({
              property_id: pid,
              lot_number: `${propDetail.data?.dong || ""} ${propDetail.data?.lot_number || ""}`.trim() || null,
              land_category: null,
              land_area: null,
              official_price: null,
              use_zone: null,
              road_access: null,
            })
            .select()
            .single();
          if (inserted) landData = inserted;
        }
      }
    } else if (!buildingData || !landData) {
      // API 키 없음 → 기본 fallback
      console.log("⚠️ [DATA_GO_KR_API_KEY 없음] 기본 데이터로 대체");

      if (!buildingData) {
        const { data: inserted } = await supabase
          .from("building_summary")
          .insert({
            property_id: pid,
            building_name: null,
            main_purpose: null,
            approval_date: null,
            land_area: null,
            building_area: null,
            total_area: null,
            floors_above: null,
            floors_below: null,
            parking_count: null,
            elevator: false,
          })
          .select()
          .single();
        if (inserted) buildingData = inserted;
      }

      if (!landData) {
        const propDetail = await supabase
          .from("properties")
          .select("dong, lot_number")
          .eq("id", pid)
          .maybeSingle();

        const { data: inserted } = await supabase
          .from("land_summary")
          .insert({
            property_id: pid,
            lot_number: `${propDetail.data?.dong || ""} ${propDetail.data?.lot_number || ""}`.trim() || null,
            land_category: null,
            land_area: null,
            official_price: null,
            use_zone: null,
            road_access: null,
          })
          .select()
          .single();
        if (inserted) landData = inserted;
      }
    }

    // ── 4. 최종 응답 ──
    const result = {
      property_id: pid,
      address: propertyAddress ?? address,
      building_summary: buildingData ?? null,
      land_summary: landData ?? null,
      has_building: buildingData !== null,
      has_land: landData !== null,
      data_source: dataGoKrApiKey ? "data.go.kr" : "fallback",
    };

    console.log("📤 [property-summary] 응답:", {
      has_building: result.has_building,
      has_land: result.has_land,
      data_source: result.data_source,
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
