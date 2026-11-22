# Panduan Deployment SkillLoop (Phase 5 PRD)

Dokumen ini menjelaskan langkah-langkah dari lingkungan lokal (Docker PostgreSQL) hingga aplikasi siap di-deploy ke internet untuk kebutuhan demo atau produksi sesuai **PRD Bagian 19 & 20**.

---

## 1. Checklist Kesiapan Lokal (Dengan Docker)

Pastikan langkah berikut sudah berjalan di mesin lokalmu:

1. **Container PostgreSQL Berjalan**:
   ```powershell
   docker compose up -d
   ```
2. **Migrasi Skema & Data Demo Terpasang**:
   ```powershell
   npm run db:migrate
   npm run db:seed
   ```
3. **Verifikasi Koneksi PostgreSQL**:
   Buka `http://localhost:4000/api/v1/health` saat server API menyala. Pastikan response memuat:
   ```json
   {
     "data": {
       "status": "ok",
       "service": "skillloop-api",
       "storageMode": "postgres"
     }
   }
   ```
4. **Verifikasi Build & Pengujian**:
   ```powershell
   npm run typecheck
   npm run lint
   npm run test
   npm run build
   ```

---

## 2. Rekomendasi Arsitektur Hosting (Gratis / Mudah untuk Demo Kompetisi)

Kombinasi paling stabil dan cepat untuk men-deploy monorepo ini:

1. **Database PostgreSQL**: **Neon.tech** atau **Supabase** (Managed PostgreSQL gratis).
2. **Backend API (`apps/api`)**: **Railway** atau **Render** (Web Service Node.js).
3. **Frontend Web (`apps/web`)**: **Vercel** atau **Netlify** (dengan proxy `/api/*` ke URL backend agar cookie `HttpOnly` bekerja sebagai *first-party cookie* di semua browser).

### Langkah A — Siapkan Database Produksi (Neon / Supabase / Railway)
1. Buat project PostgreSQL baru di Neon/Supabase/Railway.
2. Salin connection string `DATABASE_URL` (pastikan menggunakan SSL `sslmode=require`).

### Langkah B — Deploy Backend (`apps/api`) di Render / Railway
1. Hubungkan repository GitHub kamu ke Render atau Railway.
2. Gunakan pengaturan berikut:
   - **Root Directory**: `.` (root monorepo)
   - **Build Command**:
     ```bash
     npm install && npx prisma generate --schema=prisma/schema.prisma && npx prisma migrate deploy --schema=prisma/schema.prisma && npm run build --workspace=@skillloop/api
     ```
   - **Start Command**:
     ```bash
     npm run start --workspace=@skillloop/api
     ```
3. Tambahkan **Environment Variables** di dashboard hosting backend:
   ```env
   NODE_ENV=production
   PORT=4000
   DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
   SESSION_SECRET=ganti-dengan-random-string-minimal-32-karakter-acak
   FRONTEND_ORIGIN=https://nama-project-kamu.vercel.app
   ```
4. *(Opsional untuk mengisi akun demo di database produksi)* Jalankan satu kali:
   ```bash
   npm run db:seed
   ```

### Langkah C — Deploy Frontend (`apps/web`) di Vercel
1. Sebelum push ke GitHub, sesuaikan URL backend di `apps/web/vercel.json` (ganti `https://skillloop-api-production.up.railway.app` dengan URL backend asli milikmu).
2. Import repository ke **Vercel**:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Karena `vercel.json` meneruskan `/api/:path*` langsung ke backend milikmu, browser menganggap frontend dan API berada di domain yang sama sehingga cookie sesi `HttpOnly` (`skillloop_sid`) bekerja tanpa kendala lintas browser (termasuk Safari dan Chrome Incognito).
