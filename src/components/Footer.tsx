import { Phone, Mail } from "lucide-react";
import logoImg from "@/assets/logo-zibda-active-20260427-v4.png";

const Footer = () => {
  return (
    <footer className="bg-foreground text-white">
      {/* Footer Bottom */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div>
            <p className="text-sm text-white max-w-sm leading-relaxed">
              공실 전문 플랫폼
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

          <div className="grid grid-cols-2 gap-8 text-sm">
            <div>
              <h4 className="font-semibold text-white/80 mb-3">회사</h4>
              <ul className="flex flex-col gap-2">
                <li>
                  <a href="#" className="text-white hover:text-white transition-colors text-xs">
                    회사소개
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white/80 mb-3">지원</h4>
              <ul className="flex flex-col gap-2">
                {["이용약관", "개인정보처리방침", "고객센터"].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-white/40 hover:text-white transition-colors text-xs">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
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
