# MoneyOut

Catatan keuangan pribadi untuk masyarakat modern — pekerja kantoran, freelancer, pelaku usaha, mahasiswa.
Semua pengguna wajib **daftar & masuk** (email + password) sebelum bisa mencatat.

## Menu
| Menu | Isi |
|---|---|
| **Dasbor** | Saldo bisa dipakai, ringkasan bulan ini, total simpanan, hutang & piutang aktif, jatuh tempo 7 hari, cuplikan Data Analyst, pengeluaran per kategori, transaksi terakhir |
| **Input Variable** | Sub-menu pencatatan: |
| ↳ Pemasukan | Gaji bulanan, freelance / harian, bonus & THR, usaha, hasil investasi, dll. |
| ↳ Pengeluaran | Makan & minum, kopi & jajan, parkir, transportasi, bensin, pakaian, belanja bulanan, tagihan, pulsa, kesehatan, hiburan, dll. |
| ↳ Simpanan | Tabungan, dana darurat, investasi, emas, beli aset, deposito — plus total terkumpul per jenis |
| ↳ Hutang & Piutang | Siapa meminjam berapa, jatuh tempo, cicilan / pembayaran, status lunas |
| **Data Analyst** | Kesimpulan bulanan dalam bahasa sehari-hari, skor kesehatan keuangan (0–100), temuan, risiko, peluang, dan perbandingan dengan aturan 50/30/20 |
| **Laporan** | Grafik & tabel arus uang per bulan dalam setahun, rincian per kategori, ekspor CSV |
| **Profil** | Klik foto/nama di kiri bawah (HP: lingkaran di kanan atas) — ubah username & status pekerjaan, ganti password, keluar |

Tombol **+ Catat transaksi** selalu ada (sidebar di desktop, tombol bulat di tengah bawah di HP).
Kategori sendiri bisa ditambahkan langsung dari form catat transaksi (kotak **Kategori baru**).

### Cara kerja Data Analyst
Dihitung di browser dari catatan pengguna sendiri (`lib/insights.js`), tanpa layanan luar. Yang dibaca antara lain:
rasio pengeluaran & simpanan terhadap pemasukan, kecukupan dana darurat (tabungan + dana darurat ÷ rata-rata
pengeluaran bulanan), lonjakan kategori dibanding bulan-bulan sebelumnya pada tanggal yang sama, kebocoran
dari belanja kecil (≤ Rp 50.000), pola akhir pekan, ketergantungan pada satu sumber pemasukan, naik-turunnya
pemasukan, laju belanja vs sisa hari, serta hutang/piutang yang jatuh tempo.

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

## Supabase yang dipakai
Project **MoneyOut** (`nrzvlugmkztqfqlnpxok`, region Singapura). URL & kunci anon-nya sudah ada di
`.env.production`, jadi build di Cloudflare otomatis tersambung tanpa mengisi variabel apa pun.
Kunci anon memang publik; jangan pernah menaruh `service_role` key di repo.

## Mengaktifkan Supabase (project lain)
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
app/(app)/...                 halaman setelah login (dasbor, input, analisis, laporan, akun)
components/                   AppShell (menu), TxForm, TxPage, dll.
lib/backend/                  supabase.js & local.js — antarmuka data yang sama
lib/categories.js             daftar kategori bawaan
lib/insights.js               mesin analisis Data Analyst
supabase/moneyout.sql         skema database + RLS
```
