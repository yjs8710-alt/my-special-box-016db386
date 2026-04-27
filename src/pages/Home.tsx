import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="w-full bg-yellow-400 text-black text-center py-4 text-2xl md:text-4xl font-mono font-extrabold tracking-wider">
        TEST_MAIN_VISIBLE_0427
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
