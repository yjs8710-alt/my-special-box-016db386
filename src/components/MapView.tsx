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
  "상가": "#1E5EFF",
  "사무실": "#1E5EFF",
  "식당·카페": "#1E5EFF",
  "공장·창고": "#1E5EFF",
  "병원·학원": "#1E5EFF",
  "지식산업": "#0088DD",
  "아파트": "#1E5EFF",
  "원룸": "#0077CC",
  "빌라": "#0088DD",
  "오피스텔": "#0066BB",
  "토지": "#00A3FF",
  "투룸": "#0077CC",
  "쓰리룸+": "#0077CC",
  "투베이": "#0077CC",
};

const TYPE_ACCENT: Record<string, string> = {
  "상가": "#5B8AFF",
  "사무실": "#5B8AFF",
  "식당·카페": "#5B8AFF",
  "공장·창고": "#5B8AFF",
  "병원·학원": "#5B8AFF",
  "지식산업": "#33BBFF",
  "아파트": "#5B8AFF",
  "원룸": "#33AAEE",
  "빌라": "#33BBFF",
  "오피스텔": "#3399DD",
  "토지": "#55CCFF",
  "투룸": "#33AAEE",
  "쓰리룸+": "#33AAEE",
  "투베이": "#33AAEE",
};

/** 줌 레벨 → 핀 크기(px) 매핑 */
function getPinSize(zoomLevel: number): number {
  if (zoomLevel <= 2) return 52;
  if (zoomLevel <= 3) return 46;
  if (zoomLevel <= 4) return 40;
  if (zoomLevel <= 5) return 34;
  if (zoomLevel <= 6) return 28;
  if (zoomLevel <= 7) return 22;
  if (zoomLevel <= 8) return 17;
  return 13;
}

/**
 * 개선된 집 모양 핀 — 원형 배경 + 집 아이콘
 * 가격 라벨 완전 제거
 */
function createPinHtml(property: MapProperty, isSelected: boolean, zoomLevel: number) {
  const color = TYPE_COLORS[property.type] ?? "#0369a1";
  const accent = TYPE_ACCENT[property.type] ?? "#3b82f6";
  const mainColor = isSelected ? accent : color;
  const size = getPinSize(zoomLevel);

  // 원형 배경 지름 = 핀 크기, 아이콘은 55%
  const circleDiam = size;
  const iconSize = Math.round(size * 0.58);

  const ringColor = isSelected ? "white" : "rgba(255,255,255,0.7)";
  const ringWidth = isSelected ? 2.5 : 1.5;
  const shadow = isSelected
    ? `drop-shadow(0 0 6px ${accent}cc) drop-shadow(0 3px 8px rgba(0,0,0,0.45))`
    : `drop-shadow(0 2px 5px rgba(0,0,0,0.38))`;
  const scale = isSelected ? 1.25 : 1;

  // 꼬리(말풍선 삼각형) 높이 = size * 0.22
  const tailH = Math.round(size * 0.22);
  const tailW = Math.round(size * 0.3);

  // 집 모양 SVG 아이콘 (지붕+몸체+창문+문)
  const houseIcon = `
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none"
      xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0;">
      <!-- 지붕 -->
      <path d="M2 11L12 2L22 11" fill="none" stroke="white" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
      <!-- 몸체 -->
      <rect x="4" y="11" width="16" height="11" rx="1" fill="white" opacity="0.25"/>
      <!-- 몸체 테두리 -->
      <rect x="4" y="11" width="16" height="11" rx="1" fill="none" stroke="white"
        stroke-width="1.6" stroke-linejoin="round"/>
      <!-- 문 -->
      <rect x="10" y="16" width="4" height="6" rx="0.5" fill="white" opacity="0.75"/>
      <!-- 창문 좌 -->
      <rect x="5.5" y="13" width="3.5" height="3" rx="0.5" fill="white" opacity="0.6"/>
      <!-- 창문 우 -->
      <rect x="15" y="13" width="3.5" height="3" rx="0.5" fill="white" opacity="0.6"/>
    </svg>
  `;

  return `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:0;
      transform:scale(${scale});
      transform-origin:bottom center;
      cursor:pointer;
      filter:${shadow};
    ">
      <!-- 원형 배경 -->
      <div style="
        width:${circleDiam}px;
        height:${circleDiam}px;
        border-radius:50%;
        background:${mainColor};
        border:${ringWidth}px solid ${ringColor};
        display:flex;
        align-items:center;
        justify-content:center;
        flex-shrink:0;
      ">
        ${houseIcon}
      </div>
      <!-- 말풍선 꼬리 삼각형 -->
      <div style="
        width:0;
        height:0;
        border-left:${Math.round(tailW/2)}px solid transparent;
        border-right:${Math.round(tailW/2)}px solid transparent;
        border-top:${tailH}px solid ${mainColor};
        margin-top:-1px;
        flex-shrink:0;
      "></div>
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

export interface MapBounds {
  swLat: number; swLng: number; neLat: number; neLng: number;
}

interface MapViewProps {
  properties: MapProperty[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  /** 지도 이동/줌 시 현재 화면 범위 콜백 */
  onBoundsChange?: (bounds: MapBounds) => void;
  /** true이면 selectedId 변경 시 panTo 억제 */
  suppressPan?: boolean;
}

const MapView = ({ properties, selectedId, onSelect, onBoundsChange, suppressPan }: MapViewProps) => {
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<Map<number, any>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const zoomLevelRef = useRef<number>(5);

  // 최신 props를 ref로 유지 (zoom 이벤트 핸들러에서 사용)
  const propsRef = useRef({ properties, selectedId, onSelect, onBoundsChange });
  useEffect(() => {
    propsRef.current = { properties, selectedId, onSelect, onBoundsChange };
  });

  const fireBounds = useCallback((map: any) => {
    try {
      const b = map.getBounds();
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      propsRef.current.onBoundsChange?.({
        swLat: sw.getLat(), swLng: sw.getLng(),
        neLat: ne.getLat(), neLng: ne.getLng(),
      });
    } catch (_) {}
  }, []);

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

  // 지도 초기화 + zoom_changed / drag_end 이벤트 등록
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

      // 초기 bounds 전달
      setTimeout(() => fireBounds(map), 300);

      // 줌 변경 시 핀 크기 자동 재렌더 + bounds 전달
      window.kakao.maps.event.addListener(map, "zoom_changed", () => {
        if (!mountedRef.current) return;
        const newZoom = map.getLevel();
        zoomLevelRef.current = newZoom;
        renderOverlays(map, propsRef.current.properties, propsRef.current.selectedId, propsRef.current.onSelect, newZoom);
        fireBounds(map);
      });

      // 드래그 후 bounds 전달
      window.kakao.maps.event.addListener(map, "dragend", () => {
        if (!mountedRef.current) return;
        fireBounds(map);
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

  // 선택된 매물로 이동 (suppressPan=true 이면 이동 안 함)
  useEffect(() => {
    if (!mapRef.current || selectedId === null || !window.kakao?.maps) return;
    if (suppressPan) return;
    const prop = properties.find((p) => p.id === selectedId);
    if (prop && prop.lat && prop.lng) {
      mapRef.current.panTo(new window.kakao.maps.LatLng(prop.lat, prop.lng));
    }
  }, [selectedId, properties, suppressPan]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapView;
