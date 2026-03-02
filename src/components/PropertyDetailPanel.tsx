import { X, MapPin, Eye, Heart, Phone, Calendar, Building2, Car, Maximize2, Layers, BadgeCheck, Share2, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { MapProperty } from "@/data/mapProperties";

interface PropertyDetailPanelProps {
  property: MapProperty | null;
  onClose: () => void;
}

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  "상가":     { bg: "bg-primary",   text: "text-white" },
  "사무실":   { bg: "bg-purple-600", text: "text-white" },
  "식당·카페":{ bg: "bg-accent",    text: "text-white" },
  "공장·창고":{ bg: "bg-green-600", text: "text-white" },
  "병원·학원":{ bg: "bg-red-700",   text: "text-white" },
};

const PropertyDetailPanel = ({ property, onClose }: PropertyDetailPanelProps) => {
  const [liked, setLiked] = useState(false);
  if (!property) return null;

  const typeStyle = TYPE_STYLE[property.type] ?? { bg: "bg-primary", text: "text-white" };

  return (
    <div className="absolute right-0 top-0 bottom-0 z-[900] w-[360px] bg-white border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">

      {/* ── Image ── */}
      <div className="relative flex-shrink-0 h-48 overflow-hidden">
        <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Top controls */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
            {property.type}
          </span>
          {property.isNew && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-badge-new text-white">NEW</span>}
          {property.isHot && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-badge-hot text-white">HOT</span>}
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5">
          <button
            onClick={() => setLiked(!liked)}
            className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <Heart className={`w-3.5 h-3.5 ${liked ? "fill-red-400 text-red-400" : "text-white"}`} />
          </button>
          <button className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition-colors">
            <Share2 className="w-3.5 h-3.5 text-white" />
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* Bottom title */}
        <div className="absolute bottom-3 left-4 right-4">
          <p className="text-white font-bold text-[15px] line-clamp-1 drop-shadow-sm">{property.title}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-white/70 flex-shrink-0" />
            <p className="text-white/80 text-xs line-clamp-1">{property.address}</p>
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">

        {/* Price block */}
        <div className="px-4 py-4 bg-primary/5 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-0.5">보증금 / 월세</p>
              <p className="text-xl font-extrabold text-foreground leading-tight">
                {property.deposit}
                <span className="text-muted-foreground font-light mx-1.5 text-base">/</span>
                <span className="text-accent">{property.monthly}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-muted-foreground">관리비</p>
              <p className="text-sm font-semibold text-foreground">{property.manageFee}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/60">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Eye className="w-3 h-3" />
              <span>조회 {property.views.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-badge-new font-semibold">
              <BadgeCheck className="w-3 h-3" />
              <span>입주가능 {property.availableFrom}</span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">매물 정보</p>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: <Maximize2 className="w-3.5 h-3.5" />, label: "면적",   value: property.area.split(" ")[0], sub: property.area.split(" ")[1] },
              { icon: <Layers className="w-3.5 h-3.5" />,    label: "해당층", value: property.floor },
              { icon: <Building2 className="w-3.5 h-3.5" />, label: "건물층", value: property.totalFloors.replace("지상 ", "") },
              { icon: <Calendar className="w-3.5 h-3.5" />,  label: "준공",   value: property.buildYear.replace("년", ""), sub: "년" },
              { icon: <Car className="w-3.5 h-3.5" />,       label: "주차",   value: property.parking },
              { icon: <ArrowUpRight className="w-3.5 h-3.5" />, label: "엘리베이터", value: property.elevator ? "있음" : "없음" },
            ].map(({ icon, label, value, sub }) => (
              <div key={label} className="bg-muted/50 rounded-lg px-2.5 py-2 flex flex-col gap-0.5 text-center">
                <div className="flex items-center justify-center gap-1 text-muted-foreground mb-0.5">
                  {icon}
                  <span className="text-[10px]">{label}</span>
                </div>
                <p className="text-sm font-bold text-foreground leading-tight">{value}{sub && <span className="text-xs font-normal text-muted-foreground">{sub}</span>}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-2 bg-muted/50 my-2" />

        {/* Description */}
        <div className="px-4 pb-3">
          <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">매물 설명</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
        </div>

        {/* Divider */}
        <div className="h-2 bg-muted/50 my-2" />

        {/* Agent card */}
        <div className="px-4 pb-4">
          <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">담당 공인중개사</p>
          <div className="border border-border rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{property.agentName}</p>
              <p className="text-xs text-muted-foreground">공인중개사</p>
            </div>
            <a
              href={`tel:${property.contact}`}
              className="flex items-center gap-1.5 text-xs font-bold text-accent hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              {property.contact}
            </a>
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-white grid grid-cols-2 gap-2">
        <a
          href={`tel:${property.contact}`}
          className="flex items-center justify-center gap-1.5 h-11 rounded-lg border-2 border-primary text-primary text-sm font-bold hover:bg-primary hover:text-white transition-colors"
        >
          <Phone className="w-4 h-4" />
          전화 문의
        </a>
        <button className="flex items-center justify-center gap-1.5 h-11 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-bold transition-colors">
          <ArrowUpRight className="w-4 h-4" />
          상세 보기
        </button>
      </div>
    </div>
  );
};

export default PropertyDetailPanel;
