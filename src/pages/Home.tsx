import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import VerificationSection from "@/components/VerificationSection";
import UserTypeSection from "@/components/UserTypeSection";
import FeaturesSection from "@/components/FeaturesSection";
import PropertyListSection from "@/components/PropertyListSection";
import Footer from "@/components/Footer";

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <VerificationSection />
        <UserTypeSection />
        <FeaturesSection />
        <PropertyListSection />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
