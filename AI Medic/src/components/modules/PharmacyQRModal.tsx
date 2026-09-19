import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Download } from "lucide-react";
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

  const encodedUrl = `${window.location.origin}/prescription?d=${encodeURIComponent(btoa(qrData))}`;

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
                Retsept QR Code
              </h3>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* QR Code Display */}
              <div className="flex flex-col items-center gap-4 py-4">
                <div id="pharmacy-qr-svg" className="p-4 bg-white rounded-2xl shadow-card">
                  <QRCodeSVG
                    value={encodedUrl}
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

              {/* Actions */}
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

export default PharmacyQRModal;
