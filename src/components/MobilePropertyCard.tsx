import { useState } from "react";
import { Camera, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, MessageCircle, KeyRound, FileText, StickyNote } from "lucide-react";
import { MapProperty } from "@/data/mapProperties";
import { sharePropertyToKakao, AgencyInfo } from "@/lib/kakaoShare";
import logoTransparent from "@/assets/logo-transparent.png";
import kakaoTalkIcon from "@/assets/kakao-talk-icon.png";

interface MobilePropertyCardProps {
  prop: MapProperty;
  selected: boolean;
  onSelect: () => void;
  isAdmin?: boolean;
  agencyInfo?: AgencyInfo;
  fallbackImage?: string;
}

/** 모바일 매물 카드 — 짤림 없이 핵심정보만 노출, 클릭시 상세 아코디언 */
const MobilePropertyCard = ({ prop, selected, onSelect, isAdmin, agencyInfo, fallbackImage }: MobilePropertyCardProps) => {
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  const buildYearShort = prop.buildYear ? prop.buildYear.replace(/[^0-9]/g, "").slice(0, 4) : "";
  const ownImages = (prop.images && prop.images.length > 0)
    ? prop.images
    : prop.image
      ? [prop.image]
      : fallbackImage
        ? [fallbackImage]
        : [];
  const hasPhoto = ownImages.length > 0;

  // 도로뷰 (카카오맵 로드뷰) 새 탭
  const openRoadview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!prop.lat || !prop.lng) return;
    window.open(
      `https://map.kakao.com/link/roadview/${prop.lat},${prop.lng}`,
      "_blank",
      "noopener"
    );
  };

  const openGallery = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasPhoto) return;
    setImgIdx(0);
    setGalleryOpen(true);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    sharePropertyToKakao(prop, agencyInfo, fallbackImage);
  };

  // 부가시설 (엘리베이터, 반려동물 등은 옵션이나 별도필드)
  const facilities: string[] = [];
  if (prop.elevator) facilities.push("엘리베이터");
  if (prop.parking && prop.parking !== "0" && prop.parking !== "-" && prop.parking !== "") facilities.push(`주차 ${prop.parking}`);

  const options = (prop.options ?? []).slice(0, 8);

  // 가격 포맷
  const priceText = (() => {
    const dep = prop.deposit || "-";
    const mon = prop.monthly || "";
    if (mon && mon !== "0" && mon !== "-") return `${dep} / ${mon}`;
    return dep;
  })();

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        className={`relative w-full bg-white rounded-xl border transition-all ${
          selected ? "border-primary ring-2 ring-primary/30 shadow-md" : "border-border shadow-sm"
        }`}
      >
        {/* 우측 상단 - 방메모 */}
        {prop.roomMemo && (
          <div className="absolute top-2 right-2 max-w-[55%] bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-semibold px-2 py-1 rounded-md leading-tight z-10 line-clamp-2">
            <span className="font-bold mr-1">방메모</span>
            {prop.roomMemo}
          </div>
        )}

        <div className="p-3 pr-2">
          {/* 1행: 건물명 + 호수 + 방유형 */}
          <div className="flex items-center gap-1.5 flex-wrap pr-[55%]">
            <h3 className="text-sm font-bold text-foreground line-clamp-1">
              {prop.buildingName || prop.title || "이름 없음"}
            </h3>
            {prop.unitNumber && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                {prop.unitNumber}호
              </span>
            )}
            {prop.roomType && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                {prop.roomType}
              </span>
            )}
          </div>

          {/* 2행: 주소 (클릭 → 로드뷰) + 준공년도 */}
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={openRoadview}
              className="text-[11px] text-muted-foreground underline-offset-2 hover:text-primary hover:underline truncate text-left flex-1 min-w-0"
              title="로드뷰 열기"
            >
              {prop.address}
            </button>
            {buildYearShort && (
              <span className="flex-shrink-0 text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                준{buildYearShort}
              </span>
            )}
          </div>

          {/* 3행: 건물메모 */}
          {prop.buildingMemo && (
            <div className="mt-1.5 text-[11px] text-blue-900 bg-blue-50 border border-blue-100 rounded px-2 py-1 line-clamp-1">
              <span className="font-bold mr-1">건물</span>
              {prop.buildingMemo}
            </div>
          )}

          {/* 4행: 사진버튼 + 가격 */}
          <div className="flex items-center justify-between gap-2 mt-2">
            <button
              type="button"
              onClick={openGallery}
              disabled={!hasPhoto}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-colors ${
                hasPhoto
                  ? "bg-foreground/90 text-background hover:bg-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              사진 {hasPhoto ? `(${ownImages.length})` : "없음"}
            </button>
            <div className="text-sm font-extrabold text-primary truncate">
              {priceText}
              {prop.manageFee && prop.manageFee !== "0" && prop.manageFee !== "-" && prop.manageFee !== "" && (
                <span className="ml-1 text-[10px] font-semibold text-muted-foreground">
                  관 {prop.manageFee}
                </span>
              )}
            </div>
          </div>

          {/* 5행: 부가시설 + 옵션 */}
          {(facilities.length > 0 || options.length > 0) && (
            <div className="flex items-center gap-1 flex-wrap mt-2">
              {facilities.map((f) => (
                <span key={f} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {f}
                </span>
              ))}
              {options.map((o) => (
                <span key={o} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                  {o}
                </span>
              ))}
            </div>
          )}

          {/* 펼침 인디케이터 */}
          <div className="flex items-center justify-center mt-2 pt-1 border-t border-border/50">
            {selected ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>

          {/* 아코디언: 상세 */}
          {selected && (
            <div className="mt-2 space-y-1.5 text-[11px]">
              {prop.roadAddress && (
                <div className="flex gap-1.5 items-start">
                  <span className="font-bold text-primary flex-shrink-0">도로명</span>
                  <span className="text-foreground break-all">{prop.roadAddress}</span>
                </div>
              )}
              {(prop.buildingPassword || prop.password) && (
                <div className="flex gap-1.5 items-center">
                  <KeyRound className="w-3 h-3 text-muted-foreground" />
                  <span className="font-bold">건물 비번</span>
                  <span className="text-foreground">{prop.buildingPassword ?? prop.password}</span>
                </div>
              )}
              {prop.roomPassword && (
                <div className="flex gap-1.5 items-center">
                  <KeyRound className="w-3 h-3 text-muted-foreground" />
                  <span className="font-bold">방 비번</span>
                  <span className="text-foreground">{prop.roomPassword}</span>
                </div>
              )}
              {prop.note && (
                <div className="flex gap-1.5 items-start">
                  <FileText className="w-3 h-3 text-muted-foreground mt-0.5" />
                  <span className="font-bold flex-shrink-0">매물메모</span>
                  <span className="text-foreground whitespace-pre-wrap">{prop.note}</span>
                </div>
              )}
              {prop.memo && prop.memo.length > 0 && prop.memo.length !== 36 && (
                <div className="flex gap-1.5 items-start">
                  <StickyNote className="w-3 h-3 text-muted-foreground mt-0.5" />
                  <span className="font-bold flex-shrink-0">메모</span>
                  <span className="text-foreground whitespace-pre-wrap">{prop.memo}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-muted-foreground">
                {prop.area && <div>면적: <span className="text-foreground font-semibold">{prop.area}</span></div>}
                {prop.floor && <div>층: <span className="text-foreground font-semibold">{prop.floor}{prop.totalFloors ? `/${prop.totalFloors}` : ""}</span></div>}
                {prop.availableFrom && <div>입주: <span className="text-foreground font-semibold">{prop.availableFrom}</span></div>}
                {prop.agentName && <div>등록: <span className="text-foreground font-semibold">{prop.agentName}</span></div>}
              </div>
            </div>
          )}
        </div>

        {/* 우하단 카카오 공유 버튼 */}
        <button
          type="button"
          onClick={handleShare}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-[#FEE500] flex items-center justify-center shadow-md hover:scale-105 transition-transform"
          title="카카오톡 공유"
        >
          <img src={kakaoTalkIcon} alt="카카오톡" className="w-5 h-5" />
        </button>
      </div>

      {/* 풀스크린 갤러리 */}
      {galleryOpen && hasPhoto && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center" onClick={() => setGalleryOpen(false)}>
          <button
            onClick={(e) => { e.stopPropagation(); setGalleryOpen(false); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 flex items-center justify-center z-10"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/90 text-sm font-bold bg-black/40 px-3 py-1 rounded-full">
            {imgIdx + 1} / {ownImages.length}
          </div>
          <div className="w-full h-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div
              className="flex h-full transition-transform duration-300"
              style={{ transform: `translateX(-${imgIdx * 100}vw)`, width: `${ownImages.length * 100}vw` }}
            >
              {ownImages.map((src, i) => (
                <div key={i} className="flex-shrink-0 h-full flex items-center justify-center px-4" style={{ width: "100vw" }}>
                  <img
                    src={src}
                    alt={`사진 ${i + 1}`}
                    className="max-w-full max-h-full object-contain select-none"
                    draggable={false}
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.onerror = null;
                      img.src = logoTransparent;
                    }}
                  />
                </div>
              ))}
            </div>
            {ownImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i - 1 + ownImages.length) % ownImages.length); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 flex items-center justify-center"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setImgIdx((i) => (i + 1) % ownImages.length); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 flex items-center justify-center"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default MobilePropertyCard;
