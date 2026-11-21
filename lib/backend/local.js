// Mode lokal: dipakai bila Supabase belum diatur. Akun dan data disimpan di
// localStorage browser ini saja — untuk mencoba aplikasi, bukan untuk data sungguhan.
import { ADMIN_EMAIL } from '@/lib/config'

const K_USERS = 'moneyout:users'
const K_ACTIVITY = 'moneyout:activity'
const K_NOTIFS = 'moneyout:notifs'
const kReads = (uid) => `moneyout:reads:${uid}`
const K_SESSION = 'moneyout:session'
const kData = (uid) => `moneyout:data:${uid}`
const TABLES = ['transactions', 'debts', 'payments', 'categories', 'accounts', 'transfers', 'budgets', 'assets']

const read = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) ?? fb } catch { return fb } }
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v))
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2))
const listeners = new Set()
const emit = () => listeners.forEach((cb) => cb())

async function hashPassword(password, salt) {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256)
  return Array.from(new Uint8Array(bits), (b) => b.toString(16).padStart(2, '0')).join('')
}

const isAdminEmail = (email) => email.toLowerCase() === ADMIN_EMAIL
const publicUser = (u) => (u ? {
  id: u.id, email: u.email, username: u.username, occupation: u.occupation, createdAt: u.createdAt,
  status: u.status || 'active', statusReason: u.statusReason || '', statusUpdatedAt: u.statusUpdatedAt || null, approvedAt: u.approvedAt || null,
  lastSeenAt: u.lastSeenAt || null, isAdmin: isAdminEmail(u.email),
} : null)
const now = () => new Date().toISOString()
function logActivity(user_id, event, detail = '') {
  const list = read(K_ACTIVITY, [])
  list.unshift({ id: uid(), user_id, event, detail, created_at: now() })
  write(K_ACTIVITY, list.slice(0, 500))
}
function notify(user_id, kind, level, title, body) {
  const list = read(K_NOTIFS, [])
  list.unshift({ id: uid(), user_id, kind, level, title, body, created_at: now() })
  write(K_NOTIFS, list)
}
const adminIds = () => Object.values(read(K_USERS, {})).filter((u) => isAdminEmail(u.email)).map((u) => u.id)
const users = () => read(K_USERS, {})
const currentRaw = () => { const id = read(K_SESSION, null); return Object.values(users()).find((u) => u.id === id) || null }
function requireUser() { const u = currentRaw(); if (!u) throw new Error('Sesi berakhir, silakan masuk lagi.'); return u }

export const localBackend = {
  mode: 'local',

  async getUser() { return publicUser(currentRaw()) },
  onAuthChange(cb) { listeners.add(cb); return () => listeners.delete(cb) },

  async usernameAvailable(username) {
    return !Object.values(users()).some((u) => u.username.toLowerCase() === username.toLowerCase())
  },

  async signUp({ email, username, password, occupation }) {
    const all = users()
    const em = email.trim().toLowerCase()
    if (all[em]) throw new Error('Email sudah terdaftar. Silakan masuk.')
    if (!(await this.usernameAvailable(username))) throw new Error('Username sudah dipakai, coba yang lain.')
    const salt = uid()
    // Di mode lokal, persetujuan admin hanya berlaku bila akun admin ada di browser ini.
    const needsApproval = !isAdminEmail(em) && adminIds().length > 0
    all[em] = {
      id: uid(), email: em, username, occupation: occupation.trim(), salt, hash: await hashPassword(password, salt), createdAt: now(),
      status: needsApproval ? 'pending' : 'active', statusReason: '', statusUpdatedAt: now(), approvedAt: needsApproval ? null : now(), lastSeenAt: now(),
    }
    write(K_USERS, all)
    write(K_SESSION, all[em].id)
    logActivity(all[em].id, 'signup')
    if (needsApproval) {
      notify(all[em].id, 'system', 'info', 'Pendaftaran diterima', 'Akunmu sedang menunggu persetujuan admin. Kamu akan diberi tahu di sini begitu akun aktif.')
      adminIds().forEach((a) => notify(a, 'system', 'warning', 'Pendaftar baru menunggu', `${username} (${em}) masuk Purchase Order.`))
    }
    emit()
    return { needsConfirm: false }
  },

  async signIn({ email, password }) {
    const u = users()[email.trim().toLowerCase()]
    if (!u || (await hashPassword(password, u.salt)) !== u.hash) throw new Error('Email atau password salah.')
    write(K_SESSION, u.id)
    logActivity(u.id, 'login')
    emit()
  },

  async signOut() {
    const me = currentRaw()
    if (me) logActivity(me.id, 'logout')
    localStorage.removeItem(K_SESSION); emit()
  },

  async verifyPassword(password) {
    const me = requireUser()
    if ((await hashPassword(password, me.salt)) !== me.hash) throw new Error('Password salah.')
    return true
  },

  async heartbeat() {
    const me = currentRaw(); if (!me) return
    const all = users(); all[me.email].lastSeenAt = now(); write(K_USERS, all)
  },

  async notifications() {
    const me = requireUser()
    const reads = new Set(read(kReads(me.id), []))
    const list = read(K_NOTIFS, []).filter((n) => n.user_id === me.id || n.user_id === null)
    return { list: list.map((n) => ({ ...n, read: reads.has(n.id), mine: n.user_id === me.id })), missing: false }
  },
  async markRead(ids) {
    const me = requireUser()
    write(kReads(me.id), [...new Set([...read(kReads(me.id), []), ...ids])])
  },
  async broadcast({ title, body, level }) {
    const me = requireUser()
    if (!isAdminEmail(me.email)) throw new Error('Hanya admin.')
    notify(null, 'broadcast', level, title.trim(), body.trim())
  },
  async deleteNotification(id) {
    const me = requireUser()
    if (!isAdminEmail(me.email)) throw new Error('Hanya admin.')
    write(K_NOTIFS, read(K_NOTIFS, []).filter((n) => n.id !== id))
  },

  admin: {
    async users() {
      const me = requireUser(); if (!isAdminEmail(me.email)) throw new Error('Hanya admin.')
      return Object.values(users()).map(publicUser).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    },
    async activity() {
      const me = requireUser(); if (!isAdminEmail(me.email)) throw new Error('Hanya admin.')
      return read(K_ACTIVITY, [])
    },
    async setStatus(userId, status, reason = '') {
      const me = requireUser(); if (!isAdminEmail(me.email)) throw new Error('Hanya admin yang boleh mengubah status pengguna.')
      const all = users()
      const u = Object.values(all).find((x) => x.id === userId)
      if (!u) throw new Error('Pengguna tidak ditemukan.')
      if (isAdminEmail(u.email)) throw new Error('Status akun admin tidak bisa diubah.')
      const r = reason.trim().slice(0, 200)
      if (status === 'frozen' && !u.approvedAt) throw new Error('Hanya pelanggan yang sudah diterima yang bisa dibekukan.')
      if (['blocked', 'frozen'].includes(status) && !r) throw new Error('Tulis alasannya.')
      const old = u.status || 'active'
      Object.assign(all[u.email], { status, statusReason: status === 'active' ? '' : r, statusUpdatedAt: now(), approvedAt: status === 'active' ? (u.approvedAt || now()) : u.approvedAt })
      write(K_USERS, all)
      const T = { active: ['success', 'Akunmu sudah aktif', 'Kamu sudah bisa memakai MoneyOut. Selamat mencatat!'], queued: ['info', 'Kamu masuk antrean', 'Sistem sedang sibuk. Akunmu akan diproses sesuai giliran.'], blocked: ['danger', 'Akunmu diblokir', 'Kamu tidak bisa memakai MoneyOut sampai blokir dipulihkan.'], frozen: ['danger', 'Akunmu dibekukan', 'Akunmu ditangguhkan sementara.'] }[status]
      notify(userId, 'system', T[0], T[1], T[2] + (r && status !== 'active' ? ` ${status === 'queued' ? 'Catatan admin' : 'Alasan'}: ${r}` : ''))
      logActivity(userId, 'status', `${old} → ${status}${r && status !== 'active' ? ` · ${r}` : ''}`)
    },
    ready: async () => true,
  },

  async updateProfile({ username, occupation }) {
    const me = requireUser()
    const all = users()
    if (Object.values(all).some((u) => u.id !== me.id && u.username.toLowerCase() === username.toLowerCase())) throw new Error('Username sudah dipakai, coba yang lain.')
    Object.assign(all[me.email], { username, occupation: occupation.trim() })
    write(K_USERS, all)
    emit()
    return publicUser(all[me.email])
  },

  async changePassword(password) {
    const me = requireUser()
    const all = users()
    all[me.email].hash = await hashPassword(password, all[me.email].salt)
    write(K_USERS, all)
  },

  async loadAll() {
    const me = requireUser()
    const d = read(kData(me.id), {})
    return Object.fromEntries(TABLES.map((t) => [t, d[t] || []]))
  },

  async save(table, row) {
    const me = requireUser()
    const d = read(kData(me.id), {})
    const list = d[table] || []
    let saved
    if (row.id) {
      const i = list.findIndex((r) => r.id === row.id)
      if (i < 0) throw new Error('Data tidak ditemukan.')
      saved = list[i] = { ...list[i], ...row }
    } else {
      saved = { ...row, id: uid(), created_at: new Date().toISOString() }
      list.push(saved)
    }
    d[table] = list
    write(kData(me.id), d)
    return saved
  },

  async remove(table, id) {
    const me = requireUser()
    const d = read(kData(me.id), {})
    d[table] = (d[table] || []).filter((r) => r.id !== id)
    if (table === 'debts') d.payments = (d.payments || []).filter((p) => p.debt_id !== id)
    if (table === 'accounts') {
      d.transfers = (d.transfers || []).filter((t) => t.from_account_id !== id && t.to_account_id !== id)
      d.transactions = (d.transactions || []).map((t) => (t.account_id === id ? { ...t, account_id: null } : t))
    }
    write(kData(me.id), d)
  },

  async assignOrphans(accountId) {
    const me = requireUser()
    const d = read(kData(me.id), {})
    d.transactions = (d.transactions || []).map((t) => (t.account_id ? t : { ...t, account_id: accountId }))
    write(kData(me.id), d)
  },
}
