import { MapPin, Eye, Heart, X } from "lucide-react";
import { useState } from "react";

interface PropertyCardProps {
  image: string;
  title: string;
  address: string;
  type: string;
  area: string;
  floor: string;
  deposit: string;
  monthly: string;
  isNew?: boolean;
  isHot?: boolean;
  views: number;
  onDelete?: () => void;
}

const PropertyCard = ({
  image, title, address, type, area, floor, deposit, monthly,
  isNew, isHot, views, onDelete
}: PropertyCardProps) => {
  const [liked, setLiked] = useState(false);

  return (
    <div className="bg-card rounded-2xl overflow-hidden card-shadow hover:card-shadow-hover transition-all duration-300 hover:-translate-y-1 group cursor-pointer">
      {/* Image */}
      <div className="relative overflow-hidden aspect-[4/3]">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
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
        <div className="absolute bottom-3 left-3">
          <span className="bg-primary/90 text-primary-foreground text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
            {type}
          </span>
        </div>
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
            <p className="text-sm font-semibold text-foreground">{area}</p>
          </div>
          <div className="bg-muted rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">층수</p>
            <p className="text-sm font-semibold text-foreground">{floor}</p>
          </div>
        </div>

        {/* Price */}
        <div className="border-t border-border pt-3 flex items-end justify-between">
          <div>
            <p className="text-xs text-muted-foreground">보증금 / 월세</p>
            <p className="font-bold text-primary text-sm">
              {deposit} / <span className="text-accent">{monthly}</span>
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
