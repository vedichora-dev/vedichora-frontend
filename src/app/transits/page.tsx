'use client'
import { useState, useEffect, Suspense } from 'react'

// ── Transits page — free, no login needed ──────────────────────────────────
// Shows: daily/weekly/monthly/yearly predictions for any Moon sign (rasi)
// Active yogas, planet positions, Sade Sati status
// ──────────────────────────────────────────────────────────────────────────

const BASE = 'https://enchanting-dedication-production.up.railway.app'

const RASIS = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
]

const RASI_TAMIL: Record<string,string> = {
  Aries:'மேஷம்', Taurus:'ரிஷபம்', Gemini:'மிதுனம்', Cancer:'கடகம்',
  Leo:'சிம்மம்', Virgo:'கன்னி', Libra:'துலாம்', Scorpio:'விருச்சிகம்',
  Sagittarius:'தனுசு', Capricorn:'மகரம்', Aquarius:'கும்பம்', Pisces:'மீனம்'
}

const YOGA_COLOR: Record<string,string> = {
  benefic: '#052e16', malefic: '#450a0a', mixed: '#1c1917'
}
const YOGA_TEXT: Record<string,string> = {
  benefic: '#86efac', malefic: '#fca5a5', mixed: '#d6d3d1'
}
const CAT_COLOR: Record<string,string> = {
  POSITIVE:'#052e16', MILDLY_POSITIVE:'#052e16',
  NEUTRAL:'#0f172a', MILDLY_NEGATIVE:'#431407', CHALLENGING:'#450a0a'
}
const CAT_TEXT: Record<string,string> = {
  POSITIVE:'#86efac', MILDLY_POSITIVE:'#a7f3d0',
  NEUTRAL:'#94a3b8', MILDLY_NEGATIVE:'#fdba74', CHALLENGING:'#fca5a5'
}

interface GocharaResult {
  rasiName: string; rasiIndex: number; period: string
  overallCategory: string; overallScore: number
  headlineSummary: string; detailedNarrative: string
  activeYogas: Yoga[]; domainImpacts: DomainImpact[]
  sadeSati: SadeSati; keyTransits: any[]
  remedies: string[]; favorableDays: string[]
  luckyColor: string; luckyNumber: string
}

interface Yoga {
  name: string; type: string; description: string
  impactSummary: string; intensity: number; duration: string
  affectedDomains: string[]
}

interface DomainImpact {
  domain: string; direction: string; description: string; intensity: number
}

interface SadeSati {
  isActive: boolean; phase: number; phaseName: string
  description: string; intensity: number
}

export default function TransitsPage() {
  const [rasi,      setRasi]      = useState('Cancer')
  const [period,    setPeriod]    = useState<'daily'|'weekly'|'monthly'|'yearly'>('daily')
  const [year,      setYear]      = useState(new Date().getFullYear())
  const [data,      setData]      = useState<GocharaResult|null>(null)
  const [yogas,     setYogas]     = useState<Yoga[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [loading,   setLoading]   = useState(false)
  const [tab,       setTab]       = useState<'prediction'|'yogas'|'planets'>('prediction')

  // Load yogas and positions once (independent of rasi)
  useEffect(() => {
    fetch(`${BASE}/api/gochara/yogas/today`)
      .then(r => r.json())
      .then(j => {
        setYogas(j?.data?.yogas || [])
        setPositions(j?.data?.positions || [])
      })
      .catch(() => {})
  }, [])

  // Load prediction when rasi/period changes
  useEffect(() => {
    setLoading(true)
    const url = period === 'yearly'
      ? `${BASE}/api/gochara/yearly/${rasi}/${year}`
      : `${BASE}/api/gochara/${period}/${rasi}`
    fetch(url)
      .then(r => r.json())
      .then(j => { setData(j?.data || null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [rasi, period, year])

  const catBg   = data ? CAT_COLOR[data.overallCategory] ?? '#0f172a' : '#0f172a'
  const catText = data ? CAT_TEXT[data.overallCategory]  ?? '#94a3b8' : '#94a3b8'

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',padding:'0 0 40px'}}>

      {/* Header */}
      <div style={{background:'var(--bg2)',borderBottom:'1px solid var(--bd)',
        padding:'20px 24px',display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap'}}>
        <div>
          <h1 style={{fontSize:'22px',fontWeight:700,color:'var(--acc)',margin:0}}>
            🌍 Transit Predictions
          </h1>
          <div style={{fontSize:'12px',color:'var(--txm)',marginTop:'2px'}}>
            Gochara — daily planetary movements and their impact on your Moon sign
          </div>
        </div>

        {/* Rasi selector */}
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap',marginLeft:'auto',alignItems:'center'}}>
          <select value={rasi} onChange={e => setRasi(e.target.value)}
            style={{background:'var(--bg)',border:'1px solid var(--bd)',color:'var(--tx)',
              padding:'8px 12px',borderRadius:'8px',fontSize:'14px',fontFamily:'inherit'}}>
            {RASIS.map(r => (
              <option key={r} value={r}>{r} — {RASI_TAMIL[r]}</option>
            ))}
          </select>

          {/* Period tabs */}
          {(['daily','weekly','monthly','yearly'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{padding:'7px 14px',borderRadius:'8px',border:'1px solid var(--bd)',
                background:period===p?'#7c3aed':'transparent',
                color:period===p?'white':'var(--txm)',
                fontSize:'13px',cursor:'pointer',fontFamily:'inherit',fontWeight:period===p?600:400}}>
              {p.charAt(0).toUpperCase()+p.slice(1)}
            </button>
          ))}

          {period === 'yearly' && (
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              style={{background:'var(--bg)',border:'1px solid var(--bd)',color:'var(--tx)',
                padding:'8px 12px',borderRadius:'8px',fontSize:'14px',fontFamily:'inherit'}}>
              {[2024,2025,2026,2027,2028].map(y => <option key={y}>{y}</option>)}
            </select>
          )}
        </div>
      </div>

      <div style={{maxWidth:'1100px',margin:'0 auto',padding:'24px'}}>

        {/* Sade Sati alert */}
        {data?.sadeSati?.isActive && (
          <div style={{background:'#450a0a',border:'1px solid #7f1d1d',borderRadius:'10px',
            padding:'14px 18px',marginBottom:'20px',display:'flex',gap:'12px',alignItems:'center'}}>
            <span style={{fontSize:'24px'}}>⚠️</span>
            <div>
              <div style={{color:'#fca5a5',fontWeight:700,fontSize:'15px'}}>
                Sade Sati {data.sadeSati.phaseName} Active
              </div>
              <div style={{color:'#fca5a5',fontSize:'13px',opacity:0.85,marginTop:'3px'}}>
                {data.sadeSati.description}
              </div>
            </div>
          </div>
        )}

        {/* Overall score banner */}
        {data && (
          <div style={{background:catBg,border:`1px solid ${catText}44`,borderRadius:'12px',
            padding:'20px 24px',marginBottom:'20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap'}}>
              <div style={{flex:1}}>
                <div style={{color:catText,fontWeight:700,fontSize:'20px',marginBottom:'4px'}}>
                  {data.headlineSummary}
                </div>
                <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
                  <span style={{background:catText+'22',color:catText,padding:'3px 10px',
                    borderRadius:'20px',fontSize:'12px',fontWeight:700}}>
                    {data.overallCategory.replace('_',' ')}
                  </span>
                  <span style={{color:catText,fontSize:'13px',opacity:0.8}}>
                    Score: {data.overallScore.toFixed(3)}
                  </span>
                </div>
              </div>
              <div style={{textAlign:'right',color:catText}}>
                <div style={{fontSize:'13px',opacity:0.7}}>Lucky Color</div>
                <div style={{fontWeight:600}}>{data.luckyColor}</div>
                <div style={{fontSize:'13px',opacity:0.7,marginTop:'4px'}}>Lucky Number</div>
                <div style={{fontWeight:600}}>{data.luckyNumber}</div>
              </div>
            </div>
          </div>
        )}

        {/* Tab navigation */}
        <div style={{display:'flex',gap:'4px',marginBottom:'20px',
          borderBottom:'1px solid var(--bd)',paddingBottom:'0'}}>
          {(['prediction','yogas','planets'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{padding:'10px 18px',borderRadius:'8px 8px 0 0',
                border:'1px solid var(--bd)',borderBottom:tab===t?'1px solid var(--bg)':'none',
                background:tab===t?'var(--bg)':'transparent',
                color:tab===t?'var(--acc)':'var(--txm)',
                fontSize:'13px',cursor:'pointer',fontFamily:'inherit',
                fontWeight:tab===t?700:400,marginBottom:tab===t?'-1px':'0'}}>
              {t === 'prediction' ? '📅 Prediction' : t === 'yogas' ? '⚡ Active Yogas' : '🪐 Planets'}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{textAlign:'center',padding:'40px',color:'var(--txm)'}}>
            <div style={{fontSize:'32px',marginBottom:'8px'}}>🔮</div>
            Computing transit predictions...
          </div>
        )}

        {/* Prediction tab */}
        {!loading && tab === 'prediction' && data && (
          <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:'20px'}}>
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

              {/* Narrative */}
              <div style={{background:'var(--bg2)',borderRadius:'10px',padding:'18px',
                border:'1px solid var(--bd)'}}>
                <div style={{fontSize:'11px',fontWeight:700,color:'var(--txm)',
                  textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'10px'}}>
                  What This Means
                </div>
                <div style={{fontSize:'14px',color:'var(--tx)',lineHeight:1.7,
                  whiteSpace:'pre-line'}}>
                  {data.detailedNarrative}
                </div>
              </div>

              {/* Domain impacts */}
              {data.domainImpacts.length > 0 && (
                <div style={{background:'var(--bg2)',borderRadius:'10px',padding:'18px',
                  border:'1px solid var(--bd)'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'var(--txm)',
                    textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'12px'}}>
                    Life Areas Affected
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                    {data.domainImpacts.map((d,i) => (
                      <div key={i} style={{display:'flex',alignItems:'center',gap:'10px',
                        padding:'8px 12px',borderRadius:'8px',
                        background:d.direction==='positive'?'#052e16':'#450a0a',
                        border:`1px solid ${d.direction==='positive'?'#166534':'#7f1d1d'}`}}>
                        <span style={{fontSize:'14px'}}>
                          {d.direction==='positive'?'✓':'⚠'}
                        </span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:'13px',fontWeight:600,
                            color:d.direction==='positive'?'#86efac':'#fca5a5'}}>
                            {d.domain}
                          </div>
                          <div style={{fontSize:'11px',color:'var(--txm)',marginTop:'1px'}}>
                            {d.description}
                          </div>
                        </div>
                        <div style={{width:'50px',height:'4px',background:'var(--bd)',borderRadius:'2px',
                          overflow:'hidden',flexShrink:0}}>
                          <div style={{width:`${d.intensity*100}%`,height:'100%',
                            background:d.direction==='positive'?'#16a34a':'#dc2626'}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key transits */}
              {data.keyTransits?.length > 0 && (
                <div style={{background:'var(--bg2)',borderRadius:'10px',padding:'18px',
                  border:'1px solid var(--bd)'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'var(--txm)',
                    textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'12px'}}>
                    Upcoming Planet Movements
                  </div>
                  {data.keyTransits.map((t,i) => (
                    <div key={i} style={{display:'flex',gap:'12px',padding:'8px 0',
                      borderBottom:'1px solid var(--bd)',alignItems:'center'}}>
                      <span style={{background:'var(--bd)',padding:'3px 8px',
                        borderRadius:'4px',fontSize:'11px',fontWeight:700,
                        color:'var(--tx)',flexShrink:0}}>{t.planet}</span>
                      <div style={{flex:1}}>
                        <div style={{fontSize:'13px',color:'var(--tx)'}}>{t.event}</div>
                        <div style={{fontSize:'11px',color:'var(--txm)'}}>{t.impact}</div>
                      </div>
                      <div style={{fontSize:'11px',color:'#a78bfa',flexShrink:0}}>
                        {t.date ? new Date(t.date).toLocaleDateString('en-IN',{month:'short',day:'numeric'}) : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>

              {/* Remedies */}
              {data.remedies.length > 0 && (
                <div style={{background:'#1e1040',border:'1px solid #4c1d95',
                  borderRadius:'10px',padding:'16px'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#a78bfa',
                    textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'10px'}}>
                    🙏 Remedies
                  </div>
                  {data.remedies.map((r,i) => (
                    <div key={i} style={{fontSize:'12px',color:'#c4b5fd',lineHeight:1.5,
                      marginBottom:'8px',paddingLeft:'12px',borderLeft:'2px solid #7c3aed'}}>
                      {r}
                    </div>
                  ))}
                </div>
              )}

              {/* Favorable days */}
              <div style={{background:'var(--bg2)',border:'1px solid var(--bd)',
                borderRadius:'10px',padding:'16px'}}>
                <div style={{fontSize:'11px',fontWeight:700,color:'var(--txm)',
                  textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'8px'}}>
                  ✨ Favorable
                </div>
                {data.favorableDays.map((d,i) => (
                  <div key={i} style={{fontSize:'12px',color:'#86efac',marginBottom:'4px'}}>• {d}</div>
                ))}
              </div>

              {/* CTA */}
              <div style={{background:'linear-gradient(135deg,#7c3aed,#4f46e5)',
                borderRadius:'10px',padding:'18px',textAlign:'center'}}>
                <div style={{fontSize:'14px',fontWeight:700,color:'white',marginBottom:'6px'}}>
                  Want a personalised reading?
                </div>
                <div style={{fontSize:'12px',color:'rgba(255,255,255,0.8)',marginBottom:'14px'}}>
                  Get precise predictions based on your exact birth chart
                </div>
                <a href="/signup" style={{display:'inline-block',background:'white',
                  color:'#7c3aed',padding:'8px 20px',borderRadius:'8px',
                  fontSize:'13px',fontWeight:700,textDecoration:'none'}}>
                  Get My Chart →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Yogas tab */}
        {tab === 'yogas' && (
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            {yogas.length === 0 ? (
              <div style={{textAlign:'center',padding:'40px',color:'var(--txm)'}}>
                Loading yogas...
              </div>
            ) : yogas.map((y,i) => (
              <div key={i} style={{background:YOGA_COLOR[y.type] ?? 'var(--bg2)',
                border:`1px solid ${YOGA_TEXT[y.type] ?? '#94a3b8'}44`,
                borderRadius:'10px',padding:'16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
                  <span style={{fontWeight:700,fontSize:'15px',
                    color:YOGA_TEXT[y.type] ?? '#94a3b8'}}>
                    {y.name}
                  </span>
                  <span style={{padding:'2px 8px',borderRadius:'20px',fontSize:'11px',
                    background:`${YOGA_TEXT[y.type] ?? '#94a3b8'}22`,
                    color:YOGA_TEXT[y.type] ?? '#94a3b8',fontWeight:600}}>
                    {y.type}
                  </span>
                  <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'4px'}}>
                    <div style={{fontSize:'11px',color:'var(--txm)'}}>intensity</div>
                    <div style={{width:'60px',height:'4px',background:'var(--bd)',borderRadius:'2px'}}>
                      <div style={{width:`${y.intensity*100}%`,height:'100%',
                        background:YOGA_TEXT[y.type] ?? '#94a3b8',borderRadius:'2px'}}/>
                    </div>
                    <div style={{fontSize:'11px',color:YOGA_TEXT[y.type]??'#94a3b8'}}>
                      {(y.intensity*100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div style={{fontSize:'13px',color:'var(--tx)',marginBottom:'6px'}}>
                  {y.impactSummary}
                </div>
                <div style={{fontSize:'12px',color:'var(--txm)',lineHeight:1.6}}>
                  {y.description}
                </div>
                {y.affectedDomains?.length > 0 && (
                  <div style={{display:'flex',gap:'6px',marginTop:'10px',flexWrap:'wrap'}}>
                    {y.affectedDomains.map((d,j) => (
                      <span key={j} style={{background:'var(--bd)',color:'var(--txm)',
                        padding:'2px 8px',borderRadius:'4px',fontSize:'11px'}}>{d}</span>
                    ))}
                  </div>
                )}
                <div style={{fontSize:'11px',color:'var(--txm)',marginTop:'8px',
                  fontStyle:'italic'}}>⏱ {y.duration}</div>
              </div>
            ))}
          </div>
        )}

        {/* Planets tab */}
        {tab === 'planets' && (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'12px'}}>
            {positions.map((p,i) => (
              <div key={i} style={{background:'var(--bg2)',border:'1px solid var(--bd)',
                borderRadius:'10px',padding:'16px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                  <span style={{fontWeight:700,fontSize:'16px',color:'var(--acc)'}}>{p.planet}</span>
                  {p.isRetrograde && (
                    <span style={{background:'#431407',color:'#fdba74',padding:'2px 6px',
                      borderRadius:'4px',fontSize:'10px',fontWeight:700}}>R</span>
                  )}
                </div>
                <div style={{fontSize:'20px',fontWeight:700,color:'var(--tx)',marginBottom:'2px'}}>
                  {p.rasiName}
                </div>
                <div style={{fontSize:'12px',color:'var(--txm)'}}>
                  {p.degreeInRasi?.toFixed(1)}° • {p.nakshatraName}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
