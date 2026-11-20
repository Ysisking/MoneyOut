# MoneyOut

Catatan keuangan pribadi untuk masyarakat modern — pekerja kantoran, freelancer, pelaku usaha, mahasiswa.
Semua pengguna wajib **daftar & masuk** (email + password) sebelum bisa mencatat.

## Menu
| Menu | Isi |
|---|---|
| **Dasbor** | Saldo bisa dipakai, ringkasan bulan ini, total simpanan, hutang & piutang aktif, jatuh tempo 7 hari, pengeluaran per kategori, transaksi terakhir |
| **Pemasukan** | Gaji bulanan, freelance / harian, bonus & THR, usaha, hasil investasi, dll. |
| **Pengeluaran** | Makan & minum, kopi & jajan, parkir, transportasi, bensin, pakaian, belanja bulanan, tagihan, pulsa, kesehatan, hiburan, dll. |
| **Simpanan** | Tabungan, dana darurat, investasi, emas, beli aset, deposito — plus total terkumpul per jenis |
| **Hutang & Piutang** | Siapa meminjam berapa, jatuh tempo, cicilan / pembayaran, status lunas |
| **Laporan** | Grafik & tabel arus uang per bulan dalam setahun, rincian per kategori, ekspor CSV |
| **Kategori** | Kategori bawaan + tambah kategori sendiri |
| **Akun** | Ubah username & status pekerjaan, ganti password, keluar |

Tombol **+ Catat transaksi** selalu ada (sidebar di desktop, tombol bulat di tengah bawah di HP).

**Saldo bisa dipakai** = total pemasukan − pengeluaran − simpanan. Hutang & piutang dicatat terpisah
dan tidak mengubah saldo.

## Pendaftaran
Isian: **email, username, password, status pekerjaan** (diketik bebas, bukan pilihan).
Username 3–20 karakter (huruf, angka, titik, garis bawah) dan harus unik. Password minimal 8 karakter.

## Teknologi
Next.js 15 (situs statis, `output: 'export'`) + Tailwind CSS + Supabase (Auth & database Postgres).
Keamanan data dijaga **Row Level Security**: setiap pengguna hanya bisa membaca dan mengubah datanya sendiri.

## Dua mode
| | Tanpa Supabase (mode lokal) | Dengan Supabase |
|---|---|---|
| Akun & data | Hanya di browser itu (localStorage) | Di server, bisa dibuka dari perangkat mana pun |
| Cocok untuk | Mencoba-coba / demo | Dipakai sungguhan |

## Mengaktifkan Supabase
1. Buka project Supabase (boleh project yang sama dengan web lain; semua tabel berawalan `mo_`).
2. **SQL Editor** → tempel seluruh isi `supabase/moneyout.sql` → Run. Aman dijalankan ulang.
3. **Authentication → Sign In / Providers → Email**: pastikan aktif. Bila *Confirm email* aktif,
   pengguna baru harus klik tautan di email sebelum bisa masuk.
4. **Authentication → URL Configuration**: isi *Site URL* dengan alamat web MoneyOut.
5. **Project Settings → API**: salin *Project URL* dan *anon public key* →
   isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` (lokal: `.env.local`;
   GitHub Pages: secret `SUPABASE_URL` & `SUPABASE_ANON_KEY`).

## Menjalankan di laptop
```bash
npm install
npm run dev     # http://localhost:3200
```

## Menerbitkan
- **GitHub Pages**: Settings → Pages → Source: *GitHub Actions*, lalu push ke `main`
  (workflow `.github/workflows/pages.yml`). Untuk repo privat, GitHub Pages butuh paket berbayar.
- **Cloudflare**: `npm run build` lalu tayangkan folder `out/` (sudah ada `wrangler.jsonc`).
- **Vercel / Netlify**: build command `npm run build`, output `out`.

## Struktur
```
app/(auth)/masuk, daftar      halaman masuk & daftar
app/(app)/...                 halaman setelah login (dasbor, pemasukan, dst.)
components/                   AppShell (menu), TxForm, TxPage, dll.
lib/backend/                  supabase.js & local.js — antarmuka data yang sama
lib/categories.js             daftar kategori bawaan
supabase/moneyout.sql         skema database + RLS
```
