import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText, Users, Handshake, ShieldAlert, Gavel, Ban, Globe } from "lucide-react";

const ARTICLES = [
  {
    icon: FileText,
    title: "제1조 목적",
    content:
      "본 약관은 집다(ZIBDA)가 제공하는 부동산 정보 서비스(이하 '서비스')의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.",
  },
  {
    icon: Users,
    title: "제2조 이용자의 정의",
    content: (
      <>
        <p className="mb-2">'이용자'란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>회원: 서비스에 회원가입을 하여 지속적으로 서비스를 이용할 수 있는 자</li>
          <li>비회원: 회원가입 없이 일부 서비스를 이용하는 자</li>
        </ul>
      </>
    ),
  },
  {
    icon: Handshake,
    title: "제3조 서비스의 제공 및 변경",
    content: (
      <>
        <p className="mb-2">회사는 이용자에게 아래와 같은 서비스를 제공합니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>부동산 매물 정보 검색 및 조회</li>
          <li>매물 등록 및 관리 서비스</li>
          <li>공인중개사와의 연결 및 상담 서비스</li>
          <li>기타 회사가 정하는 서비스</li>
        </ul>
        <p className="mt-2">회사는 서비스의 내용을 변경할 수 있으며, 변경 시 사전에 공지합니다.</p>
      </>
    ),
  },
  {
    icon: ShieldAlert,
    title: "제4조 서비스 이용의 제한 및 중단",
    content: (
      <>
        <p className="mb-2">회사는 아래의 경우 서비스 이용을 제한하거나 중단할 수 있습니다.</p>
        <ul className="list-disc list-inside space-y-1">
          <li>시스템 점검, 교체, 고장 등 부득이한 사유가 있는 경우</li>
          <li>이용자가 본 약관을 위반한 경우</li>
          <li>법령에 따라 서비스 제공이 불가능한 경우</li>
        </ul>
      </>
    ),
  },
  {
    icon: Gavel,
    title: "제5조 계약의 해지",
    content:
      "이용자는 언제든지 회원 탈퇴를 통해 이용계약을 해지할 수 있으며, 회사는 이용자가 본 약관을 위반하거나 법령을 위반하는 경우 사전 통지 후 이용계약을 해지할 수 있습니다.",
  },
  {
    icon: Ban,
    title: "제6조 손해배상 및 면책",
    content:
      "회사는 서비스 제공과 관련하여 고의 또는 중대한 과실이 없는 한 이용자에게 발생한 손해에 대해 책임을 지지 않습니다. 다만, 회사의 귀책사유로 인한 손해는 관련 법령에 따라 배상합니다.",
  },
  {
    icon: Globe,
    title: "제7조 준거법 및 관할법원",
    content:
      "본 약관은 대한민국 법령에 따라 규정되며, 서비스와 관련하여 분쟁이 발생할 경우 민사소송법상의 관할법원에 제기합니다.",
  },
];

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(var(--background))" }}>
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section
          className="relative py-16 md:py-24 px-4 text-center"
          style={{ background: "hsl(var(--header-bg))" }}
        >
          <div className="max-w-3xl mx-auto">
            <FileText className="w-10 h-10 mx-auto mb-4 text-white/70" />
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">이용약관</h1>
            <p className="text-lg md:text-xl text-white/80 font-medium">
              집다(ZIBDA) 서비스 이용을 위한 약관입니다.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-3xl mx-auto px-4 py-12 md:py-16 space-y-8">
          {ARTICLES.map((article) => (
            <div
              key={article.title}
              className="rounded-lg p-5 md:p-6 space-y-4"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "hsl(var(--primary))" }}
                >
                  <article.icon className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-base font-bold" style={{ color: "hsl(var(--primary))" }}>
                  {article.title}
                </h2>
              </div>
              <div className="pl-11 text-sm leading-relaxed" style={{ color: "hsl(var(--foreground))" }}>
                {article.content}
              </div>
            </div>
          ))}
        </section>
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile back button */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[900] p-4" style={{ background: "hsl(var(--header-bg) / 0.95)" }}>
        <button
          onClick={() => navigate(-1)}
          className="w-full py-3 rounded-xl text-sm font-bold text-white"
          style={{ background: "hsl(var(--primary))" }}
        >
          뒤로 가기
        </button>
      </div>
    </div>
  );
};

export default TermsOfService;
