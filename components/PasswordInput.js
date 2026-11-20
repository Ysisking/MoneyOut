'use client'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({ id, value, onChange, autoComplete, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} className="input pr-11" required value={value} autoComplete={autoComplete}
        placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 px-3 text-muted hover:text-ink" aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}>
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}
