# PRODUCT REQUIREMENTS DOCUMENT (PRD)

# SkillLoop
## Platform Pertukaran Skill dan Kolaborasi Belajar Antarindividu

**Dokumen:** Product Requirements Document  
**Versi:** 1.0 — Draft implementasi  
**Tanggal:** 18 November 2026  
**Status:** Baseline awal; dapat direvisi setelah validasi pengguna  
**Target penggunaan:** Panduan produk, dasar desain UI/UX, spesifikasi implementasi, dan konteks untuk AI coding agent  
**Nama produk:** SkillLoop (nama kerja; belum merupakan nama merek final)

---

## Cara Menggunakan Dokumen Ini

Dokumen ini adalah sumber acuan utama untuk merancang, membangun, menguji, dan mendemonstrasikan SkillLoop. Gunakan bagian yang relevan sesuai kebutuhan:

- **Penjelasan produk:** Bagian 1–6.
- **Desain UX dan alur pengguna:** Bagian 7–9.
- **Implementasi frontend/backend:** Bagian 10–15.
- **Pengujian dan peluncuran:** Bagian 16–20.
- **Memberi konteks kepada AI coding agent:** Bagian 23 dan file pendamping `SkillLoop_AI_Agent_Brief.md`.

### Konvensi prioritas

- **P0 — Must have:** wajib ada agar MVP dapat digunakan dan didemonstrasikan.
- **P1 — Should have:** penting, tetapi dapat menyusul setelah alur inti stabil.
- **P2 — Could have:** pengembangan lanjutan; jangan menghambat MVP.

### Konvensi status keputusan

- **Diputuskan:** menjadi baseline implementasi dokumen ini.
- **Asumsi:** dipilih agar pekerjaan dapat dimulai; perlu divalidasi.
- **Terbuka:** belum diputuskan dan tidak boleh diasumsikan AI agent tanpa konfirmasi.

---

# 1. Ringkasan Eksekutif

SkillLoop adalah platform web untuk mempertemukan orang yang ingin **mengajarkan skill yang mereka kuasai** dengan orang yang **ingin mempelajari skill tersebut**, sekaligus memungkinkan pertukaran berlangsung dua arah. Pengguna dapat menjadi pengajar dan pembelajar pada saat yang sama.

Contoh: Raka dapat mengajarkan dasar JavaScript dan ingin belajar UI/UX. Naya menguasai UI/UX dan ingin belajar JavaScript. SkillLoop mengenali kecocokan timbal balik ini, menjelaskan alasan kecocokannya, lalu membantu keduanya mengajukan dan menyepakati sesi belajar.

Nilai utama SkillLoop bukan sekadar direktori mentor, marketplace kursus, atau media sosial. Pembeda inti produk adalah **reciprocal skill exchange**: setiap orang memiliki sesuatu untuk dibagikan dan sesuatu untuk dipelajari. Pertukaran tidak mengharuskan pembayaran dan tidak harus berupa transaksi yang bernilai sama secara matematis; kedua pihak menyepakati bentuk, tujuan, dan jadwal kolaborasi secara sukarela.

MVP akan memprioritaskan proses yang bisa diselesaikan dari awal hingga akhir:

1. Pengguna membuat akun dan melengkapi profil.
2. Pengguna menambahkan skill yang bisa diajarkan dan skill yang ingin dipelajari.
3. Sistem menemukan kandidat dengan kecocokan dua arah.
4. Pengguna melihat alasan kecocokan dan mengirim permintaan kolaborasi.
5. Pihak lain menerima atau menolak permintaan.
6. Kedua pihak menyepakati sesi belajar.
7. Status sesi dan progres sederhana dapat diperbarui.

Produk dibangun sebagai responsive web application dengan React, TypeScript, Node.js, Express, PostgreSQL, Prisma, dan Docker Compose untuk lingkungan pengembangan. Algoritma matching MVP bersifat deterministik dan dapat dijelaskan; AI bukan syarat untuk fitur inti.

## 1.1 Pernyataan Produk

> SkillLoop membantu orang saling belajar dengan mempertemukan kemampuan yang bisa mereka ajarkan dengan kemampuan yang ingin mereka pelajari—agar setiap orang dapat berbagi pengetahuan, membangun koneksi, dan berkembang bersama.

## 1.2 Tagline kerja

**Learn something. Teach something. Grow together.**

Tagline dapat diganti setelah identitas merek ditentukan.

---

# 2. Latar Belakang dan Masalah

## 2.1 Masalah yang ingin diselesaikan

Banyak orang memiliki pengetahuan praktis yang dapat dibagikan, tetapi belum tentu memiliki akses mudah untuk menemukan partner belajar yang cocok. Di sisi lain, orang yang ingin mempelajari sesuatu sering tidak tahu siapa di komunitasnya yang dapat membantu.

Hambatan yang ingin ditangani:

- **Discovery problem:** sulit menemukan orang yang menguasai skill spesifik dan bersedia mengajarkannya.
- **Reciprocity problem:** platform belajar umum sering memposisikan satu pihak sebagai pengajar dan pihak lain sebagai pembelajar; kesempatan untuk saling bertukar belum menjadi alur utama.
- **Trust problem:** pengguna perlu melihat profil, tujuan, tingkat kemampuan, dan aturan kolaborasi sebelum berinteraksi.
- **Coordination problem:** setelah menemukan partner, kedua pihak masih perlu menyepakati topik, tujuan, jadwal, dan status sesi.
- **Motivation problem:** proses belajar bersama lebih mudah dipertahankan ketika tujuan dan kontribusi masing-masing pihak terlihat jelas.

## 2.2 Hipotesis produk

Jika pengguna dapat mencatat skill yang mereka tawarkan dan skill yang ingin dipelajari, lalu melihat kandidat dengan kecocokan dua arah beserta alasan matching-nya, maka mereka akan lebih mudah menemukan partner belajar yang relevan dan memulai kolaborasi.

Hipotesis ini harus diuji melalui wawancara dan usability test; dokumen ini tidak menganggapnya sebagai fakta pasar yang sudah terbukti.

## 2.3 Mengapa pendekatan pertukaran skill?

SkillLoop berangkat dari gagasan bahwa pengetahuan tersebar di antara banyak orang. Seseorang tidak harus menjadi ahli profesional untuk dapat membantu orang lain; kemampuan dasar atau pengalaman praktis pun bisa bernilai bagi pembelajar yang tepat. Platform perlu membantu pengguna menjelaskan tingkat kemampuan secara jujur dan menetapkan ekspektasi yang realistis.

---

# 3. Visi, Tujuan, dan Batasan Produk

## 3.1 Visi

Membangun ruang digital yang memudahkan orang bertukar pengetahuan dan membentuk hubungan belajar yang saling menguntungkan.

## 3.2 Tujuan produk

1. Membuat proses menemukan partner belajar lebih terarah daripada pencarian profil secara manual.
2. Menjadikan pertukaran dua arah sebagai mekanisme utama, bukan sekadar fitur tambahan.
3. Menurunkan hambatan untuk memulai kolaborasi melalui permintaan dan penjadwalan sesi yang sederhana.
4. Menyediakan pengalaman yang aman, transparan, dan mudah dipahami.
5. Menghasilkan demonstrasi produk full-stack yang menunjukkan kualitas desain, implementasi, dan pemecahan masalah.

## 3.3 Indikator keberhasilan produk

Target berikut adalah **target awal untuk pengujian prototipe**, bukan hasil yang sudah tercapai atau benchmark industri.

| Indikator | Target validasi awal | Cara mengukur |
|---|---:|---|
| Onboarding completion | ≥ 80% pengguna uji | Pengguna menyelesaikan profil dan daftar skill |
| Time to first relevant match | ≤ 3 menit setelah profil lengkap | Waktu dari profil lengkap hingga match relevan pertama tampil |
| Match usefulness | ≥ 70% kandidat teratas dinilai relevan | Survei singkat setelah melihat rekomendasi |
| Request completion | ≥ 50% permintaan uji mendapat keputusan | Permintaan diterima/ditolak, bukan dibiarkan |
| Session scheduling | ≥ 60% request yang diterima memiliki jadwal | Sesi memiliki tanggal/waktu yang disepakati |
| Critical-flow success | ≥ 90% peserta uji menyelesaikan alur utama tanpa bantuan | Moderated usability test |

## 3.4 Bukan tujuan MVP (Non-goals)

MVP tidak bertujuan untuk:

- Menjadi marketplace kursus berbayar atau sistem pembayaran.
- Menjamin keahlian atau sertifikasi profesional pengguna.
- Menjadi platform video conference atau menyediakan panggilan video sendiri.
- Mengganti LMS, sekolah, atau platform pendidikan formal.
- Menawarkan AI tutor yang mengajar seluruh materi.
- Menyediakan sistem reputasi publik yang kompleks.
- Meluncurkan aplikasi mobile native.
- Mendukung komunitas publik berskala besar sejak hari pertama.

---

# 4. Target Pengguna dan Persona

## 4.1 Segmen pengguna awal

- Pelajar dan mahasiswa yang ingin bertukar pengetahuan praktis.
- Pemula yang ingin belajar skill dari orang dengan pengalaman lebih tinggi.
- Hobbyist atau pembelajar mandiri yang ingin berbagi kemampuan.
- Developer, designer, creator, dan anggota komunitas yang mencari partner belajar atau kolaborasi.

**Asumsi MVP:** produk diuji terlebih dahulu dalam komunitas terbatas dan terkontrol. Untuk peluncuran publik yang melibatkan pengguna di bawah umur, perlu peninjauan kebijakan perlindungan pengguna, privasi, moderasi, dan ketentuan hukum yang berlaku. Jangan mengumpulkan tanggal lahir lengkap atau data sensitif hanya untuk kebutuhan matching.

## 4.2 Persona A — The Skill Sharer

**Nama contoh:** Dimas  
**Konteks:** pelajar yang cukup menguasai HTML dan CSS.  
**Tujuan:** ingin membagikan pengetahuannya dan mempelajari desain antarmuka.  
**Hambatan:** tidak tahu siapa yang tertarik belajar HTML/CSS dan bisa mengajarkan UI/UX.  
**Kebutuhan:** profil skill, matching dua arah, dan cara menyepakati sesi.

## 4.3 Persona B — The Curious Learner

**Nama contoh:** Alya  
**Konteks:** pembelajar mandiri yang tertarik pada JavaScript dan desain.  
**Tujuan:** menemukan partner yang dapat membantu belajar secara konsisten.  
**Hambatan:** bingung menilai apakah level partner sesuai dan apakah tujuan belajar mereka cocok.  
**Kebutuhan:** tingkat kemampuan yang jelas, tujuan belajar, dan ekspektasi sesi.

## 4.4 Persona C — The Collaborative Builder

**Nama contoh:** Farhan  
**Konteks:** anggota komunitas teknologi yang ingin membuat proyek kecil bersama.  
**Tujuan:** menemukan orang dengan skill komplementer.  
**Hambatan:** profil komunitas tidak selalu menjelaskan skill yang ditawarkan dan yang sedang dicari.  
**Kebutuhan:** pencarian skill, matching, dan permintaan kolaborasi.

## 4.5 Jobs to Be Done

- Ketika saya ingin belajar skill tertentu, saya ingin menemukan seseorang yang bisa mengajarkannya dan juga tertarik belajar dari saya.
- Ketika saya punya kemampuan yang dapat dibagikan, saya ingin menemukan pembelajar yang tepat tanpa harus menjual kelas.
- Ketika saya menemukan partner, saya ingin mengetahui alasan kecocokan dan menyepakati tujuan serta jadwal dengan jelas.
- Ketika kolaborasi selesai, saya ingin mencatat apa yang sudah dipelajari dan memberikan feedback yang konstruktif.

---

# 5. Konsep Produk dan Prinsip Pengalaman

## 5.1 Model pertukaran

Setiap pengguna dapat memiliki dua jenis entri skill:

- **Can teach:** skill yang bersedia diajarkan atau dibagikan.
- **Want to learn:** skill yang ingin dipelajari.

Kecocokan inti terjadi ketika:

- Pengguna A dapat mengajarkan setidaknya satu skill yang ingin dipelajari pengguna B; dan
- Pengguna B dapat mengajarkan setidaknya satu skill yang ingin dipelajari pengguna A.

Kecocokan satu arah dapat ditampilkan pada fitur pencarian umum di masa depan, tetapi **tidak dianggap sebagai reciprocal match utama** pada MVP.

## 5.2 Prinsip desain

1. **Reciprocity first:** tampilkan nilai yang dapat diberikan dan diterima kedua pihak.
2. **Explainable matching:** jangan hanya menampilkan persentase; jelaskan skill apa yang cocok.
3. **User agency:** pengguna tetap memutuskan apakah akan mengirim, menerima, atau menolak permintaan.
4. **Honest skill representation:** level kemampuan bersifat deklaratif dan bukan sertifikasi.
5. **Low-friction onboarding:** pengguna dapat membuat profil dan menemukan match tanpa formulir berlebihan.
6. **Safety by design:** pengguna bisa membatasi interaksi, menolak permintaan, memblokir, dan melaporkan perilaku bermasalah.
7. **Responsive and accessible:** alur inti harus dapat digunakan di ponsel maupun desktop.

## 5.3 Definisi istilah

| Istilah | Definisi |
|---|---|
| Skill | Kemampuan atau topik yang dapat diajarkan/dipelajari |
| Can teach | Skill yang bersedia dibagikan pengguna |
| Want to learn | Skill yang ingin dipelajari pengguna |
| Reciprocal match | Kecocokan skill dua arah antara dua pengguna |
| Match score | Indikator kecocokan relatif; bukan probabilitas keberhasilan |
| Collaboration request | Permintaan untuk memulai pertukaran skill |
| Learning session | Sesi belajar yang disepakati dua pengguna |
| Skill level | Tingkat kemampuan deklaratif pengguna |

---

# 6. Ruang Lingkup dan Prioritas Fitur

## 6.1 MVP — P0

| ID | Fitur | Deskripsi | Prioritas |
|---|---|---|---|
| FR-001 | Authentication | Registrasi, login, logout, dan pemulihan akses dasar | P0 |
| FR-002 | User profile | Nama tampilan, bio singkat, bahasa, zona waktu, dan avatar opsional | P0 |
| FR-003 | Skill catalog | Pilih skill dari katalog terstandar; hindari tag duplikat yang tidak perlu | P0 |
| FR-004 | Skill declarations | Tambahkan skill ke daftar Can teach atau Want to learn beserta level | P0 |
| FR-005 | Profile completeness | Tampilkan indikator kelengkapan profil dan langkah yang perlu diselesaikan | P0 |
| FR-006 | Reciprocal matching | Temukan kandidat yang memenuhi kecocokan dua arah | P0 |
| FR-007 | Match explanation | Tampilkan skill yang saling ditawarkan dan dicari | P0 |
| FR-008 | Match discovery | Lihat rekomendasi dan filter dasar | P0 |
| FR-009 | Collaboration request | Kirim, terima, tolak, atau batalkan permintaan | P0 |
| FR-010 | Request status | Tampilkan status permintaan secara konsisten | P0 |
| FR-011 | Session scheduling | Sepakati topik, tanggal, jam, zona waktu, dan durasi | P0 |
| FR-012 | Session lifecycle | Tandai sesi sebagai scheduled, completed, atau cancelled | P0 |
| FR-013 | Dashboard | Ringkasan profil, matches, request, dan sesi | P0 |
| FR-014 | Notification center | Notifikasi dalam aplikasi untuk request dan perubahan status | P0 |
| FR-015 | Block and report | Blokir pengguna dan laporkan perilaku/konten | P0 |
| FR-016 | Responsive UI | Layout dan interaksi inti untuk mobile dan desktop | P0 |
| FR-017 | Error/empty states | Pesan untuk kondisi gagal, data kosong, dan loading | P0 |

## 6.2 Setelah MVP — P1

- Messaging dasar yang hanya tersedia setelah request diterima.
- Feedback setelah sesi selesai.
- Progress log dan tujuan belajar per sesi.
- Availability slots untuk mempermudah penjadwalan.
- Skill alias/sinonim yang lebih luas.
- Email notification dan email verification jika provider sudah dipilih.
- Dashboard admin untuk meninjau laporan.

## 6.3 Pengembangan lanjutan — P2

- AI-assisted skill categorization dan rekomendasi.
- Group learning dan multi-person skill exchange.
- Integrasi kalender eksternal.
- Learning roadmap yang dibangun bersama.
- Pencarian lintas bahasa.
- Realtime chat, file sharing, dan video meeting integration.
- Badge atau achievement berbasis aktivitas yang terverifikasi.

## 6.4 Batasan fitur MVP

Agar proyek dapat diselesaikan dengan kualitas baik, MVP tidak perlu membangun real-time chat, video call, payment, AI chatbot, atau sistem komunitas berskala besar. Sediakan alur permintaan dan penjadwalan yang jelas terlebih dahulu. Fitur P1/P2 baru dikerjakan setelah seluruh alur P0 lulus pengujian.

---

# 7. User Journey dan Alur Utama

## 7.1 Journey: pengguna baru

1. Membuka landing page.
2. Memahami konsep “teach one skill, learn another”.
3. Membuat akun.
4. Login dan melengkapi profil.
5. Memilih skill yang bisa diajarkan.
6. Memilih skill yang ingin dipelajari.
7. Mengatur level kemampuan dan bahasa.
8. Menyelesaikan onboarding.
9. Melihat reciprocal matches.
10. Membuka detail match dan membaca alasan kecocokan.

## 7.2 Journey: mengirim collaboration request

1. Pengguna A membuka kartu match B.
2. Pengguna A melihat ringkasan skill exchange dua arah.
3. Pengguna A memilih skill/topik yang ingin dipertukarkan.
4. Pengguna A mengisi pesan pengantar singkat atau tujuan sesi terstruktur.
5. Pengguna A mengirim request.
6. Sistem membuat notifikasi kepada B.
7. B menerima atau menolak request.
8. Jika diterima, sistem mengaktifkan langkah penjadwalan.

## 7.3 Journey: menjadwalkan sesi

1. Kedua pihak memilih topik atau tujuan sesi.
2. Pengusul menentukan tanggal, jam, zona waktu, dan durasi.
3. Pihak lain menerima atau mengusulkan perubahan.
4. Setelah disepakati, sesi berstatus `SCHEDULED`.
5. Pengguna dapat melihat detail sesi dari dashboard.
6. Setelah sesi, salah satu pihak dapat mengusulkan status selesai; pihak lain dapat mengonfirmasi.

## 7.4 Diagram alur ringkas

```text
Landing page
    |
    v
Register / Login
    |
    v
Complete profile + skill declarations
    |
    v
Reciprocal matching engine
    |
    v
Match list + explanation
    |
    v
Send collaboration request
    |
    +---- Rejected / Cancelled
    |
    v
Accepted
    |
    v
Propose session details
    |
    v
Confirm schedule
    |
    v
Learning session
    |
    v
Complete / Cancel + optional feedback
```

---

# 8. Functional Requirements — Detail

## 8.1 Authentication and account

**FR-001 — Authentication**

- Pengguna dapat mendaftar dengan email dan password.
- Email harus unik dan divalidasi formatnya.
- Password disimpan dalam bentuk hash yang kuat; password mentah tidak boleh disimpan atau dicatat dalam log.
- Pengguna dapat login dan logout.
- Pengguna yang belum login tidak dapat mengakses dashboard dan endpoint privat.
- Pengguna dapat memulai proses pemulihan akses jika mekanisme email sudah dikonfigurasi.

**Acceptance criteria**

- Registrasi valid menghasilkan akun baru.
- Email duplikat menghasilkan pesan yang dapat dipahami.
- Password yang salah tidak menghasilkan sesi autentikasi.
- Logout membatalkan sesi aktif.
- Endpoint privat mengembalikan status unauthorized untuk pengguna yang belum terautentikasi.

## 8.2 Profil pengguna

**FR-002 — User profile**

Field MVP:

- `displayName` — wajib.
- `username` — unik, opsional pada MVP jika tidak diperlukan untuk URL.
- `bio` — opsional, panjang dibatasi.
- `avatarUrl` — opsional.
- `preferredLanguages` — satu atau lebih bahasa.
- `timezone` — zona waktu IANA, misalnya `Asia/Jakarta`.
- `createdAt`, `updatedAt`.

Jangan tampilkan alamat email atau informasi pribadi lain kepada pengguna lain secara default.

**Acceptance criteria**

- Pengguna dapat melihat dan mengubah profil sendiri.
- Pengguna tidak dapat mengubah profil milik orang lain.
- Input dibatasi panjangnya dan disanitasi saat ditampilkan.

## 8.3 Skill catalog dan deklarasi skill

**FR-003 — Skill catalog**

- Skill dipilih dari katalog kategori dan nama skill.
- Katalog minimal mendukung pencarian berdasarkan nama.
- Katalog menghindari variasi duplikat yang jelas, misalnya `JS` dan `JavaScript`, dengan alias yang dikelola.
- Pengguna dapat menyarankan skill baru melalui mekanisme yang tidak otomatis memublikasikannya tanpa validasi.

**FR-004 — Skill declarations**

Setiap deklarasi berisi:

- Skill yang dipilih.
- Role: `TEACH` atau `LEARN`.
- Untuk `TEACH`: self-assessed proficiency.
- Untuk `LEARN`: desired level atau learning goal.
- Deskripsi singkat opsional.

Tingkat kemampuan yang disarankan:

- `BEGINNER` — memahami dasar dan masih perlu panduan.
- `INTERMEDIATE` — mampu menerapkan skill dalam tugas/proyek umum.
- `ADVANCED` — pengalaman lebih luas dan mampu menangani kasus lebih kompleks.

Label harus disertai helper text agar pengguna tidak menganggapnya sertifikasi.

**Acceptance criteria**

- Pengguna dapat menambah, mengubah, dan menghapus deklarasi skill sendiri.
- Skill yang sama tidak boleh ditambahkan berulang kali dengan role yang sama.
- Satu skill dapat muncul pada kedua role jika pengguna memang ingin mengajarkan dan mempelajarinya pada level berbeda.

## 8.4 Reciprocal matching

**FR-006 — Matching engine**

Sistem mencari kandidat aktif yang memenuhi minimal satu hubungan skill dua arah:

- Skill yang diajarkan A cocok dengan skill yang ingin dipelajari B.
- Skill yang diajarkan B cocok dengan skill yang ingin dipelajari A.

Kandidat dikecualikan jika:

- Akun tidak aktif atau dinonaktifkan.
- Salah satu pihak memblokir pihak lain.
- Kecocokan hanya satu arah.
- Request aktif/diterima untuk pasangan yang sama sudah ada, kecuali sistem memang menampilkan status hubungan yang sudah berjalan.

**FR-007 — Match explanation**

Setiap kartu match harus menjelaskan:

- Apa yang A dapat ajarkan kepada B.
- Apa yang B dapat ajarkan kepada A.
- Kecocokan level yang relevan jika tersedia.
- Alasan kandidat masuk daftar rekomendasi.

Jangan menampilkan persentase match tanpa penjelasan.

Detail algoritma terdapat di Bagian 9.

## 8.5 Collaboration request

**FR-009 — Request lifecycle**

Status yang digunakan:

- `PENDING` — menunggu keputusan penerima.
- `ACCEPTED` — diterima; sesi dapat dijadwalkan.
- `REJECTED` — ditolak.
- `CANCELLED` — dibatalkan oleh pengirim sebelum diterima.
- `EXPIRED` — opsional jika kebijakan kedaluwarsa diaktifkan.

Aturan:

- Pengirim tidak dapat mengirim request duplikat yang masih `PENDING` kepada penerima yang sama.
- Penerima hanya dapat menerima atau menolak request yang ditujukan kepadanya.
- Pengirim dapat membatalkan request yang masih `PENDING`.
- Setelah `ACCEPTED`, request tidak dapat diubah kembali menjadi `PENDING`.
- Semua perubahan status dicatat dengan timestamp.

**Acceptance criteria**

- Status request konsisten di kedua akun.
- Pengguna yang tidak terlibat tidak dapat membaca atau mengubah request.
- Perubahan status menghasilkan notifikasi dalam aplikasi.

## 8.6 Learning session

**FR-011 / FR-012 — Scheduling and session lifecycle**

Field sesi:

- `requestId`.
- `topic`.
- `description` atau tujuan belajar.
- `proposedBy`.
- `startAt` dalam format UTC.
- `timezone` IANA untuk tampilan lokal.
- `durationMinutes`.
- `status`: `PROPOSED`, `SCHEDULED`, `COMPLETED`, `CANCELLED`.
- `createdAt`, `updatedAt`.

Aturan:

- Sesi hanya dapat dibuat untuk request berstatus `ACCEPTED`.
- Tanggal/waktu harus berada di masa depan saat diajukan.
- Simpan waktu secara konsisten dalam UTC dan tampilkan sesuai zona waktu pengguna.
- Perubahan jadwal membutuhkan persetujuan pihak lain.
- Pembatalan memerlukan alasan opsional dan menghasilkan notifikasi.

**Acceptance criteria**

- Pengguna dapat melihat sesi yang melibatkan dirinya.
- Pengguna yang tidak terlibat tidak dapat mengakses sesi.
- Perbedaan zona waktu tidak boleh mengubah instant waktu yang disepakati.

## 8.7 Dashboard dan notifikasi

Dashboard MVP memuat:

- Kelengkapan profil.
- Jumlah reciprocal matches baru.
- Request masuk dan keluar beserta status.
- Sesi terjadwal berikutnya.
- Shortcut untuk mengelola skill.

Notifikasi dalam aplikasi dibuat untuk:

- Request baru.
- Request diterima/ditolak/dibatalkan.
- Proposal jadwal baru atau perubahan jadwal.
- Sesi dikonfirmasi, diselesaikan, atau dibatalkan.
- Laporan atau tindakan moderasi yang relevan bila perlu dikomunikasikan.

Notifikasi harus dapat ditandai telah dibaca. Pengguna hanya boleh membaca notifikasi miliknya.

## 8.8 Block, report, and safety

**FR-015 — Safety controls**

- Pengguna dapat memblokir pengguna lain.
- Setelah diblokir, kedua pihak tidak boleh saling ditemukan sebagai match baru atau mengirim request baru.
- Pengguna dapat melaporkan profil atau perilaku dengan kategori dan deskripsi singkat.
- Laporan disimpan untuk ditinjau; jangan menampilkan identitas pelapor kepada pihak yang dilaporkan.
- MVP minimal menyediakan status laporan `OPEN`, `IN_REVIEW`, `RESOLVED`, `DISMISSED` pada model data/admin sederhana.
- Jangan mengizinkan unggahan file atau pertukaran kontak pribadi pada MVP.

---

# 9. Matching Engine — Aturan dan Algoritma MVP

## 9.1 Tujuan algoritma

Matching engine harus menemukan pasangan yang memiliki peluang pertukaran skill dua arah. Pada MVP, algoritma dibuat deterministik, transparan, cepat, dan mudah diuji. Jangan memakai AI/LLM untuk menentukan match inti sebelum tersedia dataset dan evaluasi yang memadai.

## 9.2 Normalisasi skill

- Setiap skill memiliki ID kanonis, nama, kategori, dan daftar alias.
- Contoh alias: `JS`, `Javascript`, `Java Script` dipetakan ke skill kanonis `JavaScript`.
- Pada MVP, matching berdasarkan skill ID yang sama atau alias yang telah dipetakan.
- Semantic similarity yang tidak pasti tidak boleh otomatis dianggap sebagai kecocokan.

## 9.3 Eligibility rule

Pasangan A dan B menjadi reciprocal match apabila:

1. A memiliki minimal satu `TEACH` skill yang sama dengan minimal satu `LEARN` skill B.
2. B memiliki minimal satu `TEACH` skill yang sama dengan minimal satu `LEARN` skill A.
3. Kedua akun aktif dan tidak saling memblokir.

## 9.4 Match score yang dapat dijelaskan

Untuk setiap arah pertukaran, hitung:

`DirectionScore = 0.70 × SkillFit + 0.20 × LevelFit + 0.10 × AvailabilityFit`

Setiap komponen berada pada rentang 0–100.

- `SkillFit`: 100 jika skill kanonis sama; nilai yang lebih rendah hanya boleh dipakai untuk alias/relasi skill yang sudah dikurasi. Untuk MVP awal, gunakan 100 untuk exact canonical match.
- `LevelFit`: menilai apakah tingkat pengajar sesuai dengan tingkat yang dicari pembelajar. Jika data level tidak lengkap, gunakan nilai netral dan jangan menghukum pengguna secara berlebihan.
- `AvailabilityFit`: berdasarkan overlap ketersediaan jika fitur availability sudah diaktifkan. Jika tidak tersedia, gunakan nilai netral atau keluarkan komponen ini dari skor versi awal; jangan mengarang jadwal.

Hitung dua arah:

- `AtoB`: kemampuan A memenuhi kebutuhan belajar B.
- `BtoA`: kemampuan B memenuhi kebutuhan belajar A.

Skor akhir memberi penalti pada pertukaran yang timpang:

`OverallScore = 0.65 × min(AtoB, BtoA) + 0.35 × average(AtoB, BtoA)`

Alasan memakai nilai minimum: pasangan dengan satu arah sangat kuat tetapi arah sebaliknya lemah tidak boleh mengungguli pasangan yang lebih seimbang.

**Catatan implementasi:** versi MVP boleh mulai dari aturan exact match tanpa availability. Nomor versi algoritma harus dicatat (misalnya `matchingAlgorithmVersion = 1`) agar perubahan bobot dapat diuji dan dibandingkan.

## 9.5 Sorting dan filter

Urutan default:

1. Overall score tertinggi.
2. Profil yang lebih lengkap.
3. Kecocokan jadwal, jika tersedia.

Filter MVP:

- Kategori skill.
- Bahasa komunikasi.
- Level belajar/pengajaran.

Filter tidak boleh membuat kandidat yang terblokir muncul kembali.

## 9.6 Anti-pattern yang harus dihindari

- Menampilkan one-way match sebagai reciprocal match.
- Menyebut skor sebagai probabilitas atau jaminan keberhasilan.
- Menggunakan data sensitif untuk ranking.
- Mengklaim AI matching jika algoritmanya hanya rule-based.
- Menyimpan skor lama tanpa menghitung ulang setelah pengguna mengubah skill.

---

# 10. UX, UI, dan Informasi Arsitektur Layar

## 10.1 Prinsip visual

Arah visual yang disarankan:

- Modern, jelas, dan berorientasi pada produktivitas.
- Terlihat ramah dan kolaboratif, bukan seperti situs lowongan kerja atau marketplace transaksi.
- Tipografi mudah dibaca dan hierarki informasi kuat.
- Warna utama dan aksen dipilih untuk kontras dan aksesibilitas; jangan bergantung pada warna saja untuk menyampaikan status.
- Animasi hanya untuk memberi feedback, bukan menghambat alur.

Detail visual final merupakan keputusan desain tersendiri; PRD ini tidak mengunci palet warna atau font.

## 10.2 Daftar layar

| Screen ID | Layar | Tujuan | Prioritas |
|---|---|---|---|
| UI-001 | Landing page | Menjelaskan value proposition dan CTA | P0 |
| UI-002 | Register/Login | Autentikasi pengguna | P0 |
| UI-003 | Onboarding profile | Mengumpulkan profil dasar | P0 |
| UI-004 | Skill setup | Menentukan Can teach dan Want to learn | P0 |
| UI-005 | Dashboard | Ringkasan aktivitas pengguna | P0 |
| UI-006 | Discover matches | Menampilkan kandidat reciprocal match | P0 |
| UI-007 | Match detail | Menjelaskan kecocokan dua arah | P0 |
| UI-008 | Requests | Mengelola request masuk/keluar | P0 |
| UI-009 | Session detail | Menjadwalkan dan melihat sesi | P0 |
| UI-010 | Profile detail | Menampilkan profil publik terbatas | P0 |
| UI-011 | Settings | Mengelola akun dan preferensi | P0 |
| UI-012 | Report/block flow | Kontrol keselamatan | P0 |
| UI-013 | Admin moderation | Meninjau laporan | P1 |
| UI-014 | Feedback/progress | Memberi feedback dan catatan sesi | P1 |

## 10.3 Komponen UI penting

- Skill chip dengan label `Can teach` atau `Want to learn`.
- Kartu match dengan dua kolom pertukaran yang jelas.
- Badge status request yang tidak mengandalkan warna saja.
- Empty state yang menyarankan tindakan konkret, misalnya menambah skill atau memperluas filter.
- Loading skeleton untuk data yang sedang dimuat.
- Error state dengan opsi mencoba kembali.
- Form dengan validasi inline dan pesan kesalahan yang spesifik.

## 10.4 Accessibility dan responsive behavior

- Navigasi dapat digunakan dengan keyboard.
- Form memiliki label yang terhubung dengan input.
- Focus state terlihat.
- Kontras teks memenuhi standar aksesibilitas yang layak; target WCAG 2.2 AA untuk elemen utama.
- Layout diuji setidaknya pada lebar 360 px, tablet, dan desktop.
- Tabel/kartu tidak menyebabkan horizontal overflow pada layar kecil.

---

# 11. Data Model dan Database

Model konseptual berikut adalah baseline. Nama tabel/kolom dapat disesuaikan saat implementasi, tetapi relasi dan aturan integritas harus dipertahankan.

## 11.1 Entitas utama

### User

- `id` UUID, primary key.
- `email` unique, normalized lowercase.
- `passwordHash`.
- `displayName`.
- `bio` nullable.
- `avatarUrl` nullable.
- `timezone`.
- `isActive` boolean.
- `createdAt`, `updatedAt`.

### Skill

- `id` UUID.
- `name` unique per canonical skill.
- `slug` unique.
- `categoryId`.
- `description` nullable.
- `isActive`.

### SkillAlias

- `id` UUID.
- `skillId` foreign key.
- `alias` normalized.
- Unique constraint pada alias yang telah dinormalisasi.

### SkillCategory

- `id` UUID.
- `name`.
- `slug`.

### UserSkill

- `id` UUID.
- `userId` foreign key.
- `skillId` foreign key.
- `role` enum: `TEACH`, `LEARN`.
- `proficiencyLevel` nullable untuk `TEACH`.
- `targetLevel` nullable untuk `LEARN`.
- `description` nullable.
- `createdAt`, `updatedAt`.
- Unique constraint: `(userId, skillId, role)`.

### UserLanguage

- `id` UUID.
- `userId` foreign key.
- `languageCode`.
- `proficiency` nullable.

### AvailabilitySlot (P1 atau P0 jika jadwal menjadi bagian scoring)

- `id` UUID.
- `userId` foreign key.
- `dayOfWeek`.
- `startMinute`, `endMinute`.
- `timezone`.

### CollaborationRequest

- `id` UUID.
- `senderId`, `recipientId` foreign key ke User.
- `status` enum.
- `introMessage` nullable dengan batas panjang.
- `createdAt`, `updatedAt`, `respondedAt` nullable.
- Constraint untuk mencegah request aktif duplikat sesuai kebijakan aplikasi.

### LearningSession

- `id` UUID.
- `requestId` foreign key.
- `topic`.
- `description` nullable.
- `startAt` UTC timestamp.
- `timezone`.
- `durationMinutes`.
- `status` enum.
- `proposedBy` foreign key.
- `createdAt`, `updatedAt`.

### Notification

- `id` UUID.
- `userId` foreign key.
- `type`.
- `title`, `body`.
- `entityType`, `entityId` nullable.
- `readAt` nullable.
- `createdAt`.

### UserBlock

- `id` UUID.
- `blockerId`, `blockedId` foreign key ke User.
- `createdAt`.
- Unique constraint `(blockerId, blockedId)`.
- Tidak boleh memblokir diri sendiri.

### UserReport

- `id` UUID.
- `reporterId`, `reportedUserId` foreign key.
- `category`.
- `description`.
- `status` enum.
- `createdAt`, `reviewedAt` nullable.

### SessionFeedback (P1)

- `id` UUID.
- `sessionId` foreign key.
- `reviewerId` foreign key.
- `rating` optional integer dengan rentang yang ditentukan.
- `comment` nullable.
- `createdAt`.
- Satu feedback per pengguna per sesi.

## 11.2 Relasi tingkat tinggi

```text
User 1---* UserSkill *---1 Skill *---1 SkillCategory
User 1---* UserLanguage
User 1---* CollaborationRequest (sender)
User 1---* CollaborationRequest (recipient)
CollaborationRequest 1---* LearningSession
User 1---* Notification
User 1---* UserBlock (blocker / blocked)
User 1---* UserReport (reporter / reported)
LearningSession 1---* SessionFeedback
```

## 11.3 Aturan integritas

- Gunakan UUID sebagai primary key.
- Gunakan foreign key dan constraint database; jangan hanya mengandalkan validasi frontend.
- Gunakan unique constraint untuk email, skill slug, alias terstandardisasi, dan deklarasi skill per role.
- Gunakan transaksi database saat request diterima dan sesi terkait dibuat jika kedua operasi harus konsisten.
- Terapkan pagination untuk daftar match, request, notifikasi, dan profil.
- Gunakan index untuk foreign key dan kolom pencarian/filter yang sering dipakai.

---

# 12. Arsitektur Teknis

## 12.1 Stack baseline

| Layer | Teknologi | Alasan pemilihan |
|---|---|---|
| Frontend | React + Vite + TypeScript | UI component-based dan development cepat |
| Styling | Tailwind CSS | Konsistensi styling dan responsive layout |
| Backend | Node.js + Express + TypeScript | REST API yang sederhana dan mudah dipisahkan |
| Database | PostgreSQL | Relational data dan integritas relasi |
| ORM | Prisma | Schema, migration, dan type-safe query |
| Authentication | Secure server-side session / cookie | Cocok untuk web app; menghindari penyimpanan token sensitif di localStorage |
| Containerization | Docker Compose | Menjalankan service development secara konsisten |
| Testing | Vitest, Supertest, Playwright (sesuai kebutuhan) | Unit, API integration, dan end-to-end test |

Versi package dipilih saat implementasi berdasarkan rilis stabil dan kompatibilitas. Jangan memaksakan versi lama atau menggunakan package yang tidak lagi dipelihara.

## 12.2 Gambaran arsitektur

```text
Browser
  |
  v
React + Vite + TypeScript
  |
  | HTTPS / REST API
  v
Node.js + Express API
  |
  +---- Authentication / Authorization
  +---- Profile & Skill Service
  +---- Matching Service
  +---- Request & Session Service
  +---- Notification Service
  +---- Safety / Moderation Service
  |
  v
Prisma ORM
  |
  v
PostgreSQL
```

## 12.3 Struktur repository yang disarankan

Monorepo sederhana:

```text
skillloop/
├── apps/
│   ├── web/                 # React frontend
│   └── api/                 # Express backend
├── packages/
│   └── shared/              # Shared types/constants (opsional)
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── docs/
│   ├── PRD_SkillLoop.md
│   └── API.md
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

Struktur final dapat berubah jika alasan teknisnya jelas. Hindari membuat terlalu banyak package atau abstraksi sebelum dibutuhkan.

## 12.4 Docker strategy

Docker digunakan untuk menyederhanakan dan menstandarkan development, bukan sebagai tujuan produk.

- MVP awal: jalankan PostgreSQL melalui Docker Compose.
- Backend/frontend dapat dijalankan secara lokal saat pengembangan awal.
- Tambahkan container untuk API/web jika membuat setup tim lebih konsisten.
- Jangan memasukkan secret ke image atau repository.
- Gunakan volume persisten untuk data database lokal.
- Pisahkan konfigurasi development dan production.
- Sediakan `.env.example` tanpa credential asli.

Contoh service minimal:

```yaml
services:
  db:
    image: postgres:17
    environment:
      POSTGRES_DB: skillloop
      POSTGRES_USER: skillloop_dev
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Contoh ini untuk development lokal. Password produksi, backup, network exposure, dan kebijakan akses harus ditangani terpisah.

---

# 13. API Requirements — REST Endpoint Baseline

Prefix API: `/api/v1`. Semua endpoint privat memerlukan autentikasi dan pemeriksaan otorisasi pada server.

| Method | Endpoint | Tujuan | Auth |
|---|---|---|---|
| POST | `/auth/register` | Membuat akun | Public |
| POST | `/auth/login` | Login | Public |
| POST | `/auth/logout` | Logout | Required |
| GET | `/auth/me` | Mendapatkan pengguna aktif | Required |
| GET | `/profile/me` | Profil sendiri | Required |
| PATCH | `/profile/me` | Memperbarui profil sendiri | Required |
| GET | `/skills` | Mencari katalog skill | Required |
| GET | `/skills/me` | Daftar deklarasi skill sendiri | Required |
| POST | `/skills/me` | Menambahkan deklarasi skill | Required |
| PATCH | `/skills/me/:userSkillId` | Mengubah deklarasi skill | Required |
| DELETE | `/skills/me/:userSkillId` | Menghapus deklarasi skill | Required |
| GET | `/matches` | Daftar reciprocal matches | Required |
| GET | `/matches/:userId` | Detail match dan alasan | Required |
| POST | `/requests` | Mengirim collaboration request | Required |
| GET | `/requests` | Daftar request masuk/keluar | Required |
| PATCH | `/requests/:requestId` | Accept/reject/cancel sesuai hak akses | Required |
| POST | `/sessions` | Membuat proposal sesi | Required |
| GET | `/sessions` | Daftar sesi pengguna aktif | Required |
| GET | `/sessions/:sessionId` | Detail sesi | Required |
| PATCH | `/sessions/:sessionId` | Mengubah jadwal/status yang diizinkan | Required |
| GET | `/notifications` | Daftar notifikasi sendiri | Required |
| PATCH | `/notifications/:id/read` | Tandai notifikasi terbaca | Required |
| POST | `/blocks` | Memblokir pengguna | Required |
| DELETE | `/blocks/:userId` | Membuka blokir | Required |
| POST | `/reports` | Mengirim laporan | Required |

## 13.1 Standar response

Response sukses harus konsisten, misalnya:

```json
{
  "data": {},
  "meta": {}
}
```

Response error harus konsisten dan tidak membocorkan stack trace atau detail internal:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Periksa kembali data yang dikirim.",
    "details": []
  }
}
```

Gunakan HTTP status yang tepat: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `422`, dan `500` sesuai kondisi.

## 13.2 API rules

- Validasi semua request body, query, dan path parameter di backend.
- Jangan percaya `userId` yang dikirim client untuk menentukan pemilik data; ambil identitas dari sesi autentikasi.
- Terapkan pagination dengan batas maksimum.
- Gunakan transaksi pada perubahan status yang saling terkait.
- Gunakan error code stabil agar frontend tidak bergantung pada teks pesan.
- Dokumentasikan endpoint dengan OpenAPI/Swagger jika waktu memungkinkan (P1).

---

# 14. Security, Privacy, dan Safety Requirements

Keamanan harus diterapkan sejak awal, bukan ditambahkan hanya menjelang demo.

## 14.1 Authentication dan session

- Hash password dengan Argon2id atau bcrypt dengan parameter yang sesuai.
- Gunakan cookie `HttpOnly`, `Secure` pada production, dan `SameSite` yang sesuai.
- Jangan menyimpan access token sensitif di `localStorage`.
- Rotasi atau invalidasi session saat login/logout dan perubahan credential penting.
- Terapkan rate limiting pada login, register, dan endpoint sensitif.
- Sediakan perlindungan CSRF jika model cookie/session dan arsitektur memerlukannya.

## 14.2 Authorization

- Terapkan prinsip least privilege.
- Pengguna hanya dapat mengubah profil, skill, notifikasi, dan data miliknya.
- Request/sesi hanya bisa dibaca pihak-pihak yang terlibat.
- Endpoint admin harus memiliki role/permission terpisah.
- Otorisasi harus dilakukan server-side, bukan hanya menyembunyikan tombol di UI.

## 14.3 Validasi dan perlindungan aplikasi

- Validasi semua input di server.
- Gunakan Prisma parameterized queries; hindari raw SQL yang menggabungkan input pengguna secara langsung.
- Escape/sanitize konten saat ditampilkan untuk mengurangi risiko XSS.
- Batasi panjang bio, pesan pengantar, deskripsi skill, dan report.
- Batasi CORS ke origin yang diizinkan.
- Jangan mengembalikan password hash atau secret dalam API response.
- Simpan secret pada environment variables atau secret manager.
- Jangan commit `.env` atau credential ke Git.
- Catat event keamanan tanpa menyimpan password, token, atau data sensitif.

## 14.4 Privacy by design

- Kumpulkan data minimum yang diperlukan.
- Jangan menampilkan email, nomor telepon, atau lokasi presisi secara default.
- Tampilkan zona waktu, bukan alamat atau lokasi rumah.
- Berikan cara untuk menghapus atau menonaktifkan akun sesuai kebijakan yang ditetapkan.
- Tetapkan masa retensi untuk laporan dan log.
- Jelaskan data apa yang ditampilkan ke pengguna lain.

## 14.5 Interaksi yang lebih aman

- Block dan report harus tersedia pada profil dan konteks interaksi yang relevan.
- Setelah block, hentikan discovery dan request antar kedua akun.
- Jangan membuka direct messaging sebelum ada persetujuan/match yang relevan.
- Jangan meminta pengguna membagikan alamat rumah atau kontak pribadi untuk memakai fitur inti.
- Untuk peluncuran publik yang melibatkan remaja, tinjau aturan perlindungan anak, moderasi, consent, dan hukum yang berlaku sebelum membuka akses umum.

---

# 15. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | Halaman inti terasa responsif; target awal API p95 < 500 ms pada dataset demo kecil, di luar operasi eksternal |
| Reliability | Error ditangani dan ditampilkan dengan pesan yang dapat ditindaklanjuti |
| Availability | MVP demo harus tersedia selama periode evaluasi; target uptime produksi ditetapkan setelah hosting dipilih |
| Scalability | Pagination, indexing, dan pemisahan service logic dari route handler |
| Maintainability | TypeScript, struktur modul yang konsisten, linting, dan dokumentasi setup |
| Accessibility | Keyboard navigation, visible focus, label form, dan kontras yang layak |
| Compatibility | Versi terbaru browser utama yang masih didukung; layout mobile dan desktop |
| Security | Auth, authorization, input validation, rate limit, secure secret handling |
| Observability | Structured logs, request IDs, health check, dan error tracking bila tersedia |
| Data integrity | Foreign keys, constraints, transaksi, dan migration yang dapat diulang |

Target performa di atas adalah target pengujian internal awal, bukan SLA yang dijamin.

---

# 16. Analytics dan Event Tracking

Untuk memahami apakah produk menyelesaikan masalahnya, catat event produk yang tidak memuat data pribadi berlebihan.

Event yang disarankan:

- `user_registered`
- `profile_completed`
- `skill_added`
- `matching_results_viewed`
- `match_profile_opened`
- `collaboration_request_sent`
- `collaboration_request_accepted`
- `collaboration_request_rejected`
- `session_proposed`
- `session_confirmed`
- `session_completed`
- `user_blocked`
- `user_report_submitted`

Metrik funnel:

`Registered → Profile Completed → Skills Added → Match Viewed → Request Sent → Request Accepted → Session Scheduled → Session Completed`

Jangan menyimpulkan keberhasilan hanya dari jumlah akun atau jumlah match yang ditampilkan. Metrik paling bermakna adalah pengguna berhasil menemukan partner yang relevan dan menjalankan sesi belajar.

---

# 17. Acceptance Criteria MVP — Definition of Done

MVP dapat dianggap layak untuk demo ketika seluruh kondisi P0 berikut terpenuhi:

1. Pengguna dapat register, login, dan logout.
2. Pengguna dapat membuat dan memperbarui profil.
3. Pengguna dapat mencari dan memilih skill dari katalog.
4. Pengguna dapat mengelola daftar Can teach dan Want to learn.
5. Sistem hanya menampilkan reciprocal match yang memenuhi aturan dua arah.
6. Setiap match menunjukkan skill yang cocok dan alasan rekomendasinya.
7. Pengguna dapat mengirim collaboration request.
8. Penerima dapat menerima atau menolak request.
9. Pengirim dapat membatalkan request yang masih pending.
10. Request memiliki status dan timestamp yang konsisten.
11. Request yang diterima dapat digunakan untuk mengajukan sesi.
12. Kedua pihak dapat melihat dan menyepakati jadwal sesi.
13. Dashboard menampilkan request dan sesi yang relevan.
14. Notifikasi dalam aplikasi muncul saat status penting berubah.
15. Pengguna dapat memblokir dan melaporkan pengguna lain.
16. Endpoint privat menerapkan authentication dan authorization.
17. UI responsif pada layar ponsel dan desktop.
18. Loading, error, empty, success, dan validation states ditangani.
19. Database migration dapat dijalankan dari environment baru.
20. Repository memiliki README, `.env.example`, dan instruksi menjalankan project.
21. Tidak ada secret atau credential nyata yang tersimpan di repository.
22. Alur utama dapat didemonstrasikan tanpa data dummy yang tidak dijelaskan.

---

# 18. Testing Strategy

## 18.1 Unit test

Uji fungsi yang memiliki aturan bisnis, terutama:

- Normalisasi skill dan alias.
- Pemeriksaan reciprocal eligibility.
- Perhitungan direction score dan overall score.
- Transisi status request.
- Validasi jadwal dan zona waktu.
- Pemeriksaan block relationship.

## 18.2 API integration test

- Register dengan email valid/duplikat.
- Login dengan credential valid/tidak valid.
- Pengguna tidak dapat mengakses profil pengguna lain untuk operasi privat.
- Deklarasi skill duplikat ditolak.
- Match dua arah muncul; one-way match tidak muncul sebagai reciprocal match.
- Request tidak dapat dibuat berulang dalam status pending.
- Hanya penerima yang dapat menerima/menolak request.
- Hanya pihak yang terlibat dapat mengakses sesi.
- Block mencegah match/request baru.

## 18.3 End-to-end test

Skenario utama:

1. Buat dua akun demo.
2. Akun A menambahkan `JavaScript` sebagai Can teach dan `UI/UX` sebagai Want to learn.
3. Akun B menambahkan `UI/UX` sebagai Can teach dan `JavaScript` sebagai Want to learn.
4. Sistem menampilkan keduanya sebagai reciprocal match.
5. A mengirim request.
6. B menerima request.
7. A mengajukan jadwal sesi.
8. B mengonfirmasi jadwal.
9. Kedua akun melihat sesi yang sama dengan instant waktu yang konsisten.
10. Sesi dapat ditandai selesai sesuai aturan.

## 18.4 Manual usability test

Mintalah beberapa pengguna uji untuk menyelesaikan tugas tanpa instruksi teknis:

- Jelaskan cara kerja SkillLoop setelah membuka landing page.
- Tambahkan satu skill yang bisa diajarkan dan satu yang ingin dipelajari.
- Temukan satu partner yang relevan.
- Jelaskan mengapa sistem merekomendasikan partner tersebut.
- Kirim request dan temukan statusnya.

Catat titik kebingungan, waktu penyelesaian, dan komentar pengguna. Jangan hanya bertanya apakah desainnya bagus.

---

# 19. Deployment, Environment, dan Repository Hygiene

## 19.1 Environment

Pisahkan setidaknya:

- `development` — lokal, database melalui Docker Compose.
- `test` — database/test configuration terisolasi.
- `production` — hosting publik dan managed database.

## 19.2 Environment variables

Contoh nama variable yang mungkin diperlukan:

```env
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://...
SESSION_SECRET=replace-with-a-long-random-secret
FRONTEND_ORIGIN=http://localhost:5173
```

`.env.example` hanya berisi placeholder. `.env` harus masuk `.gitignore`.

## 19.3 Deployment checklist

- Domain dan HTTPS aktif.
- CORS origin dibatasi.
- Secure cookie settings aktif untuk production.
- Database migration dijalankan.
- Secret production tidak sama dengan development.
- Health-check endpoint tersedia.
- Logging tidak memuat password/token.
- Backup database ditinjau sesuai kemampuan provider.
- Demo account dan dataset demo tidak memakai data pribadi nyata.
- Link demo dan repository dapat dibuka oleh juri tanpa izin khusus.

## 19.4 Repository hygiene

- Gunakan branch untuk fitur dan pull request jika bekerja dalam tim.
- Commit message menjelaskan perubahan.
- Sertakan README yang berisi ringkasan, fitur, stack, setup, environment, test, dan demo.
- Jangan commit `node_modules`, build output yang tidak perlu, file `.env`, atau credential.
- Gunakan migration untuk perubahan skema database.
- Catat keputusan teknis penting di `docs/decisions/` jika diperlukan.

---

# 20. Roadmap Implementasi

Roadmap ini berbasis urutan dependensi, bukan janji durasi. Prioritas dapat disesuaikan dengan waktu lomba.

## Phase 0 — Product foundation

- Validasi problem melalui percakapan singkat dengan calon pengguna.
- Tetapkan nama, identitas visual, dan scope final.
- Buat user flow dan wireframe.
- Finalisasi skill categories awal.
- Buat repository dan project setup.

**Exit criteria:** tim sepakat tentang MVP dan user flow sebelum implementasi fitur utama.

## Phase 1 — Foundation and identity

- Setup monorepo atau struktur repo.
- Setup React, Express, TypeScript, Prisma, PostgreSQL.
- Setup Docker Compose untuk database lokal.
- Implement authentication.
- Implement profile dan onboarding.

**Exit criteria:** pengguna dapat membuat akun dan melengkapi profil.

## Phase 2 — Skill system and matching

- Buat skill catalog dan kategori.
- Implement user skill declarations.
- Implement normalisasi alias.
- Implement reciprocal matching dan explanation.
- Buat halaman discover dan detail match.

**Exit criteria:** dua akun dengan data skill yang sesuai menghasilkan reciprocal match yang benar.

## Phase 3 — Collaboration lifecycle

- Implement request lifecycle.
- Implement notification center.
- Implement session proposal dan confirmation.
- Implement dashboard.

**Exit criteria:** alur request hingga sesi terjadwal dapat diselesaikan.

## Phase 4 — Safety, QA, and polish

- Implement block/report.
- Tambahkan loading, empty, error states.
- Tulis unit, integration, dan e2e tests untuk alur kritis.
- Perbaiki responsive UI dan accessibility.
- Lakukan usability test.

**Exit criteria:** seluruh acceptance criteria P0 lulus.

## Phase 5 — Deployment and submission readiness

- Deploy frontend, backend, dan database.
- Jalankan migration pada production.
- Siapkan demo accounts dan skenario demo.
- Rekam video demo.
- Audit repository, secret, dan dokumentasi.
- Verifikasi semua ketentuan kompetisi dari sumber resminya sebelum submission.

**Exit criteria:** aplikasi publik dapat diakses, fitur utama berjalan, repository rapi, dan demo dapat diulang.

---

# 21. Risiko Produk dan Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Tidak banyak pengguna dengan skill yang saling cocok | Match kosong | Mulai dari komunitas terpilih, seed skill catalog yang relevan, sarankan menambah skill terkait tanpa memalsukan match |
| Skill terlalu bebas/duplikat | Matching tidak akurat | Gunakan canonical catalog dan alias terkurasi |
| Pengguna melebih-lebihkan skill | Ekspektasi tidak sesuai | Gunakan self-assessment yang jelas, deskripsi pengalaman, dan feedback setelah sesi |
| Pertukaran tidak seimbang | Salah satu pihak merasa dirugikan | Tampilkan kedua arah pertukaran dan minta kedua pihak menyepakati tujuan |
| Pengguna tidak merespons request | Kolaborasi berhenti | Status dan reminder sederhana; jangan mengirim notifikasi berlebihan |
| Penyalahgunaan atau pelecehan | Pengguna tidak aman | Block/report, pembatasan interaksi, moderasi, dan kebijakan yang jelas |
| Scope terlalu besar | MVP tidak selesai | Patuhi P0; tunda chat realtime, AI, video, dan group learning |
| Masalah deployment | Demo gagal | Uji deployment lebih awal, gunakan health check dan demo fallback |
| Algoritma dianggap tidak transparan | Kepercayaan rendah | Tampilkan alasan match dan dokumentasikan aturan scoring |

---

# 22. Keputusan, Asumsi, dan Pertanyaan Terbuka

## 22.1 Keputusan baseline

| Area | Keputusan baseline |
|---|---|
| Produk | Reciprocal skill exchange web app |
| Nama kerja | SkillLoop |
| Platform | Responsive web application |
| Arsitektur | React/Vite frontend, Express API, PostgreSQL |
| Bahasa implementasi | TypeScript untuk frontend dan backend |
| ORM | Prisma |
| Matching MVP | Rule-based, reciprocal, explainable |
| Payment | Tidak ada |
| AI | Bukan dependency MVP |
| Docker | Docker Compose untuk database development; service containerization bertahap |
| Komunikasi | Collaboration request dan session scheduling pada MVP; chat lanjutan |

## 22.2 Asumsi yang perlu divalidasi

- Pengguna bersedia mengajarkan skill sebagai pertukaran, bukan hanya mencari pengajar gratis.
- Pengguna dapat mengidentifikasi skill dan level mereka dengan cukup jelas.
- Reciprocal match lebih bernilai daripada rekomendasi mentor satu arah untuk segmen awal.
- Katalog skill yang dikurasi lebih mudah digunakan daripada input tag bebas.
- Pengguna bersedia melakukan sesi belajar tanpa pembayaran.

## 22.3 Pertanyaan terbuka

1. Apakah nama final tetap SkillLoop atau menggunakan nama lain?
2. Apakah target awal dibatasi pada komunitas pelajar/teknologi atau langsung lintas kategori skill?
3. Apakah satu request mewakili satu pasangan pertukaran skill atau dapat mencakup beberapa skill sekaligus?
4. Apakah sesi belajar dilakukan online, offline, atau keduanya? MVP tidak perlu mengatur lokasi fisik.
5. Apakah feedback setelah sesi masuk P0 atau P1?
6. Apakah onboarding memerlukan email verification sebelum pengguna mengirim request?
7. Apa kebijakan usia dan moderasi yang akan diterapkan sebelum akses publik?
8. Apakah katalog skill dikelola manual pada MVP atau ada mekanisme usulan skill baru?

AI coding agent tidak boleh membuat keputusan produk besar dari daftar pertanyaan ini. Gunakan baseline yang sudah diputuskan dan minta konfirmasi untuk keputusan terbuka yang berdampak pada arsitektur atau ruang lingkup.

---

# 23. Panduan untuk AI Coding Agent

Bagian ini dimaksudkan sebagai instruksi proyek yang dapat diberikan ke AI coding agent seperti Antigravity, Cursor, Claude Code, atau agent lain.

## 23.1 Aturan kerja agent

1. Baca PRD ini dan `SkillLoop_AI_Agent_Brief.md` sebelum mengubah kode.
2. Jangan membangun seluruh aplikasi dalam satu perubahan besar. Kerjakan per milestone dan fitur yang bisa diuji.
3. Sebelum coding, periksa struktur repository, package manager, file konfigurasi, dan kode yang sudah ada.
4. Jangan menimpa file atau konfigurasi yang ada tanpa memahami dampaknya.
5. Gunakan TypeScript dengan tipe yang jelas; hindari `any` kecuali ada alasan yang dicatat.
6. Validasi input di backend; validasi frontend hanya untuk UX.
7. Semua akses data harus memeriksa ownership/authorization.
8. Matching harus mengikuti aturan reciprocal di Bagian 9. Jangan mengubahnya menjadi one-way mentor matching.
9. Jangan menambahkan payment, real-time chat, video call, atau AI matching ke MVP tanpa persetujuan.
10. Jangan menaruh secret, credential, atau API key di source code.
11. Buat migration database untuk perubahan schema.
12. Tambahkan test untuk logic bisnis dan endpoint penting.
13. Jalankan lint, typecheck, dan test yang tersedia setelah perubahan.
14. Perbarui README dan `.env.example` bila setup berubah.
15. Laporkan file yang diubah, keputusan yang dibuat, perintah test, hasil test, dan pekerjaan yang belum selesai.

## 23.2 Definition of done per fitur

Sebuah fitur belum selesai hanya karena UI terlihat benar. Fitur dinyatakan selesai jika:

- UI berfungsi pada desktop dan mobile.
- API dan validasi server tersedia bila fitur membutuhkan data.
- Authorization dan ownership benar.
- Loading, empty, error, dan success states ditangani.
- Database constraint/migration diperbarui bila diperlukan.
- Unit atau integration test untuk aturan penting tersedia.
- Typecheck dan lint lulus.
- Instruksi dokumentasi diperbarui bila perlu.

## 23.3 Prinsip implementasi

- Utamakan kode sederhana, modular, dan mudah dipelihara.
- Hindari overengineering dan abstraksi yang belum diperlukan.
- Pisahkan route/controller, business service, data access, dan schema validation secara proporsional.
- Gunakan transaksi untuk perubahan state yang perlu atomik.
- Jangan mengandalkan data mock pada jalur production.
- Seed data demo harus jelas, konsisten, dan tidak berisi data pribadi nyata.
- Jangan mengubah requirement produk secara diam-diam; ajukan rekomendasi dan jelaskan trade-off.

---

# 24. Demo Plan untuk Presentasi

## 24.1 Tujuan demo

Membuktikan bahwa SkillLoop bukan hanya halaman profil atau direktori skill, tetapi platform yang dapat menemukan kecocokan dua arah dan membantu dua orang memulai pertukaran belajar.

## 24.2 Data demo

Buat dua akun demo:

**User A — Raka**
- Can teach: HTML, CSS, JavaScript dasar.
- Want to learn: UI/UX Design, Figma.
- Bahasa: Indonesia.
- Zona waktu: Asia/Jakarta.

**User B — Naya**
- Can teach: UI/UX Design, Figma.
- Want to learn: HTML, JavaScript dasar.
- Bahasa: Indonesia.
- Zona waktu: Asia/Jakarta.

Opsional, buat User C dengan kecocokan satu arah saja untuk menunjukkan bahwa algoritma tidak salah menandainya sebagai reciprocal match.

## 24.3 Urutan demo yang disarankan

1. Jelaskan masalah: sulit menemukan partner yang bisa saling mengajar.
2. Tampilkan profil A dan skill yang ditawarkan/dicari.
3. Tampilkan profil B dan skill yang ditawarkan/dicari.
4. Tunjukkan reciprocal match dan alasan kecocokannya.
5. Kirim collaboration request.
6. Login sebagai B dan terima request.
7. Ajukan dan konfirmasi learning session.
8. Tampilkan dashboard dan notifikasi.
9. Jelaskan keputusan teknis utama: matching rule, relational schema, API, authorization, dan deployment.

## 24.4 Pesan utama untuk juri

SkillLoop mengubah pencarian partner belajar menjadi proses pertukaran yang terstruktur. Sistem tidak sekadar merekomendasikan orang dengan minat serupa; sistem mencari dua orang yang masing-masing memiliki kemampuan yang dibutuhkan pihak lain, lalu membantu mereka memulai sesi belajar bersama.

---

# 25. Glosarium

| Istilah | Arti |
|---|---|
| MVP | Minimum Viable Product; versi minimum yang tetap menyelesaikan alur utama |
| PRD | Product Requirements Document |
| Reciprocal | Timbal balik atau dua arah |
| Skill exchange | Pertukaran pengetahuan/keterampilan antarindividu |
| REST API | Pola antarmuka HTTP untuk komunikasi client-server |
| ORM | Object-Relational Mapping |
| Migration | Perubahan struktur database yang dikelola secara bertahap |
| RBAC | Role-Based Access Control |
| PII | Personally Identifiable Information |
| E2E test | Pengujian alur aplikasi dari sudut pandang pengguna |
| UTC | Standar waktu acuan untuk penyimpanan timestamp |

---

## Penutup

SkillLoop harus dibangun dengan fokus pada satu pengalaman inti: **membantu dua orang menemukan alasan yang jelas untuk saling belajar, menyepakati pertukaran, dan benar-benar menjalankan sesi bersama.** Kualitas matching, kejelasan alur, keamanan, dan bukti bahwa alur tersebut berjalan lebih penting daripada jumlah fitur.

