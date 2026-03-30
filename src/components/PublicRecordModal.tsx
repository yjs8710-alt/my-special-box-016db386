import { useState, useEffect } from "react";
import { X, Layers, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mapBuildingFromDB } from "@/lib/buildingUtils";

interface PublicRecordModalProps {
  address: string;
  propertyId?: string; // DB UUID (dbId)
  onClose: () => void;
}

/* ── 2열 테이블 Row ── */
function TRow({
  l1,
  v1,
  l2,
  v2,
  highlight,
}: {
  l1: string;
  v1?: string | null;
  l2?: string;
  v2?: string | null;
  highlight?: boolean;
}) {
  return (
    <tr className="border-b border-border/40">
      <td className="py-1.5 px-2 text-[10px] text-muted-foreground font-medium bg-muted/30 w-[80px] whitespace-nowrap border-r border-border/30">
        {l1}
      </td>
      <td
        className={`py-1.5 px-2 text-[11px] font-semibold border-r border-border/30 whitespace-nowrap ${
          highlight ? "text-red-600" : "text-foreground"
        }`}
      >
        {v1 ?? "-"}
      </td>
      {l2 !== undefined ? (
        <>
          <td className="py-1.5 px-2 text-[10px] text-muted-foreground font-medium bg-muted/30 w-[70px] whitespace-nowrap border-r border-border/30">
            {l2}
          </td>
          <td className={`py-1.5 px-2 text-[11px] font-semibold ${highlight ? "text-red-600" : "text-foreground"}`}>
            {v2 ?? "-"}
          </td>
        </>
      ) : (
        <td
          colSpan={2}
          className={`py-1.5 px-2 text-[11px] font-semibold ${highlight ? "text-red-600" : "text-foreground"}`}
        ></td>
      )}
    </tr>
  );
}

/* ── Row 컴포넌트 (토지용) ── */
function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
      <span className="w-[90px] flex-shrink-0 text-[11px] text-muted-foreground font-medium leading-tight pt-0.5">
        {label}
      </span>
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

export default function PublicRecordModal({ address, propertyId, onClose }: PublicRecordModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [building, setBuilding] = useState<Record<string, any> | null>(null);
  const [land, setLand] = useState<Record<string, any> | null>(null);
  const [fetchedFrom, setFetchedFrom] = useState<"db" | "api" | null>(null);

  /** 값이 있는지 판단 */
  const hasVal = (v: unknown) => v != null && v !== "" && v !== "조회 결과 없음" && v !== "-";

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

          if (propErr) {
            console.warn("⚠️ [properties 조회 오류]", propErr.message);
          }

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

          if (bRes.error) {
            console.warn("⚠️ [building_summary 조회 오류]", bRes.error.message);
          }
          if (lRes.error) {
            console.warn("⚠️ [land_summary 조회 오류]", lRes.error.message);
          }

          console.log("📦 [building_summary] DB 조회 결과:", bRes.data ?? "없음");
          console.log("🌍 [land_summary] DB 조회 결과:", lRes.data ?? "없음");

          const bEmpty = !bRes.data || (!bRes.data.main_purpose && !bRes.data.total_area && !bRes.data.approval_date);

          const lEmpty =
            !lRes.data ||
            (!lRes.data.land_category &&
              !lRes.data.land_area &&
              !lRes.data.official_price &&
              !lRes.data.use_zone);

          if (!bEmpty || !lEmpty) {
            setBuilding(bRes.data as Record<string, any> | null);
            setLand(lRes.data as Record<string, any> | null);
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
        const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        console.log("⚡ [Edge Function 호출] address:", address, "| property_id:", pid ?? "(없음)");

        const res = await fetch(endpoint, {
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

        if (!res.ok) {
          throw new Error(data.error || "공적장부 조회 실패");
        }

        const bSum = data.building_summary ?? null;
        const lSum = data.land_summary ?? null;

        console.log("📦 [building_summary] API 조회 결과:", bSum ?? "없음");
        console.log("🌍 [land_summary] API 조회 결과:", lSum ?? "없음");

        // building_summary _raw 보완
        if (bSum && bSum._raw && typeof bSum._raw === "object") {
          const raw = bSum._raw as Record<string, unknown>;

          if (!hasVal(bSum.main_purpose) && hasVal(raw.mainPurpsCdNm)) {
            bSum.main_purpose = raw.mainPurpsCdNm;
          }
          if (!hasVal(bSum.total_area) && hasVal(raw.totArea)) {
            bSum.total_area = raw.totArea;
          }
          if (!hasVal(bSum.building_area) && hasVal(raw.archArea)) {
            bSum.building_area = raw.archArea;
          }
          if (!hasVal(bSum.land_area) && hasVal(raw.platArea)) {
            bSum.land_area = raw.platArea;
          }
          if (!hasVal(bSum.approval_date) && hasVal(raw.useAprDay)) {
            bSum.approval_date = raw.useAprDay;
          }
          if (!hasVal(bSum.floors_above) && hasVal(raw.grndFlrCnt)) {
            bSum.floors_above = raw.grndFlrCnt;
          }
          if (!hasVal(bSum.floors_below) && hasVal(raw.ugrndFlrCnt)) {
            bSum.floors_below = raw.ugrndFlrCnt;
          }
          if (!hasVal(bSum.parking_count) && hasVal(raw.indrMechUtcnt)) {
            bSum.parking_count = raw.indrMechUtcnt;
          }
          if (bSum.elevator === false) {
            if (raw.elevatorDetail && String(raw.elevatorDetail).startsWith("있음")) {
              bSum.elevator = true;
            } else if (raw.elevYn === "Y") {
              bSum.elevator = true;
            }
          }
          if (!hasVal(bSum.building_name) && hasVal(raw.bldNm)) {
            bSum.building_name = raw.bldNm;
          }
        }

        // land_summary 정규화
        if (lSum && (hasVal(lSum.jimok) || hasVal(lSum.price) || hasVal(lSum.area))) {
          if (!hasVal(lSum.land_category) && hasVal(lSum.jimok)) {
            lSum.land_category = lSum.jimok;
          }
          if (!hasVal(lSum.official_price) && hasVal(lSum.price)) {
            lSum.official_price = lSum.price;
          }
          if (!hasVal(lSum.land_area) && hasVal(lSum.area)) {
            lSum.land_area = lSum.area;
          }
          if (!hasVal(lSum.use_zone) && hasVal(lSum.zone)) {
            lSum.use_zone = lSum.zone;
          }

          console.log("🌍 [land 정규화 완료]:", {
            land_category: lSum.land_category,
            official_price: lSum.official_price,
            land_area: lSum.land_area,
            use_zone: lSum.use_zone,
            pnu: lSum.pnu,
          });
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

  const str = (v: unknown) => (v != null && v !== "" && v !== "조회 결과 없음" ? String(v) : null);

  const raw = building?._raw && typeof building._raw === "object" ? (building._raw as Record<string, any>) : null;

  const floors = raw?.floors && Array.isArray(raw.floors) ? (raw.floors as Array<Record<string, string>>) : [];

  const allBuildings =
    raw?.allBuildings && Array.isArray(raw.allBuildings) ? (raw.allBuildings as Array<Record<string, any>>) : [];

  const buildingApiNoData = raw?.api_status === "no_data";

  const violation =
    raw?.violation && typeof raw.violation === "object"
      ? (raw.violation as {
          isViolation: boolean;
          violationYn: string;
          items: Array<{
            vlttRnCnts?: string;
            vlttGbCdNm?: string;
            crtnDay?: string;
          }>;
        })
      : null;

  const isViolation = violation?.isViolation === true;
  const hasViolationInfo = violation !== null;

  const hasAnyBuildingData =
    !!building &&
    !!(
      str(building.building_name) ||
      str(building.main_purpose) ||
      str(building.total_area) ||
      str(building.approval_date) ||
      str(building.floors_above)
    );

  const hasAnyLandData =
    !!land &&
    !!(
      str(land.land_category) ||
      str(land.jimok) ||
      str(land.land_area) ||
      str(land.area) ||
      str(land.official_price) ||
      str(land.price) ||
      str(land.use_zone) ||
      str(land.zone) ||
      str(land.pnu)
    );

  // ── 공통 유틸로 건축물 값 가공
  const bMapped = mapBuildingFromDB(building);

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/60 p-3 sm:p-4" onClick={onClose}>
      <div
        className="w-full bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxWidth: "680px", maxHeight: "92vh" }}
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
          {loading && (
            <div className="flex flex-col items-center gap-3 py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-[12px] text-muted-foreground font-medium">공적장부 조회 중...</p>
              <div className="w-full px-4 mt-2 space-y-1">
                {[...Array(5)].map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--destructive) / 0.1)" }}
              >
                <AlertTriangle className="w-6 h-6" style={{ color: "hsl(var(--destructive))" }} />
              </div>
              <p className="text-[13px] font-bold text-foreground">공적장부 조회 실패</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{error}</p>
            </div>
          )}

          {!loading && !error && !building && !land && (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <Layers className="w-10 h-10 text-muted-foreground/20" />
              <p className="text-[13px] font-semibold text-muted-foreground">조회 결과 없음</p>
              <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
                해당 주소의 공적장부 데이터가 없습니다.
                <br />
                국토교통부 데이터에 미등록된 지번일 수 있습니다.
              </p>
            </div>
          )}

          {!loading && !error && (building || land) && (
            <div className="flex flex-col">
              {/* ① 토지 정보 */}
              <SectionHeader emoji="🌍" title="토지 정보" bg="hsl(142 50% 96%)" />

              {hasAnyLandData ? (
                <div className="px-4 py-1">
                  <Row label="PNU" value={str(land?.pnu)} />
                  <Row label="지목" value={str(land?.land_category) ?? str(land?.jimok)} />
                  <Row label="토지면적" value={str(land?.land_area) ?? str(land?.area)} />
                  <Row label="용도지역" value={str(land?.use_zone) ?? str(land?.zone)} />
                  <Row label="공시지가" value={str(land?.official_price) ?? str(land?.price)} />
                </div>
              ) : (
                <EmptySection message="토지 조회 결과 없음" />
              )}

              <div className="h-1.5 bg-muted/40 my-1" />

              {/* ② 건축물 정보 */}
              <SectionHeader emoji="🏢" title="건축물대장" bg="hsl(var(--primary) / 0.05)" />

              {building && hasViolationInfo && (
                <div
                  className="flex items-start gap-2 mx-3 mt-2 mb-1 rounded-lg px-3 py-2.5"
                  style={
                    isViolation
                      ? {
                          background: "hsl(0 100% 97%)",
                          border: "1.5px solid hsl(0 80% 80%)",
                        }
                      : {
                          background: "hsl(142 60% 96%)",
                          border: "1.5px solid hsl(142 50% 75%)",
                        }
                  }
                >
                  <span className="text-base leading-none mt-0.5 flex-shrink-0">{isViolation ? "⚠️" : "✔"}</span>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span
                      className="text-[12px] font-extrabold leading-tight"
                      style={{
                        color: isViolation ? "hsl(0 70% 40%)" : "hsl(142 50% 30%)",
                      }}
                    >
                      {isViolation ? "위반건축물" : "정상건축물"}
                    </span>

                    {isViolation && violation!.items.length > 0 && (
                      <div className="flex flex-col gap-0.5 mt-0.5">
                        {violation!.items.map((v, i) => (
                          <span key={i} className="text-[10px] leading-snug" style={{ color: "hsl(0 60% 35%)" }}>
                            {v.vlttGbCdNm ? `[${v.vlttGbCdNm}] ` : ""}
                            {v.vlttRnCnts || "위반내용 정보 없음"}
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

              {building && !hasViolationInfo && (
                <div
                  className="flex items-center gap-2 mx-3 mt-2 mb-1 rounded-lg px-3 py-2"
                  style={{
                    background: "hsl(var(--muted))",
                    border: "1px solid hsl(var(--border))",
                  }}
                >
                  <span className="text-sm">🏛️</span>
                  <span className="text-[11px] text-muted-foreground">위반건축물 여부 정보 없음</span>
                </div>
              )}

              {building && allBuildings.length > 0 ? (
                allBuildings.map((bldg, idx) => {
                  const s = (v: unknown) => (v != null && v !== "" ? String(v) : null);

                  const dongLabel = s(bldg.dongNm) || s(bldg.bldNm) || `건축물 ${idx + 1}`;
                  const regKind = s(bldg.regstrKindCdNm) || s(bldg.regstrGbCdNm) || "";

                  const elevRide = Number(bldg.rideUseElvtCnt ?? 0);
                  const elevEmg = Number(bldg.emgenUseElvtCnt ?? 0);
                  const elevDetail = elevRide + elevEmg > 0 ? `승용 ${elevRide} 대 / 비상용 ${elevEmg} 대` : "없음";

                  const parkTotal =
                    Number(bldg.indrMechUtcnt ?? 0) +
                    Number(bldg.oudrMechUtcnt ?? 0) +
                    Number(bldg.indrAutoUtcnt ?? 0) +
                    Number(bldg.oudrAutoUtcnt ?? 0);

                  const parkMech = Number(bldg.indrMechUtcnt ?? 0) + Number(bldg.oudrMechUtcnt ?? 0);

                  const parkAuto = Number(bldg.indrAutoUtcnt ?? 0) + Number(bldg.oudrAutoUtcnt ?? 0);

                  const parkDetail = parkTotal > 0 ? `기계식 ${parkMech} 대 / 자주식 ${parkAuto} 대` : "-";

                  const seismicDesign = bldg.erthqkDsgnApplyYn
                    ? String(bldg.erthqkDsgnApplyYn).trim().toUpperCase() === "Y"
                      ? "적용"
                      : String(bldg.erthqkDsgnApplyYn) === "1"
                        ? "적용"
                        : String(bldg.erthqkDsgnApplyYn)
                    : "-";

                  return (
                    <div key={idx} className="px-3 mt-2">
                      <div className="flex justify-center mb-2">
                        <span
                          className="inline-block text-[11px] font-bold text-white px-4 py-1.5 rounded-full"
                          style={{ background: "hsl(var(--primary))" }}
                        >
                          {dongLabel}
                          {regKind && (
                            <span className="block text-[9px] font-normal text-center opacity-80">{regKind}</span>
                          )}
                        </span>
                      </div>

                      <table className="w-full border-collapse border border-border/50 text-[11px]">
                        <tbody>
                          <TRow l1="소재지" v1={s(bldg.platPlc) ?? address} />
                          {s(bldg.newPlatPlc) && <TRow l1="도로명" v1={s(bldg.newPlatPlc)} />}
                          <TRow l1="건물명" v1={s(bldg.bldNm)} l2="건축물대장구조" v2={s(bldg.regstrGbCdNm)} />
                          <TRow l1="용도지역" v1={s(bldg.mainPurpsCdNm)} l2="사용승인일" v2={s(bldg.useAprDay)} />
                          <TRow l1="주용도" v1={s(bldg.mainPurpsCdNm)} l2="기타용도" v2={s(bldg.etcPurps)} />
                          <TRow l1="주구조" v1={s(bldg.strctCdNm)} l2="지붕구조" v2={s(bldg.roofCdNm)} />
                          <TRow l1="대지면적" v1={s(bldg.platArea)} l2="건축면적" v2={s(bldg.archArea)} />
                          <TRow
                            l1="연면적"
                            v1={s(bldg.totArea)}
                            l2="(용적률산정용)연면적"
                            v2={s(bldg.vlRatEstmTotArea)}
                          />
                          <TRow l1="건폐율" v1={s(bldg.bcRat)} l2="용적률" v2={s(bldg.vlRat)} />
                          <TRow l1="세대수" v1={s(bldg.hhldCnt) ?? "0"} l2="가구수" v2={s(bldg.fmlyCnt) ?? "0"} />
                          <TRow l1="지상층수" v1={s(bldg.grndFlrCnt)} l2="지하층수" v2={s(bldg.ugrndFlrCnt) ?? "0"} />
                          <TRow l1="엘리베이터" v1={elevDetail} l2="주차" v2={parkDetail} />
                          <TRow l1="허가일" v1={s(bldg.pmsDay)} l2="착공일" v2={s(bldg.stcnsDay)} />
                          <TRow
                            l1="대내진능력"
                            v1={s(bldg.erthqkAblty) ?? "-"}
                            l2="내진설계 적용 여부"
                            v2={seismicDesign}
                          />
                        </tbody>
                      </table>
                    </div>
                  );
                })
              ) : building ? (
                <div className="px-3 mt-2">
                  <table className="w-full border-collapse border border-border/50 text-[11px]">
                    <tbody>
                      <TRow l1="소재지" v1={str(raw?.platPlc) ?? address} />
                      {raw?.newPlatPlc && <TRow l1="도로명" v1={str(raw.newPlatPlc)} />}
                      <TRow l1="건물명" v1={str(building.building_name)} l2="건축물대장구조" v2="-" />
                      <TRow
                        l1="주용도"
                        v1={str(building.main_purpose)}
                        l2="사용승인일"
                        v2={bMapped.approvalDate ?? str(building.approval_date)}
                      />
                      <TRow
                        l1="주구조"
                        v1={raw ? str(raw.strctCdNm) : null}
                        l2="지붕구조"
                        v2={raw ? str(raw.roofCdNm) : null}
                      />
                      <TRow l1="대지면적" v1={str(building.land_area)} l2="건축면적" v2={str(building.building_area)} />
                      <TRow
                        l1="연면적"
                        v1={str(building.total_area)}
                        l2="(용적률산정용)연면적"
                        v2={raw ? str(raw.vlRatEstmTotArea) : null}
                      />
                      <TRow l1="건폐율" v1={raw ? str(raw.bcRat) : null} l2="용적률" v2={raw ? str(raw.vlRat) : null} />
                      <TRow
                        l1="세대수"
                        v1={raw?.hhldCnt ? String(raw.hhldCnt) : "0"}
                        l2="가구수"
                        v2={raw?.fmlyCnt ? String(raw.fmlyCnt) : "0"}
                      />
                      <TRow
                        l1="지상층수"
                        v1={building.floors_above ? `${building.floors_above}` : null}
                        l2="지하층수"
                        v2={building.floors_below ? `${building.floors_below}` : "0"}
                      />
                      <TRow
                        l1="엘리베이터"
                        v1={bMapped.elevatorDetail}
                        l2="주차"
                        v2={str(building.parking_count) ? `${building.parking_count}대` : "-"}
                      />
                      <TRow
                        l1="대내진능력"
                        v1={bMapped.seismicAblty ?? "-"}
                        l2="내진설계 적용"
                        v2={bMapped.seismicDesign ?? "-"}
                      />
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptySection message="건축물대장 데이터 없음" />
              )}

              {!hasAnyBuildingData && building && (
                <div className="px-4 py-2">
                  {buildingApiNoData ? (
                    <div
                      className="rounded-lg p-3"
                      style={{
                        background: "hsl(38 100% 97%)",
                        border: "1px solid hsl(38 80% 85%)",
                      }}
                    >
                      <p className="text-[10px] leading-relaxed" style={{ color: "hsl(38 60% 30%)" }}>
                        건축물대장 조회 결과 없음 — 해당 지번에 건축물 미등록
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground/50 text-center">
                      국토교통부 미등록 지번이거나 API 조회 실패
                    </p>
                  )}
                </div>
              )}

              {floors.length > 0 && (
                <>
                  <div className="px-3 mt-3 mb-1">
                    <p className="text-[10px] text-muted-foreground italic">
                      * 참고용 자료이므로 실제 내용과 차이가 있을 수 있습니다.
                    </p>
                    <h3 className="text-[13px] font-extrabold text-foreground mt-2 mb-1.5">층별내역</h3>
                  </div>
                  <div className="px-3 pb-2">
                    <table className="w-full border-collapse border border-border/50 text-[11px]">
                      <thead>
                        <tr className="bg-muted/40">
                          <th className="py-1.5 px-2 text-left text-[10px] font-bold text-muted-foreground border-b border-r border-border/40">
                            층
                          </th>
                          <th className="py-1.5 px-2 text-left text-[10px] font-bold text-muted-foreground border-b border-r border-border/40">
                            용도
                          </th>
                          <th className="py-1.5 px-2 text-left text-[10px] font-bold text-muted-foreground border-b border-r border-border/40">
                            면적
                          </th>
                          <th className="py-1.5 px-2 text-left text-[10px] font-bold text-muted-foreground border-b border-border/40">
                            구분
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {floors.map((f, i) => (
                          <tr key={i} className="border-b border-border/30 last:border-0">
                            <td className="py-1.5 px-2 font-semibold text-foreground border-r border-border/30">
                              {f.flrNoNm || f.flrNo || "-"}
                            </td>
                            <td className="py-1.5 px-2 text-muted-foreground border-r border-border/30">
                              {f.mainPurpsCdNm || "-"}
                            </td>
                            <td className="py-1.5 px-2 text-muted-foreground border-r border-border/30">
                              {f.area || "-"}
                            </td>
                            <td className="py-1.5 px-2 text-muted-foreground">주건축물</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div className="px-4 py-3 mt-1 flex items-center justify-between">
                <p className="text-[9px] text-muted-foreground/40">출처: 국토교통부 건축물대장·토지대장 공공데이터</p>
                {fetchedFrom && (
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                    style={
                      fetchedFrom === "db"
                        ? {
                            background: "hsl(142 60% 93%)",
                            color: "hsl(142 50% 35%)",
                          }
                        : {
                            background: "hsl(var(--primary)/0.08)",
                            color: "hsl(var(--primary))",
                          }
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
