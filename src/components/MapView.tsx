import { useEffect, useRef, useCallback } from "react";
import { MapProperty } from "@/data/mapProperties";

declare global {
  interface Window {
    naver: any;
    __naverMapReady?: boolean;
    __naverMapCallbacks?: Array<() => void>;
  }
}

const NAVER_CLIENT_ID = "s0knnmfq0i";

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

function createPinHtml(property: MapProperty, isSelected: boolean) {
  const color = TYPE_COLORS[property.type] ?? "#0a2d6e";
  const accent = TYPE_ACCENT[property.type] ?? "#3b82f6";
  const shadow = isSelected
    ? `0 6px 20px rgba(0,0,0,0.45), 0 0 0 3px ${accent}`
    : "0 3px 10px rgba(0,0,0,0.3)";
  const bg = isSelected ? `linear-gradient(135deg, ${color}, ${accent})` : color;
  const scale = isSelected ? 1.25 : 1;

  return `
    <div style="
      background:${bg};
      color:white;
      font-size:11px;
      font-weight:800;
      font-family:'Noto Sans KR',sans-serif;
      padding:5px 10px;
      border-radius:999px;
      white-space:nowrap;
      border:2px solid rgba(255,255,255,0.9);
      box-shadow:${shadow};
      transform:scale(${scale});
      transform-origin:bottom center;
      position:relative;
      cursor:pointer;
      letter-spacing:-0.3px;
    ">
      ${property.monthly}
      <div style="
        position:absolute;
        bottom:-7px;
        left:50%;
        transform:translateX(-50%);
        width:0;height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-top:7px solid ${isSelected ? accent : color};
        filter:drop-shadow(0 2px 2px rgba(0,0,0,0.2));
      "></div>
    </div>
  `;
}

function loadNaverScript(cb: () => void) {
  if (window.naver && window.naver.maps) {
    cb();
    return;
  }
  if (!window.__naverMapCallbacks) window.__naverMapCallbacks = [];
  window.__naverMapCallbacks.push(cb);

  if (document.getElementById("naver-maps-script")) return;

  const script = document.createElement("script");
  script.id = "naver-maps-script";
  script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}`;
  script.async = true;
  script.onload = () => {
    window.__naverMapReady = true;
    window.__naverMapCallbacks?.forEach((fn) => fn());
    window.__naverMapCallbacks = [];
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
  const markersRef = useRef<Map<number, any>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => {
      try { m.setMap(null); } catch (_) {}
    });
    markersRef.current.clear();
  }, []);

  const renderMarkers = useCallback(
    (map: any, props: MapProperty[], selId: number | null, onSelectFn: (id: number) => void) => {
      clearMarkers();
      props.forEach((prop) => {
        if (!prop.lat || !prop.lng) return;
        const isSelected = prop.id === selId;

        const content = document.createElement("div");
        content.innerHTML = createPinHtml(prop, isSelected);
        content.style.cssText = "cursor:pointer;";
        content.addEventListener("click", () => onSelectFn(prop.id));

        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(prop.lat, prop.lng),
          map,
          icon: {
            content,
            anchor: new window.naver.maps.Point(
              content.offsetWidth / 2 || 30,
              content.offsetHeight + 7 || 37
            ),
          },
          zIndex: isSelected ? 1000 : 0,
        });

        markersRef.current.set(prop.id, marker);
      });
    },
    [clearMarkers]
  );

  // Init map
  useEffect(() => {
    mountedRef.current = true;

    loadNaverScript(() => {
      if (!mountedRef.current || !containerRef.current) return;
      if (mapRef.current) return;

      const map = new window.naver.maps.Map(containerRef.current, {
        center: new window.naver.maps.LatLng(36.6424, 127.489),
        zoom: 14,
        mapTypeControl: false,
        scaleControl: false,
        logoControl: true,
        mapDataControl: false,
      });

      mapRef.current = map;
      renderMarkers(map, properties, selectedId, onSelect);
    });

    return () => {
      mountedRef.current = false;
      clearMarkers();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update markers when props/selection change
  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps) return;
    renderMarkers(mapRef.current, properties, selectedId, onSelect);
  }, [properties, selectedId, onSelect, renderMarkers]);

  // Pan to selected
  useEffect(() => {
    if (!mapRef.current || selectedId === null || !window.naver?.maps) return;
    const prop = properties.find((p) => p.id === selectedId);
    if (prop && prop.lat && prop.lng) {
      mapRef.current.panTo(new window.naver.maps.LatLng(prop.lat, prop.lng));
    }
  }, [selectedId, properties]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapView;
