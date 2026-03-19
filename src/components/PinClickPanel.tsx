import { X, MapPin, Building2, ChevronRight } from "lucide-react";
import { MapProperty } from "@/data/mapProperties";

interface PinClickPanelProps {
  properties: MapProperty[];
  onClose: () => void;
  onSelectProperty: (id: number) => void;
  selectedId: number | null;
}

const TYPE_COLOR: Record<string, string> = {
  "상가": "hsl(221 83% 53%)",
  "사무실": "hsl(262 83% 58%)",
  "식당·카페": "hsl(25 95% 53%)",
  "공장·창고": "hsl(142 71% 45%)",
  "병원·학원": "hsl(0 84% 60%)",
  "아파트": "hsl(221 83% 53%)",
  "원룸": "hsl(199 89% 48%)",
  "빌라": "hsl(199 89% 48%)",
  "오피스텔": "hsl(262 83% 58%)",
  "토지": "hsl(142 71% 45%)",
  "투룸": "hsl(199 89% 48%)",
  "쓰리룸": "hsl(199 89% 48%)",
  "투베이": "hsl(199 89% 48%)",
};

const PinClickPanel = ({ properties, onClose, onSelectProperty, selectedId }: PinClickPanelProps) => {
  if (properties.length === 0) return null;

  return (
    <div
      className="absolute right-0 top-0 bottom-0 z-[800] bg-card border-l border-border shadow-2xl flex flex-col"
      style={{ width: "300px" }}
    >
      {/* 헤더 */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-border"
        style={{ background: "hsl(var(--primary)/0.06)" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-[13px] font-extrabold text-foreground">핀 클릭 매물</p>
            <p className="text-[10px] text-muted-foreground">클릭 순서대로 표시됩니다</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "hsl(var(--primary))", color: "white" }}
          >
            {properties.length}개
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* 매물 목록 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 flex flex-col gap-2">
          {properties.map((prop, idx) => {
            const isSelected = prop.id === selectedId;
            const typeColor = TYPE_COLOR[prop.type] ?? "hsl(var(--primary))";
            const note = prop.note ?? "";
            const brokerFeeMatch = note.match(/중개보수[:\s]+([^\n|]+)/);
            const brokerFee = brokerFeeMatch?.[1]?.trim();
            const earlyExit = note.includes("중도퇴거:");
            const vacancy = prop.availableFrom === "공실" || prop.availableFrom === "세입자 거주중"
              ? prop.availableFrom : null;

            return (
              <button
                key={`${prop.id}-${idx}`}
                onClick={() => onSelectProperty(prop.id)}
                className={`w-full text-left rounded-xl overflow-hidden border transition-all ${
                  isSelected
                    ? "ring-2 ring-primary shadow-lg border-primary/30"
                    : "border-border shadow-sm hover:shadow-md hover:ring-1 hover:ring-primary/20"
                }`}
                style={{ background: "white" }}
              >
                <div className="flex items-stretch" style={{ minHeight: "80px" }}>
                  {/* 순번 뱃지 */}
                  <div
                    className="w-8 flex-shrink-0 flex flex-col items-center justify-center gap-1"
                    style={{ background: isSelected ? "hsl(var(--primary))" : "hsl(var(--muted))" }}
                  >
                    <span
                      className="text-[11px] font-extrabold leading-none"
                      style={{ color: isSelected ? "white" : "hsl(var(--muted-foreground))" }}
                    >
                      {idx + 1}
                    </span>
                  </div>

                  {/* 썸네일 */}
                  <div className="w-[72px] flex-shrink-0 overflow-hidden bg-muted relative">
                    {prop.image ? (
                      <img
                        src={prop.image}
                        alt={prop.title}
                        className="w-full h-full object-cover"
                        style={{ minHeight: "80px" }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ minHeight: "80px" }}>
                        <Building2 className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                    )}
                    {/* 유형 뱃지 */}
                    <span
                      className="absolute bottom-1 left-1 text-[8px] font-bold px-1 py-0.5 rounded"
                      style={{ background: typeColor, color: "white" }}
                    >
                      {prop.type}
                    </span>
                  </div>

                  {/* 정보 영역 */}
                  <div className="flex-1 min-w-0 px-2.5 py-2 flex flex-col justify-between">
                    {/* 제목 */}
                    <p className="text-[12px] font-bold text-foreground truncate leading-tight">
                      {prop.buildingName ?? prop.title}
                    </p>
                    {/* 호수 */}
                    {prop.unitNumber && (
                      <p className="text-[10px] text-muted-foreground">{prop.unitNumber}</p>
                    )}
                    {/* 가격 */}
                    <p className="text-[11px] font-extrabold" style={{ color: typeColor }}>
                      {prop.deposit && prop.monthly
                        ? `${prop.deposit} / ${prop.monthly}`
                        : prop.deposit || prop.monthly || "-"}
                    </p>
                    {/* 배지 행 */}
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {vacancy && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            background: vacancy === "공실" ? "hsl(142 71% 93%)" : "hsl(25 95% 93%)",
                            color: vacancy === "공실" ? "hsl(142 71% 35%)" : "hsl(25 95% 40%)",
                            border: `1px solid ${vacancy === "공실" ? "hsl(142 71% 70%)" : "hsl(25 95% 70%)"}`,
                          }}
                        >
                          {vacancy}
                        </span>
                      )}
                      {brokerFee && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: "hsl(0 85% 93%)", color: "hsl(0 85% 45%)", border: "1px solid hsl(0 85% 70%)" }}
                        >
                          수수료 {brokerFee}
                        </span>
                      )}
                      {earlyExit && (
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                          style={{ background: "hsl(0 85% 93%)", color: "hsl(0 85% 40%)", border: "1px solid hsl(0 85% 70%)" }}
                        >
                          중도퇴거
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 화살표 */}
                  <div className="flex items-center pr-2">
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 하단 초기화 버튼 */}
      <div className="flex-shrink-0 px-3 py-3 border-t border-border">
        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl text-xs font-bold transition-colors"
          style={{ background: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" }}
        >
          목록 초기화
        </button>
      </div>
    </div>
  );
};

export default PinClickPanel;
