import { useNavigate } from "react-router-dom";
import MedicalScene from "@/components/three/MedicalScene";
import FloatingObjects from "@/components/landing/FloatingObjects";
import ScrollProgress from "@/components/shared/ScrollProgress";
import LandingHeader from "@/components/landing/LandingHeader";
import ServicesSection from "@/components/landing/ServicesSection";
import SiteFooter from "@/components/landing/SiteFooter";

const ServicesPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ScrollProgress />
      <FloatingObjects />
      <LandingHeader onGetStarted={() => navigate("/?auth=1")} />
      <div className="pt-16 sm:pt-24 relative z-10">
        <MedicalScene variant="molecule" className="mx-auto w-full max-w-2xl h-56 sm:h-72 md:h-80 mt-6 -mb-4" />
        <ServicesSection />
      </div>
      <SiteFooter />
    </div>
  );
};

export default ServicesPage;
