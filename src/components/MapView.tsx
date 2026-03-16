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

  // Dimensions
  const W = size;                            // body width
  const bodyH = Math.round(size * 0.50);     // body height
  const roofH = Math.round(size * 0.42);     // roof peak height above body
  const overhang = Math.round(size * 0.10);  // roof side overhang
  const totalW = W + overhang * 2;
  const roofY = roofH;                       // y where body starts
  const totalBodyBottom = roofY + bodyH;
  const dotR = Math.max(3, Math.round(size * 0.10));
  const svgH = totalBodyBottom + dotR * 2 + 3;

  // Chimney
  const chimneyW = Math.max(3, Math.round(size * 0.10));
  const chimneyH = Math.round(size * 0.18);
  const chimneyX = Math.round(totalW * 0.68);
  const chimneyY = roofY - chimneyH + 2;

  // Door
  const doorW = Math.round(size * 0.20);
  const doorH = Math.round(size * 0.32);
  const doorX = Math.round((totalW - doorW) / 2);
  const doorY = totalBodyBottom - doorH;
  const doorRx = Math.max(1, Math.round(doorW * 0.35));

  // Windows
  const winS = Math.round(size * 0.14);
  const winY = roofY + Math.round(bodyH * 0.18);
  const winLX = overhang + Math.round(W * 0.10);
  const winRX = overhang + W - Math.round(W * 0.10) - winS;

  // Roof curved path: peak → right eave (curved) → left eave (curved) → close
  const px = totalW / 2;
  const py = 0;
  const reX = totalW + overhang * 0;  // right eave
  const reY = roofY + 3;
  const leX = 0;
  const leY = roofY + 3;
  // Quadratic bezier for each slope
  const roofPath = `M${px},${py} Q${totalW * 0.80},${roofY * 0.55} ${reX},${reY} L${leX},${leY} Q${totalW * 0.20},${roofY * 0.55} ${px},${py} Z`;

  // Glow & shadow
  const shadowFilter = isSelected
    ? `filter:drop-shadow(0 0 ${Math.round(size*0.22)}px ${accent}bb) drop-shadow(0 3px 6px rgba(0,0,0,0.40))`
    : `filter:drop-shadow(0 2px 6px rgba(0,0,0,0.32)) drop-shadow(0 1px 2px rgba(0,0,0,0.20))`;

  // Roof highlight (top-left shine)
  const highlightOp = isSelected ? "0.30" : "0.18";

  const svg = `
    <svg width="${totalW}" height="${svgH}" viewBox="0 0 ${totalW} ${svgH}" fill="none" xmlns="http://www.w3.org/2000/svg" style="${shadowFilter}">
      <defs>
        <linearGradient id="bodyGrad${size}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${fill}" stop-opacity="1"/>
          <stop offset="100%" stop-color="${fill}" stop-opacity="0.78"/>
        </linearGradient>
        <linearGradient id="roofGrad${size}" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stop-color="${accent}" stop-opacity="${isSelected ? '0.55' : '0.25'}"/>
          <stop offset="100%" stop-color="${fill}" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <!-- Chimney (behind roof) -->
      <rect x="${chimneyX}" y="${chimneyY}" width="${chimneyW}" height="${chimneyH + 4}" rx="${Math.max(1,Math.round(chimneyW*0.3))}" fill="${fill}" opacity="0.85"/>
      <!-- Chimney cap -->
      <rect x="${chimneyX - 1}" y="${chimneyY}" width="${chimneyW + 2}" height="${Math.max(2,Math.round(chimneyH*0.18))}" rx="1" fill="${accent}" opacity="0.70"/>

      <!-- Roof -->
      <path d="${roofPath}" fill="url(#bodyGrad${size})"/>
      <!-- Roof shine overlay -->
      <path d="${roofPath}" fill="url(#roofGrad${size})"/>
      <!-- Roof ridge line -->
      <line x1="${px}" y1="${py + 1}" x2="${px - 2}" y2="${py + 1}" stroke="white" stroke-width="1" opacity="${highlightOp}"/>

      <!-- Body -->
      <rect x="${overhang}" y="${roofY}" width="${W}" height="${bodyH}" rx="2" fill="url(#bodyGrad${size})"/>
      <!-- Body top edge highlight -->
      <rect x="${overhang + 2}" y="${roofY}" width="${W - 4}" height="1.5" rx="1" fill="white" opacity="${highlightOp}"/>

      <!-- Left window -->
      <rect x="${winLX}" y="${winY}" width="${winS}" height="${winS}" rx="1" fill="white" opacity="${isSelected ? '0.80' : '0.50'}"/>
      <line x1="${winLX + winS/2}" y1="${winY}" x2="${winLX + winS/2}" y2="${winY + winS}" stroke="${fill}" stroke-width="0.8" opacity="0.5"/>
      <line x1="${winLX}" y1="${winY + winS/2}" x2="${winLX + winS}" y2="${winY + winS/2}" stroke="${fill}" stroke-width="0.8" opacity="0.5"/>

      <!-- Right window -->
      <rect x="${winRX}" y="${winY}" width="${winS}" height="${winS}" rx="1" fill="white" opacity="${isSelected ? '0.80' : '0.50'}"/>
      <line x1="${winRX + winS/2}" y1="${winY}" x2="${winRX + winS/2}" y2="${winY + winS}" stroke="${fill}" stroke-width="0.8" opacity="0.5"/>
      <line x1="${winRX}" y1="${winY + winS/2}" x2="${winRX + winS}" y2="${winY + winS/2}" stroke="${fill}" stroke-width="0.8" opacity="0.5"/>

      <!-- Door -->
      <rect x="${doorX}" y="${doorY}" width="${doorW}" height="${doorH}" rx="${doorRx}" fill="${isSelected ? '#fff' : accent}" opacity="${isSelected ? '0.92' : '0.80'}"/>
      <!-- Door knob -->
      <circle cx="${doorX + doorW * 0.72}" cy="${doorY + doorH * 0.58}" r="${Math.max(1, Math.round(doorW * 0.09))}" fill="${isSelected ? accent : '#fff'}" opacity="0.70"/>

      <!-- Ground anchor dot -->
      <circle cx="${totalW / 2}" cy="${totalBodyBottom + dotR + 1}" r="${dotR}" fill="${fill}" opacity="0.55"/>
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
