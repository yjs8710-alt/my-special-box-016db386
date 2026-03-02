import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapProperty } from "@/data/mapProperties";

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

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

function createPinIcon(property: MapProperty, isSelected: boolean) {
  const color = TYPE_COLORS[property.type] ?? "#0a2d6e";
  const accent = TYPE_ACCENT[property.type] ?? "#3b82f6";
  const shadow = isSelected
    ? `0 6px 20px rgba(0,0,0,0.45), 0 0 0 3px ${accent}`
    : "0 3px 10px rgba(0,0,0,0.3)";
  const bg = isSelected
    ? `linear-gradient(135deg, ${color}, ${accent})`
    : color;
  const scale = isSelected ? 1.25 : 1;

  const html = `
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
      backdrop-filter:blur(4px);
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

  return L.divIcon({
    html,
    className: "",
    iconAnchor: [32, 36],
    iconSize: [64, 36],
  });
}

interface MapViewProps {
  properties: MapProperty[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const MapView = ({ properties, selectedId, onSelect }: MapViewProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<number, L.Marker>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [37.5326, 127.024],
      zoom: 12,
      zoomControl: false,
    });

    // CartoDB Positron — clean, minimal, light gray style
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    properties.forEach((prop) => {
      const isSelected = prop.id === selectedId;
      const marker = L.marker([prop.lat, prop.lng], {
        icon: createPinIcon(prop, isSelected),
        zIndexOffset: isSelected ? 1000 : 0,
      });

      marker.on("click", () => onSelect(prop.id));
      marker.addTo(map);
      markersRef.current.set(prop.id, marker);
    });
  }, [properties, selectedId, onSelect]);

  // Fly to selected
  useEffect(() => {
    const map = mapRef.current;
    if (!map || selectedId === null) return;
    const prop = properties.find((p) => p.id === selectedId);
    if (prop) {
      map.flyTo([prop.lat, prop.lng], 15, { duration: 0.8 });
    }
  }, [selectedId, properties]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default MapView;
