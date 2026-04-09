import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapProperty } from "@/data/mapProperties";

declare global {
  interface Window {
    kakao: any;
    __kakaoMapReady?: boolean;
    __kakaoMapCallbacks?: Array<() => void>;
  }
}

const KAKAO_JS_KEY = "9b1ab990830e8319b8bafb3104e5ae50";
const ROADVIEW_SEARCH_RADII = [30, 50, 100, 200, 400, 800, 1500];

type RoadviewStatus = "idle" | "loading" | "ready" | "unavailable" | "error";

function loadKakaoScript(cb: () => void) {
  if (window.kakao && window.kakao.maps) {
    cb();
    return;
  }

  if (!window.__kakaoMapCallbacks) window.__kakaoMapCallbacks = [];
  window.__kakaoMapCallbacks.push(cb);

  if (document.getElementById("kakao-maps-script")) return;

  const script = document.createElement("script");
  script.id = "kakao-maps-script";
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false`;
  script.async = true;
  script.onload = () => {
    window.kakao.maps.load(() => {
      window.__kakaoMapReady = true;
      window.__kakaoMapCallbacks?.forEach((fn) => fn());
      window.__kakaoMapCallbacks = [];
    });
  };
  document.head.appendChild(script);
}

interface RoadviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Pick<MapProperty, "title" | "buildingName" | "address" | "lat" | "lng"> | null;
}

const RoadviewModal = ({ open, onOpenChange, property }: RoadviewModalProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<RoadviewStatus>("idle");
  const [searchRadius, setSearchRadius] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !property) {
      setStatus("idle");
      setSearchRadius(null);
      return;
    }

    if (!property.lat || !property.lng) {
      setStatus("unavailable");
      setSearchRadius(null);
      return;
    }

    let cancelled = false;
    setStatus("loading");
    setSearchRadius(null);

    loadKakaoScript(() => {
      if (cancelled || !containerRef.current || !window.kakao?.maps) return;

      try {
        const position = new window.kakao.maps.LatLng(property.lat, property.lng);
        const roadview = new window.kakao.maps.Roadview(containerRef.current);
        const roadviewClient = new window.kakao.maps.RoadviewClient();

        const searchNearestRoadview = (radiusIndex = 0) => {
          const radius = ROADVIEW_SEARCH_RADII[radiusIndex];
          setSearchRadius(radius);

          roadviewClient.getNearestPanoId(position, radius, (panoId: number | null) => {
            if (cancelled) return;

            if (typeof panoId === "number" && panoId > 0) {
              roadview.setPanoId(panoId, position);
              requestAnimationFrame(() => {
                try {
                  roadview.relayout?.();
                } catch (_) {
                  return;
                }
              });
              setStatus("ready");
              return;
            }

            if (radiusIndex < ROADVIEW_SEARCH_RADII.length - 1) {
              searchNearestRoadview(radiusIndex + 1);
              return;
            }

            setStatus("unavailable");
          });
        };

        requestAnimationFrame(() => {
          searchNearestRoadview();
        });
      } catch (_) {
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [open, property]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,1100px)] max-w-5xl overflow-hidden border-border bg-background p-0">
        <DialogHeader className="border-b border-border px-5 py-4 pr-12 text-left">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-foreground">
            <MapPin className="h-4 w-4 text-primary" />
            {property?.buildingName ?? property?.title ?? "로드뷰"}
          </DialogTitle>
          <DialogDescription className="truncate text-sm text-muted-foreground">
            {property?.address ?? "주소 정보가 없습니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[70vh] min-h-[420px] w-full bg-muted/40">
          <div ref={containerRef} className="h-full w-full" />

          {status !== "ready" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/92 px-6 text-center">
              {status === "loading" && (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">가장 가까운 로드뷰를 찾는 중입니다.</p>
                    <p className="text-xs text-muted-foreground">
                      {searchRadius ? `${searchRadius}m 반경까지 탐색 중` : "주변 도로를 탐색 중"}
                    </p>
                  </div>
                </>
              )}

              {status === "unavailable" && (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">주변에서 로드뷰 지점을 찾지 못했습니다.</p>
                  <p className="text-xs text-muted-foreground">좌표 기준 가장 가까운 도로까지 자동으로 탐색했지만 표시 가능한 로드뷰가 없습니다.</p>
                </div>
              )}

              {status === "error" && (
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">로드뷰를 불러오지 못했습니다.</p>
                  <p className="text-xs text-muted-foreground">잠시 후 다시 시도해주세요.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoadviewModal;
