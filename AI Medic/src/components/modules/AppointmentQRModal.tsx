import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Download, CalendarClock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";

export interface AppointmentQRData {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  reason: string | null;
  locationName: string | null;
  locationAddress: string | null;
  doctorName: string;
  doctorSpecialty?: string | null;
  patientName: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointment: AppointmentQRData | null;
}

const AppointmentQRModal = ({ isOpen, onClose, appointment }: Props) => {
  if (!appointment) return null;

  const payload = JSON.stringify({
    type: "AIMEDIC_APT",
    id: appointment.id,
    date: appointment.scheduled_at,
    duration: appointment.duration_minutes,
    status: appointment.status,
    reason: appointment.reason,
    location: appointment.locationName,
    address: appointment.locationAddress,
    doctor: appointment.doctorName,
    specialty: appointment.doctorSpecialty || null,
    patient: appointment.patientName,
  });

  const encodedUrl = `${window.location.origin}/appointment?d=${encodeURIComponent(btoa(unescape(encodeURIComponent(payload))))}`;

  const handleDownloadQR = () => {
    const svgEl = document.querySelector("#appointment-qr-svg svg");
    if (!svgEl) return;
    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement("a");
      link.download = `qabul-${appointment.id.slice(0, 8)}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-elevated"
          >
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                <QrCode size={20} className="text-primary" />
                Qabul QR Code
              </h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex flex-col items-center gap-4 py-2">
                <div id="appointment-qr-svg" className="p-4 bg-white rounded-2xl shadow-card">
                  <QRCodeSVG value={encodedUrl} size={200} level="H" includeMargin bgColor="#ffffff" fgColor="#0f172a" />
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-[280px]">
                  Ushbu QR codeni ko'rsating — boshqa qurilmada skaner qilinsa, qabul vaqti va joyi haqida to'liq
                  ma'lumot chiqadi
                </p>
              </div>

              <div className="rounded-2xl bg-secondary/50 border border-border/50 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-foreground font-semibold">
                  <CalendarClock size={16} className="text-primary" />
                  {format(new Date(appointment.scheduled_at), "dd.MM.yyyy • HH:mm")}
                </div>
                <p className="text-muted-foreground text-xs">Shifokor: {appointment.doctorName}</p>
                <p className="text-muted-foreground text-xs">Bemor: {appointment.patientName}</p>
                {appointment.locationName && (
                  <p className="text-muted-foreground text-xs">Joy: {appointment.locationName}</p>
                )}
              </div>

              <button
                onClick={handleDownloadQR}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-all"
              >
                <Download size={16} />
                QR Codeni yuklab olish
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppointmentQRModal;
