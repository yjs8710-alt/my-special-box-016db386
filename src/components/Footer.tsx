import { Phone, Mail } from "lucide-react";
import logoImg from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-white">
      {/* Footer Bottom */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div>
            <p className="text-sm text-white max-w-sm leading-relaxed">
              중개사만을 위한 청주 공실 전문 플랫폼. 검증된 실매물 정보로 빠르고 정확한 중개 서비스를 제공하세요.
            </p>
            <div className="flex gap-4 mt-4">
              <a href="#" className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
                <Phone className="w-3.5 h-3.5" /> 1588-0000
              </a>
              <a href="#" className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors">
                <Mail className="w-3.5 h-3.5" /> help@jipda.kr
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
            {[
              { title: "서비스", links: ["매물 검색", "매물 등록", "시세 조회", "경매 정보"] },
              { title: "회사", links: ["회사소개", "채용정보", "공지사항", "파트너십"] },
              { title: "지원", links: ["이용약관", "개인정보처리방침", "고객센터", "자주 묻는 질문"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-white/80 mb-3">{col.title}</h4>
                <ul className="flex flex-col gap-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-white/40 hover:text-white transition-colors text-xs">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-white/30">© 2024 집다. All rights reserved.</p>
          <p className="text-xs text-white/30">사업자등록번호: 123-45-67890 | 대표: 홍길동</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
