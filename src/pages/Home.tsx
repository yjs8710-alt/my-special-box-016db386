import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import { APP_VERSION } from "@/lib/appVersion";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 임시 배포 확인 배너 (Chrome/Naver 동일 노출 검증용) */}
      <div className="w-full bg-yellow-300 text-black text-center text-xs sm:text-sm font-bold py-2 border-b-2 border-yellow-500">
        NAVER-UPDATE-CHECK-20260427 ({APP_VERSION})
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
