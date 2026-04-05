/**
 * 매물 등록/수정 후 건축물대장·토지대장을 백그라운드로 자동 조회하여 DB에 캐싱.
 * - building_summary, land_summary 테이블에 저장
 * - properties.build_year, elevator 동기화
 * - 이후 공적장부 열람 시 즉시 표시 가능
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function prefetchPropertySummary(
  address: string,
  propertyId: string,
): Promise<void> {
  if (!address || !propertyId) return;

  const endpoint = `${SUPABASE_URL}/functions/v1/property-summary`;

  try {
    console.log("🔄 [자동 조회] 건축물·토지대장 백그라운드 캐싱 시작:", address);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify({ address, property_id: propertyId }),
    });

    if (res.ok) {
      const data = await res.json();
      const hasBldg = !!data.building_summary;
      const hasLand = !!data.land_summary;
      console.log(`✅ [자동 조회] 완료 — 건축물: ${hasBldg ? "✓" : "✗"}, 토지: ${hasLand ? "✓" : "✗"}`);
    } else {
      console.warn("⚠️ [자동 조회] 실패:", res.status);
    }
  } catch (e) {
    console.warn("⚠️ [자동 조회] 예외:", e);
  }
}
