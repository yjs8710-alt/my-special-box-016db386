/**
 * land-proxy — 토지대장 조회 전용 Edge Function
 *
 * 분리 배경:
 *   • 건축물대장(1613000) : Supabase eu-central-1 → data.go.kr 정상 접근 가능 ✅
 *   • 토지대장(1611000) : VWorld(api.vworld.kr) connection closed + nsdi HTTP 500
 *     → Supabase EU 리전에서 한국 토지 공공 API 접근 차단 확인됨
 *
 * 향후 교체 지점:
 *   • LAND_PROXY_URL 시크릿을 국내 서버 프록시 URL로 설정하면 즉시 전환 가능
 *   • 시크릿 미설정 시 nsdi 직접 호출(fallback)로 동작하며 conn_error 판정 반환
 *
 * stdrYear 재시도:
 *   • 2025 → 2024 → 2026 순서로 최대 3회 자동 재시도
 *   • 하나라도 success이면 해당 결과 반환
 *   • 모두 no_data이면 land_no_data: true + all_years_no_data: true 반환
 *
 * 응답 플래그:
 *   • key_error      : API 키 값 오류 또는 허용 도메인 불일치
 *   • land_conn_error: 연결 실패 (IP 차단 등)
 *   • land_no_data   : 조회 성공 but 데이터 없음
 *   • all_years_no_data: 3개 연도 모두 no_data
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── 엔드포인트 상수 ────────────────────────────────────────────────────────
const NSDI_LAND_PRICE_URL = "https://apis.data.go.kr/1611000/nsdi/IndvdLandPriceService/wfs/getIndvdLandPrice";
const NSDI_LAND_CHAR_URL  = "https://apis.data.go.kr/1611000/nsdi/LandUseService/wfs/getLandUse";

// ── 연도 재시도 순서 ────────────────────────────────────────────────────────
const YEAR_RETRY_ORDER = [2025, 2024, 2026];

// ── 판정 타입 ─────────────────────────────────────────────────────────────
type LandVerdict =
  | "success"
  | "no_data"
  | "key_error"
  | "land_conn_error"
  | "unexpected_error"
  | "parse_error";

interface LandResult {
  official_price:    string | null;
  land_category:     string | null;
  land_area:         string | null;
  use_zone:          string | null;
  road_access:       string | null;
  verdict:           LandVerdict;
  key_error:         boolean;
  land_conn_error:   boolean;
  land_no_data:      boolean;
  all_years_no_data: boolean;
  stdrYear_used:     string | null;
  proxy_used:        "domestic" | "direct_fallback" | "none";
}

const emptyResult = (
  verdict: LandVerdict,
  opts: {
    key_error?: boolean;
    land_conn_error?: boolean;
    land_no_data?: boolean;
    all_years_no_data?: boolean;
  } = {}
): LandResult => ({
  official_price:    null,
  land_category:     null,
  land_area:         null,
  use_zone:          null,
  road_access:       null,
  verdict,
  key_error:         opts.key_error          ?? false,
  land_conn_error:   opts.land_conn_error    ?? false,
  land_no_data:      opts.land_no_data       ?? false,
  all_years_no_data: opts.all_years_no_data  ?? false,
  stdrYear_used:     null,
  proxy_used:        "none",
});

// ── 국내 프록시를 통한 토지 조회 ──────────────────────────────────────────
async function callDomesticProxy(
  proxyUrl: string,
  pnu: string,
  apiKey: string,
  stdrYear: string
): Promise<LandResult> {
  console.log(`\n🌏 [국내 프록시] 호출 시작`);
  console.log(`  - endpoint: ${proxyUrl}`);
  console.log(`  - pnu     : ${pnu}`);
  console.log(`  - stdrYear: ${stdrYear}`);

  try {
    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pnu, apiKey, stdrYear }),
      signal: AbortSignal.timeout(15000),
    });

    const httpS = res.status;
    const text  = await res.text();
    console.log(`  - HTTP status: ${httpS}`);
    console.log(`  - raw(400): ${text.substring(0, 400)}`);

    if (!res.ok) {
      console.log(`  - 판정: unexpected_error (HTTP ${httpS})`);
      return emptyResult("unexpected_error");
    }

    let data: any = null;
    try { data = JSON.parse(text); } catch {
      console.log(`  - 판정: parse_error`);
      return emptyResult("parse_error");
    }

    if (data.key_error) return emptyResult("key_error", { key_error: true });
    if (data.land_conn_error) return emptyResult("land_conn_error", { land_conn_error: true });

    if (data.official_price || data.land_category || data.land_area) {
      console.log(`  - 판정: success (공시지가: ${data.official_price})`);
      return {
        official_price:    data.official_price  ?? null,
        land_category:     data.land_category   ?? null,
        land_area:         data.land_area        ?? null,
        use_zone:          data.use_zone         ?? null,
        road_access:       data.road_access      ?? null,
        verdict:           "success",
        key_error:         false,
        land_conn_error:   false,
        land_no_data:      false,
        all_years_no_data: false,
        stdrYear_used:     stdrYear,
        proxy_used:        "domestic",
      };
    }

    console.log(`  - 판정: land_no_data (프록시 데이터 없음)`);
    return emptyResult("no_data", { land_no_data: true });
  } catch (e) {
    const errMsg    = String(e);
    const isConnErr = errMsg.includes("connection closed") || errMsg.includes("fetch failed") ||
                      errMsg.includes("timed out") || errMsg.includes("AbortError") ||
                      errMsg.includes("ECONNRESET");
    console.log(`\n${isConnErr ? "🔌" : "❌"} [국내 프록시] ${isConnErr ? "연결 실패" : "오류"}`);
    console.log(`  - 원인: ${errMsg.substring(0, 300)}`);
    return emptyResult(isConnErr ? "land_conn_error" : "unexpected_error", {
      land_conn_error: isConnErr,
    });
  }
}

// ── nsdi 단일 연도 호출 ──────────────────────────────────────────────────
async function callNsdiOnce(pnu: string, apiKey: string, stdrYear: string): Promise<LandResult> {
  const encodedKey = encodeURIComponent(apiKey);
  const keyMasked  = apiKey.substring(0, 8) + "***";

  const priceParams = new URLSearchParams({
    pnu,
    stdrYear,
    numOfRows: "1",
    pageNo: "1",
    _type: "json",
  });
  const priceUrl = `${NSDI_LAND_PRICE_URL}?serviceKey=${encodedKey}&${priceParams}`;

  console.log(`\n🌐 [nsdi] 호출 시작`);
  console.log(`  - endpoint       : nsdi/IndvdLandPriceService/wfs/getIndvdLandPrice`);
  console.log(`  - url(masked)    : ${priceUrl.replace(encodedKey, "***MASKED***")}`);
  console.log(`  - querystring    : ${priceParams.toString()}`);
  console.log(`  - pnu            : ${pnu} (${pnu.length}자리${pnu.length === 19 ? " ✅" : " ❌"})`);
  console.log(`  - stdrYear       : ${stdrYear} (포함 ✅)`);
  console.log(`  - serviceKey(masked) : ${keyMasked}`);

  try {
    const res    = await fetch(priceUrl, { signal: AbortSignal.timeout(12000) });
    const httpS  = res.status;
    const text   = await res.text();
    const raw600 = text.substring(0, 600);
    const hasIncorrectKey = text.includes("INCORRECT_KEY") || text.includes("SERVICE_KEY_IS_NOT_REGISTERED_ERROR");

    console.log(`\n✅ [nsdi] 응답 수신`);
    console.log(`  - HTTP status          : ${httpS}`);
    console.log(`  - stdrYear 포함 여부   : ${stdrYear} ✅`);
    console.log(`  - INCORRECT_KEY 포함   : ${hasIncorrectKey ? "⚠️ YES" : "NO"}`);
    console.log(`  - raw 일부             : ${raw600}`);

    // Unexpected errors → endpoint 불일치
    const trimmed = text.trim();
    if (trimmed === "Unexpected errors" || trimmed.startsWith("Unexpected") || trimmed === "API not found") {
      console.log(`  - 판정: unexpected_error`);
      console.log(`  🚨 endpoint 경로 불일치 또는 EU IP 차단: "${trimmed}" (HTTP ${httpS})`);
      return emptyResult("unexpected_error");
    }

    let data: any = null;
    try { data = JSON.parse(text); } catch {
      console.log(`  - 판정: parse_error`);
      return emptyResult("parse_error");
    }

    // KEY 오류 감지
    const errorCode   = data?.error?.errorCode ?? null;
    const statusField = data?.status ?? null;
    const authErrMsg  = data?.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg ?? "";
    const authRtCode  = data?.OpenAPI_ServiceResponse?.cmmMsgHeader?.returnReasonCode ?? "";
    const isKeyErr = hasIncorrectKey || errorCode === "INCORRECT_KEY" || statusField === "INVALID_KEY"
      || authRtCode === "30" || authErrMsg.includes("SERVICE KEY IS NOT REGISTERED")
      || (statusField === "ERROR" && text.includes("KEY"));

    if (isKeyErr) {
      console.log(`  - 판정: key_error`);
      console.log(`  🔴 [1순위] 키가 등록은 되어 있으나 값 오류 또는 허용 도메인 불일치 가능성`);
      return emptyResult("key_error", { key_error: true });
    }

    const header     = data?.response?.header ?? {};
    const body       = data?.response?.body   ?? {};
    const resultCode = header?.resultCode ?? "N/A";
    const totalCount = Number(body?.totalCount ?? 0);

    console.log(`  - resultCode       : ${resultCode}`);
    console.log(`  - totalCount       : ${totalCount}`);

    if (totalCount === 0) {
      console.log(`  - 판정: no_data (stdrYear=${stdrYear}, 해당 연도 데이터 없음)`);
      return emptyResult("no_data", { land_no_data: true });
    }

    const rawItem = body?.items?.item;
    const items   = rawItem ? (Array.isArray(rawItem) ? rawItem : [rawItem]) : [];
    if (items.length > 0) {
      const it    = items[0];
      const price = Number(it?.pblntfPclnd ?? 0);
      if (price > 0) {
        const usedYear = it?.stdrYear ?? it?.stdrYr ?? stdrYear;
        const out: LandResult = {
          official_price:    `${price.toLocaleString("ko-KR")}원/㎡ (${usedYear}년 기준)`,
          land_category:     it.lndcgrCodeNm || null,
          land_area:         it.lndpclAr ? `${Number(it.lndpclAr).toFixed(1)}㎡` : null,
          use_zone:          it.prposArea1Nm || it.prposArea2Nm || null,
          road_access:       it.roadSideCodeNm || null,
          verdict:           "success",
          key_error:         false,
          land_conn_error:   false,
          land_no_data:      false,
          all_years_no_data: false,
          stdrYear_used:     usedYear,
          proxy_used:        "direct_fallback",
        };
        console.log(`  - 판정: success (공시지가: ${out.official_price}, stdrYear: ${usedYear})`);
        return out;
      }
    }

    return emptyResult("no_data", { land_no_data: true });
  } catch (e) {
    const errMsg    = String(e);
    const isConnErr = errMsg.includes("connection closed") || errMsg.includes("SendRequest") ||
                      errMsg.includes("socket hang up") || errMsg.includes("fetch failed") ||
                      errMsg.includes("ECONNRESET") || errMsg.includes("timed out") ||
                      errMsg.includes("AbortError");

    console.log(`\n${isConnErr ? "🔌" : "❌"} [nsdi] ${isConnErr ? "연결 실패" : "응답 오류"}`);
    console.log(`  - stdrYear    : ${stdrYear}`);
    console.log(`  - 원인        : ${errMsg.substring(0, 300)}`);
    console.log(`  - 판정        : ${isConnErr ? "land_conn_error" : "network_error"}`);
    if (isConnErr) {
      console.log(`  💡 Supabase eu-central-1 → 한국 토지 API 서버 IP 차단 확인됨`);
    }
    return emptyResult(isConnErr ? "land_conn_error" : "unexpected_error", {
      land_conn_error: isConnErr,
    });
  }
}

// ── nsdi 연도 재시도 (2025 → 2024 → 2026) ───────────────────────────────
async function callNsdiFallbackWithRetry(pnu: string, apiKey: string): Promise<LandResult> {
  console.log(`\n⚠️  [nsdi 직접 호출 — 연도 재시도 시작: ${YEAR_RETRY_ORDER.join(" → ")}]`);
  console.log(`    [EU IP 차단 가능성 있음 — Unexpected errors 시 endpoint/IP 문제]`);

  const trialLog: string[] = [];
  let lastConnError: LandResult | null = null;
  let keyError: LandResult | null = null;

  for (const year of YEAR_RETRY_ORDER) {
    const stdrYear = String(year);
    console.log(`\n──────────── stdrYear=${stdrYear} 시도 ────────────`);

    const result = await callNsdiOnce(pnu, apiKey, stdrYear);
    trialLog.push(`  ${YEAR_RETRY_ORDER.indexOf(year) + 1}) stdrYear=${stdrYear} → ${result.verdict}`);

    if (result.verdict === "success") {
      console.log(`\n✅ [연도 재시도] stdrYear=${stdrYear} 성공 — 재시도 종료`);
      printTrialSummary(trialLog, pnu);
      return result;
    }

    if (result.verdict === "key_error") {
      console.log(`  🔴 KEY 오류 감지 — 나머지 연도 재시도 불필요`);
      keyError = result;
      break;
    }

    if (result.verdict === "land_conn_error" || result.verdict === "unexpected_error") {
      lastConnError = result;
    }
  }

  printTrialSummary(trialLog, pnu);

  if (keyError) return keyError;

  if (lastConnError) {
    console.log(`\n🔌 [nsdi] 모든 연도 연결 실패 (EU IP 차단 또는 endpoint 불일치)`);
    console.log(`  💡 건축물대장 정상 + 토지 전체 실패 → 토지 endpoint 또는 IP 제한 가능성 높음`);
    return lastConnError;
  }

  // 모두 no_data
  console.log(`\n📭 [nsdi] 3개 연도(${YEAR_RETRY_ORDER.join(", ")}) 모두 데이터 없음`);
  console.log(`  → 해당 지번의 개별공시지가/토지특성 정보가 해당 기준연도에 미고시 또는 미존재할 수 있음`);
  console.log(`  → endpoint 불일치 여부는 별도 확인 필요 (Unexpected errors 없으면 데이터 자체 미존재 가능성)`);
  return emptyResult("no_data", { land_no_data: true, all_years_no_data: true });
}

function printTrialSummary(log: string[], pnu: string) {
  console.log(`\n📋 [토지 API 연도별 시도 결과] pnu=${pnu}`);
  log.forEach((l) => console.log(l));
}

// ── 토지특성 nsdi fallback ───────────────────────────────────────────────
async function callNsdiCharFallback(pnu: string, apiKey: string): Promise<{
  lndcgrCodeNm: string | null;
  lndpclAr:     string | null;
  prposArea1Nm: string | null;
  roadSideCdNm: string | null;
} | null> {
  const encodedKey = encodeURIComponent(apiKey);
  const keyMasked  = apiKey.substring(0, 8) + "***";
  const params     = new URLSearchParams({ pnu, numOfRows: "1", pageNo: "1", _type: "json" });
  const url        = `${NSDI_LAND_CHAR_URL}?serviceKey=${encodedKey}&${params}`;

  console.log(`\n🌐 [nsdi 토지특성] 호출 시작`);
  console.log(`  - endpoint       : nsdi/LandUseService/wfs/getLandUse`);
  console.log(`  - url(masked)    : ${url.replace(encodedKey, "***MASKED***")}`);
  console.log(`  - pnu            : ${pnu}`);
  console.log(`  - serviceKey(masked) : ${keyMasked}`);

  try {
    const res    = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const httpS  = res.status;
    const text   = await res.text();
    const raw600 = text.substring(0, 600);
    const hasIncorrectKey = text.includes("INCORRECT_KEY");

    console.log(`\n✅ [nsdi 토지특성] 응답 수신`);
    console.log(`  - HTTP status          : ${httpS}`);
    console.log(`  - INCORRECT_KEY 포함   : ${hasIncorrectKey ? "⚠️ YES" : "NO"}`);
    console.log(`  - raw 일부             : ${raw600}`);

    const trimmed = text.trim();
    if (trimmed === "Unexpected errors" || trimmed.startsWith("Unexpected")) {
      console.log(`  - 판정: unexpected_error (endpoint 불일치 또는 EU IP 차단)`);
      return null;
    }

    let data: any = null;
    try { data = JSON.parse(text); } catch { return null; }

    const body       = data?.response?.body ?? {};
    const totalCount = Number(body?.totalCount ?? 0);
    console.log(`  - totalCount           : ${totalCount}`);
    if (totalCount === 0) { console.log(`  - 판정: no_data`); return null; }

    const rawItem = body?.items?.item;
    const items   = rawItem ? (Array.isArray(rawItem) ? rawItem : [rawItem]) : [];
    if (items.length > 0) {
      const it = items[0];
      console.log(`  - 판정: success (지목: ${it.lndcgrCodeNm ?? "없음"})`);
      return {
        lndcgrCodeNm: it.lndcgrCodeNm   || null,
        lndpclAr:     it.lndpclAr       ? `${Number(it.lndpclAr).toFixed(1)}㎡` : null,
        prposArea1Nm: it.prposArea1Nm   || it.prposArea2Nm || null,
        roadSideCdNm: it.roadSideCodeNm || null,
      };
    }
    return null;
  } catch (e) {
    const errMsg    = String(e);
    const isConnErr = errMsg.includes("connection closed") || errMsg.includes("timed out");
    console.log(`  - 판정: ${isConnErr ? "land_conn_error" : "network_error"}`);
    console.log(`  - 원인: ${errMsg.substring(0, 200)}`);
    return null;
  }
}

// ── 메인 핸들러 ───────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    // address, bun, ji는 로깅/진단 용도로 수신 (pnu가 있으면 pnu 우선)
    const { pnu, property_id, stdrYear, address, bun, ji } = body;

    console.log(`\n🌍 [land-proxy] 토지 조회 요청`);
    console.log(`  - pnu        : ${pnu ?? "(없음)"}`);
    console.log(`  - address    : ${address ?? "(없음)"}`);
    console.log(`  - bun        : ${bun ?? "(없음)"}`);
    console.log(`  - ji         : ${ji ?? "(없음)"}`);
    console.log(`  - property_id: ${property_id ?? "(없음)"}`);
    console.log(`  - stdrYear   : ${stdrYear ?? "(미전달 — 연도 재시도 모드)"}`);

    if (!pnu || pnu.length !== 19) {
      console.log(`  ❌ pnu 오류: "${pnu}" (${pnu?.length ?? 0}자리)`);
      return new Response(
        JSON.stringify({ error: "pnu가 없거나 19자리가 아닙니다", pnu }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey   = Deno.env.get("DATA_GO_KR_API_KEY")?.trim() ?? "";
    const proxyUrl = Deno.env.get("LAND_PROXY_URL")?.trim();

    console.log(`  - apiKey 존재  : ${!!apiKey}`);
    console.log(`  - LAND_PROXY_URL: ${proxyUrl ? `✅ 설정됨 (${proxyUrl})` : "❌ 미설정 (nsdi fallback 사용)"}`);

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "DATA_GO_KR_API_KEY가 설정되지 않았습니다" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 연도 재시도 순서 결정: 전달된 stdrYear가 있으면 우선, 없으면 기본 순서
    const yearsToTry = stdrYear
      ? [stdrYear, ...YEAR_RETRY_ORDER.map(String).filter(y => y !== stdrYear)]
      : YEAR_RETRY_ORDER.map(String);

    let result: LandResult;

    if (proxyUrl) {
      // ── 🌐 국내 프록시 우선 호출 (연도 재시도) ──────────────────────────
      console.log(`\n🌐 [land-proxy] 국내 프록시 호출 시작 (연도 재시도: ${yearsToTry.join(" → ")})`);

      let proxyResult: LandResult | null = null;
      const proxyTrialLog: string[] = [];

      for (const year of yearsToTry) {
        console.log(`\n──────────── 국내 프록시 stdrYear=${year} 시도 ────────────`);
        const r = await callDomesticProxy(proxyUrl, pnu, apiKey, year);
        proxyTrialLog.push(`  ${yearsToTry.indexOf(year) + 1}) stdrYear=${year} → ${r.verdict}`);

        if (r.verdict === "success") {
          console.log(`\n✅ [land-proxy] 국내 프록시 성공 (stdrYear=${year})`);
          proxyResult = r;
          break;
        }
        if (r.verdict === "key_error") {
          proxyResult = r;
          break;
        }
        if (!proxyResult) proxyResult = r; // 최초 실패 저장
      }

      console.log(`\n📋 [국내 프록시 연도별 시도 결과]`);
      proxyTrialLog.forEach(l => console.log(l));

      if (proxyResult && proxyResult.verdict === "success") {
        result = proxyResult;
      } else if (proxyResult && proxyResult.verdict === "key_error") {
        result = proxyResult;
      } else {
        // 프록시 실패 시 nsdi fallback
        console.log(`\n🔌 [land-proxy] 국내 프록시 모두 실패`);
        console.log(`\n⚠️  [land-proxy] fallback nsdi 직접호출 시작 (연도 재시도 포함)`);
        const fallbackResult = await callNsdiFallbackWithRetry(pnu, apiKey);
        if (fallbackResult.verdict === "success") {
          result = fallbackResult;
          console.log(`  ✅ [land-proxy] fallback nsdi 직접호출 성공`);
        } else {
          result = proxyResult ?? fallbackResult;
          console.log(`  ❌ [land-proxy] fallback nsdi 직접호출도 실패 (verdict=${fallbackResult.verdict})`);
        }
      }
    } else {
      // ── ⚠️ 프록시 미설정: nsdi 직접 호출 (연도 재시도 포함) ──
      console.log(`\n⚠️  [경로 선택] LAND_PROXY_URL 미설정 → nsdi 직접 호출 (연도 재시도 포함)`);
      console.log(`    → EU IP 차단으로 connection_error 가능성 높음`);
      console.log(`\n⚠️  [land-proxy] fallback nsdi 직접호출 시작`);

      const [priceResult, charResult] = await Promise.all([
        callNsdiFallbackWithRetry(pnu, apiKey),
        callNsdiCharFallback(pnu, apiKey),
      ]);

      result = priceResult;

      // 토지특성 병합
      if (charResult) {
        if (!result.land_category && charResult.lndcgrCodeNm) result.land_category = charResult.lndcgrCodeNm;
        if (!result.land_area     && charResult.lndpclAr)     result.land_area     = charResult.lndpclAr;
        if (!result.use_zone      && charResult.prposArea1Nm) result.use_zone      = charResult.prposArea1Nm;
        if (!result.road_access   && charResult.roadSideCdNm) result.road_access   = charResult.roadSideCdNm;
      }
    }

    // ── 최종 진단 로그 ──────────────────────────────────────────────────
    console.log(`\n🌍 토지 응답 — 최종 결과`);
    console.log(JSON.stringify(result, null, 2));
    console.log(`\n📊 [land-proxy 판정 요약]`);
    console.log(`  - verdict           : ${result.verdict}`);
    console.log(`  - key_error         : ${result.key_error}`);
    console.log(`  - land_conn_error   : ${result.land_conn_error}`);
    console.log(`  - land_no_data      : ${result.land_no_data}`);
    console.log(`  - all_years_no_data : ${result.all_years_no_data}`);
    console.log(`  - stdrYear_used     : ${result.stdrYear_used ?? "없음"}`);
    console.log(`  - proxy_used        : ${result.proxy_used}`);
    console.log(`  - official_price    : ${result.official_price}`);
    console.log(`  - land_category     : ${result.land_category}`);

    if (result.all_years_no_data) {
      console.log(`\n📭 [최종 진단] ${YEAR_RETRY_ORDER.join(", ")}년 모두 데이터 없음`);
      console.log(`  → 해당 지번의 개별공시지가 정보가 기준연도에 미고시 또는 미존재 가능성`);
      console.log(`  → PNU: ${pnu}`);
    }

    if (result.land_conn_error && !proxyUrl) {
      console.log(`\n🚨 [최종 진단] Supabase eu-central-1 → 한국 토지 API 서버 접근 차단`);
      console.log(`  ┌─────────────────────────────────────────────────────────────┐`);
      console.log(`  │ 건축물대장(data.go.kr/1613000) : ✅ 정상 조회               │`);
      console.log(`  │ 토지대장(nsdi/VWorld)           : 🔌 연결 실패 (IP 차단)   │`);
      console.log(`  │                                                             │`);
      console.log(`  │ 해결 방법: 국내 서버에 프록시 구축 후 LAND_PROXY_URL 설정   │`);
      console.log(`  └─────────────────────────────────────────────────────────────┘`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("❌ [land-proxy] 오류:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
