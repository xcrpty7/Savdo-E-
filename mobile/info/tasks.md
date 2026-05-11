# TASKS — Savdo Mobile

> Yangilangan: 2026-05-02
> Legend: 🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low · ⚙️ Backend kerak

---

## 🔴 CRITICAL — Hozir sindirilgan (tuzatish kerak)

### 1. Mahsulot o'chirish ishlamaydi
- **Muammo**: `handleArchive()` `archivedAt` timestamp qo'yadi, lekin foydalanuvchi "o'chirildi" deb o'ylamaydi — mahsulot hali ko'rinadi
- **Hal**: Arxivlash = o'chirish bo'lishi kerak yoki haqiqiy `isDeleted` flag qo'shish
- **Fayl**: `mobile/app/(app)/products/[id].tsx` — `handleArchive()` funksiyasi
- **Qo'shimcha**: Mahsulotlar ro'yxatida har bir itemda to'g'ridan-to'g'ri **Edit** va **Delete** tugmalar bo'lishi kerak (inline yoki swipe)
- **Delete** uchun tasdiqlash dialog kerak: "Mahsulot o'chirilsinmi? Bu amalni qaytarib bo'lmaydi."

### 2. CSV export ishlamaydi (Reports ekrani)
- **Muammo**: Reports ekranidagi CSV tugma ishlashini tekshirish — fayl saqlanmaydi
- **Hal**: `expo-file-system` + `expo-sharing` bilan to'g'ri CSV fayl yaratib share qilish
- **Fayl**: `mobile/app/(app)/reports/index.tsx`
- **Qo'shimcha**: Bir nechta format qo'shish: CSV, JSON, Google Sheets-kompatibel format

### 3. Chek (receipt) ulashish muammosi
- **Muammo**: Hozir `.txt` fayl share qilinadi — ba'zi qurilmalarda ishlamaydi yoki noqulay
- **Hal**: Aniq receipt formati belgilash va to'g'ri share qilish
- **Fayl**: `mobile/app/(app)/sales/add.tsx` — `shareReceipt()` funksiyasi
- **Format variantlari**:
  - Matnli chek (WhatsApp/Telegram uchun)
  - Ulashiluvchi link (quyida alohida task)

---

## 🟠 HIGH — Muhim UX muammolar

### 4. Stok oshib ketganda ogohlantirishlar (sotuv qo'shishda)
- **Muammo**: Foydalanuvchi stokdan ortiq miqdor kiritishi mumkin (masalan, stokda 10 ta, 15 ta sotadi)
- **Hozirgi holat**: Alert chiqadi, lekin miqdorni bloklamaydi
- **Hal**:
  - Miqdor maydoni stokdan oshsa — qizil rang/border bilan ko'rsatish
  - Stokdan oshgan miqdor uchun overlay yoki badge: "⚠️ Stokdan 5 ta oshiqcha"
  - Sotish tugmasi o'chmasin, lekin aniq ogohlantirish bo'lsin
- **Fayl**: `mobile/app/(app)/sales/add.tsx`

### 5. Mahsulotlar ro'yxatida stok ko'rsatkichlari
- **Muammo**: Ro'yxatda stok holati aniq ko'rinmaydi
- **Hal**: Har bir mahsulot kartasida rangli stok indikator:
  - 🟢 Yaxshi (stok > 10)
  - 🟡 Kam (stok 1–10, `isLowStock`)
  - 🔴 Tugadi (stok = 0)
- **Qoidasi**: Xato pop-up emas, faqat vizual indikator ro'yxatda
- **Fayl**: `mobile/app/(app)/products/index.tsx`

### 6. Mahsulot detail ekranida statistika
- **Hozir yo'q**: Faqat tahrirlash formi bor
- **Qo'shish kerak**:
  - Jami sotuvlar soni (bu mahsulotdan)
  - Jami foyda (sell - buy narx × miqdor)
  - Qarzli sotuvlar (agar bo'lsa)
  - Oxirgi sotilgan sana
- **Fayl**: `mobile/app/(app)/products/[id].tsx`
- **Ma'lumot manbai**: WatermelonDB — `SaleItem` + `Sale` modellar orqali query

### 7. Subscription tariflari UI qayta dizayn
- **Muammo**: Hozirgi jadval ko'rinishi (FREE/PRO/BIZNES) noqulay va xunuk
- **Hal**: Karta asosidagi dizayn:
  - Har bir tarif alohida karta (3 ta karta row yoki swipe)
  - Aktiv tarif highlight
  - Har bir kartada: narx, asosiy imkoniyatlar ro'yxati, tugma
  - Eng mashhur tarifni "TAVSIYA ETILADI" badge bilan ko'rsatish
- **Fayl**: `mobile/app/(app)/settings/subscription.tsx`

---

## 🟡 MEDIUM — Yaxshi bo'lar edi

### 8. Draggable (siljitiluvchi) FAB "+" tugmasi
- **Hozir**: FAB pastki o'ng burchakda qotib turadi
- **Hal**: Foydalanuvchi uni ekranda xohlagan joyga siljitsin, pozitsiyasi AsyncStorage da saqlansin
- **Texnik**: `PanResponder` (React Native o'zi) yoki `react-native-draggable-flatlist` ishlatish
- **Fayllar**: `mobile/app/(app)/products/index.tsx`, `mobile/app/(app)/sales/index.tsx`
- **Muhim**: Siljitilganda ham tap ishlasin (press vs drag ajratish)

### 9. Mahsulotlar ro'yxatida inline Edit/Delete tugmalar
- **Hal**: Har bir mahsulot satriga swipe yoki long-press → Edit / Delete tugmalar
- **Yoki**: Karta o'ng tomonida 3-nuqta (⋯) menu
- **Delete** uchun tasdiqlash dialog (quyidagicha):
  ```
  "Mahsulotni o'chirasizmi?"
  [Bekor qilish] [O'chirish 🗑️]
  ```
- **Fayl**: `mobile/app/(app)/products/index.tsx`

### 10. Chek uchun ulashiluvchi link yaratish
- **Maqsad**: Sotuv cheki uchun veb-havola generatsiya qilish (masalan: `savdo.uz/r/abc123`)
- **Variantlar**:
  - Backend endpoint: `POST /receipts` → unique slug qaytaradi
  - Yoki: chek ma'lumotlarini base64 encode qilib URL ga qo'shish (backend siz)
- **Fayl**: `mobile/app/(app)/sales/add.tsx` — `shareReceipt()` + yangi `generateReceiptLink()` funksiya
- ⚙️ Backend endpointi kerak bo'lishi mumkin

### 11. Sotuv o'chirish (Sales ekranida)
- **Hozir**: Sotuvlar ro'yxatida faqat ko'rish bor, o'chirish yo'q
- **Hal**: Swipe yoki long-press → "O'chirish" → tasdiqlash dialog + stokni qaytarish
- **Muhim**: Sotuv o'chirilganda stok avtomatik oshishi kerak
- **Fayl**: `mobile/app/(app)/sales/index.tsx`

---

## 🟢 LOW — Keyinroq

### 12. App icon va splash screen
- Hozir default Expo icon
- `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash.png` almashtirish kerak
- Real Savdo logotipi kerak

### 13. Xodim PIN login flow
- `roleStore` tayyor, lekin PIN ekrani yo'q
- Kassir rejimi: cheklangan huquqlar (faqat sotuv qo'shish)
- **Fayl**: `mobile/store/roleStore.ts`, yangi `mobile/app/(auth)/pin.tsx`

### 14. Mahsulot kategoriya filter
- `useCategories` hook va `Category` modeli tayyor
- Mahsulotlar ekranida filter UI yo'q (horizontal chip list kerak)
- **Fayl**: `mobile/app/(app)/products/index.tsx`

### 15. Barcode skaner to'liq integratsiya
- Hozir `p.serverId === barcode` qidiradi
- Mahsulot qo'shishda barcode field bor, lekin skanerlash UI yo'q

---

## ⚙️ BACKEND TAYYOR BO'LGANDA (boshqa odam)

### B1. Real OTP SMS
- Login: `/auth/send-otp` → SMS jo'natadi
- Verify: `/auth/verify-otp` → real JWT qaytaradi
- **Fayl**: `mobile/app/(auth)/login.tsx`, `mobile/app/(auth)/verify.tsx`

### B2. Email OTP verification
- Register: `/auth/register/email` → email yuboradi
- Verify-email: `/auth/verify-email` → JWT qaytaradi
- **Fayl**: `mobile/app/(auth)/verify-email.tsx`

### B3. Token refresh
- `accessToken` muddati tugaganda `refreshToken` bilan yangilash
- `mobile/services/api.ts` interceptor kerak

### B4. Sync test
- `syncEngine.ts` tayyor
- Backend `/sync/products` va `/sync/sales` endpointlari tayyor bo'lganda sinash

### B5. Push notification token yuborish
- Login bo'lgandan keyin Expo push token → `/user/push-token`
- **Fayl**: `mobile/services/notifications.ts` (Expo Go da skip qilinadi)

### B6. Subscription backend
- Hozir local AsyncStorage
- Backend: tarif holati, muddat, to'lov webhooks (Payme/Click)
- **Fayl**: `mobile/store/subscriptionStore.ts`, `mobile/app/(app)/settings/subscription.tsx`

### B7. Receipt link backend
- `POST /receipts` — chek ma'lumotlarini saqlaydi, unique slug qaytaradi
- Frontend: `savdo.uz/r/{slug}` link generatsiya

### B8. Xodimlar sync
- Bir do'konga bir nechta qurilmada xodimlar ko'rinishi
- `Employee` modeli tayyor, sync yo'q

---

## ✅ BAJARILGAN (2026-05-02 sessiya)

- [x] Dark/Light mode color redesign (yangi rang palitrasi)
- [x] Footer tablar kamaytirish (5 → 4, reports/customers/suppliers hidden)
- [x] Email orqali ro'yxatdan o'tish va kirish (online + offline)
- [x] Demo mode (parol "demo", OTP "000000")
- [x] Auth navigation tuzatildi (router.replace, sync setToken)
- [x] Push notifications Expo Go da skip qilish
- [x] Har bir tab uchun Stack `_layout.tsx` fayllar (20 broken tab bug fix)
- [x] Web fayllarni main branchdan pull qilish (228 fayl)
- [x] i18n: uz/ru/en tillarida email auth stringlar qo'shildi
- [x] Settings ekranida Reports havolasi qo'shildi
- [x] Mahsulot o'chirish — `destroyPermanently()` bilan haqiqiy o'chirish, tasdiqlash dialog
- [x] Mahsulot detail — sotuvlar statistikasi (jami sotilgan, tushum, foyda, oxirgi sana)
- [x] Mahsulot detail — stok holati badge (Tugadi/Kam qoldi/Yetarli rangli)
- [x] Mahsulot detail — pastda qizil "O'chirish" tugma qo'shildi
- [x] Mahsulotlar ro'yxati — rangli stok indikator (🔴0 ta, 🟡1-5 ta, 🟢6+ ta)
- [x] Mahsulotlar ro'yxati — ⋯ tugma + long-press → Edit/Delete menu
- [x] CSV export tuzatildi — BOM, escape, UTI, null cacheDirectory check
- [x] JSON export qo'shildi — Reports ekranida format tanlash dialog
- [x] Chek ulashish tuzatildi — `Share.share()` API (fayl yo'q, universal)
- [x] Stok overflow — vizual qizil border + ogohlantirish satri + tasdiqlash dialog
- [x] Subscription tariflari UI qayta dizayn — theme colors, top color bar, TAVSIYA badge
- [x] Xodimlar bo'limi Settings da comment out qilindi

---

## 🚫 VAQTINCHA YASHIRILGAN

- **Xodimlar (Employees) bo'limi** — Settings ekranida comment out qilinsin
  - **Sabab**: Hali tayyor emas, backend va PIN flow kerak
  - **Fayl**: `mobile/app/(app)/settings/index.tsx` — Xodimlar section
  - Tayyor bo'lganda ochish kerak: B8 + Task 13 bajarilgandan keyin
