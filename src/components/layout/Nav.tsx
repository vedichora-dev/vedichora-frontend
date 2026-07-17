'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useStore } from '@/store'
import { useTheme } from '@/store/theme'
import { CURRENCIES, LANGUAGES, THEMES } from '@/lib/constants'
import { getInitials } from '@/lib/utils'
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Star } from 'lucide-react'

const NAV = [
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

// Simple dropdown — closes on outside CLICK (not mousedown)
// so child onMouseDown fires before close
function DD({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    // Use setTimeout so this handler is added AFTER the opening click settles
    const t = setTimeout(() => document.addEventListener('click', close), 0)
    return () => { clearTimeout(t); document.removeEventListener('click', close) }
  }, [open])

  return (
    <div ref={ref} style={{position:'relative',display:'inline-block'}}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{display:'flex',alignItems:'center',gap:'4px',padding:'5px 10px',
          border:'1px solid var(--bd)',borderRadius:'20px',background:'var(--bg2)',
          color:'var(--tx2)',fontSize:'11px',fontWeight:700,cursor:'pointer',fontFamily:'inherit'}}
      >{label}</button>
      {open && (
        <div style={{position:'absolute',top:'calc(100% + 6px)',right:0,zIndex:9999,
          minWidth:'180px',background:'var(--surf)',border:'1px solid var(--bd)',
          borderRadius:'10px',boxShadow:'0 8px 24px rgba(0,0,0,.15)',
          overflow:'hidden',animation:'fadeIn .1s ease'}}>
          {children}
        </div>
      )}
    </div>
  )
}

// Item uses onMouseDown so it fires BEFORE outside-click closes dropdown
function Item({ children, onSelect, href }: { children: React.ReactNode; onSelect?: () => void; href?: string }) {
  const s: React.CSSProperties = {
    display:'flex', alignItems:'center', gap:'8px', width:'100%',
    padding:'9px 14px', fontSize:'13px', color:'var(--tx2)',
    background:'none', border:'none', cursor:'pointer',
    fontFamily:'inherit', textAlign:'left', textDecoration:'none',
  }
  const handle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (onSelect) onSelect()
  }
  if (href) return <Link href={href} style={s} onMouseDown={handle}>{children}</Link>
  return (
    <button style={s} onMouseDown={handle}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}>
      {children}
    </button>
  )
}

function Sep() {
  return <div style={{height:'1px',background:'var(--bd)',margin:'4px 0'}} />
}

function DH({ label }: { label: string }) {
  return <div style={{padding:'6px 14px 4px',fontSize:'9px',fontWeight:800,
    color:'var(--txm)',textTransform:'uppercase',letterSpacing:'.08em',
    borderBottom:'1px solid var(--bd)',marginBottom:'2px'}}>{label}</div>
}

export default function Nav() {
  const router = useRouter()
  const path = usePathname()
  const { token, user, currency, currencySym, language, languageFlag,
          chartMode, setCurrency, setLanguage, setChartMode, logout } = useStore()
  const { theme, themes, meta, setTheme } = useTheme()
  const [mob, setMob] = useState(false)

  const logout_ = () => { logout(); router.push('/signin') }

  return (
    <>
      <nav style={{position:'sticky',top:0,zIndex:200,height:'54px',
        background:'var(--surf)',borderBottom:'1px solid var(--bd)',
        display:'flex',alignItems:'center',gap:'8px',padding:'0 16px',
        boxShadow:'var(--sh1)',overflow:'visible'}}>

        {/* Logo */}
        <Link href="/" style={{display:'flex',alignItems:'center',gap:'8px',
          textDecoration:'none',flexShrink:0,marginRight:'4px'}}>
          <div style={{width:'32px',height:'32px',borderRadius:'8px',
            background:'var(--acc)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Star style={{width:'16px',height:'16px',color:'var(--gold)',fill:'var(--gold)'}} />
          </div>
          <span style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'15px',color:'var(--acc)'}}>
            Vedic<em style={{color:'var(--gold)',fontStyle:'normal'}}>Hora</em>
          </span>
        </Link>

        {/* Mode */}
        <div style={{display:'flex',background:'var(--bg2)',border:'1px solid var(--bd)',
          borderRadius:'8px',padding:'2px',gap:'2px',flexShrink:0}}>
          {(['north','south'] as const).map(m => (
            <button key={m} onClick={() => setChartMode(m)} style={{
              padding:'3px 11px',borderRadius:'6px',fontSize:'11px',fontWeight:600,
              border:'none',cursor:'pointer',fontFamily:'inherit',textTransform:'capitalize',
              background:chartMode===m?'var(--acc)':'transparent',
              color:chartMode===m?'#fff':'var(--txm)',transition:'all .15s'}}>
              {m}
            </button>
          ))}
        </div>

        {/* Nav links */}
        <div className="hidden lg:flex" style={{flex:1,justifyContent:'center',
          display:'flex',alignItems:'center',gap:'0'}}>
          {NAV.map(l => (
            <Link key={l.href} href={l.href} style={{
              padding:'5px 11px',borderRadius:'6px',fontSize:'13px',
              fontWeight:path===l.href?700:500,textDecoration:'none',
              color:path===l.href?'var(--acc)':'var(--tx2)',
              borderBottom:path===l.href?'2px solid var(--gold)':'2px solid transparent',
            }}>{l.label}</Link>
          ))}
          {/* More */}
          <div style={{position:'relative'}}>
            <DD label={<>More <ChevronDown style={{width:'12px',height:'12px'}} /></>}>
              <DH label="More pages" />
              {MORE.map(l => <Item key={l.href} href={l.href} onSelect={() => {}}>{l.label}</Item>)}
              <Sep />
              <Item href="/western" onSelect={() => {}}>🌐 Western layout</Item>
            </DD>
          </div>
        </div>

        {/* Right */}
        <div style={{display:'flex',alignItems:'center',gap:'6px',
          marginLeft:'auto',flexShrink:0}}>

          {/* Language */}
          <DD label={<>{languageFlag} {language.slice(0,2).toUpperCase()}</>}>
            <DH label="Language" />
            {LANGUAGES.map(l => (
              <Item key={l.code} onSelect={() => { setLanguage(l.code, l.flag); }}>
                {l.flag} {l.label}
              </Item>
            ))}
          </DD>

          {/* Currency */}
          <DD label={<>{currencySym} {currency}</>}>
            <DH label="Currency" />
            {CURRENCIES.map(c => (
              <Item key={c.code} onSelect={() => setCurrency(c.code, c.sym)}>
                {c.flag} {c.sym} {c.name}
              </Item>
            ))}
          </DD>

          {/* Theme */}
          <DD label={
            <span style={{width:'18px',height:'18px',borderRadius:'50%',display:'inline-block',
              background:meta[theme]?.swatch||'var(--acc)',border:'2px solid var(--gold)'}} />
          }>
            <DH label="Theme" />
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',
              gap:'6px',padding:'8px 10px 4px'}}>
              {themes.filter((t,i,a)=>a.findIndex(x=>x.key===t.key)===i).map(t => (
                <button key={t.key} onMouseDown={() => setTheme(t.key)}
                  title={meta[t.key]?.label}
                  style={{display:'flex',flexDirection:'column',alignItems:'center',
                    gap:'3px',padding:'5px 3px',border:theme===t.key?
                    '1.5px solid var(--gold)':'1.5px solid transparent',
                    borderRadius:'8px',background:'none',cursor:'pointer'}}>
                  <div style={{width:'22px',height:'22px',borderRadius:'50%',
                    background:meta[t.key]?.swatch}} />
                  <span style={{fontSize:'8px',color:'var(--tx2)',whiteSpace:'nowrap'}}>
                    {meta[t.key]?.label}
                  </span>
                </button>
              ))}
            </div>
          </DD>

          <div style={{width:'1px',height:'18px',background:'var(--bd)',margin:'0 2px'}} />

          {/* Auth */}
          {token && user ? (
            <DD label={
              <span style={{width:'30px',height:'30px',borderRadius:'50%',
                background:'var(--acc)',color:'#fff',fontSize:'11px',fontWeight:700,
                display:'inline-flex',alignItems:'center',justifyContent:'center'}}>
                {getInitials(user.displayName)}
              </span>
            }>
              <div style={{padding:'8px 14px 6px',borderBottom:'1px solid var(--bd)'}}>
                <div style={{fontSize:'13px',fontWeight:600,color:'var(--acc)'}}>{user.displayName}</div>
                <div style={{fontSize:'11px',color:'var(--txm)'}}>{user.email}</div>
              </div>
              <Item href="/dashboard" onSelect={() => {}}><LayoutDashboard style={{width:'14px',height:'14px'}} /> Dashboard</Item>
              <Item href="/chart" onSelect={() => {}}><Star style={{width:'14px',height:'14px'}} /> My Charts</Item>
              <Sep />
              <Item onSelect={logout_}><LogOut style={{width:'14px',height:'14px',color:'#DC2626'}} /> <span style={{color:'#DC2626'}}>Sign out</span></Item>
            </DD>
          ) : (
            <div style={{display:'flex',gap:'8px'}}>
              <Link href="/signin" className="btn-ghost" style={{fontSize:'13px',padding:'5px 12px',textDecoration:'none'}}>Sign in</Link>
              <Link href="/signup" className="btn-primary" style={{fontSize:'13px',padding:'5px 12px',textDecoration:'none'}}>Get started</Link>
            </div>
          )}

          <button className="lg:hidden" onClick={() => setMob(o=>!o)}
            style={{background:'none',border:'none',cursor:'pointer',padding:'4px',color:'var(--tx)'}}>
            {mob ? <X style={{width:'20px',height:'20px'}} /> : <Menu style={{width:'20px',height:'20px'}} />}
          </button>
        </div>
      </nav>

      {mob && (
        <div style={{position:'fixed',inset:0,top:'54px',background:'var(--surf)',
          zIndex:30,padding:'16px',overflowY:'auto'}}>
          {[...NAV,...MORE].map(l => (
            <Link key={l.href} href={l.href} onClick={() => setMob(false)}
              style={{display:'block',padding:'11px 16px',fontSize:'14px',
                color:'var(--tx2)',textDecoration:'none',borderRadius:'8px'}}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
