import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUILDING_API_BASE = "http://apis.data.go.kr/1613000/BldRgstHubService";
// VWorld는 해외 서버 차단으로 사용 불가 → data.go.kr 토지임야 API로 대체
const LAND_JIJOK_URL    = "http://apis.data.go.kr/1611000/nsdi/LandUsePlanService/wfs/getLandUsePlan";
const LAND_PRICE_URL    = "http://apis.data.go.kr/1611000/nsdi/IndvdLandPriceService/wfs/getIndvdLandPrice";
// VWorld NED API (공시지가 - 국내 IP 차단으로 실패할 수 있음, 폴백용)
const VWORLD_LAND_PRICE_URL = "https://api.vworld.kr/ned/data/getIndvdLandPriceAttr";
const VWORLD_LAND_CHAR_URL  = "https://api.vworld.kr/ned/data/getLandCharacterAttr";

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
  "수곡동_흥덕": "43112114",  // 흥덕구 수곡동 법정동
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

// ── 토지 정보 보강 (총괄표제부: getBrRecapTitleInfo) ──────────────────────
// 건물 전체의 대지면적, 지번, 층수 총합 등 토지 관련 정보 포함
async function fetchBuildingRecapTitle(
  sigunguCd: string, bjdongCd: string, bun: string, ji: string, apiKey: string
) {
  const encodedKey = encodeURIComponent(apiKey);
  const params = new URLSearchParams({
    sigunguCd, bjdongCd, bun, ji,
    numOfRows: "5", pageNo: "1", _type: "json",
  });
  const url = `${BUILDING_API_BASE}/getBrRecapTitleInfo?serviceKey=${encodedKey}&${params}`;
  console.log("🏛️ [총괄표제부 API 호출]", url.replace(encodedKey, "***"));
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const text = await res.text();
    console.log("🏛️ [총괄표제부 응답]", text.substring(0, 300));
    const data = JSON.parse(text);
    const items = data?.response?.body?.items?.item;
    if (!items) return null;
    return Array.isArray(items) ? items[0] : items;
  } catch (e) {
    console.error("❌ [총괄표제부 오류]", String(e));
    return null;
  }
}

// ── data.go.kr 개별공시지가 API (국토교통부) ─────────────────────────────
// 서비스: 개별공시지가정보조회 (getIndvdLandPrice)
async function fetchLandPriceDataGoKr(
  pnu: string, apiKey: string
): Promise<{ price: string | null; category: string | null; area: string | null; useZone: string | null; roadSide: string | null }> {
  const result = { price: null as string | null, category: null as string | null, area: null as string | null, useZone: null as string | null, roadSide: null as string | null };
  if (!pnu || !apiKey) return result;

  // 개별공시지가 서비스 (국토교통부 부동산 공시가격 알리미 API)
  const currentYear = new Date().getFullYear();
  for (const year of [currentYear - 1, currentYear - 2]) {
    const params = new URLSearchParams({
      serviceKey: apiKey,
      pnu, stdrYear: String(year),
      numOfRows: "1", pageNo: "1", _type: "json",
    });
    const url = `http://apis.data.go.kr/1611000/nsdi/IndvdLandPriceService/wfs/getIndvdLandPrice?${params}`;
    console.log(`💰 [개별공시지가 호출 ${year}] PNU:${pnu}`);
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      const text = await res.text();
      console.log(`💰 [개별공시지가 응답 ${year}]`, text.substring(0, 500));
      // XML 응답 파싱
      const priceMatch = text.match(/<pblntfPclnd>([^<]+)<\/pblntfPclnd>/);
      const categoryMatch = text.match(/<lndcgrCode[^>]*>([^<]+)<\/lndcgrCode>/);
      const categoryNmMatch = text.match(/<lndcgrCodeNm[^>]*>([^<]+)<\/lndcgrCodeNm>/);
      const areaMatch = text.match(/<lndpclAr>([^<]+)<\/lndpclAr>/);
      const useZoneMatch = text.match(/<prposArea1Nm>([^<]+)<\/prposArea1Nm>/);
      const roadMatch = text.match(/<roadSideCodeNm>([^<]+)<\/roadSideCodeNm>/);

      if (priceMatch) {
        const price = Number(priceMatch[1]);
        if (price > 0) {
          result.price = `${price.toLocaleString("ko-KR")}원/㎡ (${year}년 기준)`;
          console.log(`✅ [개별공시지가 성공 ${year}] ${result.price}`);
        }
      }
      if (categoryNmMatch) result.category = categoryNmMatch[1];
      if (areaMatch) result.area = `${Number(areaMatch[1]).toFixed(1)}㎡`;
      if (useZoneMatch) result.useZone = useZoneMatch[1];
      if (roadMatch) result.roadSide = roadMatch[1];

      if (result.price) break; // 공시지가 찾으면 중단
    } catch (e) {
      console.error(`❌ [개별공시지가 오류 ${year}]`, String(e));
    }
  }
  return result;
}

// ── VWorld 개별공시지가 API (폴백용, 한국 IP에서만 동작) ─────────────────
async function fetchIndvdLandPrice(pnu: string, vworldKey: string): Promise<string | null> {
  if (!pnu || !vworldKey) return null;
  const currentYear = new Date().getFullYear();
  for (const year of [currentYear - 1, currentYear - 2]) {
    const url = `${VWORLD_LAND_PRICE_URL}?key=${vworldKey}&pnu=${pnu}&stdrYear=${year}&format=json&numOfRows=1&pageNo=1`;
    console.log(`💰 [VWorld 공시지가 호출] PNU:${pnu} 연도:${year}`);
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const text = await res.text();
      console.log(`💰 [VWorld 공시지가 응답 ${year}]`, text.substring(0, 300));
      const data = JSON.parse(text);
      const fieldsA: any[] = data?.indvdLandPrices?.field ?? [];
      if (fieldsA.length > 0) {
        const price = fieldsA[0]?.pblntfPclnd;
        if (price && Number(price) > 0) {
          const formatted = Number(price).toLocaleString("ko-KR");
          return `${formatted}원/㎡ (${year}년 기준)`;
        }
      }
    } catch (_) { /* VWorld 한국 IP 차단 시 무시 */ }
  }
  return null;
}

// ── VWorld 토지특성 API (폴백용) ─────────────────────────────────────────
async function fetchLandCharacter(pnu: string, vworldKey: string): Promise<{
  lndcgrCodeNm: string | null;
  lndpclAr: string | null;
  prposArea1Nm: string | null;
  roadSideCodeNm: string | null;
} | null> {
  if (!pnu || !vworldKey) return null;
  const currentYear = new Date().getFullYear();
  for (const year of [currentYear - 1, currentYear - 2]) {
    const url = `${VWORLD_LAND_CHAR_URL}?key=${vworldKey}&pnu=${pnu}&stdrYear=${year}&format=json&numOfRows=1&pageNo=1`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const text = await res.text();
      const data = JSON.parse(text);
      const fieldsA: any[] = data?.landCharacters?.field ?? [];
      if (fieldsA.length > 0) {
        const f = fieldsA[0];
        return {
          lndcgrCodeNm:   f.lndcgrCodeNm   || null,
          lndpclAr:       f.lndpclAr       ? `${Number(f.lndpclAr).toFixed(1)}㎡` : null,
          prposArea1Nm:   f.prposArea1Nm   || f.prposArea2Nm || null,
          roadSideCodeNm: f.roadSideCodeNm || null,
        };
      }
    } catch (_) { /* 무시 */ }
  }
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
    const dataGoKrApiKey = Deno.env.get("DATA_GO_KR_API_KEY")?.trim();
    const vworldApiKey   = Deno.env.get("VWORLD_API_KEY")?.trim();

    console.log("🔑 [API키 로드]:", { dataGoKr: !!dataGoKrApiKey, vworld: !!vworldApiKey });

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

    // 빈 껍데기(main_purpose, total_area, approval_date 모두 null) 레코드는 재조회
    const isBuildingEmpty = buildingData && !buildingData.main_purpose && !buildingData.total_area && !buildingData.approval_date;
    const needBuilding = !buildingData || !!isBuildingEmpty;
    // 공시지가가 없으면 다시 조회
    const needLand = !landData || !landData.official_price;

    if (isBuildingEmpty) {
      console.log("⚠️ [building_summary 빈 레코드 감지] → API 재조회");
    }

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

          let savedBuilding: Record<string, unknown> | null = null;

          if (isBuildingEmpty && buildingData) {
            // 빈 껍데기 → UPDATE
            const { data: updated } = await supabase
              .from("building_summary")
              .update({
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
              .eq("property_id", pid)
              .select()
              .single();
            savedBuilding = updated;
            console.log("✅ [건축물대장 업데이트 완료]", updated ? "성공" : "실패");
          } else {
            // 신규 INSERT
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
            savedBuilding = inserted;
            console.log("✅ [건축물대장 저장 완료]");
          }

          if (savedBuilding) {
            buildingData = { ...savedBuilding, _raw: mappedBuilding?._raw ?? { floors: [] } };
          }
        }

        // ── 3b. 공시지가 + 토지특성 조회 (VWorld API) ────────────────
        if (needLand && pnu) {
          console.log("💰 [공시지가+토지특성 조회 시작] PNU:", pnu);

          // VWorld 공시지가 + 토지특성 병렬 호출
          const [officialPrice, landChar] = await Promise.all([
            vworldApiKey ? fetchIndvdLandPrice(pnu, vworldApiKey) : Promise.resolve(null),
            vworldApiKey ? fetchLandCharacter(pnu, vworldApiKey)  : Promise.resolve(null),
          ]);
          console.log("💰 [공시지가 결과]:", officialPrice);
          console.log("🌱 [토지특성 결과]:", landChar);

          const { data: propDetail } = await supabase
            .from("properties")
            .select("dong, lot_number")
            .eq("id", pid)
            .maybeSingle();

          const dongName = propertyAddress.match(/([가-힣]+동|[가-힣]+면|[가-힣]+읍)/)?.[1] || propDetail?.dong || "";
          const lotStr   = `${dongName} ${bun.replace(/^0+/, "")}-${ji.replace(/^0+/, "")}`.trim();

          if (landData) {
            // 기존 행 업데이트 (공시지가 + 토지특성)
            const { data: updated } = await supabase
              .from("land_summary")
              .update({
                official_price: officialPrice ?? (landData as any).official_price,
                land_category:  landChar?.lndcgrCodeNm  ?? (landData as any).land_category,
                land_area:      landChar?.lndpclAr      ?? (landData as any).land_area,
                use_zone:       landChar?.prposArea1Nm  ?? (landData as any).use_zone,
                road_access:    landChar?.roadSideCodeNm ?? (landData as any).road_access,
              })
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
                land_category:  landChar?.lndcgrCodeNm  ?? null,
                land_area:      landChar?.lndpclAr      ?? null,
                official_price: officialPrice           ?? null,
                use_zone:       landChar?.prposArea1Nm  ?? null,
                road_access:    landChar?.roadSideCodeNm ?? null,
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
      data_source:      dataGoKrApiKey ? (vworldApiKey ? "data.go.kr + vworld" : "data.go.kr") : "fallback",
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
