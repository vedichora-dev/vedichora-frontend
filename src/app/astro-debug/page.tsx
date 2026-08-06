'use client'
import { useState } from 'react'

const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'

type Mode = 'past'|'10y'|'full'

const th: React.CSSProperties = { textAlign:'left', padding:'8px 10px', fontSize:'11px', fontWeight:700,
  color:'#9CA3AF', textTransform:'uppercase', letterSpacing:'.04em', borderBottom:'2px solid #374151', whiteSpace:'nowrap' }
const td: React.CSSProperties = { padding:'8px 10px', fontSize:'12px', color:'#E5E7EB', borderBottom:'1px solid #1F2937', whiteSpace:'nowrap' }
const tdWrap: React.CSSProperties = { ...td, whiteSpace:'normal', maxWidth:'420px', lineHeight:1.5 }
const card: React.CSSProperties = { background:'#111827', border:'1px solid #1F2937', borderRadius:'12px', padding:'18px', marginBottom:'18px', overflowX:'auto' }
const sectionTitle: React.CSSProperties = { fontSize:'13px', fontWeight:700, color:'#F3F4F6', marginBottom:'12px',
  textTransform:'uppercase', letterSpacing:'.05em', display:'flex', alignItems:'center', gap:'8px' }
const badge = (bg:string, fg:string): React.CSSProperties => ({ background:bg, color:fg, padding:'2px 8px',
  borderRadius:'4px', fontSize:'10px', fontWeight:700, textTransform:'uppercase' })

function fmtDate(d:string) {
  const dt = new Date(d)
  return dt.toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' })
}
function intensityBadge(i:string) {
  if (i === 'SEVERE')   return badge('#7F1D1D','#FCA5A5')
  if (i === 'POSITIVE') return badge('#14532D','#86EFAC')
  if (i === 'MODERATE') return badge('#78350F','#FCD34D')
  return badge('#1F2937','#9CA3AF')
}
function riskBadge(r:string) {
  if (r === 'CRITICAL') return badge('#7F1D1D','#FCA5A5')
  if (r === 'HIGH')     return badge('#7C2D12','#FDBA74')
  return badge('#1F2937','#9CA3AF')
}
function enmityBadge(l:string) {
  return l === 'Definitive Enemy' ? badge('#7F1D1D','#FCA5A5') : badge('#78350F','#FCD34D')
}

export default function AstrologerDebug() {
  const [id1, setId1] = useState('')
  const [id2, setId2] = useState('')
  const [name1, setName1] = useState('')
  const [name2, setName2] = useState('')
  const [relType, setRelType] = useState('Marriage')
  const [mode, setMode] = useState<Mode>('10y')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [data, setData] = useState<any>(null)
  const [yearFilter, setYearFilter] = useState('')

  const run = async () => {
    if (!id1 || !id2) { setErr('Enter both chart IDs (HoroIds)'); return }
    setLoading(true); setErr(''); setData(null)
    try {
      const now = 2026
      const body: any = { GroomId: id1.trim(), BrideId: id2.trim(), RelationshipType: relType }
      if (name1) body.GroomName = name1
      if (name2) body.BrideName = name2
      if (mode === 'past') { body.FromYear = now - 15; body.ToYear = now }
      if (mode === '10y')  { body.FromYear = now - 2;  body.ToYear = now + 10 }
      if (mode === 'full') { body.FullRange = true }
      const res = await fetch(`${CHART_URL}/api/matchmaking/astrologer-debug`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      }).then(r => r.json())
      if (res?.data?.data) setData(res.data.data)
      else if (res?.data) setData(res.data)
      else setErr(res?.message || 'No data returned — check chart IDs')
    } catch (e: any) {
      setErr('Request failed: ' + (e?.message || 'unknown error'))
    }
    setLoading(false)
  }

  const yearMatch = (startDate: string, endDate: string) => {
    if (!yearFilter.trim()) return true
    const y = parseInt(yearFilter.trim())
    if (isNaN(y)) return true
    const s = new Date(startDate).getFullYear(), e = new Date(endDate).getFullYear()
    return y >= s && y <= e
  }

  return (
    <div style={{minHeight:'100vh', background:'#030712', fontFamily:"'JetBrains Mono',ui-monospace,monospace", padding:'24px'}}>
      <div style={{maxWidth:'1200px', margin:'0 auto'}}>

        <div style={{marginBottom:'20px'}}>
          <div style={{fontSize:'20px', fontWeight:700, color:'#F3F4F6', marginBottom:'4px'}}>
            🔍 Astrologer Debug — Compatibility Engine Audit
          </div>
          <div style={{fontSize:'12px', color:'#6B7280'}}>
            Raw, unfiltered reasoning: planet names, houses, dignity, FuncNature scores. Not for end users — this is for verifying the engine against known real-life events.
          </div>
        </div>

        {/* ── Input form ── */}
        <div style={card}>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'12px'}}>
            <div>
              <label style={{fontSize:'10px', color:'#9CA3AF', display:'block', marginBottom:'4px'}}>Person 1 — HoroId</label>
              <input value={id1} onChange={e=>setId1(e.target.value)} placeholder="e.g. CFB788355007"
                style={{width:'100%', padding:'8px 10px', background:'#1F2937', border:'1px solid #374151',
                  borderRadius:'6px', color:'#F3F4F6', fontSize:'12px', fontFamily:'inherit'}} />
            </div>
            <div>
              <label style={{fontSize:'10px', color:'#9CA3AF', display:'block', marginBottom:'4px'}}>Person 2 — HoroId</label>
              <input value={id2} onChange={e=>setId2(e.target.value)} placeholder="e.g. 72F06B0995AC"
                style={{width:'100%', padding:'8px 10px', background:'#1F2937', border:'1px solid #374151',
                  borderRadius:'6px', color:'#F3F4F6', fontSize:'12px', fontFamily:'inherit'}} />
            </div>
            <div>
              <label style={{fontSize:'10px', color:'#9CA3AF', display:'block', marginBottom:'4px'}}>Person 1 name (optional)</label>
              <input value={name1} onChange={e=>setName1(e.target.value)} placeholder="Babu"
                style={{width:'100%', padding:'8px 10px', background:'#1F2937', border:'1px solid #374151',
                  borderRadius:'6px', color:'#F3F4F6', fontSize:'12px', fontFamily:'inherit'}} />
            </div>
            <div>
              <label style={{fontSize:'10px', color:'#9CA3AF', display:'block', marginBottom:'4px'}}>Person 2 name (optional)</label>
              <input value={name2} onChange={e=>setName2(e.target.value)} placeholder="Venkat"
                style={{width:'100%', padding:'8px 10px', background:'#1F2937', border:'1px solid #374151',
                  borderRadius:'6px', color:'#F3F4F6', fontSize:'12px', fontFamily:'inherit'}} />
            </div>
          </div>
          <div style={{display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center'}}>
            {['Marriage','Business','Sibling','Friendship','Other'].map(rt=>(
              <button key={rt} onClick={()=>setRelType(rt)}
                style={{padding:'6px 12px', fontSize:'11px', borderRadius:'6px', cursor:'pointer', border:'none',
                  background: relType===rt ? '#D4AF55' : '#1F2937', color: relType===rt ? '#111827' : '#9CA3AF', fontWeight:700}}>
                {rt}
              </button>
            ))}
            <span style={{width:'1px', height:'20px', background:'#374151'}} />
            {(['past','10y','full'] as const).map(m=>(
              <button key={m} onClick={()=>setMode(m)}
                style={{padding:'6px 12px', fontSize:'11px', borderRadius:'6px', cursor:'pointer', border:'none',
                  background: mode===m ? '#D4AF55' : '#1F2937', color: mode===m ? '#111827' : '#9CA3AF', fontWeight:700}}>
                {m==='past'?'Past 15yr':m==='10y'?'-2 to +10yr':'Full 70yr'}
              </button>
            ))}
            <button onClick={run} disabled={loading}
              style={{marginLeft:'auto', padding:'8px 20px', fontSize:'12px', borderRadius:'6px', cursor:'pointer',
                border:'none', background:'#2563EB', color:'#fff', fontWeight:700}}>
              {loading ? 'Computing…' : 'Run Audit →'}
            </button>
          </div>
          {err && <div style={{marginTop:'10px', fontSize:'12px', color:'#FCA5A5'}}>{err}</div>}
        </div>

        {data && (<>
          {/* ── Header summary ── */}
          <div style={card}>
            <div style={{display:'flex', gap:'24px', flexWrap:'wrap', alignItems:'center'}}>
              <div>
                <div style={{fontSize:'10px', color:'#6B7280'}}>{data.groomName}</div>
                <div style={{fontSize:'14px', color:'#F3F4F6', fontWeight:700}}>{data.groomLagna} Lagna</div>
              </div>
              <div>
                <div style={{fontSize:'10px', color:'#6B7280'}}>{data.brideName}</div>
                <div style={{fontSize:'14px', color:'#F3F4F6', fontWeight:700}}>{data.brideLagna} Lagna</div>
              </div>
              <div>
                <div style={{fontSize:'10px', color:'#6B7280'}}>Deep Compat Score</div>
                <div style={{fontSize:'14px', color:'#D4AF55', fontWeight:700}}>{data.deepCompatScore?.toFixed(3)} (−1 to +1)</div>
              </div>
              <div>
                <div style={{fontSize:'10px', color:'#6B7280'}}>Range</div>
                <div style={{fontSize:'14px', color:'#F3F4F6', fontWeight:700}}>{data.fromYear} – {data.toYear}</div>
              </div>
              <div style={{marginLeft:'auto'}}>
                <label style={{fontSize:'10px', color:'#9CA3AF', display:'block', marginBottom:'4px'}}>Jump to year</label>
                <input value={yearFilter} onChange={e=>setYearFilter(e.target.value)} placeholder="e.g. 2017"
                  style={{padding:'6px 10px', background:'#1F2937', border:'1px solid #374151',
                    borderRadius:'6px', color:'#F3F4F6', fontSize:'12px', fontFamily:'inherit', width:'100px'}} />
              </div>
            </div>
          </div>

          {/* ── Cross Predictions — the core "why" table ── */}
          <div style={card}>
            <div style={sectionTitle}>📅 Cross-Impact Predictions (MD/AD → Partner's Domain)</div>
            <div style={{fontSize:'11px', color:'#6B7280', marginBottom:'12px'}}>
              For each MD/AD, shows which planet is running, where it lands in the partner's chart, and the resulting intensity. This is the primary reasoning source for "Difficult Times to Watch."
            </div>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={th}>Who</th><th style={th}>MD</th><th style={th}>AD</th>
                <th style={th}>Start</th><th style={th}>End</th>
                <th style={th}>House in Partner</th><th style={th}>Domain</th>
                <th style={th}>FuncMD</th><th style={th}>FuncAD</th><th style={th}>Intensity</th>
              </tr></thead>
              <tbody>
                {(data.crossPredictions||[]).filter((c:any)=>yearMatch(c.startDate,c.endDate)).map((c:any,i:number)=>(
                  <tr key={i}>
                    <td style={td}>{c.who}</td>
                    <td style={td}>{c.mdPlanet}</td>
                    <td style={td}>{c.adPlanet}</td>
                    <td style={td}>{fmtDate(c.startDate)}</td>
                    <td style={td}>{fmtDate(c.endDate)}</td>
                    <td style={td}>{c.houseInPartner}</td>
                    <td style={td}>{c.domainInPartner}</td>
                    <td style={td}>{c.funcMd}</td>
                    <td style={td}>{c.funcAd}</td>
                    <td style={td}><span style={intensityBadge(c.intensity)}>{c.intensity}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Separation Windows ── */}
          <div style={card}>
            <div style={sectionTitle}>⚠ Separation Windows (Both Malefic Simultaneously)</div>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={th}>Start</th><th style={th}>End</th><th style={th}>Months</th>
                <th style={th}>P1 Period</th><th style={th}>P2 Period</th><th style={th}>Risk</th><th style={th}>Description</th>
              </tr></thead>
              <tbody>
                {(data.separationWindows||[]).filter((w:any)=>yearMatch(w.startDate,w.endDate)).map((w:any,i:number)=>(
                  <tr key={i}>
                    <td style={td}>{fmtDate(w.startDate)}</td>
                    <td style={td}>{fmtDate(w.endDate)}</td>
                    <td style={td}>{w.durationMonths}</td>
                    <td style={td}>{w.groomPeriod}</td>
                    <td style={td}>{w.bridePeriod}</td>
                    <td style={td}><span style={riskBadge(w.riskLevel)}>{w.riskLevel}</span></td>
                    <td style={tdWrap}>{w.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── AD Enmity Windows ── */}
          <div style={card}>
            <div style={sectionTitle}>🔺 AD-Level Planetary Enmity (Naisargika Maitri Check)</div>
            <div style={{fontSize:'11px', color:'#6B7280', marginBottom:'12px'}}>
              For each AD, checks if that planet is a natural enemy of the partner's Moon-sign lord — asymmetric, checked from the rashi lord's view. Severity is amplified when the AD lord is exalted or in its own sign.
            </div>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={th}>Who</th><th style={th}>MD</th><th style={th}>AD</th>
                <th style={th}>Start</th><th style={th}>End</th>
                <th style={th}>AD Rasi</th><th style={th}>AD Dignity</th>
                <th style={th}>Partner Moon Rasi</th><th style={th}>Partner Rashi Lord</th><th style={th}>Verdict</th>
              </tr></thead>
              <tbody>
                {(data.adEnmityWindows||[]).filter((w:any)=>yearMatch(w.startDate,w.endDate)).map((w:any,i:number)=>(
                  <tr key={i}>
                    <td style={td}>{w.who}</td>
                    <td style={td}>{w.mdPlanet}</td>
                    <td style={td}>{w.adPlanet}</td>
                    <td style={td}>{fmtDate(w.startDate)}</td>
                    <td style={td}>{fmtDate(w.endDate)}</td>
                    <td style={td}>{w.adPlanetRasi}</td>
                    <td style={td}>{w.adPlanetDignity}</td>
                    <td style={td}>{w.partnerMoonRasi}</td>
                    <td style={td}>{w.partnerRashiLord}</td>
                    <td style={td}><span style={enmityBadge(w.label)}>{w.label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data.adEnmityWindows||[]).length===0 && (
              <div style={{fontSize:'12px', color:'#6B7280', padding:'12px 0'}}>No AD-level enmity windows in this range.</div>
            )}
          </div>

          {/* ── Planet Impacts (natal, both charts) ── */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px'}}>
            {[['Person 1', data.groomName, data.groomPlanetImpacts],
              ['Person 2', data.brideName, data.bridePlanetImpacts]].map(([label, nm, impacts]:any)=>(
              <div key={label} style={card}>
                <div style={sectionTitle}>{label}: {nm} — Natal Planet Impacts</div>
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                  <thead><tr>
                    <th style={th}>Planet</th><th style={th}>House</th><th style={th}>Rasi</th>
                    <th style={th}>FuncNature</th><th style={th}>Quality</th>
                  </tr></thead>
                  <tbody>
                    {(impacts||[]).map((p:any,i:number)=>(
                      <tr key={i}>
                        <td style={td}>{p.planet}{p.isRetro?' (R)':''}</td>
                        <td style={td}>{p.house}</td>
                        <td style={td}>{p.rasiName}</td>
                        <td style={td}>{p.funcNature}</td>
                        <td style={td}>{p.quality?.toFixed?.(2) ?? p.netScore?.toFixed?.(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          {/* ── Doshas ── */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px', marginTop:'18px'}}>
            {[['Person 1', data.groomName, data.groomDosha],['Person 2', data.brideName, data.brideDosha]].map(([label,nm,d]:any)=>(
              <div key={label} style={card}>
                <div style={sectionTitle}>{label}: {nm} — Marriage Dosha</div>
                <pre style={{fontSize:'11px', color:'#9CA3AF', whiteSpace:'pre-wrap', margin:0}}>
                  {JSON.stringify(d, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </>)}
      </div>
    </div>
  )
}
