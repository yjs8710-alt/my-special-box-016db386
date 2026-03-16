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
  "상가": "#0a2d6e",
  "사무실": "#6d28d9",
  "식당·카페": "#ea580c",
  "공장·창고": "#166534",
  "병원·학원": "#9f1239",
  "아파트": "#0a2d6e",
  "원룸": "#0369a1",
  "빌라": "#0369a1",
  "오피스텔": "#6d28d9",
  "토지": "#166534",
};

const TYPE_ACCENT: Record<string, string> = {
  "상가": "#3b82f6",
  "사무실": "#a78bfa",
  "식당·카페": "#fb923c",
  "공장·창고": "#4ade80",
  "병원·학원": "#fb7185",
  "아파트": "#3b82f6",
  "원룸": "#38bdf8",
  "빌라": "#38bdf8",
  "오피스텔": "#a78bfa",
  "토지": "#4ade80",
};

/**
 * 줌 레벨(1~14) → 핀 크기(px) 매핑
 * 카카오 맵 level: 작을수록 확대 (1=가장 확대, 14=가장 축소)
 */
function getPinSize(zoomLevel: number): number {
  if (zoomLevel <= 2) return 38;
  if (zoomLevel <= 3) return 34;
  if (zoomLevel <= 4) return 30;
  if (zoomLevel <= 5) return 26;
  if (zoomLevel <= 6) return 22;
  if (zoomLevel <= 7) return 18;
  if (zoomLevel <= 9) return 14;
  return 11;
}

function createHousePinHtml(
  property: MapProperty,
  isSelected: boolean,
  size: number
) {
  const color = TYPE_COLORS[property.type] ?? "#0a2d6e";
  const accent = TYPE_ACCENT[property.type] ?? "#3b82f6";
  const fill = isSelected ? accent : color;
  const glow = isSelected
    ? `filter:drop-shadow(0 0 6px ${accent}cc) drop-shadow(0 2px 4px rgba(0,0,0,0.35))`
    : `filter:drop-shadow(0 2px 5px rgba(0,0,0,0.30))`;
  const doorH = Math.round(size * 0.38);
  const doorW = Math.round(size * 0.22);
  const winS = Math.round(size * 0.16);
  const roofOH = Math.round(size * 0.38); // roof overhang
  const bodyH = Math.round(size * 0.52);
  const dotSize = Math.max(3, Math.round(size * 0.14));
  const totalW = size + roofOH * 2;

  // Inline SVG house — clean modern shape
  const svg = `
    <svg width="${totalW}" height="${size + dotSize + 4}" viewBox="0 0 ${totalW} ${size + dotSize + 4}" fill="none" xmlns="http://www.w3.org/2000/svg" style="${glow}">
      <!-- Roof -->
      <polygon
        points="${totalW / 2},0 ${totalW},${roofOH + 2} 0,${roofOH + 2}"
        fill="${fill}"
        rx="2"
      />
      <!-- Body -->
      <rect x="${roofOH}" y="${roofOH}" width="${size}" height="${bodyH}" rx="2" fill="${fill}" />
      <!-- Roof top cap -->
      <rect x="${totalW / 2 - 3}" y="0" width="6" height="4" rx="1" fill="${accent}" opacity="0.85"/>
      <!-- Door -->
      <rect
        x="${totalW / 2 - doorW / 2}"
        y="${roofOH + bodyH - doorH}"
        width="${doorW}"
        height="${doorH}"
        rx="1"
        fill="${isSelected ? '#fff' : accent}"
        opacity="${isSelected ? '0.9' : '0.75'}"
      />
      <!-- Left window -->
      <rect
        x="${roofOH + Math.round(size * 0.08)}"
        y="${roofOH + Math.round(bodyH * 0.22)}"
        width="${winS}"
        height="${winS}"
        rx="1"
        fill="white"
        opacity="0.55"
      />
      <!-- Right window -->
      <rect
        x="${roofOH + size - Math.round(size * 0.08) - winS}"
        y="${roofOH + Math.round(bodyH * 0.22)}"
        width="${winS}"
        height="${winS}"
        rx="1"
        fill="white"
        opacity="0.55"
      />
      <!-- Anchor dot -->
      <circle
        cx="${totalW / 2}"
        cy="${roofOH + bodyH + dotSize / 2 + 2}"
        r="${dotSize / 2}"
        fill="${fill}"
        opacity="0.65"
      />
    </svg>
  `;

  return `<div style="cursor:pointer;display:flex;align-items:flex-end;justify-content:center;">${svg}</div>`;
}

function loadKakaoScript(cb: () => void) {
  if (window.kakao && window.kakao.maps) { cb(); return; }
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

  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach((o) => { try { o.setMap(null); } catch (_) {} });
    overlaysRef.current.clear();
  }, []);

  const renderOverlays = useCallback(
    (map: any, props: MapProperty[], selId: number | null, onSelectFn: (id: number) => void) => {
      clearOverlays();
      const zoom = zoomLevelRef.current;
      const pinSize = getPinSize(zoom);

      props.forEach((prop) => {
        if (!prop.lat || !prop.lng) return;
        const isSelected = prop.id === selId;

        const content = document.createElement("div");
        content.innerHTML = createHousePinHtml(prop, isSelected, isSelected ? Math.round(pinSize * 1.18) : pinSize);
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

  // 지도 초기화
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
      renderOverlays(map, properties, selectedId, onSelect);

      // 줌 변경 시 핀 크기 갱신
      window.kakao.maps.event.addListener(map, "zoom_changed", () => {
        if (!mountedRef.current) return;
        zoomLevelRef.current = map.getLevel();
        renderOverlays(map, properties, selectedId, onSelect);
      });
    });

    return () => {
      mountedRef.current = false;
      clearOverlays();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 핀 업데이트
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    renderOverlays(mapRef.current, properties, selectedId, onSelect);
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
