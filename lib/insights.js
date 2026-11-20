// Mesin "Data Analyst": membaca catatan pengguna lalu menyusun kesimpulan,
// temuan, risiko, dan peluang dalam bahasa sehari-hari. Semua dihitung di browser
// dari data pengguna sendiri — tidak ada data yang dikirim ke pihak lain.
import { rupiah, monthLabel, shiftMonth, thisMonth, todayISO, daysInMonth, daysUntil } from './format'
import { total, ofKind, inMonth, byCategory, debtInfo } from './stats'

// Pengelompokan kategori bawaan untuk pembanding aturan 50/30/20.
const KEBUTUHAN = ['Makan & Minum', 'Parkir', 'Transportasi', 'Bensin', 'Belanja Bulanan', 'Tagihan & Listrik', 'Pulsa & Internet', 'Kesehatan', 'Pendidikan', 'Keluarga & Anak']
const KEINGINAN = ['Kopi & Jajan', 'Pakaian', 'Hiburan', 'Liburan', 'Gawai & Elektronik']
// Urutan prioritas saran hemat: keinginan dulu, baru kebutuhan yang masih bisa ditekan.
const BISA_DIHEMAT = ['Kopi & Jajan', 'Hiburan', 'Pakaian', 'Liburan', 'Gawai & Elektronik', 'Makan & Minum', 'Belanja Bulanan']
const DANA_CAIR = ['Tabungan', 'Dana Darurat']
const KECIL = 50000 // batas "pengeluaran kecil" untuk deteksi kebocoran halus

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0)
const fmtPct = (n) => `${Math.round(n)}%`

function monthStats(transactions, key) {
  const tx = inMonth(transactions, key)
  const masuk = total(ofKind(tx, 'pemasukan'))
  const keluar = total(ofKind(tx, 'pengeluaran'))
  const simpan = total(ofKind(tx, 'simpanan'))
  return { key, tx, masuk, keluar, simpan, sisa: masuk - keluar - simpan, count: tx.length }
}

const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : 0)

export function analyze({ transactions, debts, payments }, month = thisMonth()) {
  const cur = monthStats(transactions, month)
  const isCurrent = month === thisMonth()
  const dim = daysInMonth(month)
  const elapsed = isCurrent ? Number(todayISO().slice(8)) : dim

  // Pembanding: hingga 3 bulan sebelumnya yang punya catatan.
  const prev = [1, 2, 3].map((i) => monthStats(transactions, shiftMonth(month, -i))).filter((m) => m.count > 0)
  const prevAvgKeluar = avg(prev.map((m) => m.keluar))
  const prevAvgMasuk = avg(prev.map((m) => m.masuk))
  // Rata-rata bulanan (bulan ini disertakan bila sudah lengkap / cukup hari).
  const basis = [...prev, ...(cur.count && (!isCurrent || elapsed >= 20) ? [cur] : [])]
  const avgKeluar = avg(basis.map((m) => m.keluar)) || cur.keluar
  const avgMasuk = avg(basis.map((m) => m.masuk)) || cur.masuk

  // Seluruh waktu sampai akhir bulan yang dianalisis.
  const until = (t) => t.date.slice(0, 7) <= month
  const allSimpanan = ofKind(transactions.filter(until), 'simpanan')
  const danaCair = total(allSimpanan.filter((t) => DANA_CAIR.includes(t.category)))
  const coverage = avgKeluar ? danaCair / avgKeluar : null

  const debtRows = debts.map((d) => ({ d, ...debtInfo(d, payments) })).filter((r) => !r.done)
  const hutang = debtRows.filter((r) => r.d.kind === 'hutang')
  const piutang = debtRows.filter((r) => r.d.kind === 'piutang')
  const hutangSisa = hutang.reduce((s, r) => s + r.remaining, 0)
  const piutangSisa = piutang.reduce((s, r) => s + r.remaining, 0)
  const overdue = (rows) => rows.filter((r) => r.d.due_date && daysUntil(r.d.due_date) < 0)
  const soon = (rows) => rows.filter((r) => r.d.due_date && daysUntil(r.d.due_date) >= 0 && daysUntil(r.d.due_date) <= 7)

  const hasData = cur.count > 0 || debtRows.length > 0
  const out = { month, isCurrent, hasData, summary: [], findings: [], risks: [], opportunities: [], score: null, budget: null, stats: { ...cur, coverage, danaCair, hutangSisa, piutangSisa, prevCount: prev.length } }
  if (!hasData) return out

  const keluarTx = ofKind(cur.tx, 'pengeluaran')
  const masukTx = ofKind(cur.tx, 'pemasukan')
  const cats = byCategory(keluarTx)
  const sources = byCategory(masukTx)
  const label = monthLabel(month)

  // ------------------------------------------------------------ Kesimpulan
  if (cur.masuk > 0) {
    out.summary.push(`Di ${label}${isCurrent ? ' (sampai hari ini)' : ''}, uang masukmu ${rupiah(cur.masuk)} dari ${sources.length} sumber, terbesar dari ${sources[0].name} (${pct(sources[0].amount, cur.masuk)}%).`)
    out.summary.push(`${pct(cur.keluar, cur.masuk)}% habis untuk pengeluaran, ${pct(cur.simpan, cur.masuk)}% disisihkan ke simpanan, dan ${cur.sisa >= 0 ? `tersisa ${rupiah(cur.sisa)}` : `kurang ${rupiah(-cur.sisa)}`}.`)
  } else if (cur.keluar > 0) {
    out.summary.push(`Di ${label} belum ada pemasukan yang dicatat, sementara pengeluaran sudah ${rupiah(cur.keluar)}.`)
  }
  if (cats[0]) out.summary.push(`Uang paling banyak keluar untuk ${cats[0].name}: ${rupiah(cats[0].amount)} (${pct(cats[0].amount, cur.keluar)}% dari pengeluaran).`)
  if (prev.length && prevAvgKeluar > 0 && cur.keluar > 0 && !isCurrent) {
    const d = (cur.keluar - prevAvgKeluar) / prevAvgKeluar
    if (Math.abs(d) >= 0.05) out.summary.push(`Dibanding rata-rata ${prev.length} bulan sebelumnya, pengeluaranmu ${d > 0 ? 'naik' : 'turun'} ${fmtPct(Math.abs(d) * 100)}.`)
    else out.summary.push(`Pengeluaranmu stabil dibanding rata-rata ${prev.length} bulan sebelumnya.`)
  }

  // ------------------------------------------------------------ Skor kesehatan
  if (cur.masuk > 0) {
    const er = cur.keluar / cur.masuk
    const sr = cur.simpan / cur.masuk
    const parts = [
      { label: 'Pengeluaran vs pemasukan', max: 30, value: er <= 0.5 ? 30 : er <= 0.7 ? 22 : er <= 0.9 ? 12 : er <= 1 ? 5 : 0, note: `${fmtPct(er * 100)} dari pemasukan` },
      { label: 'Porsi yang disimpan', max: 25, value: sr >= 0.2 ? 25 : sr >= 0.1 ? 15 : sr > 0 ? 8 : 0, note: `${fmtPct(sr * 100)} (ideal ≥ 20%)` },
      { label: 'Dana darurat', max: 25, value: coverage === null ? 12 : coverage >= 6 ? 25 : coverage >= 3 ? 18 : coverage >= 1 ? 8 : 0, note: coverage === null ? 'belum bisa dihitung' : `cukup ${coverage.toLocaleString('id-ID', { maximumFractionDigits: 1 })} bulan` },
      { label: 'Beban hutang', max: 20, value: !hutang.length ? 20 : isCurrent && overdue(hutang).length ? 0 : hutangSisa <= 0.3 * avgMasuk ? 14 : 7, note: hutang.length ? `sisa ${rupiah(hutangSisa)}` : 'tidak ada hutang' },
    ]
    const value = parts.reduce((s, p) => s + p.value, 0)
    const level = value >= 80 ? 'baik' : value >= 60 ? 'info' : value >= 40 ? 'perhatian' : 'bahaya'
    const word = value >= 80 ? 'Sehat' : value >= 60 ? 'Cukup baik' : value >= 40 ? 'Perlu perhatian' : 'Rawan'
    out.score = { value, level, word, parts }

    // Aturan 50/30/20 (terhadap pemasukan).
    const kebutuhan = total(keluarTx.filter((t) => KEBUTUHAN.includes(t.category)))
    const keinginan = total(keluarTx.filter((t) => KEINGINAN.includes(t.category)))
    out.budget = {
      rows: [
        { label: 'Kebutuhan', hint: 'makan, transport, tagihan, kesehatan…', value: kebutuhan / cur.masuk, ideal: 0.5, better: 'lower' },
        { label: 'Keinginan', hint: 'jajan, pakaian, hiburan, liburan…', value: keinginan / cur.masuk, ideal: 0.3, better: 'lower' },
        { label: 'Simpanan', hint: 'tabungan, investasi, aset…', value: cur.simpan / cur.masuk, ideal: 0.2, better: 'higher' },
      ],
      lainnya: cur.keluar - kebutuhan - keinginan,
    }
  }

  const F = (x) => out.findings.push(x)
  const R = (x) => out.risks.push(x)
  const P = (x) => out.opportunities.push(x)

  // ------------------------------------------------------------ Risiko
  if (cur.masuk > 0 && cur.keluar > cur.masuk) {
    R({ level: 'bahaya', title: 'Pengeluaran melebihi pemasukan', text: `Kamu mengeluarkan ${rupiah(cur.keluar - cur.masuk)} lebih banyak dari yang masuk. Bila berlanjut, tabungan akan tergerus atau kamu terdorong berhutang.` })
  } else if (cur.masuk > 0 && cur.sisa < 0) {
    R({ level: 'perhatian', title: 'Simpanan melebihi sisa uang', text: `Pengeluaran + simpanan melampaui pemasukan sebesar ${rupiah(-cur.sisa)}. Pastikan uang yang disimpan memang berasal dari sisa, bukan dari dana kebutuhan.` })
  }
  if (isCurrent && elapsed >= 5 && elapsed < dim && cur.keluar > 0) {
    const proj = (cur.keluar / elapsed) * dim
    const base = cur.masuk || prevAvgMasuk
    if (base > 0 && proj > base && cur.keluar <= cur.masuk) {
      R({ level: 'perhatian', title: 'Laju belanja terlalu cepat', text: `Dengan rata-rata ${rupiah(cur.keluar / elapsed)} per hari, pengeluaran akhir bulan diperkirakan ${rupiah(proj)} — melewati pemasukan ${rupiah(base)}.` })
    }
  }
  if (cur.masuk > 0 && cur.simpan / cur.masuk < 0.1) {
    R({ level: 'perhatian', title: 'Porsi simpanan masih kecil', text: `Baru ${fmtPct((cur.simpan / cur.masuk) * 100)} pemasukan yang disisihkan. Usahakan minimal 10–20% agar punya bantalan saat ada kebutuhan mendadak.` })
  }
  if (coverage !== null && coverage < 3) {
    R({ level: coverage < 1 ? 'bahaya' : 'perhatian', title: 'Dana darurat belum aman', text: `Tabungan + dana daruratmu (${rupiah(danaCair)}) hanya cukup untuk ${coverage.toLocaleString('id-ID', { maximumFractionDigits: 1 })} bulan pengeluaran. Idealnya 3–6 bulan, yaitu sekitar ${rupiah(avgKeluar * 3)}.` })
  }
  // Status jatuh tempo hanya relevan untuk bulan berjalan.
  if (isCurrent) overdue(hutang).forEach((r) => R({ level: 'bahaya', title: `Hutang ke ${r.d.person} lewat jatuh tempo`, text: `Sisa ${rupiah(r.remaining)} sudah terlambat ${-daysUntil(r.d.due_date)} hari. Segera bayar atau bicarakan jadwal baru agar hubungan tetap baik.` }))
  if (isCurrent) soon(hutang).forEach((r) => R({ level: 'perhatian', title: `Hutang ke ${r.d.person} segera jatuh tempo`, text: `${rupiah(r.remaining)} harus dibayar ${daysUntil(r.d.due_date) === 0 ? 'hari ini' : `dalam ${daysUntil(r.d.due_date)} hari`}. Sisihkan dari sekarang.` }))
  if (hutangSisa > 0 && avgMasuk > 0 && hutangSisa > 0.5 * avgMasuk && !(isCurrent && overdue(hutang).length)) {
    R({ level: 'perhatian', title: 'Beban hutang cukup besar', text: `Sisa hutangmu ${rupiah(hutangSisa)}, setara ${pct(hutangSisa, avgMasuk)}% pemasukan bulanan. Hindari hutang baru sampai ini turun.` })
  }
  if (sources.length && cur.masuk > 0 && sources[0].amount / cur.masuk >= 0.9 && cur.masuk >= 500000) {
    R({ level: 'info', title: 'Bergantung pada satu sumber pemasukan', text: `${pct(sources[0].amount, cur.masuk)}% uang masuk berasal dari ${sources[0].name}. Bila sumber ini terganggu, arus uangmu ikut berhenti — dana darurat jadi makin penting.` })
  }
  const masukHist = [...prev, cur].filter((m) => m.masuk > 0).map((m) => m.masuk)
  if (masukHist.length >= 3) {
    const m = avg(masukHist)
    const cv = Math.sqrt(avg(masukHist.map((v) => (v - m) ** 2))) / m
    if (cv > 0.35) R({ level: 'info', title: 'Pemasukan naik-turun', text: `Pemasukanmu beberapa bulan terakhir bervariasi cukup tajam (rata-rata ${rupiah(m)}). Atur anggaran berdasarkan bulan terendah, bukan rata-rata.` })
  }

  // ------------------------------------------------------------ Temuan
  if (cats[0] && cur.keluar > 0) {
    const share = cats[0].amount / cur.keluar
    F({ level: share >= 0.5 ? 'perhatian' : 'info', title: `${cats[0].name} jadi pos terbesar`, text: `${rupiah(cats[0].amount)} dalam ${cats[0].count} transaksi, atau ${fmtPct(share * 100)} dari seluruh pengeluaran.` })
  }
  if (prev.length) {
    // Bulan berjalan dibandingkan dengan bulan-bulan lalu sampai tanggal yang sama,
    // agar tagihan awal bulan tidak terlihat seperti lonjakan.
    const prevCats = new Map()
    prev.forEach((m) => byCategory(ofKind(m.tx, 'pengeluaran').filter((t) => Number(t.date.slice(8)) <= elapsed))
      .forEach((c) => prevCats.set(c.name, (prevCats.get(c.name) || 0) + c.amount / prev.length)))
    const changes = cats
      .map((c) => ({ ...c, before: prevCats.get(c.name) || 0 }))
      .filter((c) => c.before > 0)
      .map((c) => ({ ...c, diff: c.amount - c.before, ratio: c.amount / c.before }))
    changes.filter((c) => c.ratio >= 1.3 && c.diff >= 50000).sort((a, b) => b.diff - a.diff).slice(0, 2).forEach((c) =>
      F({ level: 'perhatian', title: `${c.name} naik ${fmtPct((c.ratio - 1) * 100)}`, text: `Bulan ini ${rupiah(c.amount)}, biasanya sekitar ${rupiah(c.before)}${isCurrent ? ' sampai tanggal yang sama' : ''}. Ada kebutuhan khusus, atau mulai jadi kebiasaan?` }))
    const drop = changes.filter((c) => c.ratio <= 0.7 && -c.diff >= 50000).sort((a, b) => a.diff - b.diff)[0]
    if (drop) F({ level: 'baik', title: `${drop.name} berhasil ditekan`, text: `Turun ${fmtPct((1 - drop.ratio) * 100)} dibanding biasanya — hemat sekitar ${rupiah(-drop.diff)}.` })
  }
  const kecil = keluarTx.filter((t) => Number(t.amount) <= KECIL)
  const kecilTotal = total(kecil)
  if (kecil.length >= 8 && kecilTotal >= 0.1 * cur.keluar) {
    F({ level: 'perhatian', title: 'Kebocoran halus dari belanja kecil', text: `${kecil.length} transaksi di bawah ${rupiah(KECIL)} (parkir, kopi, jajan…) totalnya ${rupiah(kecilTotal)} — ${fmtPct((kecilTotal / cur.keluar) * 100)} dari pengeluaran. Kecil satu per satu, besar bila dikumpulkan.` })
  }
  if (keluarTx.length) {
    const big = [...keluarTx].sort((a, b) => b.amount - a.amount)[0]
    const sameAsTop = cats[0] && cats[0].name === big.category && cats[0].count === 1
    if (cur.keluar && big.amount / cur.keluar >= 0.25 && keluarTx.length > 1 && !sameAsTop) {
      F({ level: 'info', title: 'Satu transaksi menyedot banyak', text: `${big.category}${big.note ? ` (${big.note})` : ''} sebesar ${rupiah(big.amount)} memakan ${fmtPct((big.amount / cur.keluar) * 100)} pengeluaran bulan ini.` })
    }
    // Akhir pekan vs hari kerja (rata-rata per hari).
    let wkDays = 0, weDays = 0, wk = 0, we = 0
    for (let d = 1; d <= elapsed; d++) {
      const day = new Date(Number(month.slice(0, 4)), Number(month.slice(5)) - 1, d).getDay()
      if (day === 0 || day === 6) weDays++; else wkDays++
    }
    keluarTx.forEach((t) => { const day = new Date(t.date + 'T00:00:00').getDay(); if (day === 0 || day === 6) we += Number(t.amount); else wk += Number(t.amount) })
    const weAvg = weDays ? we / weDays : 0, wkAvg = wkDays ? wk / wkDays : 0
    if (weDays >= 2 && wkAvg > 0 && weAvg >= 1.5 * wkAvg && we >= 100000) {
      F({ level: 'info', title: 'Akhir pekan lebih boros', text: `Rata-rata belanja Sabtu–Minggu ${rupiah(weAvg)} per hari, ${(weAvg / wkAvg).toLocaleString('id-ID', { maximumFractionDigits: 1 })}× hari kerja (${rupiah(wkAvg)}).` })
    }
    const spendDays = new Set(keluarTx.map((t) => t.date)).size
    const noSpend = elapsed - spendDays
    if (noSpend >= 5 && spendDays >= 3) F({ level: 'baik', title: `${noSpend} hari tanpa pengeluaran`, text: 'Hari-hari tanpa belanja membantu menahan laju pengeluaran. Pertahankan!' })
  }
  if (cur.masuk > 0 && cur.simpan / cur.masuk >= 0.2) {
    F({ level: 'baik', title: 'Disiplin menabung', text: `${fmtPct((cur.simpan / cur.masuk) * 100)} pemasukan sudah disisihkan — sesuai atau melampaui anjuran 20%.` })
  }
  if (isCurrent && elapsed >= 7) {
    const days = new Set(cur.tx.map((t) => t.date)).size
    if (days / elapsed < 0.3) F({ level: 'info', title: 'Catatan mungkin belum lengkap', text: `Baru ada catatan di ${days} dari ${elapsed} hari bulan ini. Analisis makin akurat bila pengeluaran kecil juga dicatat.` })
  }
  if (!cur.masuk && cur.keluar) F({ level: 'info', title: 'Pemasukan belum dicatat', text: 'Catat gaji atau penghasilan bulan ini agar rasio dan skor kesehatan bisa dihitung.' })

  // ------------------------------------------------------------ Peluang
  const hemat = BISA_DIHEMAT.map((n) => cats.find((c) => c.name === n && c.amount >= 100000)).find(Boolean)
  if (hemat) {
    const s = hemat.amount * 0.2
    P({ level: 'baik', title: `Pangkas ${hemat.name} 20%`, text: `Hemat sekitar ${rupiah(s)} per bulan, atau ${rupiah(s * 12)} setahun — cukup untuk menambah dana darurat.` })
  }
  if (kecil.length >= 8 && kecilTotal >= 50000) {
    P({ level: 'baik', title: 'Kurangi belanja kecil separuhnya', text: `Separuh dari ${rupiah(kecilTotal)} berarti ${rupiah(kecilTotal / 2)} per bulan, ${rupiah((kecilTotal / 2) * 12)} setahun. Coba bawa bekal/kopi dari rumah beberapa hari seminggu.` })
  }
  if (cur.sisa > 0 && cur.masuk > 0 && (!isCurrent || elapsed >= dim - 3)) {
    P({ level: 'baik', title: 'Alokasikan sisa uang', text: `Masih ada ${rupiah(cur.sisa)} yang belum dialokasikan. Pindahkan sebagian ke ${coverage !== null && coverage < 3 ? 'dana darurat' : 'tabungan atau investasi'} sebelum terpakai tanpa sadar.` })
  }
  if (cur.masuk > 0 && cur.simpan / cur.masuk >= 0.15 && coverage !== null && coverage >= 3) {
    const recentInvest = transactions.some((t) => t.kind === 'simpanan' && ['Investasi', 'Emas', 'Deposito'].includes(t.category) && t.date.slice(0, 7) >= shiftMonth(month, -2) && t.date.slice(0, 7) <= month)
    if (!recentInvest) P({ level: 'baik', title: 'Saatnya mulai berinvestasi', text: 'Dana darurat sudah aman dan kamu rutin menabung. Pertimbangkan reksa dana pasar uang, emas, atau deposito agar nilai uangmu tumbuh.' })
  }
  if (piutangSisa > 0 && isCurrent) {
    const late = overdue(piutang)
    P({ level: late.length ? 'perhatian' : 'info', title: 'Ada piutang yang bisa ditagih', text: `${rupiah(piutangSisa)} masih di tangan orang lain${late.length ? `, ${late.length} di antaranya sudah lewat jatuh tempo` : ''}. Menagih dengan sopan bisa memperkuat arus kasmu.` })
  }
  if (sources.length === 1 && cur.masuk > 0) {
    P({ level: 'info', title: 'Tambah sumber pemasukan', text: 'Pekerjaan sampingan atau freelance kecil bisa jadi penyangga bila sumber utama terganggu.' })
  }

  const order = { bahaya: 0, perhatian: 1, info: 2, baik: 3 }
  out.risks.sort((a, b) => order[a.level] - order[b.level])
  out.findings.sort((a, b) => order[a.level] - order[b.level])
  return out
}
