'use client'
import { useState } from 'react'
import { calcNumerology } from '@/api'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'

const NUMS = [
  { key:'lifePathNumber',    label:'Life Path Number',   desc:'Your core life purpose & driving force',  large:true },
  { key:'destinyNumber',     label:'Destiny Number',     desc:'The path you must walk in this lifetime'             },
  { key:'soulUrgeNumber',    label:'Soul Urge Number',   desc:"Your heart's innermost desire"                       },
  { key:'personalityNumber', label:'Personality Number', desc:'How others perceive you'                             },
  { key:'nameNumber',        label:'Name Number',        desc:'Vibration of your full birth name'                   },
  { key:'maturityNumber',    label:'Maturity Number',    desc:'Emerges after age 35 — your ultimate self'           },
  { key:'birthdayNumber',    label:'Birthday Number',    desc:'Special gift you bring to the world'                 },
  { key:'personalYear',      label:`Personal Year ${new Date().getFullYear()}`, desc:'Your theme and focus for this year' },
]

const MEANINGS: Record<number,{short:string,long:string}> = {
  1:  { short:'Leader · Pioneer', long:'Independent, ambitious, and a natural leader. You forge your own path.' },
  2:  { short:'Diplomat · Peacemaker', long:'Cooperative, sensitive, and skilled at bringing harmony.' },
  3:  { short:'Creative · Expressive', long:'Gifted communicator and artist. Joy and optimism define you.' },
  4:  { short:'Builder · Organiser', long:'Disciplined, practical, and reliable. You build lasting foundations.' },
  5:  { short:'Freedom-lover · Adventurer', long:'Versatile, curious, and drawn to change and travel.' },
  6:  { short:'Nurturer · Caregiver', long:'Responsible, loving, and devoted to home and family.' },
  7:  { short:'Seeker · Mystic', long:'Analytical, spiritual, and drawn to deeper truths.' },
  8:  { short:'Achiever · Executive', long:'Ambitious, powerful, and financially successful.' },
  9:  { short:'Humanitarian · Visionary', long:'Compassionate, generous, and here to serve humanity.' },
  11: { short:'Master Intuitive', long:'Highly sensitive and spiritually aware. A natural channel and visionary.' },
  22: { short:'Master Builder', long:'Can turn the grandest dreams into reality through discipline.' },
  33: { short:'Master Teacher', long:'The most compassionate of all — a guide for spiritual enlightenment.' },
}

export default function NumerologyPage() {
  const [name, setName] = useState('')
  const [dob,  setDob]  = useState<DateValue>({ dd:0, mm:0, yyyy:0 })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleCalc = async () => {
    if (!name.trim()) { setErr('Enter your full birth name'); return }
    if (!dob.dd||!dob.mm||!dob.yyyy) { setErr('Select date of birth'); return }
    setLoading(true); setErr('')
    try {
      const res = await calcNumerology(name, dob.dd, dob.mm, dob.yyyy)
      setResult(res.data?.data ?? res.data)
    } catch { setErr('Calculation failed — please try again') }
    finally { setLoading(false) }
  }

  return (
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'24px 16px'}}>
      <div style={{marginBottom:'24px'}}>
        <h1 style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'26px',color:'var(--acc)'}}>
          Numerology
        </h1>
        <p style={{fontSize:'13px',color:'var(--txm)',marginTop:'4px'}}>
          Vedic numerology — life path, destiny, name, maturity, and more
        </p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1.4fr',gap:'20px',alignItems:'start'}}
        className="num-grid">

        {/* ── Form ── */}
        <div className="card">
          <div className="card-hd"><span className="card-title">Calculate Your Numbers</span></div>
          <div className="card-bd" style={{display:'flex',flexDirection:'column',gap:'16px'}}>
            <div>
              <label className="label">Full Name (as given at birth)</label>
              <input className="input" value={name}
                onChange={e=>setName(e.target.value)}
                placeholder="e.g. Venkataraman Krishnaswami"/>
            </div>
            <div>
              <label className="label">Date of Birth</label>
              <DatePicker value={dob} onChange={setDob} showTime={false} prefix="num"/>
            </div>
            {err && (
              <div style={{fontSize:'12px',color:'#DC2626',background:'rgba(220,38,38,.06)',
                padding:'8px 10px',borderRadius:'8px'}}>{err}</div>
            )}
            <button onClick={handleCalc} disabled={loading} className="btn-primary"
              style={{padding:'11px',fontFamily:'Cinzel,serif',fontSize:'14px'}}>
              {loading ? 'Calculating…' : 'Calculate →'}
            </button>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="card">
          <div className="card-hd"><span className="card-title">Your Numbers</span></div>
          <div className="card-bd">
            {result ? (
              <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

                {/* Life Path — hero card using theme var */}
                <div style={{background:'var(--acc)',borderRadius:'14px',
                  padding:'24px',textAlign:'center'}}>
                  <div style={{fontSize:'10px',color:'rgba(255,255,255,.6)',
                    textTransform:'uppercase',letterSpacing:'.1em',marginBottom:'6px'}}>
                    Life Path Number
                  </div>
                  <div style={{fontFamily:'Cinzel,serif',fontWeight:900,fontSize:'64px',
                    lineHeight:1,color:'var(--gold)',marginBottom:'6px'}}>
                    {result.lifePathNumber || '—'}
                  </div>
                  {result.lifePathNumber && MEANINGS[result.lifePathNumber] && (
                    <>
                      <div style={{fontSize:'13px',color:'rgba(255,255,255,.9)',
                        fontWeight:600,marginBottom:'4px'}}>
                        {MEANINGS[result.lifePathNumber].short}
                      </div>
                      <div style={{fontSize:'12px',color:'rgba(255,255,255,.6)',lineHeight:1.5}}>
                        {MEANINGS[result.lifePathNumber].long}
                      </div>
                    </>
                  )}
                </div>

                {/* Other numbers grid */}
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  {NUMS.slice(1).map(n => {
                    const val = result[n.key]
                    const meaning = val ? MEANINGS[val] : null
                    return (
                      <div key={n.key} style={{background:'var(--bg2)',borderRadius:'10px',
                        padding:'14px',border:'1px solid var(--bd)'}}>
                        <div style={{fontSize:'10px',color:'var(--txm)',fontWeight:700,
                          textTransform:'uppercase',letterSpacing:'.04em',marginBottom:'4px'}}>
                          {n.label}
                        </div>
                        <div style={{fontFamily:'Cinzel,serif',fontWeight:900,fontSize:'28px',
                          color:val?'var(--acc)':'var(--txm)',lineHeight:1,marginBottom:'3px'}}>
                          {val || '—'}
                        </div>
                        <div style={{fontSize:'11px',color:'var(--txm)',marginBottom:meaning?'3px':0}}>
                          {n.desc}
                        </div>
                        {meaning && (
                          <div style={{fontSize:'10px',color:'var(--gold)',
                            fontStyle:'italic',lineHeight:1.4}}>
                            {meaning.short}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

              </div>
            ) : (
              <div style={{display:'flex',flexDirection:'column',alignItems:'center',
                justifyContent:'center',padding:'48px 20px',textAlign:'center'}}>
                <div style={{fontSize:'48px',marginBottom:'12px'}}>🔢</div>
                <div style={{fontSize:'13px',color:'var(--txm)'}}>
                  Enter your name and date of birth to discover your numbers
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Number meanings guide */}
      {result && (
        <div className="card" style={{marginTop:'20px'}}>
          <div className="card-hd"><span className="card-title">What Your Numbers Mean</span></div>
          <div className="card-bd">
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px'}}
              className="meanings-grid">
              {Object.entries(MEANINGS).map(([num, m]) => {
                // Highlight the numbers that match the user's results
                const userNums = NUMS.map(n=>result[n.key]).filter(Boolean)
                const isUser = userNums.includes(Number(num))
                return (
                  <div key={num} style={{padding:'10px 12px',borderRadius:'8px',
                    border:`1.5px solid ${isUser?'var(--gold)':'var(--bd)'}`,
                    background:isUser?'rgba(196,146,42,.06)':'var(--bg2)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'3px'}}>
                      <span style={{fontFamily:'Cinzel,serif',fontWeight:900,fontSize:'18px',
                        color:isUser?'var(--gold)':'var(--txm)'}}>{num}</span>
                      <span style={{fontSize:'11px',fontWeight:700,
                        color:isUser?'var(--acc)':'var(--tx)'}}>{m.short}</span>
                    </div>
                    <div style={{fontSize:'11px',color:'var(--txm)',lineHeight:1.4}}>{m.long}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .num-grid { grid-template-columns: 1fr !important; }
          .meanings-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  )
}
