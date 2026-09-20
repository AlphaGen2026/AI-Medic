import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export type VoiceLang = "uz" | "ru" | "en";

export const VOICE_LANGS: Record<
  VoiceLang,
  { label: string; flag: string; speech: string; bcp: string }
> = {
  uz: { label: "O'zbekcha", flag: "🇺🇿", speech: "uz-UZ", bcp: "uz-UZ" },
  ru: { label: "Русский", flag: "🇷🇺", speech: "ru-RU", bcp: "ru-RU" },
  en: { label: "English", flag: "🇬🇧", speech: "en-US", bcp: "en-US" },
};

export const BOBUR_NAME = "Bobur";

export const UI_TEXT: Record<VoiceLang, Record<string, string>> = {
  uz: {
    title: "Bobur — Ovozli Yordamchi",
    subtitle: "Sog'lig'ingizni nazorat qiluvchi shaxsiy ovozli yordamchi",
    idle: "Suhbatni boshlash uchun pastdagi tugmani bosing",
    listening: "Eshitmoqdaman...",
    thinking: "O'ylayapman...",
    hint: "Masalan: \"Bobur, meni Aziz doktor qabuliga soat 15:00 ga yozib qo'y\"",
    error: "Ulanishda xatolik yuz berdi.",
    noSpeech: "Ovozni aniqlashda xatolik yuz berdi",
    unsupported: "Brauzeringiz ovozli xizmatni qo'llab-quvvatlamaydi",
  },
  ru: {
    title: "Бобур — Голосовой помощник",
    subtitle: "Личный голосовой помощник, следящий за вашим здоровьем",
    idle: "Нажмите кнопку ниже, чтобы начать разговор",
    listening: "Слушаю...",
    thinking: "Думаю...",
    hint: "Например: «Бобур, запиши меня к доктору Азизу на 15:00»",
    error: "Произошла ошибка подключения.",
    noSpeech: "Ошибка распознавания речи",
    unsupported: "Ваш браузер не поддерживает голосовые функции",
  },
  en: {
    title: "Bobur — Voice Assistant",
    subtitle: "Your personal voice assistant watching over your health",
    idle: "Press the button below to start talking",
    listening: "Listening...",
    thinking: "Thinking...",
    hint: 'For example: "Bobur, book me with doctor Aziz at 3 pm"',
    error: "Connection error occurred.",
    noSpeech: "Speech recognition error",
    unsupported: "Your browser does not support voice features",
  },
};

export const IDENTITY_ANSWER: Record<VoiceLang, string> = {
  uz: "Men Boburman, sizning sog'lig'ingizni nazorat qilib turaman.",
  ru: "Я Бобур, я слежу за вашим здоровьем.",
  en: "I am Bobur, and I look after your health.",
};

const IDENTITY_PATTERNS = [
  /kimsan/i,
  /kimsiz/i,
  /isming/i,
  /o'?zingni tanishtir/i,
  /кто ты/i,
  /кто вы/i,
  /как тебя зовут/i,
  /представься/i,
  /who are you/i,
  /what'?s your name/i,
  /introduce yourself/i,
];

export function isIdentityQuestion(text: string) {
  return IDENTITY_PATTERNS.some((p) => p.test(text));
}

/** App sections the assistant can open by voice. */
const NAV_TARGETS: { target: string; words: string[] }[] = [
  { target: "dashboard", words: ["dashboard", "bosh sahifa", "boshsahifa", "главная", "панель", "home"] },
  { target: "appointments", words: ["qabul", "qabullar", "приём", "прием", "записи", "appointment", "appointments"] },
  { target: "prescriptions", words: ["retsept", "рецепт", "prescription"] },
  { target: "doctors", words: ["shifokor", "doktorlar", "врачи", "doctors"] },
  { target: "radiologist", words: ["radiolog", "рентген", "radiologist", "skan", "скан"] },
  { target: "advisor", words: ["maslahat", "assistant", "советник", "ассистент"] },
  { target: "chat", words: ["chat", "suhbat", "чат"] },
  { target: "dailyroutine", words: ["kunlik rejim", "rejim", "режим дня", "routine"] },
  { target: "profile", words: ["profil", "профиль", "profile"] },
];

export interface VoiceCommand {
  kind: "navigate" | "book";
  target?: string;
  doctorHint?: string;
  time?: string; // HH:mm
  date?: string; // yyyy-MM-dd
}

const BOOK_WORDS = [
  "yozib qo'y",
  "yozib qoy",
  "yozib ber",
  "band qil",
  "qabuliga yoz",
  "запиши",
  "записать",
  "забронируй",
  "book",
  "schedule",
  "make an appointment",
];

function parseTime(text: string): string | null {
  const lowered = text.toLowerCase();
  // 14:30 / 14.30
  const exact = lowered.match(/(\d{1,2})[:.](\d{2})/);
  if (exact) {
    const h = Number(exact[1]);
    const m = Number(exact[2]);
    if (h < 24 && m < 60) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  // "soat 15", "в 15", "at 3 pm"
  const loose = lowered.match(/(?:soat|в|at)\s*(\d{1,2})\s*(pm|am|ga|da|часов|часа)?/);
  if (loose) {
    let h = Number(loose[1]);
    if (loose[2] === "pm" && h < 12) h += 12;
    if (loose[2] === "am" && h === 12) h = 0;
    if (h < 24) return `${String(h).padStart(2, "0")}:00`;
  }
  return null;
}

function parseDate(text: string): string {
  const lowered = text.toLowerCase();
  const d = new Date();
  if (/ertaga|завтра|tomorrow/.test(lowered)) d.setDate(d.getDate() + 1);
  return format(d, "yyyy-MM-dd");
}

export function parseVoiceCommand(text: string): VoiceCommand | null {
  const lowered = text.toLowerCase();

  const isBooking = BOOK_WORDS.some((w) => lowered.includes(w));
  if (isBooking) {
    return {
      kind: "book",
      time: parseTime(lowered) || undefined,
      date: parseDate(lowered),
      doctorHint: lowered,
    };
  }

  const wantsNav = /(kir|och|o'?tkaz|ochib ber|открой|перейди|зайди|open|go to|show)/.test(lowered);
  if (wantsNav) {
    for (const t of NAV_TARGETS) {
      if (t.words.some((w) => lowered.includes(w))) return { kind: "navigate", target: t.target };
    }
  }
  return null;
}

export function navigateApp(target: string) {
  window.dispatchEvent(new CustomEvent("app:navigate", { detail: target }));
}

interface DoctorRow {
  user_id: string;
  full_name: string | null;
  specialty: string | null;
}

/** Pick the doctor whose name appears in the spoken phrase. */
function matchDoctor(doctors: DoctorRow[], phrase: string): DoctorRow | null {
  const lowered = phrase.toLowerCase();
  let best: { doc: DoctorRow; score: number } | null = null;
  for (const doc of doctors) {
    const name = (doc.full_name || "").toLowerCase();
    if (!name) continue;
    for (const part of name.split(/\s+/)) {
      if (part.length >= 3 && lowered.includes(part)) {
        const score = part.length;
        if (!best || score > best.score) best = { doc, score };
      }
    }
  }
  return best?.doc ?? null;
}

const SAY: Record<VoiceLang, Record<string, (a?: string, b?: string) => string>> = {
  uz: {
    noDoctor: () => "Kechirasiz, bu ismli shifokorni topa olmadim. Iltimos, shifokor ismini aniq ayting.",
    noTime: () => "Iltimos, qaysi soatga yozishimni ayting. Masalan: soat 15:00 ga.",
    noSlot: (d, t) => `${d} shifokorda ${t} vaqtida bo'sh o'rin yo'q. Boshqa vaqt tanlaymizmi?`,
    failed: () => "Qabulga yozishda xatolik yuz berdi.",
    ok: (d, t) => `Tayyor! Sizni ${d} shifokor qabuliga soat ${t} ga yozib qo'ydim. Qabullar bo'limini ochdim.`,
    navigated: () => "Ochdim.",
  },
  ru: {
    noDoctor: () => "Извините, я не нашёл врача с таким именем. Пожалуйста, назовите имя точнее.",
    noTime: () => "Пожалуйста, скажите, на какое время записать. Например: на 15:00.",
    noSlot: (d, t) => `У врача ${d} нет свободного времени на ${t}. Выберем другое время?`,
    failed: () => "Не удалось записать на приём.",
    ok: (d, t) => `Готово! Я записал вас к врачу ${d} на ${t}. Открываю раздел приёмов.`,
    navigated: () => "Открыл.",
  },
  en: {
    noDoctor: () => "Sorry, I could not find a doctor with that name. Please say the name again.",
    noTime: () => "Please tell me the time. For example: at 3 pm.",
    noSlot: (d, t) => `Doctor ${d} has no free slot at ${t}. Shall we pick another time?`,
    failed: () => "I could not create the appointment.",
    ok: (d, t) => `Done! I booked you with doctor ${d} at ${t}. Opening the appointments section.`,
    navigated: () => "Opened.",
  },
};

/** Executes a parsed command on behalf of the user. Returns what Bobur should say. */
export async function executeVoiceCommand(
  cmd: VoiceCommand,
  lang: VoiceLang,
  userId: string,
): Promise<string> {
  const say = SAY[lang];

  if (cmd.kind === "navigate" && cmd.target) {
    navigateApp(cmd.target);
    return say.navigated();
  }

  if (cmd.kind !== "book") return say.failed();

  if (!cmd.time) return say.noTime();

  const { data: docsData } = await supabase.rpc("get_public_doctors" as any);
  const doctors = (docsData as DoctorRow[]) || [];
  const doctor = matchDoctor(doctors, cmd.doctorHint || "");
  if (!doctor) return say.noDoctor();

  const day = cmd.date || format(new Date(), "yyyy-MM-dd");

  const { data: availData } = await supabase.rpc("get_doctor_availability" as any, {
    _doctor_id: doctor.user_id,
    _day: day,
  });
  const availability = (availData as any[]) || [];

  const [hh, mm] = cmd.time.split(":").map(Number);
  const wanted = hh * 60 + mm;
  const block = availability.find((a) => {
    const [ash, asm] = String(a.start_time).split(":").map(Number);
    const [aeh, aem] = String(a.end_time).split(":").map(Number);
    return wanted >= ash * 60 + asm && wanted < aeh * 60 + aem;
  });
  if (!block) return say.noSlot(doctor.full_name || "", cmd.time);

  const scheduled = new Date(`${day}T${cmd.time}:00`);
  const scheduledIso = scheduled.toISOString();

  const { data: booked } = await supabase.rpc("get_booked_slots", {
    _doctor_id: doctor.user_id,
    _day: day,
  });
  const taken = ((booked as { scheduled_at: string }[]) || []).some(
    (b) => new Date(b.scheduled_at).getTime() === scheduled.getTime(),
  );
  if (taken) return say.noSlot(doctor.full_name || "", cmd.time);

  const { error } = await supabase.from("appointments").insert({
    doctor_id: doctor.user_id,
    patient_id: userId,
    scheduled_at: scheduledIso,
    duration_minutes: block.slot_minutes || 30,
    reason: null,
    location_name: block.location_name || null,
    location_address: block.location_address || null,
    location_coords: block.location_coords || null,
  });
  if (error) return say.failed();

  navigateApp("appointments");
  return say.ok(doctor.full_name || "", cmd.time);
}
