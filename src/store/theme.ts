'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const THEMES = ['lotus','ivory','manuscript','eclipse','pearl','crimson','teal','noir','bronze','lavender','steel','sage']

const THEME_META: Record<string,{label:string,swatch:string}> = {
  lotus:      { label:'Lotus',      swatch:'linear-gradient(135deg,#FAE8EE,#C4527A)' },
  ivory:      { label:'Ivory',      swatch:'linear-gradient(135deg,#FBF6EC,#E3D6BC)' },
  manuscript: { label:'Manuscript', swatch:'linear-gradient(135deg,#E2D2AC,#9C854C)' },
  eclipse:    { label:'Eclipse',    swatch:'linear-gradient(135deg,#221A12,#0A0604)' },
  pearl:      { label:'Pearl',      swatch:'#F0F0F8' },
  crimson:    { label:'Crimson',    swatch:'linear-gradient(135deg,#6B2C2C,#3A1414)' },
  teal:       { label:'Teal',       swatch:'linear-gradient(135deg,#0F2A2A,#2A8870)' },
  noir:       { label:'Noir',       swatch:'linear-gradient(135deg,#111008,#A07820)' },
  bronze:     { label:'Bronze',     swatch:'linear-gradient(135deg,#1C1A0A,#A09020)' },
  lavender:   { label:'Lavender',   swatch:'linear-gradient(135deg,#EEE8F8,#7A52B8)' },
  steel:      { label:'Steel',      swatch:'linear-gradient(135deg,#D8EAF5,#2A6A9A)' },
  sage:       { label:'Sage',       swatch:'linear-gradient(135deg,#E6F0E8,#4A8A5A)' },
}

interface ThemeStore {
  theme: string
  setTheme: (t: string) => void
  themes: string[]
  meta: typeof THEME_META
}

export const useTheme = create<ThemeStore>()(persist(
  set => ({
    theme: 'lotus',
    themes: THEMES,
    meta: THEME_META,
    setTheme: (theme) => {
      set({ theme })
      if (typeof document !== 'undefined') document.documentElement.setAttribute('data-theme', theme)
    }
  }),
  { name: 'vh-theme' }
))
export { THEMES, THEME_META }
