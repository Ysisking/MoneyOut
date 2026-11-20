// Mode lokal: dipakai bila Supabase belum diatur. Akun dan data disimpan di
// localStorage browser ini saja — untuk mencoba aplikasi, bukan untuk data sungguhan.
const K_USERS = 'moneyout:users'
const K_SESSION = 'moneyout:session'
const kData = (uid) => `moneyout:data:${uid}`
const TABLES = ['transactions', 'debts', 'payments', 'categories', 'accounts', 'transfers', 'budgets']

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

const publicUser = (u) => (u ? { id: u.id, email: u.email, username: u.username, occupation: u.occupation, createdAt: u.createdAt } : null)
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
    all[em] = { id: uid(), email: em, username, occupation: occupation.trim(), salt, hash: await hashPassword(password, salt), createdAt: new Date().toISOString() }
    write(K_USERS, all)
    write(K_SESSION, all[em].id)
    emit()
    return { needsConfirm: false }
  },

  async signIn({ email, password }) {
    const u = users()[email.trim().toLowerCase()]
    if (!u || (await hashPassword(password, u.salt)) !== u.hash) throw new Error('Email atau password salah.')
    write(K_SESSION, u.id)
    emit()
  },

  async signOut() { localStorage.removeItem(K_SESSION); emit() },

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
