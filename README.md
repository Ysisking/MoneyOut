# MoneyOut

**Web:** https://moneyout.gamma-tau.workers.dev · tampil di etalase gammaproject official store (menu Website).

Catatan keuangan pribadi untuk masyarakat modern — pekerja kantoran, freelancer, pelaku usaha, mahasiswa.
Semua pengguna wajib **daftar & masuk** (email + password) sebelum bisa mencatat.

## Akses pengguna
Pendaftar baru berstatus **menunggu** dan hanya melihat layar status sampai admin menekan *Accept*.
Status (`pending`, `queued`, `active`, `blocked`, `frozen`) dijaga di database: akun yang tidak aktif tidak bisa
membaca atau menulis data keuangan meski lewat API langsung, pengguna tidak bisa mengubah statusnya sendiri,
dan hanya akun di tabel `mo_admins` yang bisa memanggil `mo_admin_set_status` atau mengirim pengumuman.
Perubahan pada fitur admin hanya dilakukan dengan persetujuan pemilik (lihat `CLAUDE.md`).

## Arsitektur & rujukan
MoneyOut meniru pola aplikasi keuangan pribadi yang sudah teruji puluhan tahun, bukan pola "dashboard kartu" generik:

| Pola | Rujukan | Di MoneyOut |
|---|---|---|
| **Dompet (akun) + register** dengan saldo berjalan, seperti buku cek kertas | Quicken (sejak 1983), Microsoft Money, GnuCash | Daftar dompet di sidebar; tiap dompet punya register `/dompet/?id=…` |
| **Transfer antar-akun** | GnuCash, HomeBank | Tab "Pindah" di form catat (tarik tunai, top up e-wallet) |
| **Cocokkan saldo** (rekonsiliasi) | Quicken, GnuCash | Tulis saldo nyata → selisih dicatat sebagai *Penyesuaian Saldo* (tidak dihitung di analisis) |
| **Amplop anggaran** per kategori | YNAB (sejak 2004), metode amplop | Jatah bulanan per kategori, penanda "hari ini", sisa jatah per hari |
| **Saran jatah harian, kalender belanja, multi-dompet** | Money Lover, Wallet | Kalender pengeluaran (klik tanggal untuk menyaring) |
| **Grafik saldo dari waktu ke waktu** sebagai fokus utama | Mercury, Copilot, Wise | Dasbor & halaman dompet, dengan tooltip saat diarahkan |
| **Pintasan keyboard** | Quicken/GnuCash, aplikasi profesional | `N` = catat transaksi, `Ctrl/⌘ + Enter` = simpan |

### Prinsip tampilan
- Satu tipe huruf (**Geist**) dengan angka tabular; skala ukuran tetap (12/13/14/15/17/20/24/30/38 px).
- Latar netral putih/abu-abu; **hijau hanya untuk uang masuk**, merah/kuning hanya untuk peringatan.
- Garis rambut dan ruang kosong untuk mengelompokkan, bukan kotak berwarna di mana-mana.
- Tombol utama hitam; ikon kategori di lingkaran netral; teks singkat dan lugas.
- Token desain ada di `tailwind.config.js` (`canvas`, `subtle`, `well`, `line`, `edge`, `ink`, `sub`, `faint`, `pos`, `neg`, `warn`)
  dan kelas dasar di `app/globals.css` (`panel`, `btn-primary`, `btn-secondary`, `btn-ghost`, `input`, `field-label`, `num`).

## Menu
| Menu | Isi |
|---|---|
| **Dasbor** | Tombol **Reset** di bagian bawah untuk memulai ulang pencatatan (3 langkah konfirmasi: ringkasan + unduh cadangan, ketik RESET + password, jeda 5 detik). Total saldo + grafik saldo (30 hari–1 tahun), pemasukan/pengeluaran/simpanan bulan ini dibanding bulan lalu, transaksi terbaru, pengeluaran per kategori, perlu perhatian (jatuh tempo + risiko), anggaran |
| **Input Variable** | Ringkasan keempat jenis catatan + semua transaksi: |
| ↳ Pemasukan | Gaji bulanan, freelance / harian, bonus & THR, usaha, hasil investasi, dll. |
| ↳ Pengeluaran | Kalender + amplop anggaran + register; kategori makan, kopi, parkir, transport, pakaian, tagihan, dll. |
| ↳ Simpanan | Tabungan, dana darurat, investasi, emas, aset, deposito — plus total terkumpul per jenis |
| ↳ Hutang & Piutang | Siapa meminjam berapa, jatuh tempo, progres cicilan, riwayat pembayaran |
| ↳ Aset & Saldo | Saldo saat ini tiap dompet (uang yang sudah ada sebelum mencatat — mengubah saldo awal, bukan pemasukan) dan aset lain (properti, kendaraan, emas, investasi, deposito, barang berharga). Menghitung **kekayaan bersih** = dompet + simpanan + aset + piutang − hutang |
| **Data Analyst** | Saklar **Deep Analyst** (pojok kanan atas): simpanan ideal menurut jenis pekerjaan + besar penghasilan, keep money, dana darurat, dana pensiun, dana masa depan anak, dan saran investasi; dihitung & disimpan hanya di perangkat pengguna. Ringkasan bulanan, skor kesehatan (0–100), hasil analisis yang bisa disaring (risiko / temuan / peluang), aturan 50/30/20, peringatan anggaran |
| **Notifikasi** | Semua pengguna: kabar status akun dari sistem + pengumuman admin, dengan penanda belum dibaca (ikon lonceng di HP). Admin: tab **Sistem** (mis. pendaftar baru) dan **Pengumuman** (tulis pesan untuk semua pengguna) |
| **Admin** (khusus yatufht@gmail.com, wajib verifikasi ulang password, berlaku 30 menit) | Tombol **Kontrol masuk ON/OFF** (di Admin & Purchase Order): OFF = semua pendaftar langsung bisa memakai web gratis; ON = pendaftar baru menunggu Accept setelah verifikasi pembayaran (layar tunggu menampilkan ajakan menghubungi admin lewat WhatsApp). **Purchase Order**: pendaftar baru — *Accept* (langsung bisa pakai), *Queue* (antre, sistem sibuk), *Block* (dengan alasan). **Order**: pelanggan yang sudah diterima — Accept, Queue, Block, dan *Freeze* (ditangguhkan, mis. belum bayar). **History**: log masuk/keluar/daftar/perubahan status semua pengguna, serta siapa yang aktif (≤10 menit), tidak aktif, diblokir, dibekukan |
| **Laporan** | Grafik & tabel arus uang per bulan dalam setahun, rincian per kategori, ekspor CSV |
| **Dompet** (sidebar) | Saldo per dompet, grafik saldo, transaksi dengan saldo berjalan, pindah dompet, cocokkan saldo, tambah/ubah dompet |
| **Profil** | Klik foto/nama di kiri bawah (HP: lingkaran di kanan atas) |

Tombol **Catat transaksi** selalu ada (sidebar di desktop, tombol bulat di tengah bawah di HP; pintasan `N`) dengan pilihan
Pengeluaran / Pemasukan / Simpanan / Pindah. Kategori sendiri bisa ditambahkan langsung dari form (**+ Baru**).

### Cara kerja Data Analyst
Dihitung di browser dari catatan pengguna sendiri (`lib/insights.js`), tanpa layanan luar. Yang dibaca antara lain:
rasio pengeluaran & simpanan terhadap pemasukan, kecukupan dana darurat (tabungan + dana darurat ÷ rata-rata
pengeluaran bulanan), lonjakan kategori dibanding bulan-bulan sebelumnya pada tanggal yang sama, kebocoran
dari belanja kecil (≤ Rp 50.000), pola akhir pekan, ketergantungan pada satu sumber pemasukan, naik-turunnya
pemasukan, laju belanja vs sisa hari, serta hutang/piutang yang jatuh tempo.

**Saldo dompet** = saldo awal + pemasukan − pengeluaran − simpanan ± pindah dompet. **Kekayaan bersih** = saldo semua dompet + simpanan terkumpul + nilai aset + piutang − hutang. Hutang & piutang dicatat
terpisah dan tidak mengubah saldo.

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
- **Cloudflare** (dipakai sekarang): terhubung ke repo GitHub, build otomatis setiap push ke `main` — `npm run build`, lalu `npx wrangler deploy` menayangkan folder `out/` (lihat `wrangler.jsonc`).
- **Vercel / Netlify**: build command `npm run build`, output `out`.

## Struktur
```
app/(auth)/masuk, daftar      halaman masuk & daftar
app/(app)/...                 halaman setelah login (dasbor, input, analisis, laporan, akun)
components/                   AppShell (menu), TxForm, TxPage, dll.
lib/backend/                  supabase.js & local.js — antarmuka data yang sama
lib/categories.js             daftar kategori bawaan
lib/insights.js               mesin analisis Data Analyst
lib/stats.js                  saldo dompet, deret saldo harian, register, anggaran, kalender
components/Register.js        daftar transaksi per hari (+ saldo berjalan per dompet)
components/BalanceChart.js    grafik saldo dengan tooltip
supabase/moneyout.sql         skema database + RLS
```
