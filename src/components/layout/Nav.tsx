'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useStore } from '@/store'
import { useTheme } from '@/store/theme'
import { CURRENCIES, LANGUAGES, THEMES } from '@/lib/constants'
import { getInitials } from '@/lib/utils'
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Star } from 'lucide-react'

const NAV_LINKS = [
  { href:'/', label:'Horoscope' },
  { href:'/chart', label:'Kundali' },
  { href:'/match', label:'Matching' },
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

function Pill({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      style={{display:'inline-flex',alignItems:'center',gap:'4px',padding:'4px 10px',
        border:'1px solid var(--bd)',borderRadius:'20px',background:'var(--bg2)',
        color:'var(--tx2)',fontSize:'11px',fontWeight:700,cursor:'pointer',fontFamily:'inherit',
        transition:'border-color .15s'}}
      onMouseEnter={e=>(e.currentTarget.style.borderColor='var(--gold)')}
      onMouseLeave={e=>(e.currentTarget.style.borderColor='var(--bd)')}>
      {children}
    </button>
  )
}

function DD({ trigger, children }: { trigger: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  return (
    <div style={{position:'relative',display:'inline-block'}} ref={ref}>
      <div onClick={e => { e.stopPropagation(); setOpen(o=>!o) }}>{trigger}</div>
      {open && (
        <div style={{position:'absolute',top:'calc(100% + 6px)',right:0,
          background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:'10px',
          boxShadow:'var(--sh3)',zIndex:9999,minWidth:'180px',overflow:'hidden'}}>
          {children}
          <div style={{height:'4px'}} />
        </div>
      )}
    </div>
  )
}

function DH({ label }: { label: string }) {
  return <div style={{padding:'8px 14px 4px',fontSize:'9px',fontWeight:800,color:'var(--txm)',
    textTransform:'uppercase',letterSpacing:'.08em',borderBottom:'1px solid var(--bd)',marginBottom:'3px'}}>{label}</div>
}

function DI({ children, onClick, href }: { children: React.ReactNode; onClick?: () => void; href?: string }) {
  const style = {display:'flex',alignItems:'center',gap:'8px',padding:'8px 14px',
    fontSize:'13px',color:'var(--tx2)',cursor:'pointer',width:'100%',textAlign:'left' as const,
    background:'none',border:'none',fontFamily:'inherit',textDecoration:'none'}
  if (href) return <Link href={href} style={style}>{children}</Link>
  return <button style={style} onClick={onClick} onMouseEnter={e=>{e.currentTarget.style.background='var(--bg2)'}} onMouseLeave={e=>{e.currentTarget.style.background='none'}}>{children}</button>
}

export default function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const store = useStore()
  const { theme, setTheme } = useTheme()
  const [mob, setMob] = useState(false)

  const { token, user, currency, currencySym, language, languageFlag, chartMode, setCurrency, setLanguage, setChartMode, logout } = store

  const handleLogout = () => { logout(); router.push('/signin') }

  const currentTheme = THEMES.find(t => t.key === theme) || THEMES[0]

  return (
    <>
      <nav style={{position:'sticky',top:0,zIndex:200,height:'54px',
        background:'var(--surf)',borderBottom:'1px solid var(--bd)',
        display:'flex',alignItems:'center',gap:'8px',padding:'0 16px',overflow:'visible',
        boxShadow:'var(--sh1)'}}>

        {/* Logo */}
        <Link href="/" style={{display:'flex',alignItems:'center',gap:'8px',marginRight:'4px',flexShrink:0,textDecoration:'none'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'8px',background:'var(--acc)',
            display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Star style={{width:'16px',height:'16px',color:'var(--gold)',fill:'var(--gold)'}} />
          </div>
          <span style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'15px',color:'var(--acc)'}}>
            Vedic<em style={{color:'var(--gold)',fontStyle:'normal'}}>Hora</em>
          </span>
        </Link>

        {/* Mode toggle */}
        <div style={{display:'flex',background:'var(--bg2)',border:'1px solid var(--bd)',borderRadius:'8px',padding:'2px',gap:'2px',flexShrink:0}}>
          {(['north','south'] as const).map(m => (
            <button key={m} onClick={() => setChartMode(m)} style={{
              padding:'4px 12px',borderRadius:'6px',fontSize:'11.5px',fontWeight:600,
              border:'none',cursor:'pointer',fontFamily:'inherit',textTransform:'capitalize',transition:'all .15s',
              background: chartMode===m ? 'var(--acc)' : 'transparent',
              color: chartMode===m ? '#fff' : 'var(--txm)',
            }}>{m}</button>
          ))}
        </div>

        {/* Nav links */}
        <div style={{display:'flex',alignItems:'center',flex:1,justifyContent:'center'}} className="hidden lg:flex">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} style={{
              padding:'6px 12px',borderRadius:'6px',fontSize:'13.5px',fontWeight:500,
              textDecoration:'none',transition:'color .15s',
              color: pathname===l.href ? 'var(--acc)' : 'var(--tx2)',
              fontWeight: pathname===l.href ? 700 : 500,
              borderBottom: pathname===l.href ? '2px solid var(--gold)' : '2px solid transparent',
            }}>{l.label}</Link>
          ))}
          <DD trigger={
            <button style={{display:'flex',alignItems:'center',gap:'4px',padding:'6px 12px',
              borderRadius:'6px',fontSize:'13.5px',fontWeight:500,border:'none',background:'none',
              color:'var(--tx2)',cursor:'pointer',fontFamily:'inherit'}}>
              More <ChevronDown style={{width:'14px',height:'14px'}} />
            </button>
          }>
            <DH label="More pages" />
            {MORE.map(l => <DI key={l.href} href={l.href}>{l.label}</DI>)}
            <div style={{borderTop:'1px solid var(--bd)',margin:'4px 0'}} />
            <DI href="/western">🌐 Western layout</DI>
          </DD>
        </div>

        {/* Right controls */}
        <div style={{display:'flex',alignItems:'center',gap:'6px',marginLeft:'auto',flexShrink:0}}>
          {/* Language */}
          <DD trigger={<Pill>{languageFlag} {language.slice(0,2).toUpperCase()}</Pill>}>
            <DH label="Language" />
            {LANGUAGES.map(l => (
              <DI key={l.code} onClick={() => { setLanguage(l.code, l.flag) }}>
                {l.flag} {l.label}
              </DI>
            ))}
          </DD>

          {/* Currency */}
          <DD trigger={<Pill>{currencySym} {currency}</Pill>}>
            <DH label="Currency" />
            {CURRENCIES.map(c => (
              <DI key={c.code} onClick={() => { setCurrency(c.code, c.sym) }}>
                {c.flag} {c.sym} {c.name}
              </DI>
            ))}
          </DD>

          {/* Theme swatch */}
          <DD trigger={
            <button title="Change theme" style={{
              width:'28px',height:'28px',borderRadius:'50%',border:'2px solid var(--gold)',
              background: currentTheme.swatch, cursor:'pointer',flexShrink:0,padding:0,
              boxShadow:'var(--sh1)'}} />
          }>
            <DH label="Theme" />
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px',padding:'8px 12px 4px'}}>
              {THEMES.filter((t,i,a)=>a.findIndex(x=>x.key===t.key)===i).map(t => (
                <button key={t.key} onClick={() => setTheme(t.key)} title={t.label}
                  style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'3px',
                    padding:'6px 4px',borderRadius:'8px',border:theme===t.key?'2px solid var(--gold)':'2px solid transparent',
                    background:theme===t.key?'var(--bg2)':'transparent',cursor:'pointer'}}>
                  <div style={{width:'22px',height:'22px',borderRadius:'50%',background:t.swatch}} />
                  <span style={{fontSize:'8px',color:'var(--tx2)',whiteSpace:'nowrap'}}>{t.label}</span>
                </button>
              ))}
            </div>
          </DD>

          <div style={{width:'1px',height:'20px',background:'var(--bd)',margin:'0 2px'}} />

          {/* Auth */}
          {token && user ? (
            <DD trigger={
              <button style={{width:'32px',height:'32px',borderRadius:'50%',
                background:'var(--acc)',color:'#fff',fontSize:'12px',fontWeight:700,
                border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {getInitials(user.displayName)}
              </button>
            }>
              <div style={{padding:'10px 14px 8px',borderBottom:'1px solid var(--bd)'}}>
                <div style={{fontSize:'13px',fontWeight:600,color:'var(--acc)'}}>{user.displayName}</div>
                <div style={{fontSize:'11px',color:'var(--txm)'}}>{user.email}</div>
              </div>
              <DI href="/dashboard"><LayoutDashboard style={{width:'14px',height:'14px'}} /> Dashboard</DI>
              <DI href="/chart"><Star style={{width:'14px',height:'14px'}} /> My Charts</DI>
              <div style={{borderTop:'1px solid var(--bd)',margin:'4px 0'}} />
              <DI onClick={handleLogout}><LogOut style={{width:'14px',height:'14px',color:'#DC2626'}} /> <span style={{color:'#DC2626'}}>Sign out</span></DI>
            </DD>
          ) : (
            <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
              <Link href="/signin" className="btn-ghost" style={{fontSize:'13px',padding:'6px 14px',textDecoration:'none'}}>Sign in</Link>
              <Link href="/signup" className="btn-primary" style={{fontSize:'13px',padding:'6px 14px',textDecoration:'none'}}>Get started</Link>
            </div>
          )}

          <button className="lg:hidden" onClick={() => setMob(o=>!o)}
            style={{background:'none',border:'none',cursor:'pointer',padding:'4px',color:'var(--tx)'}}>
            {mob ? <X style={{width:'20px',height:'20px'}} /> : <Menu style={{width:'20px',height:'20px'}} />}
          </button>
        </div>
      </nav>

      {mob && (
        <div style={{position:'fixed',inset:0,top:'54px',background:'var(--surf)',zIndex:30,padding:'16px',overflowY:'auto'}}>
          {[...NAV_LINKS,...MORE].map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMob(false)}
              style={{display:'block',padding:'12px 16px',borderRadius:'8px',fontSize:'14px',
                fontWeight:500,color:'var(--tx2)',textDecoration:'none',marginBottom:'2px'}}>
              {l.label}
            </Link>
          ))}
          <Link href="/western" onClick={() => setMob(false)}
            style={{display:'block',padding:'12px 16px',borderRadius:'8px',fontSize:'14px',color:'var(--tx2)',textDecoration:'none'}}>
            🌐 Western layout
          </Link>
        </div>
      )}
    </>
  )
}
