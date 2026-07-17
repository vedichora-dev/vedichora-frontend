import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/layout/Nav'
import HeroCarousel from '@/components/layout/HeroCarousel'
import ThemeProvider from '@/components/ThemeProvider'

export const metadata: Metadata = {
  title: 'VedicHora — Vedic Astrology Platform',
  description: 'Free Kundali, daily horoscope, compatibility matching, and live astrologer consultations',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Noto+Serif:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ThemeProvider>
          <Nav />
          <HeroCarousel />
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}
