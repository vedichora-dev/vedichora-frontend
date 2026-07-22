'use client'
import { useState, useEffect } from 'react'

const BASE = 'https://enchanting-dedication-production.up.railway.app'

const CAT_STYLE: Record<string, {bg:string,color:string,border:string}> = {
  CATASTROPHIC: {bg:'#450a0a', color:'#fca5a5', border:'#7f1d1d'},
  DIFFICULT:    {bg:'#431407', color:'#fdba74', border:'#9a3412'},
  CHALLENGING:  {bg:'#422006', color:'#fde68a', border:'#92400e'},
  NEUTRAL:      {bg:'#0f172a', color:'#94a3b8', border:'#1e293b'},
  POSITIVE:     {bg:'#052e16', color:'#86efac', border:'#166534'},
  EXCEPTIONAL:  {bg:'#022c22', color:'#6ee7b7', border:'#065f46'},
}
const DOT: Record<string,string> = {
  CATASTROPHIC:'#dc2626', DIFFICULT:'#ea580c', CHALLENGING:'#ca8a04',
  NEUTRAL:'#475569', POSITIVE:'#16a34a', EXCEPTIONAL:'#059669',
}
const ALL_CATS = ['CATASTROPHIC','DIFFICULT','CHALLENGING','NEUTRAL','POSITIVE','EXCEPTIONAL']

// Domain labels
const DOMAIN_LABEL: Record<string,string> = {
  Career:'💼 Career', Health:'❤️ Health', Wealth:'💰 Wealth',
  Marriage:'💍 Marriage', Family:'👨‍👩‍👧 Family', Spirituality:'🕉️ Spirituality',
  Enemies:'⚔️ Enemies / Obstacles', Travel:'✈️ Travel', Education:'📚 Education',
  Children:'👶 Children',
}

interface Period {
  period: string; startYear: number; endYear: number
  e4: {
    category: string; score: number
    trace?: {
      dashaScore: number; gocharaScore: number; domainScore: number
      primaryDomain?: string; thriving?: string[]; challenged?: string[]
    }
    domainScores?: Record<string,number>
    layerTrace?: string[]
    yogas?: string[]
  }
  knownEvent?: string; knownExpected?: string
}

interface MarkedEvent { category: string; description: string; engineScore: number }

export default function LifePredictionsTab({ horoId, isAdmin }: { horoId: string; isAdmin: boolean }) {
  const [periods,  setPeriods]  = useState<Period[]>([])
  const [yogas,    setYogas]    = useState<string[]>([])
  const [atma,     setAtma]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [filter,   setFilter]   = useState('all')
  const [expanded, setExpanded] = useState<string|null>(null)

  const storageKey = `vh_events_${horoId}`
  const [marked, setMarked] = useState<Record<string,MarkedEvent>>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(storageKey)||'{}') } catch { return {} }
  })
  const [markCat,    setMarkCat]    = useState('CATASTROPHIC')
  const [markDesc,   setMarkDesc]   = useState('')
  const [markPeriod, setMarkPeriod] = useState('')

  useEffect(() => {
    if (!horoId) return
    setLoading(true); setError('')
    fetch(`${BASE}/api/chart/${horoId}/compare-engines`)
      .then(r => r.json())
      .then(j => {
        setPeriods(j?.data?.periods || [])
        setYogas(j?.data?.yogas || [])
        setAtma(j?.data?.atmakaraka || '')
        setLoading(false)
      })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [horoId])

  const saveMarked = (next: Record<string,MarkedEvent>) => {
    setMarked(next); localStorage.setItem(storageKey, JSON.stringify(next))
  }
  const markEvent = (period: string, score: number) => {
    if (!markDesc.trim()) return
    saveMarked({ ...marked, [period]: { category: markCat, description: markDesc.trim(), engineScore: score } })
    setMarkDesc(''); setMarkPeriod('')
  }
  const clearEvent = (period: string) => {
    const n = { ...marked }; delete n[period]; saveMarked(n)
  }
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ horoId, marked, exportedAt: new Date().toISOString() }, null, 2)])
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `vh-events-${horoId}.json`; a.click()
  }

  if (loading) return <div style={{padding:'40px',textAlign:'center',color:'var(--txm)'}}>🔮 Loading life predictions...</div>
  if (error)   return <div style={{padding:'16px',background:'#450a0a',borderRadius:'8px',color:'#fca5a5',fontSize:'13px'}}>❌ {error}</div>
  if (!periods.length) return <div style={{padding:'24px',color:'var(--txm)',textAlign:'center'}}>No prediction data.</div>

  const counts: Record<string,number> = {}
  periods.forEach(p => { counts[p.e4.category] = (counts[p.e4.category]||0)+1 })
  const visible = filter === 'all' ? periods : periods.filter(p => p.e4.category === filter)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

      {/* ── Yogas banner ── */}
      {yogas.length > 0 && (
        <div style={{background:'var(--bg2)',borderRadius:'10px',padding:'12px 14px',border:'1px solid var(--bd)'}}>
          <div style={{fontSize:'10px',fontWeight:700,color:'var(--txm)',textTransform:'uppercase',
            letterSpacing:'.08em',marginBottom:'6px'}}>
            {atma && `Atmakaraka: ${atma} · `}Active Yogas
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
            {yogas.map((y,i) => (
              <span key={i} style={{background:'#1e1040',color:'#c4b5fd',border:'1px solid #4c1d95',
                padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:500}}>{y}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Filter pills ── */}
      <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}}>
        <button onClick={()=>setFilter('all')}
          style={{padding:'4px 12px',borderRadius:'20px',border:'1px solid var(--bd)',
            background:filter==='all'?'#1e1040':'transparent',
            color:filter==='all'?'#c4b5fd':'var(--txm)',
            fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
          All {periods.length}
        </button>
        {ALL_CATS.filter(c=>counts[c]).map(c => {
          const s = CAT_STYLE[c]
          return (
            <button key={c} onClick={()=>setFilter(filter===c?'all':c)}
              style={{padding:'4px 12px',borderRadius:'20px',border:`1px solid ${s.border}`,
                background:filter===c?s.bg:'transparent',color:s.color,
                fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
              {counts[c]} {c}
            </button>
          )
        })}
        {isAdmin && Object.keys(marked).length > 0 && (
          <button onClick={exportJSON}
            style={{marginLeft:'auto',padding:'4px 12px',borderRadius:'20px',
              border:'1px solid #166534',background:'#052e16',color:'#86efac',
              fontSize:'11px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
            ⬇ Export {Object.keys(marked).length} events
          </button>
        )}
      </div>

      {/* ── Period cards ── */}
      {visible.map(p => {
        const s      = CAT_STYLE[p.e4.category] || CAT_STYLE.NEUTRAL
        const score  = p.e4.score || 0
        const trace  = p.e4.trace
        const pct    = Math.min(100, Math.max(0, ((score + 1) / 2) * 100))
        const isOpen = expanded === p.period
        const evt    = marked[p.period]
        const isKnown = !!p.knownEvent

        // Domains — activation strength per life area
        // Domain score = HOW STRONGLY this life area is activated, not whether it's good/bad
        // The overall period category tells us whether the activation is positive or negative
        const thriving   = trace?.thriving   || []
        const challenged = trace?.challenged  || []
        const domainScores = p.e4.domainScores || {}
        const isNegativePeriod = ['CATASTROPHIC','DIFFICULT','CHALLENGING'].includes(p.e4.category)
        const isPositivePeriod = ['POSITIVE','EXCEPTIONAL'].includes(p.e4.category)
        // Build domain list with correct direction
        const topDomains = Object.entries(domainScores)
          .filter(([,v]) => Math.abs(v) > 0.1)
          .sort((a,b) => Math.abs(b[1]) - Math.abs(a[1]))
          .slice(0,5)
          .map(([domain, val]) => {
            // If backend provides thriving/challenged lists, use them
            // Otherwise: direction = period direction (catastrophic period → all activated domains are negatively affected)
            const isThriving = thriving.includes(domain)
            const isChallenged = challenged.includes(domain)
            const direction = isThriving ? 'positive' : isChallenged ? 'negative'
              : isNegativePeriod ? 'negative' : isPositivePeriod ? 'positive' : 'neutral'
            return { domain, val: Math.abs(val), direction }
          })

        // Period yogas
        const periodYogas = p.e4.yogas || []

        return (
          <div key={p.period}
            style={{borderRadius:'10px',overflow:'hidden',
              border:`1px solid ${evt||isKnown ? '#92400e' : '#1a1a30'}`,
              borderLeft:`4px solid ${DOT[p.e4.category]}`}}>

            {/* Header */}
            <div onClick={()=>setExpanded(isOpen?null:p.period)}
              style={{display:'flex',alignItems:'center',gap:'12px',padding:'11px 14px',
                cursor:'pointer',background:'var(--bg2)'}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:'14px',color:'var(--acc)',marginBottom:'1px'}}>{p.period}</div>
                <div style={{fontSize:'11px',color:'var(--txm)'}}>{p.startYear}–{p.endYear} · {p.endYear-p.startYear}y</div>
              </div>

              {/* Thriving/challenged domains summary */}
              {(thriving.length>0||challenged.length>0) && !isOpen && (
                <div style={{display:'flex',gap:'4px',flexWrap:'wrap',maxWidth:'240px'}}>
                  {thriving.slice(0,2).map(d=>(
                    <span key={d} style={{fontSize:'10px',background:'#052e16',color:'#86efac',
                      padding:'1px 6px',borderRadius:'4px'}}>{DOMAIN_LABEL[d]||d}</span>
                  ))}
                  {challenged.slice(0,2).map(d=>(
                    <span key={d} style={{fontSize:'10px',background:'#450a0a',color:'#fca5a5',
                      padding:'1px 6px',borderRadius:'4px'}}>{DOMAIN_LABEL[d]||d}</span>
                  ))}
                </div>
              )}

              {(evt||isKnown) && (
                <span style={{fontSize:'10px',background:'#451a03',color:'#fcd34d',
                  padding:'2px 8px',borderRadius:'4px',fontWeight:600,flexShrink:0}}>
                  ⚡ {evt?.description||p.knownEvent}
                </span>
              )}
              <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:700,
                background:s.bg,color:s.color,border:`1px solid ${s.border}`,flexShrink:0}}>
                {p.e4.category}
              </span>
              <div style={{fontSize:'13px',fontWeight:700,color:s.color,minWidth:'48px',
                textAlign:'right',flexShrink:0}}>{score.toFixed(3)}</div>
              <div style={{color:'var(--txm)',fontSize:'10px',flexShrink:0}}>{isOpen?'▲':'▼'}</div>
            </div>

            {/* Score bar */}
            <div style={{height:'3px',background:'var(--bd)'}}>
              <div style={{width:`${pct}%`,height:'100%',background:DOT[p.e4.category]}}/>
            </div>

            {/* Expanded */}
            {isOpen && (
              <div style={{padding:'14px',background:'var(--bg)',display:'flex',flexDirection:'column',gap:'10px'}}>

                {/* Known event */}
                {isKnown && (
                  <div style={{background:'#451a03',borderRadius:'8px',padding:'8px 12px',
                    fontSize:'12px',color:'#fcd34d'}}>
                    ⚡ <strong>Known event:</strong> {p.knownEvent} · Expected: <strong>{p.knownExpected}</strong>
                  </div>
                )}

                {/* Layer scores */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
                  {[
                    {l:'Dasha Score',   v:trace?.dashaScore?.toFixed(3)  ?? score.toFixed(3), sub:'MD × AD activation'},
                    {l:'Gochara Score', v:trace?.gocharaScore?.toFixed(3) ?? '0.000',          sub:'Transit overlay'},
                    {l:'Domain Score',  v:trace?.domainScore?.toFixed(3)  ?? '0.000',          sub:'Life area weight'},
                  ].map(x=>(
                    <div key={x.l} style={{background:'var(--bg2)',borderRadius:'8px',padding:'10px',textAlign:'center'}}>
                      <div style={{fontSize:'10px',color:'var(--txm)',textTransform:'uppercase',
                        letterSpacing:'.05em',marginBottom:'4px'}}>{x.l}</div>
                      <div style={{fontSize:'18px',fontWeight:700,color:'var(--tx)'}}>{x.v}</div>
                      <div style={{fontSize:'10px',color:'var(--txm)',marginTop:'2px'}}>{x.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Domains affected */}
                {topDomains.length > 0 && (
                  <div>
                    <div style={{fontSize:'10px',fontWeight:700,color:'var(--txm)',textTransform:'uppercase',
                      letterSpacing:'.08em',marginBottom:'6px'}}>Life Areas Affected</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                      {topDomains.map(({domain, val, direction}) => {
                        const isPos = direction === 'positive'
                        const isNeg = direction === 'negative'
                        const bg     = isPos ? '#052e16' : isNeg ? '#450a0a' : '#1e293b'
                        const border = isPos ? '#166534' : isNeg ? '#7f1d1d' : '#334155'
                        const clr    = isPos ? '#86efac' : isNeg ? '#fca5a5' : '#94a3b8'
                        const icon   = isPos ? '✓' : isNeg ? '⚠' : '•'
                        // Human-readable impact label
                        const impactLabel = isPos
                          ? 'benefits'
                          : isNeg
                            ? ['CATASTROPHIC','DIFFICULT'].includes(p.e4.category) ? 'severely hit' : 'under pressure'
                            : 'activated'
                        return (
                          <div key={domain} style={{display:'flex',alignItems:'center',gap:'5px',
                            background:bg, border:`1px solid ${border}`,
                            borderRadius:'6px',padding:'5px 11px'}}>
                            <span style={{fontSize:'12px',color:clr,fontWeight:600}}>
                              {icon} {DOMAIN_LABEL[domain]||domain}
                            </span>
                            <span style={{fontSize:'10px',color:clr,opacity:0.75}}>
                              {impactLabel}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                    {isNegativePeriod && topDomains.length > 0 && (
                      <div style={{fontSize:'11px',color:'#f59e0b',marginTop:'6px',fontStyle:'italic'}}>
                        These life areas are under stress during this period — not thriving.
                      </div>
                    )}
                  </div>
                )}

                {/* Yoga combinations active this period */}
                {periodYogas.length > 0 && (
                  <div>
                    <div style={{fontSize:'10px',fontWeight:700,color:'var(--txm)',textTransform:'uppercase',
                      letterSpacing:'.08em',marginBottom:'6px'}}>Yoga Combinations</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
                      {periodYogas.map((y,i) => (
                        <span key={i} style={{background:'#1e1040',color:'#c4b5fd',
                          border:'1px solid #4c1d95',padding:'3px 10px',
                          borderRadius:'20px',fontSize:'11px'}}>{y}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Layer trace (expandable) */}
                {p.e4.layerTrace && p.e4.layerTrace.length > 0 && (
                  <details style={{borderTop:'1px solid var(--bd)',paddingTop:'8px'}}>
                    <summary style={{fontSize:'11px',color:'var(--txm)',cursor:'pointer',
                      userSelect:'none',listStyle:'none'}}>
                      ▸ Engine trace ({p.e4.layerTrace.length} steps)
                    </summary>
                    <div style={{marginTop:'8px',display:'flex',flexDirection:'column',gap:'3px'}}>
                      {p.e4.layerTrace.map((t,i) => (
                        <div key={i} style={{fontSize:'11px',color:'var(--txm)',
                          fontFamily:'monospace',padding:'2px 8px',
                          background:'var(--bg2)',borderRadius:'4px'}}>{t}</div>
                      ))}
                    </div>
                  </details>
                )}

                {/* Admin: mark event */}
                {isAdmin && (
                  <div style={{borderTop:'1px solid var(--bd)',paddingTop:'10px'}}>
                    {evt ? (
                      <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                        <span style={{fontSize:'12px',color:'var(--txm)'}}>Marked:</span>
                        <span style={{padding:'2px 8px',borderRadius:'4px',fontSize:'11px',fontWeight:700,
                          background:CAT_STYLE[evt.category]?.bg,color:CAT_STYLE[evt.category]?.color,
                          border:`1px solid ${CAT_STYLE[evt.category]?.border}`}}>{evt.category}</span>
                        <span style={{fontSize:'12px',color:'var(--tx)',flex:1}}>{evt.description}</span>
                        <button onClick={()=>clearEvent(p.period)}
                          style={{background:'none',border:'1px solid var(--bd)',color:'var(--txm)',
                            padding:'3px 10px',borderRadius:'6px',fontSize:'11px',cursor:'pointer',fontFamily:'inherit'}}>
                          ✕ Clear
                        </button>
                      </div>
                    ) : markPeriod===p.period ? (
                      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}>
                        <select value={markCat} onChange={e=>setMarkCat(e.target.value)}
                          style={{background:'var(--bg2)',border:'1px solid var(--bd)',color:'var(--tx)',
                            padding:'6px 8px',borderRadius:'6px',fontSize:'12px',fontFamily:'inherit'}}>
                          {ALL_CATS.map(c=><option key={c}>{c}</option>)}
                        </select>
                        <input type="text" value={markDesc} onChange={e=>setMarkDesc(e.target.value)}
                          placeholder="What happened? (e.g. Father's death, Marriage)"
                          style={{flex:1,minWidth:'180px',background:'var(--bg2)',border:'1px solid var(--bd)',
                            color:'var(--tx)',padding:'6px 10px',borderRadius:'6px',fontSize:'12px',fontFamily:'inherit'}}
                          onKeyDown={e=>e.key==='Enter'&&markEvent(p.period,score)}/>
                        <button onClick={()=>markEvent(p.period,score)}
                          style={{background:'#92400e',color:'#fcd34d',border:'none',
                            padding:'6px 14px',borderRadius:'6px',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                          ⚡ Save
                        </button>
                        <button onClick={()=>setMarkPeriod('')}
                          style={{background:'none',border:'1px solid var(--bd)',color:'var(--txm)',
                            padding:'6px 10px',borderRadius:'6px',fontSize:'12px',cursor:'pointer',fontFamily:'inherit'}}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={()=>{setMarkPeriod(p.period);setMarkDesc('')}}
                        style={{background:'none',border:'1px solid #92400e',color:'#f59e0b',
                          padding:'5px 14px',borderRadius:'6px',fontSize:'12px',fontWeight:600,
                          cursor:'pointer',fontFamily:'inherit'}}>
                        ⚡ Mark event for calibration
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
