# Aturan proyek MoneyOut

## Fitur admin = wajib persetujuan pemilik
Pemilik (yatufht@gmail.com) menetapkan: **perubahan apa pun pada fitur admin hanya boleh dikerjakan
setelah pemilik memverifikasi/menyetujuinya secara eksplisit di percakapan.** Ini mencakup:
- `app/(app)/admin/**`, `components/admin/**`
- bagian "ADMIN, STATUS AKUN, NOTIFIKASI" di `supabase/moneyout.sql` (tabel `mo_admins`, `mo_activity`,
  `mo_notifications`, fungsi `mo_is_admin`, `mo_is_active`, `mo_admin_set_status`, kebijakan RLS terkait)
- pengumuman (broadcast) di `app/(app)/notifikasi/page.js`, serta `ADMIN_EMAIL` di `lib/config.js`

Pembaruan lain (tampilan, fitur pencatatan, analisis, dll.) boleh langsung diterapkan ke semua pengguna.

## Cara kerja singkat
- Next.js 15 statis (`output: 'export'`), tayang di Cloudflare Workers dari branch `main`
  (https://moneyout.gamma-tau.workers.dev). Push ke `main` = deploy otomatis.
- Supabase project "MoneyOut" (`nrzvlugmkztqfqlnpxok`). Skema lengkap & aman dijalankan ulang: `supabase/moneyout.sql`.
  Perubahan skema harus tetap kompatibel dengan kode lama, dan kode baru harus tetap jalan bila tabel/kolom baru belum ada.
- Dua backend dengan antarmuka sama: `lib/backend/supabase.js` dan `lib/backend/local.js` (mode lokal di browser).
- Bahasa antarmuka: Indonesia. Gaya: lihat bagian "Prinsip tampilan" di README.
