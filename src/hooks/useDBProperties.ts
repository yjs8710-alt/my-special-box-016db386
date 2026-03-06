import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapProperty } from "@/data/mapProperties";

// 관리자 DB 매물 → MapProperty 변환
// DB에는 이미지가 없으므로 빈 문자열(썸네일 없음)로 처리
function dbToMapProperty(row: Record<string, unknown>, idx: number): MapProperty {
  return {
    // DB uuid를 숫자 hash로 변환 (id 충돌 방지: 100000 + idx)
    id: 100000 + idx,
    title: String(row.title ?? ""),
    buildingName: row.building_name ? String(row.building_name) : undefined,
    address: String(row.address ?? ""),
    type: String(row.type ?? ""),
    roomType: row.room_type ? String(row.room_type) : undefined,
    unitNumber: row.unit_number ? String(row.unit_number) : undefined,
    area: String(row.area ?? ""),
    floor: String(row.floor ?? ""),
    deposit: String(row.deposit ?? ""),
    monthly: String(row.monthly ?? ""),
    isNew: Boolean(row.is_new),
    isHot: Boolean(row.is_hot),
    views: Number(row.views) || 0,
    lat: Number(row.lat) || 0,
    lng: Number(row.lng) || 0,
    image: Array.isArray(row.images) && (row.images as string[]).length > 0
      ? (row.images as string[])[0]
      : "",           // 이미지가 없으면 빈 문자열 (썸네일 없음)
    description: String(row.description ?? ""),
    buildingMemo: row.building_memo ? String(row.building_memo) : undefined,
    roomMemo: row.room_memo ? String(row.room_memo) : undefined,
    note: row.note ? String(row.note) : undefined,
    vacateDate: row.vacate_date ? String(row.vacate_date) : undefined,
    buildingPassword: row.building_password ? String(row.building_password) : undefined,
    roomPassword: row.room_password ? String(row.room_password) : undefined,
    options: Array.isArray(row.options) ? (row.options as string[]) : [],
    registeredDate: row.registered_date ? String(row.registered_date) : undefined,
    checkedDate: row.checked_date ? String(row.checked_date) : undefined,
    contact: "",         // DB 매물은 별도 contact 없음 (청주시 연락처와 연동)
    agentName: String(row.agent_name ?? ""),
    manageFee: String(row.manage_fee ?? ""),
    parking: String(row.parking ?? ""),
    elevator: Boolean(row.elevator),
    availableFrom: String(row.available_from ?? ""),
    totalFloors: String(row.total_floors ?? ""),
    buildYear: String(row.build_year ?? ""),
    // 추가 메타: DB 원본 ID를 메모에 저장 (상세 조회 시 활용 가능)
    memo: String(row.id ?? ""),
  };
}

/**
 * Supabase properties 테이블에서 active 매물을 불러와 MapProperty[]로 변환
 * @param typeFilter  undefined이면 전체, 배열이면 해당 type만
 */
export function useDBProperties(typeFilter?: string[]) {
  const [properties, setProperties] = useState<MapProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      let query = supabase
        .from("properties")
        .select("*")
        .eq("status", "active")
        .order("registered_date", { ascending: false });

      if (typeFilter && typeFilter.length > 0) {
        query = query.in("type", typeFilter);
      }

      const { data, error } = await query;

      if (!cancelled) {
        if (!error && data) {
          setProperties(
            (data as Record<string, unknown>[]).map((row, idx) =>
              dbToMapProperty(row, idx)
            )
          );
        }
        setLoading(false);
      }
    };

    fetch();

    // Realtime 구독: 매물 변경 시 자동 갱신
    const channel = supabase
      .channel("db-properties-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "properties" },
        () => { if (!cancelled) fetch(); }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [JSON.stringify(typeFilter)]);

  return { properties, loading };
}
