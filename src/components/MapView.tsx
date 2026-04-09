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
const PIN_IMAGE_URL = "/images/map-pin.png";

/* ── 커스텀 핀 이미지 크기 설정 ── */
const PIN_BASE_SIZE = 80;   // 기본 크기 (px)
const PIN_MIN_SIZE = 40;    // 최소 크기 (px)
const PIN_SELECTED_SIZE = 100; // 선택 시 크기 (px)

/** 줌 레벨(1~14) → 핀 크기(px) 매핑 — 확대(레벨↓)=작게, 축소(레벨↑)=크게 */
function getPinSize(zoomLevel: number, isSelected: boolean): number {
  if (isSelected) return PIN_SELECTED_SIZE;
  // level 1(최대 확대) ~ level 14(최대 축소)
  // level 5를 기준(80px), 레벨이 올라갈수록 커지고, 내려갈수록 작아짐
  const size = Math.round(PIN_BASE_SIZE + (zoomLevel - 5) * 4);
  return Math.max(PIN_MIN_SIZE, Math.min(120, size));
}

/** 커스텀 이미지 핀 HTML 생성 함수 */
function createPinHtml(isSelected: boolean, zoomLevel: number): string {
  const size = getPinSize(zoomLevel, isSelected);
  const shadow = isSelected
    ? "drop-shadow(0 0 10px rgba(59,130,246,0.7)) drop-shadow(0 4px 12px rgba(0,0,0,0.4))"
    : "drop-shadow(0 3px 6px rgba(0,0,0,0.35))";
  const transition = "transition:transform 0.15s ease,filter 0.15s ease;";

  return `<div style="
    display:flex;
    align-items:flex-end;
    justify-content:center;
    cursor:pointer;
    filter:${shadow};
    ${transition}
  "><img
    src="${PIN_IMAGE_URL}"
    width="${size}"
    height="${size}"
    style="display:block;object-fit:contain;pointer-events:none;"
    draggable="false"
    alt=""
  /></div>`;
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
  onBoundsChange?: (bounds: MapBounds) => void;
  suppressPan?: boolean;
}

const MapView = ({ properties, selectedId, onSelect, onBoundsChange, suppressPan }: MapViewProps) => {
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<Map<number, any>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const zoomLevelRef = useRef<number>(5);

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

  /** 오버레이(핀) 렌더링 — 함수 분리하여 재사용 */
  const renderOverlays = useCallback(
    (map: any, props: MapProperty[], selId: number | null, onSelectFn: (id: number) => void, zoom: number) => {
      clearOverlays();
      props.forEach((prop) => {
        if (!prop.lat || !prop.lng) return;
        const isSelected = prop.id === selId;

        const content = document.createElement("div");
        content.innerHTML = createPinHtml(isSelected, zoom);
        content.style.cssText = "cursor:pointer;";
        content.addEventListener("click", () => onSelectFn(prop.id));

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(prop.lat, prop.lng),
          content,
          map,
          yAnchor: 1, // 이미지 하단 중앙이 좌표에 맞도록
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
      renderOverlays(map, propsRef.current.properties, propsRef.current.selectedId, propsRef.current.onSelect, zoomLevelRef.current);

      setTimeout(() => fireBounds(map), 300);

      // zoom_changed → 모든 마커 크기 재적용
      window.kakao.maps.event.addListener(map, "zoom_changed", () => {
        if (!mountedRef.current) return;
        const newZoom = map.getLevel();
        zoomLevelRef.current = newZoom;
        renderOverlays(map, propsRef.current.properties, propsRef.current.selectedId, propsRef.current.onSelect, newZoom);
        fireBounds(map);
      });

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

  // 핀 업데이트
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    renderOverlays(mapRef.current, properties, selectedId, onSelect, zoomLevelRef.current);
  }, [properties, selectedId, onSelect, renderOverlays]);

  // 선택된 매물로 이동
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
