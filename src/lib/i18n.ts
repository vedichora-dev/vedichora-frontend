'use client'
import { useStore } from '@/store'
import en from '@/i18n/en.json'
import ta from '@/i18n/ta.json'
import hi from '@/i18n/hi.json'

const TRANSLATIONS: Record<string, typeof en> = { en, ta, hi }

// Typed path resolver - supports 'nav.signin', 'chart.title' etc
type Leaves<T, P extends string = ''> = T extends object
  ? { [K in keyof T]: Leaves<T[K], P extends '' ? `${string & K}` : `${P}.${string & K}`> }[keyof T]
  : P

type TransKey = Leaves<typeof en>

export function useT() {
  const { language } = useStore()
  const dict = TRANSLATIONS[language] || TRANSLATIONS.en

  return function t(key: string, fallback?: string): string {
    const parts = key.split('.')
    let val: unknown = dict
    for (const p of parts) {
      if (val && typeof val === 'object' && p in (val as object)) {
        val = (val as Record<string, unknown>)[p]
      } else {
        // Fallback to English
        let enVal: unknown = en
        for (const ep of parts) {
          if (enVal && typeof enVal === 'object' && ep in (enVal as object)) {
            enVal = (enVal as Record<string, unknown>)[ep]
          } else { enVal = fallback || key; break }
        }
        return String(enVal || fallback || key)
      }
    }
    return String(val || fallback || key)
  }
}

// Planet name in current language
export function usePlanetName() {
  const t = useT()
  return (planet: string) => t(`planets.${planet}`, planet)
}

// Sign name in current language  
export function useSignName() {
  const t = useT()
  return (sign: string) => t(`signs.${sign}`, sign)
}
