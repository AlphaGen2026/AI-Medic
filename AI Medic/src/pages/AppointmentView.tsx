import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CalendarDays, Clock, MapPin, Stethoscope, User, CheckCircle2, FileText } from "lucide-react";
import logo from "@/assets/logo.png";
import { motion } from "framer-motion";

const STATUS_LABEL: Record<string, string> = {
  pending: "Tasdiq kutilmoqda",
  confirmed: "Tasdiqlangan",
  completed: "Yakunlangan",
  cancelled: "Bekor qilingan",
};

export default function AppointmentView() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const encoded = searchParams.get("d");
    if (!encoded) return;
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(encoded)))));
      if (decoded.type === "AIMEDIC_APT") setData(decoded);
    } catch {
      console.error("Invalid QR data");
    }
  }, [searchParams]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">Xato yuz berdi</h2>
          <p className="text-muted-foreground">
            Qabul ma'lumotlari topilmadi yoki noto'g'ri QR code skaner qilindi.
          </p>
        </div>
      </div>
    );
  }

  const date = new Date(data.date);

  const Row = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-secondary/30">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</p>
        <p className="text-sm font-bold text-foreground break-words">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] py-8 px-4 flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-card rounded-3xl shadow-xl border border-border overflow-hidden self-start"
      >
        <div className="bg-primary/5 p-6 flex flex-col items-center border-b border-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
          <img src={logo} alt="AI Medic" className="h-20 w-20 object-contain mb-3 relative z-10" />
          <h1 className="text-3xl font-display font-extrabold text-foreground tracking-tight relative z-10">AI Medic</h1>
          <p className="text-sm text-primary font-medium mt-2 bg-primary/10 px-3 py-1 rounded-full relative z-10">
            Elektron qabul chiptasi
          </p>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-center">
            <p className="text-3xl font-display font-extrabold text-foreground">
              {date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {date.toLocaleDateString("uz-UZ", { dateStyle: "long" })}
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-3 text-medical-green">
              <CheckCircle2 size={16} />
              <span className="text-sm font-semibold">{STATUS_LABEL[data.status] || data.status}</span>
            </div>
          </div>

          <div className="space-y-3">
            <Row
              icon={<Stethoscope size={18} className="text-medical-blue" />}
              label="Shifokor"
              value={`${data.doctor}${data.specialty ? ` — ${data.specialty}` : ""}`}
            />
            <Row icon={<User size={18} className="text-medical-purple" />} label="Bemor" value={data.patient} />
            <Row
              icon={<Clock size={18} className="text-primary" />}
              label="Davomiyligi"
              value={`${data.duration || 30} daqiqa`}
            />
            {data.location && (
              <Row
                icon={<MapPin size={18} className="text-medical-green" />}
                label="Manzil"
                value={`${data.location}${data.address ? `, ${data.address}` : ""}`}
              />
            )}
            {data.reason && (
              <Row icon={<FileText size={18} className="text-primary" />} label="Sabab" value={data.reason} />
            )}
            <Row
              icon={<CalendarDays size={18} className="text-medical-green" />}
              label="Sana va vaqt"
              value={date.toLocaleString("uz-UZ", { dateStyle: "long", timeStyle: "short" })}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
