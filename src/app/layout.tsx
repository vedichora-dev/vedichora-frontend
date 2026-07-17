import type { Metadata } from 'next'
import './globals.css'
import ConditionalLayout from '@/components/layout/ConditionalLayout'
import ThemeProvider from '@/components/ThemeProvider'
import A11yPanel from '@/components/ui/A11yPanel'

export const metadata: Metadata = {
  title: 'VedicHora — Vedic Astrology Platform',
  description: 'Free Kundali, daily horoscope, compatibility matching, and live astrologer consultations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Noto+Serif:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          {/* Skip to main content — screen reader / keyboard accessibility */}
          <a href="#main-content"
            style={{
              position:'fixed', top:'-80px', left:'12px', zIndex:999,
              background:'var(--maroon,#3A1414)', color:'#fff',
              padding:'8px 16px', borderRadius:'6px', fontSize:'13px',
              fontWeight:600, textDecoration:'none', transition:'top .2s',
            }}
            onFocus={e => { e.currentTarget.style.top = '12px' }}
            onBlur={e  => { e.currentTarget.style.top = '-80px' }}>
            Skip to main content
          </a>

          <ConditionalLayout>{children}</ConditionalLayout>
          <A11yPanel />
        </ThemeProvider>
      </body>
    </html>
  )
}
