'use client'
import { useEffect, useId, useRef, useState } from 'react'
import { rupiah, rupiahShort } from '@/lib/format'

const fmtDay = (iso, opt = { day: 'numeric', month: 'short' }) => new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', opt)

// Grafik area saldo dengan garis bantu & tooltip saat diarahkan.
export default function BalanceChart({ data, height = 220, color = '#0B7A57' }) {
  const ref = useRef(null)
  const gid = useId().replace(/:/g, '')
  const [w, setW] = useState(600)
  const [hover, setHover] = useState(null)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, e.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  if (!data.length) return null

  const padT = 12, padB = 26, padR = 56
  const vals = data.map((d) => d.value)
  let lo = Math.min(...vals), hi = Math.max(...vals)
  if (lo === hi) { lo -= Math.abs(lo) * 0.1 || 1; hi += Math.abs(hi) * 0.1 || 1 }
  const span = hi - lo
  lo -= span * 0.12; hi += span * 0.08
  if (Math.min(...vals) >= 0 && lo < 0) lo = 0
  const iw = w - padR, ih = height - padT - padB
  const x = (i) => (i / Math.max(1, data.length - 1)) * iw
  const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * ih
  const line = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join('')
  const area = `${line}L${iw},${padT + ih}L0,${padT + ih}Z`
  const ticks = [hi - (hi - lo) * 0.1, (hi + lo) / 2, lo + (hi - lo) * 0.1]
  const xl = [0, Math.floor((data.length - 1) / 2), data.length - 1]

  function move(e) {
    const r = ref.current.getBoundingClientRect()
    const px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left
    const i = Math.round((Math.min(Math.max(px, 0), iw) / iw) * (data.length - 1))
    setHover(i)
  }
  const h = hover != null ? data[hover] : null

  return (
    <div ref={ref} className="relative select-none" style={{ height }} onMouseMove={move} onMouseLeave={() => setHover(null)} onTouchStart={move} onTouchMove={move} onTouchEnd={() => setHover(null)}>
      <svg width={w} height={height} className="block overflow-visible" role="img" aria-label={`Grafik saldo ${fmtDay(data[0].date)} sampai ${fmtDay(data[data.length - 1].date)}, terakhir ${rupiah(data[data.length - 1].value)}`}>
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={color} stopOpacity=".14" />
            <stop offset="1" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1="0" x2={iw} y1={y(t)} y2={y(t)} stroke="#EDEDEA" strokeDasharray="3 4" />
            <text x={w - 4} y={y(t) + 4} textAnchor="end" className="fill-[#9A9A95] text-[11px]">{rupiahShort(t)}</text>
          </g>
        ))}
        <path d={area} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {xl.map((i, n) => (
          <text key={i} x={x(i)} y={height - 6} textAnchor={n === 0 ? 'start' : n === 2 ? 'end' : 'middle'} className="fill-[#9A9A95] text-[11px]">{fmtDay(data[i].date)}</text>
        ))}
        {h && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + ih} stroke="#111" strokeOpacity=".25" />
            <circle cx={x(hover)} cy={y(h.value)} r="4.5" fill="#fff" stroke={color} strokeWidth="2" />
          </g>
        )}
      </svg>
      {h && (
        <div className="pointer-events-none absolute top-0 z-10 rounded-lg border border-line bg-canvas px-3 py-2 shadow-pop"
          style={{ left: Math.min(Math.max(x(hover) - 80, 0), iw - 160), width: 160 }}>
          <p className="text-xs text-sub">{fmtDay(h.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
          <p className="num text-sm font-semibold">{rupiah(h.value)}</p>
        </div>
      )}
    </div>
  )
}
