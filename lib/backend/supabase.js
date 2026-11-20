import { supabase } from '@/lib/supabase'
import { BASE } from '@/lib/config'

const TABLE = { transactions: 'mo_transactions', debts: 'mo_debts', payments: 'mo_debt_payments', categories: 'mo_categories' }
const NUMERIC = ['amount']

// Pesan galat Supabase -> bahasa Indonesia.
function friendly(error) {
  const m = (error?.message || '').toLowerCase()
  if (m.includes('invalid login credentials')) return 'Email atau password salah.'
  if (m.includes('email not confirmed')) return 'Email belum dikonfirmasi. Buka tautan di kotak masuk email Anda dulu.'
  if (m.includes('already registered') || m.includes('already been registered')) return 'Email sudah terdaftar. Silakan masuk.'
  if (m.includes('password should be')) return 'Password terlalu lemah. Gunakan minimal 8 karakter.'
  if (m.includes('rate limit') || m.includes('security purposes')) return 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'
  if (m.includes('duplicate key') && m.includes('username')) return 'Username sudah dipakai, coba yang lain.'
  if (m.includes('database error saving new user')) return 'Pendaftaran gagal disimpan. Coba username lain.'
  if (m.includes('failed to fetch')) return 'Tidak bisa terhubung ke server. Periksa koneksi internet.'
  return error?.message || 'Terjadi kesalahan.'
}
const check = ({ data, error }) => { if (error) throw new Error(friendly(error)); return data }
const clean = (row) => { const r = { ...row }; NUMERIC.forEach((k) => { if (k in r) r[k] = Number(r[k]) }); return r }

async function fetchAll(table) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const data = check(await supabase.from(table).select('*').order('created_at').range(from, from + 999))
    out.push(...data.map(clean))
    if (data.length < 1000) return out
  }
}

const toUser = (authUser, p) => ({ id: authUser.id, email: authUser.email, username: p.username, occupation: p.occupation, createdAt: p.created_at })

export const supabaseBackend = {
  mode: 'supabase',

  async getUser() {
    const { data } = await supabase.auth.getSession()
    const au = data.session?.user
    if (!au) return null
    let p = check(await supabase.from('mo_profiles').select('*').eq('id', au.id).maybeSingle())
    if (!p) {
      // Akun yang dibuat sebelum skema MoneyOut terpasang: buat profil dari metadata pendaftaran.
      const meta = au.user_metadata || {}
      let username = (meta.username || au.email.split('@')[0]).replace(/[^A-Za-z0-9_.]/g, '').slice(0, 16) || 'pengguna'
      if (username.length < 3) username = username.padEnd(3, '0')
      if (!(await this.usernameAvailable(username))) username = username.slice(0, 15) + Math.floor(Math.random() * 1e4)
      p = check(await supabase.from('mo_profiles').insert({ id: au.id, email: au.email, username, occupation: meta.occupation || '' }).select().single())
    }
    return toUser(au, p)
  },

  onAuthChange(cb) {
    // Jangan memanggil Supabase langsung di dalam callback (bisa macet); tunda sejenak.
    const { data } = supabase.auth.onAuthStateChange(() => setTimeout(cb, 0))
    return () => data.subscription.unsubscribe()
  },

  async usernameAvailable(username) {
    return check(await supabase.rpc('mo_username_available', { p_username: username }))
  },

  async signUp({ email, username, password, occupation }) {
    if (!(await this.usernameAvailable(username))) throw new Error('Username sudah dipakai, coba yang lain.')
    const data = check(await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { app: 'moneyout', username, occupation: occupation.trim() },
        emailRedirectTo: window.location.origin + BASE + '/masuk/',
      },
    }))
    // Supabase menyamarkan email yang sudah terdaftar sebagai user tanpa identitas.
    if (data.user && data.user.identities?.length === 0) throw new Error('Email sudah terdaftar. Silakan masuk.')
    return { needsConfirm: !data.session }
  },

  async signIn({ email, password }) {
    check(await supabase.auth.signInWithPassword({ email: email.trim(), password }))
  },

  async signOut() { await supabase.auth.signOut() },

  async updateProfile({ username, occupation }) {
    const { data } = await supabase.auth.getSession()
    const au = data.session.user
    const p = check(await supabase.from('mo_profiles').update({ username, occupation: occupation.trim() }).eq('id', au.id).select().single())
    return toUser(au, p)
  },

  async changePassword(password) { check(await supabase.auth.updateUser({ password })) },

  async loadAll() {
    const entries = await Promise.all(Object.entries(TABLE).map(async ([k, t]) => [k, await fetchAll(t)]))
    return Object.fromEntries(entries)
  },

  async save(table, row) {
    const { id, created_at, user_id, ...fields } = row
    const q = id
      ? supabase.from(TABLE[table]).update(fields).eq('id', id)
      : supabase.from(TABLE[table]).insert(fields)
    return clean(check(await q.select().single()))
  },

  async remove(table, id) { check(await supabase.from(TABLE[table]).delete().eq('id', id)) },
}
