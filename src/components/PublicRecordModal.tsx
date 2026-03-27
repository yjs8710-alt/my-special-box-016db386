import { useState, useEffect } from "react";
import { X, Layers, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mapBuildingFromDB } from "@/lib/buildingUtils";

interface PublicRecordModalProps {
  address: string;
  propertyId?: string; // DB UUID (dbId)
  onClose: () => void;
}

/* ── Row 컴포넌트 (ref 없음) ── */
function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
      <span className="w-[90px] flex-shrink-0 text-[11px] text-muted-foreground font-medium leading-tight pt-0.5">{label}</span>
      <span className="text-[11px] font-semibold text-foreground leading-tight flex-1">{value ?? "-"}</span>
    </div>
  );
}

/* ── SectionHeader ── */
function SectionHeader({ emoji, title, bg }: { emoji: string; title: string; bg: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border" style={{ background: bg }}>
      <span className="text-base leading-none">{emoji}</span>
      <span className="text-[12px] font-extrabold text-foreground">{title}</span>
    </div>
  );
}

/* ── EmptySection ── */
function EmptySection({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-5 px-4">
      <AlertTriangle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
      <p className="text-[11px] text-muted-foreground">{message}</p>
    </div>
  );
}

/* ── SkeletonRow ── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0 animate-pulse">
      <div className="w-[90px] h-3 bg-muted rounded" />
      <div className="flex-1 h-3 bg-muted/70 rounded" />
    </div>
  );
}

const CLOUDTYPE_LAND_URL = "https://port-0-node-express-mn6x22nsd44b9fb3.sel3.cloudtype.app/land";

export default function PublicRecordModal({ address, propertyId, onClose }: PublicRecordModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [building, setBuilding] = useState<Record<string, unknown> | null>(null);
  const [land, setLand] = useState<Record<string, unknown> | null>(null);
  const [fetchedFrom, setFetchedFrom] = useState<"db" | "api" | null>(null);

  // ── 토지 직접 조회 (Cloudtype) ──
  const [landLoading, setLandLoading] = useState(false);
  const [landDirect, setLandDirect] = useState<Record<string, unknown> | null>(null);
  const [landError, setLandError] = useState("");

  /** 값이 있는지 판단 */
  const hasVal = (v: unknown) =>
    v != null && v !== "" && v !== "조회 결과 없음" && v !== "-";

  useEffect(() => {
    const fetchData = async () => {
      console.log("🔍 [공적장부] 조회 시작");
      console.log("🆔 property_id:", propertyId ?? "(없음)");
      console.log("📍 address:", address);

      if (!address && !propertyId) {
        setError("주소 정보가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        let pid = propertyId;

        // ── Step 1: property_id 없으면 address로 DB에서 조회 ──
        if (!pid && address) {
          console.log("🔎 [property_id 없음] address로 DB 조회:", address);
          const { data: propRow, error: propErr } = await supabase
            .from("properties")
            .select("id")
            .eq("address", address)
            .maybeSingle();
          if (propErr) console.warn("⚠️ [properties 조회 오류]", propErr.message);
          if (propRow) {
            pid = propRow.id;
            console.log("📌 address로 조회한 property_id:", pid);
          } else {
            console.log("⚠️ [properties] address 완전일치 없음:", address);
          }
        }

        // ── Step 2: DB에서 building_summary / land_summary 조회 (property_id 우선) ──
        if (pid) {
          console.log("📦 [DB 조회] building_summary + land_summary (property_id:", pid, ")");
          const [bRes, lRes] = await Promise.all([
            supabase.from("building_summary").select("*").eq("property_id", pid).maybeSingle(),
            supabase.from("land_summary").select("*").eq("property_id", pid).maybeSingle(),
          ]);

          if (bRes.error) console.warn("⚠️ [building_summary 조회 오류]", bRes.error.message);
          if (lRes.error) console.warn("⚠️ [land_summary 조회 오류]", lRes.error.message);

          console.log("📦 [building_summary] DB 조회 결과:", bRes.data ?? "없음");
          console.log("🌍 [land_summary] DB 조회 결과:", lRes.data ?? "없음");

          const bEmpty = !bRes.data || (!bRes.data.main_purpose && !bRes.data.total_area && !bRes.data.approval_date);
          const lEmpty = !lRes.data || !lRes.data.official_price;

          if (!bEmpty || !lEmpty) {
            // DB에 유효한 데이터 있음
            setBuilding(bRes.data as Record<string, unknown> | null);
            setLand(lRes.data as Record<string, unknown> | null);
            setFetchedFrom("db");
            console.log("✅ [공적장부] DB 캐시 렌더링 완료");
            setLoading(false);
            return;
          }
          console.log("🔄 [DB 데이터 비어있음] API 실시간 조회로 전환...");
        } else {
          console.log("⚠️ [property_id 없음] address만으로 Edge Function 호출");
        }

        // ── Step 3: Edge Function 호출 (실시간 조회) ──
        const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/property-summary`;
        const apiKey   = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        console.log("⚡ [Edge Function 호출] address:", address, "| property_id:", pid ?? "(없음)");

        const res  = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ address, property_id: pid }),
        });
        const data = await res.json();
        console.log("📡 [PROPERTY_SUMMARY_RESPONSE]", data);

        if (!res.ok) throw new Error(data.error || "공적장부 조회 실패");

        const bSum = data.building_summary ?? null;
        const lSum = data.land_summary ?? null;

        console.log("📦 [building_summary] API 조회 결과:", bSum ?? "없음");
        console.log("🌍 [land_summary] API 조회 결과:", lSum ?? "없음");

        // _raw 파싱 → 빈 DB 필드 보완
        if (bSum && bSum._raw && typeof bSum._raw === "object") {
          const raw = bSum._raw as Record<string, unknown>;
          if (!hasVal(bSum.main_purpose) && hasVal(raw.mainPurpsCdNm)) bSum.main_purpose = raw.mainPurpsCdNm;
          if (!hasVal(bSum.total_area) && hasVal(raw.totArea)) bSum.total_area = raw.totArea;
          if (!hasVal(bSum.building_area) && hasVal(raw.archArea)) bSum.building_area = raw.archArea;
          if (!hasVal(bSum.land_area) && hasVal(raw.platArea)) bSum.land_area = raw.platArea;
          if (!hasVal(bSum.approval_date) && hasVal(raw.useAprDay)) bSum.approval_date = raw.useAprDay;
          if (!hasVal(bSum.floors_above) && hasVal(raw.grndFlrCnt)) bSum.floors_above = raw.grndFlrCnt;
          if (!hasVal(bSum.floors_below) && hasVal(raw.ugrndFlrCnt)) bSum.floors_below = raw.ugrndFlrCnt;
          if (!hasVal(bSum.parking_count) && hasVal(raw.indrMechUtcnt)) bSum.parking_count = raw.indrMechUtcnt;
          if (bSum.elevator === false) {
            if (raw.elevatorDetail && String(raw.elevatorDetail).startsWith("있음")) bSum.elevator = true;
            else if (raw.elevYn === "Y") bSum.elevator = true;
          }
          if (!hasVal(bSum.building_name) && hasVal(raw.bldNm)) bSum.building_name = raw.bldNm;
        }

        // ── land_summary 정규화: 새 { area, jimok, zone, price, pnu } 구조 지원 ──
        // land-proxy 응답이 새 구조라면 DB 호환 필드명으로 매핑
        if (lSum && (hasVal(lSum.jimok) || hasVal(lSum.price) || hasVal(lSum.area))) {
          if (!hasVal(lSum.land_category) && hasVal(lSum.jimok))        lSum.land_category  = lSum.jimok;
          if (!hasVal(lSum.official_price) && hasVal(lSum.price))       lSum.official_price = lSum.price;
          if (!hasVal(lSum.land_area) && hasVal(lSum.area))             lSum.land_area       = lSum.area;
          if (!hasVal(lSum.use_zone) && hasVal(lSum.zone))              lSum.use_zone        = lSum.zone;
          console.log("🌍 [land 정규화 완료]:", { land_category: lSum.land_category, official_price: lSum.official_price, land_area: lSum.land_area, use_zone: lSum.use_zone, pnu: lSum.pnu });
        }

        setBuilding(bSum);
        setLand(lSum);
        setFetchedFrom("api");
        console.log("✅ [공적장부] 렌더링 완료");
      } catch (e: unknown) {
        console.error("❌ [공적장부] 조회 실패:", e);
        const reason = e instanceof Error ? e.message : "조회 중 오류가 발생했습니다.";
        console.error("❌ 조회 실패 사유:", reason);
        setError(reason);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address, propertyId]);

  // ── 주소 → PNU 변환 헬퍼 ──
  const resolvePnu = async (addr: string): Promise<string | null> => {
    console.log("🔄 [PNU 변환] 주소로 PNU 조회:", addr);
    const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/address-to-pnu`;
    const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ address: addr }),
      });
      const data = await res.json();
      console.log("🔄 [PNU 변환 응답]", data);
      if (data?.ok && data?.pnu) return data.pnu as string;
      return null;
    } catch (e) {
      console.error("🔄 [PNU 변환 에러]", e);
      return null;
    }
  };

  // ── 토지 Cloudtype 직접 조회 (PNU 기반, 없으면 주소→PNU 변환) ──
  useEffect(() => {
    const pnuFromLand = typeof land?.pnu === "string" ? land.pnu : "";

    // land 데이터가 아직 로딩 중이면 대기
    if (loading) return;

    const fetchLandByPnu = async (pnu: string) => {
      if (!pnu) throw new Error("PNU가 없습니다.");
      const requestUrl = `${CLOUDTYPE_LAND_URL}?pnu=${encodeURIComponent(pnu)}`;
      console.log("LAND_REQUEST_URL:", requestUrl);
      const response = await fetch(requestUrl, { method: "GET" });
      const rawText = await response.text();
      console.log("LAND_RAW_RESPONSE:", rawText);
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error("프록시 서버가 JSON이 아니라 HTML 또는 빈 응답을 반환했습니다.");
      }
      if (!response.ok) throw new Error((data.message as string) || (data.error as string) || "토지 조회 실패");
      // Cloudtype 프록시 사용 표시
      data._proxy_used = "cloudtype";
      return data;
    };

    const run = async () => {
      setLandLoading(true); setLandError(""); setLandDirect(null);

      let pnu = pnuFromLand;

      // PNU가 없으면 주소→PNU 변환
      if (!pnu && address) {
        pnu = await resolvePnu(address) ?? "";
      }

      if (!pnu) {
        setLandError("주소를 먼저 입력하세요");
        setLandLoading(false);
        return;
      }

      console.log("토지조회 PNU:", pnu);

      try {
        const data = await fetchLandByPnu(pnu);
        setLandDirect(data);
      } catch (error: unknown) {
        console.error("토지 조회 실패:", error);
        const errMsg = error instanceof Error ? error.message : "토지 조회 실패";
        const errStack = error instanceof Error ? error.stack : undefined;
        setLandError(errMsg);
        // 오류 상세를 landDirect에 저장하여 화면에 표시
        setLandDirect({
          _error: true,
          _error_message: errMsg,
          _error_stack: errStack ?? null,
          _proxy_used: "cloudtype",
          _verdict: "fetch_error",
          _step: "fetchLandByPnu",
          _pnu: pnu,
        });
      } finally { setLandLoading(false); }
    };

    run();
  }, [land, loading, address]);

  const str = (v: unknown) => (v != null && v !== "" && v !== "조회 결과 없음" ? String(v) : null);

  const raw = building?._raw && typeof building._raw === "object"
    ? (building._raw as Record<string, unknown>)
    : null;
  const floors = raw?.floors && Array.isArray(raw.floors)
    ? (raw.floors as Array<Record<string, string>>)
    : [];

  // api_status === "no_data": API 호출 성공했지만 데이터 없음
  const buildingApiNoData = raw?.api_status === "no_data";

  // 위반건축물 정보
  const violation = raw?.violation && typeof raw.violation === "object"
    ? (raw.violation as { isViolation: boolean; violationYn: string; items: Array<{ vlttRnCnts?: string; vlttGbCdNm?: string; crtnDay?: string }> })
    : null;
  const isViolation = violation?.isViolation === true;
  const hasViolationInfo = violation !== null; // API가 결과를 반환했는지 여부

  const hasAnyBuildingData = building && (
    str(building.building_name) || str(building.main_purpose) ||
    str(building.total_area) || str(building.approval_date) || str(building.floors_above)
  );
  const hasAnyLandData = land && (
    str(land.land_category) || str(land.jimok) ||
    str(land.land_area)     || str(land.area) ||
    str(land.official_price) || str(land.price) ||
    str(land.use_zone)      || str(land.zone)
  );

  // ── 공통 유틸로 건축물 값 가공 (엘리베이터·내진·건축연도) ──
  const bMapped = mapBuildingFromDB(building);

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/60 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxWidth: "460px", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── 헤더 ── */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0"
          style={{ background: "hsl(var(--primary) / 0.06)" }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "hsl(var(--primary) / 0.14)" }}
            >
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-[13px] font-extrabold text-foreground">공적장부 열람</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight truncate max-w-[280px]">{address}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted/60 transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* ── 콘텐츠 ── */}
        <div className="overflow-y-auto flex-1">

          {/* 로딩 */}
          {loading && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-[12px] text-muted-foreground font-medium">공적장부 조회 중...</p>
              <div className="w-full px-4 mt-2 space-y-1">
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </div>
            </div>
          )}

          {/* 오류 */}
          {!loading && error && (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--destructive) / 0.1)" }}>
                <AlertTriangle className="w-6 h-6" style={{ color: "hsl(var(--destructive))" }} />
              </div>
              <p className="text-[13px] font-bold text-foreground">공적장부 조회 실패</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{error}</p>
            </div>
          )}

          {/* 데이터 없음 */}
          {!loading && !error && !building && !land && (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <Layers className="w-10 h-10 text-muted-foreground/20" />
              <p className="text-[13px] font-semibold text-muted-foreground">조회 결과 없음</p>
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                해당 주소의 공적장부 데이터가 없습니다.<br />
                국토교통부 데이터에 미등록된 지번일 수 있습니다.
              </p>
            </div>
          )}

          {/* ── 정상 데이터 출력 ── */}
          {!loading && !error && (building || land) && (
            <div className="flex flex-col">

              {/* ① 토지 정보 — Cloudtype 직접 조회 */}
              <SectionHeader emoji="🌍" title="토지 정보" bg="hsl(142 50% 96%)" />
              {landLoading && (
                <div className="px-4 py-4 text-center text-[12px] text-muted-foreground font-medium">조회중...</div>
              )}
              {landError && (
                <div className="px-4 py-3 text-[12px] font-medium" style={{ color: "hsl(var(--destructive))" }}>토지 조회 실패: {landError}</div>
              )}
              {landDirect && (() => {
                const landData = landDirect.land as Record<string, unknown> | undefined;
                console.log("LAND_PARSED_RESPONSE:", landDirect);
                console.log("landDirect.land:", landData);
                console.log("jimok 경로: landDirect.land.jimok =", landData?.jimok);
                console.log("area 경로: landDirect.land.area =", landData?.area);
                console.log("zone 경로: landDirect.land.zone =", landData?.zone);
                console.log("price 경로: landDirect.land.price =", landData?.price);
                const fmt = (v: unknown) => v === undefined ? "(매핑값 없음)" : v === null ? "(null)" : String(v);
                return (
                  <div className="px-4 py-1">
                    <Row label="PNU" value={fmt(landData?.pnu)} />
                    <Row label="지목" value={fmt(landData?.jimok)} />
                    <Row label="토지면적" value={fmt(landData?.area)} />
                    <Row label="용도지역" value={fmt(landData?.zone)} />
                    <Row label="공시지가" value={fmt(landData?.price)} />
                    <div className="mt-3 p-3 rounded border border-border bg-muted/30">
                      <p className="text-[10px] font-bold text-muted-foreground mb-1">RAW LAND RESPONSE</p>
                      <pre className="text-[9px] text-foreground/70 whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto">
                        {JSON.stringify(landDirect, null, 2)}
                      </pre>
                    </div>
                  </div>
                );
              })()}
              {!landLoading && !landError && !landDirect && (
                <EmptySection message="토지 조회 결과 없음" />
              )}

              <div className="h-1.5 bg-muted/40 my-1" />

              {/* ② 건축물 정보 */}
              <SectionHeader emoji="🏢" title="건축물 정보" bg="hsl(var(--primary) / 0.05)" />
              {building ? (
                <div className="px-4 py-1">
                  {/* 위반건축물 배지 */}
                  {hasViolationInfo && (
                    <div
                      className="flex items-start gap-2 rounded-lg px-3 py-2.5 mb-2 mt-1.5"
                      style={
                        isViolation
                          ? { background: "hsl(0 100% 97%)", border: "1.5px solid hsl(0 80% 80%)" }
                          : { background: "hsl(142 60% 96%)", border: "1.5px solid hsl(142 50% 75%)" }
                      }
                    >
                      <span className="text-base leading-none mt-0.5 flex-shrink-0">
                        {isViolation ? "⚠️" : "✔"}
                      </span>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span
                          className="text-[12px] font-extrabold leading-tight"
                          style={{ color: isViolation ? "hsl(0 70% 40%)" : "hsl(142 50% 30%)" }}
                        >
                          {isViolation ? "위반건축물" : "정상건축물"}
                        </span>
                        {isViolation && violation!.items.length > 0 && (
                          <div className="flex flex-col gap-0.5 mt-0.5">
                            {violation!.items.map((v, i) => (
                              <span key={i} className="text-[10px] leading-snug" style={{ color: "hsl(0 60% 35%)" }}>
                                {v.vlttGbCdNm ? `[${v.vlttGbCdNm}] ` : ""}{v.vlttRnCnts || "위반내용 정보 없음"}
                              </span>
                            ))}
                          </div>
                        )}
                        {!isViolation && (
                          <span className="text-[10px]" style={{ color: "hsl(142 40% 38%)" }}>
                            위반건축물 이력 없음
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {!hasViolationInfo && building && (
                    <div
                      className="flex items-center gap-2 rounded-lg px-3 py-2 mb-2 mt-1.5"
                      style={{ background: "hsl(var(--muted))", border: "1px solid hsl(var(--border))" }}
                    >
                      <span className="text-sm">🏛️</span>
                      <span className="text-[11px] text-muted-foreground">위반건축물 여부 정보 없음</span>
                    </div>
                  )}
                  {/* 소재지 / 도로명 — raw 우선, 없으면 address */}
                  <Row label="소재지" value={str(raw?.platPlc) ?? address} />
                  {raw?.newPlatPlc && <Row label="도로명" value={str(raw.newPlatPlc)} />}
                  <Row label="건물명" value={str(building.building_name)} />
                  <Row label="주용도" value={str(building.main_purpose) === "조회 결과 없음" ? null : str(building.main_purpose)} />
                  {raw?.etcPurps && <Row label="기타용도" value={str(raw.etcPurps)} />}
                  <Row label="주구조" value={raw ? str(raw.strctCdNm) : null} />
                  {raw?.roofCdNm && <Row label="지붕구조" value={str(raw.roofCdNm)} />}
                  <Row label="대지면적" value={str(building.land_area)} />
                  <Row label="건축면적" value={str(building.building_area)} />
                  <Row label="연면적" value={str(building.total_area)} />
                  {raw?.vlRatEstmTotArea && <Row label="용적률산정 연면적" value={str(raw.vlRatEstmTotArea)} />}
                  {raw?.bcRat && <Row label="건폐율" value={str(raw.bcRat)} />}
                  {raw?.vlRat && <Row label="용적률" value={str(raw.vlRat)} />}
                  <Row
                    label="지상층수"
                    value={building.floors_above ? `${building.floors_above}층` : null}
                  />
                  {building.floors_below && String(building.floors_below) !== "0" && (
                    <Row label="지하층수" value={`${building.floors_below}층`} />
                  )}
                  {raw?.hhldCnt && Number(raw.hhldCnt) > 0 && (
                    <Row label="세대수" value={`${raw.hhldCnt}세대`} />
                  )}
                  {raw?.fmlyCnt && Number(raw.fmlyCnt) > 0 && (
                    <Row label="가구수" value={`${raw.fmlyCnt}가구`} />
                  )}
                  {/* 엘리베이터 — 공통 유틸로 정확한 대수 계산 */}
                  <Row label="엘리베이터" value={bMapped.elevatorDetail} />
                  <Row
                    label="주차"
                    value={
                      str(building.parking_count) && str(building.parking_count) !== "0"
                        ? `${building.parking_count}대`
                        : str(building.parking_count)
                    }
                  />
                  {raw?.pmsDay && <Row label="허가일" value={str(raw.pmsDay)} />}
                  {raw?.stcnsDay && <Row label="착공일" value={str(raw.stcnsDay)} />}
                  {/* 사용승인일 — 공통 유틸 기반 */}
                  <Row label="사용승인일" value={bMapped.approvalDate ?? str(building.approval_date)} />
                  {/* 건축연도 — 사용승인일에서 추출 */}
                  {bMapped.buildYear && (
                    <Row label="건축연도" value={`${bMapped.buildYear}년`} />
                  )}
                  {/* 내진능력 — 공통 유틸 기반, 항상 표시 */}
                  <Row label="내진능력" value={bMapped.seismicAblty ?? "-"} />
                  {/* 내진설계 적용 여부 — 공통 유틸 기반, 항상 표시 */}
                  <Row label="내진설계 적용" value={bMapped.seismicDesign ?? "-"} />
                  {!hasAnyBuildingData && (
                    <div className="flex flex-col gap-1.5 pt-2 pb-3 px-1">
                      {buildingApiNoData ? (
                        <>
                          <p className="text-[11px] font-bold text-center" style={{ color: "hsl(38 90% 38%)" }}>
                            건축물대장 조회 결과 없음
                          </p>
                          <div className="rounded-lg p-3 mt-1" style={{ background: "hsl(38 100% 97%)", border: "1px solid hsl(38 80% 85%)" }}>
                            <p className="text-[10px] leading-relaxed" style={{ color: "hsl(38 60% 30%)" }}>
                              현재 응답은 <strong>resultCode 00 (정상)</strong> 이지만 <strong>totalCount = 0</strong>입니다.<br />
                              활용상태는 <strong>승인 완료</strong>로 확인되었습니다.<br /><br />
                              실제 원인은 아래 가능성이 높습니다:<br />
                              <strong>① endpoint 또는 파라미터 불일치</strong><br />
                              <strong>② 해당 지번에 건축물 미등록</strong><br />
                              <strong>③ bun/ji 패딩 형식 불일치</strong>
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-[10px] text-muted-foreground/50 text-center">
                          국토교통부 미등록 지번이거나 API 조회 실패
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <EmptySection message="건축물대장 데이터 없음" />
              )}

              {/* ③ 층별 개요 */}
              {floors.length > 0 && (
                <>
                  <div className="h-1.5 bg-muted/40 my-1" />
                  <SectionHeader emoji="📐" title="층별 개요" bg="hsl(221 90% 97%)" />
                  <div className="px-4 py-2">
                    <div className="grid grid-cols-3 gap-0 text-[10px] font-bold text-muted-foreground border-b border-border/40 pb-1.5 mb-1">
                      <span>층</span><span>면적</span><span>용도</span>
                    </div>
                    {floors.map((f, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-3 gap-0 text-[11px] py-1.5 border-b border-border/20 last:border-0"
                      >
                        <span className="font-semibold text-foreground">{f.flrNoNm || f.flrNo || "-"}</span>
                        <span className="text-muted-foreground">{f.area || "-"}</span>
                        <span className="text-muted-foreground">{f.mainPurpsCdNm || "-"}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* 출처 + 조회 방식 */}
              <div className="px-4 py-3 mt-1 flex items-center justify-between">
                <p className="text-[9px] text-muted-foreground/40">
                  출처: 국토교통부 건축물대장 공공데이터 (data.go.kr)
                </p>
                {fetchedFrom && (
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                    style={
                      fetchedFrom === "db"
                        ? { background: "hsl(142 60% 93%)", color: "hsl(142 50% 35%)" }
                        : { background: "hsl(var(--primary)/0.08)", color: "hsl(var(--primary))" }
                    }
                  >
                    {fetchedFrom === "db" ? "✓ 캐시" : "✓ 실시간"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── 푸터 ── */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-xl text-[13px] font-bold text-primary border border-primary/30 hover:bg-primary/5 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
