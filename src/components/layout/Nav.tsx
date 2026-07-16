'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useStore } from '@/store'
import { CURRENCIES, LANGUAGES } from '@/lib/constants'
import { getInitials } from '@/lib/utils'
import { Menu, X, ChevronDown, Globe, LogOut, LayoutDashboard, Star } from 'lucide-react'

const NAV_LINKS = [
  { href: '/',          label: 'Horoscope' },
  { href: '/chart',     label: 'Kundali'   },
  { href: '/match',     label: 'Matching'  },
  { href: '/shop',      label: 'Shop'      },
  { href: '/learn',     label: 'Learn'     },
  { href: '/api-docs',  label: 'API'       },
  { href: '/about',     label: 'About'     },
]

const MORE_LINKS = [
  { href: '/consult',    label: 'Consult an Astrologer' },
  { href: '/transits',   label: 'Transits'    },
  { href: '/yogas',      label: 'Yogas'       },
  { href: '/remedies',   label: 'Remedies'    },
  { href: '/muhurta',    label: 'Muhurta'     },
  { href: '/numerology', label: 'Numerology'  },
  { href: '/varshaphal', label: 'Varshaphal'  },
]

function Dropdown({ id, trigger, children }: { id: string; trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-border rounded-xl shadow-xl z-50 py-1.5 min-w-[180px] animate-slide-in">
          {children}
        </div>
      )}
    </div>
  )
}

function DropItem({ children, onClick, href }: { children: React.ReactNode; onClick?: () => void; href?: string }) {
  const cls = "flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gold/5 hover:text-maroon cursor-pointer transition-colors w-full text-left"
  if (href) return <Link href={href} className={cls}>{children}</Link>
  return <button className={cls} onClick={onClick}>{children}</button>
}

export default function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const { token, user, currency, currencySym, language, languageFlag, chartMode, setCurrency, setLanguage, setChartMode, logout } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => pathname === href

  const handleLogout = () => { logout(); router.push('/signin') }

  return (
    <>
      <nav className="sticky top-0 z-40 h-14 bg-white border-b border-border flex items-center gap-3 px-4 shadow-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-maroon flex items-center justify-center">
            <Star className="w-4 h-4 text-gold-star fill-gold-star" />
          </div>
          <span className="font-cinzel font-bold text-maroon text-base">Vedic<span className="text-gold">Hora</span></span>
        </Link>

        {/* Mode toggle */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 shrink-0">
          {(['north','south'] as const).map(m => (
            <button key={m} onClick={() => setChartMode(m)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-all capitalize ${chartMode === m ? 'bg-maroon text-white shadow-sm' : 'text-gray-500 hover:text-maroon'}`}>
              {m}
            </button>
          ))}
        </div>

        {/* Nav links */}
        <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive(l.href) ? 'text-maroon font-semibold border-b-2 border-gold' : 'text-gray-600 hover:text-maroon hover:bg-gold/5'}`}>
              {l.label}
            </Link>
          ))}
          {/* More dropdown */}
          <Dropdown id="more" trigger={
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-maroon hover:bg-gold/5 transition-colors">
              More <ChevronDown className="w-3.5 h-3.5" />
            </button>
          }>
            {MORE_LINKS.map(l => <DropItem key={l.href} href={l.href}>{l.label}</DropItem>)}
            <div className="border-t border-border my-1" />
            <DropItem href="/western">🌐 Western layout</DropItem>
          </Dropdown>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Language */}
          <Dropdown id="lang" trigger={
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold border border-border hover:border-gold hover:bg-gold/5 transition-all">
              <span>{languageFlag}</span>
              <span className="text-gray-600">{language.toUpperCase().slice(0,2)}</span>
            </button>
          }>
            <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-border mb-1">Language</div>
            {LANGUAGES.map(l => (
              <DropItem key={l.code} onClick={() => setLanguage(l.code, l.flag)}>
                {l.flag} {l.label}
              </DropItem>
            ))}
          </Dropdown>

          {/* Currency */}
          <Dropdown id="curr" trigger={
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold border border-border hover:border-gold hover:bg-gold/5 transition-all">
              <span>{currencySym}</span>
              <span className="text-gray-600">{currency}</span>
            </button>
          }>
            <div className="px-3 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-border mb-1">Currency</div>
            {CURRENCIES.map(c => (
              <DropItem key={c.code} onClick={() => setCurrency(c.code, c.sym)}>
                {c.flag} {c.sym} {c.name}
              </DropItem>
            ))}
          </Dropdown>

          {/* Auth */}
          {token && user ? (
            <Dropdown id="user" trigger={
              <button className="w-8 h-8 rounded-full bg-gradient-to-br from-maroon to-maroon-light text-white text-xs font-bold flex items-center justify-center hover:shadow-md transition-shadow">
                {getInitials(user.displayName)}
              </button>
            }>
              <div className="px-4 py-2.5 border-b border-border mb-1">
                <div className="text-sm font-semibold text-maroon">{user.displayName}</div>
                <div className="text-xs text-gray-400">{user.email}</div>
              </div>
              <DropItem href="/dashboard"><LayoutDashboard className="w-4 h-4" /> Dashboard</DropItem>
              <DropItem href="/chart"><Star className="w-4 h-4" /> My Charts</DropItem>
              <div className="border-t border-border my-1" />
              <DropItem onClick={handleLogout}><LogOut className="w-4 h-4 text-red-500" /> <span className="text-red-600">Sign out</span></DropItem>
            </Dropdown>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/signin" className="btn-ghost text-sm py-1.5 px-3.5">Sign in</Link>
              <Link href="/signup" className="btn-primary text-sm py-1.5 px-3.5">Get started</Link>
            </div>
          )}

          {/* Mobile menu */}
          <button className="lg:hidden p-1.5" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-14 bg-white z-30 p-4 overflow-y-auto animate-slide-in">
          <div className="space-y-1">
            {[...NAV_LINKS, ...MORE_LINKS].map(l => (
              <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gold/5 hover:text-maroon transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
