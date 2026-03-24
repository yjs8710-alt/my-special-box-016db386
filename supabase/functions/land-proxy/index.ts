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
 * 응답 플래그:
 *   • key_error      : API 키 값 오류 또는 허용 도메인 불일치
 *   • land_conn_error: 연결 실패 (IP 차단 등)
 *   • land_no_data   : 조회 성공 but 데이터 없음
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

// ── 판정 타입 ─────────────────────────────────────────────────────────────
type LandVerdict =
  | "success"
  | "no_data"
  | "key_error"
  | "land_conn_error"
  | "unexpected_error"
  | "parse_error";

interface LandResult {
  official_price:  string | null;
  land_category:   string | null;
  land_area:       string | null;
  use_zone:        string | null;
  road_access:     string | null;
  verdict:         LandVerdict;
  key_error:       boolean;
  land_conn_error: boolean;
  land_no_data:    boolean;
  proxy_used:      "domestic" | "direct_fallback" | "none";
}

const emptyResult = (
  verdict: LandVerdict,
  opts: { key_error?: boolean; land_conn_error?: boolean; land_no_data?: boolean } = {}
): LandResult => ({
  official_price:  null,
  land_category:   null,
  land_area:       null,
  use_zone:        null,
  road_access:     null,
  verdict,
  key_error:       opts.key_error       ?? false,
  land_conn_error: opts.land_conn_error ?? false,
  land_no_data:    opts.land_no_data    ?? false,
  proxy_used:      "none",
});

// ── 국내 프록시를 통한 토지 조회 ──────────────────────────────────────────
async function callDomesticProxy(
  proxyUrl: string,
  pnu: string,
  apiKey: string
): Promise<LandResult> {
  console.log(`\n🌏 [국내 프록시] 호출 시작`);
  console.log(`  - endpoint: ${proxyUrl}`);
  console.log(`  - pnu     : ${pnu}`);

  try {
    const res = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pnu, apiKey }),
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
        official_price:  data.official_price  ?? null,
        land_category:   data.land_category   ?? null,
        land_area:       data.land_area        ?? null,
        use_zone:        data.use_zone         ?? null,
        road_access:     data.road_access      ?? null,
        verdict:         "success",
        key_error:       false,
        land_conn_error: false,
        land_no_data:    false,
        proxy_used:      "domestic",
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

// ── nsdi 직접 호출 (fallback — EU 리전 IP 차단으로 connection_error 예상) ────
async function callNsdiFallback(pnu: string, apiKey: string): Promise<LandResult> {
  console.log(`\n⚠️  [nsdi 직접 호출 fallback — EU IP 차단 가능성 높음]`);

  const encodedKey = encodeURIComponent(apiKey);
  const keyMasked  = apiKey.substring(0, 8) + "***";

  // ── 공시지가 ────────────────────────────────────────────────────────────
  const priceParams = new URLSearchParams({ pnu, numOfRows: "1", pageNo: "1", _type: "json" });
  const priceUrl    = `${NSDI_LAND_PRICE_URL}?serviceKey=${encodedKey}&${priceParams}`;

  console.log(`\n🌐 [nsdi] 호출 시작`);
  console.log(`  - endpoint       : nsdi/IndvdLandPriceService/wfs/getIndvdLandPrice`);
  console.log(`  - url(masked)    : ${priceUrl.replace(encodedKey, "***MASKED***")}`);
  console.log(`  - querystring    : ${priceParams.toString()}`);
  console.log(`  - pnu            : ${pnu} (${pnu.length}자리${pnu.length === 19 ? " ✅" : " ❌"})`);
  console.log(`  - stdrYear 포함 여부 : 없음 (WFS 방식)`);
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

    // "Unexpected errors" → nsdi/VWorld가 EU IP를 차단하거나 endpoint 불일치
    const trimmed = text.trim();
    if (trimmed === "Unexpected errors" || trimmed.startsWith("Unexpected") || trimmed === "API not found") {
      console.log(`  - 판정                 : land_conn_error`);
      console.log(`  🔌 nsdi 서버 응답 오류: "${trimmed}" (HTTP ${httpS})`);
      console.log(`  💡 Supabase eu-central-1 → nsdi.go.kr IP 차단 또는 endpoint 불일치`);
      console.log(`  → LAND_PROXY_URL 시크릿에 국내 서버 프록시 URL 설정 시 즉시 해결 가능`);
      return emptyResult("land_conn_error", { land_conn_error: true });
    }

    let data: any = null;
    try { data = JSON.parse(text); } catch {
      console.log(`  - 판정                 : parse_error`);
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
      console.log(`  - 판정                 : key_error`);
      console.log(`\n🔴 [1순위] 키가 등록은 되어 있으나 값 오류 또는 허용 도메인 불일치 가능성`);
      return emptyResult("key_error", { key_error: true });
    }

    const header     = data?.response?.header ?? {};
    const body       = data?.response?.body   ?? {};
    const resultCode = header?.resultCode ?? "N/A";
    const totalCount = Number(body?.totalCount ?? 0);

    console.log(`  - resultCode       : ${resultCode}`);
    console.log(`  - totalCount       : ${totalCount}`);

    if (totalCount === 0) {
      console.log(`  - 판정                 : land_no_data`);
      return emptyResult("no_data", { land_no_data: true });
    }

    const rawItem = body?.items?.item;
    const items   = rawItem ? (Array.isArray(rawItem) ? rawItem : [rawItem]) : [];
    if (items.length > 0) {
      const it    = items[0];
      const price = Number(it?.pblntfPclnd ?? 0);
      if (price > 0) {
        const stdrYear = it?.stdrYear ?? it?.stdrYr ?? "";
        const out: LandResult = {
          official_price:  `${price.toLocaleString("ko-KR")}원/㎡ (${stdrYear}년 기준)`,
          land_category:   it.lndcgrCodeNm || null,
          land_area:       it.lndpclAr ? `${Number(it.lndpclAr).toFixed(1)}㎡` : null,
          use_zone:        it.prposArea1Nm || it.prposArea2Nm || null,
          road_access:     it.roadSideCodeNm || null,
          verdict:         "success",
          key_error:       false,
          land_conn_error: false,
          land_no_data:    false,
          proxy_used:      "direct_fallback",
        };
        console.log(`  - 판정                 : success (공시지가: ${out.official_price})`);
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
    console.log(`  - endpoint    : nsdi/IndvdLandPriceService/wfs/getIndvdLandPrice`);
    console.log(`  - 원인        : ${errMsg.substring(0, 300)}`);
    console.log(`  - 판정        : ${isConnErr ? "land_conn_error" : "network_error"}`);
    if (isConnErr) {
      console.log(`  💡 Supabase eu-central-1 → 한국 토지 API 서버 IP 차단 확인됨`);
      console.log(`  → 건축물대장(data.go.kr/1613000)은 정상이나 토지(nsdi/VWorld)는 차단된 상태`);
      console.log(`  → LAND_PROXY_URL 시크릿에 국내 서버 프록시 URL을 설정하면 즉시 해결 가능`);
    }
    return emptyResult(isConnErr ? "land_conn_error" : "unexpected_error", {
      land_conn_error: isConnErr,
    });
  }
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
  console.log(`  - stdrYear 포함 여부 : 없음 (WFS 방식)`);
  console.log(`  - serviceKey(masked) : ${keyMasked}`);

  try {
    const res  = await fetch(url, { signal: AbortSignal.timeout(10000) });
    const httpS = res.status;
    const text = await res.text();
    const raw600 = text.substring(0, 600);
    const hasIncorrectKey = text.includes("INCORRECT_KEY");

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
    const { pnu, property_id, stdrYear } = body;

    console.log(`\n🗺️  [land-proxy] 요청`);
    console.log(`  - pnu        : ${pnu}`);
    console.log(`  - property_id: ${property_id ?? "(없음)"}`);
    console.log(`  - stdrYear   : ${stdrYear ?? "(미전달 — fallback 내부에서 자동 설정)"}`);

    if (!pnu || pnu.length !== 19) {
      return new Response(
        JSON.stringify({ error: "pnu가 없거나 19자리가 아닙니다", pnu }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey   = Deno.env.get("DATA_GO_KR_API_KEY")?.trim() ?? "";
    const proxyUrl = Deno.env.get("LAND_PROXY_URL")?.trim(); // 국내 서버 프록시 URL (선택)

    console.log(`  - apiKey 존재  : ${!!apiKey}`);
    console.log(`  - LAND_PROXY_URL: ${proxyUrl ? `✅ 설정됨 (${proxyUrl})` : "❌ 미설정 (nsdi fallback 사용)"}`);

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "DATA_GO_KR_API_KEY가 설정되지 않았습니다" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let result: LandResult;

    if (proxyUrl) {
      // ── 🌐 국내 프록시 우선 호출 ────────────────────────────────────────
      console.log(`\n🌐 [land-proxy] 국내 프록시 호출 시작`);
      console.log(`  - proxy endpoint : ${proxyUrl}`);
      console.log(`  - pnu            : ${pnu}`);
      console.log(`  - stdrYear       : ${stdrYear ?? "(미전달)"}`);

      result = await callDomesticProxy(proxyUrl, pnu, apiKey);

      if (result.verdict === "success") {
        console.log(`\n✅ [land-proxy] 국내 프록시 응답 수신 — 성공`);
      } else if (result.verdict !== "key_error") {
        // 프록시 실패 시 nsdi 직접 fallback 시도
        console.log(`\n🔌 [land-proxy] 국내 프록시 호출 실패 (verdict=${result.verdict})`);
        console.log(`\n⚠️  [land-proxy] fallback nsdi 직접호출 시작`);
        const fallbackResult = await callNsdiFallback(pnu, apiKey);
        if (fallbackResult.verdict === "success") {
          result = fallbackResult;
          console.log(`  ✅ [land-proxy] fallback nsdi 직접호출 성공`);
        } else {
          console.log(`  ❌ [land-proxy] fallback nsdi 직접호출도 실패 (verdict=${fallbackResult.verdict})`);
        }
      }
    } else {
      // ── ⚠️ 프록시 미설정: nsdi 직접 호출 (EU IP 차단으로 conn_error 예상) ──
      console.log(`\n⚠️  [경로 선택] LAND_PROXY_URL 미설정`);
      console.log(`    → nsdi 직접 호출 시작 (EU IP 차단으로 connection_error 가능성 높음)`);
      console.log(`    → 국내 프록시 설정: LAND_PROXY_URL 시크릿에 국내 서버 URL 등록`);
      console.log(`\n⚠️  [land-proxy] fallback nsdi 직접호출 시작`);

      const [priceResult, charResult] = await Promise.all([
        callNsdiFallback(pnu, apiKey),
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
    console.log(`\n📊 [land-proxy 최종 결과]`);
    console.log(`  - 판정           : ${result.verdict}`);
    console.log(`  - key_error      : ${result.key_error}`);
    console.log(`  - land_conn_error: ${result.land_conn_error}`);
    console.log(`  - land_no_data   : ${result.land_no_data}`);
    console.log(`  - proxy_used     : ${result.proxy_used}`);
    console.log(`  - official_price : ${result.official_price}`);
    console.log(`  - land_category  : ${result.land_category}`);

    if (result.land_conn_error && !proxyUrl) {
      console.log(`\n🚨 [최종 진단] Supabase eu-central-1 → 한국 토지 API 서버 접근 차단`);
      console.log(`  ┌─────────────────────────────────────────────────────────────┐`);
      console.log(`  │ 건축물대장(data.go.kr/1613000) : ✅ 정상 조회               │`);
      console.log(`  │ 토지대장(nsdi/VWorld)           : 🔌 연결 실패 (IP 차단)   │`);
      console.log(`  │                                                             │`);
      console.log(`  │ 해결 방법: 국내 서버(EC2/Oracle Cloud Seoul 등)에           │`);
      console.log(`  │           프록시 서버를 구축하고 LAND_PROXY_URL 시크릿 설정  │`);
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
