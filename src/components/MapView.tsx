import { useEffect, useRef, useCallback } from "react";
import { MapProperty } from "@/data/mapProperties";

import pinApartment from "@/assets/pins/pin-apartment.png";
import pinRoom from "@/assets/pins/pin-room.png";
import pinCommercial from "@/assets/pins/pin-commercial.png";
import pinOffice from "@/assets/pins/pin-office.png";
import pinRestaurant from "@/assets/pins/pin-restaurant.png";
import pinFactory from "@/assets/pins/pin-factory.png";
import pinLand from "@/assets/pins/pin-land.png";
import pinMedical from "@/assets/pins/pin-medical.png";
import pinTech from "@/assets/pins/pin-tech.png";

declare global {
  interface Window {
    kakao: any;
    __kakaoMapReady?: boolean;
    __kakaoMapCallbacks?: Array<() => void>;
  }
}

const KAKAO_JS_KEY = "9b1ab990830e8319b8bafb3104e5ae50";

/** 매물 유형 → 핀 이미지 매핑 */
const TYPE_PIN_IMAGE: Record<string, string> = {
  "아파트": pinApartment,
  "빌라": pinApartment,
  "오피스텔": pinApartment,
  "원룸": pinRoom,
  "투룸": pinRoom,
  "쓰리룸+": pinRoom,
  "투베이": pinRoom,
  "상가": pinCommercial,
  "사무실": pinOffice,
  "식당·카페": pinRestaurant,
  "공장·창고": pinFactory,
  "토지": pinLand,
  "병원·학원": pinMedical,
  "지식산업": pinTech,
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

/** 커스텀 일러스트 핀 이미지 사용 */
function createPinHtml(property: MapProperty, isSelected: boolean, zoomLevel: number) {
  const pinImg = TYPE_PIN_IMAGE[property.type] ?? pinRoom;
  const size = getPinSize(zoomLevel);
  const scale = isSelected ? 1.3 : 1;

  const shadow = isSelected
    ? `drop-shadow(0 0 8px rgba(249,115,22,0.7)) drop-shadow(0 3px 8px rgba(0,0,0,0.4))`
    : `drop-shadow(0 2px 5px rgba(0,0,0,0.35))`;

  const border = isSelected
    ? `border:2.5px solid #f97316;border-radius:50% 50% 50% 0;`
    : ``;

  return `
    <div style="
      display:flex;
      align-items:center;
      justify-content:center;
      transform:scale(${scale});
      transform-origin:bottom center;
      cursor:pointer;
      filter:${shadow};
      transition:transform 0.15s ease;
    ">
      <img src="${pinImg}" 
        width="${size}" height="${size}" 
        style="display:block;${border}"
        alt="${property.type}" />
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

  // 컨테이너 크기 변경 시 지도 relayout 호출
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (mapRef.current && window.kakao?.maps) {
        mapRef.current.relayout();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapView;
