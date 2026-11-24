# Panduan Deployment Manual SkillLoop (Vercel + Railway + PostgreSQL)

Dokumen ini memandu kamu melakukan deployment **SkillLoop Monorepo** secara manual dan terpisah:
- **Frontend (`apps/web`)** → **Vercel** (React + Vite SPA)
- **Backend / API (`apps/api`)** → **Railway** (Express.js + TypeScript + Prisma)
- **Database** → **PostgreSQL** di **Railway**

---

## 1. Struktur Akhir Monorepo

```text
skillloop/
├── apps/
│   ├── api/                 # Backend Express + Prisma (@skillloop/api)
│   │   ├── src/
│   │   │   ├── config/env.ts
│   │   │   ├── lib/repository.ts
│   │   │   ├── middleware/auth.middleware.ts
│   │   │   └── ...
│   │   ├── .env.example
│   │   └── package.json
│   └── web/                 # Frontend React + Vite (@skillloop/web)
│       ├── src/
│       ├── public/
│       ├── vercel.json      # SPA client-side routing rewrite
│       ├── .env.example
│       └── package.json
├── packages/
│   └── shared/              # Shared TypeScript types & constants (@skillloop/shared)
├── prisma/
│   ├── schema.prisma        # 18 model PostgreSQL (termasuk P1/P2)
│   └── migrations/          # Migrasi SQL non-destruktif
├── railway.json             # Konfigurasi Build, Start & Healthcheck Railway
├── package.json             # Root npm workspaces
├── .env.example             # Template env lokal
└── .gitignore
```

---

## 2. Cara Menjalankan Project Secara Lokal

### Prasyarat
- Node.js `>= 20.0.0` dan `npm`
- Docker Desktop (opsional, untuk PostgreSQL lokal)

### Langkah Menjalankan Lokal
1. Salin `.env.example` menjadi `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
2. Install dependencies monorepo:
   ```powershell
   npm install
   ```
3. Generate Prisma Client:
   ```powershell
   npm run db:generate
   ```
4. *(Jika memakai PostgreSQL lokal via Docker)*:
   ```powershell
   docker compose up -d
   npm run db:migrate:deploy
   npm run db:seed
   ```
5. Jalankan Frontend + Backend bersamaan:
   ```powershell
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:4000/api/v1`
   - Healthcheck: `http://localhost:4000/api/v1/health`

---

## 3. Ringkasan Build & Start Commands

| Target | Root Directory | Build Command | Start / Output |
|---|---|---|---|
| **Backend (Railway)** | `.` (root monorepo) | `npm ci && npm run db:generate && npm run build:api` | Start: `npm run db:migrate:deploy && npm run start:api` |
| **Frontend (Vercel)** | `apps/web` | `npm run build` | Output Directory: `dist` |

> **Catatan:** Railway otomatis membaca [railway.json](../railway.json) di root repository. Vercel otomatis membaca [apps/web/vercel.json](../apps/web/vercel.json).

---

## 4. Langkah 1 — Commit & Push ke GitHub (Manual)

Pastikan `.env` **tidak** ikut ter-commit (`git status` tidak boleh menampilkan `.env`).

```powershell
git status
git add .
git commit -m "chore: prepare monorepo for Vercel and Railway deployment"
git push origin main
```

---

## 5. Langkah 2 — Setup PostgreSQL & Backend di Railway (Manual)

### A. Buat Database PostgreSQL di Railway
1. Login ke [Railway](https://railway.app) → klik **New Project**.
2. Pilih **Provision PostgreSQL** (atau **Add Service → Database → Add PostgreSQL**).
3. Tunggu hingga status PostgreSQL **Online**. Railway otomatis menyediakan variable `DATABASE_URL`.

### B. Deploy Service Backend dari GitHub
1. Di project Railway yang sama, klik **+ New → GitHub Repo** → pilih repository `skillloop`.
2. Masuk ke **Settings** service backend tersebut:
   - **Root Directory:** biarkan kosong / `.` (root monorepo, wajib agar workspace `@skillloop/shared` dan folder `prisma/` terbaca).
   - **Build Command & Start Command:** otomatis terisi dari `railway.json`:
     - Build: `npm ci && npm run db:generate && npm run build:api`
     - Start: `npm run db:migrate:deploy && npm run start:api`
   - **Healthcheck Path:** `/api/v1/health`
3. Masuk ke tab **Variables** pada service backend, tambahkan:

| Variable | Contoh / Nilai | Keterangan |
|---|---|---|
| `NODE_ENV` | `production` | Mengaktifkan validasi env ketat & mode PostgreSQL wajib |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Reference ke service PostgreSQL Railway |
| `SESSION_SECRET` | *(32+ karakter acak)* | Wajib! Generate dengan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `FRONTEND_ORIGIN` | `https://skillloop.vercel.app` | Ganti setelah domain Vercel jadi (boleh lebih dari satu, pisahkan dengan koma) |
| `COOKIE_SECURE` | `true` | Wajib untuk cookie HTTPS production |
| `COOKIE_SAME_SITE` | `none` | Wajib agar cookie sesi `HttpOnly` terkirim lintas domain Vercel ↔ Railway |

> Jangan set `PORT` secara manual kecuali diperlukan; Railway menyuntikkan `PORT` secara otomatis dan backend sudah mendengarkan di `0.0.0.0:$PORT`.

4. Masuk ke **Settings → Networking → Public Networking → Generate Domain**.
5. Salin domain publik Railway kamu, misalnya:
   ```text
   https://skillloop-api-production.up.railway.app
   ```
6. Uji endpoint healthcheck di browser:
   ```text
   https://skillloop-api-production.up.railway.app/api/v1/health
   ```
   Pastikan respons JSON menampilkan `"status": "ok"` dan `"storageMode": "postgres"`.

### C. (Opsional) Seed Data Katalog & Akun Demo ke PostgreSQL Railway
Jika kamu ingin mengisi 20+ katalog skill dan akun demo awal ke database Railway:
- Gunakan Railway CLI lokal (atau jalankan sekali dengan `DATABASE_URL` publik dari Railway):
  ```powershell
  $env:DATABASE_URL="postgresql://..."
  npm run db:seed
  ```
- Script seed bersifat **idempotent (`upsert`)**, sehingga aman dijalankan ulang tanpa menduplikasi data.

---

## 6. Langkah 3 — Deploy Frontend di Vercel (Manual)

1. Login ke [Vercel](https://vercel.com) → klik **Add New → Project**.
2. Import repository GitHub `skillloop`.
3. Atur konfigurasi project:
   - **Root Directory:** `apps/web`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Tambahkan **Environment Variable** pada dashboard Vercel:

| Variable | Nilai |
|---|---|
| `VITE_API_URL` | `https://your-backend-domain.up.railway.app` *(ganti dengan domain Railway kamu, tanpa `/api/v1` di belakang)* |

> **Keamanan:** Jangan pernah memasukkan `DATABASE_URL`, `SESSION_SECRET`, atau kredensial rahasia ke Environment Variables Vercel!

5. Klik **Deploy** dan tunggu hingga build selesai.
6. Salin domain Vercel kamu (misalnya `https://skillloop.vercel.app`).

---

## 7. Langkah 4 — Hubungkan CORS Vercel ↔ Railway

1. Kembali ke dashboard **Railway → Service Backend → Variables**.
2. Pastikan `FRONTEND_ORIGIN` sudah diisi persis dengan domain Vercel kamu (tanpa trailing slash `/`), misalnya:
   ```env
   FRONTEND_ORIGIN=https://skillloop.vercel.app
   ```
   *(Jika ingin mendukung juga preview domain atau custom domain, pisahkan dengan koma: `https://skillloop.vercel.app,https://skillloop.yourdomain.com`)*
3. Redeploy/restart service backend Railway jika variabel baru diubah.

---

## 8. Checklist Verifikasi Pasca-Deployment

- [ ] `GET https://<railway-domain>/api/v1/health` mengembalikan `200 OK` dengan `"storageMode": "postgres"`.
- [ ] Halaman utama Vercel terbuka tanpa error di console browser.
- [ ] Refresh halaman di route SPA (misalnya `/discover`, `/dashboard`, `/messages`) tidak menghasilkan `404` (berkat `apps/web/vercel.json`).
- [ ] Registrasi / Login berhasil dan sesi tetap bertahan setelah refresh halaman.
- [ ] Fitur utama (Skills, Discover, Requests, Sessions, Messages, Milestones, Community Groups, Settings) berfungsi dan datanya tetap tersimpan setelah refresh.
