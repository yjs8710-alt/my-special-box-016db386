import React, { forwardRef, useMemo, useState } from "react";
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
  address?: string;
  propertyId?: string;
};

type LandSummaryType = {
  land_use_zone?: string;
  land_use_district?: string;
  land_use_area?: string;
  district_unit_plan?: string;
  regulation_summary?: string;
  eum_url?: string;
};

const PublicRecordModal = forwardRef<HTMLDivElement, Props>((props, ref) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [landSummary, setLandSummary] = useState<LandSummaryType | null>(null);

  const isOpen = props.open ?? props.isOpen ?? false;

  const handleClose = () => {
    props.onClose?.();
    props.onOpenChange?.(false);
  };

  const property = useMemo(() => {
    return props.property ?? props.selectedProperty ?? props.record ?? props.item ?? null;
  }, [props]);

  const propertyId = property?.id ?? property?.property_id ?? null;
  const address = property?.address ?? property?.road_address ?? property?.jibun_address ?? "";
  const pnu = property?.pnu ?? null;

  const fetchLandSummary = async () => {
    try {
      setLoading(true);
      setError("");
      setLandSummary(null);

      const { data, error } = await supabase.functions.invoke("bright-processor", {
        body: { propertyId, address, pnu },
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (!data?.ok) {
        setError(data?.error || "응답 실패");
        return;
      }

      setLandSummary(data.data);
    } catch (e: any) {
      setError(e?.message || "요청 실패");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div ref={ref} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-xl rounded-2xl bg-white p-5">
        <div className="flex justify-between mb-3">
          <h2 className="font-bold">공적장부</h2>
          <button onClick={handleClose}>닫기</button>
        </div>

        <div>주소: {address}</div>

        <button onClick={fetchLandSummary}>{loading ? "조회중..." : "토지 조회"}</button>

        {error && <div style={{ color: "red" }}>{error}</div>}

        {landSummary && (
          <div>
            <div>용도지역: {landSummary.land_use_zone}</div>
            <div>용도지구: {landSummary.land_use_district}</div>
            <div>용도구역: {landSummary.land_use_area}</div>
            <div>규제: {landSummary.regulation_summary}</div>
          </div>
        )}
      </div>
    </div>
  );
});

PublicRecordModal.displayName = "PublicRecordModal";

export default PublicRecordModal;
