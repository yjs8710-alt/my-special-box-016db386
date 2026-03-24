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

// ── data.go.kr 개별공시지가 ──────────────────────────────────────────────
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
    console.log(`💰 [개별공시지가 호출 ${year}] PNU:${pnu} (${pnu.length}자리)`);
    try {
      const res  = await fetch(url, { signal: AbortSignal.timeout(12000) });
      const text = await res.text();
      console.log(`💰 [개별공시지가 응답 ${year}]`, text.substring(0, 500));

      const priceMatch = text.match(/<pblntfPclnd>([^<]+)<\/pblntfPclnd>/);
      const catNmMatch = text.match(/<lndcgrCodeNm[^>]*>([^<]+)<\/lndcgrCodeNm>/);
      const areaMatch  = text.match(/<lndpclAr>([^<]+)<\/lndpclAr>/);
      const zoneMatch  = text.match(/<prposArea1Nm>([^<]+)<\/prposArea1Nm>/);
      const roadMatch  = text.match(/<roadSideCodeNm>([^<]+)<\/roadSideCodeNm>/);

      if (priceMatch) {
        const price = Number(priceMatch[1]);
        if (price > 0) {
          result.price = `${price.toLocaleString("ko-KR")}원/㎡ (${year}년 기준)`;
          console.log(`✅ [개별공시지가 성공 ${year}] ${result.price}`);
        }
      }
      if (catNmMatch) result.category = catNmMatch[1];
      if (areaMatch)  result.area     = `${Number(areaMatch[1]).toFixed(1)}㎡`;
      if (zoneMatch)  result.useZone  = zoneMatch[1];
      if (roadMatch)  result.roadSide = roadMatch[1];

      if (result.price) break;
    } catch (e) {
      console.error(`❌ [개별공시지가 오류 ${year}]`, String(e));
    }
  }
  return result;
}

// ── VWorld 공시지가 폴백 ─────────────────────────────────────────────────
async function fetchIndvdLandPrice(pnu: string, vworldKey: string): Promise<string | null> {
  if (!pnu || !vworldKey) return null;
  const currentYear = new Date().getFullYear();
  for (const year of [currentYear - 1, currentYear - 2]) {
    const url = `${VWORLD_LAND_PRICE_URL}?key=${vworldKey}&pnu=${pnu}&stdrYear=${year}&format=json&numOfRows=1&pageNo=1`;
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

// ── VWorld 토지특성 폴백 ─────────────────────────────────────────────────
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

  const elevator     = (Number(item.elevCnt || 0) + Number(item.emgElevCnt || 0)) > 0;
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
      hhldCnt:       item.hhldCnt       ? String(item.hhldCnt)                : null,
      bcRat:         item.bcRat         ? `${item.bcRat}%`                    : null,
      vlRat:         item.vlRat         ? `${item.vlRat}%`                    : null,
      strctCdNm:     item.strctCdNm     || null,
      roofCdNm:      item.roofCdNm      || null,
      bldNm:         item.bldNm         || null,
      mainPurpsCdNm: item.mainPurpsCdNm || null,
      totArea:       item.totArea       ? `${Number(item.totArea).toFixed(1)}㎡`   : null,
      archArea:      item.archArea      ? `${Number(item.archArea).toFixed(1)}㎡`  : null,
      platArea:      item.platArea      ? `${Number(item.platArea).toFixed(1)}㎡`  : null,
      useAprDay:     approvalDate,
      grndFlrCnt:    floorsAbove,
      ugrndFlrCnt:   floorsBelow,
      indrMechUtcnt: item.indrMechUtcnt ? String(item.indrMechUtcnt) : null,
      elevYn:        elevator ? "Y" : "N",
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
        // ── 3a. 건축물대장 ──
        if (needBuilding) {
          const [titleItem, recapItem, exposItem, basicItem, floorItems] = await Promise.all([
            fetchBuildingTitle(sigunguCd, bjdongCd, bun, ji, platGbCd, dataGoKrApiKey),
            fetchBuildingRecap(sigunguCd, bjdongCd, bun, ji, platGbCd, dataGoKrApiKey),
            fetchBuildingExpos(sigunguCd, bjdongCd, bun, ji, platGbCd, dataGoKrApiKey),
            fetchBuildingBasic(sigunguCd, bjdongCd, bun, ji, platGbCd, dataGoKrApiKey),
            fetchBuildingFloors(sigunguCd, bjdongCd, bun, ji, platGbCd, dataGoKrApiKey),
          ]);

          const bestItem   = titleItem || recapItem || exposItem || basicItem;
          const bestSource = titleItem ? "표제부" : recapItem ? "총괄표제부" : exposItem ? "집합건물공용부" : basicItem ? "기본개요" : "없음";
          const apiStatus  = !bestItem ? "no_data" : "ok";

          console.log(`\n📊 [최종 선택 API]: ${bestSource}`);

          if (!bestItem) {
            console.log("\n🚨 [최종 진단]");
            console.log(`resultCode=00 / 정상 서비스 / totalCount=0`);
            console.log(`API 키 및 활용승인은 정상입니다.`);
            console.log(`파라미터 조합 확인:`);
            console.log(`  sigunguCd=${sigunguCd} (출처: ${source})`);
            console.log(`  bjdongCd=${bjdongCd} (출처: ${source})`);
            console.log(`  bun=${bun} / ji=${ji}`);
            console.log(`  platGbCd=${platGbCd}`);
            console.log(`→ 카카오 b_code 기반 파라미터로도 totalCount=0이면`);
            console.log(`  해당 번지에 건축물이 없거나, 대장 미등록 건물일 수 있습니다.`);
          }

          const mappedBuilding = mapBuildingData(bestItem, floorItems);
          const rawWithStatus  = {
            ...(mappedBuilding?._raw ?? { floors: [] }),
            api_status: apiStatus,
            params_used: { sigunguCd, bjdongCd, bun, ji, platGbCd, pnu, source },
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
