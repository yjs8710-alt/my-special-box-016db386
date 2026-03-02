import { useState } from "react";
import { Menu, X, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { label: "주거형 임대" },
  { label: "주거형 외 임대" },
  { label: "매매" },
  { label: "아파트" },
  { label: "오피스텔" },
  { label: "빌라" },
  { label: "토지" },
];

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-[950] bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">공</span>
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">공실박스</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.label}
                href="#"
                className="text-sm font-medium text-foreground hover:text-primary hover:bg-primary/5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-primary">
              <Bell className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:flex text-muted-foreground hover:text-primary">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="default" size="sm" className="hidden md:flex bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
              매물등록
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-card border-t border-border px-4 py-3 flex flex-col gap-3">
          {NAV_ITEMS.map((item) => (
            <a key={item.label} href="#" className="text-sm font-medium text-foreground py-1">
              {item.label}
            </a>
          ))}
          <Button variant="default" size="sm" className="bg-primary text-primary-foreground w-full mt-2">
            매물등록
          </Button>
        </div>
      )}
    </header>
  );
};

export default Header;
