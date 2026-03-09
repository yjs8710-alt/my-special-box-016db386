import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { X, FileText } from "lucide-react";

interface ExternalModalState {
  url: string;
  title: string;
}

const ExternalLinksBar = () => {
  const [modal, setModal] = useState<ExternalModalState | null>(null);

  const openModal = (url: string, title: string) => setModal({ url, title });
  const closeModal = () => setModal(null);

  return (
    <>
      <div
        className="flex items-center gap-1.5 pl-[21px] pr-3 py-1.5 border-b border-border overflow-x-auto flex-shrink-0"
        style={{ background: "hsl(var(--header-bg))" }}
      >
        {/* 등기소 */}
        <button
          type="button"
          onClick={() => openModal("https://www.iros.go.kr", "인터넷등기소")}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all hover:opacity-80 flex-shrink-0"
          style={{ background: "#f0f5ff", color: "#1a56db", borderColor: "#c7d7f8" }}
        >
          <ExternalLink className="w-2.5 h-2.5" />
          등기소
        </button>
        {/* 정부24 */}
        <button
          type="button"
          onClick={() => openModal("https://www.gov.kr", "정부24")}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all hover:opacity-80 flex-shrink-0"
          style={{ background: "#f0fff4", color: "#166534", borderColor: "#bbf7d0" }}
        >
          <ExternalLink className="w-2.5 h-2.5" />
          정부24
        </button>
        {/* 토지e음 */}
        <button
          type="button"
          onClick={() => openModal("https://www.eum.go.kr", "토지이음")}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all hover:opacity-80 flex-shrink-0"
          style={{ background: "#fffbeb", color: "#92400e", borderColor: "#fde68a" }}
        >
          <ExternalLink className="w-2.5 h-2.5" />
          토지e음
        </button>
        {/* 홈택스 */}
        <a
          href="https://www.hometax.go.kr"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all hover:opacity-80 flex-shrink-0"
          style={{ background: "#fdf4ff", color: "#7e22ce", borderColor: "#e9d5ff" }}
        >
          <ExternalLink className="w-2.5 h-2.5" />
          홈택스
        </a>
        <div className="w-px h-4 bg-white/20 mx-0.5 flex-shrink-0" />
        {/* 네이버 */}
        <a
          href="https://land.naver.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all hover:opacity-80 flex-shrink-0"
          style={{ background: "#e8f5e9", color: "#03C75A", borderColor: "#b2dfdb" }}
        >
          <ExternalLink className="w-2.5 h-2.5" />
          네이버
        </a>
        {/* 직방 */}
        <a
          href="https://www.zigbang.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all hover:opacity-80 flex-shrink-0"
          style={{ background: "#fff3e0", color: "#FF6D00", borderColor: "#ffcc80" }}
        >
          <ExternalLink className="w-2.5 h-2.5" />
          직방
        </a>
        {/* 다방 */}
        <a
          href="https://www.dabangapp.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition-all hover:opacity-80 flex-shrink-0"
          style={{ background: "#fce4ec", color: "#e91e63", borderColor: "#f8bbd0" }}
        >
          <ExternalLink className="w-2.5 h-2.5" />
          다방
        </a>
      </div>

      {/* 외부 서비스 모달 */}
      {modal && (
        <>
          <div className="fixed inset-0 z-[10050] bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div
            className="fixed z-[10051] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "min(900px, 92vw)", height: "min(700px, 88vh)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-primary/5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <p className="text-sm font-bold text-foreground">{modal.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={modal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors text-[11px] font-semibold text-primary"
                >
                  <ExternalLink className="w-3 h-3" />
                  새 탭에서 열기
                </a>
                <button
                  onClick={closeModal}
                  className="w-7 h-7 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex-1 relative min-h-0">
              <iframe
                src={modal.url}
                className="w-full h-full border-0"
                title={modal.title}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              />
            </div>
            <div className="px-4 py-2 bg-muted/30 border-t border-border flex-shrink-0">
              <p className="text-[10px] text-muted-foreground text-center">
                화면이 표시되지 않으면 <a href={modal.url} target="_blank" rel="noopener noreferrer" className="text-primary underline font-semibold">여기를 클릭</a>하여 직접 확인하세요.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default ExternalLinksBar;
