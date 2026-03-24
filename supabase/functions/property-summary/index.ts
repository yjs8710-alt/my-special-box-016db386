import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUILDING_API_BASE = "http://apis.data.go.kr/1613000/BldRgstHubService";
const LAND_PRICE_API_BASE = "http://apis.data.go.kr/1611000/nsdi/LandPriceService/wfs";

// ── 충청북도 시군구 코드 ──────────────────────────────────────────────────
const SIGUNGU_MAP: Record<string, string> = {
  "청주시 상당구": "43111",
  "청주시 흥덕구": "43112",
  "청주시 서원구": "43113",
  "청주시 청원구": "43114",
  "충주시":        "43130",
  "제천시":        "43150",
  "보은군":        "43720",
  "옥천군":        "43730",
  "영동군":        "43740",
  "증평군":        "43745",
  "진천군":        "43750",
  "괴산군":        "43760",
  "음성군":        "43770",
  "단양군":        "43800",
  "청원군":        "43710",
};

// ── 충청북도 전체 법정동 코드 (8자리) ────────────────────────────────────
// 형식: 시도(2)+시군구(3)+읍면동(3) = 8자리
const BJDONG_MAP: Record<string, string> = {
  // ── 청주시 상당구 ──
  "중앙동":     "43111101",
  "북문로1가":  "43111102",
  "북문로2가":  "43111103",
  "내덕동":     "43111104",
  "우암동":     "43111105",
  "금천동":     "43111106",
  "용암동":     "43111107",
  "율량동":     "43111108",
  "방서동":     "43111109",
  "운동동":     "43111110",
  "오근장동":   "43111111",
  "산성동":     "43111112",
  "영운동":     "43111113",
  "용정동":     "43111114",
  "명암동":     "43111115",
  "탑대성동":   "43111116",
  "대성동":     "43111116",
  "수동":       "43111117",
  "문화동":     "43111118",
  "탑동":       "43111119",
  "남일면":     "43111350",
  "가덕면":     "43111370",
  "낭성면":     "43111390",
  "미원면":     "43111410",
  "문의면":     "43111430",
  "현도면":     "43111450",
  // ── 청주시 흥덕구 ──
  "강서동":     "43112108",
  "가경동":     "43112107",
  "복대동":     "43112110",
  "봉명동":     "43112105",
  "송정동":     "43112109",
  "신봉동":     "43112113",
  "원평동":     "43112112",
  "운천동":     "43112111",
  "수곡1동":    "43112114",
  "수곡2동":    "43112115",
  "오송읍":     "43112250",
  "옥산면":     "43112350",
  "오창읍":     "43112210",
  "강내면":     "43112380",
  "강외면":     "43112410",
  "부용면":     "43112430",
  // ── 청주시 서원구 ──
  "개신동":     "43113103",
  "성화동":     "43113104",
  "죽림동":     "43113118",
  "사창동":     "43113113",
  "산남동":     "43113114",
  "분평동":     "43113115",
  "사직동":     "43113116",
  "수곡동":     "43113117",
  "모충동":     "43113111",
  "남이면":     "43113380",
  "문의면":     "43113430",
  // ── 청주시 청원구 ──
  "내수읍":     "43114250",
  "오창읍":     "43114210",
  "북이면":     "43114390",
  "옥산면":     "43114350",
  "오동동":     "43114101",
  "우암동_청원": "43114102",
  "율량동_청원": "43114103",
  "주중동":     "43114104",
  "주성동":     "43114105",
  "우산동":     "43114106",
  "향정동":     "43114107",
  "외남동":     "43114108",
  "사천동":     "43114109",
  "외평동":     "43114110",
  "외하동":     "43114111",
  "내덕1동_청원":"43114112",
  "내덕2동_청원":"43114113",
  "영운동_청원": "43114114",
  "용암동_청원": "43114115",
  // ── 충주시 ──
  "교현동":     "43130101",
  "연수동":     "43130102",
  "용산동":     "43130103",
  "지현동":     "43130104",
  "충인동":     "43130105",
  "문화동_충주": "43130106",
  "호암동":     "43130107",
  "달천동":     "43130108",
  "봉방동":     "43130109",
  "칠금동":     "43130110",
  "금릉동":     "43130111",
  "목행동":     "43130112",
  "용탄동":     "43130113",
  // ── 제천시 ──
  "명동_제천":  "43150101",
  "중앙로1가":  "43150102",
  "청전동":     "43150103",
  "화산동":     "43150104",
  "하소동":     "43150105",
  "신백동":     "43150106",
};

// ── 주소 파싱 → 시군구코드, 법정동코드, 지번 ─────────────────────────
function parseKoreanAddress(address: string): {
  sigunguCd: string;
  bjdongCd: string;
  bun: string;
  ji: string;
  pnu: string;
} {
  let sigunguCd = "";
  for (const [key, code] of Object.entries(SIGUNGU_MAP)) {
    if (address.includes(key)) {
      sigunguCd = code;
      break;
    }
  }

  // 법정동 코드 — 가장 긴 매핑 키부터 우선 매칭 (중복 방지)
  let bjdongCd = "";
  const sortedKeys = Object.keys(BJDONG_MAP).sort((a, b) => b.length - a.length);
  for (const dong of sortedKeys) {
    // _청원 _충주 같은 suffix 제거 후 비교
    const baseDong = dong.replace(/_[가-힣]+$/, "");
    if (address.includes(baseDong)) {
      bjdongCd = BJDONG_MAP[dong];
      // 시군구 코드가 일치하는지 확인
      if (sigunguCd && !bjdongCd.startsWith(sigunguCd)) continue;
      break;
    }
  }

  // 지번 파싱: 마지막 숫자(-숫자) 패턴
  const lotMatch = address.match(/(\d+)(?:-(\d+))?(?:\s*(?:번지)?)?\s*$/);
  let bun = "0000";
  let ji = "0000";
  if (lotMatch) {
    bun = lotMatch[1].padStart(4, "0");
    ji = (lotMatch[2] || "0").padStart(4, "0");
  }

  // PNU(필지고유번호) = 법정동코드10자리 + 지목코드1 + 본번4 + 부번4
  // 법정동코드 8자리 → 10자리: 뒤에 "00" 추가
  const bjdong10 = bjdongCd ? bjdongCd.padEnd(10, "0") : "";
  const pnu = bjdong10 ? `${bjdong10}1${bun}${ji}` : "";

  console.log("🗺️ [주소 파싱]", { address, sigunguCd, bjdongCd, bun, ji, pnu });
  return { sigunguCd, bjdongCd, bun, ji, pnu };
}

// ── 표준공시지가 API (getStdLandPriceInfo) ──────────────────────────────
async function fetchStdLandPrice(pnu: string, apiKey: string): Promise<string | null> {
  if (!pnu) return null;

  const currentYear = new Date().getFullYear();

  // serviceKey는 URLSearchParams를 통한 자동 인코딩 대신 수동으로 직접 붙임
  // (+ 등 특수문자가 %2B로 인코딩되면 data.go.kr에서 "Unexpected errors" 반환)
  const encodedKey = encodeURIComponent(apiKey);

  // 최근 3개년 순서로 시도 (가장 최신 공시지가 확보)
  for (const year of [currentYear, currentYear - 1, currentYear - 2]) {
    const params = new URLSearchParams({
      pnu,
      stdrYear: String(year),
      numOfRows: "1",
      pageNo: "1",
      _type: "json",
    });

    const url = `${LAND_PRICE_API_BASE}/getStdLandPriceInfo?serviceKey=${encodedKey}&${params}`;
    console.log(`💰 [표준공시지가 API ${year}년 호출] PNU:${pnu}`);

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const text = await res.text();
      console.log(`💰 [공시지가 ${year}년 응답]`, text.substring(0, 400));

      const data = JSON.parse(text);
      const items = data?.response?.body?.items?.item;
      if (!items) continue;

      const item = Array.isArray(items) ? items[0] : items;
      if (!item) continue;

      // 공시지가 필드: pblntfPclnd (원/㎡)
      const price = item.pblntfPclnd ?? item.landPrice ?? item.stdPrice;
      if (price != null && price !== "" && Number(price) > 0) {
        const formatted = Number(price).toLocaleString("ko-KR");
        console.log(`✅ [공시지가] ${year}년: ${formatted}원/㎡`);
        return `${formatted}원/㎡ (${year}년 공시)`;
      }
    } catch (e) {
      console.error(`❌ [공시지가 ${year}년 오류]`, String(e));
    }
  }

  // 개별공시지가 폴백 (getIndvdLandPrice)
  console.log("💡 [개별공시지가 폴백 시도]");
  try {
    const params = new URLSearchParams({
      pnu,
      numOfRows: "1",
      pageNo: "1",
      _type: "json",
    });
    const url = `${LAND_PRICE_API_BASE}/getIndvdLandPrice?serviceKey=${encodedKey}&${params}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    console.log("💡 [개별공시지가 응답]", text.substring(0, 400));

    const data = JSON.parse(text);
    const items = data?.response?.body?.items?.item;
    if (items) {
      const item = Array.isArray(items) ? items[0] : items;
      const price = item?.pblntfPclnd ?? item?.landPrice;
      if (price != null && Number(price) > 0) {
        const formatted = Number(price).toLocaleString("ko-KR");
        const yr = item?.stdrYear || item?.baseYear || "";
        return `${formatted}원/㎡${yr ? ` (${yr}년 공시)` : ""}`;
      }
    }
  } catch (e) {
    console.error("❌ [개별공시지가 오류]", String(e));
  }

  return null;
}

// ── 건축물대장 표제부 ────────────────────────────────────────────────────
async function fetchBuildingTitle(
  sigunguCd: string, bjdongCd: string, bun: string, ji: string, apiKey: string
) {
  const params = new URLSearchParams({
    serviceKey: apiKey, sigunguCd, bjdongCd, bun, ji,
    numOfRows: "10", pageNo: "1", _type: "json",
  });
  const url = `${BUILDING_API_BASE}/getBrTitleInfo?${params}`;
  console.log("🏢 [표제부 API 호출]", url.replace(apiKey, "***"));
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const text = await res.text();
    console.log("🏢 [표제부 응답]", text.substring(0, 300));
    const data = JSON.parse(text);
    const items = data?.response?.body?.items?.item;
    if (!items) return null;
    return Array.isArray(items) ? items[0] : items;
  } catch (e) {
    console.error("❌ [표제부 오류]", String(e));
    return null;
  }
}

// ── 건축물대장 기본개요 ──────────────────────────────────────────────────
async function fetchBuildingBasic(
  sigunguCd: string, bjdongCd: string, bun: string, ji: string, apiKey: string
) {
  const params = new URLSearchParams({
    serviceKey: apiKey, sigunguCd, bjdongCd, bun, ji,
    numOfRows: "10", pageNo: "1", _type: "json",
  });
  const url = `${BUILDING_API_BASE}/getBrBasisOulnInfo?${params}`;
  console.log("📋 [기본개요 API 호출]", url.replace(apiKey, "***"));
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const text = await res.text();
    const data = JSON.parse(text);
    const items = data?.response?.body?.items?.item;
    if (!items) return null;
    return Array.isArray(items) ? items[0] : items;
  } catch (e) {
    console.error("❌ [기본개요 오류]", String(e));
    return null;
  }
}

// ── 층별 개요 ────────────────────────────────────────────────────────────
async function fetchBuildingFloors(
  sigunguCd: string, bjdongCd: string, bun: string, ji: string, apiKey: string
) {
  const params = new URLSearchParams({
    serviceKey: apiKey, sigunguCd, bjdongCd, bun, ji,
    numOfRows: "20", pageNo: "1", _type: "json",
  });
  const url = `${BUILDING_API_BASE}/getBrFlrOulnInfo?${params}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const text = await res.text();
    const data = JSON.parse(text);
    const items = data?.response?.body?.items?.item;
    if (!items) return [];
    return Array.isArray(items) ? items : [items];
  } catch (e) {
    console.error("❌ [층별개요 오류]", String(e));
    return [];
  }
}

// ── API 응답 → building_summary 형식 변환 ───────────────────────────────
function mapBuildingData(titleItem: any, basicItem: any, floorItems: any[]) {
  const item = titleItem || basicItem;
  if (!item) return null;

  const floorsAbove = item.grndFlrCnt ? String(item.grndFlrCnt) : null;
  const floorsBelow = item.ugrndFlrCnt ? String(item.ugrndFlrCnt) : null;
  const totalArea   = item.totArea    ? `${Number(item.totArea).toFixed(1)}㎡`   : null;
  const buildingArea = item.archArea  ? `${Number(item.archArea).toFixed(1)}㎡`  : null;
  const landArea    = item.platArea   ? `${Number(item.platArea).toFixed(1)}㎡`  : null;
  const mainPurpose = item.mainPurpsCdNm || item.etcPurps || null;

  let approvalDate: string | null = null;
  if (item.useAprDay?.length === 8) {
    approvalDate = `${item.useAprDay.slice(0,4)}-${item.useAprDay.slice(4,6)}-${item.useAprDay.slice(6,8)}`;
  }

  const elevator = (Number(item.elevCnt || 0) + Number(item.emgElevCnt || 0)) > 0;
  const parkingCount = (
    Number(item.indrMechUtcnt || 0) + Number(item.oudrMechUtcnt || 0) +
    Number(item.indrAutoUtcnt || 0) + Number(item.oudrAutoUtcnt || 0)
  );

  return {
    building_name:  item.bldNm || null,
    main_purpose:   mainPurpose,
    approval_date:  approvalDate,
    land_area:      landArea,
    building_area:  buildingArea,
    total_area:     totalArea,
    floors_above:   floorsAbove,
    floors_below:   floorsBelow,
    parking_count:  parkingCount > 0 ? String(parkingCount) : null,
    elevator,
    _raw: {
      hhldCnt:    item.hhldCnt   ? String(item.hhldCnt)  : null,
      bcRat:      item.bcRat     ? `${item.bcRat}%`       : null,
      vlRat:      item.vlRat     ? `${item.vlRat}%`       : null,
      strctCdNm:  item.strctCdNm || null,
      roofCdNm:   item.roofCdNm  || null,
      floors: floorItems.map((f) => ({
        flrNo:        f.flrNo,
        flrNoNm:      f.flrNoNm,
        area:         f.area ? `${Number(f.area).toFixed(1)}㎡` : null,
        mainPurpsCdNm: f.mainPurpsCdNm,
      })),
    },
  };
}

// ── 메인 핸들러 ─────────────────────────────────────────────────────────
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

    console.log("🔑 [API키 로드]:", { dataGoKr: !!dataGoKrApiKey });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── 1. properties 테이블에서 property_id + 주소 조회 ──────────────
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

    console.log("📌 [property_id]:", pid, "| [address]:", propertyAddress);

    if (!pid) {
      return new Response(
        JSON.stringify({
          property_id: null, address,
          building_summary: null, land_summary: null,
          has_building: false, has_land: false,
          message: "매물 주소를 찾을 수 없습니다.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. DB에서 기존 데이터 조회 ───────────────────────────────────
    const [bRes, lRes] = await Promise.all([
      supabase.from("building_summary").select("*").eq("property_id", pid).maybeSingle(),
      supabase.from("land_summary").select("*").eq("property_id", pid).maybeSingle(),
    ]);

    let buildingData = bRes.data as Record<string, unknown> | null;
    let landData = lRes.data as Record<string, unknown> | null;

    const needBuilding = !buildingData;
    // 공시지가가 없으면 다시 조회
    const needLand = !landData || !landData.official_price;

    console.log("📦 [building_summary]:", buildingData ? "있음" : "없음");
    console.log("🌍 [land_summary]:", landData ? "있음" : "없음", "| 공시지가:", landData?.official_price || "없음");

    // ── 3. data.go.kr API 호출 ────────────────────────────────────────
    if ((needBuilding || needLand) && dataGoKrApiKey) {
      const { sigunguCd, bjdongCd, bun, ji, pnu } = parseKoreanAddress(propertyAddress);

      if (sigunguCd && bjdongCd) {
        // ── 3a. 건축물대장 (필요한 경우) ──
        if (needBuilding) {
          const [titleItem, basicItem, floorItems] = await Promise.all([
            fetchBuildingTitle(sigunguCd, bjdongCd, bun, ji, dataGoKrApiKey),
            fetchBuildingBasic(sigunguCd, bjdongCd, bun, ji, dataGoKrApiKey),
            fetchBuildingFloors(sigunguCd, bjdongCd, bun, ji, dataGoKrApiKey),
          ]);

          console.log("📊 [표제부]:", titleItem ? "있음" : "없음");
          console.log("📊 [기본개요]:", basicItem ? "있음" : "없음");
          console.log("📊 [층별개요]:", floorItems.length, "건");

          const mappedBuilding = mapBuildingData(titleItem, basicItem, floorItems);

          const { data: inserted } = await supabase
            .from("building_summary")
            .insert({
              property_id:   pid,
              building_name: mappedBuilding?.building_name ?? null,
              main_purpose:  mappedBuilding?.main_purpose  ?? null,
              approval_date: mappedBuilding?.approval_date ?? null,
              land_area:     mappedBuilding?.land_area     ?? null,
              building_area: mappedBuilding?.building_area ?? null,
              total_area:    mappedBuilding?.total_area    ?? null,
              floors_above:  mappedBuilding?.floors_above  ?? null,
              floors_below:  mappedBuilding?.floors_below  ?? null,
              parking_count: mappedBuilding?.parking_count ?? null,
              elevator:      mappedBuilding?.elevator      ?? false,
            })
            .select()
            .single();

          if (inserted) {
            buildingData = { ...inserted, _raw: mappedBuilding?._raw ?? { floors: [] } };
            console.log("✅ [건축물대장 저장 완료]");
          }
        }

        // ── 3b. 공시지가 조회 (표준공시지가 API) ──────────────────────
        if (needLand && pnu) {
          console.log("💰 [공시지가 조회 시작] PNU:", pnu);
          const officialPrice = await fetchStdLandPrice(pnu, dataGoKrApiKey);
          console.log("💰 [공시지가 결과]:", officialPrice);

          const { data: propDetail } = await supabase
            .from("properties")
            .select("dong, lot_number")
            .eq("id", pid)
            .maybeSingle();

          const dongName = propertyAddress.match(/([가-힣]+동|[가-힣]+면|[가-힣]+읍)/)?.[1] || propDetail?.dong || "";
          const lotStr   = `${dongName} ${bun.replace(/^0+/, "")}-${ji.replace(/^0+/, "")}`.trim();

          if (landData) {
            // 기존 행 업데이트 (공시지가만)
            const { data: updated } = await supabase
              .from("land_summary")
              .update({ official_price: officialPrice })
              .eq("property_id", pid)
              .select()
              .single();
            if (updated) landData = updated;
          } else {
            const { data: inserted } = await supabase
              .from("land_summary")
              .insert({
                property_id:    pid,
                lot_number:     lotStr,
                land_category:  null,
                land_area:      null,
                official_price: officialPrice,
                use_zone:       null,
                road_access:    null,
              })
              .select()
              .single();
            if (inserted) landData = inserted;
          }
          console.log("✅ [토지 정보 저장 완료]");
        } else if (needLand && !pnu) {
          console.log("⚠️ [PNU 생성 실패] 법정동코드 없음 → 공시지가 조회 불가");
          if (!landData) {
            const { data: propDetail } = await supabase.from("properties").select("dong, lot_number").eq("id", pid).maybeSingle();
            const { data: inserted } = await supabase.from("land_summary").insert({
              property_id: pid,
              lot_number: `${propDetail?.data?.dong || ""} ${propDetail?.data?.lot_number || ""}`.trim() || null,
              land_category: null, land_area: null, official_price: null,
              use_zone: null, road_access: null,
            }).select().single();
            if (inserted) landData = inserted;
          }
        }

      } else {
        // 주소 파싱 실패 → 빈 데이터 저장
        console.log("⚠️ [주소 파싱 실패] 시군구:", sigunguCd, "| 법정동:", bjdongCd);
        if (needBuilding) {
          const { data: inserted } = await supabase.from("building_summary").insert({
            property_id: pid, building_name: null, main_purpose: null,
            approval_date: null, land_area: null, building_area: null,
            total_area: null, floors_above: null, floors_below: null,
            parking_count: null, elevator: false,
          }).select().single();
          if (inserted) buildingData = inserted;
        }
        if (!landData) {
          const { data: inserted } = await supabase.from("land_summary").insert({
            property_id: pid, lot_number: null, land_category: null,
            land_area: null, official_price: null, use_zone: null, road_access: null,
          }).select().single();
          if (inserted) landData = inserted;
        }
      }
    } else if (needBuilding || needLand) {
      // API 키 없음
      console.log("⚠️ [DATA_GO_KR_API_KEY 없음]");
      if (needBuilding) {
        const { data: inserted } = await supabase.from("building_summary").insert({
          property_id: pid, building_name: null, main_purpose: null,
          approval_date: null, land_area: null, building_area: null,
          total_area: null, floors_above: null, floors_below: null,
          parking_count: null, elevator: false,
        }).select().single();
        if (inserted) buildingData = inserted;
      }
      if (!landData) {
        const { data: inserted } = await supabase.from("land_summary").insert({
          property_id: pid, lot_number: null, land_category: null,
          land_area: null, official_price: null, use_zone: null, road_access: null,
        }).select().single();
        if (inserted) landData = inserted;
      }
    }

    // ── 4. 최종 응답 ─────────────────────────────────────────────────
    const result = {
      property_id:      pid,
      address:          propertyAddress ?? address,
      building_summary: buildingData ?? null,
      land_summary:     landData     ?? null,
      has_building:     buildingData !== null,
      has_land:         landData     !== null,
      data_source:      dataGoKrApiKey ? "data.go.kr" : "fallback",
    };

    console.log("📤 [응답]:", {
      has_building: result.has_building,
      has_land:     result.has_land,
      official_price: (result.land_summary as any)?.official_price,
      data_source:  result.data_source,
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
