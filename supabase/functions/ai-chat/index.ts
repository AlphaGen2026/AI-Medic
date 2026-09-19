import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Qat'iy rad javobi — tibbiyotdan tashqari savollarga doim shu qaytadi
const REFUSAL_TEXT = `Kechirasiz 🙏, men faqat **tibbiy va sog'liq** bilan bog'liq savollarga javob bera olaman. 🩺

Sog'lig'ingiz haqida biror savolingiz bo'lsa, bemalol so'rang! 💙`;

const systemPrompt = `Sen "Aziza" — "Sutun" loyihasining zamonaviy, mehribon va professional tibbiy AI yordamchisisan. Sen inson bilan suhbatlashayotgandek iliq, samimiy va qulay ohangda gaplash. Sen O'zbek, Rus va Ingliz tillarida aksentsiz, ona tilidek mukammal gapira olasan. Foydalanuvchi qaysi tilda murojaat qilsa, xuddi shu tilda javob ber.

Sutun loyihasi — bu masofaviy tibbiyot va sun'iy intellektga asoslangan innovatsion raqamli sog'liqni saqlash platformasi bo'lib, bemorlarga o'z uylaridan turib yuqori malakali shifokorlar bilan bog'lanish, tibbiy xulosalar olish, va sog'lig'ini nazorat qilish imkonini beradi. Platforma radiologiya (X-ray, MRI) tahlili, bemorlar monitoringi va interaktiv ovozli AI yordamchilarini o'z ichiga oladi. Agar foydalanuvchi sayt haqida so'rasa, shu ma'lumotlarga asoslanib batafsil, tushunarli va qiziqarli qilib gapirib ber.

🚫 QAT'IY CHEKLOV — FAQAT TIBBIYOT VA SUTUN LOYIHASI:
Sen FAQAT tibbiyot, sog'liq, kasalliklar, profilaktika va "Sutun" loyihasi (sayt haqida) mavzularida javob berasan. Boshqa mavzularga o'tma. 

🎯 ASOSIY QOIDALAR:
1. **Multilingual**: Foydalanuvchi qaysi tilda yozsa (O'zbek, Rus, Ingliz), sen ham shu tilda benuqson, xatosiz va tabiiy javob qaytar.
2. **Emoji va format**: Har bir javobni tegishli emoji bilan bezab yoz. Markdown formatda chiroyli javob yoz.
3. **ChatGPT uslubida**: Samimiy suhbat qur.
4. **Ovozli boshqaruv qobiliyati (Muhim!)**: 
   Agar foydalanuvchi saytda biror narsa qilishni (masalan: "Dashboardga o't", "Asosiy panelni och", "AI chatga kir", "Bemorlar ro'yxatini ko'rsat", "Shifokorlar bo'limiga o't") so'rasa, matnli javobing oxiriga quyidagi maxsus JSON blokni yashirin tarzda qo'shib qo'y:
   COMMAND: {"action": "navigate", "target": "tab_nomi"}
   Mavjud tab_nomi ro'yxati: "dashboard", "radiologist", "advisor", "patients", "chat", "aichat", "voiceai", "profile", "doctors", "appointments", "prescriptions", "dailyroutine", "map".
   Masalan: "Tushundim, hozir AI chat bo'limiga o'tkazaman! COMMAND: {\"action\": \"navigate\", \"target\": \"aichat\"}"
5. Jiddiy holatda albatta shifokorga murojaat qilishni tavsiya qil.
6. Javob oxirida doim eslatma qo'y.

📝 JAVOB FORMATI NAMUNASI:
"Ajoyib savol! 🌟

🩺 **[Mavzu nomi]**

[Batafsil tushuntirish emoji bilan]

💡 **Tavsiyalar:**
- Tavsiya 1

⚠️ *Bu AI maslahati bo'lib, professional tibbiy tekshiruv o'rnini bosmaydi.*"`;

/**
 * 1-BOSQICH: savol tibbiyotga tegishlimi? — alohida klassifikatsiya chaqiruvi.
 * NOT_MEDICAL bo'lsa, asosiy model umuman chaqirilmaydi — qat'iy rad qaytadi.
 * MEDICAL bo'lsa, oddiy javob oqimi davom etadi.
 */
async function classifyMedical(text: string, hasAttachment: boolean): Promise<boolean> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return true; // kalit bo'lmasa — tekshiruvsiz o'tkazamiz

  const classifierPrompt = `Sen savol-tibbiyot klassifikatorisan. Foydalanuvchi xabari TIBBIYOT yoki SOG'LIQ mavzusiga tegishlimi aniqlang.

TIBBIYOT hisoblanadi: kasalliklar, alomatlar (og'riq, isitma va h.k.), dori-darmonlar, davolash, profilaktika, ovqatlanish/dieta, sog'lom turmush tarzi, sport jarohatlari va tiklanish, ruhiy salomatlik, tibbiy tahlillar, shifokorlar, stomatologiya, ko'z qorachiqlari, homiladorlik, bolalar salomatligi, veterinar masalalari, tibbiy hujjat/rasm tahlili.
TIBBIYOT EMAS: dasturlash, matematika, tarix, siyosat, sport natijalari, o'yinlar, tarjima, she'r yozish, biznes, texnika, umumiy suhbat (salom, hazil), va boshqa barcha nontibbiy mavzular.

⚠️ Qoida: xabar o'zbek, rus yoki ingliz tilida bo'lishi mumkin. Faqat bitta so'z bilan javob ber: MEDICAL yoki NOT_MEDICAL.

Foydalanuvchi xabari: """${text}"""`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: classifierPrompt }],
        max_tokens: 5,
        temperature: 0,
      }),
    });
    if (!res.ok) return true; // tekshiruv xatosi — oqimni to'xtatmaymiz
    const data = await res.json();
    const verdict = String(data?.choices?.[0]?.message?.content || "").toUpperCase();
    if (verdict.includes("NOT_MEDICAL")) return false;
    return true;
  } catch {
    return true; // tekshiruv xatosi — oqimni to'xtatmaymiz
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userMessage, attachmentUrl, attachmentType, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not set");

    // Kontekst uchun so'nggi xabarlar
    const history = (messages || [])
      .filter((m: any) => m.role && m.content)
      .slice(-10)
      .map((m: any) => ({ role: m.role, content: m.content }));

    // Build user message: multimodal if image attached
    let userContent: any = userMessage || "Iltimos, ushbu materialni tibbiy nuqtai nazardan tahlil qiling.";
    const isImage = attachmentUrl && (attachmentType === "image" || /\.(png|jpe?g|webp|gif|bmp)$/i.test(attachmentUrl));
    if (attachmentUrl && isImage) {
      userContent = [
        { type: "text", text: userMessage || "Ushbu rasmni tibbiy nuqtai nazardan tahlil qiling. Nima ko'rinmoqda va qanday tavsiyalar berasiz?" },
        { type: "image_url", image_url: { url: attachmentUrl } },
      ];
    } else if (attachmentUrl) {
      userContent = `${userMessage || "Quyidagi hujjatni tahlil qiling"}\n\nFayl: ${fileName || attachmentUrl}\nURL: ${attachmentUrl}`;
    }

    // ==== FAQAT TIBBIYOT TEKSHIRUVI (qat'iy server-side guard) ====
    // Rasm yuborilgan, lekin matn yo'q bo'lsa — tibbiy tahlil so'rovi deb qabul qilamiz.
    const textToCheck = userMessage || (attachmentUrl ? (fileName || "rasm/fayl tahlili") : "");
    if (textToCheck.trim()) {
      const contextTail = history
        .slice(-4)
        .map((m: any) => `${m.role === "user" ? "F" : "AI"}: ${String(m.content).slice(0, 200)}`)
        .join("\n");
      const isMedical = await classifyMedical(
        (contextTail ? `Suhbat konteksti:\n${contextTail}\n\nYangi xabar: ` : "") + textToCheck,
        !!attachmentUrl
      );
      if (!isMedical) {
        return new Response(JSON.stringify({ response: REFUSAL_TEXT }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ response: "So'rovlar limiti oshib ketdi. Iltimos, biroz kuting." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ response: "AI kreditlari tugadi. Iltimos, ish maydoniga kreditlar qo'shing." }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content
      || "Kechirasiz, javob bera olmadim. Shifokorga murojaat qiling.";

    return new Response(JSON.stringify({ response: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(
      JSON.stringify({ response: "Kechirasiz, xizmat vaqtincha mavjud emas. Shifokorga murojaat qiling." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
