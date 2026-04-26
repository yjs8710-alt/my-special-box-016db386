import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import { APP_VERSION } from "@/lib/appVersion";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 임시 배포 확인 배너 (Chrome/Naver 동일 노출 검증용) */}
      <div className="w-full bg-accent text-accent-foreground text-center text-sm sm:text-base font-extrabold py-3 border-b-4 border-primary tracking-wide">
        집다 테스트 NEW 2026 · NAVER FORCE UPDATE V2 · {APP_VERSION}
      </div>
      <Header />
      <main className="flex-1">
        <HeroSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
