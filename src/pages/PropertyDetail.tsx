import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  MapPin, ChevronDown, ChevronUp, ExternalLink, Building2,
  FileText, Layers, ArrowLeft, Phone, Calendar, Maximize2,
  Car, CheckCircle2, Info,
} from "lucide-react";

declare global {
  interface Window { kakao: any; __kakaoMapCallbacks?: Array<() => void>; }
}
const KAKAO_JS_KEY = "9b1ab990830e8319b8bafb3104e5ae50";

function loadKakaoScript(cb: () => void) {
  if (window.kakao?.maps) { cb(); return; }
  if (!window.__kakaoMapCallbacks) window.__kakaoMapCallbacks = [];
  window.__kakaoMapCallbacks.push(cb);
  if (document.getElementById("kakao-maps-script")) return;
  const s = document.createElement("script");
  s.id = "kakao-maps-script";
  s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
  s.async = true;
  s.onload = () => {
    window.kakao.maps.load(() => {
      window.__kakaoMapCallbacks?.forEach(fn => fn());
      window.__kakaoMapCallbacks = [];
    });
  };
  document.head.appendChild(s);
}

interface PropertyRow {
  id: string;
  title: string;
  address: string;
  type: string;
  room_type: string | null;
  deposit: string;
  monthly: string;
  area: string;
  floor: string;
  total_floors: string;
  build_year: string;
  elevator: boolean;
  parking: string;
  available_from: string;
  manage_fee: string;
  lat: number;
  lng: number;
  description: string;
  building_name: string | null;
  unit_number: string | null;
  options: string[];
  note: string | null;
  building_memo: string | null;
  room_memo: string | null;
  images: string[];
  registered_date: string;
  checked_date: string | null;
}

interface PublicRecord {
  building_main_purpose: string | null;
  building_total_area: string | null;
  building_floors: string | null;
  building_approval_date: string | null;
  land_category: string | null;
  land_area: string | null;
  land_use_zone: string | null;
  land_address: string | null;
  building_register_url: string | null;
  land_register_url: string | null;
}

const DEAL_TYPE_COLOR: Record<string, string> = {
  "월세": "hsl(var(--accent))",
  "전세": "hsl(var(--primary))",
  "매매": "hsl(142 60% 35%)",
  "토지": "hsl(142 60% 35%)",
};

function getDealLabel(p: PropertyRow) {
  if (Number(p.monthly) > 0) return "월세";
  if (Number(p.deposit) > 0 && Number(p.monthly) === 0) return "전세";
  return "매매";
}

function formatPrice(deposit: string, monthly: string) {
  const d = Number(deposit);
  const m = Number(monthly);
  if (m > 0) {
    return `보증금 ${d.toLocaleString()}만 / 월 ${m.toLocaleString()}만`;
  }
  if (d > 0) return `전세 ${d.toLocaleString()}만원`;
  return "-";
}

/* ─── 카카오 지도 컴포넌트 ─── */
function MiniMap({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadKakaoScript(() => {
      if (!containerRef.current) return;
      const map = new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(lat, lng),
        level: 4,
      });

      const markerPos = new window.kakao.maps.LatLng(lat, lng);
      const marker = new window.kakao.maps.Marker({ position: markerPos });
      marker.setMap(map);

      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:6px 10px;font-size:12px;font-weight:700;white-space:nowrap;">${title}</div>`,
      });
      infowindow.open(map, marker);
    });
  }, [lat, lng, title]);

  return <div ref={containerRef} className="w-full h-full" />;
}

/* ─── 공적장부 카드 ─── */
function PublicRecordCard({
  record,
  address,
}: {
  record: PublicRecord | null;
  address: string;
}) {
  const buildingUrl = record?.building_register_url
    ?? `https://www.eais.go.kr/buld/retrieveUseBuilddtlInfo.do?searchAddress=${encodeURIComponent(address)}`;
  const landUrl = record?.land_register_url
    ?? `https://www.gov.kr/mw/AA020InfoCappView.do?HighCtgCD=A09001&CappBizCD=13500000029&searchAddress=${encodeURIComponent(address)}`;

  if (!record) {
    return (
      <div className="rounded-2xl border border-border bg-muted/30 p-6 text-center">
        <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground font-medium">공적장부 정보 연결 전입니다</p>
        <p className="text-xs text-muted-foreground mt-1">아래 버튼으로 원문을 직접 조회하세요</p>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <a
            href={buildingUrl}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            style={{ background: "hsl(var(--primary))" }}
          >
            <ExternalLink className="w-3.5 h-3.5" />건축물대장 원문보기
          </a>
          <a
            href={landUrl}
            target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "hsl(142 60% 35%)" }}
          >
            <ExternalLink className="w-3.5 h-3.5" />토지대장 원문보기
          </a>
        </div>
      </div>
    );
  }

  const buildingRows: { label: string; value: string | null }[] = [
    { label: "주용도", value: record.building_main_purpose },
    { label: "연면적", value: record.building_total_area },
    { label: "층수", value: record.building_floors },
    { label: "사용승인일", value: record.building_approval_date },
  ];

  const landRows: { label: string; value: string | null }[] = [
    { label: "지목", value: record.land_category },
    { label: "면적", value: record.land_area },
    { label: "용도지역", value: record.land_use_zone },
    { label: "지번주소", value: record.land_address },
  ];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* 건축물대장 */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--primary)/0.12)" }}>
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground">건축물대장 요약</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {buildingRows.map(r => (
            <div key={r.label}>
              <dt className="text-[10px] text-muted-foreground mb-0.5">{r.label}</dt>
              <dd className="text-xs font-semibold text-foreground">{r.value ?? "-"}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* 토지대장 */}
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "hsl(142 60% 35% / 0.12)" }}>
            <Layers className="w-4 h-4" style={{ color: "hsl(142 60% 35%)" }} />
          </div>
          <span className="text-sm font-bold text-foreground">토지대장 요약</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
          {landRows.map(r => (
            <div key={r.label}>
              <dt className="text-[10px] text-muted-foreground mb-0.5">{r.label}</dt>
              <dd className="text-xs font-semibold text-foreground">{r.value ?? "-"}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* 원문 버튼 */}
      <div className="px-5 py-4 bg-muted/30 flex flex-col sm:flex-row gap-2">
        <a
          href={buildingUrl}
          target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
          style={{ background: "hsl(var(--primary))" }}
        >
          <ExternalLink className="w-3.5 h-3.5" />건축물대장 원문보기
        </a>
        <a
          href={landUrl}
          target="_blank" rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: "hsl(142 60% 35%)" }}
        >
          <ExternalLink className="w-3.5 h-3.5" />토지대장 원문보기
        </a>
      </div>
    </div>
  );
}

/* ─── 메인 페이지 ─── */
export default function PropertyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<PropertyRow | null>(null);
  const [record, setRecord] = useState<PublicRecord | null | undefined>(undefined); // undefined = loading
  const [loading, setLoading] = useState(true);
  const [recordOpen, setRecordOpen] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: prop } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();
      setProperty(prop as PropertyRow | null);

      const { data: rec } = await (supabase as any)
        .from("public_record_summary")
        .select("*")
        .eq("property_id", id)
        .maybeSingle();
      setRecord((rec as unknown as PublicRecord) ?? null);
      setLoading(false);
    })();
  }, [id]);

  const dealLabel = property ? getDealLabel(property) : "";
  const dealColor = DEAL_TYPE_COLOR[dealLabel] ?? "hsl(var(--primary))";
  const images = property?.images ?? [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(var(--background))" }}>
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "hsl(var(--background))" }}>
        <p className="text-muted-foreground font-medium">매물 정보를 찾을 수 없습니다.</p>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-primary hover:underline">
          <ArrowLeft className="w-4 h-4" />돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "hsl(var(--background))" }}>
      {/* ─── 상단 헤더 바 ─── */}
      <div
        className="sticky top-0 z-50 flex items-center gap-3 px-4 h-14 border-b border-border"
        style={{ background: "hsl(var(--header-bg))" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <p className="text-sm font-bold text-white truncate flex-1">{property.title}</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-12">
        {/* ─── 사진 슬라이더 ─── */}
        {images.length > 0 && (
          <div className="relative mt-4 rounded-2xl overflow-hidden bg-muted aspect-video">
            <img
              src={images[imgIdx]}
              alt={`매물 사진 ${imgIdx + 1}`}
              className="w-full h-full object-cover"
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60"
                >‹</button>
                <button
                  onClick={() => setImgIdx(i => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60"
                >›</button>
                <div className="absolute bottom-2 right-3 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {imgIdx + 1}/{images.length}
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── 매물 기본 정보 ─── */}
        <div className="mt-5 rounded-2xl border border-border bg-card p-5">
          {/* 배지 + 매물명 */}
          <div className="flex items-start gap-2 mb-1">
            <span
              className="flex-shrink-0 mt-0.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white"
              style={{ background: dealColor }}
            >
              {dealLabel}
            </span>
            <h1 className="text-lg font-extrabold text-foreground leading-tight">{property.title}</h1>
          </div>

          {/* 주소 */}
          <div className="flex items-center gap-1.5 mt-1.5">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">{property.address}</p>
          </div>
          {property.unit_number && (
            <p className="text-xs text-muted-foreground mt-0.5 ml-5">{property.unit_number}호</p>
          )}

          {/* 가격 */}
          <div
            className="mt-4 px-4 py-3 rounded-xl text-center font-extrabold text-base"
            style={{ background: `${dealColor}18`, color: dealColor }}
          >
            {formatPrice(property.deposit, property.monthly)}
          </div>

          {/* 상세 스펙 */}
          <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
            {[
              { icon: <Maximize2 className="w-3.5 h-3.5" />, label: "면적", value: property.area ? `${property.area}평` : "-" },
              { icon: <Layers className="w-3.5 h-3.5" />, label: "층수", value: property.floor || "-" },
              { icon: <Building2 className="w-3.5 h-3.5" />, label: "총층", value: property.total_floors ? `${property.total_floors}층` : "-" },
              { icon: <Calendar className="w-3.5 h-3.5" />, label: "건축연도", value: property.build_year || "-" },
              { icon: <Car className="w-3.5 h-3.5" />, label: "주차", value: property.parking || "-" },
              { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "입주가능일", value: property.available_from || "-" },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="text-muted-foreground">{item.icon}</span>
                <span className="text-muted-foreground w-14 flex-shrink-0">{item.label}</span>
                <span className="font-semibold text-foreground truncate">{item.value}</span>
              </div>
            ))}
          </div>

          {/* 설명 */}
          {property.description && (
            <p className="mt-4 text-xs text-muted-foreground leading-relaxed border-t border-border pt-3 whitespace-pre-line">
              {property.description}
            </p>
          )}
        </div>

        {/* ─── 카카오 지도 ─── */}
        {property.lat && property.lng ? (
          <div className="mt-4 rounded-2xl overflow-hidden border border-border" style={{ height: "240px" }}>
            <MiniMap lat={property.lat} lng={property.lng} title={property.title} />
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-border bg-muted/30 h-40 flex items-center justify-center">
            <p className="text-xs text-muted-foreground">지도 좌표 정보 없음</p>
          </div>
        )}

        {/* ─── 공적장부 요약 보기 버튼 ─── */}
        <div className="mt-4">
          <button
            onClick={() => setRecordOpen(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border border-border bg-card hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "hsl(var(--primary)/0.12)" }}
              >
                <FileText className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className="text-sm font-bold text-foreground">공적장부 요약 보기</span>
            </div>
            {recordOpen
              ? <ChevronUp className="w-5 h-5 text-muted-foreground" />
              : <ChevronDown className="w-5 h-5 text-muted-foreground" />
            }
          </button>

          {/* ─── 공적장부 카드 (펼침) ─── */}
          {recordOpen && (
            <div className="mt-2">
              {record === undefined ? (
                <div className="rounded-2xl border border-border bg-muted/30 py-8 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              ) : (
                <PublicRecordCard record={record} address={property.address} />
              )}
            </div>
          )}
        </div>

        {/* ─── 빠른 링크 ─── */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "등기소", href: `https://www.iros.go.kr/pos1/searchLand.jsp?searchKeyword=${encodeURIComponent(property.address)}`, color: "hsl(25 90% 45%)" },
            { label: "정부24", href: `https://www.gov.kr/mw/AA020InfoCappView.do?HighCtgCD=A09001&CappBizCD=13500000029&searchAddress=${encodeURIComponent(property.address)}`, color: "hsl(var(--primary))" },
            { label: "토지e음", href: `https://www.eum.go.kr/web/ar/lu/luLandUseDetailR.jsp?searchAddr=${encodeURIComponent(property.address)}`, color: "hsl(180 60% 35%)" },
          ].map(link => (
            <a
              key={link.label}
              href={link.href}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-85"
              style={{ background: link.color }}
            >
              <ExternalLink className="w-3 h-3" />{link.label}
            </a>
          ))}
        </div>

        {/* 확인일 / 등록일 */}
        <p className="mt-5 text-center text-[10px] text-muted-foreground">
          {property.checked_date ? `확인일: ${property.checked_date}` : `등록일: ${property.registered_date}`}
        </p>
      </div>
    </div>
  );
}
