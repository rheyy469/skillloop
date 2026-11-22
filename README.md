# SkillLoop — Reciprocal Skill Exchange Platform

> **Navigating Ideas, Sharing Insights, Growing Together.**

SkillLoop adalah aplikasi web interaktif dan responsif (Desktop & Mobile) untuk **pertukaran keahlian dua arah (*reciprocal skill exchange*)** dan kolaborasi belajar antarindividu tanpa transaksi uang. Setiap pengguna berperan sebagai *Teacher* sekaligus *Learner*: mendeklarasikan skill yang dapat diajarkan (`TEACH`) dan skill yang ingin dipelajari (`LEARN`). Sistem mencocokkan pasangan pengguna secara dua arah, menjelaskan alasan kecocokannya secara transparan, serta memfasilitasi kesepakatan pertukaran, penjadwalan sesi lintas zona waktu, ruang pesan pribadi, komunitas belajar, hingga moderasi katalog skill oleh Administrator.

---

## Fitur Utama Platform (P0, P1 & P2)

### 1. Fitur Inti Pertukaran Skill (P0)
1. **Autentikasi, Sesi Aman, Sign Out & 1-Klik Demo Persona (`FR-001`)**:
   - Registrasi akun baru (*Sign Up* lengkap dengan konfirmasi password), *Sign In*, *Sign Out*, dan ubah password dengan *server-side session* (`HttpOnly` cookie) yang terintegrasi langsung dengan PostgreSQL Docker.
   - Dilengkapi tombol cepat **Sign In / Sign Up / Sign Out** di sebelah *search bar* pada header, serta *1-Click Demo Persona Switcher* (beserta opsi *Sign Out* ke mode tamu) di sidebar maupun halaman `/login`.
2. **Profil Pengguna, Custom Profile Avatar & Indikator Kelengkapan (`FR-002`, `FR-005`)**:
   - Pengaturan nama tampilan, username, bio, zona waktu IANA, bahasa komunikasi (`ID` / `EN`), serta kalkulasi otomatis persentase kelengkapan profil.
   - **Custom Profile Picture (8 Avatar Karakter)**: Pemilih foto profil interaktif berbasis 8 ilustrasi karakter *built-in* di halaman `/profile` yang tersinkronisasi otomatis ke Header, Kartu Profil Dashboard, dan database PostgreSQL.
3. **Katalog Skill Kanonis & Deklarasi Teach/Learn (`FR-003`, `FR-004`)**:
   - Pencarian skill berdasarkan nama maupun alias terkurasi (mis. `js` → `JavaScript`, `ui/ux` → `UI/UX Design`), filter kategori, serta deklarasi peran `TEACH` / `LEARN` lengkap dengan level (`BEGINNER`, `INTERMEDIATE`, `ADVANCED`), metode preferensi belajar, dan tautan portofolio.
4. **Mesin Reciprocal Matching Deterministik & Explainable (`FR-006`, `FR-007`, `FR-008`)**:
   - Merekomendasikan partner dengan kecocokan timbal balik dua arah.
   - Menghitung skor per arah (`DirectionScore = 0.70 * SkillFit + 0.20 * LevelFit + 0.10 * AvailabilityFit`) dan skor keseluruhan yang menyeimbangkan kedua arah (`OverallScore = 0.65 * min(AtoB, BtoA) + 0.35 * avg(AtoB, BtoA)`).
   - Menampilkan kartu partner bergaya editorial yang informatif beserta *compatibility breakdown* dua arah.
5. **Siklus Collaboration Request & Counter-Proposal (`FR-009`, `FR-010`)**:
   - Pengajuan permintaan pertukaran skill disertai kesepakatan kurikulum (*Exchange Agreement*), aksi terima (`ACCEPT`), tolak (`REJECT`), batalkan (`CANCEL`), maupun ajukan tawaran balik (`COUNTER`).
6. **Penjadwalan Sesi Belajar Lintas Zona Waktu & Tautan Ruang Belajar (`FR-011`, `FR-012`)**:
   - Pengajuan jadwal (`PROPOSED`), konfirmasi jadwal (`SCHEDULED`), penjadwalan ulang (`RESCHEDULE`), penyelesaian sesi (`COMPLETED`), pembatalan (`CANCELLED`), serta ruang *Virtual Meeting* terintegrasi.
7. **Dashboard Profil Pengguna, Monitor Aktivitas (Harian/Mingguan/Bulanan) & Pusat Notifikasi (`FR-013`, `FR-014`)**:
   - **Kartu Profil Pengguna** lengkap di Dashboard beserta ringkasan skill, rating, bahasa, dan progres kelengkapan profil.
   - **Monitor Aktivitas Interaktif** dengan mode **Harian (7 hari terakhir)**, **Mingguan (4 minggu terakhir)**, dan **Bulanan (6 bulan terakhir)** lengkap dengan grafik batang yang dapat diklik untuk memantau durasi belajar, sesi, request, dan milestone.
   - Ringkasan 4 kartu *Top Reciprocal Partners of the Week*, *Exchange To-Do List*, dan *In-App Notification Center*.
8. **Kontrol Keamanan: Blokir & Laporkan Pengguna (`FR-015`)**:
   - Pemblokiran pengguna dan pelaporan pelanggaran langsung ke antrean moderasi Admin.

### 2. Fitur Lanjutan & Ekosistem Komunitas (P1 & P2)
9. **Pelacakan Milestone & Progress Belajar**:
   - Pembuatan target/milestone belajar per kolaborasi dengan *progress slider* (`0%` – `100%`) dan checklist penyelesaian.
10. **Ulasan Sesi & Reputasi Partner**:
    - Pemberian rating bintang (`1–5`) dan ulasan tertulis pasca-sesi selesai (`COMPLETED`) yang otomatis memperbarui skor reputasi partner.
11. **Ruang Pesan Pribadi & Berbagi Materi (`/messages`)**:
    - Percakapan *direct message* antar-partner kolaborasi yang mendukung lampiran tautan materi/repositori belajar dan fitur laporkan pesan.
12. **Komunitas & Kelompok Belajar (`/community`)**:
    - Pembuatan dan partisipasi dalam *Reciprocal Study Circles* berdasarkan fokus skill dengan jadwal rutin dan tautan ruang diskusi grup.
13. **Admin & Moderasi Berbasis Hak Akses (`/admin` — Khusus Akun Admin)**:
    - **Pembatasan Hak Akses (`isAdmin`)**: Menu **Admin & Moderasi** di sidebar serta seluruh endpoint `/api/v1/admin/*` hanya dapat diakses oleh akun yang memiliki hak akses Administrator (**Raka Pratama — `raka@demo.skillloop.id`** atau email berawalan `admin@...`). Akun member biasa tidak melihat menu Admin di sidebar dan akan diblokir oleh halaman *Restricted Access* jika membuka `/admin`.
    - **Manajemen & Hapus Katalog Skill Kanonis**: Admin dapat menambahkan skill kanonis baru (`POST /api/v1/admin/skills`) maupun **menghapus skill dari katalog kanonis (`DELETE /api/v1/admin/skills/:skillId`)** apabila ada skill yang tidak sengaja ditambahkan, lengkap dengan fitur pencarian dan filter kategori.
    - **Moderasi Laporan & Status Akun**: Admin dapat meninjau laporan (`RESOLVED` / `DISMISSED`) serta menangguhkan atau mengaktifkan kembali akun pengguna (`Suspend` / `Activate`).
14. **Desain Responsif (Desktop & Mobile) & Bilingual (`ID` / `EN`)**:
    - Menggunakan tata letak *Left Vertical Sidebar* pada desktop, *Drawer Menu* + *Fixed Bottom Navigation Bar* saat dibuka dari HP, *Footer* interaktif, latar belakang *notebook grid* dengan ruang kerja hangat (`#FAF1E6`), ilustrasi vektor SVG *built-in*, serta *Interactive Local Fallback Store* sehingga seluruh menu tetap berfungsi penuh meskipun server database sedang luring.

---

## Tech Stack & Struktur Monorepo

- **Frontend (`apps/web`)**: React 18 + Vite + TypeScript + Tailwind CSS + React Router + Lucide Icons
- **Backend (`apps/api`)**: Node.js + Express + TypeScript + Zod + Bcrypt
- **Shared (`packages/shared`)**: Tipe, enum, dan konstanta bersama
- **Database & ORM (`prisma/`)**: PostgreSQL 17 + Prisma ORM (dengan *automatic in-memory fallback* & *client interactive store*)
- **Testing**: Vitest + Supertest

```text
skillloop/
├── apps/
│   ├── api/                 # Express + TypeScript REST API (/api/v1)
│   └── web/                 # React + Vite + Tailwind CSS Frontend
├── packages/
│   └── shared/              # Shared TypeScript types & constants
├── prisma/
│   ├── schema.prisma        # Relational PostgreSQL schema
│   └── migrations/          # SQL migrations
├── docs/
│   ├── PRD_SkillLoop.md
│   ├── SkillLoop_AI_Agent_Brief.md
│   └── API.md
├── Dockerfile               # Full-stack multi-stage container build
├── docker-compose.yml       # PostgreSQL 17 & optional fullstack profile
├── .env.example
└── package.json
```

---

## Cara Menjalankan Proyek

### 1. Prasyarat
- **Node.js** `>= 20.x` dan **npm** `>= 10.x`
- **Docker Desktop** *(Opsional — untuk menjalankan container PostgreSQL lokal)*

> **Catatan Kemudahan Development:** Jika Docker Desktop atau PostgreSQL belum dijalankan, backend (`apps/api`) secara otomatis menggunakan *in-memory development store* dan frontend (`apps/web`) dilengkapi *interactive state store* yang sudah terisi katalog skill, sesi, pesan, komunitas, serta 5 akun demo sehingga seluruh fitur dapat langsung diuji tanpa konfigurasi tambahan.

### 2. Instalasi & Konfigurasi Environment
```bash
cp .env.example .env
npm install
```

### 3. Menjalankan PostgreSQL dengan Docker Compose (Direkomendasikan)
```bash
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
```

*(Opsional)* Jika ingin menjalankan seluruh stack (**PostgreSQL + Backend API + Frontend Web**) langsung di dalam container Docker:
```bash
docker compose --profile fullstack up -d --build
# Buka aplikasi di http://localhost:4000
```

### 4. Menjalankan Aplikasi (Backend + Frontend)
Jalankan di dua terminal terpisah:
```bash
# Terminal 1 — Jalankan API Server (http://localhost:4000/api/v1)
npm run dev:api

# Terminal 2 — Jalankan Web Frontend (http://localhost:5173)
npm run dev:web
```

### 5. Pengujian (Typecheck, Lint, Unit & Integration Tests, Build)
```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

---

## Akun Demo & Hak Akses (1-Klik Login)

Seluruh akun demo menggunakan password: `DemoSkillLoop123!` dan dapat dipilih langsung melalui dropdown **Akun Demo Cepat (1-Klik)** di sidebar maupun di halaman `/login`:

| Akun | Email | Hak Akses | Can Teach | Want to Learn | Keterangan Demo |
|---|---|---|---|---|---|
| **Raka Pratama** | `raka@demo.skillloop.id` | **Administrator (`isAdmin: true`)** | JavaScript, HTML & CSS | UI/UX Design, Figma | Memiliki akses penuh ke menu **Admin & Moderasi** (kelola & hapus katalog skill, moderasi laporan, suspend user) |
| **Nadia Lestary (Naya)** | `naya@demo.skillloop.id` | Member (`isAdmin: false`) | UI/UX Design, Figma | JavaScript, HTML & CSS | Reciprocal Match 96% dengan Raka & Dimas |
| **Evan Dimas Lee** | `dimas@demo.skillloop.id` | Member (`isAdmin: false`) | Public Speaking, HTML & CSS | Figma, JavaScript | Reciprocal Match dengan Naya & Raka |
| **Stefy Alya Catlyna** | `alya@demo.skillloop.id` | Member (`isAdmin: false`) | Python, SQL & PostgreSQL | React, JavaScript | Reciprocal Match 98% dengan Farhan |
| **Farhan Akbar** | `farhan@demo.skillloop.id` | Member (`isAdmin: false`) | React, TypeScript | Python, SQL & PostgreSQL | Reciprocal Match 98% dengan Alya |

