'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useStore } from '@/store'
import { useTheme, THEME_META } from '@/store/theme'
import { CURRENCIES, LANGUAGES } from '@/lib/constants'
import { getInitials } from '@/lib/utils'
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Star, BarChart3 } from 'lucide-react'

const NAV_LINKS = [
  { href:'/', label:'Horoscope' },
  { href:'/chart', label:'Kundali' },
  { href:'/match', label:'Matching' },
  { href:'/jyoti', label:'Jyoti AI' },
  { href:'/shop', label:'Shop' },
  { href:'/learn', label:'Learn' },
  { href:'/api-docs', label:'API' },
  { href:'/about', label:'About' },
]
const MORE = [
  { href:'/consult', label:'Consult an Astrologer' },
  { href:'/transits', label:'Transits' },
  { href:'/yogas', label:'Yogas' },
  { href:'/remedies', label:'Remedies' },
  { href:'/muhurta', label:'Muhurta' },
  { href:'/numerology', label:'Numerology' },
  { href:'/varshaphal', label:'Varshaphal' },
]

function DD({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(o => !o)}>{trigger}</div>
      {open && (
        <div style={{background:'var(--surf)',border:'1px solid var(--bd)',boxShadow:'var(--sh3)'}}
          className="absolute right-0 top-full mt-1.5 rounded-xl z-50 py-1.5 min-w-[190px] animate-[fadeIn_.15s_ease]">
          {children}
        </div>
      )}
    </div>
  )
}

function DI({ children, onClick, href }: { children: React.ReactNode; onClick?: () => void; href?: string }) {
  const cls = "flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-left cursor-pointer transition-colors hover:opacity-80"
  const style = { color:'var(--tx2)' }
  if (href) return <Link href={href} className={cls} style={style}>{children}</Link>
  return <button className={cls} style={style} onClick={onClick}>{children}</button>
}

export default function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const { token, user, currency, currencySym, languageFlag, language, chartMode, setCurrency, setLanguage, setChartMode, logout } = useStore()
  const { theme, themes, meta, setTheme } = useTheme()
  const [mob, setMob] = useState(false)

  const handleLogout = () => { logout(); router.push('/signin') }

  return (
    <>
      <nav style={{background:'var(--surf)',borderBottom:'1px solid var(--bd)'}}
        className="sticky top-0 z-40 h-14 flex items-center gap-3 px-4 shadow-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-1 shrink-0">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'var(--maroon)'}}>
            <Star className="w-4 h-4 fill-current" style={{color:'var(--star)'}} />
          </div>
          <span className="font-cinzel font-bold text-base" style={{color:'var(--maroon)'}}>
            Vedic<span style={{color:'var(--gold)'}}>Hora</span>
          </span>
        </Link>

        {/* Mode */}
        <div className="flex rounded-lg p-0.5 gap-0.5 shrink-0" style={{background:'var(--bg2)',border:'1px solid var(--bd)'}}>
          {(['north','south'] as const).map(m => (
            <button key={m} onClick={() => setChartMode(m)}
              className="px-3 py-1 rounded-md text-xs font-semibold transition-all capitalize"
              style={chartMode===m ? {background:'var(--maroon)',color:'#fff'} : {color:'var(--txm)'}}>{m}</button>
          ))}
        </div>

        {/* Nav links */}
        <div className="hidden lg:flex items-center gap-0 flex-1 justify-center">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={pathname===l.href ? {color:'var(--maroon)',fontWeight:700,borderBottom:'2px solid var(--gold)'} : {color:'var(--tx2)'}}>
              {l.label}
            </Link>
          ))}
          <DD trigger={
            <button className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors" style={{color:'var(--tx2)'}}>
              More <ChevronDown className="w-3.5 h-3.5" />
            </button>
          }>
            {MORE.map(l => <DI key={l.href} href={l.href}>{l.label}</DI>)}
            <div style={{borderTop:'1px solid var(--bd)',margin:'4px 0'}} />
            <DI href="/western">🌐 Western layout</DI>
          </DD>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Language */}
          <DD trigger={
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{border:'1px solid var(--bd)',background:'var(--bg2)',color:'var(--tx2)'}}>
              {languageFlag} {language.slice(0,2).toUpperCase()}
            </button>
          }>
            <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest" style={{color:'var(--txm)',borderBottom:'1px solid var(--bd)'}}>Language</div>
            {LANGUAGES.map(l => <DI key={l.code} onClick={() => setLanguage(l.code, l.flag)}>{l.flag} {l.label}</DI>)}
          </DD>

          {/* Currency */}
          <DD trigger={
            <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{border:'1px solid var(--bd)',background:'var(--bg2)',color:'var(--tx2)'}}>
              {currencySym} {currency}
            </button>
          }>
            <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest" style={{color:'var(--txm)',borderBottom:'1px solid var(--bd)'}}>Currency</div>
            {CURRENCIES.map(c => <DI key={c.code} onClick={() => setCurrency(c.code, c.sym)}>{c.flag} {c.sym} {c.name}</DI>)}
          </DD>

          {/* Theme */}
          <DD trigger={
            <button className="w-7 h-7 rounded-full border-2 transition-all" title="Change theme"
              style={{border:'2px solid var(--gold)',background:meta[theme]?.swatch||'var(--maroon)'}} />
          }>
            <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest" style={{color:'var(--txm)',borderBottom:'1px solid var(--bd)'}}>Theme</div>
            <div className="grid grid-cols-3 gap-1.5 p-3">
              {themes.map(t => (
                <button key={t} onClick={() => setTheme(t)} title={meta[t].label}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all"
                  style={theme===t ? {background:'var(--acc-l)',border:'1.5px solid var(--gold)'} : {border:'1.5px solid transparent'}}>
                  <div className="w-6 h-6 rounded-full" style={{background:meta[t].swatch}} />
                  <span className="text-xs" style={{color:'var(--tx2)'}}>{meta[t].label}</span>
                </button>
              ))}
            </div>
          </DD>

          {/* Auth */}
          {token && user ? (
            <DD trigger={
              <button className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center"
                style={{background:'var(--maroon)'}}>{getInitials(user.displayName)}</button>
            }>
              <div className="px-4 py-2.5" style={{borderBottom:'1px solid var(--bd)'}}>
                <div className="text-sm font-semibold" style={{color:'var(--maroon)'}}>{user.displayName}</div>
                <div className="text-xs" style={{color:'var(--txm)'}}>{user.email}</div>
              </div>
              <DI href="/dashboard"><LayoutDashboard className="w-4 h-4" /> Dashboard</DI>
              <DI href="/chart"><Star className="w-4 h-4" /> My Charts</DI>
              <div style={{borderTop:'1px solid var(--bd)',margin:'4px 0'}} />
              <DI onClick={handleLogout}><LogOut className="w-4 h-4 text-red-500" /> <span className="text-red-600">Sign out</span></DI>
            </DD>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/signin" className="btn-ghost text-sm py-1.5 px-3">Sign in</Link>
              <Link href="/signup" className="btn-primary text-sm py-1.5 px-3.5">Get started</Link>
            </div>
          )}
          <button className="lg:hidden p-1.5" onClick={() => setMob(o=>!o)}>
            {mob ? <X className="w-5 h-5" style={{color:'var(--tx)'}} /> : <Menu className="w-5 h-5" style={{color:'var(--tx)'}} />}
          </button>
        </div>
      </nav>
      {mob && (
        <div className="lg:hidden fixed inset-0 top-14 z-30 p-4 overflow-y-auto" style={{background:'var(--surf)'}}>
          {[...NAV_LINKS,...MORE].map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMob(false)}
              className="block px-4 py-3 rounded-lg text-sm font-medium transition-colors" style={{color:'var(--tx2)'}}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
