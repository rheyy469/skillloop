# Dokumentasi REST API SkillLoop (`/api/v1`)

Seluruh endpoint privat menggunakan autentikasi berbasis cookie `HttpOnly` (`skillloop_sid`).

## Format Response Standar

### Sukses
```json
{
  "data": {},
  "meta": {}
}
```

### Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Periksa kembali data yang dikirim.",
    "details": []
  }
}
```

## Daftar Endpoint

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `GET` | `/api/v1/health` | Status kesehatan layanan & mode penyimpanan | Public |
| `POST` | `/api/v1/auth/register` | Registrasi pengguna baru | Public |
| `POST` | `/api/v1/auth/login` | Login dengan email & password | Public |
| `POST` | `/api/v1/auth/logout` | Logout & hapus sesi aktif | Required |
| `GET` | `/api/v1/auth/me` | Profil pengguna yang sedang login | Required |
| `GET` | `/api/v1/profile/me` | Detail profil sendiri beserta skor kelengkapan | Required |
| `PATCH` | `/api/v1/profile/me` | Perbarui profil, zona waktu, dan bahasa | Required |
| `GET` | `/api/v1/users/:userId` | Profil publik terbatas pengguna lain | Required |
| `GET` | `/api/v1/skills` | Cari katalog skill kanonis (`?q=&category=`) | Required |
| `GET` | `/api/v1/skills/me` | Daftar deklarasi skill (`TEACH` & `LEARN`) sendiri | Required |
| `POST` | `/api/v1/skills/me` | Tambah deklarasi skill baru | Required |
| `PATCH` | `/api/v1/skills/me/:userSkillId` | Ubah level atau deskripsi deklarasi skill | Required |
| `DELETE` | `/api/v1/skills/me/:userSkillId` | Hapus deklarasi skill | Required |
| `GET` | `/api/v1/matches` | Daftar kandidat reciprocal match (`?category=&language=&level=&search=`) | Required |
| `GET` | `/api/v1/matches/:userId` | Detail kecocokan dua arah & penjelasan | Required |
| `POST` | `/api/v1/requests` | Kirim collaboration request baru | Required |
| `GET` | `/api/v1/requests` | Daftar request masuk/keluar (`?direction=incoming\|outgoing\|all&status=`) | Required |
| `PATCH` | `/api/v1/requests/:requestId` | Aksi status request (`ACCEPT`, `REJECT`, `CANCEL`) | Required |
| `POST` | `/api/v1/sessions` | Buat proposal jadwal sesi belajar untuk request `ACCEPTED` | Required |
| `GET` | `/api/v1/sessions` | Daftar sesi belajar yang melibatkan pengguna aktif | Required |
| `GET` | `/api/v1/sessions/:sessionId` | Detail sesi belajar | Required |
| `PATCH` | `/api/v1/sessions/:sessionId` | Aksi sesi (`CONFIRM`, `RESCHEDULE`, `COMPLETE`, `CANCEL`) | Required |
| `GET` | `/api/v1/notifications` | Daftar notifikasi dalam aplikasi | Required |
| `PATCH` | `/api/v1/notifications/read-all` | Tandai seluruh notifikasi telah dibaca | Required |
| `PATCH` | `/api/v1/notifications/:id/read` | Tandai satu notifikasi telah dibaca | Required |
| `GET` | `/api/v1/blocks` | Daftar pengguna yang diblokir | Required |
| `POST` | `/api/v1/blocks` | Blokir pengguna & batalkan request pending terkait | Required |
| `DELETE` | `/api/v1/blocks/:userId` | Buka blokir pengguna | Required |
| `POST` | `/api/v1/reports` | Kirim laporan keamanan/moderasi | Required |
| `GET` | `/api/v1/dashboard` | Ringkasan dashboard teragregasi | Required |
