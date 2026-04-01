import { useState, useEffect } from "react";
import { X, Layers, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mapBuildingFromDB } from "@/lib/buildingUtils";

interface PublicRecordModalProps {
  address: string;
  propertyId?: string; // DB UUID (dbId)
  onClose: () => void;
}

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
          <td className="py-1.5 px-2 text-[10px] text-muted-foreground font-medium bg-muted/30 w-[80px] whitespace-nowrap border-r border-border/30">
            {l2}
          </td>
          <td
            className={`py-1.5 px-2 text-[11px] font-semibold whitespace-nowrap ${
              highlight ? "text-red-600" : "text-foreground"
            }`}
          >
            {v2 ?? "-"}
          </td>
        </>
      ) : (
        <td colSpan={2} />
      )}
    </tr>
  );
}

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

function SectionHeader({ emoji, title, bg }: { emoji: string; title: string; bg: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border" style={{ background: bg }}>
      <span className="text-base leading-none">{emoji}</span>
      <span className="text-[12px] font-extrabold text-foreground">{title}</span>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0 animate-pulse">
      <div className="w-[90px] h-3 bg-muted rounded" />
      <div className="flex-1 h-3 bg-muted/70 rounded" />
    </div>
  );
}

const hasVal = (v: unknown) => v !== null && v !== undefined && v !== "" && v !== "-" && v !== "조회 결과 없음";

const mergeSummary = (
  dbData: Record<string, any> | null,
  apiData: Record<string, any> | null,
): Record<string, any> | null => {
  if (!dbData && !apiData) return null;
  if (!dbData) return apiData;
  if (!apiData) return dbData;

  const dbRaw = dbData._raw && typeof dbData._raw === "object" ? (dbData._raw as Record<string, any>) : {};

  const apiRaw = apiData._raw && typeof apiData._raw === "object" ? (apiData._raw as Record<string, any>) : {};

  const mergedRaw: Record<string, any> = {
    ...dbRaw,
    ...apiRaw,
  };

  if (!Array.isArray(mergedRaw.floors) || mergedRaw.floors.length === 0) {
    mergedRaw.floors = Array.isArray(dbRaw.floors) ? dbRaw.floors : [];
  }

  if (!Array.isArray(mergedRaw.allBuildings) || mergedRaw.allBuildings.length === 0) {
    mergedRaw.allBuildings = Array.isArray(dbRaw.allBuildings) ? dbRaw.allBuildings : [];
  }

  if (!Array.isArray(mergedRaw.exposFloors) || mergedRaw.exposFloors.length === 0) {
    mergedRaw.exposFloors = Array.isArray(dbRaw.exposFloors) ? dbRaw.exposFloors : [];
  }

  if (!mergedRaw.violation && dbRaw.violation) {
    mergedRaw.violation = dbRaw.violation;
  }

  return {
    ...dbData,
    ...apiData,
    _raw: mergedRaw,
  };
};

export default function PublicRecordModal({ address, propertyId, onClose }: PublicRecordModalProps) {
  const [loading, setLoading] = useState(true);
  const [enhancing, setEnhancing] = useState(false);
  const [error, setError] = useState("");
  const [building, setBuilding] = useState<Record<string, any> | null>(null);
  const [land, setLand] = useState<Record<string, any> | null>(null);
  const [fetchedFrom, setFetchedFrom] = useState<"db" | "api" | null>(null);

  const str = (v: unknown) => (v != null && v !== "" && v !== "조회 결과 없음" ? String(v) : null);

  /** _raw 보강 로직 (building에 적용) */
  const enrichBuilding = (bSum: Record<string, any>) => {
    if (bSum._raw && typeof bSum._raw === "object") {
      const raw = bSum._raw as Record<string, any>;
      const firstBuilding =
        Array.isArray(raw.allBuildings) && raw.allBuildings.length > 0 ? raw.allBuildings[0] : null;

      if (!hasVal(bSum.main_purpose)) bSum.main_purpose = raw.mainPurpsCdNm ?? firstBuilding?.mainPurpsCdNm ?? bSum.main_purpose;
      if (!hasVal(bSum.total_area)) bSum.total_area = raw.totArea ?? firstBuilding?.totArea ?? bSum.total_area;
      if (!hasVal(bSum.building_area)) bSum.building_area = raw.archArea ?? firstBuilding?.archArea ?? bSum.building_area;
      if (!hasVal(bSum.land_area)) bSum.land_area = raw.platArea ?? firstBuilding?.platArea ?? bSum.land_area;
      if (!hasVal(bSum.approval_date)) bSum.approval_date = raw.useAprDay ?? firstBuilding?.useAprDay ?? bSum.approval_date;
      if (!hasVal(bSum.floors_above)) bSum.floors_above = raw.grndFlrCnt ?? firstBuilding?.grndFlrCnt ?? bSum.floors_above;
      if (!hasVal(bSum.floors_below)) bSum.floors_below = raw.ugrndFlrCnt ?? firstBuilding?.ugrndFlrCnt ?? bSum.floors_below;
      if (!hasVal(bSum.parking_count)) bSum.parking_count = raw.indrMechUtcnt ?? firstBuilding?.indrMechUtcnt ?? bSum.parking_count;
      if (!hasVal(bSum.building_name)) bSum.building_name = raw.bldNm ?? firstBuilding?.bldNm ?? bSum.building_name;
      if (bSum.elevator !== true) {
        if (raw.elevYn === "Y" || String(raw.elevatorDetail ?? "").includes("있음")) {
          bSum.elevator = true;
        }
      }
    }
    return bSum;
  };

  /** _raw 보강 로직 (land에 적용) */
  const enrichLand = (lSum: Record<string, any>) => {
    if (lSum._raw && typeof lSum._raw === "object") {
      const raw = lSum._raw as Record<string, any>;
      lSum.land_category = raw.lndcgrCodeNm ?? lSum.land_category;
      lSum.land_area = raw.lndpclAr ?? lSum.land_area;
      lSum.official_price = raw.indvdlzPblntfPc ?? lSum.official_price;
      lSum.use_zone = raw.prposArea1DstrcNm ?? lSum.use_zone;
      lSum.pnu = raw.pnu ?? lSum.pnu;
      lSum.lot_number = raw.mnnmSlno ?? lSum.lot_number;
    }
    return lSum;
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setEnhancing(false);
    setError("");
    setBuilding(null);
    setLand(null);
    setFetchedFrom(null);

    const fetchData = async () => {
      if (!address && !propertyId) {
        setError("주소 정보가 없습니다.");
        setLoading(false);
        return;
      }

      try {
        let pid = propertyId;

        if (!pid && address) {
          const { data: propRow } = await supabase
            .from("properties")
            .select("id")
            .eq("address", address)
            .maybeSingle();
          if (propRow?.id) pid = propRow.id;
        }

        // ── Phase 1: DB 즉시 표시 ────────────────────────────────────
        let dbBuilding: Record<string, any> | null = null;
        let dbLand: Record<string, any> | null = null;
        let hasDBData = false;

        if (pid) {
          const [bRes, lRes] = await Promise.all([
            supabase.from("building_summary").select("*").eq("property_id", pid).maybeSingle(),
            supabase.from("land_summary").select("*").eq("property_id", pid).maybeSingle(),
          ]);

          dbBuilding = (bRes.data as Record<string, any> | null) ?? null;
          dbLand = (lRes.data as Record<string, any> | null) ?? null;

          const bHasData = dbBuilding && (dbBuilding.main_purpose || dbBuilding.total_area || dbBuilding.approval_date);
          const lHasData = dbLand && (dbLand.land_area || dbLand.land_category || dbLand.official_price);
          hasDBData = !!(bHasData || lHasData);

          if (hasDBData && !cancelled) {
            // DB 데이터를 먼저 즉시 표시 (간소화 뷰)
            setBuilding(dbBuilding);
            setLand(dbLand);
            setFetchedFrom("db");
            setLoading(false);
            console.log("⚡ [Phase 1] DB 캐시 즉시 표시");
          }
        }

        // ── Phase 2: Edge Function으로 _raw 보강 ────────────────────
        if (hasDBData) setEnhancing(true);

        const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/property-summary`;
        const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        console.log("⚡ [Phase 2] Edge Function 호출:", address);

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ address, property_id: pid }),
        });

        if (cancelled) return;

        const data = await res.json();

        if (!res.ok) {
          if (!hasDBData) throw new Error(data.error || "공적장부 조회 실패");
          console.warn("⚠️ Edge Function 실패, DB 캐시 유지");
          setEnhancing(false);
          return;
        }

        const apiBuilding = (data.building_summary as Record<string, any> | null) ?? null;
        const apiLand = (data.land_summary as Record<string, any> | null) ?? null;

        const bSum = mergeSummary(dbBuilding, apiBuilding);
        const lSum = mergeSummary(dbLand, apiLand);

        if (bSum) enrichBuilding(bSum);
        if (lSum) enrichLand(lSum);

        if (!cancelled) {
          setBuilding(bSum);
          setLand(lSum);
          setFetchedFrom(apiBuilding?._raw ? "api" : "db");
          setEnhancing(false);
          if (!hasDBData) setLoading(false);
          console.log("✅ [Phase 2] 최종 병합 완료");
        }
      } catch (e: any) {
        if (!cancelled) {
          console.error("❌ [공적장부] 조회 실패:", e);
          setError(e?.message || "조회 중 오류가 발생했습니다.");
          setLoading(false);
          setEnhancing(false);
        }
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [address, propertyId]);

  const raw = building?._raw && typeof building._raw === "object" ? (building._raw as Record<string, any>) : null;

  const floors = raw?.floors && Array.isArray(raw.floors) ? (raw.floors as Array<Record<string, string>>) : [];

  const allBuildings =
    raw?.allBuildings && Array.isArray(raw.allBuildings) ? (raw.allBuildings as Array<Record<string, any>>) : [];

  const firstBuildingValue = (...fields: string[]) => {
    for (const bldg of allBuildings) {
      for (const field of fields) {
        const value = str(bldg?.[field]);
        if (value) return value;
      }
    }
    return null;
  };

  const headerSource =
    allBuildings.find(
      (bldg) =>
        str(bldg?.bldNm) ||
        str(bldg?.mainPurpsCdNm) ||
        str(bldg?.etcPurps) ||
        str(bldg?.platArea) ||
        str(bldg?.archArea) ||
        str(bldg?.totArea) ||
        str(bldg?.useAprDay)
    ) ?? null;

  const topBuildingRaw =
    raw || headerSource
      ? {
          ...(raw ?? {}),
          ...(headerSource ?? {}),
        }
      : null;

  const headerParkingTotal = allBuildings.reduce((maxTotal, bldg) => {
    const total =
      Number(bldg.indrMechUtcnt ?? 0) +
      Number(bldg.oudrMechUtcnt ?? 0) +
      Number(bldg.indrAutoUtcnt ?? 0) +
      Number(bldg.oudrAutoUtcnt ?? 0);
    return total > maxTotal ? total : maxTotal;
  }, 0);

  const topBuilding =
    building || headerSource
      ? {
          ...(building ?? {}),
          _raw: topBuildingRaw,
          building_name: str(building?.building_name) ?? firstBuildingValue("bldNm", "dongNm") ?? "",
          main_purpose: str(building?.main_purpose) ?? firstBuildingValue("mainPurpsCdNm", "etcPurps") ?? "",
          land_area: str(building?.land_area) ?? firstBuildingValue("platArea") ?? "",
          building_area: str(building?.building_area) ?? firstBuildingValue("archArea") ?? "",
          total_area: str(building?.total_area) ?? firstBuildingValue("totArea") ?? "",
          approval_date: str(building?.approval_date) ?? firstBuildingValue("useAprDay") ?? "",
          floors_above: str(building?.floors_above) ?? firstBuildingValue("grndFlrCnt") ?? "",
          floors_below: str(building?.floors_below) ?? firstBuildingValue("ugrndFlrCnt") ?? "",
          parking_count:
            str(building?.parking_count) ??
            (headerParkingTotal > 0 ? `${headerParkingTotal} 대` : ""),
        }
      : null;

  const buildingExposeSections = allBuildings.filter(
    (bldg) => Array.isArray(bldg.exposFloors) && bldg.exposFloors.length > 0
  );

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
    !!topBuilding &&
    !!(
      str(topBuilding.building_name) ||
      str(topBuilding.main_purpose) ||
      str(topBuilding.total_area) ||
      str(topBuilding.approval_date) ||
      str(topBuilding.floors_above)
    );

  const hasAnyLandData =
    !!land &&
    !!(
      str(land.land_area) ||
      str(land.land_category) ||
      str(land.use_zone) ||
      str(land.official_price) ||
      str(land.road_access) ||
      str(land.pnu)
    );

  const topBMapped = mapBuildingFromDB(topBuilding);

  const renderBuildingSummaryTable = (
    source: Record<string, any> | null,
    mapped: ReturnType<typeof mapBuildingFromDB>
  ) => (
    <table className="w-full border-collapse border border-border/50 text-[11px]">
      <tbody>
        <TRow l1="건물명" v1={str(source?.building_name)} />
        <TRow
          l1="주용도"
          v1={str(source?.main_purpose)}
          l2="사용승인일"
          v2={mapped.approvalDate ?? str(source?.approval_date)}
        />
        <TRow
          l1="연면적"
          v1={str(source?.total_area)}
          l2="대지면적"
          v2={str(source?.land_area)}
        />
        <TRow
          l1="건축면적"
          v1={str(source?.building_area)}
          l2="층수"
          v2={`지상 ${str(source?.floors_above) ?? "-"}층 / 지하 ${str(source?.floors_below) ?? "-"}층`}
        />
        <TRow
          l1="주차대수"
          v1={str(source?.parking_count)}
          l2="엘리베이터"
          v2={mapped.elevatorDetail}
        />
      </tbody>
    </table>
  );

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/60 p-3 sm:p-4" onClick={onClose}>
      <div
        className="w-full bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ maxWidth: "680px", maxHeight: "92vh" }}
        onClick={(e) => e.stopPropagation()}
      >
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
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight truncate max-w-[520px]">{address}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted/60 transition-colors flex-shrink-0 ml-2"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

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
                <div className="px-4 py-4">
                  <p className="text-[11px] text-muted-foreground">토지 데이터 없음 또는 일부 항목만 조회됨</p>
                </div>
              )}

              <div className="h-1.5 bg-muted/40 my-1" />

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
                      style={{ color: isViolation ? "hsl(0 70% 40%)" : "hsl(142 50% 30%)" }}
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

                  // 집합건물: 총괄표제부(첫 항목)의 빈 필드를 다른 동 데이터로 보충
                  const fallbackField = (field: string) => {
                    if (s(bldg[field])) return s(bldg[field]);
                    for (const other of allBuildings) {
                      if (other !== bldg && s(other[field])) return s(other[field]);
                    }
                    return null;
                  };

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
                          <TRow l1="건물명" v1={fallbackField("bldNm")} l2="대장구분" v2={s(bldg.regstrGbCdNm)} />
                          <TRow l1="용도지역" v1={fallbackField("mainPurpsCdNm")} l2="사용승인일" v2={fallbackField("useAprDay")} />
                          <TRow l1="주용도" v1={fallbackField("mainPurpsCdNm")} l2="기타용도" v2={fallbackField("etcPurps")} />
                          <TRow l1="주구조" v1={fallbackField("strctCdNm")} l2="지붕구조" v2={fallbackField("roofCdNm")} />
                          <TRow l1="대지면적" v1={fallbackField("platArea")} l2="건축면적" v2={fallbackField("archArea")} />
                          <TRow l1="연면적" v1={fallbackField("totArea")} l2="용적률산정연면적" v2={fallbackField("vlRatEstmTotArea")} />
                          <TRow l1="건폐율" v1={fallbackField("bcRat")} l2="용적률" v2={fallbackField("vlRat")} />
                          <TRow l1="세대수" v1={fallbackField("hhldCnt") ?? "0"} l2="가구수" v2={fallbackField("fmlyCnt") ?? "0"} />
                          <TRow l1="지상층수" v1={fallbackField("grndFlrCnt")} l2="지하층수" v2={fallbackField("ugrndFlrCnt") ?? "0"} />
                          <TRow l1="엘리베이터" v1={elevDetail} l2="주차" v2={parkDetail} />
                          <TRow l1="허가일" v1={fallbackField("pmsDay")} l2="착공일" v2={fallbackField("stcnsDay")} />
                          <TRow l1="대내진능력" v1={fallbackField("erthqkAblty") ?? "-"} l2="내진설계적용" v2={seismicDesign} />
                        </tbody>
                      </table>

                      {bldg.exposFloors && Array.isArray(bldg.exposFloors) && bldg.exposFloors.length > 0 && (
                        <div className="mt-2">
                          <h4 className="text-[11px] font-bold text-foreground mb-1">
                            층별 전유/공용 면적 ({bldg.exposFloors.length}건)
                          </h4>
                          <table className="w-full border-collapse border border-border/50 text-[10px]">
                            <thead>
                              <tr className="bg-muted/40">
                                <th className="py-1 px-1.5 text-left font-bold text-muted-foreground border-b border-r border-border/40">
                                  층
                                </th>
                                <th className="py-1 px-1.5 text-left font-bold text-muted-foreground border-b border-r border-border/40">
                                  호
                                </th>
                                <th className="py-1 px-1.5 text-left font-bold text-muted-foreground border-b border-r border-border/40">
                                  용도
                                </th>
                                <th className="py-1 px-1.5 text-left font-bold text-muted-foreground border-b border-border/40">
                                  면적
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {bldg.exposFloors.map((ef: any, fi: number) => (
                                <tr key={fi} className="border-b border-border/30 last:border-0">
                                  <td className="py-1 px-1.5 font-semibold text-foreground border-r border-border/30">
                                    {ef.flrNoNm || ef.flrNo || "-"}
                                  </td>
                                  <td className="py-1 px-1.5 text-muted-foreground border-r border-border/30">
                                    {ef.hoNm || "-"}
                                  </td>
                                  <td className="py-1 px-1.5 text-muted-foreground border-r border-border/30">
                                    {ef.mainPurpsCdNm || ef.etcPurps || "-"}
                                  </td>
                                  <td className="py-1 px-1.5 text-muted-foreground">{ef.area || "-"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : hasAnyBuildingData ? (
                <div className="px-3 mt-2">
                  <table className="w-full border-collapse border border-border/50 text-[11px]">
                    <tbody>
                      <TRow l1="건물명" v1={building?.building_name as string} />
                      <TRow
                        l1="주용도"
                        v1={building?.main_purpose as string}
                        l2="사용승인일"
                        v2={bMapped.approvalDate}
                      />
                      <TRow
                        l1="연면적"
                        v1={building?.total_area as string}
                        l2="대지면적"
                        v2={building?.land_area as string}
                      />
                      <TRow
                        l1="건축면적"
                        v1={building?.building_area as string}
                        l2="층수"
                        v2={`지상 ${building?.floors_above ?? "-"}층 / 지하 ${building?.floors_below ?? "-"}층`}
                      />
                      <TRow
                        l1="주차대수"
                        v1={building?.parking_count as string}
                        l2="엘리베이터"
                        v2={bMapped.elevatorDetail}
                      />
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-4 py-4">
                  <p className="text-[11px] text-muted-foreground">건축물 데이터 없음 또는 일부 항목만 조회됨</p>
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
                    {enhancing ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        상세 로딩
                      </span>
                    ) : fetchedFrom === "db" ? "✓ 캐시" : "✓ 실시간"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

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
