import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User { displayName: string; email: string; plan: string }

interface AppState {
  token: string | null
  refreshToken: string | null
  user: User | null
  currentHoroId: string | null
  currency: string
  currencySym: string
  language: string
  languageFlag: string
  chartMode: 'north' | 'south'
  redirectAfterLogin: string | null
  setAuth: (token: string, refresh: string, user: User) => void
  setHoroId: (id: string) => void
  setCurrency: (code: string, sym: string) => void
  setLanguage: (code: string, flag: string) => void
  setChartMode: (mode: 'north' | 'south') => void
  setRedirectAfterLogin: (path: string | null) => void
  logout: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      token: null, refreshToken: null, user: null, currentHoroId: null,
      currency: 'INR', currencySym: '₹',
      language: 'en', languageFlag: '🇮🇳',
      chartMode: 'north',
      redirectAfterLogin: null,
      setAuth: (token, refreshToken, user) => {
        localStorage.setItem('vh_token', token)
        localStorage.setItem('vh_refresh', refreshToken)
        set({ token, refreshToken, user })
      },
      setHoroId: (currentHoroId) => set({ currentHoroId }),
      setCurrency: (currency, currencySym) => set({ currency, currencySym }),
      setLanguage: (language, languageFlag) => set({ language, languageFlag }),
      setChartMode: (chartMode) => set({ chartMode }),
      setRedirectAfterLogin: (redirectAfterLogin) => set({ redirectAfterLogin }),
      logout: () => {
        localStorage.clear()
        set({ token: null, refreshToken: null, user: null, currentHoroId: null, redirectAfterLogin: null })
      },
    }),
    { name: 'vh-store' }
  )
)
