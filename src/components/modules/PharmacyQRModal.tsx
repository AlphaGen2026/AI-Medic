import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Download, Pill, Stethoscope, User, CalendarDays, Clock, FileText, ScanLine } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface PrescriptionData {
  id: string;
  medication: string;
  dosage: string | null;
  duration: string | null;
  instructions: string | null;
  created_at: string;
  doctorName: string;
  doctorSpecialty?: string;
  patientName: string;
}

interface PharmacyQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: PrescriptionData | null;
}

const PharmacyQRModal = ({ isOpen, onClose, prescription }: PharmacyQRModalProps) => {
  const [showPharmacyView, setShowPharmacyView] = useState(false);

  if (!prescription) return null;

  const qrData = JSON.stringify({
    type: "AIMEDIC_RX",
    id: prescription.id,
    medication: prescription.medication,
    dosage: prescription.dosage,
    duration: prescription.duration,
    instructions: prescription.instructions,
    doctor: prescription.doctorName,
    patient: prescription.patientName,
    date: prescription.created_at,
  });

  const handleDownloadQR = () => {
    const svgEl = document.querySelector("#pharmacy-qr-svg svg");
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
      link.download = `retsept-${prescription.id.slice(0, 8)}.png`;
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
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                <QrCode size={20} className="text-primary" />
                {showPharmacyView ? "Dorixona — Dori Ma'lumoti" : "Retsept QR Code"}
              </h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {!showPharmacyView ? (
                <>
                  {/* QR Code Display */}
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div id="pharmacy-qr-svg" className="p-4 bg-white rounded-2xl shadow-card">
                      <QRCodeSVG
                        value={qrData}
                        size={200}
                        level="H"
                        includeMargin
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center max-w-[280px]">
                      Dorixonachi ushbu QR codeni skanerdan o'tkazib, retsept haqida to'liq ma'lumot oladi
                    </p>
                  </div>

                  {/* Quick info */}
                  <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Pill size={14} className="text-primary shrink-0" />
                      <span className="font-semibold text-foreground">{prescription.medication}</span>
                    </div>
                    {prescription.dosage && (
                      <p className="text-xs text-muted-foreground pl-6">Doza: {prescription.dosage}</p>
                    )}
                    {prescription.duration && (
                      <p className="text-xs text-muted-foreground pl-6">Davomiylik: {prescription.duration}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleDownloadQR}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-all"
                    >
                      <Download size={16} />
                      Yuklab olish
                    </button>
                    <button
                      onClick={() => setShowPharmacyView(true)}
                      className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold shadow-glow"
                    >
                      <ScanLine size={16} />
                      Dorixona ko'rinishi
                    </button>
                  </div>
                </>
              ) : (
                /* ─────── Pharmacy View ─────── */
                <>
                  <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-5 border border-primary/20 space-y-4">
                    {/* Drug name - prominent */}
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-3 shadow-glow">
                        <Pill size={28} className="text-primary-foreground" />
                      </div>
                      <h4 className="text-xl font-display font-bold text-foreground">{prescription.medication}</h4>
                      <p className="text-xs text-muted-foreground mt-1">AI Medic Retsept</p>
                    </div>

                    {/* Drug details grid */}
                    <div className="grid grid-cols-2 gap-3">
                      {prescription.dosage && (
                        <div className="bg-card rounded-xl p-3 border border-border">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Doza</p>
                          <p className="text-sm font-bold text-foreground">{prescription.dosage}</p>
                        </div>
                      )}
                      {prescription.duration && (
                        <div className="bg-card rounded-xl p-3 border border-border">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Davomiylik</p>
                          <p className="text-sm font-bold text-foreground">{prescription.duration}</p>
                        </div>
                      )}
                    </div>

                    {prescription.instructions && (
                      <div className="bg-card rounded-xl p-3 border border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Ko'rsatma</p>
                        <p className="text-sm text-foreground">{prescription.instructions}</p>
                      </div>
                    )}
                  </div>

                  {/* Doctor & Patient info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      <div className="w-8 h-8 rounded-full bg-medical-blue-light flex items-center justify-center">
                        <Stethoscope size={14} className="text-medical-blue" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Shifokor</p>
                        <p className="text-sm font-semibold text-foreground">{prescription.doctorName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      <div className="w-8 h-8 rounded-full bg-medical-green-light flex items-center justify-center">
                        <User size={14} className="text-medical-green" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bemor</p>
                        <p className="text-sm font-semibold text-foreground">{prescription.patientName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      <div className="w-8 h-8 rounded-full bg-medical-purple-light flex items-center justify-center">
                        <CalendarDays size={14} className="text-medical-purple" />
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Sana</p>
                        <p className="text-sm font-semibold text-foreground">
                          {new Date(prescription.created_at).toLocaleDateString("uz-UZ")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pharmacy action */}
                  <div className="bg-medical-green-light/50 rounded-xl p-4 flex items-start gap-3">
                    <FileText size={18} className="text-medical-green shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">Dorixonachi uchun</p>
                      <p className="text-xs text-muted-foreground">
                        Ushbu dori bemorga shifokor tomonidan yozilgan. Retsept tasdiqlangan va dori berishingiz mumkin.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPharmacyView(false)}
                    className="w-full py-3 rounded-xl bg-secondary border border-border text-sm font-semibold text-foreground hover:bg-secondary/80 transition-all"
                  >
                    ← QR Codega qaytish
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PharmacyQRModal;
