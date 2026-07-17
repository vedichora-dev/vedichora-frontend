'use client'
import { useEffect } from 'react'
import { useTheme } from '@/store/theme'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  
  useEffect(() => {
    // Apply theme to <html> element so CSS vars cascade everywhere
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])  // re-runs every time theme changes

  // Also apply immediately on first render (SSR hydration)
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }

  return <>{children}</>
}
