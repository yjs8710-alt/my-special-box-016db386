import { MapPin, Eye, Heart, X } from "lucide-react";
import logoTransparent from "@/assets/logo-transparent.png";
import zibdaPlaceholder from "@/assets/zibda-placeholder.png";
import { useState } from "react";

interface PropertyCardProps {
  image: string;
  title: string;
  address: string;
  type: string;
  roomType?: string;
  area: string;
  floor: string;
  deposit: string;
  monthly: string;
  manageFee?: string;
  isNew?: boolean;
  isHot?: boolean;
  views: number;
  buildYear?: string;
  elevator?: boolean;
  onDelete?: () => void;
  referenceImage?: string; // 사진 없을 때 다른 방 참고용 사진
  referenceUnit?: string;  // 참고용 사진의 호수
}

const PropertyCard = ({
  image, title, address, type, roomType, area, floor, deposit, monthly, manageFee,
  isNew, isHot, views, buildYear, elevator, onDelete, referenceImage, referenceUnit
}: PropertyCardProps) => {
  const [liked, setLiked] = useState(false);

  // 건축년도에서 숫자 4자리만 추출
  const buildYearShort = buildYear ? buildYear.replace(/[^0-9]/g, "").slice(0, 4) : null;

  const hasOwnImage = image && image.length > 0;
  const displayImage = hasOwnImage ? image : referenceImage || "";
  const isRef = !hasOwnImage && !!referenceImage;

  return (
    <div className="bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        {displayImage ? (
          <>
            <img
              src={displayImage}
              alt={title}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isRef ? "opacity-70" : ""}`}
              style={{ imageRendering: "auto" }}
              onError={(e) => {
                const img = e.currentTarget;
                // 로드 실패 시 로고 플레이스홀더로 교체
                const parent = img.parentElement;
                if (parent) {
                  const fallback = document.createElement("div");
                  fallback.className = "w-full h-full flex items-center justify-center bg-muted absolute inset-0";
                  fallback.innerHTML = `<img src="${logoTransparent}" alt="집다 로고" class="w-20 h-auto opacity-40" />`;
                  parent.appendChild(fallback);
                  img.style.display = "none";
                }
              }}
            />
            {isRef && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.7)]">
                  참고용 다른 호실 사진
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <img src={logoTransparent} alt="집다 로고" className="w-64 h-auto opacity-40" />
          </div>
        )}
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {isNew && (
            <span className="bg-badge-new text-white text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
          )}
          {isHot && (
            <span className="bg-badge-hot text-white text-xs font-bold px-2 py-0.5 rounded-full">HOT</span>
          )}
        </div>
        {/* Delete + Like */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow hover:bg-white transition-colors"
          >
            <Heart className={`w-4 h-4 ${liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>
        </div>
        {/* Type badge */}
        <div className="absolute bottom-3 left-3 flex gap-1.5">
          <span className="bg-primary/90 text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
            {type}
          </span>
          {type === "원룸" && (roomType === "오픈형" || roomType === "분리형") && (
            <span
              className={`bg-white/95 text-xs font-extrabold px-2.5 py-1 rounded-full backdrop-blur-sm ${
                roomType === "오픈형" ? "text-orange-500" : "text-blue-600"
              }`}
            >
              {roomType}
            </span>
          )}
        </div>
        {/* 건축년도 badge */}
        {buildYearShort && (
          <div className="absolute bottom-3 right-3">
            <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
              준{buildYearShort}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground text-sm mb-1 line-clamp-1">{title}</h3>
        <div className="flex items-center gap-1 mb-3">
          <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground line-clamp-1">{address}</span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-muted rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">면적</p>
            <p className="text-sm font-semibold text-foreground">{area?.includes("평") ? area : (() => { const n = parseFloat((area || "").replace(/[^0-9.]/g, "")); return !isNaN(n) && n > 0 ? `${(n / 3.3058).toFixed(1)}평` : area; })()}</p>
          </div>
          <div className="bg-muted rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">층수</p>
            <p className="text-sm font-semibold text-foreground">{floor}</p>
          </div>
        </div>

        {/* 건축년도 + 엘리베이터 */}
        {(buildYearShort || elevator !== undefined) && (
          <div className="flex items-center gap-2 mb-3">
            {buildYearShort && (
              <div className="flex items-center gap-1 bg-muted rounded-full px-2.5 py-1">
                <span className="text-[10px] text-muted-foreground">준공</span>
                <span className="text-[11px] font-bold text-foreground">{buildYearShort}년</span>
              </div>
            )}
            {elevator !== undefined && (
              <div className="flex items-center gap-1 bg-muted rounded-full px-2.5 py-1">
                <span className="text-[10px] text-muted-foreground">엘리베이터</span>
                <span className={`text-[11px] font-bold ${elevator ? "text-primary" : "text-muted-foreground"}`}>
                  {elevator ? "있음" : "없음"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Price */}
        <div className="border-t border-border pt-3 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">보증금 / 월세</p>
            <p className="font-bold text-primary text-sm">
              {deposit} / <span className="text-accent">{monthly}</span>
              {manageFee && manageFee !== "0" && manageFee !== "" && (
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  (관리비 {manageFee})
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Eye className="w-3.5 h-3.5" />
            <span className="text-xs">{views.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
