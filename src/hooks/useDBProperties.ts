import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapProperty } from "@/data/mapProperties";

// 관리자 DB 매물 → MapProperty 변환
// DB에는 이미지가 없으므로 빈 문자열(썸네일 없음)로 처리
function dbToMapProperty(row: Record<string, unknown>, idx: number): MapProperty {
  // note 필드에서 건물주/관리인 연락처 파싱
  // 형식: "건물주: 010-xxxx\n관리인: 010-yyyy" 또는 "건물주:010-xxxx|관리인:010-yyyy"
  const noteStr = String(row.note ?? row.agent_name ?? "");
  const parseContact = (key: string) => {
    const m = noteStr.match(new RegExp(`${key}[:\\s]+([0-9\\-]+)`));
    return m ? m[1].trim() : undefined;
  };

  return {
    id: 100000 + idx,
    dbId: String(row.id ?? ""),  // 실제 DB UUID 저장
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
      : "",
    images: Array.isArray(row.images) ? (row.images as string[]) : [],
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
    contact: parseContact("부동산") ?? "",
    contactOwner: parseContact("건물주"),
    contactManager: parseContact("관리인"),
    contactTenant: parseContact("세입자"),
    agentName: String(row.agent_name ?? ""),
    manageFee: String(row.manage_fee ?? ""),
    parking: String(row.parking ?? ""),
    elevator: Boolean(row.elevator),
    availableFrom: String(row.available_from ?? ""),
    totalFloors: String(row.total_floors ?? ""),
    buildYear: String(row.build_year ?? ""),
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
        .order("checked_date", { ascending: false, nullsFirst: false });

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
    const channelName = `db-properties-realtime-${typeFilter ? typeFilter.join(",") : "all"}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
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
