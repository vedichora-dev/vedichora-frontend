import type { Metadata } from 'next'
import './globals.css'
import ConditionalLayout from '@/components/layout/ConditionalLayout'
import ThemeProvider from '@/components/ThemeProvider'
import dynamic from 'next/dynamic'

// Client-only components — must be dynamically imported in server layout
const A11yPanel = dynamic(() => import('@/components/ui/A11yPanel'), { ssr: false })

export const metadata: Metadata = {
  title: 'VedicHora — Vedic Astrology Platform',
  description: 'Free Kundali, daily horoscope, compatibility matching, and live astrologer consultations',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.ico' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
    other: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  themeColor: '#3D0808',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#3D0808" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
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
