import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Role = 'super_admin' | 'school_admin' | 'teacher' | 'student' | 'parent'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  schoolId?: string
  schoolName?: string
}

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string, refreshToken?: string) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token, refreshToken) => {
        localStorage.setItem('token', token)
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
        set({ user, token })
      },
      logout: () => {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        set({ user: null, token: null })
      },
    }),
    { name: 'edu-auth', partialize: (s) => ({ user: s.user, token: s.token }) }
  )
)
