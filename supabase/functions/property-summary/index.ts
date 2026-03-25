import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BUILDING_API_BASE = "http://apis.data.go.kr/1613000/BldRgstHubService";
// 토지 API 후보 경로 (data.go.kr 1611000 서비스)
// → 모든 경로가 Supabase eu-central-1 IP에서 차단/미지원 확인됨
// → VWorld (api.vworld.kr): connection closed (IP 차단)
// → nsdi WFS 경로: HTTP 500 "Unexpected errors"
// → 정상 동작 경로 확인 필요
const NSDI_LAND_PRICE_URL = "https://apis.data.go.kr/1611000/nsdi/IndvdLandPriceService/attrList/getIndvdLandPrice";
const NSDI_LAND_CHAR_URL  = "https://apis.data.go.kr/1611000/nsdi/LandUseService/attrList/getLandUse";
const VWORLD_LAND_PRICE_URL = "https://api.vworld.kr/ned/data/getIndvdLandPriceAttr";
const VWORLD_LAND_CHAR_URL  = "https://api.vworld.kr/ned/data/getLandCharacterAttr";

// ── 카카오 주소 API로 정확한 법정동 코드 + 번지 추출 ────────────────────────
// 카카오 address.b_code = 10자리 법정동코드 (시군구5 + 읍면동5)
// → sigunguCd = b_code[0..4] (5자리)
// → bjdongCd  = b_code[5..9] (5자리) ← 이것이 건축물대장 API의 bjdongCd
// platGbCd: mountain_yn === "Y" → "1" (산), else "0" (대지)
interface KakaoAddressResult {
  sigunguCd: string;   // 5자리
  bjdongCd:  string;   // 5자리 (b_code 뒤 5자리)
  bun:       string;   // 4자리 0패딩
  ji:        string;   // 4자리 0패딩
  pnu:       string;   // 19자리
  platGbCd:  string;   // "0" 대지, "1" 산
  source:    "kakao" | "fallback";
}

async function resolveAddressParams(
  address: string,
  kakaoKey: string
): Promise<KakaoAddressResult | null> {
  console.log("\n🗺️ [카카오 주소 API] 호출 시작:", address);

  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;
  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `KakaoAK ${kakaoKey}`,
        "KA": "sdk/1.0.0 os/web origin/https://lovable.app",
      },
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json();
    console.log("🗺️ [카카오 응답] documents 수:", data?.documents?.length ?? 0);

    const doc = data?.documents?.[0];
    if (!doc) {
      console.log("⚠️ [카카오] 결과 없음 → fallback 파싱으로 전환");
      return null;
    }

    const addr = doc.address; // 지번 주소 객체
    if (!addr) {
      console.log("⚠️ [카카오] address 객체 없음 → fallback으로 전환");
      return null;
    }

    console.log("🗺️ [카카오 address 객체]:", JSON.stringify(addr));

    // b_code: 10자리 법정동코드
    const bCode = addr.b_code ?? "";
    if (bCode.length !== 10) {
      console.log(`⚠️ [카카오] b_code 길이 이상: "${bCode}" (${bCode.length}자리) → fallback`);
      return null;
    }

    const sigunguCd = bCode.substring(0, 5);   // 앞 5자리
    const bjdongCd  = bCode.substring(5, 10);  // 뒤 5자리

    // 대지구분: mountain_yn "Y" → 산(1), "N" 또는 기타 → 대지(0)
    const platGbCd = addr.mountain_yn === "Y" ? "1" : "0";

    // 본번/부번 4자리 패딩
    const bun = String(addr.main_address_no ?? "0").padStart(4, "0");
    const ji  = String(addr.sub_address_no  ?? "0").padStart(4, "0");

    // PNU: 시군구(5) + 법정동(5) + 대지구분(1) + 본번(4) + 부번(4) = 19자리
    const pnu = `${sigunguCd}${bjdongCd}${platGbCd}${bun}${ji}`;

    console.log("✅ [카카오 파싱 완료]:", { sigunguCd, bjdongCd, platGbCd, bun, ji, pnu, bCode });

    return { sigunguCd, bjdongCd, bun, ji, pnu, platGbCd, source: "kakao" };
  } catch (e) {
    console.error("❌ [카카오 API 오류]:", String(e));
    return null;
  }
}

// ── 폴백: 문자열 기반 파싱 (카카오 실패 시) ─────────────────────────────────
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

// 법정동 코드: sigunguCd(5자리) + bjdongCd(5자리) — 실제 b_code 기준
const BJDONG_MAP: Record<string, { sigungu: string; bjdong: string }> = {
  // 청주시 상당구 (43111)
  "중앙동":     { sigungu: "43111", bjdong: "10100" },
  "북문로1가":  { sigungu: "43111", bjdong: "10200" },
  "북문로2가":  { sigungu: "43111", bjdong: "10300" },
  "내덕동":     { sigungu: "43111", bjdong: "10400" },
  "우암동":     { sigungu: "43111", bjdong: "10500" },
  "금천동":     { sigungu: "43111", bjdong: "10600" },
  "용암동":     { sigungu: "43111", bjdong: "10700" },
  "율량동":     { sigungu: "43111", bjdong: "10800" },
  "방서동":     { sigungu: "43111", bjdong: "10900" },
  "운동동":     { sigungu: "43111", bjdong: "11000" },
  "오근장동":   { sigungu: "43111", bjdong: "11100" },
  "산성동":     { sigungu: "43111", bjdong: "11200" },
  "영운동":     { sigungu: "43111", bjdong: "11300" },
  "용정동":     { sigungu: "43111", bjdong: "11400" },
  "명암동":     { sigungu: "43111", bjdong: "11500" },
  "대성동":     { sigungu: "43111", bjdong: "11600" },
  "수동":       { sigungu: "43111", bjdong: "11700" },
  "문화동":     { sigungu: "43111", bjdong: "11800" },
  "탑동":       { sigungu: "43111", bjdong: "11900" },
  // 청주시 흥덕구 (43112)
  "가경동":     { sigungu: "43112", bjdong: "10700" },
  "봉명동":     { sigungu: "43112", bjdong: "10500" },
  "강서동":     { sigungu: "43112", bjdong: "10800" },
  "복대동":     { sigungu: "43112", bjdong: "11000" },
  "송정동":     { sigungu: "43112", bjdong: "10900" },
  "신봉동":     { sigungu: "43112", bjdong: "11300" },
  "원평동":     { sigungu: "43112", bjdong: "11200" },
  "운천동":     { sigungu: "43112", bjdong: "11100" },
  "송절동":     { sigungu: "43112", bjdong: "11500" },
  "오송읍":     { sigungu: "43112", bjdong: "25000" },
  "강내면":     { sigungu: "43112", bjdong: "38000" },
  // 청주시 서원구 (43113)
  "개신동":     { sigungu: "43113", bjdong: "10300" },
  "성화동":     { sigungu: "43113", bjdong: "10400" },
  "죽림동":     { sigungu: "43113", bjdong: "11800" },
  "사창동":     { sigungu: "43113", bjdong: "11300" },
  "산남동":     { sigungu: "43113", bjdong: "11400" },
  "분평동":     { sigungu: "43113", bjdong: "11500" },
  "사직동":     { sigungu: "43113", bjdong: "11600" },
  "수곡동":     { sigungu: "43113", bjdong: "11700" },
  "모충동":     { sigungu: "43113", bjdong: "11100" },
  "남이면":     { sigungu: "43113", bjdong: "38000" },
  // 청주시 청원구 (43114)
  "내수읍":     { sigungu: "43114", bjdong: "25000" },
  "오창읍":     { sigungu: "43114", bjdong: "21000" },
  "오동동":     { sigungu: "43114", bjdong: "10100" },
  "주중동":     { sigungu: "43114", bjdong: "10400" },
  "주성동":     { sigungu: "43114", bjdong: "10500" },
  "우산동":     { sigungu: "43114", bjdong: "10600" },
  "향정동":     { sigungu: "43114", bjdong: "10700" },
  "외남동":     { sigungu: "43114", bjdong: "10800" },
  "사천동":     { sigungu: "43114", bjdong: "10900" },
  "외평동":     { sigungu: "43114", bjdong: "11000" },
  "외하동":     { sigungu: "43114", bjdong: "11100" },
  // 충주시 (43130)
  "교현동":     { sigungu: "43130", bjdong: "10100" },
  "연수동":     { sigungu: "43130", bjdong: "10200" },
  "용산동":     { sigungu: "43130", bjdong: "10300" },
  "봉방동":     { sigungu: "43130", bjdong: "10900" },
  "칠금동":     { sigungu: "43130", bjdong: "11000" },
  // 제천시 (43150)
  "청전동":     { sigungu: "43150", bjdong: "10300" },
  "화산동":     { sigungu: "43150", bjdong: "10400" },
  "하소동":     { sigungu: "43150", bjdong: "10500" },
};

function fallbackParseAddress(address: string): KakaoAddressResult {
  const sortedKeys = Object.keys(BJDONG_MAP).sort((a, b) => b.length - a.length);
  let sigunguCd = "";
  let bjdongCd  = "";

  for (const [key, code] of Object.entries(SIGUNGU_MAP)) {
    if (address.includes(key)) { sigunguCd = code; break; }
  }
  for (const dong of sortedKeys) {
    if (address.includes(dong)) {
      const entry = BJDONG_MAP[dong];
      if (sigunguCd && entry.sigungu !== sigunguCd) continue;
      sigunguCd = entry.sigungu;
      bjdongCd  = entry.bjdong;
      break;
    }
  }

  // 산 여부: 주소에 "산" 포함 확인
  const isMountain = /\s산\s*\d/.test(address);
  const platGbCd   = isMountain ? "1" : "0";

  const lotMatch = address.match(/(\d+)(?:-(\d+))?(?:\s*번지?)?\s*$/);
  let bun = "0000", ji = "0000";
  if (lotMatch) {
    bun = String(lotMatch[1]).padStart(4, "0");
    ji  = String(lotMatch[2] || "0").padStart(4, "0");
  }

  // PNU = 시군구(5) + 법정동(5) + 대지구분(1) + 본번(4) + 부번(4) = 19자리
  const pnu = sigunguCd && bjdongCd
    ? `${sigunguCd}${bjdongCd}${platGbCd}${bun}${ji}`
    : "";

  console.log("📋 [fallback 파싱]:", { address, sigunguCd, bjdongCd, platGbCd, bun, ji, pnu });

  // 파라미터 진단 로그
  if (!sigunguCd) console.log("⚠️ [진단] sigunguCd 추출 실패 → 시군구 이름이 SIGUNGU_MAP에 없음");
  if (!bjdongCd)  console.log("⚠️ [진단] bjdongCd 추출 실패 → 동 이름이 BJDONG_MAP에 없음");
  if (bun === "0000") console.log("⚠️ [진단] bun=0000 → 번지 추출 실패. 주소 형식 확인 필요");

  return { sigunguCd, bjdongCd, bun, ji, pnu, platGbCd, source: "fallback" };
}

// ── 건축물대장 API 공통 호출 ─────────────────────────────────────────────
async function fetchBuildingApi(
  endpoint: string,
  sigunguCd: string,
  bjdongCd: string,
  bun: string,
  ji: string,
  apiKey: string,
  numOfRows = "10",
) {
  const encodedKey = encodeURIComponent(apiKey);
  const keyMasked  = apiKey ? apiKey.substring(0, 8) + "***" : "(없음)";

  // ── bjdongCd 길이 진단 ──────────────────────────────────────────────
  if (bjdongCd.length !== 5) {
    console.log(`⚠️ [진단] bjdongCd 길이 이상: "${bjdongCd}" (${bjdongCd.length}자리) → 5자리여야 함`);
  }
  if (sigunguCd.length !== 5) {
    console.log(`⚠️ [진단] sigunguCd 길이 이상: "${sigunguCd}" (${sigunguCd.length}자리) → 5자리여야 함`);
  }
  if (bun.length !== 4) {
    console.log(`⚠️ [진단] bun 길이 이상: "${bun}" (${bun.length}자리) → 4자리여야 함`);
  }
  if (ji.length !== 4) {
    console.log(`⚠️ [진단] ji 길이 이상: "${ji}" (${ji.length}자리) → 4자리여야 함`);
  }

  const params  = new URLSearchParams({ sigunguCd, bjdongCd, bun, ji, numOfRows, pageNo: "1", _type: "json" });
  const url     = `${BUILDING_API_BASE}/${endpoint}?serviceKey=${encodedKey}&${params}`;
  const maskedUrl = url.replace(encodedKey, "***MASKED***");

  console.log(`\n🔍 [건축물대장 API] 호출 시작 → ${endpoint}`);
  console.log(`  🌐 호출 URL: ${maskedUrl}`);
  console.log(`  🔑 serviceKey 존재 여부: ${!!apiKey} (앞 8자: ${keyMasked})`);
  console.log(`  📦 요청 파라미터:`);
  console.log(`    📍 sigunguCd : ${sigunguCd} (${sigunguCd.length}자리)`);
  console.log(`    🏘  bjdongCd : ${bjdongCd} (${bjdongCd.length}자리)`);
  console.log(`    🗂  platGbCd : 없음 (URLParam 미포함, API 기본값 사용)`);
  console.log(`    1️⃣  bun      : ${bun} (${bun.length}자리)`);
  console.log(`    2️⃣  ji       : ${ji} (${ji.length}자리)`);
  console.log(`    numOfRows  : ${numOfRows}`);

  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const text = await res.text();

    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch { /* XML 응답 처리 */ }

    const header     = parsed?.response?.header ?? {};
    const body       = parsed?.response?.body   ?? {};
    const resultCode = header?.resultCode ?? "N/A";
    const resultMsg  = header?.resultMsg  ?? "N/A";
    const totalCount = Number(body?.totalCount ?? 0);
    const rawItem    = body?.items?.item;
    const items      = rawItem ? (Array.isArray(rawItem) ? rawItem : [rawItem]) : [];

    console.log(`\n✅ [건축물대장 API] 응답 수신 → ${endpoint}`);
    console.log(`  🔖 resultCode  : ${resultCode}`);
    console.log(`  💬 resultMsg   : ${resultMsg}`);
    console.log(`  🔢 totalCount  : ${totalCount}`);
    console.log(`  📋 아이템 수   : ${items.length}`);
    console.log(`  📄 원문 응답   : ${text.substring(0, 800)}`);

    // ── totalCount=0 원인 자동 진단 ────────────────────────────────────
    if (totalCount === 0) {
      const isNormalService = (resultCode === "00" || resultCode === "0000") &&
        (resultMsg?.toUpperCase().includes("NORMAL") || resultMsg?.includes("정상"));
      const isKeyError = ["30","31","22","03","04","20","21"].includes(resultCode) ||
        resultMsg?.toUpperCase().includes("SERVICE KEY") || resultMsg?.toUpperCase().includes("INVALID");
      const isLimitExceeded = resultCode === "22" ||
        resultMsg?.toUpperCase().includes("LIMITED") || resultMsg?.includes("초과");

      console.log(`\n⚠️ [진단] totalCount=0 원인 분석 시작 → ${endpoint}`);
      console.log(`  - 사용된 sigunguCd : ${sigunguCd} (${sigunguCd.length}자리)`);
      console.log(`  - 사용된 bjdongCd  : ${bjdongCd} (${bjdongCd.length}자리)`);
      console.log(`  - 사용된 bun/ji    : ${bun}/${ji}`);

      if (isKeyError) {
        console.log(`  ❌ serviceKey 자체 오류 가능성: 높음 (resultCode=${resultCode})`);
        console.log(`  - 활용신청 미승인 가능성: 낮음`);
        console.log(`  - 파라미터 불일치 가능성: 낮음`);
        console.log(`  - bjdongCd 오류 가능성: 낮음`);
      } else if (isLimitExceeded) {
        console.log(`  - serviceKey 자체 오류 가능성: 낮음`);
        console.log(`  ⚠️ 일일 호출 한도 초과 가능성: 높음`);
        console.log(`  - 파라미터 불일치 가능성: 낮음`);
        console.log(`  - bjdongCd 오류 가능성: 낮음`);
      } else if (isNormalService) {
        console.log(`  - serviceKey 자체 오류 가능성: 낮음 (resultCode=00 정상 응답)`);
        console.log(`  - 활용신청 미승인 가능성: 낮음 (활용승인 완료 확인됨)`);
        console.log(`  ⚠️ bjdongCd 오류 가능성: 높음 → 카카오 b_code 기반 5자리 사용 중 (${bjdongCd})`);
        console.log(`  ⚠️ bun/ji 패딩 오류 가능성: 중간 → 현재 bun=${bun} ji=${ji}`);
        console.log(`  ⚠️ sigunguCd 조합 오류 가능성: 중간 → 현재 ${sigunguCd}`);
        console.log(`  - endpoint 불일치 가능성: 낮음 (${BUILDING_API_BASE}/${endpoint})`);
        console.log(`  → 권장: 카카오 b_code의 정확한 앞5자리(sigunguCd)/뒤5자리(bjdongCd) 확인 필요`);
        console.log(`  → 권장: platGbCd 파라미터를 명시적으로 추가해 재시도`);
      } else {
        console.log(`  - 분류 불명확 (resultCode=${resultCode})`);
        console.log(`  - serviceKey 자체 오류 가능성: 중간`);
        console.log(`  - 파라미터 불일치 가능성: 중간`);
        console.log(`  - bjdongCd 오류 가능성: 중간`);
      }
    }

    return { total: totalCount, items, resultCode, resultMsg };
  } catch (e) {
    console.error(`❌ [${endpoint} 오류]`, String(e));
    return { total: 0, items: [], resultCode: "ERR", resultMsg: String(e) };
  }
}

// ── platGbCd 포함 버전 호출 (재시도용) ──────────────────────────────────
async function fetchBuildingApiWithPlatGb(
  endpoint: string,
  sigunguCd: string,
  bjdongCd: string,
  bun: string,
  ji: string,
  platGbCd: string,
  apiKey: string,
  numOfRows = "10",
) {
  const encodedKey = encodeURIComponent(apiKey);
  const params  = new URLSearchParams({ sigunguCd, bjdongCd, platGbCd, bun, ji, numOfRows, pageNo: "1", _type: "json" });
  const url     = `${BUILDING_API_BASE}/${endpoint}?serviceKey=${encodedKey}&${params}`;
  const maskedUrl = url.replace(encodedKey, "***MASKED***");

  console.log(`\n🔍 [건축물대장 API+platGbCd] 호출 → ${endpoint}`);
  console.log(`  🌐 호출 URL: ${maskedUrl}`);
  console.log(`  🗂  platGbCd: ${platGbCd} (${platGbCd === "0" ? "대지" : "산"})`);

  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const text = await res.text();
    let parsed: any = {};
    try { parsed = JSON.parse(text); } catch { /* XML */ }

    const header     = parsed?.response?.header ?? {};
    const body       = parsed?.response?.body   ?? {};
    const resultCode = header?.resultCode ?? "N/A";
    const totalCount = Number(body?.totalCount ?? 0);
    const rawItem    = body?.items?.item;
    const items      = rawItem ? (Array.isArray(rawItem) ? rawItem : [rawItem]) : [];

    console.log(`  ✅ platGbCd(${platGbCd}) 응답: resultCode=${resultCode} totalCount=${totalCount}`);
    console.log(`  📄 원문: ${text.substring(0, 600)}`);

    return { total: totalCount, items, resultCode, resultMsg: header?.resultMsg ?? "" };
  } catch (e) {
    console.error(`❌ [${endpoint}+platGbCd 오류]`, String(e));
    return { total: 0, items: [], resultCode: "ERR", resultMsg: String(e) };
  }
}

// ── 표제부 (platGbCd 없이 먼저, 없으면 0/1로 재시도) ────────────────────
async function fetchBuildingTitle(s: string, b: string, bun: string, ji: string, platGbCd: string, k: string) {
  const { total, items, resultCode, resultMsg } = await fetchBuildingApi("getBrTitleInfo", s, b, bun, ji, k);
  if (total > 0) {
    console.log("📊 [표제부] 성공:", total, "건");
    return items[0];
  }
  // platGbCd 명시 재시도
  for (const pgb of [platGbCd, platGbCd === "0" ? "1" : "0"]) {
    const r2 = await fetchBuildingApiWithPlatGb("getBrTitleInfo", s, b, bun, ji, pgb, k);
    if (r2.total > 0) {
      console.log(`📊 [표제부] platGbCd=${pgb} 재시도 성공:`, r2.total, "건");
      return r2.items[0];
    }
  }
  console.log(`📊 [표제부] 없음 (${resultCode}/${resultMsg})`);
  return null;
}

// ── 총괄표제부 ───────────────────────────────────────────────────────────
async function fetchBuildingRecap(s: string, b: string, bun: string, ji: string, platGbCd: string, k: string) {
  const { total, items, resultCode, resultMsg } = await fetchBuildingApi("getBrRecapTitleInfo", s, b, bun, ji, k);
  if (total > 0) {
    console.log("📊 [총괄표제부] 성공:", total, "건");
    return items[0];
  }
  for (const pgb of [platGbCd, platGbCd === "0" ? "1" : "0"]) {
    const r2 = await fetchBuildingApiWithPlatGb("getBrRecapTitleInfo", s, b, bun, ji, pgb, k);
    if (r2.total > 0) {
      console.log(`📊 [총괄표제부] platGbCd=${pgb} 재시도 성공`);
      return r2.items[0];
    }
  }
  console.log(`📊 [총괄표제부] 없음 (${resultCode}/${resultMsg})`);
  return null;
}

// ── 집합건물 공용부 ──────────────────────────────────────────────────────
async function fetchBuildingExpos(s: string, b: string, bun: string, ji: string, platGbCd: string, k: string) {
  const { total, items, resultCode, resultMsg } = await fetchBuildingApi("getBrExposPubuseAreaInfo", s, b, bun, ji, k);
  if (total > 0) { console.log("📊 [집합건물공용부] 성공"); return items[0]; }
  for (const pgb of [platGbCd, platGbCd === "0" ? "1" : "0"]) {
    const r2 = await fetchBuildingApiWithPlatGb("getBrExposPubuseAreaInfo", s, b, bun, ji, pgb, k);
    if (r2.total > 0) { console.log(`📊 [집합건물공용부] platGbCd=${pgb} 재시도 성공`); return r2.items[0]; }
  }
  console.log(`📊 [집합건물공용부] 없음 (${resultCode}/${resultMsg})`);
  return null;
}

// ── 기본개요 ─────────────────────────────────────────────────────────────
async function fetchBuildingBasic(s: string, b: string, bun: string, ji: string, platGbCd: string, k: string) {
  const { total, items, resultCode, resultMsg } = await fetchBuildingApi("getBrBasisOulnInfo", s, b, bun, ji, k);
  if (total > 0) { console.log("📊 [기본개요] 성공"); return items[0]; }
  for (const pgb of [platGbCd, platGbCd === "0" ? "1" : "0"]) {
    const r2 = await fetchBuildingApiWithPlatGb("getBrBasisOulnInfo", s, b, bun, ji, pgb, k);
    if (r2.total > 0) { console.log(`📊 [기본개요] platGbCd=${pgb} 재시도 성공`); return r2.items[0]; }
  }
  console.log(`📊 [기본개요] 없음 (${resultCode}/${resultMsg})`);
  return null;
}

// ── 층별 개요 ────────────────────────────────────────────────────────────
async function fetchBuildingFloors(s: string, b: string, bun: string, ji: string, platGbCd: string, k: string) {
  const { items } = await fetchBuildingApi("getBrFlrOulnInfo", s, b, bun, ji, k, "30");
  if (items.length > 0) { console.log("📊 [층별개요] 성공:", items.length, "건"); return items; }
  for (const pgb of [platGbCd, platGbCd === "0" ? "1" : "0"]) {
    const r2 = await fetchBuildingApiWithPlatGb("getBrFlrOulnInfo", s, b, bun, ji, pgb, k, "30");
    if (r2.items.length > 0) { console.log(`📊 [층별개요] platGbCd=${pgb} 재시도 성공`); return r2.items; }
  }
  console.log("📊 [층별개요] 없음");
  return [];
}

// ── 위반건축물 조회 ──────────────────────────────────────────────────────
async function fetchBuildingViolation(s: string, b: string, bun: string, ji: string, platGbCd: string, k: string) {
  // getBrVlttRnList: 위반건축물 목록 조회
  const { total, items, resultCode, resultMsg } = await fetchBuildingApi("getBrVlttRnList", s, b, bun, ji, k, "10");
  if (total > 0) {
    console.log("🚨 [위반건축물] 목록 조회 성공:", total, "건");
    items.forEach((item: any, idx: number) => {
      console.log(`  🚨 위반건축물 여부: Y`);
      console.log(`  📄 위반내용 [${idx + 1}]:`, item.vlttRnCnts || item.vlttCn || "(내용 없음)");
      console.log(`  🗂  위반구분:`, item.vlttGbCdNm || item.vlttKndCdNm || "(구분 없음)");
      console.log(`  원문:`, JSON.stringify(item));
    });
    return { isViolation: true, items, resultCode, resultMsg };
  }

  // platGbCd 명시 재시도
  for (const pgb of [platGbCd, platGbCd === "0" ? "1" : "0"]) {
    const r2 = await fetchBuildingApiWithPlatGb("getBrVlttRnList", s, b, bun, ji, pgb, k);
    if (r2.total > 0) {
      console.log(`🚨 [위반건축물] platGbCd=${pgb} 재시도 성공:`, r2.total, "건");
      return { isViolation: true, items: r2.items, resultCode: r2.resultCode, resultMsg: r2.resultMsg };
    }
  }

  // resultCode=00, totalCount=0 → 위반 없음
  if (resultCode === "00" || resultCode === "0000") {
    console.log("✅ [위반건축물] 위반 없음 (resultCode=00, totalCount=0)");
    return { isViolation: false, items: [], resultCode, resultMsg };
  }

  console.log(`⚠️ [위반건축물] 조회 결과 없음 (${resultCode}/${resultMsg})`);
  return { isViolation: false, items: [], resultCode, resultMsg };
}

// ── 토지 API 응답 파싱 헬퍼 (모든 구조 처리) ──────────────────────────────
function parseLandApiResponse(text: string, epName: string) {
  // "Unexpected errors" 또는 "API not found" 감지
  const trimmed = text.trim();
  if (trimmed === "Unexpected errors" || trimmed.startsWith("Unexpected") || trimmed === "API not found") {
    console.log(`  ⚠️ [${epName}] API 경로 오류 응답: "${trimmed}"`);
    console.log(`     → 이 endpoint 경로가 data.go.kr에 존재하지 않거나, 파라미터가 잘못됐을 가능성`);
    return { ok: false, reason: "endpoint_not_found", items: [], totalCount: 0, resultCode: "N/A", resultMsg: trimmed };
  }

  let parsed: any = null;
  try { parsed = JSON.parse(text); } catch { /* XML 시도 */ }

  if (parsed) {
    const header     = parsed?.response?.header ?? {};
    const body       = parsed?.response?.body   ?? {};
    const resultCode = header?.resultCode ?? "N/A";
    const resultMsg  = header?.resultMsg  ?? "N/A";
    const totalCount = Number(body?.totalCount ?? 0);

    // 구조 1: response.body.items.item (건축물대장 방식)
    const rawItem1 = body?.items?.item;
    if (rawItem1) {
      const items = Array.isArray(rawItem1) ? rawItem1 : [rawItem1];
      return { ok: true, items, totalCount, resultCode, resultMsg };
    }
    // 구조 2: response.body.items (배열)
    const rawItem2 = body?.items;
    if (Array.isArray(rawItem2)) {
      return { ok: true, items: rawItem2, totalCount, resultCode, resultMsg };
    }
    // 구조 3: field[] (VWorld 방식)
    const fields = parsed?.indvdLandPrices?.field ?? parsed?.landCharacters?.field ?? [];
    if (fields.length > 0) {
      return { ok: true, items: fields, totalCount: fields.length, resultCode: "VW", resultMsg: "VWorld" };
    }
    return { ok: true, items: [], totalCount, resultCode, resultMsg };
  }

  // XML 파싱
  const totalMatch = text.match(/<totalCount>(\d+)<\/totalCount>/);
  const codeMatch  = text.match(/<resultCode>([^<]+)<\/resultCode>/);
  const msgMatch   = text.match(/<resultMsg>([^<]+)<\/resultMsg>/);
  if (totalMatch) {
    return { ok: true, items: ["xml"], totalCount: Number(totalMatch[1]), resultCode: codeMatch?.[1] ?? "N/A", resultMsg: msgMatch?.[1] ?? "XML" };
  }

  return { ok: false, reason: "parse_failed", items: [], totalCount: 0, resultCode: "N/A", resultMsg: "파싱 실패" };
}

// ── data.go.kr 개별공시지가 ──────────────────────────────────────────────
// ※ 로그에서 확인된 사실: 1611000 경로는 모두 HTTP 500 "Unexpected errors"
// ※ data.go.kr/1611000 = VWorld(api.vworld.kr) 를 LINK로 연결하는 방식
// ※ 실제 정식 REST endpoint = api.vworld.kr/ned/data/getIndvdLandPriceAttr
// ※ data.go.kr 직접 REST 경로(nsdi/attrList/list 등)는 존재하지 않음
//
// 호출 순서:
//   1순위: VWorld (api.vworld.kr) — 공식 제공 경로
//   2순위: data.go.kr 직접 경로 (후보 2개, 확인 목적)
//   → endpoint별 시도 결과를 표 형태 요약 로그로 출력

type EndpointResult = {
  name: string;
  httpStatus: number | null;
  stdrYear: string | null;
  pnuIncluded: boolean;
  format: "JSON" | "XML" | "기타";
  verdict: "success" | "no_data" | "unexpected_error" | "parse_error" | "network_error";
  price?: string | null;
};

// ═══════════════════════════════════════════════════════════════════════════
// 토지 API — nsdi.go.kr (data.go.kr 1611000 경로)
//
// 배경:
//   • VWorld (api.vworld.kr) → Supabase eu-central-1 IP 차단 (connection closed 확인됨)
//   • data.go.kr 1611000 /attrList/, /list/ 경로 → HTTP 500 "Unexpected errors" 확인됨
//   • 올바른 nsdi 경로: https://apis.data.go.kr/1611000/nsdi/IndvdLandPriceService/wfs/getIndvdLandPrice
//   • 파라미터: serviceKey, pnu, numOfRows, pageNo, _type=json (stdrYear 불필요)
//
// 호출 직전/후 로그 형식:
//   🌐 [nsdi] 호출 시작 / endpoint / url(masked) / querystring / pnu / stdrYear 포함 여부 / serviceKey(masked)
//   ✅ [nsdi] 응답 수신 / HTTP status / stdrYear 포함 여부 / INCORRECT_KEY 포함 여부 / raw 일부 / 판정
// ═══════════════════════════════════════════════════════════════════════════

// ── nsdi 공시지가 + 토지특성 통합 조회 ────────────────────────────────────
async function fetchNsdiLandInfo(pnu: string, apiKey: string): Promise<{
  price:    string | null;
  category: string | null;
  area:     string | null;
  useZone:  string | null;
  roadSide: string | null;
  verdict:  "success" | "no_data" | "unexpected_error" | "parse_error" | "network_error" | "connection_error";
  httpStatus: number | null;
  keyError: boolean;
}> {
  const empty = { price: null, category: null, area: null, useZone: null, roadSide: null, keyError: false };
  if (!pnu || !apiKey) {
    console.log(`⚠️ [nsdi] pnu 또는 apiKey 없음 → 조회 생략`);
    return { ...empty, verdict: "network_error", httpStatus: null };
  }

  const encodedKey  = encodeURIComponent(apiKey);
  const keyMasked   = apiKey.substring(0, 8) + "***";

  // ── 공시지가 조회 ────────────────────────────────────────────────────────
  const PRICE_ENDPOINT_NAME = "nsdi/IndvdLandPriceService/wfs/getIndvdLandPrice";
  // stdrYear 없이 pnu만으로 최신 공시지가 조회 (nsdi WFS 방식)
  const priceParams = new URLSearchParams({ pnu, numOfRows: "1", pageNo: "1", _type: "json" });
  const priceUrl    = `${NSDI_LAND_PRICE_URL}?serviceKey=${encodedKey}&${priceParams}`;
  const maskedPriceUrl = priceUrl.replace(encodedKey, "***MASKED***");

  console.log(`\n🌐 [nsdi] 호출 시작`);
  console.log(`  - endpoint       : ${PRICE_ENDPOINT_NAME}`);
  console.log(`  - url(masked)    : ${maskedPriceUrl}`);
  console.log(`  - querystring    : ${priceParams.toString()}`);
  console.log(`  - pnu            : ${pnu} (${pnu.length}자리${pnu.length === 19 ? " ✅" : " ❌ 19자리 아님"})`);
  console.log(`  - stdrYear 포함 여부 : 없음 (nsdi WFS 방식은 stdrYear 불필요)`);
  console.log(`  - serviceKey(masked) : ${keyMasked}`);

  let httpS: number | null = null;
  try {
    const res    = await fetch(priceUrl, { signal: AbortSignal.timeout(12000) });
    httpS         = res.status;
    const text   = await res.text();
    const raw600 = text.substring(0, 600);
    const hasIncorrectKey = text.includes("INCORRECT_KEY") || text.includes("SERVICE_KEY_IS_NOT_REGISTERED_ERROR");

    console.log(`\n✅ [nsdi] 응답 수신`);
    console.log(`  - HTTP status          : ${httpS}`);
    console.log(`  - stdrYear 포함 여부   : 없음 (WFS 방식)`);
    console.log(`  - INCORRECT_KEY 포함   : ${hasIncorrectKey ? "⚠️ YES" : "NO"}`);
    console.log(`  - raw 일부             : ${raw600}`);

    // "Unexpected errors" 또는 API not found
    const trimmed = text.trim();
    if (trimmed === "Unexpected errors" || trimmed.startsWith("Unexpected") || trimmed === "API not found") {
      console.log(`  - 판정                 : unexpected_error`);
      console.log(`  🚨 [2순위] endpoint 경로 불일치: "${trimmed}" (HTTP ${httpS})`);
      console.log(`  → nsdi 경로: ${NSDI_LAND_PRICE_URL}`);
      console.log(`  → 이 경로가 올바르지 않을 가능성 (data.go.kr 서비스 구조 변경 가능성)`);
      return { ...empty, verdict: "unexpected_error", httpStatus: httpS };
    }

    let data: any = null;
    try { data = JSON.parse(text); } catch {
      console.log(`  - 판정                 : parse_error (JSON 파싱 실패 — XML 가능성)`);
      // XML 구조 시도
      const totalMatch = text.match(/<totalCount>(\d+)<\/totalCount>/);
      if (totalMatch && Number(totalMatch[1]) === 0) {
        console.log(`  → XML totalCount=0 → no_data`);
        return { ...empty, verdict: "no_data", httpStatus: httpS };
      }
      return { ...empty, verdict: "parse_error", httpStatus: httpS };
    }

    // KEY 오류 감지
    const errorCode   = data?.error?.errorCode ?? null;
    const statusField = data?.status           ?? null;
    const authErrMsg  = data?.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg ?? "";
    const authRtCode  = data?.OpenAPI_ServiceResponse?.cmmMsgHeader?.returnReasonCode ?? "";

    const isKeyErr = hasIncorrectKey
      || errorCode === "INCORRECT_KEY"
      || statusField === "INVALID_KEY"
      || authRtCode === "30"   // data.go.kr 키 오류 코드
      || authErrMsg.includes("SERVICE KEY IS NOT REGISTERED")
      || authErrMsg.includes("인증키")
      || (statusField === "ERROR" && text.includes("KEY"));

    console.log(`  - status           : ${statusField ?? "없음"}`);
    console.log(`  - errorCode        : ${errorCode ?? "없음"}`);
    console.log(`  - authErrMsg       : ${authErrMsg || "없음"}`);

    if (isKeyErr) {
      console.log(`  - 판정                 : key_error`);
      console.log(`\n🔴 [1순위 진단] DATA_GO_KR API KEY 오류 감지!`);
      console.log(`  🔑 진단: 키가 등록은 되어 있으나 값 오류 또는 nsdi 서비스 미활용 가능성`);
      console.log(`  → errorCode=${errorCode} / authRtCode=${authRtCode} / authErrMsg=${authErrMsg}`);
      return { ...empty, verdict: "no_data", httpStatus: httpS, keyError: true };
    }

    // data.go.kr 표준 응답 파싱
    const header     = data?.response?.header ?? {};
    const body       = data?.response?.body   ?? {};
    const resultCode = header?.resultCode ?? "N/A";
    const resultMsg  = header?.resultMsg  ?? "N/A";
    const totalCount = Number(body?.totalCount ?? 0);

    console.log(`  - resultCode       : ${resultCode}`);
    console.log(`  - resultMsg        : ${resultMsg}`);
    console.log(`  - totalCount       : ${totalCount}`);

    if (resultCode !== "00" && resultCode !== "0000" && resultCode !== "N/A") {
      console.log(`  - 판정                 : unexpected_error (resultCode=${resultCode})`);
      return { ...empty, verdict: "unexpected_error", httpStatus: httpS };
    }

    if (totalCount === 0) {
      console.log(`  - 판정                 : no_data`);
      console.log(`  ⚠️ [5순위] totalCount=0 — 해당 PNU 토지 데이터 미존재 또는 nsdi 경로 불일치`);
      console.log(`  → 시도한 경로: ${NSDI_LAND_PRICE_URL}`);
      console.log(`  → 대안 경로 확인 필요: data.go.kr 1611000 서비스 상세페이지 endpoint 확인`);

      // ── nsdi 실패 시 data.go.kr WMS/WFS 대안 경로 재시도 ──────────────
      // 공시지가 대안: 같은 1611000 서비스, 파라미터 stdrYear 추가
      const currentYear = new Date().getFullYear();
      for (const yr of [currentYear - 1, currentYear - 2]) {
        const altParams = new URLSearchParams({ pnu, stdrYear: String(yr), numOfRows: "1", pageNo: "1", _type: "json" });
        const altUrl    = `${NSDI_LAND_PRICE_URL}?serviceKey=${encodedKey}&${altParams}`;
        const maskedAlt = altUrl.replace(encodedKey, "***MASKED***");
        console.log(`\n🔄 [nsdi 재시도] stdrYear=${yr}`);
        console.log(`  - url(masked): ${maskedAlt}`);
        try {
          const r2   = await fetch(altUrl, { signal: AbortSignal.timeout(10000) });
          const t2   = await r2.text();
          const raw2 = t2.substring(0, 400);
          console.log(`  - HTTP: ${r2.status} | raw: ${raw2}`);
          let d2: any = null;
          try { d2 = JSON.parse(t2); } catch { continue; }
          const b2  = d2?.response?.body ?? {};
          const tc2 = Number(b2?.totalCount ?? 0);
          if (tc2 > 0) {
            const ri2   = b2?.items?.item;
            const items2 = ri2 ? (Array.isArray(ri2) ? ri2 : [ri2]) : [];
            if (items2.length > 0) {
              const it2 = items2[0];
              const pr  = Number(it2?.pblntfPclnd ?? 0);
              if (pr > 0) {
                const out = {
                  price:    `${pr.toLocaleString("ko-KR")}원/㎡ (${yr}년 기준)`,
                  category: it2.lndcgrCodeNm || null,
                  area:     it2.lndpclAr ? `${Number(it2.lndpclAr).toFixed(1)}㎡` : null,
                  useZone:  it2.prposArea1Nm || it2.prposArea2Nm || null,
                  roadSide: it2.roadSideCodeNm || null,
                };
                console.log(`  ✅ [nsdi 재시도 성공] ${yr}년 공시지가: ${out.price}`);
                return { ...out, verdict: "success", httpStatus: r2.status };
              }
            }
          }
        } catch { continue; }
      }

      return { ...empty, verdict: "no_data", httpStatus: httpS };
    }

    // items 파싱
    const rawItem = body?.items?.item;
    const items   = rawItem ? (Array.isArray(rawItem) ? rawItem : [rawItem]) : [];

    if (items.length > 0) {
      const it    = items[0];
      const price = Number(it?.pblntfPclnd ?? 0);
      if (price > 0) {
        const stdrYear = it?.stdrYear ?? it?.stdrYr ?? "";
        const out = {
          price:    `${price.toLocaleString("ko-KR")}원/㎡ (${stdrYear}년 기준)`,
          category: it.lndcgrCodeNm || null,
          area:     it.lndpclAr ? `${Number(it.lndpclAr).toFixed(1)}㎡` : null,
          useZone:  it.prposArea1Nm || it.prposArea2Nm || null,
          roadSide: it.roadSideCodeNm || null,
        };
        console.log(`  - 판정                 : success (공시지가: ${out.price})`);
        return { ...out, verdict: "success", httpStatus: httpS };
      }
    }

    console.log(`  - 판정                 : no_data (items 있으나 pblntfPclnd=0)`);
    return { ...empty, verdict: "no_data", httpStatus: httpS };

  } catch (e) {
    const errMsg    = String(e);
    const isConnErr = errMsg.includes("connection closed") || errMsg.includes("SendRequest") ||
                      errMsg.includes("socket hang up") || errMsg.includes("fetch failed") ||
                      errMsg.includes("network error") || errMsg.includes("ECONNRESET") ||
                      errMsg.includes("timed out") || errMsg.includes("AbortError");

    console.log(`\n${isConnErr ? "🔌" : "❌"} [nsdi] ${isConnErr ? "연결 실패" : "응답 오류"}`);
    console.log(`  - endpoint    : ${PRICE_ENDPOINT_NAME}`);
    console.log(`  - 원인        : ${errMsg.substring(0, 400)}`);
    console.log(`  - 판정        : ${isConnErr ? "connection_error" : "network_error"}`);
    if (isConnErr) {
      console.log(`  💡 nsdi 서버 연결 실패 — 서버 점검 중 또는 IP 차단 가능성`);
      console.log(`  → VWorld(api.vworld.kr)도 동일 문제 확인됨: Supabase eu-central-1 IP 차단`);
      console.log(`  → nsdi.go.kr 또한 한국 외 IP 차단 여부 확인 필요`);
    }
    return { ...empty, verdict: isConnErr ? "connection_error" : "network_error", httpStatus: null };
  }
}

// ── nsdi 토지특성 (지목, 용도지역 등) 조회 ───────────────────────────────
async function fetchNsdiLandCharacter(pnu: string, apiKey: string): Promise<{
  lndcgrCodeNm:   string | null;
  lndpclAr:       string | null;
  prposArea1Nm:   string | null;
  roadSideCodeNm: string | null;
} | null> {
  if (!pnu || !apiKey) return null;

  const encodedKey  = encodeURIComponent(apiKey);
  const keyMasked   = apiKey.substring(0, 8) + "***";
  const CHAR_EP     = "nsdi/LandUseService/wfs/getLandUse";
  const params      = new URLSearchParams({ pnu, numOfRows: "1", pageNo: "1", _type: "json" });
  const url         = `${NSDI_LAND_CHAR_URL}?serviceKey=${encodedKey}&${params}`;
  const maskedUrl   = url.replace(encodedKey, "***MASKED***");

  console.log(`\n🌐 [nsdi 토지특성] 호출 시작`);
  console.log(`  - endpoint       : ${CHAR_EP}`);
  console.log(`  - url(masked)    : ${maskedUrl}`);
  console.log(`  - pnu            : ${pnu}`);
  console.log(`  - stdrYear 포함 여부 : 없음 (WFS 방식)`);
  console.log(`  - serviceKey(masked) : ${keyMasked}`);

  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const httpS = res.status;
    const text = await res.text();
    const raw600 = text.substring(0, 600);
    const hasIncorrectKey = text.includes("INCORRECT_KEY") || text.includes("SERVICE_KEY_IS_NOT_REGISTERED_ERROR");

    console.log(`\n✅ [nsdi 토지특성] 응답 수신`);
    console.log(`  - HTTP status          : ${httpS}`);
    console.log(`  - stdrYear 포함 여부   : 없음`);
    console.log(`  - INCORRECT_KEY 포함   : ${hasIncorrectKey ? "⚠️ YES" : "NO"}`);
    console.log(`  - raw 일부             : ${raw600}`);

    const trimmed = text.trim();
    if (trimmed === "Unexpected errors" || trimmed.startsWith("Unexpected")) {
      console.log(`  - 판정                 : unexpected_error (endpoint 불일치)`);
      return null;
    }

    let data: any = null;
    try { data = JSON.parse(text); } catch { return null; }

    const body       = data?.response?.body ?? {};
    const totalCount = Number(body?.totalCount ?? 0);
    console.log(`  - totalCount           : ${totalCount}`);

    if (totalCount === 0) { console.log(`  - 판정                 : no_data`); return null; }

    const rawItem = body?.items?.item;
    const items   = rawItem ? (Array.isArray(rawItem) ? rawItem : [rawItem]) : [];
    if (items.length > 0) {
      const it = items[0];
      console.log(`  - 판정                 : success (지목: ${it.lndcgrCodeNm ?? "없음"})`);
      return {
        lndcgrCodeNm:   it.lndcgrCodeNm   || null,
        lndpclAr:       it.lndpclAr       ? `${Number(it.lndpclAr).toFixed(1)}㎡` : null,
        prposArea1Nm:   it.prposArea1Nm   || it.prposArea2Nm || null,
        roadSideCodeNm: it.roadSideCodeNm || null,
      };
    }
    return null;
  } catch (e) {
    const errMsg    = String(e);
    const isConnErr = errMsg.includes("connection closed") || errMsg.includes("SendRequest") || errMsg.includes("timed out");
    console.log(`\n${isConnErr ? "🔌" : "❌"} [nsdi 토지특성] ${isConnErr ? "연결 실패" : "오류"}`);
    console.log(`  - 원인        : ${errMsg.substring(0, 300)}`);
    console.log(`  - 판정        : ${isConnErr ? "connection_error" : "network_error"}`);
    return null;
  }
}

// ── API 응답 → building_summary 매핑 ────────────────────────────────────
function mapBuildingData(item: any, floorItems: any[]) {
  if (!item) return null;

  const floorsAbove  = item.grndFlrCnt  ? String(item.grndFlrCnt)                  : null;
  const floorsBelow  = item.ugrndFlrCnt ? String(item.ugrndFlrCnt)                 : null;
  const totalArea    = item.totArea     ? `${Number(item.totArea).toFixed(1)}㎡`    : null;
  const buildingArea = item.archArea    ? `${Number(item.archArea).toFixed(1)}㎡`   : null;
  const landArea     = item.platArea    ? `${Number(item.platArea).toFixed(1)}㎡`   : null;
  const mainPurpose  = item.mainPurpsCdNm || item.etcPurps || null;

  let approvalDate: string | null = null;
  if (item.useAprDay?.length === 8) {
    approvalDate = `${item.useAprDay.slice(0,4)}-${item.useAprDay.slice(4,6)}-${item.useAprDay.slice(6,8)}`;
  }

  const parkingCount = (
    Number(item.indrMechUtcnt || 0) + Number(item.oudrMechUtcnt || 0) +
    Number(item.indrAutoUtcnt || 0) + Number(item.oudrAutoUtcnt || 0)
  );

  // ── 엘리베이터 상세 판단 ─────────────────────────────────────────────
  // 건축물대장 API는 용도에 따라 필드명이 다를 수 있음:
  //   - 일반건물: elevCnt (일반), emgElevCnt (비상)
  //   - 아파트/집합건물: rideUseElvtCnt (승용), emgElevCnt (비상)
  //   - 기타: elvCnt, elevatorCnt 등 변형 필드 가능
  const elevCnt       = Number(item.elevCnt       || item.elvCnt       || item.rideUseElvtCnt || 0);
  const emgElevCnt    = Number(item.emgElevCnt    || item.emrgncyElvtCnt || 0);
  const elevTotal     = elevCnt + emgElevCnt;

  // 집합건물 공용부 총괄표제부의 경우 elevYn 필드가 직접 존재하기도 함
  const elevYnField   = item.elevYn ?? item.elvtYn ?? null;
  const elevator      = elevTotal > 0 || elevYnField === "Y";

  const elevatorDetail = elevTotal > 0
    ? (emgElevCnt > 0 ? `있음 (일반 ${elevCnt}대, 비상 ${emgElevCnt}대)` : `있음 (${elevCnt}대)`)
    : (elevYnField === "Y" ? "있음" : "없음");

  console.log(`  🛗 [엘리베이터] elevCnt=${item.elevCnt ?? "-"} rideUseElvtCnt=${item.rideUseElvtCnt ?? "-"} emgElevCnt=${item.emgElevCnt ?? "-"} elevYn=${elevYnField ?? "-"} → ${elevatorDetail}`);

  // 허가일/착공일
  let permitDate: string | null = null;
  if (item.pmsDay?.length === 8) {
    permitDate = `${item.pmsDay.slice(0,4)}-${item.pmsDay.slice(4,6)}-${item.pmsDay.slice(6,8)}`;
  }
  let startDate: string | null = null;
  if (item.stcnsDay?.length === 8) {
    startDate = `${item.stcnsDay.slice(0,4)}-${item.stcnsDay.slice(4,6)}-${item.stcnsDay.slice(6,8)}`;
  }

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
      // 기본
      hhldCnt:       item.hhldCnt       ? String(item.hhldCnt)                : null,
      fmlyCnt:       item.fmlyCnt       ? String(item.fmlyCnt)                : null,
      bcRat:         item.bcRat         ? `${item.bcRat}%`                    : null,
      vlRat:         item.vlRat         ? `${item.vlRat}%`                    : null,
      vlRatEstmTotArea: item.vlRatEstmTotArea ? `${Number(item.vlRatEstmTotArea).toFixed(1)}㎡` : null,
      strctCdNm:     item.strctCdNm     || null,
      roofCdNm:      item.roofCdNm      || null,
      bldNm:         item.bldNm         || null,
      mainPurpsCdNm: item.mainPurpsCdNm || null,
      etcPurps:      item.etcPurps      || null,
      totArea:       item.totArea       ? `${Number(item.totArea).toFixed(1)}㎡`   : null,
      archArea:      item.archArea      ? `${Number(item.archArea).toFixed(1)}㎡`  : null,
      platArea:      item.platArea      ? `${Number(item.platArea).toFixed(1)}㎡`  : null,
      useAprDay:     approvalDate,
      pmsDay:        permitDate,
      stcnsDay:      startDate,
      grndFlrCnt:    floorsAbove,
      ugrndFlrCnt:   floorsBelow,
      indrMechUtcnt: item.indrMechUtcnt ? String(item.indrMechUtcnt) : null,
      // 엘리베이터 상세
      elevCnt:       String(elevCnt),
      emgElevCnt:    String(emgElevCnt),
      elevYn:        elevator ? "Y" : "N",
      elevatorDetail,
      // 원본 필드도 보존 (디버깅용)
      rawElevCnt:       item.elevCnt       ?? null,
      rawRideUseElvtCnt: item.rideUseElvtCnt ?? null,
      rawEmgElevCnt:    item.emgElevCnt    ?? null,
      rawElevYn:        elevYnField        ?? null,
      // 주소
      platPlc:       item.platPlc       || null,  // 지번주소(소재지)
      newPlatPlc:    item.newPlatPlc    || null,  // 도로명주소
      // 내진
      erthqkDsgnApplyYn: item.erthqkDsgnApplyYn || null,  // 내진설계 적용 여부 (Y/N)
      erthqkAblty:       item.erthqkAblty       || null,  // 대내진능력
      // 용도지역 (건축물대장 표제부에서 제공 시)
      useAprDayBefore: item.useAprDayBefore || null,
      floors: floorItems.map((f) => ({
        flrNo:         f.flrNo,
        flrNoNm:       f.flrNoNm,
        area:          f.area ? `${Number(f.area).toFixed(1)}㎡` : null,
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
    const kakaoApiKey    = Deno.env.get("KAKAO_API_KEY")?.trim();

    console.log("🔑 [API키 로드]:", {
      dataGoKr: !!dataGoKrApiKey,
      vworld:   !!vworldApiKey,
      kakao:    !!kakaoApiKey,
    });

    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── 1. property_id + address 확인 ───────────────────────────────
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
          if (propertyAddress !== address)
            console.log("⚠️ [주소 불일치] 요청:", address, "| DB:", propertyAddress);
        }
      }
    } else if (pid && !propertyAddress) {
      const { data: prop } = await supabase
        .from("properties").select("address").eq("id", pid).maybeSingle();
      if (prop?.address) propertyAddress = prop.address;
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
    if ((needBuilding || needLand) && dataGoKrApiKey && propertyAddress) {
      // ── 카카오 API로 정확한 법정동 코드 추출 시도 ────────────────
      let addrParams: KakaoAddressResult | null = null;

      if (kakaoApiKey) {
        addrParams = await resolveAddressParams(propertyAddress, kakaoApiKey);
      }

      // 카카오 실패 시 fallback
      if (!addrParams) {
        console.log("⚠️ [카카오 실패] fallback 문자열 파싱으로 전환");
        addrParams = fallbackParseAddress(propertyAddress);
      }

      const { sigunguCd, bjdongCd, bun, ji, pnu, platGbCd, source } = addrParams;

      console.log(`\n📊 [주소 파라미터 최종 확정] (출처: ${source})`);
      console.log(`  sigunguCd : ${sigunguCd} (${sigunguCd.length}자리) ${sigunguCd.length === 5 ? "✅" : "❌ 5자리 아님"}`);
      console.log(`  bjdongCd  : ${bjdongCd}  (${bjdongCd.length}자리) ${bjdongCd.length === 5 ? "✅" : "❌ 5자리 아님"}`);
      console.log(`  bun       : ${bun} (${bun.length}자리) ${bun.length === 4 ? "✅" : "❌ 4자리 아님"}`);
      console.log(`  ji        : ${ji}  (${ji.length}자리) ${ji.length === 4 ? "✅" : "❌ 4자리 아님"}`);
      console.log(`  platGbCd  : ${platGbCd} (${platGbCd === "0" ? "대지" : "산"})`);
      console.log(`  PNU       : ${pnu} (${pnu.length}자리) ${pnu.length === 19 ? "✅" : "❌ 19자리 아님"}`);

      if (sigunguCd && bjdongCd) {
        // ── 3a. 건축물대장 + 위반건축물 ──
        if (needBuilding) {
          const [titleItem, recapItem, exposItem, basicItem, floorItems, violationResult] = await Promise.all([
            fetchBuildingTitle(sigunguCd, bjdongCd, bun, ji, platGbCd, dataGoKrApiKey),
            fetchBuildingRecap(sigunguCd, bjdongCd, bun, ji, platGbCd, dataGoKrApiKey),
            fetchBuildingExpos(sigunguCd, bjdongCd, bun, ji, platGbCd, dataGoKrApiKey),
            fetchBuildingBasic(sigunguCd, bjdongCd, bun, ji, platGbCd, dataGoKrApiKey),
            fetchBuildingFloors(sigunguCd, bjdongCd, bun, ji, platGbCd, dataGoKrApiKey),
            fetchBuildingViolation(sigunguCd, bjdongCd, bun, ji, platGbCd, dataGoKrApiKey),
          ]);

          const bestItem   = titleItem || recapItem || exposItem || basicItem;
          const bestSource = titleItem ? "표제부" : recapItem ? "총괄표제부" : exposItem ? "집합건물공용부" : basicItem ? "기본개요" : "없음";
          const apiStatus  = !bestItem ? "no_data" : "ok";

          console.log(`\n📊 [최종 선택 API]: ${bestSource}`);

          // ── 위반건축물 최종 요약 로그 ──
          console.log(`\n🏛️ [위반건축물 판단]`);
          console.log(`  🚨 위반건축물 여부: ${violationResult.isViolation ? "Y" : "N"}`);
          if (violationResult.isViolation && violationResult.items.length > 0) {
            violationResult.items.forEach((v: any, i: number) => {
              const content = v.vlttRnCnts || v.vlttCn || v.vlttKndCdNm || "(내용 없음)";
              const kind    = v.vlttGbCdNm || v.vlttKndCdNm || "(구분 없음)";
              console.log(`  📄 위반내용 [${i + 1}]: ${content}`);
              console.log(`  🗂  위반구분 [${i + 1}]: ${kind}`);
            });
          } else {
            console.log(`  ✅ 위반 없음`);
          }

          if (!bestItem) {
            console.log("\n🚨 [최종 진단]");
            console.log(`resultCode=00 / 정상 서비스 / totalCount=0`);
            console.log(`API 키 및 활용승인은 정상입니다.`);
            console.log(`파라미터 조합 확인: sigunguCd=${sigunguCd} bjdongCd=${bjdongCd} bun=${bun} / ji=${ji} platGbCd=${platGbCd} (출처: ${source})`);
            console.log(`→ 해당 번지에 건축물이 없거나, 대장 미등록 건물일 수 있습니다.`);
          }

          const mappedBuilding = mapBuildingData(bestItem, floorItems);

          // 위반건축물 정보를 _raw에 포함
          const violationSummary = violationResult.isViolation
            ? {
                isViolation: true,
                violationYn: "Y",
                items: violationResult.items.map((v: any) => ({
                  vlttRnCnts: v.vlttRnCnts || v.vlttCn || null,
                  vlttGbCdNm: v.vlttGbCdNm || v.vlttKndCdNm || null,
                  crtnDay:    v.crtnDay || null,
                })),
              }
            : { isViolation: false, violationYn: "N", items: [] };

          const rawWithStatus  = {
            ...(mappedBuilding?._raw ?? { floors: [] }),
            api_status: apiStatus,
            params_used: { sigunguCd, bjdongCd, bun, ji, platGbCd, pnu, source },
            violation: violationSummary,
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

          // ── approval_date → properties.build_year 동기화 ──────────────────
          // 사용승인일 연도를 properties 테이블에도 저장해 매물카드 즉시 표시 가능
          if (mappedBuilding?.approval_date && pid) {
            const approvalYear = mappedBuilding.approval_date.substring(0, 4);
            // 기존 build_year가 없거나 비어있을 때만 업데이트
            const { data: propRow } = await supabase
              .from("properties").select("build_year").eq("id", pid).maybeSingle();
            if (propRow && (!propRow.build_year || propRow.build_year.trim() === "")) {
              await supabase
                .from("properties")
                .update({ build_year: approvalYear })
                .eq("id", pid);
              console.log(`✅ [build_year 동기화] properties.build_year = ${approvalYear}`);
            }
          }

          // ── elevator → properties.elevator 동기화 ─────────────────────────
          // 공적장부에서 엘리베이터 정보가 확인된 경우 properties 테이블에도 반영
          if (mappedBuilding && pid) {
            const apiElev = mappedBuilding.elevator;
            const { data: propRow2 } = await supabase
              .from("properties").select("elevator, build_year").eq("id", pid).maybeSingle();
            if (propRow2 && propRow2.elevator !== apiElev) {
              await supabase
                .from("properties")
                .update({ elevator: apiElev })
                .eq("id", pid);
              console.log(`✅ [elevator 동기화] properties.elevator = ${apiElev} (${mappedBuilding._raw?.elevatorDetail})`);
            }
          }
        } // end if (needBuilding)

        // ── 3b. 공시지가 + 토지특성 (land-proxy Edge Function 우선 위임) ──────────────
        // 배경: Supabase eu-central-1 → 한국 토지 API(nsdi/VWorld) IP 차단 확인됨
        // 구조: land-proxy 우선 → LAND_PROXY_URL 국내 프록시 → fallback nsdi 직접호출
        if (needLand && pnu) {
          const stdrYear = String(new Date().getFullYear() - 1); // 전년도 기준연도
          console.log("\n💰 [공시지가+토지특성 조회 시작 → land-proxy 우선 위임]");
          console.log(`  📍 PNU: ${pnu} (${pnu.length}자리) ${pnu.length === 19 ? "✅" : "❌ 19자리 아님"}`);
          console.log(`  🔢 sigunguCd: ${sigunguCd} | bjdongCd: ${bjdongCd} | platGbCd: ${platGbCd}`);
          console.log(`  1️⃣  bun: ${bun} (${bun.length}자리) ${bun.length === 4 ? "✅" : "❌"}`);
          console.log(`  2️⃣  ji:  ${ji}  (${ji.length}자리) ${ji.length === 4 ? "✅" : "❌"}`);
          console.log(`  📅 stdrYear: ${stdrYear}`);

          let officialPrice: string | null = null;
          let landCategory:  string | null = null;
          let landArea:      string | null = null;
          let useZone:       string | null = null;
          let roadAccess:    string | null = null;
          let landKeyError   = false;
          let landConnError  = false;
          const landDiagnostics: Record<string, unknown> = {};

          // ── land-proxy 우선 호출 (LAND_PROXY_URL 설정 시 국내 프록시 경유) ──
          try {
            const landProxyUrl = `${supabaseUrl}/functions/v1/land-proxy`;
            console.log(`\n🌐 [land-proxy] 국내 프록시 호출 시작`);
            console.log(`  - endpoint : ${landProxyUrl}`);
            console.log(`  - pnu      : ${pnu}`);
            console.log(`  - stdrYear : ${stdrYear}`);

            const landRes = await fetch(landProxyUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${supabaseKey}`,
                "apikey": supabaseKey,
              },
              body: JSON.stringify({ pnu, property_id: pid, stdrYear }),
              signal: AbortSignal.timeout(25000),
            });

            const landText = await landRes.text();
            console.log(`\n✅ [land-proxy] 국내 프록시 응답 수신`);
            console.log(`  - HTTP status: ${landRes.status}`);
            console.log(`  - raw(300)   : ${landText.substring(0, 300)}`);

            if (landRes.ok) {
              let landJson: any = null;
              try { landJson = JSON.parse(landText); } catch { /* 무시 */ }

              if (landJson) {
                if (landJson.key_error)        landKeyError      = true;
                if (landJson.land_conn_error)  landConnError     = true;
                if (landJson.all_years_no_data) (landDiagnostics as any).all_years_no_data = true;

                officialPrice = landJson.official_price ?? null;
                landCategory  = landJson.land_category  ?? null;
                landArea      = landJson.land_area       ?? null;
                useZone       = landJson.use_zone        ?? null;
                roadAccess    = landJson.road_access     ?? null;

                const proxyUsed  = landJson.proxy_used  ?? "unknown";
                const stdrYrUsed = landJson.stdrYear_used ?? "없음";
                if (landJson.verdict === "success") {
                  console.log(`  ✅ [land-proxy 성공] proxy_used=${proxyUsed} | stdrYear=${stdrYrUsed} | 공시지가: ${officialPrice}`);
                } else if (landJson.all_years_no_data) {
                  console.log(`  📭 [land-proxy] 3개 연도(2025·2024·2026) 모두 데이터 없음`);
                  console.log(`  → 해당 지번의 공시지가 정보가 기준연도에 미고시 또는 미존재 가능성`);
                } else if (landJson.land_conn_error) {
                  console.log(`  🔌 [land-proxy] 국내 프록시 호출 실패 (연결 차단 또는 프록시 미설정)`);
                  console.log(`  ⚠️  [land-proxy] fallback nsdi 직접호출은 land-proxy 내부에서 이미 시도됨`);
                } else {
                  console.log(`  ⚠️  [land-proxy 실패] verdict=${landJson.verdict} | proxy_used=${proxyUsed}`);
                }
              }
            } else {
              console.log(`  🔌 [land-proxy] 국내 프록시 호출 실패 — HTTP ${landRes.status}`);
              landConnError = true;
            }
          } catch (e) {
            const errMsg    = String(e);
            const isConnErr = errMsg.includes("connection closed") || errMsg.includes("timed out") || errMsg.includes("AbortError");
            console.log(`  ${isConnErr ? "🔌" : "❌"} [land-proxy] 국내 프록시 호출 실패: ${errMsg.substring(0, 200)}`);
            if (isConnErr) landConnError = true;
          }

          // ── 토지 전체 실패 최종 진단 ─────────────────────────────────────
          if (!officialPrice && !landCategory && !landArea) {
            const hasBuildingResult = !!(buildingData as any)?.main_purpose;
            console.log("\n⚠️ [토지대장 최종 진단 — 원인 우선순위]");
            console.log("  ┌─────────────────────────────────────────────────────────────┐");
            if (hasBuildingResult) {
              console.log("  │ 🏗️ 건축물대장(1613000): 정상 조회 성공                      │");
            }
            if (landKeyError) {
              console.log("  │ 🔴 1순위: API KEY 값 오류 또는 허용 도메인 불일치           │");
            } else if (landConnError) {
              console.log("  │ 🔌 1순위: 연결 실패 — Supabase eu-central-1 → 한국 서버 차단│");
              console.log("  │    LAND_PROXY_URL 시크릿에 국내 프록시 URL을 설정하세요      │");
            } else {
              console.log("  │ 🟡 1순위: nsdi endpoint 경로 불일치                        │");
            }
            console.log("  │ 🟡 2순위: nsdi WFS 파라미터 형식 오류                      │");
            console.log("  │ 🟡 3순위: 응답 파싱 오류 (JSON/XML 구조 차이)              │");
            console.log("  │ 🟡 4순위: 실제 토지 데이터 미존재                          │");
            console.log("  │ ⚪ 5순위: 서비스 승인 문제 (낮음 — 건축물 정상)             │");
            console.log("  └─────────────────────────────────────────────────────────────┘");
            console.log(`  → PNU: ${pnu} (${pnu.length}자리)`);
            if (landConnError) {
              console.log("  → 국내 서버 프록시 필요 (LAND_PROXY_URL 시크릿 설정)");
            }
          }

          // land_summary 진단 플래그 저장 (all_years_no_data는 land-proxy 응답 파싱 시 이미 설정됨)
          if (landKeyError)  landDiagnostics.land_key_error   = true;
          if (landConnError) landDiagnostics.land_conn_error  = true;
          if (!officialPrice && !landKeyError && !landConnError) {
            landDiagnostics.land_no_data = true;
          }

          console.log("💰 [공시지가 최종]:", officialPrice);
          console.log("🌱 [토지특성 최종]:", { landCategory, landArea, useZone, roadAccess });
          if (landKeyError)  console.log("🔴 [KEY 오류] DATA_GO_KR_API_KEY 값 오류 또는 허용 도메인 불일치");
          if (landConnError) console.log("🔌 [연결 실패] 한국 서버 IP 접근 차단 — LAND_PROXY_URL 설정 필요");

          const dongName = propertyAddress.match(/([가-힣]+동|[가-힣]+면|[가-힣]+읍)/)?.[1] || "";
          const lotStr   = `${dongName} ${bun.replace(/^0+/, "") || "0"}-${ji.replace(/^0+/, "") || "0"}`.trim();

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
            if (updated) landData = { ...updated, _diagnostics: landDiagnostics };
          } else {
            const { data: inserted } = await supabase
              .from("land_summary")
              .insert({ property_id: pid, lot_number: lotStr, official_price: officialPrice ?? null, land_category: landCategory ?? null, land_area: landArea ?? null, use_zone: useZone ?? null, road_access: roadAccess ?? null })
              .select().single();
            if (inserted) landData = { ...inserted, _diagnostics: landDiagnostics };
          }
          console.log("✅ [토지 정보 저장 완료]");
        } else if (needLand && !pnu) {
          console.log("⚠️ [PNU 생성 실패] 법정동코드 없음 → 공시지가 조회 불가");
          if (!landData) {
            const { data: inserted } = await supabase.from("land_summary")
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
      has_building:          result.has_building,
      has_land:              result.has_land,
      building_main_purpose: (result.building_summary as any)?.main_purpose,
      official_price:        (result.land_summary as any)?.official_price,
    });
    console.log("✅ [property-summary] 완료");

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
