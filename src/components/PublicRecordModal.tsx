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

  const str = (v: unknown) => (v != null && v !== "" ? String(v) : null);

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
        // ── 1단계: DB에서 직접 조회 (building_summary + land_summary) ──
        let buildingRow: Record<string, unknown> | null = null;
        let landRow: Record<string, unknown> | null = null;
        let pid = propertyId;

        // property_id가 없으면 address로 properties 테이블에서 id 찾기
        if (!pid && address) {
          const { data: propRow } = await supabase
            .from("properties")
            .select("id")
            .eq("address", address)
            .maybeSingle();
          if (propRow) pid = propRow.id;
          console.log("📌 address로 조회한 property_id:", pid ?? "(없음)");
        }

        if (pid) {
          const [bRes, lRes] = await Promise.all([
            supabase.from("building_summary").select("*").eq("property_id", pid).maybeSingle(),
            supabase.from("land_summary").select("*").eq("property_id", pid).maybeSingle(),
          ]);
          buildingRow = bRes.data ?? null;
          landRow = lRes.data ?? null;
        }

        console.log("📦 [building_summary] 조회 결과:", buildingRow);
        console.log("🌍 [land_summary] 조회 결과:", landRow);

        const hasBuildingData = buildingRow && (buildingRow.main_purpose || buildingRow.total_area || buildingRow.approval_date);
        const hasLandData = landRow && (landRow.land_category || landRow.land_area || landRow.official_price);

        if (hasBuildingData || hasLandData) {
          // DB에 유효한 데이터 있음 → 바로 사용
          setBuilding(buildingRow);
          setLand(landRow);
          setFetchedFrom("db");
          console.log("✅ [공적장부] DB 데이터 렌더링 완료");
          setLoading(false);
          return;
        }

        // ── 2단계: DB에 데이터 없음 → Edge Function 호출 ──
        console.log("⚡ DB 데이터 없음 → Edge Function 호출");
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
        console.log("📡 [property-summary] Edge Function 응답:", data);

        if (!res.ok) throw new Error(data.error || "공적장부 조회 실패");

        setBuilding(data.building_summary ?? null);
        setLand(data.land_summary ?? null);
        setFetchedFrom("api");
        console.log("✅ [공적장부] API 데이터 렌더링 완료");
      } catch (e: unknown) {
        console.error("❌ [공적장부] 조회 실패:", e);
        setError(e instanceof Error ? e.message : "조회 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address, propertyId]);

  /* ── 건축물 _raw 데이터 파싱 ── */
  const raw = building?._raw && typeof building._raw === "object"
    ? (building._raw as Record<string, unknown>)
    : null;
  const floors = raw?.floors && Array.isArray(raw.floors)
    ? (raw.floors as Array<Record<string, string>>)
    : [];

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
