# Savdo-E — Commerce Management Platform

![Backend](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express-339933?style=flat-square&logo=node.js&logoColor=white)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react&logoColor=black)
![Database](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Auth](https://img.shields.io/badge/Auth-JWT%20%2B%20Google%20OAuth-4285F4?style=flat-square&logo=google&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active-2ECC71?style=flat-square)

Kichik va o'rta biznes uchun savdo menejeri — mahsulotlar, savdolar, hisobotlar, admin panel.

---

## Tarkib

1. [Arxitektura](#arxitektura)
2. [Tech Stack](#tech-stack)
3. [Ishga tushirish](#ishga-tushirish)
4. [API Endpointlar](#api-endpointlar)
5. [Rollar va Huquqlar](#rollar-va-huquqlar)
6. [Xavfsizlik](#xavfsizlik)
7. [Docker](#docker)

---

## Arxitektura

```
┌─────────────────┐    ┌─────────────────┐
│  Web Frontend   │    │  Admin Panel    │
│  localhost:5173 │    │  localhost:5174 │
│  (React + Vite) │    │  (React + Vite) │
└────────┬────────┘    └────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    ↓
         ┌──────────────────┐
         │  Backend API     │
         │  localhost:5000  │
         │  (Node/Express)  │
         └────────┬─────────┘
                  ↓
         ┌──────────────────┐
         │    MongoDB       │
         │  savdo_db        │
         └──────────────────┘
```

**Login oqimi (ADMIN/SUPER_ADMIN):**
```
Web Login → JWT token → SSO redirect → Admin Panel (/sso?token=...)
```

**Google OAuth oqimi:**
```
Google tugmasi → id_token → POST /auth/google → JWT token → Dashboard
```

---

## Tech Stack

### Backend
| Texnologiya | Versiya | Maqsad |
|-------------|---------|--------|
| Node.js | 20+ | Runtime |
| Express.js | 4.x | API server |
| MongoDB + Mongoose | 7.x | Ma'lumotlar bazasi |
| JWT | — | Access + Refresh tokenlar |
| google-auth-library | 10.x | Google OAuth token tekshirish |
| Bcryptjs | — | Parol shifrlash |
| Joi | — | Input validatsiya |
| Helmet | — | HTTP xavfsizlik headerlari |
| express-rate-limit | — | Rate limiting |
| Nodemailer | — | Email yuborish |
| Winston | — | Logging |

### Web Frontend
| Texnologiya | Versiya | Maqsad |
|-------------|---------|--------|
| React | 18.x | UI |
| Vite | 4.x | Build tool |
| Zustand | — | State management |
| @react-oauth/google | 0.13.x | Google OAuth |
| React Router | 6.x | Routing |
| Axios | — | HTTP so'rovlar |
| TanStack Query | — | Server state |
| i18next | — | UZ / RU / EN tillari |
| Tailwind CSS | — | Stillar |

### Admin Panel
| Texnologiya | Maqsad |
|-------------|--------|
| React + Vite | UI |
| React Router | Routing |
| Zustand | Auth state |
| Recharts | Grafiklar |

---

## Ishga tushirish

### Talablar
- Node.js 18+
- MongoDB (local yoki Atlas)
- Google Cloud OAuth Client ID

### 1. Backend

```bash
cd backend
npm install
```

`.env` fayl yarating:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/savdo_db

JWT_ACCESS_SECRET=your_secret_key
JWT_ACCESS_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

BCRYPT_SALT_ROUNDS=10
ADMIN_SETUP_KEY=your_admin_setup_key
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
CLIENT_URL=http://localhost:5173

GOOGLE_CLIENT_ID=your_google_client_id

# SMTP (ixtiyoriy — bo'lmasa consolega chiqadi)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your@gmail.com
# SMTP_PASS=app_password
```

```bash
npm run dev
# http://localhost:5000
```

Super Admin yaratish (bir marta):
```bash
npm run seed:admin
```

### 2. Web Frontend

```bash
cd web
npm install
```

`web/.env`:
```env
VITE_ADMIN_URL=http://localhost:5174
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

```bash
npm run dev
# http://localhost:5173
```

### 3. Admin Panel

```bash
cd web/admin
npm install
npm run dev
# http://localhost:5174
```

---

## API Endpointlar

Base URL: `http://localhost:5000/api/v1`

### Auth

| Method | Endpoint | Tavsif | Auth |
|--------|----------|--------|------|
| POST | `/auth/register` | Ro'yxatdan o'tish | — |
| POST | `/auth/login` | Email/parol bilan kirish | — |
| POST | `/auth/google` | Google OAuth bilan kirish | — |
| POST | `/auth/refresh-token` | Token yangilash | — |
| POST | `/auth/forgot-password` | Parolni tiklash havolasi | — |
| POST | `/auth/reset-password` | Yangi parol o'rnatish | — |
| GET  | `/auth/me` | Joriy foydalanuvchi | JWT |
| POST | `/auth/logout` | Chiqish | JWT |
| POST | `/auth/logout-all` | Barcha qurilmalardan chiqish | JWT |

### Mahsulotlar

| Method | Endpoint | Tavsif | Auth |
|--------|----------|--------|------|
| GET | `/products` | Mahsulotlar ro'yxati | JWT |
| POST | `/products` | Mahsulot qo'shish | JWT |
| GET | `/products/:id` | Mahsulot ko'rish | JWT |
| PATCH | `/products/:id` | Mahsulot tahrirlash | JWT |
| DELETE | `/products/:id` | Mahsulot o'chirish | JWT |

### Savdolar

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/sales` | JWT |
| POST | `/sales` | JWT |

### Hisobotlar

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/reports/summary` | JWT |
| GET | `/reports/daily` | JWT |

### Admin

| Method | Endpoint | Auth |
|--------|----------|------|
| GET | `/admin/stats` | ADMIN/SUPER_ADMIN |
| GET | `/admin/users` | ADMIN/SUPER_ADMIN |

---

## Rollar va Huquqlar

| Rol | Tavsif | Kirish |
|-----|--------|--------|
| `USER` | Oddiy foydalanuvchi | Web dashboard |
| `ADMIN` | Administrator | Web + Admin panel |
| `SUPER_ADMIN` | Bosh administrator | Web + Admin panel (to'liq) |

**ADMIN/SUPER_ADMIN login oqimi:**
1. Web `/login` sahifasida email/parol yoki Google bilan kiradi
2. `authStore` rol tekshiradi
3. SSO orqali `http://localhost:5174/sso?token=...` ga yo'naltiriladi
4. Admin panel token saqlaydi va `/dashboard` ga o'tadi

---

## Xavfsizlik

### Authentication
- **JWT Access Token** — 24 soat, `JWT_ACCESS_SECRET` bilan
- **JWT Refresh Token** — 7 kun, rotatsiya bilan (eski token bekor qilinadi)
- **Google OAuth** — `google-auth-library` bilan ID token tekshirish
- **Bcrypt** — parollar 10 round bilan hashlangan
- **HttpOnly Cookie** — refresh token cookie da saqlandi

### API himoyasi
- **Helmet.js** — XSS, clickjacking va boshqa HTTP hujumlardan himoya
- **CORS** — faqat ruxsat etilgan originlar (`.env` da belgilangan)
- **Rate Limiting** — Auth: dev 100 / prod 10 req per 15 min
- **Rate Limiting** — API: dev 1000 / prod 100 req per 15 min
- **Joi Validatsiya** — barcha input tekshiriladi
- **express-mongo-sanitize** — NoSQL injection oldini olish
- **Password Policy** — katta harf + kichik harf + raqam, min 8 belgi

### Parolni tiklash
- Crypto `randomBytes(32)` — tasodifiy token
- SHA-256 hash — DB da saqlanadi (raw token faqat emailga yuboriladi)
- 15 daqiqa amal qilish muddati
- Parol o'zgarsa barcha sessiyalar bekor qilinadi
- Email enumeration oldini olish — har doim 200 qaytaradi

---

## Docker

```bash
# Barcha servislarni ishga tushirish
docker compose up -d

# Portlar:
# Web:    http://localhost:3000
# Admin:  http://localhost:3001
# API:    http://localhost:5000
```

`.env.docker` faylini nusxalab `.env` yarating:
```bash
cp .env.docker .env
# Keyin .env dagi secretlarni o'zgartiring
```

### Docker xavfsizligi
- Backend: non-root `savdo` user
- 2-stage build (Alpine Linux)
- Nginx reverse proxy (web va admin)
- MongoDB healthcheck (`mongosh ping`)

---

## Loyiha strukturasi

```
Savdo-E/
├── backend/
│   ├── src/
│   │   ├── config/           # DB ulanish
│   │   ├── controllers/      # Route handlerlari
│   │   ├── middlewares/      # Auth, RBAC, validatsiya, rate limit
│   │   ├── models/           # Mongoose sxemalar
│   │   ├── routes/           # API routelar
│   │   ├── services/         # Biznes logika
│   │   ├── utils/            # Yordamchi funksiyalar
│   │   └── validators/       # Joi sxemalar
│   ├── Dockerfile
│   └── .env
│
├── web/                      # Asosiy sayt (port 5173)
│   ├── src/
│   │   ├── api/              # Axios so'rovlar
│   │   ├── components/       # UI komponentlar
│   │   ├── i18n/             # UZ/RU/EN tarjimalar
│   │   ├── pages/            # Sahifalar
│   │   ├── store/            # Zustand state
│   │   └── hooks/
│   ├── nginx.conf
│   └── Dockerfile
│
├── web/admin/                # Admin panel (port 5174)
│   ├── src/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── router/
│   │   └── store/
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker-compose.yml
└── .env.docker
```

---

**Savdo-E — Kichik biznes uchun savdo menejeri**
 
