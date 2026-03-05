import { useEffect, useRef } from "react";
import { MapProperty } from "@/data/mapProperties";

declare global {
  interface Window {
    naver: any;
  }
}

const NAVER_CLIENT_ID = "qhaskf0966";

const TYPE_COLORS: Record<string, string> = {
  "상가": "#0a2d6e",
  "사무실": "#6d28d9",
  "식당·카페": "#ea580c",
  "공장·창고": "#166534",
  "병원·학원": "#9f1239",
};

const TYPE_ACCENT: Record<string, string> = {
  "상가": "#3b82f6",
  "사무실": "#a78bfa",
  "식당·카페": "#fb923c",
  "공장·창고": "#4ade80",
  "병원·학원": "#fb7185",
};

function createPinHtml(property: MapProperty, isSelected: boolean) {
  const color = TYPE_COLORS[property.type] ?? "#0a2d6e";
  const accent = TYPE_ACCENT[property.type] ?? "#3b82f6";
  const shadow = isSelected
    ? `0 6px 20px rgba(0,0,0,0.45), 0 0 0 3px ${accent}`
    : "0 3px 10px rgba(0,0,0,0.3)";
  const bg = isSelected
    ? `linear-gradient(135deg, ${color}, ${accent})`
    : color;
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

interface MapViewProps {
  properties: MapProperty[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const MapView = ({ properties, selectedId, onSelect }: MapViewProps) => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<number, any>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Load Naver Maps script
  useEffect(() => {
    if (document.getElementById("naver-maps-script")) return;
    const script = document.createElement("script");
    script.id = "naver-maps-script";
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${NAVER_CLIENT_ID}`;
    script.async = true;
    script.onload = () => initMap();
    document.head.appendChild(script);

    return () => {
      // cleanup markers safely on unmount
      markersRef.current.forEach((m) => {
        try { m.setMap(null); } catch (_) {}
      });
      markersRef.current.clear();
      if (mapRef.current) {
        try { mapRef.current.destroy?.(); } catch (_) {}
        mapRef.current = null;
      }
    };
  }, []);

  // Init map after script load (or if already loaded)
  useEffect(() => {
    if (window.naver && !mapRef.current) {
      initMap();
    }
  });

  function initMap() {
    if (!containerRef.current || mapRef.current || !window.naver) return;

    const map = new window.naver.maps.Map(containerRef.current, {
      center: new window.naver.maps.LatLng(36.6424, 127.4890),
      zoom: 14,
      mapTypeControl: false,
    });

    mapRef.current = map;
    renderMarkers();
  }

  function renderMarkers() {
    const map = mapRef.current;
    if (!map || !window.naver) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    properties.forEach((prop) => {
      const isSelected = prop.id === selectedId;
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(prop.lat, prop.lng),
        map,
        icon: {
          content: createPinHtml(prop, isSelected),
          anchor: new window.naver.maps.Point(32, 36),
        },
        zIndex: isSelected ? 1000 : 0,
      });

      window.naver.maps.Event.addListener(marker, "click", () => onSelect(prop.id));
      markersRef.current.set(prop.id, marker);
    });
  }

  // Sync markers on change
  useEffect(() => {
    if (mapRef.current && window.naver) {
      renderMarkers();
    }
  }, [properties, selectedId]);

  // Pan to selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedId === null || !window.naver) return;
    const prop = properties.find((p) => p.id === selectedId);
    if (prop) {
      map.panTo(new window.naver.maps.LatLng(prop.lat, prop.lng));
    }
  }, [selectedId, properties]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapView;
