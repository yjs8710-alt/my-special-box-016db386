import { useEffect, useRef, useCallback, useState } from "react";
import { MapProperty } from "@/data/mapProperties";
import { loadKakaoMaps } from "@/lib/kakaoMapsLoader";
import { RadiusCircle, haversineMeters, formatRadius } from "@/lib/geoDistance";

const TYPE_COLORS: Record<string, string> = {
  "상가": "#1e40af",
  "사무실": "#6d28d9",
  "식당·카페": "#ea580c",
  "공장·창고": "#166534",
  "병원·학원": "#9f1239",
  "지식산업": "#0e7490",
  "아파트": "#1e40af",
  "원룸": "#0369a1",
  "빌라": "#0284c7",
  "오피스텔": "#7c3aed",
  "토지": "#166534",
  "투룸": "#0369a1",
  "쓰리룸+": "#0369a1",
  "투베이": "#0369a1",
};

const TYPE_ACCENT: Record<string, string> = {
  "상가": "#3b82f6",
  "사무실": "#a78bfa",
  "식당·카페": "#fb923c",
  "공장·창고": "#4ade80",
  "병원·학원": "#fb7185",
  "지식산업": "#22d3ee",
  "아파트": "#60a5fa",
  "원룸": "#38bdf8",
  "빌라": "#38bdf8",
  "오피스텔": "#a78bfa",
  "토지": "#4ade80",
  "투룸": "#38bdf8",
  "쓰리룸+": "#38bdf8",
  "투베이": "#38bdf8",
};

/** 줌 레벨 → 핀 크기(px) 매핑 */
function getPinSize(zoomLevel: number): number {
  if (zoomLevel <= 2) return 52;
  if (zoomLevel <= 3) return 46;
  if (zoomLevel <= 4) return 40;
  if (zoomLevel <= 5) return 34;
  if (zoomLevel <= 6) return 28;
  if (zoomLevel <= 7) return 22;
  if (zoomLevel <= 8) return 17;
  return 13;
}

/**
 * 개선된 집 모양 핀 — 원형 배경 + 집 아이콘
 * 가격 라벨 완전 제거
 */
function createPinHtml(property: MapProperty, isSelected: boolean, zoomLevel: number) {
  const color = TYPE_COLORS[property.type] ?? "#0369a1";
  const accent = TYPE_ACCENT[property.type] ?? "#3b82f6";
  const mainColor = isSelected ? accent : color;
  const size = getPinSize(zoomLevel);

  // 원형 배경 지름 = 핀 크기, 아이콘은 55%
  const circleDiam = size;
  const iconSize = Math.round(size * 0.58);

  const ringColor = isSelected ? "white" : "rgba(255,255,255,0.7)";
  const ringWidth = isSelected ? 2.5 : 1.5;
  const shadow = isSelected
    ? `drop-shadow(0 0 6px ${accent}cc) drop-shadow(0 3px 8px rgba(0,0,0,0.45))`
    : `drop-shadow(0 2px 5px rgba(0,0,0,0.38))`;
  const scale = isSelected ? 1.25 : 1;

  // 꼬리(말풍선 삼각형) 높이 = size * 0.22
  const tailH = Math.round(size * 0.22);
  const tailW = Math.round(size * 0.3);

  // 집 모양 SVG 아이콘 (지붕+몸체+창문+문)
  const houseIcon = `
    <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none"
      xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0;">
      <!-- 지붕 -->
      <path d="M2 11L12 2L22 11" fill="none" stroke="white" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"/>
      <!-- 몸체 -->
      <rect x="4" y="11" width="16" height="11" rx="1" fill="white" opacity="0.25"/>
      <!-- 몸체 테두리 -->
      <rect x="4" y="11" width="16" height="11" rx="1" fill="none" stroke="white"
        stroke-width="1.6" stroke-linejoin="round"/>
      <!-- 문 -->
      <rect x="10" y="16" width="4" height="6" rx="0.5" fill="white" opacity="0.75"/>
      <!-- 창문 좌 -->
      <rect x="5.5" y="13" width="3.5" height="3" rx="0.5" fill="white" opacity="0.6"/>
      <!-- 창문 우 -->
      <rect x="15" y="13" width="3.5" height="3" rx="0.5" fill="white" opacity="0.6"/>
    </svg>
  `;

  return `
    <div style="
      display:flex;
      flex-direction:column;
      align-items:center;
      gap:0;
      transform:scale(${scale});
      transform-origin:bottom center;
      cursor:pointer;
      filter:${shadow};
    ">
      <!-- 원형 배경 -->
      <div style="
        width:${circleDiam}px;
        height:${circleDiam}px;
        border-radius:50%;
        background:${mainColor};
        border:${ringWidth}px solid ${ringColor};
        display:flex;
        align-items:center;
        justify-content:center;
        flex-shrink:0;
      ">
        ${houseIcon}
      </div>
      <!-- 말풍선 꼬리 삼각형 -->
      <div style="
        width:0;
        height:0;
        border-left:${Math.round(tailW/2)}px solid transparent;
        border-right:${Math.round(tailW/2)}px solid transparent;
        border-top:${tailH}px solid ${mainColor};
        margin-top:-1px;
        flex-shrink:0;
      "></div>
    </div>
  `;
}

export interface MapBounds {
  swLat: number; swLng: number; neLat: number; neLng: number;
}

interface MapViewProps {
  properties: MapProperty[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  /** 지도 이동/줌 시 현재 화면 범위 콜백 */
  onBoundsChange?: (bounds: MapBounds) => void;
  /** true이면 selectedId 변경 시 panTo 억제 */
  suppressPan?: boolean;
  /** 반경검색 모드 활성화 — true면 지도 클릭/드래그로 원 그리기 */
  radiusMode?: boolean;
  /** 반경검색 결과 콜백 (null = 해제) */
  radiusCircle?: RadiusCircle | null;
  onRadiusChange?: (c: RadiusCircle | null) => void;
}

const MapView = ({ properties, selectedId, onSelect, onBoundsChange, suppressPan, radiusMode, radiusCircle, onRadiusChange }: MapViewProps) => {
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<Map<number, any>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const zoomLevelRef = useRef<number>(5);
  const [mapError, setMapError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const retryTimeoutRef = useRef<number | null>(null);
  const autoRetryCountRef = useRef(0);

  // 반경검색 관련 ref
  const circleOverlayRef = useRef<any>(null);
  const radiusLabelRef = useRef<any>(null);
  const draggingRef = useRef(false);
  const dragCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const radiusModeRef = useRef<boolean>(!!radiusMode);
  useEffect(() => { radiusModeRef.current = !!radiusMode; }, [radiusMode]);

  // 최신 props를 ref로 유지 (zoom 이벤트 핸들러에서 사용)
  const propsRef = useRef({ properties, selectedId, onSelect, onBoundsChange, onRadiusChange });
  useEffect(() => {
    propsRef.current = { properties, selectedId, onSelect, onBoundsChange, onRadiusChange };
  });

  const waitForContainerReady = useCallback(async () => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      if (!mountedRef.current || !containerRef.current) return false;
      if (containerRef.current.clientWidth > 0 && containerRef.current.clientHeight > 0) {
        return true;
      }
      await new Promise((resolve) => window.setTimeout(resolve, 150));
    }
    return Boolean(containerRef.current?.clientWidth && containerRef.current?.clientHeight);
  }, []);

  const fireBounds = useCallback((map: any) => {
    try {
      const b = map.getBounds();
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      propsRef.current.onBoundsChange?.({
        swLat: sw.getLat(), swLng: sw.getLng(),
        neLat: ne.getLat(), neLng: ne.getLng(),
      });
    } catch (_) {}
  }, []);

  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach((o) => {
      try { o.setMap(null); } catch (_) {}
    });
    overlaysRef.current.clear();
  }, []);

  const resetMapInstance = useCallback(() => {
    clearOverlays();
    mapRef.current = null;
  }, [clearOverlays]);

  const renderOverlays = useCallback(
    (map: any, props: MapProperty[], selId: number | null, onSelectFn: (id: number) => void, zoom: number) => {
      clearOverlays();
      props.forEach((prop) => {
        if (!prop.lat || !prop.lng) return;
        const isSelected = prop.id === selId;

        const content = document.createElement("div");
        content.innerHTML = createPinHtml(prop, isSelected, zoom);
        content.style.cssText = "cursor:pointer;";
        content.addEventListener("click", () => onSelectFn(prop.id));

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(prop.lat, prop.lng),
          content,
          map,
          yAnchor: 1,
          zIndex: isSelected ? 1000 : 0,
        });

        overlaysRef.current.set(prop.id, overlay);
      });
    },
    [clearOverlays]
  );

  // 지도 초기화 + zoom_changed / drag_end 이벤트 등록
  useEffect(() => {
    mountedRef.current = true;

    let cancelled = false;
    setMapError(false);

    (async () => {
      try {
        await loadKakaoMaps({ retries: 4, timeoutMs: 10000 });
        if (cancelled || !mountedRef.current || !containerRef.current || mapRef.current) return;

        const containerReady = await waitForContainerReady();
        if (!containerReady) throw new Error("map_container_not_ready");
        if (cancelled || !mountedRef.current || !containerRef.current || mapRef.current) return;

        const map = new window.kakao.maps.Map(containerRef.current, {
          center: new window.kakao.maps.LatLng(36.6285, 127.4568),
          level: 5,
        });

        mapRef.current = map;
        zoomLevelRef.current = map.getLevel();
        autoRetryCountRef.current = 0;
        renderOverlays(map, propsRef.current.properties, propsRef.current.selectedId, propsRef.current.onSelect, zoomLevelRef.current);

        setTimeout(() => {
          if (!cancelled) {
            try { map.relayout(); } catch (_) {}
            fireBounds(map);
          }
        }, 300);

        setTimeout(() => {
          if (!cancelled) {
            try { map.relayout(); } catch (_) {}
          }
        }, 900);

        window.kakao.maps.event.addListener(map, "zoom_changed", () => {
          if (!mountedRef.current) return;
          const newZoom = map.getLevel();
          zoomLevelRef.current = newZoom;
          renderOverlays(map, propsRef.current.properties, propsRef.current.selectedId, propsRef.current.onSelect, newZoom);
          fireBounds(map);
        });

        window.kakao.maps.event.addListener(map, "dragend", () => {
          if (!mountedRef.current) return;
          fireBounds(map);
        });
      } catch (_) {
        if (!cancelled) {
          setMapError(true);
          resetMapInstance();

          if (autoRetryCountRef.current < 2) {
            autoRetryCountRef.current += 1;
            if (retryTimeoutRef.current) window.clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = window.setTimeout(() => {
              setRetryKey((prev) => prev + 1);
            }, autoRetryCountRef.current * 1200);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      resetMapInstance();
    };
  }, [fireBounds, renderOverlays, resetMapInstance, retryKey, waitForContainerReady]);

  // 핀 업데이트 (properties/selectedId 변경 시)
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    renderOverlays(mapRef.current, properties, selectedId, onSelect, zoomLevelRef.current);
  }, [properties, selectedId, onSelect, renderOverlays]);

  // 선택된 매물로 이동 (suppressPan=true 이면 이동 안 함)
  useEffect(() => {
    if (!mapRef.current || selectedId === null || !window.kakao?.maps) return;
    if (suppressPan) return;
    const prop = properties.find((p) => p.id === selectedId);
    if (prop && prop.lat && prop.lng) {
      mapRef.current.panTo(new window.kakao.maps.LatLng(prop.lat, prop.lng));
    }
  }, [selectedId, properties, suppressPan]);

  // 컨테이너 크기 변경 시 지도 relayout 호출
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (mapRef.current && window.kakao?.maps) {
        mapRef.current.relayout();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const recoverMapLayout = () => {
      if (mapRef.current && window.kakao?.maps) {
        try {
          mapRef.current.relayout();
          fireBounds(mapRef.current);
        } catch (_) {
          resetMapInstance();
          setMapError(true);
          setRetryKey((prev) => prev + 1);
        }
        return;
      }

      if (!mapError) return;
      setRetryKey((prev) => prev + 1);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") recoverMapLayout();
    };

    window.addEventListener("pageshow", recoverMapLayout);
    window.addEventListener("online", recoverMapLayout);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("pageshow", recoverMapLayout);
      window.removeEventListener("online", recoverMapLayout);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [fireBounds, mapError, resetMapInstance]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {mapError && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-toolbar-bg/95 px-6 text-center">
          <strong className="text-sm font-extrabold text-foreground">지도를 불러오지 못했습니다.</strong>
          <span className="text-xs font-medium text-muted-foreground">네트워크 상태를 확인한 뒤 다시 시도해주세요.</span>
          <button
            type="button"
            onClick={() => setRetryKey((prev) => prev + 1)}
            className="rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            다시 불러오기
          </button>
        </div>
      )}
    </div>
  );
};

export default MapView;
