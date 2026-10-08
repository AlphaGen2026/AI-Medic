import { useNavigate } from "react-router-dom";
import MedicalScene from "@/components/three/MedicalScene";
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
      <MedicalScene variant="cross" className="absolute right-0 top-20 w-[46vw] max-w-[560px] h-[480px] opacity-80 z-0 hidden md:block" />
      <LandingHeader onGetStarted={() => navigate("/?auth=1")} />
      <div className="pt-16 sm:pt-24 relative z-10"><DepartmentsSection /></div>
      <SiteFooter />
    </div>
  );
};

export default DepartmentsPage;
