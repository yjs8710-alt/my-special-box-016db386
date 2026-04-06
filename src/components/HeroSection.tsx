import heroBg from "@/assets/hero-bg.jpg";
import logoImg from "@/assets/logo.png";

const HeroSection = () => {
  return (
    <section className="relative min-h-[520px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroBg})` }} />
      <div className="absolute inset-0 bg-black/20" />

      <div className="relative z-10 flex items-center justify-center px-4">
        <img
          src={logoImg}
          alt="집다 로고"
          className="h-32 sm:h-40 md:h-52 object-contain drop-shadow-2xl"
          style={{ mixBlendMode: "screen" }}
        />
      </div>
    </section>
  );
};

export default HeroSection;
