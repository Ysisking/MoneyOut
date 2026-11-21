export const BASE = process.env.NEXT_PUBLIC_BASE_PATH || ''
export const APP_NAME = 'MoneyOut'
// Email admin (hanya untuk tampilan menu; hak admin sebenarnya dijaga database lewat tabel mo_admins).
export const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'yatufht@gmail.com').toLowerCase()
