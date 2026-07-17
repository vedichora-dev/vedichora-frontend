'use client'
import { usePathname } from 'next/navigation'
import Nav from './Nav'
import HeroCarousel from './HeroCarousel'

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isWestern = pathname === '/western'
  const isAuth = pathname === '/signin' || pathname === '/signup'

  return (
    <>
      {!isWestern && !isAuth && <Nav />}
      {!isWestern && !isAuth && <HeroCarousel />}
      <main>{children}</main>
    </>
  )
}
