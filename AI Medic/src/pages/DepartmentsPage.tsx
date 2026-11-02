import { useNavigate } from "react-router-dom";
import MedicalScene from "@/components/three/MedicalScene";
import RobotScene from "@/components/three/RobotScene";
import FloatingObjects from "@/components/landing/FloatingObjects";
import ScrollProgress from "@/components/shared/ScrollProgress";
import LandingHeader from "@/components/landing/LandingHeader";
import DepartmentsSection from "@/components/landing/DepartmentsSection";
import SiteFooter from "@/components/landing/SiteFooter";

const DepartmentsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <ScrollProgress />
      <FloatingObjects />
      <MedicalScene variant="cross" className="absolute z-20 right-1 sm:right-[3vw] top-[72px] sm:top-24 w-24 h-24 sm:w-44 sm:h-44 md:w-64 md:h-64 lg:w-72 lg:h-72" />
      <RobotScene variant="presenter" className="absolute z-20 left-0 sm:left-[2vw] top-[72px] sm:top-24 w-28 h-28 sm:w-52 sm:h-52 md:w-72 md:h-72 lg:w-80 lg:h-80" />
      <LandingHeader onGetStarted={() => navigate("/?auth=1")} />
      <div className="pt-16 sm:pt-24 relative z-10"><DepartmentsSection /></div>
      <SiteFooter />
    </div>
  );
};

export default DepartmentsPage;
