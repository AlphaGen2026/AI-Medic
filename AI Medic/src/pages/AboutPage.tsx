import { useNavigate } from "react-router-dom";
import MedicalScene from "@/components/three/MedicalScene";
import RobotScene from "@/components/three/RobotScene";
import FloatingObjects from "@/components/landing/FloatingObjects";
import ScrollProgress from "@/components/shared/ScrollProgress";
import LandingHeader from "@/components/landing/LandingHeader";
import AboutSection from "@/components/landing/AboutSection";
import AboutExtended from "@/components/landing/AboutExtended";
import SiteFooter from "@/components/landing/SiteFooter";

const AboutPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ScrollProgress />
      <FloatingObjects />
      <MedicalScene variant="heart" className="absolute z-20 right-1 sm:right-[3vw] top-[72px] sm:top-24 w-24 h-24 sm:w-44 sm:h-44 md:w-64 md:h-64 lg:w-72 lg:h-72" />
      <RobotScene variant="team" className="absolute z-20 left-0 sm:left-[2vw] top-[72px] sm:top-24 w-24 h-24 sm:w-44 sm:h-44 md:w-56 md:h-56 lg:w-64 lg:h-64" />
      <LandingHeader onGetStarted={() => navigate("/?auth=1")} />
      <div className="pt-16 sm:pt-24 relative z-10">
        <AboutSection />
        <AboutExtended />
      </div>
      <SiteFooter />
    </div>
  );
};

export default AboutPage;
