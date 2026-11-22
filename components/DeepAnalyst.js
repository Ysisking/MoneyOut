'use client'
import { useEffect, useMemo, useState } from 'react'
import { Lock, Wallet, ShieldCheck, Landmark, Baby, TrendingUp, PiggyBank, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '@/app/providers'
import { useData } from './DataProvider'
import { Progress } from './ui'
import { deepAnalyze, detectProfile, PROFILES } from '@/lib/deep'
import { rupiah } from '@/lib/format'

// Pengaturan Deep Analyst disimpan HANYA di perangkat ini (localStorage), tidak dikirim ke server.
const key = (uid) => `moneyout:deep:${uid}`
export function useDeepSettings() {
  const { user } = useAuth()
  const [s, setS] = useState({ on: false, age: '', children: 0, retireAge: 56, profile: '' })
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem(key(user.id))); if (v) setS((o) => ({ ...o, ...v })) } catch {} }, [user.id])
  const update = (patch) => setS((o) => { const n = { ...o, ...patch }; try { localStorage.setItem(key(user.id), JSON.stringify(n)) } catch {}; return n })
  return [{ ...s, occupation: user.occupation }, update]
}

export function DeepToggle({ on, onChange }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas py-2 pl-3.5 pr-2.5">
      <span className="leading-tight">
        <span className="block text-sm font-semibold">Deep Analyst</span>
        <span className="block text-xs text-sub">{on ? 'Aktif · dihitung di perangkatmu' : 'Rencana simpanan & investasi'}</span>
      </span>
      <button role="switch" aria-checked={on} aria-label="Deep Analyst" onClick={() => onChange(!on)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-ink' : 'bg-edge'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

function Row({ icon: Icon, title, amount, unit = '/bulan', children }) {
  return (
    <li className="grid gap-x-6 gap-y-1 px-6 py-5 md:grid-cols-[minmax(0,1fr)_auto]">
      <div className="flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-subtle"><Icon size={16} strokeWidth={1.8} /></span>
        <div className="min-w-0">
          <p className="text-base font-medium">{title}</p>
          <div className="mt-0.5 space-y-1.5 text-sm leading-relaxed text-sub">{children}</div>
        </div>
      </div>
      {amount != null && <p className="num pl-12 text-lg font-semibold md:pl-0 md:text-right">{rupiah(amount)}<span className="text-sm font-normal text-sub">{unit}</span></p>}
    </li>
  )
}

export default function DeepAnalyst({ settings, update }) {
  const data = useData()
  const [edit, setEdit] = useState(false)
  const d = useMemo(() => deepAnalyze(data, settings), [data, settings])
  const detected = detectProfile(settings.occupation)

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-5">
        <div>
          <h2 className="text-md font-semibold tracking-tight">Deep Analyst</h2>
          <p className="mt-0.5 text-sm text-sub">{d ? <>Profil <span className="text-ink">{d.profile.label}</span> · penghasilan rata-rata <span className="num text-ink">{rupiah(d.income)}</span>/bulan ({d.months} bulan terakhir)</> : 'Rencana alokasi uang sesuai pekerjaan dan penghasilanmu.'}</p>
        </div>
        <button className="btn-secondary h-8 px-3" onClick={() => setEdit(!edit)} aria-expanded={edit}><SlidersHorizontal size={14} /> Sesuaikan</button>
      </div>

      {edit && (
        <div className="grid gap-4 border-b border-line bg-subtle px-6 py-5 sm:grid-cols-4">
          <div className="sm:col-span-2"><label className="field-label" htmlFor="dp-profile">Jenis pekerjaan</label>
            <select id="dp-profile" className="input" value={settings.profile} onChange={(e) => update({ profile: e.target.value })}>
              <option value="">Otomatis: {PROFILES[detected].label}</option>
              {Object.entries(PROFILES).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </select></div>
          <div><label className="field-label" htmlFor="dp-age">Usia</label><input id="dp-age" inputMode="numeric" className="input" placeholder="mis. 28" value={settings.age} onChange={(e) => update({ age: e.target.value.replace(/\D/g, '').slice(0, 2) })} /></div>
          <div><label className="field-label" htmlFor="dp-kids">Jumlah anak</label><input id="dp-kids" type="number" min="0" max="10" className="input" value={settings.children} onChange={(e) => update({ children: Math.min(10, Math.max(0, Number(e.target.value) || 0)) })} /></div>
          <div className="sm:col-span-2"><label className="field-label" htmlFor="dp-retire">Target usia pensiun</label><input id="dp-retire" type="number" min="40" max="75" className="input" value={settings.retireAge} onChange={(e) => update({ retireAge: Number(e.target.value) || 56 })} /></div>
          <p className="self-end text-xs text-sub sm:col-span-2">Isian ini hanya disimpan di perangkat ini.</p>
        </div>
      )}

      {!d ? (
        <p className="px-6 py-10 text-center text-sm text-sub">Catat pemasukan minimal satu bulan agar Deep Analyst bisa menghitung rencanamu.</p>
      ) : (
        <ul className="divide-y divide-line">
          <Row icon={PiggyBank} title={`Simpanan ideal: ${d.rate}% dari penghasilan`} amount={d.idealSaving}>
            <p>{d.profile.why}{d.adjWhy && ` ${d.adjWhy}`}</p>
            <p>Saat ini kamu menyisihkan <span className="num text-ink">{Math.round(d.savingNowRate * 100)}%</span>.{' '}
              {d.savingNowRate * 100 >= d.rate ? <span className="text-pos">Sudah sesuai target.</span> : <span>Kurang <span className="num text-ink">{rupiah(Math.max(0, d.idealSaving - d.saving))}</span> per bulan.</span>}</p>
            <Progress value={Math.min(1, d.savingNowRate * 100 / d.rate)} className="mt-2 max-w-sm" color={d.savingNowRate * 100 >= d.rate ? '#0B7A57' : '#111'} />
          </Row>
          <Row icon={Wallet} title="Keep money (uang pegangan)" amount={d.keepMonth} unit="">
            <p>Simpan sekitar satu bulan biaya hidup di rekening harian, dan <span className="num text-ink">{rupiah(d.keepWeek)}</span> (kebutuhan seminggu) di dompet atau e-wallet. Selebihnya pindahkan ke pos simpanan agar tidak terpakai tanpa sadar.</p>
          </Row>
          <Row icon={ShieldCheck} title={`Dana darurat: ${d.emergency.months} bulan pengeluaran`} amount={d.emergency.done ? null : d.emergency.monthly}>
            <p>Target <span className="num text-ink">{rupiah(d.emergency.target)}</span>, terkumpul <span className="num text-ink">{rupiah(d.emergency.now)}</span>.{' '}
              {d.emergency.done ? <span className="text-pos">Sudah tercapai — alihkan setoran ke pensiun & investasi.</span> : <>Sisihkan setiap bulan sampai tercapai, kira-kira <span className="num text-ink">{d.emergency.eta}</span> bulan lagi. Simpan di tabungan terpisah atau reksa dana pasar uang.</>}</p>
            <Progress value={d.emergency.target ? d.emergency.now / d.emergency.target : 0} className="mt-2 max-w-sm" color={d.emergency.done ? '#0B7A57' : '#111'} />
          </Row>
          <Row icon={Landmark} title="Dana pensiun" amount={d.pension.monthly}>
            <p>Dengan setoran ini selama <span className="num text-ink">{d.pension.years}</span> tahun{d.pension.assumed && ' (perkiraan; isi usiamu lewat Sesuaikan)'}, perkiraan terkumpul <span className="num text-ink">{rupiah(d.pension.projected)}</span> di usia {d.pension.retireAge} (asumsi imbal hasil 6%/tahun).</p>
            <p>{d.profileKey === 'tetap' ? 'Ini tambahan di luar BPJS Ketenagakerjaan (JHT & JP) dari kantor.' : 'Karena tidak ada pensiun dari kantor, pertimbangkan BPJS Ketenagakerjaan mandiri dan DPLK.'}</p>
          </Row>
          <Row icon={Baby} title="Dana masa depan anak" amount={d.kid ? d.kid.perChild : null} unit="/anak/bulan">
            {d.kid ? <p>Untuk {d.kids} anak. Dalam 15 tahun, setoran per anak diperkirakan menjadi <span className="num text-ink">{rupiah(d.kid.projected)}</span> (asumsi 7%/tahun) — untuk biaya pendidikan. Cocok di reksa dana campuran atau tabungan pendidikan.</p>
              : <p>Isi jumlah anak lewat <button className="text-ink underline" onClick={() => setEdit(true)}>Sesuaikan</button> untuk mendapat saran. Bila belum punya anak, porsi ini masuk ke investasi.</p>}
          </Row>
          <Row icon={TrendingUp} title="Investasi" amount={d.invest.monthly}>
            <p>{d.emergency.done ? (d.invest.aggressive ? 'Dana darurat aman dan horizonmu panjang — porsi pertumbuhan bisa lebih besar.' : 'Dana darurat aman. Pilih campuran yang seimbang.') : 'Selagi dana darurat belum penuh, pilih instrumen yang aman dan mudah dicairkan.'}</p>
            <ul className="mt-1 grid gap-1.5 sm:grid-cols-2">
              {d.invest.mix.map(([n, pct, why]) => (
                <li key={n} className="rounded-lg border border-line px-3 py-2">
                  <span className="flex justify-between gap-2 text-ink"><span>{n}</span><span className="num">{pct}%</span></span>
                  <span className="block text-xs">{why} · <span className="num">{rupiah(Math.round(d.invest.monthly * pct / 100 / 1000) * 1000)}</span>/bulan</span>
                </li>
              ))}
            </ul>
          </Row>
        </ul>
      )}

      <div className="flex gap-3 border-t border-line bg-subtle px-6 py-4 text-sm text-sub">
        <Lock size={16} className="mt-0.5 shrink-0 text-ink" />
        <p><span className="font-medium text-ink">Keamanan datamu.</span> Deep Analyst dihitung langsung di perangkatmu. Hasilnya, beserta usia, jumlah anak, dan pilihan pekerjaan yang kamu isi, hanya disimpan di perangkat ini dan tidak pernah dikirim ke server — hanya kamu yang mengetahuinya. Catatan keuanganmu dikirim terenkripsi (HTTPS/TLS), disimpan terenkripsi di server (AES-256), dan dilindungi sehingga pengguna lain tidak bisa mengaksesnya.</p>
      </div>
      <p className="px-6 pb-4 pt-2 text-xs text-faint">Perkiraan umum untuk membantu perencanaan, bukan nasihat keuangan profesional. Imbal hasil investasi tidak dijamin.</p>
    </section>
  )
}
