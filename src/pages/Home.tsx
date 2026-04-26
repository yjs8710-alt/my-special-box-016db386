import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full bg-yellow-300 text-black text-center text-sm font-bold py-2 border-b-2 border-yellow-500">
        🚀 배포확인 2026-04-27 (v2026.04.27.01)
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
