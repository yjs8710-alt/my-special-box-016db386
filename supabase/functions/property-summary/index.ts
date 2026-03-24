import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUILDING_API_BASE = "http://apis.data.go.kr/1613000/BldRgstHubService";
const VWORLD_LAND_PRICE_URL = "https://api.vworld.kr/ned/data/getIndvdLandPriceAttr";
const VWORLD_LAND_CHAR_URL  = "https://api.vworld.kr/ned/data/getLandCharacterAttr";

// ── 시군구 코드 ──────────────────────────────────────────────────────────
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

// ── 법정동 코드 맵: dongName → { sigunguCd(5자리), bjdongCd(4자리) } ──────
// 국토부 건축물대장 API: sigunguCd=5자리 시군구코드, bjdongCd=4자리 동코드
const BJDONG_MAP: Record<string, { sigungu: string; bjdong: string }> = {
  // 청주시 상당구 (43111)
  "중앙동":     { sigungu: "43111", bjdong: "1010" },
  "북문로1가":  { sigungu: "43111", bjdong: "1020" },
  "북문로2가":  { sigungu: "43111", bjdong: "1030" },
  "내덕동":     { sigungu: "43111", bjdong: "1040" },
  "우암동":     { sigungu: "43111", bjdong: "1050" },
  "금천동":     { sigungu: "43111", bjdong: "1060" },
  "용암동":     { sigungu: "43111", bjdong: "1070" },
  "율량동":     { sigungu: "43111", bjdong: "1080" },
  "방서동":     { sigungu: "43111", bjdong: "1090" },
  "운동동":     { sigungu: "43111", bjdong: "1100" },
  "오근장동":   { sigungu: "43111", bjdong: "1110" },
  "산성동":     { sigungu: "43111", bjdong: "1120" },
  "영운동":     { sigungu: "43111", bjdong: "1130" },
  "용정동":     { sigungu: "43111", bjdong: "1140" },
  "명암동":     { sigungu: "43111", bjdong: "1150" },
  "대성동":     { sigungu: "43111", bjdong: "1160" },
  "수동":       { sigungu: "43111", bjdong: "1170" },
  "문화동":     { sigungu: "43111", bjdong: "1180" },
  "탑동":       { sigungu: "43111", bjdong: "1190" },
  // 청주시 흥덕구 (43112)
  "가경동":     { sigungu: "43112", bjdong: "1070" },
  "봉명동":     { sigungu: "43112", bjdong: "1050" },
  "강서동":     { sigungu: "43112", bjdong: "1080" },
  "복대동":     { sigungu: "43112", bjdong: "1100" },
  "송정동":     { sigungu: "43112", bjdong: "1090" },
  "신봉동":     { sigungu: "43112", bjdong: "1130" },
  "원평동":     { sigungu: "43112", bjdong: "1120" },
  "운천동":     { sigungu: "43112", bjdong: "1110" },
  "송절동":     { sigungu: "43112", bjdong: "1150" },
  "오송읍":     { sigungu: "43112", bjdong: "2500" },
  "강내면":     { sigungu: "43112", bjdong: "3800" },
  // 청주시 서원구 (43113)
  "개신동":     { sigungu: "43113", bjdong: "1030" },
  "성화동":     { sigungu: "43113", bjdong: "1040" },
  "죽림동":     { sigungu: "43113", bjdong: "1180" },
  "사창동":     { sigungu: "43113", bjdong: "1130" },
  "산남동":     { sigungu: "43113", bjdong: "1140" },
  "분평동":     { sigungu: "43113", bjdong: "1150" },
  "사직동":     { sigungu: "43113", bjdong: "1160" },
  "수곡동":     { sigungu: "43113", bjdong: "1170" },
  "모충동":     { sigungu: "43113", bjdong: "1110" },
  "남이면":     { sigungu: "43113", bjdong: "3800" },
  // 청주시 청원구 (43114)
  "내수읍":     { sigungu: "43114", bjdong: "2500" },
  "오창읍":     { sigungu: "43114", bjdong: "2100" },
  "오동동":     { sigungu: "43114", bjdong: "1010" },
  "주중동":     { sigungu: "43114", bjdong: "1040" },
  "주성동":     { sigungu: "43114", bjdong: "1050" },
  "우산동":     { sigungu: "43114", bjdong: "1060" },
  "향정동":     { sigungu: "43114", bjdong: "1070" },
  "외남동":     { sigungu: "43114", bjdong: "1080" },
  "사천동":     { sigungu: "43114", bjdong: "1090" },
  "외평동":     { sigungu: "43114", bjdong: "1100" },
  "외하동":     { sigungu: "43114", bjdong: "1110" },
  // 충주시 (43130)
  "교현동":     { sigungu: "43130", bjdong: "1010" },
  "연수동":     { sigungu: "43130", bjdong: "1020" },
  "용산동":     { sigungu: "43130", bjdong: "1030" },
  "봉방동":     { sigungu: "43130", bjdong: "1090" },
  "칠금동":     { sigungu: "43130", bjdong: "1100" },
  // 제천시 (43150)
  "청전동":     { sigungu: "43150", bjdong: "1030" },
  "화산동":     { sigungu: "43150", bjdong: "1040" },
  "하소동":     { sigungu: "43150", bjdong: "1050" },
};

// ── 주소 파싱: sigunguCd(5자리), bjdongCd(4자리) ─────────────────────────
function parseKoreanAddress(address: string) {
  // 법정동 매핑에서 가장 긴(구체적인) 키부터 매칭
  const sortedKeys = Object.keys(BJDONG_MAP).sort((a, b) => b.length - a.length);
  let sigunguCd = "";
  let bjdongCd  = "";

  // 시군구 코드 추출
  for (const [key, code] of Object.entries(SIGUNGU_MAP)) {
    if (address.includes(key)) { sigunguCd = code; break; }
  }

  // 법정동 코드 추출 (시군구 코드와 일치하는 것 우선)
  for (const dong of sortedKeys) {
    if (address.includes(dong)) {
      const entry = BJDONG_MAP[dong];
      if (sigunguCd && entry.sigungu !== sigunguCd) continue;
      sigunguCd = entry.sigungu;
      bjdongCd  = entry.bjdong;
      break;
    }
  }

  const lotMatch = address.match(/(\d+)(?:-(\d+))?(?:\s*번지?)?\s*$/);
  let bun = "0000", ji = "0000";
  if (lotMatch) {
    bun = lotMatch[1].padStart(4, "0");
    ji  = (lotMatch[2] || "0").padStart(4, "0");
  }

  // PNU = 시군구코드(5) + 법정동코드(4) + 0 + 본번(4) + 부번(4) = 18자리
  const pnu = sigunguCd && bjdongCd
    ? `${sigunguCd}${bjdongCd}0${bun}${ji}`
    : "";

  console.log("🗺️ [주소 파싱]", { address, sigunguCd, bjdongCd, bun, ji, pnu });
  return { sigunguCd, bjdongCd, bun, ji, pnu };
}

// ── 건축물대장 API 공통 호출 (serviceKey 이중인코딩 방지) ─────────────────
async function fetchBuildingApi(
  endpoint: string, sigunguCd: string, bjdongCd: string,
  bun: string, ji: string, apiKey: string, numOfRows = "10"
) {
  const encodedKey = encodeURIComponent(apiKey);
  const params = new URLSearchParams({ sigunguCd, bjdongCd, bun, ji, numOfRows, pageNo: "1", _type: "json" });
  const url = `${BUILDING_API_BASE}/${endpoint}?serviceKey=${encodedKey}&${params}`;

  // ── [진단] 호출 직전 상세 로그 ──
  console.log(`\n📋 [${endpoint}] 호출 상세`);
  console.log(`  ▸ 호출 URL: ${url.replace(encodedKey, "***")}`);
  console.log(`  ▸ serviceKey 존재: ${!!apiKey}`);
  console.log(`  ▸ sigunguCd: ${sigunguCd}`);
  console.log(`  ▸ bjdongCd: ${bjdongCd}`);
  console.log(`  ▸ platGbCd: (미사용-일반건물)`);
  console.log(`  ▸ bun: ${bun}`);
  console.log(`  ▸ ji: ${ji}`);

  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const text = await res.text();

    // ── [진단] 응답 원문 전체 로그 ──
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch { parsed = {}; }

    const header    = parsed?.response?.header ?? {};
    const body      = parsed?.response?.body   ?? {};
    const resultCode = header?.resultCode ?? "N/A";
    const resultMsg  = header?.resultMsg  ?? "N/A";
    const totalCount = Number(body?.totalCount ?? 0);
    const raw        = body?.items?.item;
    const items      = raw ? (Array.isArray(raw) ? raw : [raw]) : [];

    console.log(`  ▸ resultCode: ${resultCode}`);
    console.log(`  ▸ resultMsg: ${resultMsg}`);
    console.log(`  ▸ totalCount: ${totalCount}`);
    console.log(`  ▸ items 수: ${items.length}`);

    // ── [진단] totalCount=0 원인 구분 ──
    if (totalCount === 0) {
      console.log(`\n⚠️ [${endpoint}] totalCount=0 원인 분석:`);
      if (resultCode === "30" || resultCode === "31" || resultMsg?.includes("SERVICE KEY")) {
        console.log(`  ❌ 가능성: serviceKey 문제 또는 API 접근 권한 없음 (resultCode=${resultCode})`);
      } else if (resultCode === "22" || resultMsg?.includes("LIMITED")) {
        console.log(`  ❌ 가능성: 일일 호출 한도 초과`);
      } else if (resultCode === "00" || resultCode === "0000" || resultMsg?.includes("NORMAL")) {
        console.log(`  ⚠️ 가능성 1: 파라미터 불일치 (sigunguCd=${sigunguCd}, bjdongCd=${bjdongCd}, bun=${bun}, ji=${ji})`);
        console.log(`  ⚠️ 가능성 2: data.go.kr 서비스 미승인 (1613000/BldRgstHubService 활용신청 필요)`);
        console.log(`  ⚠️ 가능성 3: 해당 주소에 건축물 정보 미등록 (나대지 등)`);
        console.log(`  ⚠️ 가능성 4: endpoint 불일치 → 현재: ${BUILDING_API_BASE}/${endpoint}`);
      } else {
        console.log(`  ❌ 알 수 없는 오류 (resultCode=${resultCode}, msg=${resultMsg})`);
      }
    }

    return { total: totalCount, items, resultCode, resultMsg };
  } catch (e) {
    console.error(`❌ [${endpoint} 오류]`, String(e));
    return { total: 0, items: [], resultCode: "ERR", resultMsg: String(e) };
  }
}

// ── 표제부 ───────────────────────────────────────────────────────────────
async function fetchBuildingTitle(s: string, b: string, bun: string, ji: string, k: string) {
  const { total, items, resultCode, resultMsg } = await fetchBuildingApi("getBrTitleInfo", s, b, bun, ji, k);
  console.log("📊 [표제부]:", total > 0 ? `${total}건` : `없음 (${resultCode}/${resultMsg})`);
  return total > 0 ? items[0] : null;
}

// ── 총괄표제부 (다세대·집합건물 폴백) ────────────────────────────────────
async function fetchBuildingRecap(s: string, b: string, bun: string, ji: string, k: string) {
  const { total, items, resultCode, resultMsg } = await fetchBuildingApi("getBrRecapTitleInfo", s, b, bun, ji, k);
  console.log("📊 [총괄표제부]:", total > 0 ? `${total}건` : `없음 (${resultCode}/${resultMsg})`);
  return total > 0 ? items[0] : null;
}

// ── 집합건물 공용부 (오피스텔·아파트 폴백) ──────────────────────────────
async function fetchBuildingExpos(s: string, b: string, bun: string, ji: string, k: string) {
  const { total, items, resultCode, resultMsg } = await fetchBuildingApi("getBrExposPubuseAreaInfo", s, b, bun, ji, k);
  console.log("📊 [집합건물공용부]:", total > 0 ? `${total}건` : `없음 (${resultCode}/${resultMsg})`);
  return total > 0 ? items[0] : null;
}

// ── 기본개요 ─────────────────────────────────────────────────────────────
async function fetchBuildingBasic(s: string, b: string, bun: string, ji: string, k: string) {
  const { total, items, resultCode, resultMsg } = await fetchBuildingApi("getBrBasisOulnInfo", s, b, bun, ji, k);
  console.log("📊 [기본개요]:", total > 0 ? `${total}건` : `없음 (${resultCode}/${resultMsg})`);
  return total > 0 ? items[0] : null;
}

// ── 층별 개요 ────────────────────────────────────────────────────────────
async function fetchBuildingFloors(s: string, b: string, bun: string, ji: string, k: string) {
  const { items } = await fetchBuildingApi("getBrFlrOulnInfo", s, b, bun, ji, k, "30");
  console.log("📊 [층별개요]:", items.length, "건");
  return items;
}

// ── data.go.kr 개별공시지가 (serviceKey 이중인코딩 방지) ──────────────────
async function fetchLandPriceDataGoKr(pnu: string, apiKey: string) {
  const result = {
    price: null as string | null, category: null as string | null,
    area: null as string | null, useZone: null as string | null, roadSide: null as string | null,
  };
  if (!pnu || !apiKey) return result;

  const encodedKey = encodeURIComponent(apiKey);
  const currentYear = new Date().getFullYear();
  for (const year of [currentYear - 1, currentYear - 2]) {
    const params = new URLSearchParams({ pnu, stdrYear: String(year), numOfRows: "1", pageNo: "1", _type: "json" });
    const url = `http://apis.data.go.kr/1611000/nsdi/IndvdLandPriceService/wfs/getIndvdLandPrice?serviceKey=${encodedKey}&${params}`;
    console.log(`💰 [개별공시지가 호출 ${year}] PNU:${pnu}`);
    try {
      const res  = await fetch(url, { signal: AbortSignal.timeout(12000) });
      const text = await res.text();
      console.log(`💰 [개별공시지가 응답 ${year}]`, text.substring(0, 500));

      const priceMatch   = text.match(/<pblntfPclnd>([^<]+)<\/pblntfPclnd>/);
      const catNmMatch   = text.match(/<lndcgrCodeNm[^>]*>([^<]+)<\/lndcgrCodeNm>/);
      const areaMatch    = text.match(/<lndpclAr>([^<]+)<\/lndpclAr>/);
      const zoneMatch    = text.match(/<prposArea1Nm>([^<]+)<\/prposArea1Nm>/);
      const roadMatch    = text.match(/<roadSideCodeNm>([^<]+)<\/roadSideCodeNm>/);

      if (priceMatch) {
        const price = Number(priceMatch[1]);
        if (price > 0) {
          result.price = `${price.toLocaleString("ko-KR")}원/㎡ (${year}년 기준)`;
          console.log(`✅ [개별공시지가 성공 ${year}] ${result.price}`);
        }
      }
      if (catNmMatch)  result.category = catNmMatch[1];
      if (areaMatch)   result.area     = `${Number(areaMatch[1]).toFixed(1)}㎡`;
      if (zoneMatch)   result.useZone  = zoneMatch[1];
      if (roadMatch)   result.roadSide = roadMatch[1];

      if (result.price) break;
    } catch (e) {
      console.error(`❌ [개별공시지가 오류 ${year}]`, String(e));
    }
  }
  return result;
}

// ── VWorld 공시지가 (폴백, 해외 IP 차단됨) ──────────────────────────────
async function fetchIndvdLandPrice(pnu: string, vworldKey: string): Promise<string | null> {
  if (!pnu || !vworldKey) return null;
  const currentYear = new Date().getFullYear();
  for (const year of [currentYear - 1, currentYear - 2]) {
    const url = `${VWORLD_LAND_PRICE_URL}?key=${vworldKey}&pnu=${pnu}&stdrYear=${year}&format=json&numOfRows=1&pageNo=1`;
    console.log(`💰 [VWorld 공시지가 호출] PNU:${pnu} 연도:${year}`);
    try {
      const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const text = await res.text();
      console.log(`💰 [VWorld 공시지가 응답 ${year}]`, text.substring(0, 300));
      const data = JSON.parse(text);
      const fields: any[] = data?.indvdLandPrices?.field ?? [];
      if (fields.length > 0) {
        const price = fields[0]?.pblntfPclnd;
        if (price && Number(price) > 0)
          return `${Number(price).toLocaleString("ko-KR")}원/㎡ (${year}년 기준)`;
      }
    } catch (_) { /* 해외 IP 차단 무시 */ }
  }
  return null;
}

// ── VWorld 토지특성 (폴백) ───────────────────────────────────────────────
async function fetchLandCharacter(pnu: string, vworldKey: string) {
  if (!pnu || !vworldKey) return null;
  const currentYear = new Date().getFullYear();
  for (const year of [currentYear - 1, currentYear - 2]) {
    const url = `${VWORLD_LAND_CHAR_URL}?key=${vworldKey}&pnu=${pnu}&stdrYear=${year}&format=json&numOfRows=1&pageNo=1`;
    try {
      const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const text = await res.text();
      const data = JSON.parse(text);
      const fields: any[] = data?.landCharacters?.field ?? [];
      if (fields.length > 0) {
        const f = fields[0];
        return {
          lndcgrCodeNm:   f.lndcgrCodeNm || null,
          lndpclAr:       f.lndpclAr ? `${Number(f.lndpclAr).toFixed(1)}㎡` : null,
          prposArea1Nm:   f.prposArea1Nm || f.prposArea2Nm || null,
          roadSideCodeNm: f.roadSideCodeNm || null,
        };
      }
    } catch (_) { /* 무시 */ }
  }
  return null;
}

// ── API 응답 → building_summary 매핑 ────────────────────────────────────
function mapBuildingData(item: any, floorItems: any[]) {
  if (!item) return null;

  const floorsAbove   = item.grndFlrCnt  ? String(item.grndFlrCnt)                    : null;
  const floorsBelow   = item.ugrndFlrCnt ? String(item.ugrndFlrCnt)                   : null;
  const totalArea     = item.totArea     ? `${Number(item.totArea).toFixed(1)}㎡`      : null;
  const buildingArea  = item.archArea    ? `${Number(item.archArea).toFixed(1)}㎡`     : null;
  const landArea      = item.platArea    ? `${Number(item.platArea).toFixed(1)}㎡`     : null;
  const mainPurpose   = item.mainPurpsCdNm || item.etcPurps || null;

  let approvalDate: string | null = null;
  if (item.useAprDay?.length === 8) {
    approvalDate = `${item.useAprDay.slice(0,4)}-${item.useAprDay.slice(4,6)}-${item.useAprDay.slice(6,8)}`;
  }

  const elevator     = (Number(item.elevCnt || 0) + Number(item.emgElevCnt || 0)) > 0;
  const parkingCount = (
    Number(item.indrMechUtcnt || 0) + Number(item.oudrMechUtcnt || 0) +
    Number(item.indrAutoUtcnt || 0) + Number(item.oudrAutoUtcnt || 0)
  );

  return {
    building_name:  item.bldNm  || null,
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
      hhldCnt:   item.hhldCnt   ? String(item.hhldCnt)  : null,
      bcRat:     item.bcRat     ? `${item.bcRat}%`       : null,
      vlRat:     item.vlRat     ? `${item.vlRat}%`       : null,
      strctCdNm: item.strctCdNm || null,
      roofCdNm:  item.roofCdNm  || null,
      bldNm:     item.bldNm     || null,
      mainPurpsCdNm: item.mainPurpsCdNm || null,
      totArea:   item.totArea   ? `${Number(item.totArea).toFixed(1)}㎡`  : null,
      archArea:  item.archArea  ? `${Number(item.archArea).toFixed(1)}㎡` : null,
      platArea:  item.platArea  ? `${Number(item.platArea).toFixed(1)}㎡` : null,
      useAprDay: approvalDate,
      grndFlrCnt: floorsAbove,
      ugrndFlrCnt: floorsBelow,
      indrMechUtcnt: item.indrMechUtcnt ? String(item.indrMechUtcnt) : null,
      elevYn:    elevator ? "Y" : "N",
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

    const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey    = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const dataGoKrApiKey = Deno.env.get("DATA_GO_KR_API_KEY")?.trim();
    const vworldApiKey   = Deno.env.get("VWORLD_API_KEY")?.trim();

    console.log("🔑 [API키 로드]:", { dataGoKr: !!dataGoKrApiKey, vworld: !!vworldApiKey });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── 1. property_id 조회 ──────────────────────────────────────────
    let pid = property_id;
    let propertyAddress = address;

    if (!pid && address) {
      const { data: exact } = await supabase
        .from("properties").select("id, address").eq("address", address).limit(1).maybeSingle();
      if (exact) { pid = exact.id; propertyAddress = exact.address; }
      else {
        const { data: like } = await supabase
          .from("properties").select("id, address").ilike("address", `%${address}%`).limit(1).maybeSingle();
        if (like) {
          pid = like.id; propertyAddress = like.address;
          if (propertyAddress !== address) console.log("⚠️ [주소 불일치] 요청:", address, "| DB:", propertyAddress);
        }
      }
    }

    console.log("📌 [property_id]:", pid, "| [address]:", propertyAddress);

    if (!pid) {
      return new Response(
        JSON.stringify({ property_id: null, address, building_summary: null, land_summary: null, has_building: false, has_land: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── 2. DB 기존 데이터 조회 ───────────────────────────────────────
    const [bRes, lRes] = await Promise.all([
      supabase.from("building_summary").select("*").eq("property_id", pid).maybeSingle(),
      supabase.from("land_summary").select("*").eq("property_id", pid).maybeSingle(),
    ]);
    let buildingData = bRes.data as Record<string, unknown> | null;
    let landData     = lRes.data as Record<string, unknown> | null;

    const isBuildingEmpty = buildingData && !buildingData.main_purpose && !buildingData.total_area && !buildingData.approval_date;
    const needBuilding    = !buildingData || !!isBuildingEmpty;
    const needLand        = !landData || !landData.official_price;

    console.log("📦 [building_summary]:", buildingData ? (isBuildingEmpty ? "빈껍데기" : "유효") : "없음");
    console.log("🌍 [land_summary]:", landData ? "있음" : "없음", "| 공시지가:", landData?.official_price || "없음");

    // ── 3. API 조회 ──────────────────────────────────────────────────
    if ((needBuilding || needLand) && dataGoKrApiKey) {
      const { sigunguCd, bjdongCd, bun, ji, pnu } = parseKoreanAddress(propertyAddress);

      if (sigunguCd && bjdongCd) {
        // ── 3a. 건축물대장 ──
        if (needBuilding) {
          // 표제부 → 총괄표제부 → 집합건물공용부 → 기본개요 순으로 폴백
          const [titleItem, recapItem, exposItem, basicItem, floorItems] = await Promise.all([
            fetchBuildingTitle(sigunguCd, bjdongCd, bun, ji, dataGoKrApiKey),
            fetchBuildingRecap(sigunguCd, bjdongCd, bun, ji, dataGoKrApiKey),
            fetchBuildingExpos(sigunguCd, bjdongCd, bun, ji, dataGoKrApiKey),
            fetchBuildingBasic(sigunguCd, bjdongCd, bun, ji, dataGoKrApiKey),
            fetchBuildingFloors(sigunguCd, bjdongCd, bun, ji, dataGoKrApiKey),
          ]);

          // 우선순위: 표제부 > 총괄표제부 > 집합건물공용부 > 기본개요
          const bestItem = titleItem || recapItem || exposItem || basicItem;
          const apiStatus = !bestItem ? "no_data" : "ok";
          console.log("📊 [최종 선택 API]:", titleItem ? "표제부" : recapItem ? "총괄표제부" : exposItem ? "집합건물공용부" : basicItem ? "기본개요" : "없음");
          if (!bestItem) {
            console.log("\n🔴 [건축물대장 조회 결과 없음] 최종 진단:");
            console.log("  ▸ 호출 endpoint: " + BUILDING_API_BASE + "/getBrTitleInfo (등 4종)");
            console.log("  ▸ 확인사항 1: data.go.kr → '건축물대장_HUB서비스(1613000)' 활용신청 승인 여부");
            console.log("  ▸ 확인사항 2: 현재 API키가 해당 서비스에 연결되어 있는지");
            console.log("  ▸ 확인사항 3: sigunguCd=" + sigunguCd + " bjdongCd=" + bjdongCd + " bun=" + bun + " ji=" + ji);
            console.log("  ▸ 확인사항 4: 나대지 또는 미등록 건물 가능성");
          }

          const mappedBuilding = mapBuildingData(bestItem, floorItems);
          // _raw에 api_status 포함: 클라이언트에서 미승인/데이터없음 구분 가능
          const rawWithStatus = {
            ...(mappedBuilding?._raw ?? { floors: [] }),
            api_status: apiStatus,  // "ok" | "no_data"
          };

          if (isBuildingEmpty && buildingData) {
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
              .eq("property_id", pid).select().single();
            if (updated) buildingData = { ...updated, _raw: rawWithStatus };
            console.log("✅ [건축물대장 업데이트 완료]", updated ? "성공" : "실패");
          } else {
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
              .select().single();
            if (inserted) buildingData = { ...inserted, _raw: rawWithStatus };
            console.log("✅ [건축물대장 저장 완료]");
          }
        }

        // ── 3b. 공시지가 + 토지특성 ──
        if (needLand && pnu) {
          console.log("💰 [공시지가+토지특성 조회 시작] PNU:", pnu);

          const landInfo = await fetchLandPriceDataGoKr(pnu, dataGoKrApiKey);
          let officialPrice = landInfo.price;
          let landCategory  = landInfo.category;
          let landArea      = landInfo.area;
          let useZone       = landInfo.useZone;
          let roadAccess    = landInfo.roadSide;

          if (!officialPrice && vworldApiKey) {
            console.log("🔄 [VWorld 폴백 시도]");
            const [vPrice, vChar] = await Promise.all([
              fetchIndvdLandPrice(pnu, vworldApiKey),
              fetchLandCharacter(pnu, vworldApiKey),
            ]);
            if (vPrice) officialPrice = vPrice;
            if (vChar?.lndcgrCodeNm)   landCategory = vChar.lndcgrCodeNm;
            if (vChar?.lndpclAr)       landArea     = vChar.lndpclAr;
            if (vChar?.prposArea1Nm)   useZone      = vChar.prposArea1Nm;
            if (vChar?.roadSideCodeNm) roadAccess   = vChar.roadSideCodeNm;
          }

          console.log("💰 [공시지가 최종]:", officialPrice);
          console.log("🌱 [토지특성 최종]:", { landCategory, landArea, useZone, roadAccess });

          const dongName = propertyAddress.match(/([가-힣]+동|[가-힣]+면|[가-힣]+읍)/)?.[1] || "";
          const lotStr   = `${dongName} ${bun.replace(/^0+/, "")}-${ji.replace(/^0+/, "")}`.trim();

          if (landData) {
            const { data: updated } = await supabase
              .from("land_summary")
              .update({
                official_price: officialPrice ?? (landData as any).official_price,
                land_category:  landCategory  ?? (landData as any).land_category,
                land_area:      landArea      ?? (landData as any).land_area,
                use_zone:       useZone       ?? (landData as any).use_zone,
                road_access:    roadAccess    ?? (landData as any).road_access,
              })
              .eq("property_id", pid).select().single();
            if (updated) landData = updated;
          } else {
            const { data: inserted } = await supabase
              .from("land_summary")
              .insert({ property_id: pid, lot_number: lotStr, official_price: officialPrice ?? null, land_category: landCategory ?? null, land_area: landArea ?? null, use_zone: useZone ?? null, road_access: roadAccess ?? null })
              .select().single();
            if (inserted) landData = inserted;
          }
          console.log("✅ [토지 정보 저장 완료]");
        } else if (needLand && !pnu) {
          console.log("⚠️ [PNU 생성 실패] 법정동코드 없음 → 공시지가 조회 불가");
          if (!landData) {
            const { data: inserted } = await supabase
              .from("land_summary")
              .insert({ property_id: pid, lot_number: null, land_category: null, land_area: null, official_price: null, use_zone: null, road_access: null })
              .select().single();
            if (inserted) landData = inserted;
          }
        }
      } else {
        console.log("⚠️ [주소 파싱 실패] 시군구:", sigunguCd, "| 법정동:", bjdongCd);
        if (needBuilding) {
          const { data: inserted } = await supabase.from("building_summary")
            .insert({ property_id: pid, building_name: null, main_purpose: null, approval_date: null, land_area: null, building_area: null, total_area: null, floors_above: null, floors_below: null, parking_count: null, elevator: false })
            .select().single();
          if (inserted) buildingData = inserted;
        }
        if (!landData) {
          const { data: inserted } = await supabase.from("land_summary")
            .insert({ property_id: pid, lot_number: null, land_category: null, land_area: null, official_price: null, use_zone: null, road_access: null })
            .select().single();
          if (inserted) landData = inserted;
        }
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
      building_main_purpose: (result.building_summary as any)?.main_purpose,
      official_price: (result.land_summary as any)?.official_price,
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
