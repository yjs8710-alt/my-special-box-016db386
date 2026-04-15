import { MapProperty } from "@/data/mapProperties";

declare global {
  interface Window {
    Kakao: any;
  }
}

/** 퍼블리시 도메인 (카카오 공유 링크용) */
const SITE_ORIGIN = "https://jibda.co.kr";

export interface AgencyInfo {
  agencyName?: string;
  name?: string;
  phone?: string;
  agencyPhone?: string;
}

/**
 * 카카오톡으로 매물 카드를 공유합니다.
 * 전화번호, 상세 주소는 제외하고 건물명·유형·가격 등만 노출합니다.
 * agencyInfo가 전달되면 공유한 중개사무소 정보를 표시합니다.
 */
export function sharePropertyToKakao(property: MapProperty, agencyInfo?: AgencyInfo, fallbackImageUrl?: string) {
  if (!window.Kakao?.Share) {
    alert("카카오톡 공유 기능을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  // 주소에서 동 단위까지만 표시 (상세 번지 제거)
  const safeAddress = sanitizeAddress(property.address);

  const descParts = [
    property.type,
    property.area ? `면적 ${property.area}` : "",
    property.floor ? `${property.floor}` : "",
    `보증금 ${property.deposit} / 월세 ${property.monthly}`,
  ].filter(Boolean);

  // 중개사무소 정보 추가
  if (agencyInfo?.agencyName) {
    const phones = [
      agencyInfo.agencyPhone ? `대표 ${agencyInfo.agencyPhone}` : "",
      agencyInfo.phone ? `HP ${agencyInfo.phone}` : "",
    ].filter(Boolean).join(" / ");
    descParts.push(`📞 ${agencyInfo.agencyName}${phones ? ` ${phones}` : ""}`);
  }

  const description = descParts.join(" · ");

  const imageUrl =
    property.images?.[0] || property.image || "";

  const shareData: any = {
    objectType: "feed",
    content: {
      title: property.buildingName || property.title || "매물 정보",
      description,
      imageUrl: imageUrl || "https://my-special-box.lovable.app/placeholder.svg",
      link: {
        mobileWebUrl: `${SITE_ORIGIN}/property/${property.dbId || property.id}`,
        webUrl: `${SITE_ORIGIN}/property/${property.dbId || property.id}`,
      },
    },
    buttons: [
      {
        title: "매물 보기",
        link: {
          mobileWebUrl: `${SITE_ORIGIN}/property/${property.dbId || property.id}`,
          webUrl: `${SITE_ORIGIN}/property/${property.dbId || property.id}`,
        },
      },
    ],
  };

  // 주소 정보는 동 단위까지만
  if (safeAddress) {
    shareData.content.description = `${safeAddress}\n${description}`;
  }

  window.Kakao.Share.sendDefault(shareData);
}

/** 주소에서 동/리 까지만 남기고 번지 이하 제거 */
function sanitizeAddress(address: string): string {
  if (!address) return "";
  // "충청북도 청주시 흥덕구 개신동 41-5" → "청주시 흥덕구 개신동"
  // "세종특별자치시 한솔동 1234" → "세종특별자치시 한솔동"
  const match = address.match(
    /(?:.*?(?:시|군)\s+)?(?:.*?(?:구|군)\s+)?[\uAC00-\uD7A3]+(?:동|리|읍|면)/
  );
  return match ? match[0] : address.split(" ").slice(0, -1).join(" ") || address;
}

/**
 * 선택된 매물 여러 개를 카카오톡으로 공유합니다.
 */
export function shareMultipleToKakao(properties: MapProperty[]) {
  if (properties.length === 0) return;
  if (properties.length === 1) {
    sharePropertyToKakao(properties[0]);
    return;
  }

  if (!window.Kakao?.Share) {
    alert("카카오톡 공유 기능을 불러오지 못했습니다.");
    return;
  }

  const text = properties
    .slice(0, 5)
    .map((p, i) => {
      const addr = sanitizeAddress(p.address);
      return `${i + 1}. ${p.buildingName || p.title} (${p.deposit}/${p.monthly})${addr ? ` - ${addr}` : ""}`;
    })
    .join("\n");

  window.Kakao.Share.sendDefault({
    objectType: "text",
    text: `[집다] 매물 ${properties.length}건\n\n${text}${properties.length > 5 ? `\n... 외 ${properties.length - 5}건` : ""}`,
    link: {
      mobileWebUrl: SITE_ORIGIN,
      webUrl: SITE_ORIGIN,
    },
  });
}
