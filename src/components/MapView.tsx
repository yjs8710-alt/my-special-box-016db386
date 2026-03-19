import { useEffect, useRef, useCallback } from "react";
import { MapProperty } from "@/data/mapProperties";

declare global {
  interface Window {
    kakao: any;
    __kakaoMapReady?: boolean;
    __kakaoMapCallbacks?: Array<() => void>;
  }
}

const KAKAO_JS_KEY = "9b1ab990830e8319b8bafb3104e5ae50";

const TYPE_COLORS: Record<string, string> = {
  "상가": "#1e40af",
  "사무실": "#6d28d9",
  "식당·카페": "#ea580c",
  "공장·창고": "#166534",
  "병원·학원": "#9f1239",
  "아파트": "#1e40af",
  "원룸": "#0369a1",
  "빌라": "#0284c7",
  "오피스텔": "#7c3aed",
  "토지": "#166534",
  "투룸": "#0369a1",
  "쓰리룸+": "#0369a1",
  "투베이": "#0369a1",
};

const TYPE_ACCENT: Record<string, string> = {
  "상가": "#3b82f6",
  "사무실": "#a78bfa",
  "식당·카페": "#fb923c",
  "공장·창고": "#4ade80",
  "병원·학원": "#fb7185",
  "아파트": "#60a5fa",
  "원룸": "#38bdf8",
  "빌라": "#38bdf8",
  "오피스텔": "#a78bfa",
  "토지": "#4ade80",
  "투룸": "#38bdf8",
  "쓰리룸+": "#38bdf8",
  "투베이": "#38bdf8",
};

/** 줌 레벨 → 핀 크기(px) 매핑 */
function getPinSize(zoomLevel: number): number {
  if (zoomLevel <= 2) return 46;
  if (zoomLevel <= 3) return 40;
  if (zoomLevel <= 4) return 34;
  if (zoomLevel <= 5) return 28;
  if (zoomLevel <= 6) return 23;
  if (zoomLevel <= 7) return 18;
  if (zoomLevel <= 8) return 14;
  return 11;
}

/** 줌 레벨 → 가격 폰트 크기(px) */
function getPriceFontSize(zoomLevel: number): number {
  if (zoomLevel <= 2) return 11;
  if (zoomLevel <= 3) return 10;
  if (zoomLevel <= 4) return 9;
  if (zoomLevel <= 5) return 8;
  if (zoomLevel <= 6) return 7;
  return 0; // 7 이상은 가격 숨김
}

/**
 * 건물주 연락처 아이콘과 동일한 집 모양 핀 생성
 * zoomLevel에 따라 크기 자동 조절
 */
function createPinHtml(property: MapProperty, isSelected: boolean, zoomLevel: number) {
  const color = TYPE_COLORS[property.type] ?? "#0369a1";
  const accent = TYPE_ACCENT[property.type] ?? "#3b82f6";
  const mainColor = isSelected ? accent : color;
  const size = getPinSize(zoomLevel);
  const fontSize = getPriceFontSize(zoomLevel);
  const price = property.monthly || property.deposit || "";

  const glow = isSelected
    ? `filter:drop-shadow(0 0 5px ${accent}aa) drop-shadow(0 2px 6px rgba(0,0,0,0.4));`
    : `filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));`;

  const scale = isSelected ? 1.22 : 1;

  // 집 모양 SVG (건물주 ContactIcon과 동일한 path)
  const houseBody = `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
      style="display:block;flex-shrink:0;">
      <!-- 집 몸체 (채움) -->
      <path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
        fill="${mainColor}" />
      <!-- 선택 시 흰색 테두리 강조 -->
      ${isSelected ? `<path d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
        fill="none" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>` : ""}
      <!-- 문 -->
      <rect x="10" y="16" width="4" height="5" rx="0.5" fill="white" opacity="0.55"/>
      <!-- 지붕 하이라이트 -->
      <path d="M12 3.5L20.5 10.5" stroke="white" stroke-width="0.8" stroke-linecap="round" opacity="0.4"/>
    </svg>
  `;

  // 가격 라벨 숨김
  const priceLabel = "";

  return `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:0;
      transform:scale(${scale});
      transform-origin:bottom center;
      cursor:pointer;
      ${glow}
    ">
      ${houseBody}
      ${priceLabel}
    </div>
  `;
}

function loadKakaoScript(cb: () => void) {
  if (window.kakao && window.kakao.maps) {
    cb();
    return;
  }

  if (!window.__kakaoMapCallbacks) window.__kakaoMapCallbacks = [];
  window.__kakaoMapCallbacks.push(cb);

  if (document.getElementById("kakao-maps-script")) return;

  const script = document.createElement("script");
  script.id = "kakao-maps-script";
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
  script.async = true;
  script.onload = () => {
    window.kakao.maps.load(() => {
      window.__kakaoMapReady = true;
      window.__kakaoMapCallbacks?.forEach((fn) => fn());
      window.__kakaoMapCallbacks = [];
    });
  };
  document.head.appendChild(script);
}

interface MapViewProps {
  properties: MapProperty[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const MapView = ({ properties, selectedId, onSelect }: MapViewProps) => {
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<Map<number, any>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const zoomLevelRef = useRef<number>(5);

  // 최신 props를 ref로 유지 (zoom 이벤트 핸들러에서 사용)
  const propsRef = useRef({ properties, selectedId, onSelect });
  useEffect(() => {
    propsRef.current = { properties, selectedId, onSelect };
  });

  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach((o) => {
      try { o.setMap(null); } catch (_) {}
    });
    overlaysRef.current.clear();
  }, []);

  const renderOverlays = useCallback(
    (map: any, props: MapProperty[], selId: number | null, onSelectFn: (id: number) => void, zoom: number) => {
      clearOverlays();
      props.forEach((prop) => {
        if (!prop.lat || !prop.lng) return;
        const isSelected = prop.id === selId;

        const content = document.createElement("div");
        content.innerHTML = createPinHtml(prop, isSelected, zoom);
        content.style.cssText = "cursor:pointer;";
        content.addEventListener("click", () => onSelectFn(prop.id));

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(prop.lat, prop.lng),
          content,
          map,
          yAnchor: 1,
          zIndex: isSelected ? 1000 : 0,
        });

        overlaysRef.current.set(prop.id, overlay);
      });
    },
    [clearOverlays]
  );

  // 지도 초기화 + zoom_changed 이벤트 등록
  useEffect(() => {
    mountedRef.current = true;

    loadKakaoScript(() => {
      if (!mountedRef.current || !containerRef.current) return;
      if (mapRef.current) return;

      const map = new window.kakao.maps.Map(containerRef.current, {
        center: new window.kakao.maps.LatLng(36.6285, 127.4568),
        level: 5,
      });

      mapRef.current = map;
      zoomLevelRef.current = map.getLevel();
      renderOverlays(map, propsRef.current.properties, propsRef.current.selectedId, propsRef.current.onSelect, zoomLevelRef.current);

      // 줌 변경 시 핀 크기 자동 재렌더
      window.kakao.maps.event.addListener(map, "zoom_changed", () => {
        if (!mountedRef.current) return;
        const newZoom = map.getLevel();
        zoomLevelRef.current = newZoom;
        renderOverlays(map, propsRef.current.properties, propsRef.current.selectedId, propsRef.current.onSelect, newZoom);
      });
    });

    return () => {
      mountedRef.current = false;
      clearOverlays();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 핀 업데이트 (properties/selectedId 변경 시)
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    renderOverlays(mapRef.current, properties, selectedId, onSelect, zoomLevelRef.current);
  }, [properties, selectedId, onSelect, renderOverlays]);

  // 선택된 매물로 이동
  useEffect(() => {
    if (!mapRef.current || selectedId === null || !window.kakao?.maps) return;
    const prop = properties.find((p) => p.id === selectedId);
    if (prop && prop.lat && prop.lng) {
      mapRef.current.panTo(new window.kakao.maps.LatLng(prop.lat, prop.lng));
    }
  }, [selectedId, properties]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapView;
