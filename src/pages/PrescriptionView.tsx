import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Pill, Stethoscope, User, CalendarDays, CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";

export default function PrescriptionView() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const encoded = searchParams.get("d");
    if (encoded) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(encoded)));
        if (decoded.type === "AIMEDIC_RX") {
          setData(decoded);
        }
      } catch (err) {
        console.error("Invalid QR data");
      }
    }
  }, [searchParams]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">Xato yuz berdi</h2>
          <p className="text-muted-foreground">Retsept ma'lumotlari topilmadi yoki noto'g'ri QR code skaner qilindi.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] py-8 px-4 flex justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card rounded-3xl shadow-xl border border-border overflow-hidden self-start"
      >
        {/* Header - Brand */}
        <div className="bg-primary/5 p-6 flex flex-col items-center border-b border-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />
          
          <img src={logo} alt="AI Medic Logo" className="h-20 w-20 object-contain mb-3 relative z-10" />
          <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight relative z-10">AI Medic</h1>
          <p className="text-sm text-primary font-medium mt-2 bg-primary/10 px-3 py-1 rounded-full relative z-10">
            Tasdiqlangan Elektron Retsept
          </p>
        </div>

        {/* Prescription Details */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4 shadow-lg shadow-primary/20">
              <Pill size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-foreground leading-tight">{data.medication}</h2>
            <div className="flex items-center justify-center gap-1.5 mt-2 text-medical-green">
              <CheckCircle2 size={16} />
              <span className="text-sm font-semibold">Dorixonada berishga ruxsat etilgan</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {data.dosage && (
              <div className="bg-secondary/50 rounded-2xl p-4 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Qabul qilish dozasi</p>
                <p className="text-sm font-bold text-foreground">{data.dosage}</p>
              </div>
            )}
            {data.duration && (
              <div className="bg-secondary/50 rounded-2xl p-4 border border-border/50">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Davomiyligi</p>
                <p className="text-sm font-bold text-foreground">{data.duration}</p>
              </div>
            )}
          </div>

          {data.instructions && (
            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
              <p className="text-[10px] text-primary uppercase tracking-wider mb-2 font-bold">Maxsus ko'rsatmalar</p>
              <p className="text-sm text-foreground font-medium leading-relaxed">{data.instructions}</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-secondary/30">
              <div className="w-10 h-10 rounded-xl bg-medical-blue-light/50 flex items-center justify-center shrink-0">
                <Stethoscope size={18} className="text-medical-blue" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Yozib bergan shifokor</p>
                <p className="text-sm font-bold text-foreground">{data.doctor}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-secondary/30">
              <div className="w-10 h-10 rounded-xl bg-medical-purple-light/50 flex items-center justify-center shrink-0">
                <User size={18} className="text-medical-purple" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Bemor</p>
                <p className="text-sm font-bold text-foreground">{data.patient}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-secondary/30">
              <div className="w-10 h-10 rounded-xl bg-medical-green-light/50 flex items-center justify-center shrink-0">
                <CalendarDays size={18} className="text-medical-green" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Sana va vaqt</p>
                <p className="text-sm font-bold text-foreground">
                  {new Date(data.date).toLocaleString("uz-UZ", { dateStyle: "long", timeStyle: "short" })}
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}
