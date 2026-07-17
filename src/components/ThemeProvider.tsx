'use client'
import { useEffect } from 'react'
import { useTheme } from '@/store/theme'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return <>{children}</>
}
