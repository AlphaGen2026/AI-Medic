import { supabase } from "@/integrations/supabase/client";

export type Severity = "normal" | "mild" | "moderate" | "severe";

export const SEVERITY_SCORE: Record<Severity, number> = {
  normal: 95,
  mild: 75,
  moderate: 45,
  severe: 18,
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  normal: "Normal",
  mild: "Yengil",
  moderate: "O'rtacha",
  severe: "Jiddiy",
};

export const normalizeSeverity = (s?: string | null): Severity => {
  const v = (s || "").toLowerCase();
  if (v === "mild" || v === "moderate" || v === "severe") return v;
  return "normal";
};

/** Tashxis ishonch foizidan salomatlik ballini hisoblaydi (yuqori ishonch = og'irroq holat). */
export const confidenceToScore = (confidence?: number | null) => {
  const c = Math.max(0, Math.min(100, confidence ?? 0));
  return Math.round(100 - c * 0.8);
};

export const scoreToSeverity = (score: number): Severity => {
  if (score >= 85) return "normal";
  if (score >= 65) return "mild";
  if (score >= 35) return "moderate";
  return "severe";
};

export interface HealthPoint {
  date: string;
  score: number;
  label: string;
  source: "scan" | "diagnosis";
}

/** Foydalanuvchining skan va tashxis tarixidan salomatlik dinamikasini yig'adi. */
export const loadHealthHistory = async (userId: string): Promise<HealthPoint[]> => {
  const [scans, diagnoses] = await Promise.all([
    supabase
      .from("scan_analyses")
      .select("created_at, severity, scan_type")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(40),
    supabase
      .from("diagnoses")
      .select("created_at, confidence, condition_name")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(40),
  ]);

  const points: HealthPoint[] = [];

  (scans.data || []).forEach((s: any) => {
    const sev = normalizeSeverity(s.severity);
    points.push({
      date: s.created_at,
      score: SEVERITY_SCORE[sev],
      label: `${(s.scan_type || "skan").toUpperCase()} — ${SEVERITY_LABEL[sev]}`,
      source: "scan",
    });
  });

  (diagnoses.data || []).forEach((d: any) => {
    points.push({
      date: d.created_at,
      score: confidenceToScore(d.confidence),
      label: d.condition_name || "Tashxis",
      source: "diagnosis",
    });
  });

  return points.sort((a, b) => +new Date(a.date) - +new Date(b.date)).slice(-20);
};

/** Holat yomonlashganda barcha shifokorlarga bildirishnoma yuboradi. */
export const notifyDoctorsIfWorse = async (opts: {
  currentScore: number;
  previousScore: number | null;
  patientName: string;
  detail: string;
  link?: string;
}) => {
  const { currentScore, previousScore, patientName, detail } = opts;
  const worsened =
    currentScore < 65 && (previousScore === null || currentScore < previousScore - 5);
  if (!worsened) return false;

  const { data: doctors } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("role", "doctor");

  if (!doctors || doctors.length === 0) return false;

  const rows = doctors.map((d: any) => ({
    user_id: d.user_id,
    title: "Bemor holati yomonlashdi",
    message: `${patientName}: ${detail}. Salomatlik ko'rsatkichi ${currentScore}/100${
      previousScore !== null ? ` (avval ${previousScore}/100)` : ""
    }.`,
    type: "scan",
    link: opts.link || "patients",
  }));

  const { error } = await supabase.from("notifications").insert(rows as any);
  if (error) {
    console.error("Doctor notification failed:", error.message);
    return false;
  }
  return true;
};
