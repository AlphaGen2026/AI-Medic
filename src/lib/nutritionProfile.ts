import type { SafetyProfile } from "@/components/modules/NutritionSafety";

export type AgeGroup = SafetyProfile["ageGroup"];

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number | null;
  gender?: "erkak" | "ayol";
  conditions: string[];
}

export const RELATIONS = [
  "Ona",
  "Ota",
  "O'g'il",
  "Qiz",
  "Xotin",
  "Er",
  "Aka",
  "Uka",
  "Opa",
  "Singil",
  "Buva",
  "Buvi",
  "Nabira",
  "Amaki",
  "Amma",
  "Tog'a",
  "Xola",
  "Qaynona",
  "Qaynota",
  "Kelin",
  "Kuyov",
  "Boshqa",
] as const;

/** Yoshdan avtomatik yosh guruhini aniqlaydi */
export const ageToGroup = (age: number | null | undefined): AgeGroup => {
  if (age == null || Number.isNaN(age)) return "katta";
  if (age <= 12) return "bola";
  if (age <= 17) return "osmir";
  if (age <= 59) return "katta";
  return "keksa";
};

export const parseAge = (raw: unknown): number | null => {
  const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  if (Number.isNaN(n) || n < 0 || n > 120) return null;
  return n;
};

export const AGE_GROUP_LABEL: Record<AgeGroup, string> = {
  bola: "Bola (0–12)",
  osmir: "O'smir (13–17)",
  katta: "Katta (18–59)",
  keksa: "Keksa (60+)",
};

/** Shifokor tashhisi matnidan salomatlik holatlarini avtomatik aniqlaydi */
const DIAGNOSIS_KEYWORDS: { id: string; words: string[] }[] = [
  { id: "diabet", words: ["diabet", "диабет", "diabetes", "qand kasalligi", "qandli", "gipoglik", "giperglik"] },
  { id: "gipertoniya", words: ["gipertoniya", "гипертони", "hypertension", "yuqori bosim", "arterial bosim", "qon bosimi"] },
  { id: "homiladorlik", words: ["homilador", "беремен", "pregnan", "gestatsion"] },
  { id: "buyrak", words: ["buyrak", "почеч", "почк", "renal", "nefrit", "nefropat", "kidney"] },
  { id: "allergiya", words: ["allergi", "аллерг", "anafilak", "atopik"] },
  { id: "ovqat_buzilishi", words: ["anoreks", "bulim", "ovqatlanish buzilishi", "расстройств питан", "eating disorder"] },
];

export const conditionsFromDiagnoses = (texts: (string | null | undefined)[]): string[] => {
  const hay = texts.filter(Boolean).join(" ").toLowerCase();
  if (!hay) return [];
  return DIAGNOSIS_KEYWORDS.filter((k) => k.words.some((w) => hay.includes(w))).map((k) => k.id);
};

/** Rasmdagi ovqat va vaqtga qarab qaysi mahal ovqati ekanini taxmin qiladi */
export interface MealGuess {
  id: "nonushta" | "tushlik" | "kechki" | "gazak";
  label: string;
  reason: string;
}

const MEAL_LABEL: Record<MealGuess["id"], string> = {
  nonushta: "Nonushta",
  tushlik: "Tushlik",
  kechki: "Kechki ovqat",
  gazak: "Gazak",
};

const BREAKFAST_WORDS = ["tuxum", "omlet", "yaichnitsa", "bo'tqa", "botqa", "kasha", "smetana", "tvorog", "syrniki", "pancake", "bliny", "muesli", "granola", "yogurt", "yogurt", "sut", "pishloq", "non va choy", "kofe", "toast", "bugirsoq"];
const SNACK_WORDS = ["meva", "olma", "banan", "yong'oq", "yongoq", "quruq meva", "pechenye", "shokolad", "batonchik", "chips", "kraker", "smuzi", "sok", "salat bargi"];
const HEAVY_WORDS = ["osh", "palov", "plov", "sho'rva", "shorva", "lag'mon", "lagmon", "mastava", "manti", "kabob", "steyk", "gulyash", "makaron", "pasta", "guruch", "kartoshka", "go'sht", "gosht", "burger", "pitsa", "pizza"];

const CONDITION_LABEL: Record<string, string> = {
  diabet: "diabet",
  gipertoniya: "yuqori bosim",
  homiladorlik: "homiladorlik",
  buyrak: "buyrak kasalligi",
  allergiya: "ovqat allergiyasi",
  ovqat_buzilishi: "ovqatlanish buzilishi",
};

export const guessMeal = (
  dish: string,
  items: string[],
  calories: number,
  now: Date = new Date(),
  conditions: string[] = [],
): MealGuess => {
  const text = `${dish} ${items.join(" ")}`.toLowerCase();
  const hour = now.getHours();

  const hasAny = (list: string[]) => list.some((w) => text.includes(w));

  // Shifokor tashhisi bor bo'lsa — og'ir/kaloriyali taomni kechki ovqatga emas,
  // kunduzgi ovqatga (tushlik) yoki yengil gazakka yo'naltiramiz
  const care = conditions.filter((c) => CONDITION_LABEL[c]).map((c) => CONDITION_LABEL[c]);
  if (care.length > 0) {
    if (calories >= 600) {
      return {
        id: hour < 11 ? "nonushta" : "tushlik",
        label: hour < 11 ? MEAL_LABEL.nonushta : MEAL_LABEL.tushlik,
        reason: `${Math.round(calories)} kkal — ${care.join(", ")} uchun og'ir; kechqurun emas, kunduzi yeyilgani ma'qul`,
      };
    }
    if (calories < 250) {
      return {
        id: "gazak",
        label: MEAL_LABEL.gazak,
        reason: `Yengil porsiya (${Math.round(calories)} kkal) — ${care.join(", ")} uchun gazak sifatida mos`,
      };
    }
  }


  if (hasAny(BREAKFAST_WORDS) && calories < 700) {
    return { id: "nonushta", label: MEAL_LABEL.nonushta, reason: "Taom tarkibi ertalabki ovqatga xos" };
  }
  if (calories < 250 || (hasAny(SNACK_WORDS) && calories < 400)) {
    return { id: "gazak", label: MEAL_LABEL.gazak, reason: `Porsiya yengil (${Math.round(calories)} kkal) — gazakka mos` };
  }
  if (hasAny(HEAVY_WORDS) && calories >= 500) {
    if (hour >= 17) {
      return { id: "kechki", label: MEAL_LABEL.kechki, reason: "To'yimli taom, hozir kechki ovqat vaqti" };
    }
    return { id: "tushlik", label: MEAL_LABEL.tushlik, reason: "To'yimli asosiy taom — tushlikka mos" };
  }
  if (hour < 11) return { id: "nonushta", label: MEAL_LABEL.nonushta, reason: "Ertalabki vaqt" };
  if (hour < 16) return { id: "tushlik", label: MEAL_LABEL.tushlik, reason: "Kunduzgi vaqt" };
  if (hour < 22) return { id: "kechki", label: MEAL_LABEL.kechki, reason: "Kechki vaqt" };
  return { id: "gazak", label: MEAL_LABEL.gazak, reason: "Kech tundagi yengil ovqat" };
};
