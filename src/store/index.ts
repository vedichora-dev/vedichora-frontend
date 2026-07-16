import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  displayName: string
  email: string
  plan: string
  userId?: number
}

interface AppState {
  // Auth
  token: string | null
  refreshToken: string | null
  user: User | null
  // Chart
  currentHoroId: string | null
  // UI
  currency: string
  currencySym: string
  language: string
  languageFlag: string
  theme: string
  chartMode: 'north' | 'south'
  // Actions
  setAuth: (token: string, refresh: string, user: User) => void
  setHoroId: (id: string) => void
  setCurrency: (code: string, sym: string) => void
  setLanguage: (code: string, flag: string) => void
  setTheme: (theme: string) => void
  setChartMode: (mode: 'north' | 'south') => void
  logout: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      currentHoroId: null,
      currency: 'INR',
      currencySym: '₹',
      language: 'en',
      languageFlag: '🇮🇳',
      theme: 'lotus',
      chartMode: 'north',

      setAuth: (token, refreshToken, user) => {
        localStorage.setItem('vh_token', token)
        localStorage.setItem('vh_refresh', refreshToken)
        set({ token, refreshToken, user })
      },

      setHoroId: (currentHoroId) => set({ currentHoroId }),

      setCurrency: (currency, currencySym) => set({ currency, currencySym }),

      setLanguage: (language, languageFlag) => set({ language, languageFlag }),

      setTheme: (theme) => set({ theme }),

      setChartMode: (chartMode) => set({ chartMode }),

      logout: () => {
        localStorage.clear()
        set({ token: null, refreshToken: null, user: null, currentHoroId: null })
      },
    }),
    { name: 'vh-store' }
  )
)
