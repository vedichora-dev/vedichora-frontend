'use client'
import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
//  LifePredictionsTab
//
//  Normal users → read-only timeline of all dasha periods
//  Admin users  → same view + "Mark Event" panel on each period for calibration
// ─────────────────────────────────────────────────────────────────────────────

const BASE = 'https://enchanting-dedication-production.up.railway.app'

const CAT_STYLE: Record<string, {bg:string,color:string,border:string}> = {
  CATASTROPHIC: {bg:'#450a0a', color:'#fca5a5', border:'#7f1d1d'},
  DIFFICULT:    {bg:'#431407', color:'#fdba74', border:'#9a3412'},
  CHALLENGING:  {bg:'#422006', color:'#fde68a', border:'#92400e'},
  NEUTRAL:      {bg:'#0f172a', color:'#94a3b8', border:'#1e293b'},
  POSITIVE:     {bg:'#052e16', color:'#86efac', border:'#166534'},
  EXCEPTIONAL:  {bg:'#022c22', color:'#6ee7b7', border:'#065f46'},
}

const DOT_COLOR: Record<string,string> = {
  CATASTROPHIC:'#dc2626', DIFFICULT:'#ea580c', CHALLENGING:'#ca8a04',
  NEUTRAL:'#475569', POSITIVE:'#16a34a', EXCEPTIONAL:'#059669',
}

const ALL_CATS = ['CATASTROPHIC','DIFFICULT','CHALLENGING','NEUTRAL','POSITIVE','EXCEPTIONAL']

interface Period {
  period: string
  startYear: number
  endYear: number
  e4: { category: string; score: number; trace?: any }
  knownEvent?: string
  knownExpected?: string
}

interface MarkedEvent {
  category: string
  description: string
  engineScore: number
}

export default function LifePredictionsTab({
  horoId, isAdmin,
}: { horoId: string; isAdmin: boolean }) {

  const [periods,   setPeriods]   = useState<Period[]>([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [filter,    setFilter]    = useState('all')
  const [expanded,  setExpanded]  = useState<string | null>(null)

  // Admin: marked events stored in localStorage keyed by horoId
  const storageKey = `vh_events_${horoId}`
  const [marked, setMarked] = useState<Record<string, MarkedEvent>>(() => {
    if (typeof window === 'undefined') return {}
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}') } catch { return {} }
  })
  const [markCat,   setMarkCat]   = useState('CATASTROPHIC')
  const [markDesc,  setMarkDesc]  = useState('')
  const [markPeriod,setMarkPeriod]= useState('')

  useEffect(() => {
    if (!horoId) return
    setLoading(true); setError('')
    fetch(`${BASE}/api/chart/${horoId}/compare-engines`)
      .then(r => r.json())
      .then(j => { setPeriods(j?.data?.periods || []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [horoId])

  const saveMarked = (next: Record<string, MarkedEvent>) => {
    setMarked(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  const markEvent = (period: string, score: number) => {
    if (!markDesc.trim()) return
    saveMarked({ ...marked, [period]: { category: markCat, description: markDesc.trim(), engineScore: score } })
    setMarkDesc(''); setMarkPeriod('')
  }

  const clearEvent = (period: string) => {
    const next = { ...marked }; delete next[period]; saveMarked(next)
  }

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ horoId, marked, exportedAt: new Date().toISOString() }, null, 2)])
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `vh-events-${horoId}.json`; a.click()
  }

  if (loading) return (
    <div style={{padding:'40px',textAlign:'center',color:'var(--txm)'}}>
      <div style={{fontSize:'28px',marginBottom:'8px'}}>🔮</div>
      Loading life predictions...
    </div>
  )

  if (error) return (
    <div style={{padding:'16px',background:'#450a0a',borderRadius:'8px',color:'#fca5a5',fontSize:'13px'}}>
      ❌ {error}
    </div>
  )

  if (!periods.length) return (
    <div style={{padding:'24px',color:'var(--txm)',fontSize:'13px',textAlign:'center'}}>
      No prediction data available.
    </div>
  )

  // Category counts
  const counts: Record<string,number> = {}
  periods.forEach(p => { counts[p.e4.category] = (counts[p.e4.category]||0)+1 })

  const visible = filter === 'all' ? periods : periods.filter(p => p.e4.category === filter)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

      {/* ── Summary pills ── */}
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
        const pct    = Math.min(100, Math.max(0, ((score + 1) / 2) * 100))
        const isOpen = expanded === p.period
        const evt    = marked[p.period]
        const isKnown = !!p.knownEvent

        return (
          <div key={p.period}
            style={{borderRadius:'12px',overflow:'hidden',
              border:`1px solid ${evt ? '#92400e' : isKnown ? '#92400e' : '#1a1a30'}`,
              borderLeft:`4px solid ${evt || isKnown ? '#f59e0b' : DOT_COLOR[p.e4.category]}`}}>

            {/* Card header — always visible */}
            <div onClick={()=>setExpanded(isOpen ? null : p.period)}
              style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',
                cursor:'pointer',background:'var(--bg2)'}}>

              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:'14px',color:'var(--acc)',marginBottom:'2px'}}>
                  {p.period}
                </div>
                <div style={{fontSize:'11px',color:'var(--txm)'}}>
                  {p.startYear} – {p.endYear} &nbsp;·&nbsp; {p.endYear - p.startYear}y
                </div>
              </div>

              {/* Known / marked badge */}
              {(isKnown || evt) && (
                <span style={{fontSize:'10px',background:'#451a03',color:'#fcd34d',
                  padding:'2px 8px',borderRadius:'4px',fontWeight:600}}>
                  ⚡ {evt?.description || p.knownEvent}
                </span>
              )}

              {/* Category badge */}
              <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:700,
                background:s.bg, color:s.color, border:`1px solid ${s.border}`,
                letterSpacing:'0.3px', flexShrink:0}}>
                {p.e4.category}
              </span>

              {/* Score */}
              <div style={{fontSize:'14px',fontWeight:700,color:s.color,minWidth:'50px',textAlign:'right',flexShrink:0}}>
                {score.toFixed(3)}
              </div>

              <div style={{color:'var(--txm)',fontSize:'11px',flexShrink:0}}>{isOpen ? '▲' : '▼'}</div>
            </div>

            {/* Score bar */}
            <div style={{height:'4px',background:'var(--bd)'}}>
              <div style={{width:`${pct}%`,height:'100%',background:DOT_COLOR[p.e4.category]}}/>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div style={{padding:'14px 16px',background:'var(--bg)',display:'flex',flexDirection:'column',gap:'12px'}}>

                {/* Known event banner */}
                {isKnown && (
                  <div style={{background:'#451a03',borderRadius:'8px',padding:'8px 12px',
                    fontSize:'12px',color:'#fcd34d',display:'flex',gap:'8px',alignItems:'center'}}>
                    <span>⚡</span>
                    <div>
                      <strong>Known:</strong> {p.knownEvent} &nbsp;·&nbsp; Expected: <strong>{p.knownExpected}</strong>
                    </div>
                  </div>
                )}

                {/* Layer scores */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px'}}>
                  {[
                    {l:'Dasha Score',  v:(p.e4.trace?.dashaScore  ?? score).toFixed(3), sub:'MD × AD'},
                    {l:'Gochara Score',v:(p.e4.trace?.gocharaScore ?? 0).toFixed(3),    sub:'Transit'},
                    {l:'Domain Score', v:(p.e4.trace?.domainScore  ?? 0).toFixed(3),    sub:'Life area'},
                  ].map(x=>(
                    <div key={x.l} style={{background:'var(--bg2)',borderRadius:'8px',
                      padding:'10px',textAlign:'center'}}>
                      <div style={{fontSize:'10px',color:'var(--txm)',textTransform:'uppercase',
                        letterSpacing:'.05em',marginBottom:'4px'}}>{x.l}</div>
                      <div style={{fontSize:'18px',fontWeight:700,color:'var(--tx)'}}>{x.v}</div>
                      <div style={{fontSize:'10px',color:'var(--txm)',marginTop:'2px'}}>{x.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Admin: mark event panel */}
                {isAdmin && (
                  <div style={{borderTop:'1px solid var(--bd)',paddingTop:'12px'}}>
                    {evt ? (
                      <div style={{display:'flex',alignItems:'center',gap:'8px',flexWrap:'wrap'}}>
                        <span style={{fontSize:'12px',color:'var(--txm)'}}>Marked as:</span>
                        <span style={{padding:'2px 8px',borderRadius:'4px',fontSize:'11px',fontWeight:700,
                          background:CAT_STYLE[evt.category]?.bg, color:CAT_STYLE[evt.category]?.color,
                          border:`1px solid ${CAT_STYLE[evt.category]?.border}`}}>
                          {evt.category}
                        </span>
                        <span style={{fontSize:'12px',color:'var(--tx)',flex:1}}>{evt.description}</span>
                        <button onClick={()=>clearEvent(p.period)}
                          style={{background:'none',border:'1px solid var(--bd)',color:'var(--txm)',
                            padding:'3px 10px',borderRadius:'6px',fontSize:'11px',cursor:'pointer',
                            fontFamily:'inherit'}}>
                          ✕ Clear
                        </button>
                      </div>
                    ) : markPeriod === p.period ? (
                      <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}>
                        <select value={markCat} onChange={e=>setMarkCat(e.target.value)}
                          style={{background:'var(--bg2)',border:'1px solid var(--bd)',color:'var(--tx)',
                            padding:'6px 8px',borderRadius:'6px',fontSize:'12px',fontFamily:'inherit'}}>
                          {ALL_CATS.map(c=><option key={c}>{c}</option>)}
                        </select>
                        <input type="text" value={markDesc} onChange={e=>setMarkDesc(e.target.value)}
                          placeholder="What happened? (e.g. Father's death)"
                          style={{flex:1,minWidth:'180px',background:'var(--bg2)',border:'1px solid var(--bd)',
                            color:'var(--tx)',padding:'6px 10px',borderRadius:'6px',fontSize:'12px',
                            fontFamily:'inherit'}}
                          onKeyDown={e=>e.key==='Enter'&&markEvent(p.period,score)}/>
                        <button onClick={()=>markEvent(p.period,score)}
                          style={{background:'#92400e',color:'#fcd34d',border:'none',
                            padding:'6px 14px',borderRadius:'6px',fontSize:'12px',
                            fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                          ⚡ Save
                        </button>
                        <button onClick={()=>setMarkPeriod('')}
                          style={{background:'none',border:'1px solid var(--bd)',color:'var(--txm)',
                            padding:'6px 10px',borderRadius:'6px',fontSize:'12px',cursor:'pointer',
                            fontFamily:'inherit'}}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={()=>{setMarkPeriod(p.period);setMarkDesc('')}}
                        style={{background:'none',border:'1px solid #92400e',color:'#f59e0b',
                          padding:'5px 14px',borderRadius:'6px',fontSize:'12px',
                          fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
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
