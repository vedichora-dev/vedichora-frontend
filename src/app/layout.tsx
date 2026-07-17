import type { Metadata } from 'next'
import './globals.css'
import ConditionalLayout from '@/components/layout/ConditionalLayout'
import ThemeProvider from '@/components/ThemeProvider'
import dynamic from 'next/dynamic'

// Client-only components — must be dynamically imported in server layout
const A11yPanel = dynamic(() => import('@/components/ui/A11yPanel'), { ssr: false })

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  title: 'VedicHora — Vedic Astrology Platform',
  description: 'Free Kundali, daily horoscope, compatibility matching, and live astrologer consultations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <a href="#main-content" style={{
            position:'fixed',top:'-80px',left:'12px',zIndex:999,
            background:'#3A1414',color:'#fff',padding:'8px 16px',
            borderRadius:'6px',fontSize:'13px',fontWeight:600,textDecoration:'none',
          }}>Skip to main content</a>
          <ConditionalLayout>{children}</ConditionalLayout>
          <A11yPanel />
        </ThemeProvider>
      </body>
    </html>
  )
}
