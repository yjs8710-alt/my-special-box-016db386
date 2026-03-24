import { useState, useEffect } from "react";
import { X, Layers, AlertTriangle } from "lucide-react";

interface PublicRecordModalProps {
  address: string;
  onClose: () => void;
}

const Row = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
    <span className="w-[88px] flex-shrink-0 text-xs text-muted-foreground font-medium leading-tight pt-0.5">{label}</span>
    <span className="text-xs font-semibold text-foreground leading-tight flex-1">{value ?? "-"}</span>
  </div>
);

const SectionTitle = ({ icon, title, color }: { icon: string; title: string; color: string }) => (
  <div className="flex items-center gap-2 px-4 py-3 border-b border-border" style={{ background: color }}>
    <span className="text-base">{icon}</span>
    <span className="text-sm font-bold text-foreground">{title}</span>
  </div>
);

export default function PublicRecordModal({ address, onClose }: PublicRecordModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [building, setBuilding] = useState<Record<string, unknown> | null>(null);
  const [land, setLand] = useState<Record<string, unknown> | null>(null);

  const str = (v: unknown) => (v != null && v !== "" ? String(v) : "-");

  useEffect(() => {
    const fetchData = async () => {
      console.log("OPEN_PROPERTY_MODAL", address);
      if (!address) {
        setError("주소 정보가 없습니다.");
        setLoading(false);
        return;
      }
      try {
        const endpoint = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/property-summary`;
        const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ address }),
        });
        const data = await res.json();
        console.log("PROPERTY_SUMMARY_RESPONSE", data);
        if (!res.ok) throw new Error(data.error || "조회 실패");
        setBuilding(data.building_summary ?? null);
        setLand(data.land_summary ?? null);
      } catch (e: unknown) {
        console.error("PROPERTY_SUMMARY_ERROR", e);
        setError(e instanceof Error ? e.message : "오류 발생");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [address]);

  return (
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0"
          style={{ background: "hsl(var(--primary) / 0.06)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--primary) / 0.15)" }}>
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">공적장부 열람</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-1">{address}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted/60 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="overflow-y-auto flex-1">
          {/* 로딩 */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">공적장부 조회중...</p>
            </div>
          )}

          {/* 오류 */}
          {!loading && error && (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: "hsl(var(--destructive) / 0.1)" }}>
                <AlertTriangle className="w-6 h-6" style={{ color: "hsl(var(--destructive))" }} />
              </div>
              <p className="text-sm font-bold text-foreground">공적장부 조회 실패</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          )}

          {/* 빈 결과 */}
          {!loading && !error && !building && !land && (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <Layers className="w-10 h-10 text-muted-foreground/25" />
              <p className="text-sm font-semibold text-muted-foreground">조회 결과 없음</p>
              <p className="text-xs text-muted-foreground/60">해당 주소의 공적장부 데이터가 없습니다</p>
            </div>
          )}

          {/* 정상 출력 — 토지 + 건축 위아래 동시 표시 */}
          {!loading && !error && (building || land) && (
            <div className="flex flex-col">
              {/* ① 토지 정보 */}
              <SectionTitle icon="🌍" title="토지 정보" color="hsl(142 50% 95%)" />
              {land ? (
                <div className="px-4 py-1">
                  <Row label="지번주소" value={str(land.lot_number) !== "-" ? str(land.lot_number) : address} />
                  <Row label="공시지가" value={str(land.official_price)} />
                  <Row label="토지면적" value={str(land.land_area)} />
                  <Row label="지목" value={str(land.land_category)} />
                  <Row label="용도지역" value={str(land.use_zone)} />
                  <Row label="도로조건" value={str(land.road_access)} />
                </div>
              ) : (
                <p className="text-xs text-center text-muted-foreground py-5">토지대장 데이터 없음</p>
              )}

              <div className="h-2 bg-muted/50 my-1" />

              {/* ② 건축물 정보 */}
              <SectionTitle icon="🏢" title="건축물 정보" color="hsl(var(--primary) / 0.06)" />
              {building ? (
                <div className="px-4 py-1">
                  <Row label="건물명" value={str(building.building_name)} />
                  <Row label="건축물용도" value={str(building.main_purpose) === "조회 결과 없음" ? "-" : str(building.main_purpose)} />
                  <Row label="연면적" value={str(building.total_area)} />
                  <Row label="대지면적" value={str(building.land_area)} />
                  <Row label="건축면적" value={str(building.building_area)} />
                  <Row label="사용승인일" value={str(building.approval_date)} />
                  <Row label="층수" value={
                    building.floors_above
                      ? `지상 ${building.floors_above}층${building.floors_below && String(building.floors_below) !== "0" ? ` / 지하 ${building.floors_below}층` : ""}`
                      : "-"
                  } />
                  <Row label="주차대수" value={str(building.parking_count) !== "-" && str(building.parking_count) !== "0" ? `${building.parking_count}대` : str(building.parking_count)} />
                  <Row label="엘리베이터" value={building.elevator === true ? "있음" : building.elevator === false ? "없음" : "-"} />
                  {building._raw && typeof building._raw === "object" && (() => {
                    const raw = building._raw as Record<string, unknown>;
                    return (
                      <>
                        {raw.strctCdNm && <Row label="구조" value={str(raw.strctCdNm)} />}
                        {raw.bcRat && <Row label="건폐율" value={str(raw.bcRat)} />}
                        {raw.vlRat && <Row label="용적률" value={str(raw.vlRat)} />}
                        {raw.hhldCnt && Number(raw.hhldCnt) > 0 && <Row label="세대수" value={`${raw.hhldCnt}세대`} />}
                        {raw.roofCdNm && <Row label="지붕구조" value={str(raw.roofCdNm)} />}
                      </>
                    );
                  })()}
                </div>
              ) : (
                <p className="text-xs text-center text-muted-foreground py-5">건축물대장 데이터 없음</p>
              )}

              {/* ③ 층별 정보 */}
              {building?._raw && typeof building._raw === "object" && Array.isArray((building._raw as Record<string, unknown>).floors) && ((building._raw as Record<string, unknown>).floors as unknown[]).length > 0 && (() => {
                const floors = ((building._raw as Record<string, unknown>).floors as Array<Record<string, string>>);
                return (
                  <>
                    <div className="h-2 bg-muted/50 my-1" />
                    <SectionTitle icon="📐" title="층별 개요" color="hsl(221 90% 97%)" />
                    <div className="px-4 py-2">
                      <div className="grid grid-cols-3 gap-0 text-[10px] font-bold text-muted-foreground border-b border-border/40 pb-1.5 mb-1">
                        <span>층</span><span>면적</span><span>용도</span>
                      </div>
                      {floors.map((f, i) => (
                        <div key={i} className="grid grid-cols-3 gap-0 text-xs py-1.5 border-b border-border/20 last:border-0">
                          <span className="font-medium text-foreground">{f.flrNoNm || f.flrNo || "-"}</span>
                          <span className="text-muted-foreground">{f.area || "-"}</span>
                          <span className="text-muted-foreground">{f.mainPurpsCdNm || "-"}</span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}

              {/* 데이터 출처 */}
              <div className="px-4 py-3 mt-1">
                <p className="text-[10px] text-muted-foreground/50 text-center">
                  출처: 국토교통부 건축물대장 공공데이터 (data.go.kr)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            className="w-full h-10 rounded-xl text-sm font-bold text-primary border border-primary/40 hover:bg-primary/5 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
