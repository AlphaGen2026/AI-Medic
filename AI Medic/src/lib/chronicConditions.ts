import { supabase } from "@/integrations/supabase/client";

export interface ChronicCondition {
  id: string;
  label: string;
  group: string;
  /** faqat ayol foydalanuvchilar uchun ko'rsatiladi */
  femaleOnly?: boolean;
}

export const MAX_CHRONIC = 3;

export const CHRONIC_CONDITIONS: ChronicCondition[] = [
  { id: "diabet1", label: "Qandli diabet (1-tur)", group: "Endokrin" },
  { id: "diabet2", label: "Qandli diabet (2-tur)", group: "Endokrin" },
  { id: "gipotireoz", label: "Gipotireoz (qalqonsimon bez)", group: "Endokrin" },
  { id: "gipertireoz", label: "Gipertireoz (qalqonsimon bez)", group: "Endokrin" },
  { id: "semizlik", label: "Semizlik", group: "Endokrin" },
  { id: "gipertoniya", label: "Gipertoniya (yuqori bosim)", group: "Yurak-qon tomir" },
  { id: "ishemiya", label: "Yurak ishemik kasalligi", group: "Yurak-qon tomir" },
  { id: "aritmiya", label: "Aritmiya", group: "Yurak-qon tomir" },
  { id: "xolesterin", label: "Yuqori xolesterin", group: "Yurak-qon tomir" },
  { id: "astma", label: "Bronxial astma", group: "Nafas" },
  { id: "xobl", label: "XOBL (surunkali bronxit)", group: "Nafas" },
  { id: "apnoe", label: "Uyqu apnoesi", group: "Nafas" },
  { id: "gastrit", label: "Surunkali gastrit / yara", group: "Ovqat hazm" },
  { id: "jigar", label: "Surunkali jigar kasalligi", group: "Ovqat hazm" },
  { id: "kolit", label: "Surunkali kolit / IBS", group: "Ovqat hazm" },
  { id: "buyrak", label: "Surunkali buyrak kasalligi", group: "Siydik" },
  { id: "artrit", label: "Artrit / artroz", group: "Tayanch-harakat" },
  { id: "osteoporoz", label: "Osteoporoz", group: "Tayanch-harakat" },
  { id: "podagra", label: "Podagra", group: "Tayanch-harakat" },
  { id: "migren", label: "Migren", group: "Nerv" },
  { id: "epilepsiya", label: "Epilepsiya", group: "Nerv" },
  { id: "depressiya", label: "Depressiya / xavotir", group: "Nerv" },
  { id: "anemiya", label: "Anemiya (kamqonlik)", group: "Qon" },
  { id: "allergiya", label: "Surunkali allergiya", group: "Immunitet" },
  { id: "homiladorlik", label: "Homiladorlik", group: "Ayollar salomatligi", femaleOnly: true },
  { id: "emizish", label: "Emizish davri", group: "Ayollar salomatligi", femaleOnly: true },
];

export const PREGNANCY_ID = "homiladorlik";

/** Jinsga mos kasalliklar ro'yxati (homiladorlik faqat ayollar uchun) */
export const conditionsForGender = (gender?: string) =>
  CHRONIC_CONDITIONS.filter((c) => !c.femaleOnly || gender === "female");

export const conditionLabel = (id: string) =>
  CHRONIC_CONDITIONS.find((c) => c.id === id)?.label ?? id;

/** user_metadata dan surunkali kasalliklarni o'qiydi */
export const readChronic = (meta: any): { ids: string[]; none: boolean } => ({
  ids: Array.isArray(meta?.chronic_conditions) ? meta.chronic_conditions.slice(0, MAX_CHRONIC) : [],
  none: meta?.chronic_none === true,
});

export const saveChronic = async (ids: string[], none: boolean) => {
  const { error } = await supabase.auth.updateUser({
    data: { chronic_conditions: none ? [] : ids.slice(0, MAX_CHRONIC), chronic_none: none },
  });
  if (error) throw error;
};

/* ------------------------- Kunlik rejim ------------------------- */

export type RoutineCategory = "uyqu" | "ovqat" | "mashq" | "ish" | "dori" | "suv";

export interface RoutineStep {
  time: string; // "07:00"
  title: string;
  category: RoutineCategory;
  detail: string;
  reason: string;
}

export interface DailyRoutine {
  createdAt: string;
  conditions: string[];
  steps: RoutineStep[];
}

export const CATEGORY_LABEL: Record<RoutineCategory, string> = {
  uyqu: "Uyqu",
  ovqat: "Ovqatlanish",
  mashq: "Mashq",
  ish: "Ish / dam",
  dori: "Dori / nazorat",
  suv: "Suv",
};

const ROUTINE_KEY = (uid: string) => `routine:${uid}`;
const PROGRESS_KEY = (uid: string, date: string) => `routine-progress:${uid}:${date}`;
export const todayKey = () => new Date().toISOString().slice(0, 10);

export const loadRoutine = (uid: string): DailyRoutine | null => {
  try {
    const raw = localStorage.getItem(ROUTINE_KEY(uid));
    return raw ? (JSON.parse(raw) as DailyRoutine) : null;
  } catch {
    return null;
  }
};

export const storeRoutine = (uid: string, routine: DailyRoutine) => {
  localStorage.setItem(ROUTINE_KEY(uid), JSON.stringify(routine));
  supabase.auth.updateUser({ data: { daily_routine: routine } }).catch(() => {});
};

export const clearRoutine = (uid: string) => {
  localStorage.removeItem(ROUTINE_KEY(uid));
  supabase.auth.updateUser({ data: { daily_routine: null } }).catch(() => {});
};

export const loadProgress = (uid: string): string[] => {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY(uid, todayKey()));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
};

export const storeProgress = (uid: string, done: string[]) =>
  localStorage.setItem(PROGRESS_KEY(uid, todayKey()), JSON.stringify(done));

export const minutesOf = (time: string) => {
  const [h, m] = time.split(":").map((n) => parseInt(n, 10));
  return (isNaN(h) ? 0 : h) * 60 + (isNaN(m) ? 0 : m);
};

const FALLBACK_STEPS: RoutineStep[] = [
  { time: "07:00", title: "Uyg'onish", category: "uyqu", detail: "Har kuni bir xil vaqtda turing, 1 stakan suv iching.", reason: "Barqaror biologik soat umumiy salomatlikni yaxshilaydi." },
  { time: "07:30", title: "Yengil mashq", category: "mashq", detail: "10–15 daqiqa cho'zilish yoki yurish.", reason: "Qon aylanishini faollashtiradi." },
  { time: "08:00", title: "Nonushta", category: "ovqat", detail: "Oqsil va murakkab uglevodli nonushta.", reason: "Kun davomida energiya barqarorligi." },
  { time: "10:30", title: "Suv va tanaffus", category: "suv", detail: "1 stakan suv, 5 daqiqa tanaffus.", reason: "Suvsizlanish va charchoqning oldini oladi." },
  { time: "13:00", title: "Tushlik", category: "ovqat", detail: "Sabzavot, oqsil va don mahsulotlari.", reason: "Muvozanatli ovqatlanish." },
  { time: "15:00", title: "Ish tanaffusi", category: "ish", detail: "10 daqiqa yurish, ko'z uchun dam.", reason: "Uzoq o'tirish zararini kamaytiradi." },
  { time: "18:00", title: "Mashq", category: "mashq", detail: "30 daqiqa o'rtacha tezlikda yurish.", reason: "Yurak-qon tomir salomatligi." },
  { time: "19:30", title: "Kechki ovqat", category: "ovqat", detail: "Yengil, uxlashdan 3 soat oldin.", reason: "Sifatli uyqu uchun." },
  { time: "22:30", title: "Uxlash", category: "uyqu", detail: "Ekranlarsiz, 7–8 soat uyqu.", reason: "Tiklanish va immunitet." },
];

const extractJson = (text: string): any | null => {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
};

const VALID_CATS: RoutineCategory[] = ["uyqu", "ovqat", "mashq", "ish", "dori", "suv"];

const normalizeSteps = (raw: any): RoutineStep[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s: any) => ({
      time: typeof s?.time === "string" && /^\d{1,2}:\d{2}$/.test(s.time.trim())
        ? s.time.trim().padStart(5, "0")
        : "",
      title: String(s?.title ?? "").slice(0, 60),
      category: (VALID_CATS.includes(s?.category) ? s.category : "ish") as RoutineCategory,
      detail: String(s?.detail ?? "").slice(0, 240),
      reason: String(s?.reason ?? "").slice(0, 240),
    }))
    .filter((s) => s.time && s.title)
    .sort((a, b) => minutesOf(a.time) - minutesOf(b.time))
    .slice(0, 14);
};

/** AI orqali shaxsiy kunlik rejim tuzadi (ai-chat edge funksiyasi) */
export const generateRoutine = async (input: {
  conditions: string[];
  none: boolean;
  age?: string;
  gender?: string;
}): Promise<DailyRoutine> => {
  const list = input.none || input.conditions.length === 0
    ? "Surunkali kasallik yo'q (sog'lom turmush tarzi uchun rejim)"
    : input.conditions.map(conditionLabel).join(", ");

  const pregnant = !input.none && input.conditions.includes(PREGNANCY_ID);

  const pregnancyRules = pregnant
    ? `\nMUHIM: foydalanuvchi HOMILADOR. Rejim homiladorlikka moslashtirilsin: folat kislotasi va temir qo'shimchalari eslatmasi, kuniga 5 mahal yengil ovqat, 2–2.5 litr suv, chanoq va nafas mashqlari (og'ir yuklama yo'q, qorin ustida yotish yo'q), kunduzgi 30 daqiqalik dam, chap yonboshda uxlash, kofein va xom mahsulotlardan saqlanish, shifokor nazorati eslatmasi. Har bir qadam sababi homiladorlikka bog'lansin.\n`
    : "";

  const prompt = `Menga shaxsiy KUNLIK TIBBIY REJIM tuzib ber.
Surunkali kasalliklar / holat: ${list}.
Yosh: ${input.age || "noma'lum"}. Jins: ${input.gender || "noma'lum"}.
${pregnancyRules}


Faqat JSON qaytar, boshqa matn yozma. Format:
{"steps":[{"time":"07:00","title":"Uyg'onish","category":"uyqu","detail":"qisqa ko'rsatma","reason":"nima uchun, kasallikka bog'lab"}]}
Qoidalar: 9–12 ta qadam; category faqat quyidagilardan biri: uyqu, ovqat, mashq, ish, dori, suv; vaqtlar 24 soat formatida va o'sish tartibida; uyg'onish, nonushta, tushlik, kechki ovqat, suv, mashq, ish tanaffusi, dori/nazorat (kasallikka mos bo'lsa) va uxlash bo'lsin; matnlar o'zbek tilida va qisqa.`;

  try {
    const { data, error } = await supabase.functions.invoke("ai-chat", {
      body: { userMessage: prompt, messages: [] },
    });
    if (error) throw error;
    const text = data?.response || data?.diagnosis || "";
    const parsed = extractJson(text);
    const steps = normalizeSteps(parsed?.steps);
    if (steps.length >= 4) {
      return { createdAt: new Date().toISOString(), conditions: input.none ? [] : input.conditions, steps };
    }
  } catch (e) {
    console.error("Routine generation failed", e);
  }
  return {
    createdAt: new Date().toISOString(),
    conditions: input.none ? [] : input.conditions,
    steps: pregnant ? PREGNANCY_STEPS : FALLBACK_STEPS,
  };
};
