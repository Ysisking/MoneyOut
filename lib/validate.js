export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const USERNAME_RE = /^[A-Za-z0-9_.]{3,20}$/

export function validateSignup({ email, username, password, occupation }) {
  if (!EMAIL_RE.test(email)) return 'Format email belum benar.'
  if (!USERNAME_RE.test(username)) return 'Username 3–20 karakter: huruf, angka, titik, atau garis bawah.'
  if (password.length < 8) return 'Password minimal 8 karakter.'
  if (!occupation.trim()) return 'Status pekerjaan wajib diisi.'
  if (occupation.trim().length > 60) return 'Status pekerjaan maksimal 60 karakter.'
  return null
}
