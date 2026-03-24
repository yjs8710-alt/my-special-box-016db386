import { useState, useEffect } from "react";
import { X, Layers, AlertTriangle, Building2, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PublicRecordModalProps {
  address: string;
  propertyId?: string; // DB UUID (dbId)
  onClose: () => void;
}

/* ── Row 컴포넌트 ── */
const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex items-start gap-3 py-2 border-b border-border/30 last:border-0">
    <span className="w-[90px] flex-shrink-0 text-[11px] text-muted-foreground font-medium leading-tight pt-0.5">{label}</span>
    <span className="text-[11px] font-semibold text-foreground leading-tight flex-1">{value ?? "-"}</span>
  </div>
);

/* ── SectionHeader ── */
const SectionHeader = ({ emoji, title, bg }: { emoji: string; title: string; bg: string }) => (
  <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border" style={{ background: bg }}>
    <span className="text-base leading-none">{emoji}</span>
    <span className="text-[12px] font-extrabold text-foreground">{title}</span>
  </div>
);

/* ── EmptySection ── */
const EmptySection = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center gap-2 py-5 px-4">
    <AlertTriangle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
    <p className="text-[11px] text-muted-foreground">{message}</p>
  </div>
);

/* ── SkeletonRow ── */
const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-2 border-b border-border/30 last:border-0 animate-pulse">
    <div className="w-[90px] h-3 bg-muted rounded" />
    <div className="flex-1 h-3 bg-muted/70 rounded" />
  </div>
);

export default function PublicRecordModal({ address, propertyId, onClose }: PublicRecordModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [building, setBuilding] = useState<Record<string, unknown> | null>(null);
  const [land, setLand] = useState<Record<string, unknown> | null>(null);
  const [fetchedFrom, setFetchedFrom] = useState<"db" | "api" | null>(null);

  

  /** 값이 있는지 판단 (null / "" / "조회 결과 없음" 제외) */
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

        // property_id가 없으면 address로 매물 조회
        if (!pid && address) {
          const { data: propRow } = await supabase
            .from("properties")
            .select("id")
            .eq("address", address)
            .maybeSingle();
          if (propRow) pid = propRow.id;
          console.log("📌 address로 조회한 property_id:", pid ?? "(없음)");
        }

        // ── 항상 Edge Function 호출 (최신 데이터 보장) ──
        console.log("⚡ Edge Function 호출 → address:", address, "pid:", pid);
        const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/property-summary`;
        const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
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
        console.log("📡 PROPERTY_SUMMARY_RESPONSE", data);

        if (!res.ok) throw new Error(data.error || "공적장부 조회 실패");

        const bSum = data.building_summary ?? null;
        const lSum = data.land_summary ?? null;

        console.log("📦 [building_summary] 조회 결과:", bSum);
        console.log("🌍 [land_summary] 조회 결과:", lSum);

        // building _raw 파싱해서 최상위 필드로 병합
        if (bSum && bSum._raw && typeof bSum._raw === "object") {
          const raw = bSum._raw as Record<string, unknown>;
          // DB null 필드를 _raw 값으로 보완
          if (!hasVal(bSum.main_purpose) && hasVal(raw.mainPurpsCdNm)) bSum.main_purpose = raw.mainPurpsCdNm;
          if (!hasVal(bSum.total_area) && hasVal(raw.totArea)) bSum.total_area = raw.totArea;
          if (!hasVal(bSum.building_area) && hasVal(raw.archArea)) bSum.building_area = raw.archArea;
          if (!hasVal(bSum.land_area) && hasVal(raw.platArea)) bSum.land_area = raw.platArea;
          if (!hasVal(bSum.approval_date) && hasVal(raw.useAprDay)) bSum.approval_date = raw.useAprDay;
          if (!hasVal(bSum.floors_above) && hasVal(raw.grndFlrCnt)) bSum.floors_above = raw.grndFlrCnt;
          if (!hasVal(bSum.floors_below) && hasVal(raw.ugrndFlrCnt)) bSum.floors_below = raw.ugrndFlrCnt;
          if (!hasVal(bSum.parking_count) && hasVal(raw.indrMechUtcnt)) bSum.parking_count = raw.indrMechUtcnt;
          if (bSum.elevator === false && raw.elevYn === "Y") bSum.elevator = true;
          if (!hasVal(bSum.building_name) && hasVal(raw.bldNm)) bSum.building_name = raw.bldNm;
        }

        setBuilding(bSum);
        setLand(lSum);
        setFetchedFrom("api");
        console.log("✅ [공적장부] 렌더링 완료");
      } catch (e: unknown) {
        console.error("❌ [공적장부] 조회 실패:", e);
        setError(e instanceof Error ? e.message : "조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address, propertyId]);

  const str = (v: unknown) => (v != null && v !== "" && v !== "조회 결과 없음" ? String(v) : null);

  /* ── 건축물 _raw 데이터 파싱 ── */
  const raw = building?._raw && typeof building._raw === "object"
    ? (building._raw as Record<string, unknown>)
    : null;
  const floors = raw?.floors && Array.isArray(raw.floors)
    ? (raw.floors as Array<Record<string, string>>)
    : [];

  /* 건축물 주요 필드 중 실제 값이 하나라도 있는지 */
  const hasAnyBuildingData = building && (
    str(building.building_name) ||
    str(building.main_purpose) ||
    str(building.total_area) ||
    str(building.approval_date) ||
    str(building.floors_above)
  );
  /* 토지 주요 필드 중 실제 값이 하나라도 있는지 */
  const hasAnyLandData = land && (
    str(land.land_category) ||
    str(land.land_area) ||
    str(land.official_price) ||
    str(land.use_zone)
  );

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
              {/* 스켈레톤 미리보기 */}
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

              {/* ① 토지 정보 */}
              <SectionHeader emoji="🌍" title="토지 정보" bg="hsl(142 50% 96%)" />
              {land ? (
                <div className="px-4 py-1">
                  <Row label="지번주소" value={str(land.lot_number) ?? address} />
                  <Row label="공시지가" value={str(land.official_price)} />
                  <Row label="토지면적" value={str(land.land_area)} />
                  <Row label="지목" value={str(land.land_category)} />
                  <Row label="용도지역" value={str(land.use_zone)} />
                  <Row label="도로조건" value={str(land.road_access)} />
                  {!hasAnyLandData && (
                    <p className="text-[10px] text-muted-foreground/50 pt-1 pb-2 text-center">
                      국토교통부 미등록 지번이거나 API 조회 실패
                    </p>
                  )}
                </div>
              ) : (
                <EmptySection message="토지대장 데이터 없음" />
              )}


              <div className="h-1.5 bg-muted/40 my-1" />

              {/* ② 건축물 정보 */}
              <SectionHeader emoji="🏢" title="건축물 정보" bg="hsl(var(--primary) / 0.05)" />
              {building ? (
                <div className="px-4 py-1">
                  <Row label="건물명" value={str(building.building_name)} />
                  <Row
                    label="건축물용도"
                    value={str(building.main_purpose) === "조회 결과 없음" ? null : str(building.main_purpose)}
                  />
                  <Row label="연면적" value={str(building.total_area)} />
                  <Row label="대지면적" value={str(building.land_area)} />
                  <Row label="건축면적" value={str(building.building_area)} />
                  <Row label="사용승인일" value={str(building.approval_date)} />
                  <Row
                    label="층수"
                    value={
                      building.floors_above
                        ? `지상 ${building.floors_above}층${
                            building.floors_below && String(building.floors_below) !== "0"
                              ? ` / 지하 ${building.floors_below}층`
                              : ""
                          }`
                        : null
                    }
                  />
                  <Row
                    label="주차대수"
                    value={
                      str(building.parking_count) && str(building.parking_count) !== "0"
                        ? `${building.parking_count}대`
                        : str(building.parking_count)
                    }
                  />
                  <Row
                    label="엘리베이터"
                    value={
                      building.elevator === true
                        ? "있음"
                        : building.elevator === false
                        ? "없음"
                        : null
                    }
                  />
                  {/* _raw 추가 필드 */}
                  {raw && (
                    <>
                      {raw.strctCdNm && <Row label="구조" value={str(raw.strctCdNm)} />}
                      {raw.bcRat && <Row label="건폐율" value={str(raw.bcRat)} />}
                      {raw.vlRat && <Row label="용적률" value={str(raw.vlRat)} />}
                      {raw.hhldCnt && Number(raw.hhldCnt) > 0 && (
                        <Row label="세대수" value={`${raw.hhldCnt}세대`} />
                      )}
                      {raw.roofCdNm && <Row label="지붕구조" value={str(raw.roofCdNm)} />}
                    </>
                  )}
                  {!hasAnyBuildingData && (
                    <p className="text-[10px] text-muted-foreground/50 pt-1 pb-2 text-center">
                      국토교통부 미등록 지번이거나 API 조회 실패
                    </p>
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
                      <span>층</span>
                      <span>면적</span>
                      <span>용도</span>
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
