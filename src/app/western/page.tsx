'use client'
import { useState } from 'react'
import Link from 'next/link'
import { MONTHS } from '@/lib/constants'

// Moon sign calculation (simplified — real system uses Swiss Eph)
// Moon changes sign every ~2.5 days — we approximate for prototype
const MOON_SIGNS = [
  { name:'Aries',       period:'Bold & pioneering',   elem:'Fire',  color:'#E53E3E', bg:'#FFF5F5', pred:'You are entering a period of bold new beginnings. Your natural confidence is at its peak — perfect for launching new ventures and taking initiative in relationships.' },
  { name:'Taurus',      period:'Steady & abundant',   elem:'Earth', color:'#38A169', bg:'#F0FFF4', pred:'Stability and sensory pleasure define your emotional world. Focus on building something lasting. Relationships deepen when grounded in shared values.' },
  { name:'Gemini',      period:'Curious & connected', elem:'Air',   color:'#3182CE', bg:'#EBF8FF', pred:'Your mind is exceptionally active. Communication flows naturally — this is an ideal time for networking, learning, and expressing your ideas to the world.' },
  { name:'Cancer',      period:'Nurturing & intuitive',elem:'Water', color:'#00B5D8', bg:'#E0F7FA', pred:'Your intuition is heightened and your emotional intelligence is your greatest strength. Home and family matters come to the fore with warmth.' },
  { name:'Leo',         period:'Creative & radiant',  elem:'Fire',  color:'#D97706', bg:'#FFFBEB', pred:'Your charisma shines brightly. Creativity and self-expression are favoured — step into leadership roles with confidence and let your authentic self be seen.' },
  { name:'Virgo',       period:'Precise & healing',   elem:'Earth', color:'#2F855A', bg:'#F0FFF4', pred:'Attention to detail and a desire to serve come naturally now. Health routines and organisation bring deep satisfaction. Trust your analytical mind.' },
  { name:'Libra',       period:'Harmonious & just',   elem:'Air',   color:'#D53F8C', bg:'#FFF0F7', pred:'Balance and beauty guide your choices. Partnerships — both romantic and professional — flourish when you lead with diplomacy and fairness.' },
  { name:'Scorpio',     period:'Deep & transforming', elem:'Water', color:'#744210', bg:'#FFFAF0', pred:'Profound emotional depth gives you extraordinary insight. This is a time for transformation — release what no longer serves and embrace the new.' },
  { name:'Sagittarius', period:'Free & philosophical',elem:'Fire',  color:'#B7791F', bg:'#FFFFF0', pred:'An expansive, optimistic energy carries you forward. Travel, philosophy and higher learning call to you. Your enthusiasm inspires everyone around you.' },
  { name:'Capricorn',   period:'Ambitious & wise',    elem:'Earth', color:'#2D3748', bg:'#EDF2F7', pred:'Discipline and long-term thinking are your superpowers. Career goals become clearer — steady effort now builds the foundation for lasting success.' },
  { name:'Aquarius',    period:'Innovative & free',   elem:'Air',   color:'#3B82F6', bg:'#EFF6FF', pred:'Original thinking and humanitarian ideals define your current energy. Collaboration with like-minded visionaries opens extraordinary new paths.' },
  { name:'Pisces',      period:'Dreamy & empathic',   elem:'Water', color:'#7C3AED', bg:'#F5F3FF', pred:'Your empathy and imagination are at their highest. Spiritual insight, artistic expression and deep compassion guide your decisions beautifully.' },
]

// Simple moon sign estimate from DOB (approximate — needs Swiss Eph for real accuracy)
function estimateMoonSign(dd: number, mm: number, yyyy: number): number {
  const dayOfYear = Math.floor((new Date(yyyy, mm-1, dd).getTime() - new Date(yyyy, 0, 0).getTime()) / 86400000)
  return Math.floor(((dayOfYear + yyyy * 12) % 360) / 30) % 12
}

const COMPAT_GRID: Record<string, { label: string; score: number; desc: string }> = {
  'Fire-Fire':   { label:'Blazing Together',      score:88, desc:'High energy, passionate and mutually inspiring. Occasional power struggles are worth the electricity.' },
  'Fire-Air':    { label:'Fan the Flames',         score:85, desc:'Air fuels Fire beautifully — stimulating conversation, shared adventures, and genuine mutual admiration.' },
  'Fire-Earth':  { label:'Grounded Sparks',        score:60, desc:'Earth steadies Fire — while growth is possible, patience is needed as your pace differs significantly.' },
  'Fire-Water':  { label:'Steam & Intensity',      score:65, desc:'Intense chemistry with emotional complexity. Deep connection forms when both learn to honour differences.' },
  'Earth-Earth': { label:'Built to Last',           score:92, desc:'Exceptional stability and shared values. You build together with patience, loyalty and quiet devotion.' },
  'Earth-Water': { label:'Fertile Ground',          score:87, desc:'Water nourishes Earth — a deeply supportive, emotionally rich partnership with natural understanding.' },
  'Earth-Air':   { label:'Different Rhythms',       score:58, desc:'Growth through contrast. Air brings ideas, Earth brings follow-through — patience bridges the gap well.' },
  'Earth-Fire':  { label:'Grounded Sparks',        score:60, desc:'Earth steadies Fire — potential is real but patience is needed as life rhythms differ.' },
  'Air-Air':     { label:'Meeting of Minds',        score:86, desc:'Brilliant intellectual connection. Communication, humour and shared curiosity keep this lively and fresh.' },
  'Air-Water':   { label:'Dream & Think',           score:70, desc:'Head meets heart — complementary but requires conscious effort to bridge logic and emotion daily.' },
  'Air-Fire':    { label:'Fan the Flames',         score:85, desc:'Stimulating and dynamic — ideas inspire action and adventure is always on the horizon together.' },
  'Air-Earth':   { label:'Different Rhythms',       score:58, desc:'Bring patience — Air sees possibility while Earth seeks proof. Together you complement beautifully.' },
  'Water-Water': { label:'Oceanic Bond',            score:90, desc:'Extraordinary emotional depth and intuitive understanding. A profoundly healing and supportive bond.' },
  'Water-Fire':  { label:'Steam & Intensity',      score:65, desc:'Magnetic and complex — emotional Water and passionate Fire create intense chemistry with depth.' },
  'Water-Earth': { label:'Fertile Ground',          score:87, desc:'Deep mutual nourishment — Earth provides security while Water brings emotional richness.' },
  'Water-Air':   { label:'Dream & Think',           score:70, desc:'Complementary opposites — feeling meets intellect with care and communication as the bridge.' },
}

function getCompat(a: number, b: number) {
  const ea = MOON_SIGNS[a].elem, eb = MOON_SIGNS[b].elem
  const key = `${ea}-${eb}`
  return COMPAT_GRID[key] || { label:'Unique Connection', score:72, desc:'Your combination is rare and interesting — growth happens through genuine curiosity about each other.' }
}

type Tab = 'horoscope' | 'compatibility' | 'chart'

export default function WesternPage() {
  const [tab, setTab] = useState<Tab>('horoscope')
  // Horoscope tab
  const [dob, setDob] = useState({ dd:0, mm:0, yyyy:0 })
  const [moonIdx, setMoonIdx] = useState<number|null>(null)
  // Compatibility tab
  const [d1, setD1] = useState({ dd:0, mm:0, yyyy:0 })
  const [d2, setD2] = useState({ dd:0, mm:0, yyyy:0 })
  const [m1, setM1] = useState<number|null>(null)
  const [m2, setM2] = useState<number|null>(null)

  const days  = Array.from({length:31},(_,i)=>i+1)
  const years = Array.from({length:100},(_,i)=>new Date().getFullYear()-i)

  const handleGetSign = () => {
    if (!dob.dd || !dob.mm || !dob.yyyy) return
    setMoonIdx(estimateMoonSign(dob.dd, dob.mm, dob.yyyy))
  }

  const handleCompat = () => {
    if (!d1.dd || !d1.mm || !d1.yyyy || !d2.dd || !d2.mm || !d2.yyyy) return
    setM1(estimateMoonSign(d1.dd, d1.mm, d1.yyyy))
    setM2(estimateMoonSign(d2.dd, d2.mm, d2.yyyy))
  }

  const moon = moonIdx !== null ? MOON_SIGNS[moonIdx] : null
  const compat = m1 !== null && m2 !== null ? getCompat(m1, m2) : null
  const ms1 = m1 !== null ? MOON_SIGNS[m1] : null
  const ms2 = m2 !== null ? MOON_SIGNS[m2] : null

  return (
    <div style={{minHeight:'100vh',background:'#0D0D14',color:'#F0EBE3',fontFamily:"'Inter',system-ui,sans-serif"}}>

      {/* ── TOP NAV — CosmicMatch only, no Vedic nav ── */}
      <nav style={{position:'sticky',top:0,zIndex:100,height:'60px',
        background:'rgba(13,13,20,.92)',backdropFilter:'blur(12px)',
        borderBottom:'1px solid rgba(212,165,43,.15)',
        display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px'}}>

        {/* Logo */}
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'36px',height:'36px',borderRadius:'10px',
            background:'linear-gradient(135deg,#D4A52B,#A07820)',
            display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px'}}>✦</div>
          <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:'19px',
            color:'#E8C97A',letterSpacing:'.01em'}}>CosmicMatch</span>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:'4px',background:'rgba(255,255,255,.06)',borderRadius:'10px',padding:'3px'}}>
          {([['horoscope','🌙 Horoscope'],['compatibility','♥ Compatibility'],['chart','✦ Birth Chart']] as [Tab,string][]).map(([t,lbl])=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:'7px 18px',borderRadius:'7px',fontSize:'13px',fontWeight:600,border:'none',cursor:'pointer',
              background:tab===t?'linear-gradient(135deg,#D4A52B,#A07820)':'transparent',
              color:tab===t?'#0D0D14':'rgba(240,235,227,.6)',transition:'all .2s'}}>
              {lbl}
            </button>
          ))}
        </div>

        {/* Switch */}
        <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
          <span style={{fontSize:'12px',color:'rgba(240,235,227,.4)'}}>Discover your moon energy</span>
          <Link href="/" style={{fontSize:'12px',color:'#D4A52B',textDecoration:'none',
            border:'1px solid rgba(212,165,43,.3)',borderRadius:'6px',padding:'5px 12px'}}>
            🪔 Vedic Mode
          </Link>
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div style={{maxWidth:'900px',margin:'0 auto',padding:'48px 24px'}}>

        {/* ════ HOROSCOPE TAB ════ */}
        {tab === 'horoscope' && (
          <div>
            {/* Hero */}
            <div style={{textAlign:'center',marginBottom:'52px'}}>
              <div style={{fontSize:'13px',color:'#D4A52B',fontWeight:600,letterSpacing:'.12em',
                textTransform:'uppercase',marginBottom:'16px'}}>🌙 Moon Sign Reading</div>
              <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(32px,5vw,52px)',
                fontWeight:700,lineHeight:1.1,marginBottom:'16px',
                background:'linear-gradient(135deg,#F0EBE3 20%,#D4A52B)',
                WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>
                Your Moon Sign Reveals<br/>Your Emotional Truth
              </h1>
              <p style={{fontSize:'16px',color:'rgba(240,235,227,.55)',maxWidth:'480px',margin:'0 auto',lineHeight:1.7}}>
                Unlike the Sun, your Moon sign reflects how you truly feel — your instincts, emotional needs, and inner world.
              </p>
            </div>

            {/* DOB form */}
            {moonIdx === null ? (
              <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(212,165,43,.2)',
                borderRadius:'20px',padding:'40px',maxWidth:'480px',margin:'0 auto'}}>
                <div style={{fontSize:'15px',fontWeight:600,color:'#E8C97A',marginBottom:'24px',textAlign:'center',
                  fontFamily:"'Playfair Display',Georgia,serif"}}>
                  Enter your date of birth
                </div>
                <div style={{display:'flex',gap:'10px',marginBottom:'24px',justifyContent:'center',flexWrap:'wrap'}}>
                  {/* Day */}
                  <div>
                    <div style={{fontSize:'10px',color:'rgba(240,235,227,.4)',fontWeight:700,
                      textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'6px'}}>Day</div>
                    <select value={dob.dd||''} onChange={e=>setDob(d=>({...d,dd:+e.target.value}))}
                      style={{width:'72px',padding:'10px',borderRadius:'10px',
                        border:'1px solid rgba(212,165,43,.25)',background:'rgba(255,255,255,.06)',
                        color:'#F0EBE3',fontSize:'14px',cursor:'pointer',appearance:'none',textAlign:'center'}}>
                      <option value="">Day</option>
                      {days.map(d=><option key={d} value={d} style={{background:'#1A1A2A'}}>{d}</option>)}
                    </select>
                  </div>
                  {/* Month */}
                  <div>
                    <div style={{fontSize:'10px',color:'rgba(240,235,227,.4)',fontWeight:700,
                      textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'6px'}}>Month</div>
                    <select value={dob.mm||''} onChange={e=>setDob(d=>({...d,mm:+e.target.value}))}
                      style={{width:'128px',padding:'10px',borderRadius:'10px',
                        border:'1px solid rgba(212,165,43,.25)',background:'rgba(255,255,255,.06)',
                        color:'#F0EBE3',fontSize:'14px',cursor:'pointer',appearance:'none'}}>
                      <option value="">Month</option>
                      {MONTHS.map((m,i)=><option key={m} value={i+1} style={{background:'#1A1A2A'}}>{m}</option>)}
                    </select>
                  </div>
                  {/* Year */}
                  <div>
                    <div style={{fontSize:'10px',color:'rgba(240,235,227,.4)',fontWeight:700,
                      textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'6px'}}>Year</div>
                    <select value={dob.yyyy||''} onChange={e=>setDob(d=>({...d,yyyy:+e.target.value}))}
                      style={{width:'94px',padding:'10px',borderRadius:'10px',
                        border:'1px solid rgba(212,165,43,.25)',background:'rgba(255,255,255,.06)',
                        color:'#F0EBE3',fontSize:'14px',cursor:'pointer',appearance:'none'}}>
                      <option value="">Year</option>
                      {years.map(y=><option key={y} value={y} style={{background:'#1A1A2A'}}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <button onClick={handleGetSign} disabled={!dob.dd||!dob.mm||!dob.yyyy}
                  style={{width:'100%',padding:'14px',borderRadius:'12px',border:'none',cursor:'pointer',
                    background:'linear-gradient(135deg,#D4A52B,#A07820)',color:'#0D0D14',
                    fontSize:'15px',fontWeight:700,fontFamily:"'Playfair Display',Georgia,serif",
                    opacity:(!dob.dd||!dob.mm||!dob.yyyy)?0.5:1,transition:'opacity .15s'}}>
                  Reveal My Moon Sign ✦
                </button>
              </div>
            ) : moon && (
              <div>
                {/* Moon sign card */}
                <div style={{background:`linear-gradient(135deg,${moon.color}18,${moon.color}08)`,
                  border:`1px solid ${moon.color}40`,borderRadius:'24px',padding:'40px',
                  marginBottom:'28px',textAlign:'center'}}>
                  <div style={{fontSize:'72px',marginBottom:'16px',filter:'drop-shadow(0 0 20px '+moon.color+'60)'}}>🌙</div>
                  <div style={{fontSize:'13px',color:moon.color,fontWeight:700,
                    textTransform:'uppercase',letterSpacing:'.1em',marginBottom:'8px'}}>Your Moon Sign</div>
                  <h2 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'42px',fontWeight:700,
                    color:'#F0EBE3',marginBottom:'8px'}}>{moon.name}</h2>
                  <div style={{display:'inline-block',background:`${moon.color}20`,color:moon.color,
                    borderRadius:'20px',padding:'4px 16px',fontSize:'13px',fontWeight:600,marginBottom:'24px'}}>
                    {moon.elem} · {moon.period}
                  </div>
                  <div style={{background:'rgba(255,255,255,.04)',borderRadius:'14px',padding:'20px 24px',
                    borderLeft:`3px solid ${moon.color}`,textAlign:'left'}}>
                    <p style={{fontSize:'15px',lineHeight:1.8,color:'rgba(240,235,227,.85)',margin:0}}>
                      {moon.pred}
                    </p>
                  </div>
                </div>

                {/* Domain forecasts */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:'16px',marginBottom:'32px'}}>
                  {[
                    {label:'Love & Relationships',score:moonIdx%3===0?88:moonIdx%3===1?72:81,icon:'♥'},
                    {label:'Career & Purpose',   score:moonIdx%4===0?76:moonIdx%4===1?85:moonIdx%4===2?68:79,icon:'✦'},
                    {label:'Health & Vitality',  score:moonIdx%5===0?82:moonIdx%5===1?71:moonIdx%5===2?90:moonIdx%5===3?65:77,icon:'☽'},
                    {label:'Abundance & Finance', score:moonIdx%3===2?88:moonIdx%3===0?74:82,icon:'◈'},
                  ].map(d=>{
                    const pct = d.score
                    const c = pct>=80?'#22C55E':pct>=65?'#D4A52B':'#EF4444'
                    return (
                      <div key={d.label} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.08)',borderRadius:'14px',padding:'20px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'10px'}}>
                          <span style={{fontSize:'12px',color:'rgba(240,235,227,.6)'}}>{d.icon} {d.label}</span>
                          <span style={{fontSize:'18px',fontWeight:700,color:c}}>{pct}</span>
                        </div>
                        <div style={{height:'5px',background:'rgba(255,255,255,.08)',borderRadius:'3px',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${pct}%`,background:`linear-gradient(90deg,${c}88,${c})`,borderRadius:'3px',transition:'width .8s'}} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* CTA */}
                <div style={{textAlign:'center',background:'linear-gradient(135deg,rgba(212,165,43,.12),rgba(160,120,32,.08))',
                  border:'1px solid rgba(212,165,43,.2)',borderRadius:'20px',padding:'36px'}}>
                  <div style={{fontSize:'22px',fontFamily:"'Playfair Display',Georgia,serif",color:'#E8C97A',marginBottom:'10px'}}>
                    Get Your Complete Moon Reading
                  </div>
                  <p style={{fontSize:'14px',color:'rgba(240,235,227,.5)',marginBottom:'24px'}}>
                    Full natal chart · Relationship compatibility · Year ahead forecast · Personalised remedies
                  </p>
                  <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
                    <Link href="/chart" style={{background:'linear-gradient(135deg,#D4A52B,#A07820)',color:'#0D0D14',
                      padding:'12px 24px',borderRadius:'10px',fontSize:'14px',fontWeight:700,textDecoration:'none'}}>
                      ✦ Generate Full Chart — Free
                    </Link>
                    <button onClick={()=>setMoonIdx(null)} style={{background:'transparent',color:'rgba(240,235,227,.5)',
                      border:'1px solid rgba(255,255,255,.15)',padding:'12px 20px',borderRadius:'10px',fontSize:'14px',cursor:'pointer'}}>
                      Try another date
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ COMPATIBILITY TAB ════ */}
        {tab === 'compatibility' && (
          <div>
            <div style={{textAlign:'center',marginBottom:'48px'}}>
              <div style={{fontSize:'13px',color:'#D4A52B',fontWeight:700,letterSpacing:'.1em',
                textTransform:'uppercase',marginBottom:'14px'}}>♥ Moon Sign Compatibility</div>
              <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(28px,4vw,44px)',
                fontWeight:700,color:'#F0EBE3',lineHeight:1.2,marginBottom:'14px'}}>
                Are You Truly Compatible?
              </h1>
              <p style={{fontSize:'15px',color:'rgba(240,235,227,.5)',maxWidth:'440px',margin:'0 auto',lineHeight:1.7}}>
                Moon sign compatibility reveals the emotional connection between two people — the real foundation of lasting love.
              </p>
            </div>

            <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(212,165,43,.15)',
              borderRadius:'24px',padding:'36px',maxWidth:'640px',margin:'0 auto'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 40px 1fr',gap:'16px',alignItems:'end',marginBottom:'28px'}}>
                {/* Person 1 */}
                <div>
                  <div style={{fontSize:'12px',color:'#D4A52B',fontWeight:700,textTransform:'uppercase',
                    letterSpacing:'.08em',marginBottom:'12px'}}>♥ Person 1</div>
                  {(['dd','mm','yyyy'] as const).map(f=>(
                    <div key={f} style={{marginBottom:'8px'}}>
                      <select value={d1[f]||''} onChange={e=>setD1(d=>({...d,[f]:+e.target.value}))}
                        style={{width:'100%',padding:'10px 12px',borderRadius:'10px',
                          border:'1px solid rgba(212,165,43,.2)',background:'rgba(255,255,255,.06)',
                          color:'#F0EBE3',fontSize:'13px',cursor:'pointer',appearance:'none'}}>
                        <option value="" style={{background:'#1A1A2A'}}>{f==='dd'?'Day':f==='mm'?'Month':'Year'}</option>
                        {f==='dd'&&Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d} style={{background:'#1A1A2A'}}>{d}</option>)}
                        {f==='mm'&&MONTHS.map((m,i)=><option key={m} value={i+1} style={{background:'#1A1A2A'}}>{m}</option>)}
                        {f==='yyyy'&&Array.from({length:80},(_,i)=>new Date().getFullYear()-i).map(y=><option key={y} value={y} style={{background:'#1A1A2A'}}>{y}</option>)}
                      </select>
                    </div>
                  ))}
                </div>

                <div style={{textAlign:'center',paddingBottom:'16px',fontSize:'20px',color:'#EF4444'}}>♥</div>

                {/* Person 2 */}
                <div>
                  <div style={{fontSize:'12px',color:'#D4A52B',fontWeight:700,textTransform:'uppercase',
                    letterSpacing:'.08em',marginBottom:'12px'}}>♥ Person 2</div>
                  {(['dd','mm','yyyy'] as const).map(f=>(
                    <div key={f} style={{marginBottom:'8px'}}>
                      <select value={d2[f]||''} onChange={e=>setD2(d=>({...d,[f]:+e.target.value}))}
                        style={{width:'100%',padding:'10px 12px',borderRadius:'10px',
                          border:'1px solid rgba(212,165,43,.2)',background:'rgba(255,255,255,.06)',
                          color:'#F0EBE3',fontSize:'13px',cursor:'pointer',appearance:'none'}}>
                        <option value="" style={{background:'#1A1A2A'}}>{f==='dd'?'Day':f==='mm'?'Month':'Year'}</option>
                        {f==='dd'&&Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d} style={{background:'#1A1A2A'}}>{d}</option>)}
                        {f==='mm'&&MONTHS.map((m,i)=><option key={m} value={i+1} style={{background:'#1A1A2A'}}>{m}</option>)}
                        {f==='yyyy'&&Array.from({length:80},(_,i)=>new Date().getFullYear()-i).map(y=><option key={y} value={y} style={{background:'#1A1A2A'}}>{y}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={handleCompat} disabled={!d1.dd||!d1.mm||!d1.yyyy||!d2.dd||!d2.mm||!d2.yyyy}
                style={{width:'100%',padding:'14px',borderRadius:'12px',border:'none',
                  background:'linear-gradient(135deg,#D4A52B,#A07820)',color:'#0D0D14',
                  fontSize:'15px',fontWeight:700,cursor:'pointer',
                  fontFamily:"'Playfair Display',Georgia,serif",
                  opacity:(!d1.dd||!d1.mm||!d1.yyyy||!d2.dd||!d2.mm||!d2.yyyy)?0.4:1}}>
                Reveal Compatibility ✦
              </button>
            </div>

            {/* Compat result */}
            {compat && ms1 && ms2 && (
              <div style={{marginTop:'32px',background:'rgba(255,255,255,.04)',border:'1px solid rgba(212,165,43,.15)',borderRadius:'24px',padding:'36px'}}>
                {/* Signs */}
                <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:'24px',alignItems:'center',marginBottom:'32px'}}>
                  {[ms1,ms2].map((ms,i)=>(
                    <div key={i} style={{textAlign:'center',padding:'24px',borderRadius:'16px',
                      background:`${ms.color}12`,border:`1px solid ${ms.color}30`}}>
                      <div style={{fontSize:'40px',marginBottom:'10px'}}>🌙</div>
                      <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'22px',fontWeight:700,color:'#F0EBE3'}}>{ms.name}</div>
                      <div style={{fontSize:'11px',color:ms.color,fontWeight:600,marginTop:'4px'}}>{ms.elem} · {ms.period}</div>
                    </div>
                  ))}
                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'48px',fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,
                      color:compat.score>=80?'#22C55E':compat.score>=65?'#D4A52B':'#EF4444'}}>
                      {compat.score}%
                    </div>
                    <div style={{fontSize:'14px',fontWeight:600,color:'#E8C97A',marginTop:'4px'}}>{compat.label}</div>
                    {/* Gauge */}
                    <div style={{height:'8px',background:'rgba(255,255,255,.1)',borderRadius:'4px',margin:'12px 0',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${compat.score}%`,borderRadius:'4px',transition:'width .8s',
                        background:`linear-gradient(90deg,${compat.score>=80?'#22C55E':compat.score>=65?'#D4A52B':'#EF4444'}88,${compat.score>=80?'#22C55E':compat.score>=65?'#D4A52B':'#EF4444'})`}} />
                    </div>
                  </div>
                </div>

                <div style={{background:'rgba(255,255,255,.03)',borderRadius:'14px',padding:'20px 24px',
                  borderLeft:'3px solid #D4A52B',marginBottom:'24px'}}>
                  <p style={{fontSize:'15px',lineHeight:1.8,color:'rgba(240,235,227,.8)',margin:0}}>{compat.desc}</p>
                </div>

                <div style={{textAlign:'center'}}>
                  <Link href="/match" style={{display:'inline-block',background:'linear-gradient(135deg,#D4A52B,#A07820)',
                    color:'#0D0D14',padding:'12px 28px',borderRadius:'10px',fontSize:'14px',fontWeight:700,textDecoration:'none'}}>
                    ✦ Get Full Vedic Compatibility Report
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ BIRTH CHART TAB ════ */}
        {tab === 'chart' && (
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:'13px',color:'#D4A52B',fontWeight:700,letterSpacing:'.1em',
              textTransform:'uppercase',marginBottom:'14px'}}>✦ Birth Chart</div>
            <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(28px,4vw,44px)',
              fontWeight:700,color:'#F0EBE3',lineHeight:1.2,marginBottom:'14px'}}>
              Your Complete Cosmic Map
            </h1>
            <p style={{fontSize:'15px',color:'rgba(240,235,227,.5)',maxWidth:'440px',margin:'0 auto 40px',lineHeight:1.7}}>
              A birth chart reveals the position of all planets at your moment of birth — the most accurate guide to your personality, purpose, and potential.
            </p>
            <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
              <Link href="/chart" style={{background:'linear-gradient(135deg,#D4A52B,#A07820)',
                color:'#0D0D14',padding:'14px 28px',borderRadius:'12px',fontSize:'15px',fontWeight:700,textDecoration:'none',
                fontFamily:"'Playfair Display',Georgia,serif"}}>
                ✦ Generate My Chart — Free
              </Link>
              <Link href="/signin" style={{background:'rgba(255,255,255,.08)',color:'rgba(240,235,227,.8)',
                border:'1px solid rgba(255,255,255,.15)',padding:'14px 24px',borderRadius:'12px',fontSize:'15px',textDecoration:'none'}}>
                Sign in to save charts
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
