import { useEffect, useRef, useCallback, useState } from "react";
import { MapProperty } from "@/data/mapProperties";
import { loadKakaoMaps } from "@/lib/kakaoMapsLoader";
import { RadiusCircle, haversineMeters, formatRadius } from "@/lib/geoDistance";
import mapPinAsset from "@/assets/map-pin.png.asset.json";

const MAP_PIN_URL = mapPinAsset.url;

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
  if (zoomLevel <= 2) return 100;
  if (zoomLevel <= 3) return 90;
  if (zoomLevel <= 4) return 80;
  if (zoomLevel <= 5) return 72;
  if (zoomLevel <= 6) return 64;
  if (zoomLevel <= 7) return 58;
  if (zoomLevel <= 8) return 52;
  return 46;
}

/** 첨부 이미지 핀(원형) + 가운데 숫자 */
function createPinImageHtml(count: number, size: number, isSelected = false) {
  const scale = isSelected ? 1.2 : 1;
  const digits = String(count).length;
  // 자릿수 비례 폰트 크기 — 항상 원 안에 들어가도록
  const ratio = digits >= 4 ? 0.28 : digits === 3 ? 0.34 : digits === 2 ? 0.42 : 0.48;
  const fontSize = Math.max(11, Math.round(size * ratio));
  return `
    <div style="
      position:relative;
      width:${size}px;height:${size}px;
      transform:scale(${scale}) translateZ(0);
      transform-origin:center center;
      cursor:pointer;will-change:transform;
      filter:${isSelected ? "drop-shadow(0 4px 6px rgba(0,0,0,0.45))" : "drop-shadow(0 2px 3px rgba(0,0,0,0.35))"};
    ">
      <img src="${MAP_PIN_URL}" alt="" draggable="false"
        style="width:100%;height:100%;display:block;pointer-events:none;-webkit-user-drag:none;" />
      <div style="
        position:absolute;inset:0;
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-weight:800;
        font-size:${fontSize}px;line-height:1;
        text-shadow:0 1px 2px rgba(0,0,0,0.55);
        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
        pointer-events:none;
        transform:translateY(-0.12em);
      ">${count}</div>
      ${isSelected ? `
      <div style="
        position:absolute;
        top:-4px;right:-4px;
        width:${Math.round(size * 0.4)}px;height:${Math.round(size * 0.4)}px;
        background:#22c55e;
        border:2px solid #fff;
        border-radius:9999px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 4px rgba(0,0,0,0.4);
        pointer-events:none;
        z-index:2;
      ">
        <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>` : ''}
    </div>
  `;
}

function createPinHtml(property: MapProperty, isSelected: boolean, zoomLevel: number) {
  return createPinImageHtml(1, getPinSize(zoomLevel), isSelected);
}

/** 클러스터: 같은 원형 핀에 숫자만 크게 */
function createClusterHtml(count: number, zoomLevel: number, isSelected = false) {
  const base = getPinSize(zoomLevel);
  const size = count >= 100 ? Math.round(base * 1.35) : count >= 10 ? Math.round(base * 1.2) : Math.round(base * 1.05);
  return createPinImageHtml(count, size, isSelected);
}

interface Cluster {
  key: string;
  lat: number;
  lng: number;
  items: MapProperty[];
}

/** 줌 레벨 기반 격자 클러스터링. 선택된 핀과 줌 인 상태에서는 클러스터링 안 함. */
function buildClusters(props: MapProperty[], zoom: number, _selSet: Set<number>): { clusters: Cluster[]; singles: MapProperty[] } {
  const singles: MapProperty[] = [];
  const valid = props.filter(p => p.lat && p.lng);
  // 줌 인 상태(레벨 ≤ 3)에서는 격자 클러스터링 없이 개별 표시
  // 단, 정확히 같은 좌표를 가진 매물들은 항상 클러스터로 묶어서 개수 표시
  if (zoom <= 3) {
    const exactBuckets = new Map<string, MapProperty[]>();
    valid.forEach(p => {
      const key = `${p.lat.toFixed(7)}|${p.lng.toFixed(7)}`;
      const arr = exactBuckets.get(key);
      if (arr) arr.push(p); else exactBuckets.set(key, [p]);
    });
    const clusters: Cluster[] = [];
    exactBuckets.forEach((items, key) => {
      if (items.length === 1) {
        singles.push(items[0]);
      } else {
        clusters.push({ key, lat: items[0].lat, lng: items[0].lng, items });
      }
    });
    return { clusters, singles };
  }
  const cellDeg = 0.00012 * Math.pow(2, zoom - 1);
  const buckets = new Map<string, MapProperty[]>();
  valid.forEach(p => {
    // 선택 여부와 무관하게 같은 위치 매물은 항상 클러스터로 묶어서 정확한 개수 표시
    const key = `${Math.floor(p.lat / cellDeg)}|${Math.floor(p.lng / cellDeg)}`;
    const arr = buckets.get(key);
    if (arr) arr.push(p); else buckets.set(key, [p]);
  });
  const clusters: Cluster[] = [];
  buckets.forEach((items, key) => {
    let sLat = 0, sLng = 0;
    items.forEach(p => { sLat += p.lat; sLng += p.lng; });
    clusters.push({ key, lat: sLat / items.length, lng: sLng / items.length, items });
  });
  return { clusters, singles };
}

export interface MapBounds {
  swLat: number; swLng: number; neLat: number; neLng: number;
}

interface MapViewProps {
  properties: MapProperty[];
  selectedId: number | null;
  /** 다중 선택 유지 — 포함된 모든 핀을 강조 표시 */
  selectedIds?: number[];
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
  /** 줌/드래그 시작 시 핀 선택 해제용 콜백 */
  onMapMoveClear?: () => void;
  /** 숫자 클러스터 클릭 시 포함된 매물 id 목록 */
  onClusterSelect?: (ids: number[]) => void;
}

const MapView = ({ properties, selectedId, selectedIds, onSelect, onBoundsChange, suppressPan, radiusMode, radiusCircle, onRadiusChange, onMapMoveClear, onClusterSelect }: MapViewProps) => {
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<Map<string, any>>(new Map());
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
  const propsRef = useRef({ properties, selectedId, selectedIds, onSelect, onBoundsChange, onRadiusChange, onMapMoveClear, onClusterSelect });
  useEffect(() => {
    propsRef.current = { properties, selectedId, selectedIds, onSelect, onBoundsChange, onRadiusChange, onMapMoveClear, onClusterSelect };
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

  const boundsTimerRef = useRef<number | null>(null);
  const fireBounds = useCallback((map: any) => {
    if (boundsTimerRef.current) window.clearTimeout(boundsTimerRef.current);
    boundsTimerRef.current = window.setTimeout(() => {
      try {
        const b = map.getBounds();
        const sw = b.getSouthWest();
        const ne = b.getNorthEast();
        propsRef.current.onBoundsChange?.({
          swLat: sw.getLat(), swLng: sw.getLng(),
          neLat: ne.getLat(), neLng: ne.getLng(),
        });
      } catch (_) {}
    }, 120);
  }, []);

  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach((o) => {
      try { o.setMap(null); } catch (_) {}
    });
    overlaysRef.current.clear();
  }, []);

  const clearRadiusCircle = useCallback(() => {
    if (circleOverlayRef.current) {
      try { circleOverlayRef.current.setMap(null); } catch (_) {}
      circleOverlayRef.current = null;
    }
    if (radiusLabelRef.current) {
      try { radiusLabelRef.current.setMap(null); } catch (_) {}
      radiusLabelRef.current = null;
    }
  }, []);

  const drawCircle = useCallback((center: { lat: number; lng: number }, radius: number) => {
    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;
    const pos = new window.kakao.maps.LatLng(center.lat, center.lng);

    if (!circleOverlayRef.current) {
      circleOverlayRef.current = new window.kakao.maps.Circle({
        center: pos,
        radius: Math.max(radius, 1),
        strokeWeight: 2,
        strokeColor: "#1e40af",
        strokeOpacity: 0.9,
        strokeStyle: "solid",
        fillColor: "#3b82f6",
        fillOpacity: 0.18,
      });
      circleOverlayRef.current.setMap(map);
    } else {
      circleOverlayRef.current.setPosition(pos);
      circleOverlayRef.current.setRadius(Math.max(radius, 1));
    }

    // 반경 라벨
    const labelHtml = `
      <div style="
        background:#1e40af;color:#fff;font-size:11px;font-weight:700;
        padding:3px 8px;border-radius:999px;white-space:nowrap;
        box-shadow:0 2px 6px rgba(0,0,0,0.25);transform:translate(-50%,-50%);
      ">반경 ${formatRadius(radius)}</div>
    `;
    const labelDiv = document.createElement("div");
    labelDiv.innerHTML = labelHtml;
    if (!radiusLabelRef.current) {
      radiusLabelRef.current = new window.kakao.maps.CustomOverlay({
        position: pos,
        content: labelDiv,
        map,
        zIndex: 2000,
      });
    } else {
      radiusLabelRef.current.setPosition(pos);
      radiusLabelRef.current.setContent(labelDiv);
    }
  }, []);

  const resetMapInstance = useCallback(() => {
    clearOverlays();
    clearRadiusCircle();
    mapRef.current = null;
  }, [clearOverlays, clearRadiusCircle]);

  const renderOverlays = useCallback(
    (map: any, props: MapProperty[], selId: number | null, onSelectFn: (id: number) => void, zoom: number) => {
      const existing = overlaysRef.current;
      const nextKeys = new Set<string>();
      const selSet = new Set<number>();
      (propsRef.current.selectedIds ?? []).forEach((id) => selSet.add(id));
      if (selId !== null && selId !== undefined) {
        selSet.add(selId);
      }

      const { clusters, singles } = buildClusters(props, zoom, selSet);

      const handleClusterClick = (cluster: Cluster) => {
        const ids = cluster.items.map((item) => item.id);
        if (propsRef.current.onClusterSelect && ids.length > 1) {
          propsRef.current.onClusterSelect(ids);
          return;
        }
        if (ids.length === 1) {
          propsRef.current.onSelect(ids[0]);
          return;
        }

        try {
          const m = mapRef.current;
          if (!m) return;
          const curLevel = m.getLevel();
          const nextLevel = Math.max(1, curLevel - 2);
          m.setLevel(nextLevel, { anchor: new window.kakao.maps.LatLng(cluster.lat, cluster.lng) });
        } catch (_) {}
      };

      const bindClusterClick = (content: HTMLDivElement, cluster: Cluster) => {
        content.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          handleClusterClick(cluster);
        };
      };

      // 개별 핀 렌더
      singles.forEach((prop) => {
        const key = `p:${prop.id}`;
        nextKeys.add(key);
        const isSelected = selSet.has(prop.id);
        const prev = existing.get(key);

        if (prev) {
          try {
            const curPos = prev.getPosition?.();
            if (curPos?.getLat?.() !== prop.lat || curPos?.getLng?.() !== prop.lng) {
              prev.setPosition(new window.kakao.maps.LatLng(prop.lat, prop.lng));
            }
          } catch (_) {}
          const content = prev.getContent() as HTMLDivElement;
          if (content && content.dataset) {
            const sig = `pin|${isSelected ? 1 : 0}|${zoom}|${prop.type}`;
            if (content.dataset.sig !== sig) {
              content.innerHTML = createPinHtml(prop, isSelected, zoom);
              content.dataset.sig = sig;
            }
          }
          try { prev.setZIndex(isSelected ? 1000 : 0); } catch (_) {}
          return;
        }

        const content = document.createElement("div");
        content.innerHTML = createPinHtml(prop, isSelected, zoom);
        content.style.cssText = "cursor:pointer;";
        content.dataset.sig = `pin|${isSelected ? 1 : 0}|${zoom}|${prop.type}`;
        content.addEventListener("click", () => propsRef.current.onSelect(prop.id));

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(prop.lat, prop.lng),
          content,
          map,
          yAnchor: 0.5,
          zIndex: isSelected ? 1000 : 0,
        });
        existing.set(key, overlay);
      });

      // 클러스터 렌더 (숫자 원형)
      clusters.forEach((c) => {
        const key = `c:${c.key}`;
        nextKeys.add(key);
        const count = c.items.length;
        const prev = existing.get(key);
        // 단일 항목 클러스터는 정확한 매물 좌표로 표시 (centroid 편차 제거)
        const posLat = count === 1 ? c.items[0].lat : c.lat;
        const posLng = count === 1 ? c.items[0].lng : c.lng;

        if (prev) {
          try {
            const curPos = prev.getPosition?.();
            if (curPos?.getLat?.() !== posLat || curPos?.getLng?.() !== posLng) {
              prev.setPosition(new window.kakao.maps.LatLng(posLat, posLng));
            }
          } catch (_) {}
          const content = prev.getContent() as HTMLDivElement;
          if (content && content.dataset) {
            const sig = `cluster|${count}|${zoom}`;
            if (content.dataset.sig !== sig) {
              content.innerHTML = createClusterHtml(count, zoom);
              content.dataset.sig = sig;
            }
            bindClusterClick(content, c);
          }
          return;
        }

        const content = document.createElement("div");
        content.innerHTML = createClusterHtml(count, zoom);
        content.style.cssText = "cursor:pointer;";
        content.dataset.sig = `cluster|${count}|${zoom}`;
        bindClusterClick(content, c);

        const overlay = new window.kakao.maps.CustomOverlay({
          position: new window.kakao.maps.LatLng(posLat, posLng),
          content,
          map,
          yAnchor: 0.5,
          xAnchor: 0.5,
          zIndex: 500,
        });
        existing.set(key, overlay);
      });

      // 사라진 오버레이 제거
      existing.forEach((overlay, key) => {
        if (!nextKeys.has(key)) {
          try { overlay.setMap(null); } catch (_) {}
          existing.delete(key);
        }
      });
    },
    []
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

        let zoomRenderTimer: number | null = null;
        window.kakao.maps.event.addListener(map, "zoom_changed", () => {
          if (!mountedRef.current) return;
          const newZoom = map.getLevel();
          zoomLevelRef.current = newZoom;
          // 줌 시 핀 선택 해제
          propsRef.current.onMapMoveClear?.();
          // 줌 중 연속 재렌더 방지 — 마지막 줌 레벨에서만 재렌더
          if (zoomRenderTimer) window.clearTimeout(zoomRenderTimer);
          zoomRenderTimer = window.setTimeout(() => {
            if (!mountedRef.current) return;
            renderOverlays(map, propsRef.current.properties, propsRef.current.selectedId, propsRef.current.onSelect, zoomLevelRef.current);
          }, 80);
          fireBounds(map);
        });

        window.kakao.maps.event.addListener(map, "dragstart", () => {
          if (!mountedRef.current) return;
          if (radiusModeRef.current) return;
          // 드래그 시작 시 핀 선택 해제
          propsRef.current.onMapMoveClear?.();
        });

        window.kakao.maps.event.addListener(map, "dragend", () => {
          if (!mountedRef.current) return;
          fireBounds(map);
        });

        // 반경검색 — 마우스 down → 중심 설정, move → 반경 확장, up → 확정
        window.kakao.maps.event.addListener(map, "mousedown", (mouseEvent: any) => {
          if (!radiusModeRef.current) return;
          const latlng = mouseEvent.latLng;
          dragCenterRef.current = { lat: latlng.getLat(), lng: latlng.getLng() };
          draggingRef.current = true;
          // 지도 드래그 비활성 (원 그리기 우선)
          try { map.setDraggable(false); } catch (_) {}
          drawCircle(dragCenterRef.current, 0);
        });

        window.kakao.maps.event.addListener(map, "mousemove", (mouseEvent: any) => {
          if (!radiusModeRef.current || !draggingRef.current || !dragCenterRef.current) return;
          const latlng = mouseEvent.latLng;
          const r = haversineMeters(
            dragCenterRef.current.lat, dragCenterRef.current.lng,
            latlng.getLat(), latlng.getLng()
          );
          drawCircle(dragCenterRef.current, r);
        });

        const finishDrag = (mouseEvent?: any) => {
          if (!radiusModeRef.current || !draggingRef.current || !dragCenterRef.current) return;
          draggingRef.current = false;
          try { map.setDraggable(true); } catch (_) {}
          let r = 0;
          if (mouseEvent?.latLng) {
            r = haversineMeters(
              dragCenterRef.current.lat, dragCenterRef.current.lng,
              mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng()
            );
          }
          // 클릭만 한 경우(반경=0) 기본 500m
          if (r < 30) r = 500;
          const center = dragCenterRef.current;
          drawCircle(center, r);
          propsRef.current.onRadiusChange?.({ lat: center.lat, lng: center.lng, radius: r });
        };
        window.kakao.maps.event.addListener(map, "mouseup", finishDrag);
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
  }, [properties, selectedId, selectedIds, onSelect, renderOverlays]);

  // 외부에서 radiusCircle 변경(해제 등) 동기화
  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) return;
    if (radiusCircle) {
      drawCircle({ lat: radiusCircle.lat, lng: radiusCircle.lng }, radiusCircle.radius);
    } else {
      clearRadiusCircle();
    }
  }, [radiusCircle, drawCircle, clearRadiusCircle]);

  // 반경검색 모드 진입/해제 시 커서 변경
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.cursor = radiusMode ? "crosshair" : "";
    }
  }, [radiusMode]);

  // 선택된 매물로 이동 (suppressPan=true 이면 이동 안 함)
  // suppressPan은 ref 패턴으로 읽어서, false로 바뀌었을 때 effect 재실행으로 panTo가 호출되는 것을 방지
  const suppressPanRef = useRef(suppressPan);
  useEffect(() => { suppressPanRef.current = suppressPan; }, [suppressPan]);
  useEffect(() => {
    if (!mapRef.current || selectedId === null || !window.kakao?.maps) return;
    if (suppressPanRef.current) return;
    const prop = properties.find((p) => p.id === selectedId);
    if (prop && prop.lat && prop.lng) {
      mapRef.current.panTo(new window.kakao.maps.LatLng(prop.lat, prop.lng));
    }
  }, [selectedId, properties]);

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
