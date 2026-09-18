# Surunkali kasalliklar + AI kunlik rejim nazorati

## Maqsad
Foydalanuvchi profilga kirgach "Surunkali kasalliklar" bo'limini ko'radi, ro'yxatdan eng ko'pi bilan 3 tasini tanlaydi (yoki "Yo'q / —" belgilaydi). Tanlovga qarab AI shaxsiy kunlik rejim tuzadi: uyqu, ovqatlanish, mashq, ish/dam. Ilova bu rejimni real vaqtda kuzatib boradi va vaqti kelganda bildirishnoma yuboradi.

## 1. Profilda surunkali kasalliklar bo'limi
- Profil sahifasida yangi karta: "Surunkali kasalliklar".
- Tugma bosilganda oyna (dialog) ochiladi va barcha surunkali kasalliklar ro'yxati chiqadi: diabet (1/2-tur), gipertoniya, yurak ishemiyasi, astma, YOSK (XOBL), surunkali gastrit/yara, buyrak kasalligi, jigar kasalligi, qalqonsimon bez (gipo/gipertireoz), artrit/artroz, osteoporoz, anemiya, migren, epilepsiya, allergiya, semizlik, xolesterin yuqoriligi, podagra, depressiya/xavotir, uyqu apnoesi.
- Qidiruv maydoni bor; maksimum 3 ta tanlanadi, 4-chisini tanlab bo'lmaydi (izoh chiqadi).
- "Surunkali kasalligim yo'q" tugmasi — bu holda profilda "—" (minus) ko'rsatiladi va AI rejim umumiy sog'lom turmush tarzi bo'yicha tuziladi.
- Profil kartasida tanlanganlar chip ko'rinishida, yo'q bo'lsa katta "—" belgisi turadi.

## 2. AI kunlik rejim (real vaqt)
- "Rejim tuzish" tugmasi — tanlangan kasalliklar, yosh, jins va oxirgi AI tashxislar asosida AI kunlik jadval qaytaradi.
- Jadval elementlari: uyg'onish, nonushta, tushlik, kechki ovqat, suv ichish, dori/nazorat vaqti, mashq (turi va davomiyligi), ish/tanaffus bloklari, uxlash vaqti. Har biri vaqt + qisqa izoh + nima uchun (kasallikka bog'liq).
- Sahifada bugungi jadval vaqt bo'yicha ko'rsatiladi: o'tgan, hozirgi (jonli ajratilgan) va keyingi qadam; har birini "bajarildi" deb belgilash mumkin.
- Bajarilish foizi va kunlik ketma-ketlik (streak) ko'rsatiladi.

## 3. Nazorat va bildirishnomalar
- Ilova ochiq bo'lganda har daqiqada joriy vaqt tekshiriladi; qadam vaqti kelganda mavjud bildirishnomalar tizimiga yozuv qo'shiladi va qo'ng'iroqcha belgisida chiqadi.
- Brauzer bildirishnomalariga ruxsat so'raladi; ruxsat berilsa tizim darajasida ham eslatma chiqadi.
- Bir qadam uchun kuniga faqat bir marta eslatma yuboriladi (takror yo'q).
- Kechqurun o'tkazib yuborilgan qadamlar bo'yicha qisqa xulosa bildirishnomasi.

## Texnik tafsilotlar
- Kasalliklar ro'yxati va tanlov `auth.updateUser({ data: { chronic_conditions: [...] } })` orqali foydalanuvchi profil ma'lumotlarida saqlanadi (yosh/jins kabi) — tashqi Supabase bo'lgani uchun yangi jadval/migratsiya talab qilinmaydi.
- AI rejim mavjud `ai-chat` edge funksiyasi orqali olinadi (qat'iy JSON formatida so'raladi, javob parse qilinadi); funksiya qayta deploy qilinishi shart emas.
- Tuzilgan rejim va kunlik bajarilish holati brauzer xotirasida (localStorage, sana kaliti bilan) saqlanadi; rejimning o'zi ham user metadata'ga yoziladi, shunda boshqa qurilmada ham ochiladi.
- Eslatmalar mavjud `notifications` jadvaliga yoziladi (`NotificationBell` avtomatik ko'rsatadi).
- Yangi fayllar: `src/lib/chronicConditions.ts`, `src/components/modules/ChronicConditions.tsx`, `src/components/modules/DailyRoutine.tsx`, `src/hooks/useRoutineReminders.tsx`. O'zgaradi: `ProfilePage.tsx` (yangi bo'lim), dashboard layout (rejim uchun menyu bandi).

## Cheklov
Bildirishnomalar faqat ilova ochiq bo'lganda yuboriladi (server tarafda rejalashtiruvchi yo'q, chunki edge funksiyalarni bu yerdan deploy qilib bo'lmaydi). Ilova yopiq bo'lganda ham yuborilishi kerak bo'lsa, buni keyingi qadamda qo'shamiz.
