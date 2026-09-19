# Tibbiy panellarni 3D grafiklar, yashirin tarix va QR retsept bilan yangilash

## Natija
- AI Assistant tarixini sahifadan olib tashlab, yuqori chapdagi **Tarix** tugmasi orqali ochiladigan yon panelga ko‘chirish.
- Dashboard, AI Radiologist va AI Assistant grafiklarini yuborilgan 3D doira, ustun va qatlamli grafik namunalari ruhida qayta yaratish.
- AI tahlil natijalarini matn bilan birga tushunarli 3D diagrammalarda ko‘rsatish.
- Har bir retseptga chop etish belgisi ostida QR belgisini qo‘shish; bosilganda dorixonachi uchun retsept tafsilotlari va skanerlanadigan QR ko‘rinadi.
- Profil ichidagi **AI kunlik rejim**ni alohida menyu bo‘limiga ko‘chirish.

## 1. Tarixni faqat tugma orqali ochish
- AI Assistant sahifasidagi doimiy “So‘nggi savollar tarixi” kartasini olib tashlash.
- Sahifa sarlavhasining yuqori chap qismiga tarix belgili **Tarix** tugmasini joylashtirish.
- Tugma bosilganda o‘ngdan chiqadigan panel ochiladi; tashqarini bosish, yopish belgisi yoki `Esc` bilan yopiladi.
- Panel yopiq bo‘lganda tarix DOMda ko‘rinmaydi va sahifada joy egallamaydi.
- Mavjud tashxislar ro‘yxati, sana, ishonch foizi va ochiladigan batafsil ma’lumot saqlanadi.

## 2. Mukammal 3D grafik tizimi
- Umumiy, qayta ishlatiladigan 3D grafik komponentlari yaratiladi:
  - yaltiroq silindrsimon 3D ustunlar;
  - chuqurlik va ajratilgan segmentlarga ega 3D doira/donut;
  - qatlamli 3D maydon/chiziq grafigi.
- Ranglar mavjud tibbiy dizayn tokenlariga bog‘lanadi; tungi va kunduzgi rejimda kontrast saqlanadi.
- Hover/fokus holatida qiymat, nom va foiz ko‘rsatiladi; animatsiya kamaytirilgan rejimga moslashadi.
- Mobil ekranda grafiklar siqilmaydi: yozuvlar pastdagi legendaga o‘tadi, balandlik barqaror qoladi.

## 3. Dashboard grafiklari
- “Oylik tahlillar” 3D silindrsimon ustunlarga aylantiriladi: skanlar, tashxislar va reabilitatsiya oylar bo‘yicha.
- “Kasallik turlari” ajratilgan segmentli 3D doira ko‘rinishida bo‘ladi; markazda jami tashxis, legendada son va foiz ko‘rsatiladi.
- Mavjud bazadagi haqiqiy ma’lumotlar va bo‘sh holatlar saqlanadi.

## 4. AI Radiologist natijalari
- Salomatlik dinamikasi chuqurlikka ega qatlamli 3D trend grafigiga yangilanadi.
- Har bir yangi skan natijasida alohida 3D natija diagrammasi ko‘rinadi:
  - holat og‘irligi;
  - topilmalar soni;
  - tekshirilgan hududlar;
  - umumiy salomatlik bali.
- Diagramma yonida mavjud topilmalar, tavsiya va tavsiya etilgan shifokor matni qoladi.

## 5. AI Assistant natijalari
- Salomatlik dinamikasi shu umumiy 3D trend tizimidan foydalanadi.
- Yangi tashxis natijasida 3D doira/ustunli xulosa ko‘rsatiladi:
  - AI ishonch foizi;
  - dori tavsiyalari soni;
  - turmush tarzi tavsiyalari soni;
  - xavf/salomatlik ko‘rsatkichi.
- Natija diagrammasi va tibbiy matnlar bir-birini to‘ldiradi; klinik ma’lumot yo‘qolmaydi.

## 6. Retsept QR ko‘rinishi
- Chop etish belgisi va uning tagida ayni o‘lchamdagi QR belgisi vertikal joylashtiriladi.
- QR belgisi bosilganda “Dorixonachi uchun retsept” oynasi ochiladi.
- Oynada dori nomi, doza, davomiylik, ko‘rsatma, shifokor va sana ko‘rsatiladi.
- QR kod shu retsept ma’lumotlarini kodlaydi; dorixonachi oddiy QR skaner bilan o‘qiy oladi.
- Foydalanuvchi tanloviga ko‘ra bu bosqich **faqat ma’lumot ko‘rsatadi**: “dori berildi” tasdig‘i, dorixonachi akkaunti va holat yangilash qo‘shilmaydi.
- Bemorning keraksiz shaxsiy ma’lumotlari QR ichiga kiritilmaydi.

## 7. AI kunlik rejim alohida bo‘limi
- Menyuga **AI kunlik rejim** bandi qo‘shiladi: Dashboard, AI Radiologist, AI Assistant, Chat, AI Chat, Shifokorlar, Qabullar, Retseptlar, AI kunlik rejim, Profil.
- Mavjud rejim tuzish, yangilash, bajarildi belgilari, foiz va bildirishnomalar o‘zgarishsiz ishlaydi.
- Profil ichidan rejim paneli olib tashlanadi; surunkali kasalliklarni tanlash profilda qoladi.
- O‘zbek, rus va ingliz menyu nomlari qo‘shiladi.

## Texnik tafsilotlar
- Recharts ustiga maxsus SVG shakllari va semantik CSS tokenlari bilan 3D chuqurlik yaratiladi; og‘ir WebGL sahnasi ishlatilmaydi.
- QR uchun brauzerda generatsiya qilinadigan kutubxona qo‘shiladi; maxfiy kalit yoki yangi server xizmati talab qilinmaydi.
- Navigatsiya `routine` bo‘limi bilan kengaytiriladi va mavjud eslatma mexanizmi ishlashda davom etadi.
- Mavjud kartalar qayta ichma-ich kartalarga aylantirilmaydi; grafiklar bir xil vizual tizimdan foydalanadi.

## Tekshiruv
- Tarix paneli yopiq holda ko‘rinmasligi va faqat tugmadan ochilishi tekshiriladi.
- Dashboard, AI Radiologist, AI Assistant natijalari desktop va mobil o‘lchamda vizual tekshiriladi.
- QR oynasi ochilishi, kodning skanerlanishi va retsept tafsilotlari mosligi tekshiriladi.
- AI kunlik rejim yangi menyudan ochilishi va profilda takrorlanmasligi tekshiriladi.
- Loyiha build, lint va tegishli testlardan o‘tkaziladi.
