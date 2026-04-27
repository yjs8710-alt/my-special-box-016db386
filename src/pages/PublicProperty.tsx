import { useParams, useSearchParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building2, MapPin, Layers, Car, Calendar, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import logoTransparent from "@/assets/logo-transparent-zibda-20260427-v2-20260427.png";
import { loadKakaoMaps } from "@/lib/kakaoMapsLoader";

interface PropertyData {
  id: string;
  title: string;
  building_name: string | null;
  address: string;
  type: string;
  room_type: string | null;
  area: string;
  floor: string;
  total_floors: string;
  deposit: string;
  monthly: string;
  manage_fee: string;
  parking: string;
  elevator: boolean;
  available_from: string;
  build_year: string;
  description: string;
  images: string[];
  options: string[];
  is_new: boolean;
  is_hot: boolean;
  registered_date: string;
  registered_by: string | null;
  lat: number;
  lng: number;
}

interface AgentData {
  name: string;
  phone: string;
  agency_name: string;
  agency_phone: string | null;
  agency_address: string;
  license_number: string;
  member_type: string;
  representative_name: string;
}

interface BuildingSummaryData {
  building_name: string | null;
  main_purpose: string | null;
  approval_date: string | null;
  land_area: string | null;
  building_area: string | null;
  total_area: string | null;
  floors_above: string | null;
  floors_below: string | null;
  parking_count: string | null;
  elevator: boolean | null;
}

/** ㎡ → 평 변환 (소수 2자리) */
function toPyeong(value: string | null | undefined): string {
  if (!value) return "";
  const num = parseFloat(value.replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return "";
  return (num / 3.3058).toFixed(2);
}

/** 면적 표시: 평이면 평만, ㎡이면 ㎡(평) */
function formatArea(value: string | null | undefined): string {
  if (!value) return "-";
  if (value.includes("평")) {
    return value; // 평으로 저장되어 있으면 그대로 표시
  }
  const pyeong = toPyeong(value);
  return pyeong ? `${value} (${pyeong}평)` : value;
}

/** 매물카드용 면적: 평만 표시 */
function formatAreaShort(value: string | null | undefined): string {
  if (!value) return "-";
  if (value.includes("평")) {
    return value;
  }
  const pyeong = toPyeong(value);
  return pyeong ? `${pyeong}평` : value;
}

/** 주소에서 동/리 까지만 남기고 번지 이하 제거 */
function sanitizeAddress(address: string): string {
  if (!address) return "";
  const match = address.match(
    /(?:.*?(?:시|군)\s+)?(?:.*?(?:구|군)\s+)?[\uAC00-\uD7A3]+(?:동|리|읍|면)/
  );
  return match ? match[0] : address.split(" ").slice(0, -1).join(" ") || address;
}

function KakaoMapPreview({ lat, lng, address }: { lat: number; lng: number; address: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!lat || !lng || !mapRef.current) return;

    let cancelled = false;

    const waitForContainerReady = async () => {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        if (!mapRef.current) return false;
        if (mapRef.current.clientWidth > 0 && mapRef.current.clientHeight > 0) return true;
        await new Promise((resolve) => window.setTimeout(resolve, 120));
      }
      return Boolean(mapRef.current?.clientWidth && mapRef.current?.clientHeight);
    };

    const relayout = () => {
      if (!mapInstanceRef.current || !window.kakao?.maps) return;
      try {
        mapInstanceRef.current.relayout();
        mapInstanceRef.current.setCenter(new window.kakao.maps.LatLng(lat, lng));
      } catch (_) {
        mapInstanceRef.current = null;
      }
    };

    (async () => {
      try {
        await loadKakaoMaps({ retries: 4, timeoutMs: 10000 });
        if (cancelled || !window.kakao?.maps || !mapRef.current) return;
        const containerReady = await waitForContainerReady();
        if (!containerReady || cancelled || !mapRef.current) return;

        const position = new window.kakao.maps.LatLng(lat, lng);
        const map = new window.kakao.maps.Map(mapRef.current, {
          center: position,
          level: 4,
          draggable: false,
          scrollwheel: false,
          disableDoubleClickZoom: true,
        });
        mapInstanceRef.current = map;

        new window.kakao.maps.Circle({
          center: position,
          radius: 150,
          strokeWeight: 2,
          strokeColor: "#1B3A5C",
          strokeOpacity: 0.6,
          fillColor: "#1B3A5C",
          fillOpacity: 0.15,
          map,
        });

        window.setTimeout(() => {
          if (!cancelled) {
            relayout();
          }
        }, 120);

        window.setTimeout(() => {
          if (!cancelled) relayout();
        }, 700);
      } catch (_) {
        if (mapRef.current) {
          mapRef.current.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;background:hsl(220 16% 97%);color:hsl(218 14% 48%);font-size:12px;font-weight:700;">지도를 불러오지 못했습니다.</div>';
        }
      }
    })();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") relayout();
    };

    window.addEventListener("pageshow", relayout);
    window.addEventListener("online", relayout);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      mapInstanceRef.current = null;
      window.removeEventListener("pageshow", relayout);
      window.removeEventListener("online", relayout);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [lat, lng]);

  return (
    <div>
      <p className="text-xs font-bold text-foreground mb-2">위치</p>
      <div ref={mapRef} className="w-full h-48 rounded-xl overflow-hidden border border-border" />
      <p className="text-[10px] text-muted-foreground mt-1">정확한 위치는 중개사무소에 문의해주세요.</p>
    </div>
  );
}

export default function PublicProperty() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [property, setProperty] = useState<PropertyData | null>(null);
  const [agent, setAgent] = useState<AgentData | null>(null);
  const [building, setBuilding] = useState<BuildingSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    (async () => {
      setLoading(true);
      setAgent(null);
      setBuilding(null);

      try {
        const { data, error } = await supabase
          .from("properties")
          .select("id,title,building_name,address,type,room_type,area,floor,total_floors,deposit,monthly,manage_fee,parking,elevator,available_from,build_year,description,images,options,is_new,is_hot,registered_date,registered_by,lat,lng")
          .eq("id", id)
          .eq("status", "active")
          .single();

        if (error || !data) {
          if (isMounted) setProperty(null);
          return;
        }

        const sharedBy = searchParams.get("sharedBy");
        const agentUserId = sharedBy || data.registered_by;

        const agentRequest = agentUserId
          ? supabase
              .from("agent_profiles")
              .select("name,phone,agency_name,agency_phone,agency_address,license_number,member_type,representative_name")
              .eq("user_id", agentUserId)
              .eq("status", "approved")
              .eq("is_active", true)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null as AgentData | null, error: null });

        const buildingRequest = supabase
          .from("building_summary")
          .select("building_name,main_purpose,approval_date,land_area,building_area,total_area,floors_above,floors_below,parking_count,elevator")
          .eq("property_id", id)
          .maybeSingle();

        const [agentResult, buildingResult] = await Promise.all([agentRequest, buildingRequest]);

        if (!isMounted) return;

        setProperty(data as PropertyData);
        setAgent(agentResult.data ?? null);
        setBuilding(buildingResult.data ?? null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4 p-6">
        <Building2 className="w-16 h-16 text-muted-foreground/30" />
        <p className="text-lg font-bold text-foreground">매물을 찾을 수 없습니다</p>
        <p className="text-sm text-muted-foreground">삭제되었거나 비공개 처리된 매물입니다.</p>
        <a href="https://jibda.co.kr" className="mt-4 px-6 py-2.5 rounded-full text-sm font-bold text-white bg-primary hover:opacity-90 transition-opacity">
          집다 홈으로
        </a>
      </div>
    );
  }

  const imgs = (property.images || []).filter(Boolean);
  const safeAddress = sanitizeAddress(property.address);
  const prev = () => setImgIdx((i) => (i - 1 + imgs.length) % imgs.length);
  const next = () => setImgIdx((i) => (i + 1) % imgs.length);
  const isSale = property.type?.includes("매매");

  return (
    <div className="min-h-screen bg-background">
      {/* Header - 로고 2배 크기 */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-1 flex items-center justify-between">
        <a href="https://jibda.co.kr" className="flex items-center gap-1.5">
          <img src={logoTransparent} alt="집다" className="h-14 w-auto" />
        </a>
        <a href="https://jibda.co.kr/login" className="text-xs font-bold text-primary hover:underline">로그인</a>
      </header>

      <div className="max-w-lg mx-auto pb-24">
        {/* Image carousel */}
        {imgs.length > 0 ? (
          <div className="relative aspect-[4/3] bg-muted overflow-hidden">
            {imgs.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${property.title} ${i + 1}`}
                className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                style={{ opacity: i === imgIdx ? 1 : 0 }}
              />
            ))}
            {imgs.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                  {imgIdx + 1} / {imgs.length}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="aspect-[4/3] bg-muted flex items-center justify-center">
            <Building2 className="w-16 h-16 text-muted-foreground/20" />
          </div>
        )}

        {/* Content */}
        <div className="p-5 flex flex-col gap-5">
          {/* Badges + Title */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-white">{property.type}</span>
              {property.room_type && property.room_type !== property.type && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-foreground">{property.room_type}</span>
              )}
              {property.is_new && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent text-white">NEW</span>}
              {property.is_hot && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive text-white">HOT</span>}
            </div>
            <h1 className="text-xl font-bold text-foreground">{property.building_name || property.title}</h1>
            <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {safeAddress}
            </div>
          </div>

          {/* Price */}
          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground mb-1">{isSale ? "매매가" : "보증금 / 월세"}</p>
            <p className="text-2xl font-black text-foreground">
              {isSale ? property.deposit : `${property.deposit} / ${property.monthly}`}
            </p>
            {!isSale && property.manage_fee && (
              <p className="text-xs text-muted-foreground mt-1">관리비 {property.manage_fee}</p>
            )}
          </div>

          {/* Info grid — 면적은 평만 표시 */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <Layers className="w-4 h-4" />, label: "면적", value: formatAreaShort(property.area) },
              { icon: <Building2 className="w-4 h-4" />, label: "층", value: `${property.floor} / ${building?.floors_above || property.total_floors}층` },
              { icon: <Car className="w-4 h-4" />, label: "주차", value: property.parking || "확인필요" },
              { icon: <Calendar className="w-4 h-4" />, label: "입주가능", value: property.available_from || "즉시" },
            ].map((item, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">{item.icon}</div>
                <div>
                  <p className="text-[10px] text-muted-foreground">{item.label}</p>
                  <p className="text-xs font-bold text-foreground">{item.value || "-"}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Options */}
          {property.options && property.options.length > 0 && (
            <div>
              <p className="text-xs font-bold text-foreground mb-2">옵션</p>
              <div className="flex flex-wrap gap-1.5">
                {property.options.map((opt, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-muted text-foreground border border-border">
                    {opt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {property.description && (
            <div>
              <p className="text-xs font-bold text-foreground mb-2">상세 설명</p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{property.description}</p>
            </div>
          )}

          {/* Build info */}
          <div className="rounded-xl border border-border bg-muted/30 p-3 flex items-center gap-3">
            <div className="text-xs text-muted-foreground">
              건축년도 <span className="font-bold text-foreground">{property.build_year || "-"}</span>
              {" · "}엘리베이터 <span className="font-bold text-foreground">{property.elevator ? "있음" : "없음"}</span>
            </div>
          </div>

          {/* Building Summary (건축물대장) */}
          {building && (
            <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2">
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="w-4 h-4 text-primary" />
                <p className="text-xs font-bold text-primary">건축물대장 정보</p>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                {building.building_name && (
                  <>
                    <span className="text-muted-foreground">건물명</span>
                    <span className="font-bold text-foreground">{building.building_name}</span>
                  </>
                )}
                {building.main_purpose && (
                  <>
                    <span className="text-muted-foreground">주용도</span>
                    <span className="text-foreground">{building.main_purpose}</span>
                  </>
                )}
                {building.land_area && (
                  <>
                    <span className="text-muted-foreground">대지면적</span>
                    <span className="text-foreground">{formatArea(building.land_area)}</span>
                  </>
                )}
                {building.building_area && (
                  <>
                    <span className="text-muted-foreground">건축면적</span>
                    <span className="text-foreground">{formatArea(building.building_area)}</span>
                  </>
                )}
                {building.total_area && (
                  <>
                    <span className="text-muted-foreground">연면적</span>
                    <span className="text-foreground">{formatArea(building.total_area)}</span>
                  </>
                )}
                {(building.floors_above || building.floors_below) && (
                  <>
                    <span className="text-muted-foreground">층수</span>
                    <span className="text-foreground">
                      지상 {building.floors_above || "-"}층 / 지하 {building.floors_below || "-"}층
                    </span>
                  </>
                )}
                {building.parking_count && (
                  <>
                    <span className="text-muted-foreground">주차대수</span>
                    <span className="text-foreground">{building.parking_count}대</span>
                  </>
                )}
                {building.approval_date && (
                  <>
                    <span className="text-muted-foreground">사용승인일</span>
                    <span className="text-foreground">{building.approval_date}</span>
                  </>
                )}
                <span className="text-muted-foreground">엘리베이터</span>
                <span className="text-foreground">{building.elevator ? "있음" : "없음"}</span>
              </div>
            </div>
          )}

          {/* 대략적 위치 지도 */}
          {property.lat && property.lng && (
            <KakaoMapPreview lat={property.lat} lng={property.lng} address={safeAddress} />
          )}

          {/* Agent / Office info */}
          {agent && (
            <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2">
              <p className="text-xs font-bold text-primary mb-1">공유 중개사무소</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-xs">
                <span className="text-muted-foreground">사무소명</span>
                <span className="font-bold text-foreground">{agent.agency_name}</span>
                <span className="text-muted-foreground">대표자</span>
                <span className="font-bold text-foreground">{agent.representative_name || agent.name}</span>
                <span className="text-muted-foreground">주소</span>
                <span className="text-foreground">{agent.agency_address}</span>
                <span className="text-muted-foreground">대표번호</span>
                <a href={`tel:${agent.agency_phone || ""}`} className="font-bold text-primary">{agent.agency_phone || "-"}</a>
                <span className="text-muted-foreground">연락처</span>
                <a href={`tel:${agent.phone}`} className="font-bold text-primary">{agent.phone}</a>
                <span className="text-muted-foreground">개설등록번호</span>
                <span className="text-foreground">{agent.license_number}</span>
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex justify-center z-40">
          <a
            href="https://jibda.co.kr"
            className="w-full max-w-lg h-12 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            집다에서 더 많은 매물 보기
          </a>
        </div>
      </div>
    </div>
  );
}
