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
  "상가": "#1e40af",
  "사무실": "#7c3aed",
  "식당·카페": "#ea580c",
  "공장·창고": "#15803d",
  "병원·학원": "#b91c1c",
};

function createPinIcon(property: MapProperty, isSelected: boolean) {
  const color = TYPE_COLORS[property.type] ?? "#1e40af";
  const scale = isSelected ? 1.2 : 1;
  const shadow = isSelected ? "0 4px 16px rgba(0,0,0,0.4)" : "0 2px 6px rgba(0,0,0,0.25)";
  const border = isSelected ? "3px solid #f97316" : "2px solid white";

  const html = `
    <div style="
      background:${color};
      color:white;
      font-size:11px;
      font-weight:700;
      font-family:'Noto Sans KR',sans-serif;
      padding:5px 9px;
      border-radius:20px;
      white-space:nowrap;
      border:${border};
      box-shadow:${shadow};
      transform:scale(${scale});
      transform-origin:bottom center;
      position:relative;
      cursor:pointer;
    ">
      ${property.monthly}
      <div style="
        position:absolute;
        bottom:-6px;
        left:50%;
        transform:translateX(-50%);
        width:0;height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-top:6px solid ${color};
      "></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconAnchor: [30, 34],
    iconSize: [60, 34],
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

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
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
