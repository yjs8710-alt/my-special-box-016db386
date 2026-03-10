import {
  X, MapPin, Eye, Heart, Phone, Calendar, Building2, Car, Maximize2,
  Layers, BadgeCheck, Share2, ArrowUpRight, FileText, ExternalLink,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight, EyeOff, Eye as EyeIcon,
} from "lucide-react";
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

/* ─── 전화번호 클릭시 노출 컴포넌트 ─── */
function RevealPhone({ label, phone }: { label: string; phone?: string }) {
  const [revealed, setRevealed] = useState(false);
  if (!phone) return null;

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-xl border border-border bg-muted/30">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
          <Phone className="w-3 h-3 text-primary" />
        </div>
        <span className="text-xs font-semibold text-foreground">{label}</span>
      </div>
      {revealed ? (
        <div className="flex items-center gap-2">
          <a href={`tel:${phone}`} className="text-xs font-bold text-primary hover:underline">
            {phone}
          </a>
          <button
            onClick={() => setRevealed(false)}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            title="숨기기"
          >
            <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setRevealed(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors"
          style={{ background: "hsl(var(--primary) / 0.12)", color: "hsl(var(--primary))" }}
        >
          <EyeIcon className="w-3 h-3" />
          번호 보기
        </button>
      )}
    </div>
  );
}

/* ─── 이미지 캐러셀 ─── */
function ImageCarousel({ images, title }: { images: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const imgs = images.filter(Boolean);

  if (imgs.length === 0) {
    return (
      <div className="relative flex-shrink-0 h-48 bg-muted flex items-center justify-center">
        <Building2 className="w-12 h-12 text-muted-foreground/30" />
      </div>
    );
  }

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i - 1 + imgs.length) % imgs.length);
  };
  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIdx((i) => (i + 1) % imgs.length);
  };

  return (
    <div className="relative flex-shrink-0 h-48 overflow-hidden bg-muted">
      {/* 슬라이드 */}
      <div
        className="flex h-full transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${idx * 100}%)`, width: `${imgs.length * 100}%` }}
      >
        {imgs.map((src, i) => (
          <div key={i} className="h-full flex-shrink-0" style={{ width: `${100 / imgs.length}%` }}>
            <img src={src} alt={`${title} ${i + 1}`} className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {/* 그라디언트 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

      {/* 이전/다음 버튼 */}
      {imgs.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center backdrop-blur-sm transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>

          {/* 인디케이터 점 */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1">
            {imgs.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i === idx ? "#fff" : "rgba(255,255,255,0.45)" }}
              />
            ))}
          </div>

          {/* 장수 표시 */}
          <div className="absolute top-3 left-3 bg-black/50 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
            {idx + 1} / {imgs.length}
          </div>
        </>
      )}
    </div>
  );
}

const PropertyDetailPanel = ({ property, onClose }: PropertyDetailPanelProps) => {
  const [liked, setLiked] = useState(false);
  const [buildingOpen, setBuildingOpen] = useState(false);
  if (!property) return null;

  const buildingSearchUrl = `https://www.eais.go.kr`;
  const naverBuildingUrl = `https://land.naver.com/building/info?address=${encodeURIComponent(property.address)}`;
  const typeStyle = TYPE_STYLE[property.type] ?? { bg: "bg-primary", text: "text-white" };

  // 이미지 배열: images 배열 우선, 없으면 image 단일
  const allImages = (property.images && property.images.length > 0)
    ? property.images
    : property.image ? [property.image] : [];

  return (
    <div className="absolute left-0 top-0 bottom-0 z-[900] w-[360px] bg-white border-l border-border shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">

      {/* ── Image Carousel ── */}
      <div className="relative">
        <ImageCarousel images={allImages} title={property.title} />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-1.5 z-10" style={{ top: allImages.length > 1 ? "2.5rem" : "0.75rem" }}>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
            {property.type}
          </span>
          {property.isNew && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-badge-new text-white">NEW</span>}
          {property.isHot && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-badge-hot text-white">HOT</span>}
        </div>

        {/* Top-right controls */}
        <div className="absolute top-3 right-3 flex gap-1.5 z-10">
          <button onClick={() => setLiked(!liked)} className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition-colors">
            <Heart className={`w-3.5 h-3.5 ${liked ? "fill-red-400 text-red-400" : "text-white"}`} />
          </button>
          <button className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition-colors">
            <Share2 className="w-3.5 h-3.5 text-white" />
          </button>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center backdrop-blur-sm transition-colors">
            <X className="w-3.5 h-3.5 text-white" />
          </button>
        </div>

        {/* Bottom title overlay */}
        <div className="absolute bottom-3 left-4 right-4 z-10">
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

        {/* ── 연락처 (건물주 / 관리인 클릭 시 노출) ── */}
        {(property.contactOwner || property.contactManager) && (
          <>
            <div className="h-2 bg-muted/50 my-2" />
            <div className="px-4 pb-3 flex flex-col gap-2">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">연락처</p>
              <RevealPhone label="건물주" phone={property.contactOwner} />
              <RevealPhone label="관리인" phone={property.contactManager} />
              {property.contact && (
                <div className="flex items-center justify-between py-2 px-3 rounded-xl border border-border bg-muted/30">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center">
                      <Phone className="w-3 h-3 text-accent" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">부동산</span>
                  </div>
                  <a href={`tel:${property.contact}`} className="text-xs font-bold text-accent hover:underline">
                    {property.contact}
                  </a>
                </div>
              )}
            </div>
          </>
        )}

        {/* Divider */}
        <div className="h-2 bg-muted/50 my-2" />

        {/* 건축물대장 */}
        <div className="px-4 pb-3">
          <button onClick={() => setBuildingOpen(!buildingOpen)} className="w-full flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">건축물대장</span>
            </div>
            {buildingOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {buildingOpen && (
            <div className="mt-2 rounded-xl border border-border overflow-hidden">
              <div className="px-3 py-2.5 bg-muted/40 border-b border-border">
                <p className="text-[10px] text-muted-foreground font-medium mb-0.5">조회 주소</p>
                <p className="text-xs font-semibold text-foreground">{property.address}</p>
              </div>
              <div className="px-3 py-3 grid grid-cols-2 gap-y-2 gap-x-4 bg-white text-xs">
                <div><p className="text-[10px] text-muted-foreground">건물 유형</p><p className="font-semibold text-foreground">{property.type}</p></div>
                <div><p className="text-[10px] text-muted-foreground">준공연도</p><p className="font-semibold text-foreground">{property.buildYear}</p></div>
                <div><p className="text-[10px] text-muted-foreground">총 층수</p><p className="font-semibold text-foreground">{property.totalFloors}</p></div>
                <div><p className="text-[10px] text-muted-foreground">엘리베이터</p><p className="font-semibold text-foreground">{property.elevator ? "있음" : "없음"}</p></div>
              </div>
              <div className="px-3 py-2.5 bg-muted/20 border-t border-border flex flex-col gap-2">
                <p className="text-[10px] text-muted-foreground font-medium">공식 열람 (외부 연결)</p>
                <div className="flex gap-2">
                  <a href={buildingSearchUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary/90 transition-colors">
                    <ExternalLink className="w-3 h-3" />세움터 열람
                  </a>
                  <a href={naverBuildingUrl} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-accent text-white text-[11px] font-bold hover:bg-accent/90 transition-colors">
                    <ExternalLink className="w-3 h-3" />네이버 건물정보
                  </a>
                </div>
              </div>
            </div>
          )}
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
            {property.contact && (
              <a href={`tel:${property.contact}`} className="flex items-center gap-1.5 text-xs font-bold text-accent hover:underline">
                <Phone className="w-3.5 h-3.5" />
                {property.contact}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-border bg-white grid grid-cols-2 gap-2">
        <a
          href={`tel:${property.contactOwner ?? property.contact}`}
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
