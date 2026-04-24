import { ReactNode, useEffect, useState } from "react";
import { ChevronUp, ChevronDown, X } from "lucide-react";

interface MobileMapSheetProps {
  /** 매물 개수 (peek 바에 표시) */
  count: number;
  /** 시트를 열어야 할 트리거가 있는지 (선택된 매물 / 검색어 / 핀 등) */
  hasInteraction: boolean;
  /** 선택된 매물 id가 있으면 자동으로 펼침 */
  shouldAutoExpand: boolean;
  onClose?: () => void;
  children: ReactNode;
}

/**
 * 모바일 전용 하단 시트.
 * - 사용자가 지도 핀 클릭 / 검색을 하기 전에는 표시되지 않음.
 * - 트리거 발생 시 하단에 peek 바가 올라옴 → 탭하면 전체 화면으로 확장.
 * - 매물 선택(selectedId) 시에는 자동으로 확장됨.
 */
const MobileMapSheet = ({
  count,
  hasInteraction,
  shouldAutoExpand,
  onClose,
  children,
}: MobileMapSheetProps) => {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (shouldAutoExpand) setExpanded(true);
  }, [shouldAutoExpand]);

  // 트리거가 사라지면 시트 닫기
  useEffect(() => {
    if (!hasInteraction) setExpanded(false);
  }, [hasInteraction]);

  if (!hasInteraction) return null;

  return (
    <>
      {/* 확장 시 배경 어둡게 */}
      {expanded && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-[55]"
          onClick={() => setExpanded(false)}
        />
      )}

      <div
        className={`md:hidden fixed left-0 right-0 bottom-0 z-[60] bg-white rounded-t-2xl shadow-[0_-8px_24px_rgba(0,0,0,0.18)] transition-all duration-300 flex flex-col`}
        style={{
          height: expanded ? "85vh" : "64px",
        }}
      >
        {/* Peek 바 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-shrink-0 w-full h-16 px-4 flex items-center justify-between border-b border-border"
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "hsl(var(--stat-green))" }}
            />
            <span className="text-sm font-bold text-foreground">
              매물 {count}개
            </span>
            <span className="text-xs text-muted-foreground">
              {expanded ? "탭하여 닫기" : "탭하여 매물 보기"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {expanded ? (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            )}
            {onClose && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded(false);
                  onClose();
                }}
                className="ml-1 p-1 rounded hover:bg-muted"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </span>
            )}
          </div>
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
