import { supabase } from '@/lib/supabase'
import { BASE } from '@/lib/config'

const TABLE = {
  transactions: 'mo_transactions', debts: 'mo_debts', payments: 'mo_debt_payments', categories: 'mo_categories',
  accounts: 'mo_accounts', transfers: 'mo_transfers', budgets: 'mo_budgets', assets: 'mo_assets',
}
// Tabel yang boleh belum ada (fitur baru sebelum skema database diperbarui).
const OPTIONAL = ['assets']
const NUMERIC = ['amount', 'opening_balance', 'value']

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

const missingTable = (e) => e && (e.code === 'PGRST205' || e.code === '42P01' || /schema cache|does not exist/i.test(e.message || ''))

async function fetchAll(table, optional = false) {
  const out = []
  for (let from = 0; ; from += 1000) {
    const res = await supabase.from(table).select('*').order('created_at').range(from, from + 999)
    if (optional && missingTable(res.error)) return null
    const data = check(res)
    out.push(...data.map(clean))
    if (data.length < 1000) return out
  }
}

const toUser = (authUser, p, isAdmin) => ({
  id: authUser.id, email: authUser.email, username: p.username, occupation: p.occupation, createdAt: p.created_at,
  // Sebelum skema admin dipasang, kolom status belum ada: anggap aktif.
  status: p.status || 'active', statusReason: p.status_reason || '', statusUpdatedAt: p.status_updated_at || null, approvedAt: p.approved_at || null,
  isAdmin: !!isAdmin,
})
const quiet = async (q) => { try { const r = await q; return r.error ? null : r.data } catch { return null } }
const mapProfile = (p) => ({ id: p.id, email: p.email, username: p.username, occupation: p.occupation, createdAt: p.created_at, status: p.status || 'active', statusReason: p.status_reason || '', statusUpdatedAt: p.status_updated_at, approvedAt: p.approved_at, lastSeenAt: p.last_seen_at })

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
    const [isAdmin, settings] = await Promise.all([quiet(supabase.rpc('mo_is_admin')), quiet(supabase.from('mo_settings').select('*').eq('id', 1).maybeSingle())])
    return { ...toUser(au, p, isAdmin === true), accessControl: !!settings?.access_control, contactWa: settings?.contact_wa || '' }
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
    await quiet(supabase.from('mo_activity').insert({ event: 'login' }))
  },

  async signOut() {
    await quiet(supabase.from('mo_activity').insert({ event: 'logout' }))
    await supabase.auth.signOut()
  },

  // Verifikasi ulang password (dipakai sebelum membuka panel admin).
  async verifyPassword(password) {
    const { data } = await supabase.auth.getSession()
    const res = await supabase.auth.signInWithPassword({ email: data.session.user.email, password })
    if (res.error) throw new Error('Password salah.')
    return true
  },

  async heartbeat() {
    const { data } = await supabase.auth.getSession()
    if (data.session) await quiet(supabase.from('mo_profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', data.session.user.id))
  },

  // ---------------------------------------------------------------- Notifikasi
  async notifications() {
    const { data: s } = await supabase.auth.getSession()
    const res = await supabase.from('mo_notifications').select('*').order('created_at', { ascending: false }).limit(100)
    if (missingTable(res.error)) return { list: [], missing: true }
    const list = check(res)
    const ids = list.map((n) => n.id)
    const reads = ids.length ? check(await supabase.from('mo_notification_reads').select('notification_id').in('notification_id', ids)) : []
    const done = new Set(reads.map((r) => r.notification_id))
    return { list: list.map((n) => ({ ...n, read: done.has(n.id), mine: n.user_id === s.session?.user.id })), missing: false }
  },
  async markRead(ids) {
    if (!ids.length) return
    check(await supabase.from('mo_notification_reads').upsert(ids.map((id) => ({ notification_id: id })), { onConflict: 'user_id,notification_id', ignoreDuplicates: true }))
  },
  async broadcast({ title, body, level }) {
    return check(await supabase.from('mo_notifications').insert({ kind: 'broadcast', user_id: null, title: title.trim(), body: body.trim(), level }).select().single())
  },
  async deleteNotification(id) { check(await supabase.from('mo_notifications').delete().eq('id', id)) },

  // ---------------------------------------------------------------- Admin (dijaga RLS & fungsi database)
  admin: {
    async users() {
      const res = await supabase.from('mo_profiles').select('*').order('created_at', { ascending: false })
      return check(res).map(mapProfile)
    },
    async activity() {
      const res = await supabase.from('mo_activity').select('*').order('created_at', { ascending: false }).limit(500)
      if (missingTable(res.error)) return []
      return check(res)
    },
    async setControl(on) { check(await supabase.rpc('mo_admin_set_control', { p_on: on })) },
    async setStatus(userId, status, reason = '') {
      check(await supabase.rpc('mo_admin_set_status', { p_user: userId, p_status: status, p_reason: reason }))
    },
    ready: async () => !missingTable((await supabase.from('mo_activity').select('id').limit(1)).error),
  },

  async updateProfile({ username, occupation }) {
    const { data } = await supabase.auth.getSession()
    const au = data.session.user
    const p = check(await supabase.from('mo_profiles').update({ username, occupation: occupation.trim() }).eq('id', au.id).select().single())
    return toUser(au, p, (await quiet(supabase.rpc('mo_is_admin'))) === true)
  },

  async changePassword(password) { check(await supabase.auth.updateUser({ password })) },

  async loadAll() {
    const entries = await Promise.all(Object.entries(TABLE).map(async ([k, t]) => [k, await fetchAll(t, OPTIONAL.includes(k))]))
    const out = Object.fromEntries(entries)
    out.missing = Object.keys(out).filter((k) => out[k] === null)
    out.missing.forEach((k) => { out[k] = [] })
    return out
  },

  async save(table, row) {
    const { id, created_at, user_id, ...fields } = row
    const q = id
      ? supabase.from(TABLE[table]).update(fields).eq('id', id)
      : supabase.from(TABLE[table]).insert(fields)
    return clean(check(await q.select().single()))
  },

  async remove(table, id) { check(await supabase.from(TABLE[table]).delete().eq('id', id)) },

  // Catatan lama tanpa dompet dipindahkan ke dompet pertama.
  async assignOrphans(accountId) {
    check(await supabase.from('mo_transactions').update({ account_id: accountId }).is('account_id', null))
  },
}
