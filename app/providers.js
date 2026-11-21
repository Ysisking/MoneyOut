'use client'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { backend } from '@/lib/backend'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export default function Providers({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  const refreshUser = useCallback(async () => {
    try { setUser(await backend.getUser()) } catch { setUser(null) } finally { setReady(true) }
  }, [])

  useEffect(() => {
    refreshUser()
    return backend.onAuthChange(refreshUser)
  }, [refreshUser])

  const value = {
    user, ready, mode: backend.mode,
    signIn: (v) => backend.signIn(v),
    signUp: (v) => backend.signUp(v),
    signOut: () => backend.signOut(),
    updateProfile: async (v) => { const u = await backend.updateProfile(v); setUser(u); return u },
    changePassword: (p) => backend.changePassword(p),
    verifyPassword: (p) => backend.verifyPassword(p),
    refreshUser,
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
