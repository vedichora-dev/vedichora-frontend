'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Star, Heart, Moon, Sun, Zap } from 'lucide-react'

const SIGNS = [
  { en:'Aries',       sym:'♈', dates:'Mar 21–Apr 19', elem:'Fire',  planet:'Mars',    trait:'Bold & driven',      color:'#DC2626' },
  { en:'Taurus',      sym:'♉', dates:'Apr 20–May 20', elem:'Earth', planet:'Venus',   trait:'Stable & sensual',   color:'#16A34A' },
  { en:'Gemini',      sym:'♊', dates:'May 21–Jun 20', elem:'Air',   planet:'Mercury', trait:'Witty & adaptable',  color:'#CA8A04' },
  { en:'Cancer',      sym:'♋', dates:'Jun 21–Jul 22', elem:'Water', planet:'Moon',    trait:'Nurturing & deep',   color:'#0891B2' },
  { en:'Leo',         sym:'♌', dates:'Jul 23–Aug 22', elem:'Fire',  planet:'Sun',     trait:'Confident & radiant',color:'#EA580C' },
  { en:'Virgo',       sym:'♍', dates:'Aug 23–Sep 22', elem:'Earth', planet:'Mercury', trait:'Analytical & caring',color:'#65A30D' },
  { en:'Libra',       sym:'⚖', dates:'Sep 23–Oct 22', elem:'Air',   planet:'Venus',   trait:'Harmonious & fair',  color:'#DB2777' },
  { en:'Scorpio',     sym:'♏', dates:'Oct 23–Nov 21', elem:'Water', planet:'Pluto',   trait:'Intense & magnetic', color:'#7C3AED' },
  { en:'Sagittarius', sym:'♐', dates:'Nov 22–Dec 21', elem:'Fire',  planet:'Jupiter', trait:'Free & philosophical',color:'#B45309' },
  { en:'Capricorn',   sym:'♑', dates:'Dec 22–Jan 19', elem:'Earth', planet:'Saturn',  trait:'Ambitious & wise',   color:'#374151' },
  { en:'Aquarius',    sym:'♒', dates:'Jan 20–Feb 18', elem:'Air',   planet:'Uranus',  trait:'Innovative & unique',color:'#2563EB' },
  { en:'Pisces',      sym:'♓', dates:'Feb 19–Mar 20', elem:'Water', planet:'Neptune', trait:'Dreamy & intuitive', color:'#7C3AED' },
]

const ELEM_COLOR: Record<string,string> = {Fire:'#FEF3C7',Earth:'#DCFCE7',Air:'#DBEAFE',Water:'#E0F2FE'}
const ELEM_TEXT: Record<string,string>  = {Fire:'#92400E',Earth:'#166534',Air:'#1D4ED8',Water:'#0369A1'}

export default function WesternPage() {
  const [sel, setSel] = useState<number|null>(null)
  const [tab, setTab] = useState<'daily'|'compatibility'>('daily')
  const [p1, setP1] = useState(0)
  const [p2, setP2] = useState(7)

  const sign = sel !== null ? SIGNS[sel] : null

  // Simple Western compatibility score
  const getCompat = (a: number, b: number) => {
    const elems = SIGNS.map(s=>s.elem)
    const ea = elems[a], eb = elems[b]
    const compatible: Record<string,string[]> = {Fire:['Fire','Air'],Earth:['Earth','Water'],Air:['Air','Fire'],Water:['Water','Earth']}
    const isComp = compatible[ea]?.includes(eb)
    const isSame = ea === eb
    return { score: isSame ? 95 : isComp ? 80 : 55, label: isSame ? 'Soul Mirrors' : isComp ? 'Highly Compatible' : 'Growth Oriented', color: isSame ? '#16A34A' : isComp ? '#2563EB' : '#CA8A04' }
  }

  const compat = getCompat(p1, p2)

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#0F0F1A 0%,#1A0A2E 50%,#0A1A2E 100%)',color:'#E2E8F0',fontFamily:'Inter,sans-serif'}}>
      {/* Western Nav */}
      <nav style={{borderBottom:'1px solid rgba(255,255,255,.1)',padding:'0 24px',height:'60px',display:'flex',alignItems:'center',justifyContent:'space-between',backdropFilter:'blur(10px)',background:'rgba(15,15,26,.8)',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'36px',height:'36px',borderRadius:'50%',background:'linear-gradient(135deg,#7C3AED,#2563EB)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Star style={{width:'18px',height:'18px',fill:'white',color:'white'}} />
          </div>
          <span style={{fontFamily:'Georgia,serif',fontWeight:700,fontSize:'18px',
            background:'linear-gradient(135deg,#A78BFA,#60A5FA)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
            CosmicMatch
          </span>
        </div>
        <div style={{display:'flex',gap:'24px',fontSize:'14px'}}>
          <a href="#horoscope" style={{color:'rgba(255,255,255,.7)',textDecoration:'none'}}>Horoscope</a>
          <a href="#compatibility" style={{color:'rgba(255,255,255,.7)',textDecoration:'none'}}>Compatibility</a>
          <a href="#birth-chart" style={{color:'rgba(255,255,255,.7)',textDecoration:'none'}}>Birth Chart</a>
        </div>
        <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
          <Link href="/" style={{color:'rgba(255,255,255,.6)',fontSize:'13px',textDecoration:'none'}}>🪔 Switch to Vedic</Link>
          <button style={{background:'linear-gradient(135deg,#7C3AED,#2563EB)',color:'white',border:'none',padding:'8px 18px',borderRadius:'20px',fontSize:'13px',fontWeight:600,cursor:'pointer'}}>Get Started Free</button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{textAlign:'center',padding:'80px 24px 60px'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:'8px',background:'rgba(124,58,237,.2)',border:'1px solid rgba(124,58,237,.3)',borderRadius:'20px',padding:'6px 16px',fontSize:'12px',color:'#A78BFA',marginBottom:'24px'}}>
          <Star style={{width:'12px',height:'12px'}} /> Powered by ancient wisdom · Modern insight
        </div>
        <h1 style={{fontFamily:'Georgia,serif',fontSize:'clamp(32px,5vw,56px)',fontWeight:700,lineHeight:1.1,marginBottom:'20px',
          background:'linear-gradient(135deg,#E2E8F0,#A78BFA)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
          Discover Your Cosmic Blueprint
        </h1>
        <p style={{fontSize:'16px',color:'rgba(255,255,255,.6)',maxWidth:'520px',margin:'0 auto 40px',lineHeight:1.6}}>
          Explore your birth chart, daily horoscope, and relationship compatibility with the stars as your guide.
        </p>
        <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={() => setSel(null)} style={{background:'linear-gradient(135deg,#7C3AED,#2563EB)',color:'white',border:'none',padding:'14px 28px',borderRadius:'12px',fontSize:'15px',fontWeight:600,cursor:'pointer'}}>
            ✨ Read My Horoscope
          </button>
          <a href="#compatibility" style={{background:'rgba(255,255,255,.08)',color:'white',border:'1px solid rgba(255,255,255,.2)',padding:'14px 28px',borderRadius:'12px',fontSize:'15px',fontWeight:500,cursor:'pointer',textDecoration:'none',display:'inline-block'}}>
            💑 Check Compatibility
          </a>
        </div>
      </div>

      {/* Sign picker */}
      <div id="horoscope" style={{maxWidth:'1100px',margin:'0 auto',padding:'0 24px 60px'}}>
        <h2 style={{fontFamily:'Georgia,serif',fontSize:'22px',fontWeight:600,marginBottom:'20px',textAlign:'center',color:'#E2E8F0'}}>
          Choose Your Sun Sign
        </h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(80px,1fr))',gap:'10px',marginBottom:'40px'}}>
          {SIGNS.map((s,i) => (
            <button key={s.en} onClick={() => setSel(i)}
              style={{padding:'14px 8px',borderRadius:'12px',border:sel===i?`2px solid ${s.color}`:'2px solid rgba(255,255,255,.1)',
                background:sel===i?`${s.color}22`:'rgba(255,255,255,.04)',cursor:'pointer',
                display:'flex',flexDirection:'column',alignItems:'center',gap:'6px',transition:'all .2s'}}>
              <span style={{fontSize:'26px'}}>{s.sym}</span>
              <span style={{fontSize:'10px',color:sel===i?s.color:'rgba(255,255,255,.6)',fontWeight:600}}>{s.en}</span>
            </button>
          ))}
        </div>

        {/* Selected sign card */}
        {sign && (
          <div style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'20px',padding:'32px',marginBottom:'40px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'20px',flexWrap:'wrap'}}>
              <div style={{width:'80px',height:'80px',borderRadius:'50%',
                background:`linear-gradient(135deg,${sign.color},${sign.color}88)`,
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:'40px',flexShrink:0}}>
                {sign.sym}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:'28px',fontFamily:'Georgia,serif',fontWeight:700,color:'#E2E8F0'}}>{sign.en}</div>
                <div style={{fontSize:'13px',color:'rgba(255,255,255,.5)',margin:'4px 0'}}>{sign.dates} · {sign.elem} · ♃ {sign.planet}</div>
                <div style={{display:'inline-block',background:ELEM_COLOR[sign.elem],color:ELEM_TEXT[sign.elem],borderRadius:'8px',padding:'3px 10px',fontSize:'12px',fontWeight:600,marginTop:'4px'}}>
                  {sign.trait}
                </div>
              </div>
            </div>
            <div style={{marginTop:'24px',padding:'20px',background:'rgba(255,255,255,.03)',borderRadius:'12px',borderLeft:`3px solid ${sign.color}`}}>
              <div style={{fontSize:'12px',color:'rgba(255,255,255,.5)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'8px'}}>Today's Guidance</div>
              <p style={{fontSize:'14px',color:'rgba(255,255,255,.8)',lineHeight:1.7,margin:0}}>
                The cosmic energies are supporting your growth today, {sign.en}. Focus on what truly matters and trust your instincts. This is a powerful time for self-reflection and meaningful connections with others who share your values.
              </p>
            </div>
          </div>
        )}

        {/* Compatibility */}
        <div id="compatibility" style={{marginTop:'60px'}}>
          <h2 style={{fontFamily:'Georgia,serif',fontSize:'22px',fontWeight:600,marginBottom:'8px',textAlign:'center',color:'#E2E8F0'}}>
            ❤️ Love Compatibility
          </h2>
          <p style={{textAlign:'center',color:'rgba(255,255,255,.5)',fontSize:'14px',marginBottom:'32px'}}>Find out how the stars align for you and your partner</p>
          
          <div style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'20px',padding:'32px',maxWidth:'600px',margin:'0 auto'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:'16px',alignItems:'center',marginBottom:'28px'}}>
              <div>
                <label style={{display:'block',fontSize:'11px',color:'rgba(255,255,255,.5)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'8px'}}>Your sign</label>
                <select value={p1} onChange={e=>setP1(+e.target.value)}
                  style={{width:'100%',padding:'10px 14px',borderRadius:'10px',border:'1px solid rgba(255,255,255,.15)',
                    background:'rgba(255,255,255,.08)',color:'white',fontSize:'14px',cursor:'pointer',appearance:'none'}}>
                  {SIGNS.map((s,i)=><option key={s.en} value={i} style={{background:'#1A0A2E'}}>{s.sym} {s.en}</option>)}
                </select>
              </div>
              <Heart style={{width:'24px',height:'24px',color:'#EC4899'}} />
              <div>
                <label style={{display:'block',fontSize:'11px',color:'rgba(255,255,255,.5)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'8px'}}>Partner's sign</label>
                <select value={p2} onChange={e=>setP2(+e.target.value)}
                  style={{width:'100%',padding:'10px 14px',borderRadius:'10px',border:'1px solid rgba(255,255,255,.15)',
                    background:'rgba(255,255,255,.08)',color:'white',fontSize:'14px',cursor:'pointer',appearance:'none'}}>
                  {SIGNS.map((s,i)=><option key={s.en} value={i} style={{background:'#1A0A2E'}}>{s.sym} {s.en}</option>)}
                </select>
              </div>
            </div>

            {/* Compat result */}
            <div style={{textAlign:'center'}}>
              <div style={{fontSize:'64px',fontFamily:'Georgia,serif',fontWeight:700,color:compat.color}}>{compat.score}%</div>
              <div style={{fontSize:'16px',fontWeight:600,color:'#E2E8F0',marginBottom:'12px'}}>{compat.label}</div>
              <div style={{height:'8px',background:'rgba(255,255,255,.1)',borderRadius:'4px',overflow:'hidden',marginBottom:'16px'}}>
                <div style={{height:'100%',width:`${compat.score}%`,background:`linear-gradient(90deg,${compat.color},${compat.color}88)`,borderRadius:'4px',transition:'width .6s'}} />
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'12px',marginTop:'20px'}}>
                {[{label:'Emotional',v:Math.round(compat.score*0.9+5)},{label:'Physical',v:Math.round(compat.score*1.1-5)},{label:'Intellectual',v:Math.round(compat.score*0.95+2)}].map(s=>(
                  <div key={s.label} style={{background:'rgba(255,255,255,.04)',borderRadius:'10px',padding:'12px'}}>
                    <div style={{fontSize:'11px',color:'rgba(255,255,255,.5)',marginBottom:'6px'}}>{s.label}</div>
                    <div style={{fontSize:'20px',fontWeight:700,color:compat.color}}>{Math.min(99,s.v)}%</div>
                  </div>
                ))}
              </div>
              <Link href="/match" style={{display:'inline-block',marginTop:'20px',background:'linear-gradient(135deg,#7C3AED,#2563EB)',color:'white',padding:'12px 24px',borderRadius:'10px',fontSize:'14px',fontWeight:600,textDecoration:'none'}}>
                Get Full Vedic Compatibility Report →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{borderTop:'1px solid rgba(255,255,255,.08)',padding:'32px 24px',textAlign:'center',color:'rgba(255,255,255,.3)',fontSize:'12px'}}>
        CosmicMatch by VedicHora · Powered by ancient Vedic wisdom · Privacy policy · Terms
      </div>
    </div>
  )
}
