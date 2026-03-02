import { MapPin, Phone, Mail, ChevronRight } from "lucide-react";

const REGIONS = [
  { name: "서울", count: 4210 },
  { name: "경기", count: 3105 },
  { name: "인천", count: 891 },
  { name: "부산", count: 1023 },
  { name: "대구", count: 678 },
  { name: "광주", count: 445 },
  { name: "대전", count: 512 },
  { name: "제주", count: 234 },
];

const Footer = () => {
  return (
    <footer className="bg-foreground text-white">
      {/* Region Quick Links */}
      <div className="border-b border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <h3 className="text-base font-semibold text-white/80 mb-5 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> 지역별 매물
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {REGIONS.map((r) => (
              <div key={r.name} className="text-center cursor-pointer group">
                <div className="w-full py-3 rounded-xl bg-white/5 hover:bg-primary/80 transition-colors group-hover:scale-105 duration-200">
                  <p className="font-semibold text-white text-sm">{r.name}</p>
                  <p className="text-xs text-white/50 group-hover:text-white/80 mt-0.5">{r.count.toLocaleString()}건</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold text-sm">집</span>
              </div>
              <span className="text-xl font-bold text-white">집다</span>
            </div>
            <p className="text-sm text-white/50 max-w-sm leading-relaxed">
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
