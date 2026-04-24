import { ReactNode, useEffect, useState } from "react";
import { ChevronUp, ChevronDown, X } from "lucide-react";

interface MobileMapSheetProps {
  /** 매물 개수 (peek 바에 표시) */
  count: number;
  /** 시트를 표시해야 할 트리거가 있는지 (선택된 매물 / 검색어 / 필터 등) */
  hasInteraction: boolean;
  /** 선택된 매물 id가 있으면 자동으로 한 단계 펼침 */
  shouldAutoExpand: boolean;
  onClose?: () => void;
  children: ReactNode;
}

// 0: 닫힘(헤더만, ~64px), 1: 1/4, 2: 2/4, 3: 3/4, 4: 4/4
type Step = 0 | 1 | 2 | 3 | 4;

const STEP_HEIGHTS: Record<Step, string> = {
  0: "64px",
  1: "25vh",
  2: "50vh",
  3: "75vh",
  4: "100vh",
};

/**
 * 모바일 전용 하단 시트.
 * - 사용자가 지도 핀 클릭 / 검색 / 필터를 적용하기 전에는 표시되지 않음.
 * - 트리거 발생 시 하단에 "매물정보" 바가 올라옴.
 * - 바를 한 번 탭하면 1/4, 두 번 2/4, 세 번 3/4, 네 번 4/4(전체)로 단계적 확장.
 * - 화살표 아이콘을 ▼ 방향으로 누르면 한 단계씩 축소.
 */
const MobileMapSheet = ({
  count,
  hasInteraction,
  shouldAutoExpand,
  onClose,
  children,
}: MobileMapSheetProps) => {
  const [step, setStep] = useState<Step>(0);

  // 매물 선택 시 최소 1단계 펼침
  useEffect(() => {
    if (shouldAutoExpand) {
      setStep((prev) => (prev === 0 ? 1 : prev));
    }
  }, [shouldAutoExpand]);

  // 트리거가 사라지면 시트 완전 닫기
  useEffect(() => {
    if (!hasInteraction) setStep(0);
  }, [hasInteraction]);

  if (!hasInteraction) return null;

  const expandOnce = () => {
    setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : 4));
  };
  const collapseOnce = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStep((prev) => (prev > 0 ? ((prev - 1) as Step) : 0));
  };

  const expanded = step > 0;

  return (
    <>
      {/* 확장 시 배경 어둡게 (3단계 이상일 때만) */}
      {step >= 3 && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-[55]"
          onClick={() => setStep(1)}
        />
      )}

      <div
        className="md:hidden fixed left-0 right-0 bottom-0 z-[60] bg-white rounded-t-2xl shadow-[0_-8px_24px_rgba(0,0,0,0.18)] transition-all duration-300 flex flex-col"
        style={{ height: STEP_HEIGHTS[step] }}
      >
        {/* 핸들 + 매물정보 바 */}
        <button
          onClick={expandOnce}
          className="flex-shrink-0 w-full px-4 pt-2 pb-2 flex flex-col items-stretch border-b border-border"
        >
          <span className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 mb-1.5" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: "hsl(var(--stat-green))" }}
              />
              <span className="text-sm font-bold text-foreground">매물정보</span>
              <span className="text-xs text-muted-foreground">({count}개)</span>
            </div>
            <div className="flex items-center gap-1">
              {expanded && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={collapseOnce}
                  className="p-1 rounded hover:bg-muted"
                  title="한 단계 줄이기"
                >
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </span>
              )}
              {step < 4 && (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              )}
              {onClose && expanded && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    setStep(0);
                    onClose();
                  }}
                  className="ml-1 p-1 rounded hover:bg-muted"
                  title="닫기"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </span>
              )}
            </div>
          </div>
          {/* 단계 인디케이터 */}
          {expanded && (
            <div className="flex items-center justify-center gap-1 mt-1.5">
              {[1, 2, 3, 4].map((n) => (
                <span
                  key={n}
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: step >= n ? 16 : 8,
                    background:
                      step >= n
                        ? "hsl(var(--primary))"
                        : "hsl(var(--border))",
                  }}
                />
              ))}
            </div>
          )}
        </button>

        {/* 확장 콘텐츠 */}
        {expanded && (
          <div className="flex-1 overflow-hidden">{children}</div>
        )}
      </div>
    </>
  );
};

export default MobileMapSheet;
