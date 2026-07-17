'use client'
import { useStore } from '@/store'
import { useEffect, useState, useCallback } from 'react'
import en from '@/i18n/en.json'
import ta from '@/i18n/ta.json'
import hi from '@/i18n/hi.json'

// Static JSON fallbacks (Phase 1)
const STATIC: Record<string, typeof en> = { en, ta, hi }

// In-memory API cache — loaded once per language per session
const API_CACHE: Record<string, {
  planets: string[]
  rasi: string[]
  nakshatra: string[]
}> = {}

// Fetch from API and cache
async function fetchLangNames(lang: string, token: string) {
  if (API_CACHE[lang]) return API_CACHE[lang]
  try {
    const res = await fetch(
      `https://enchanting-dedication-production.up.railway.app/api/language/names?lang=${lang}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    const d = data?.data
    if (d) {
      API_CACHE[lang] = { planets: d.planets || [], rasi: d.rasi || [], nakshatra: d.nakshatra || [] }
      return API_CACHE[lang]
    }
  } catch {}
  return null
}

// UI label lookup — reads from JSON files
export function useT() {
  const { language } = useStore()
  const dict = STATIC[language] || STATIC.en
  return function t(key: string, fallback?: string): string {
    const parts = key.split('.')
    let val: unknown = dict
    for (const p of parts) {
      if (val && typeof val === 'object' && p in (val as object)) {
        val = (val as Record<string, unknown>)[p]
      } else {
        let enVal: unknown = en
        for (const ep of parts) {
          if (enVal && typeof enVal === 'object' && ep in (enVal as object))
            enVal = (enVal as Record<string, unknown>)[ep]
          else { enVal = fallback || key; break }
        }
        return String(enVal || fallback || key)
      }
    }
    return String(val || fallback || key)
  }
}

// Planet name — tries API cache first, falls back to JSON, then English
export function usePlanetName() {
  const { language, token } = useStore()
  const [names, setNames] = useState<string[] | null>(null)

  useEffect(() => {
    if (API_CACHE[language]) {
      setNames(API_CACHE[language].planets)
      return
    }
    if (token) {
      fetchLangNames(language, token).then(d => { if (d) setNames(d.planets) })
    }
  }, [language, token])

  const PLANET_ORDER = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']

  return useCallback((planet: string): string => {
    // From API cache
    if (names) {
      const idx = PLANET_ORDER.indexOf(planet)
      if (idx >= 0 && names[idx]) return names[idx]
    }
    // From JSON file
    const t = useT_static(language)
    const fromJson = t(`planets.${planet}`)
    if (fromJson !== `planets.${planet}`) return fromJson
    return planet
  }, [names, language])
}

// Sign name — tries API cache first
export function useSignName() {
  const { language, token } = useStore()
  const [rasis, setRasis] = useState<string[] | null>(null)

  useEffect(() => {
    if (API_CACHE[language]) {
      setRasis(API_CACHE[language].rasi)
      return
    }
    if (token) {
      fetchLangNames(language, token).then(d => { if (d) setRasis(d.rasi) })
    }
  }, [language, token])

  const RASI_ORDER = ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena']

  return useCallback((sign: string): string => {
    if (rasis) {
      const idx = RASI_ORDER.indexOf(sign)
      if (idx >= 0 && rasis[idx]) return rasis[idx]
      // Also try matching by index if sign is a number string
      const numIdx = parseInt(sign)
      if (!isNaN(numIdx) && rasis[numIdx]) return rasis[numIdx]
    }
    const t = useT_static(language)
    const fromJson = t(`signs.${sign}`)
    if (fromJson !== `signs.${sign}`) return fromJson
    return sign
  }, [rasis, language])
}

// Static version of useT for use inside callbacks
function useT_static(language: string) {
  const dict = STATIC[language] || STATIC.en
  return function t(key: string, fallback?: string): string {
    const parts = key.split('.')
    let val: unknown = dict
    for (const p of parts) {
      if (val && typeof val === 'object' && p in (val as object))
        val = (val as Record<string, unknown>)[p]
      else return fallback || key
    }
    return String(val || fallback || key)
  }
}
