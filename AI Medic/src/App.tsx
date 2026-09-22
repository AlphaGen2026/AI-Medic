import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/useTheme";
import { LanguageProvider } from "@/hooks/useLanguage";

import Index from "./pages/Index.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import DepartmentsPage from "./pages/DepartmentsPage.tsx";
import ContactPage from "./pages/ContactPage.tsx";
import ServicesPage from "./pages/ServicesPage.tsx";
import NotFound from "./pages/NotFound.tsx";
import PrescriptionView from "./pages/PrescriptionView.tsx";
import AppointmentView from "./pages/AppointmentView.tsx";
import FloatingAziz from "./components/shared/FloatingAziz.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <LanguageProvider>
            <Toaster />
            <Sonner />
            <FloatingAziz />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/departments" element={<DepartmentsPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/prescription" element={<PrescriptionView />} />
                <Route path="/appointment" element={<AppointmentView />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            
        </LanguageProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
