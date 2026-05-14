import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useAuth } from "@/hooks/useAuth";

const ChatPage = () => {
  const navigate = useNavigate();
  const { isAuthorized, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthorized) navigate("/login");
  }, [isLoading, isAuthorized, navigate]);

  // ChatInquiryWidget is mounted globally in App.tsx — open it.
  useEffect(() => {
    const t = setTimeout(() => {
      window.dispatchEvent(new Event("open-chat-inquiry"));
    }, 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ background: "hsl(var(--background))" }}>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-5">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-md hover:bg-muted">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5" /> 채팅 문의
          </h1>
        </div>

        <div className="text-center py-16">
          <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">채팅창이 열리지 않았다면 아래 버튼을 눌러주세요.</p>
          <button
            onClick={() => window.dispatchEvent(new Event("open-chat-inquiry"))}
            className="px-5 py-2.5 rounded-full text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa, #38bdf8)" }}
          >
            채팅 시작하기
          </button>
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
};

export default ChatPage;
