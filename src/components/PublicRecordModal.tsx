import React, { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AnyProperty = {
  id?: string | number | null;
  property_id?: string | number | null;
  address?: string | null;
  road_address?: string | null;
  jibun_address?: string | null;
  pnu?: string | null;
  [key: string]: any;
};

type Props = {
  open?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  property?: AnyProperty | null;
  selectedProperty?: AnyProperty | null;
  record?: AnyProperty | null;
  item?: AnyProperty | null;
};

type LandSummaryType = {
  property_id?: string | number | null;
  address?: string | null;
  pnu?: string | null;
  land_use_zone?: string | null;
  land_use_district?: string | null;
  land_use_area?: string | null;
  district_unit_plan?: string | null;
  regulation_summary?: string | null;
  source?: string | null;
  eum_url?: string | null;
};

export default function PublicRecordModal(props: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [landSummary, setLandSummary] = useState<LandSummaryType | null>(null);

  const isOpen = props.open ?? props.isOpen ?? true;

  const property = useMemo<AnyProperty | null>(() => {
    return props.property ?? props.selectedProperty ?? props.record ?? props.item ?? null;
  }, [props.property, props.selectedProperty, props.record, props.item]);

  const propertyId = property?.id ?? property?.property_id ?? null;
  const address = property?.address ?? property?.road_address ?? property?.jibun_address ?? "";
  const pnu = property?.pnu ?? null;

  const fetchLandSummary = async () => {
    try {
      setLoading(true);
      setError("");
      setLandSummary(null);

      const { data, error } = await supabase.functions.invoke("bright-processor", {
        body: {
          propertyId,
          address,
          pnu,
        },
      });

      console.log("EDGE DATA:", data);
      console.log("EDGE ERROR:", error);

      if (error) {
        setError("Edge 호출 실패: " + error.message);
        return;
      }

      if (!data?.ok) {
        setError(data?.error || "응답 실패");
        return;
      }

      setLandSummary(data.data);
    } catch (e: any) {
      console.error("EDGE CATCH:", e);
      setError("요청 자체 실패: " + (e?.message || String(e)));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    props.onClose?.();
    props.onOpenChange?.(false);
  };

  if (!isOpen) return null;

  return (
    <div className="w-full">
      <div className="rounded-2xl bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">공적장부</h2>
          <button onClick={handleClose} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50" type="button">
            닫기
          </button>
        </div>

        <div className="rounded-xl border bg-gray-50 p-4">
          <div className="mb-2 text-sm font-semibold text-gray-700">매물 정보</div>
          <div className="text-sm text-gray-800">
            <span className="font-medium">주소:</span> {address || "주소 없음"}
          </div>
          <div className="mt-1 text-sm text-gray-800">
            <span className="font-medium">PNU:</span> {pnu || "없음"}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={fetchLandSummary}
            disabled={loading}
            type="button"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "조회중..." : "토지대장 조회"}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        {landSummary && (
          <div className="mt-4 rounded-xl border bg-white p-4">
            <div className="mb-3 text-base font-semibold">토지이용 요약</div>

            <div className="space-y-2 text-sm text-gray-800">
              <div>
                <span className="font-medium">용도지역:</span> {landSummary.land_use_zone || "-"}
              </div>
              <div>
                <span className="font-medium">용도지구:</span> {landSummary.land_use_district || "-"}
              </div>
              <div>
                <span className="font-medium">용도구역:</span> {landSummary.land_use_area || "-"}
              </div>
              <div>
                <span className="font-medium">지구단위계획:</span> {landSummary.district_unit_plan || "-"}
              </div>
              <div>
                <span className="font-medium">규제요약:</span> {landSummary.regulation_summary || "-"}
              </div>
            </div>

            {landSummary.eum_url && (
              <a
                href={landSummary.eum_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm text-blue-600 underline"
              >
                토지이음 열기
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
