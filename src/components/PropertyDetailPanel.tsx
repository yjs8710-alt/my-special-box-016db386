import { X, MapPin, Eye, Heart, Phone, ChevronRight, Calendar, Building2, Car, Maximize2, Layers, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { MapProperty } from "@/data/mapProperties";
import { Button } from "@/components/ui/button";

interface PropertyDetailPanelProps {
  property: MapProperty | null;
  onClose: () => void;
}

const TYPE_COLOR: Record<string, string> = {
  "상가": "bg-primary text-primary-foreground",
  "사무실": "bg-purple-600 text-white",
  "식당·카페": "bg-accent text-accent-foreground",
  "공장·창고": "bg-green-600 text-white",
  "병원·학원": "bg-red-700 text-white",
};

const PropertyDetailPanel = ({ property, onClose }: PropertyDetailPanelProps) => {
  const [liked, setLiked] = useState(false);

  if (!property) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 z-[900] w-[360px] bg-card/97 backdrop-blur-md border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
      {/* Image */}
      <div className="relative flex-shrink-0 h-52 overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {property.isNew && (
            <span className="bg-badge-new text-white text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
          )}
          {property.isHot && (
            <span className="bg-badge-hot text-white text-xs font-bold px-2 py-0.5 rounded-full">HOT</span>
          )}
        </div>

        {/* Type */}
        <div className="absolute top-3 right-10">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TYPE_COLOR[property.type] ?? "bg-primary text-primary-foreground"}`}>
            {property.type}
          </span>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Like button */}
        <button
          onClick={() => setLiked(!liked)}
          className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow transition-colors"
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
        </button>

        {/* Title on image */}
        <div className="absolute bottom-3 left-3 right-12">
          <p className="text-white font-bold text-sm line-clamp-1 drop-shadow">{property.title}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-white/80 flex-shrink-0" />
            <p className="text-white/80 text-xs line-clamp-1">{property.address}</p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Price */}
        <div className="px-4 py-4 border-b border-border bg-primary/5">
          <p className="text-xs text-muted-foreground mb-1">보증금 / 월세</p>
          <p className="text-xl font-extrabold text-primary">
            {property.deposit} <span className="text-muted-foreground font-normal text-base">/</span>{" "}
            <span className="text-accent">{property.monthly}</span>
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            <span>관리비 {property.manageFee}</span>
            <span>·</span>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>조회 {property.views.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Key info grid */}
        <div className="grid grid-cols-2 gap-px bg-border mx-4 mt-4 rounded-xl overflow-hidden border border-border">
          {[
            { icon: <Maximize2 className="w-3.5 h-3.5" />, label: "면적", value: property.area },
            { icon: <Layers className="w-3.5 h-3.5" />, label: "층수", value: property.floor },
            { icon: <Building2 className="w-3.5 h-3.5" />, label: "건물 층수", value: property.totalFloors },
            { icon: <Calendar className="w-3.5 h-3.5" />, label: "준공연도", value: property.buildYear },
            { icon: <Car className="w-3.5 h-3.5" />, label: "주차", value: property.parking },
            { icon: <ChevronRight className="w-3.5 h-3.5" />, label: "엘리베이터", value: property.elevator ? "있음" : "없음" },
          ].map(({ icon, label, value }) => (
            <div key={label} className="bg-muted/50 px-3 py-2.5 flex flex-col gap-0.5">
              <div className="flex items-center gap-1 text-muted-foreground">
                {icon}
                <span className="text-[11px]">{label}</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{value}</p>
            </div>
          ))}
        </div>

        {/* Available from */}
        <div className="mx-4 mt-3 flex items-center gap-2 bg-badge-new/10 rounded-lg px-3 py-2">
          <BadgeCheck className="w-4 h-4 text-badge-new flex-shrink-0" />
          <p className="text-xs text-foreground">
            <span className="font-semibold text-badge-new">입주 가능일</span>{" "}
            {property.availableFrom}
          </p>
        </div>

        {/* Description */}
        <div className="px-4 mt-4">
          <h4 className="text-sm font-bold text-foreground mb-2">매물 설명</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{property.description}</p>
        </div>

        {/* Agent */}
        <div className="mx-4 mt-4 mb-4 p-3 border border-border rounded-xl flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">담당 공인중개사</p>
            <p className="text-sm font-semibold text-foreground">{property.agentName}</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary font-medium">
            <Phone className="w-3.5 h-3.5" />
            <span>{property.contact}</span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex-shrink-0 p-4 border-t border-border flex gap-2">
        <Button variant="outline" className="flex-1 gap-1.5 font-semibold border-primary text-primary hover:bg-primary hover:text-primary-foreground">
          <Phone className="w-4 h-4" />
          전화 문의
        </Button>
        <Button className="flex-1 font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
          상세 보기
        </Button>
      </div>
    </div>
  );
};

export default PropertyDetailPanel;
