'use client'
import { useState, useEffect } from 'react'
import { calculateChart, calculateChartGuest, matchCharts, listCharts } from '@/api'
import { useT } from '@/lib/i18n'
import { useStore } from '@/store'
import { to24Hour } from '@/lib/utils'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'
import CityAutocomplete from '@/components/ui/CityAutocomplete'
import { Heart, ChevronRight, RefreshCw, Star, Users } from 'lucide-react'

const EMPTY: DateValue = { dd:0, mm:0, yyyy:0 }

// Gender label helper
const GENDER = ['Male','Female']

export default function MatchPage() {
  const t = useT()
  const { token } = useStore()

  // Saved charts
  const [saved, setSaved]   = useState<any[]>([])
  const [filterQ, setFilterQ] = useState('')

  // Person 1
  const [n1, setN1]   = useState('')
  const [d1, setD1]   = useState<DateValue>(EMPTY)
  const [p1, setP1]   = useState('')
  const [lat1,setLat1] = useState<number|undefined>()
  const [lng1,setLng1] = useState<number|undefined>()
  const [g1, setG1]   = useState<'Male'|'Female'>('Male')
  const [useSaved1, setUseSaved1] = useState(false)
  const [selId1, setSelId1] = useState('')

  // Person 2
  const [n2, setN2]   = useState('')
  const [d2, setD2]   = useState<DateValue>(EMPTY)
  const [p2, setP2]   = useState('')
  const [lat2,setLat2] = useState<number|undefined>()
  const [lng2,setLng2] = useState<number|undefined>()
  const [g2, setG2]   = useState<'Male'|'Female'>('Female')
  const [useSaved2, setUseSaved2] = useState(false)
  const [selId2, setSelId2] = useState('')

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!token) return
    listCharts().then((res:any) => {
      const list = Array.isArray(res) ? res : (res?.data?.data ?? res?.data ?? [])
      setSaved(list)
    }).catch(() => {})
  }, [token])

  const filteredSaved = saved.filter(c => {
    if (!filterQ) return true
    const nm = (c.personName||c.PersonName||'').toLowerCase()
    const lg = (c.ascendantName||c.AscendantName||'').toLowerCase()
    return nm.includes(filterQ.toLowerCase()) || lg.includes(filterQ.toLowerCase())
  })

  // Build payload for a new chart
  const buildPayload = (n: string, d: DateValue, p: string, lat?: number, lng?: number, g?: string) => {
    const tm = d.unknownTime ? {hour:12,minute:0} : to24Hour(d.hr||12, d.mi||0, d.ap||'AM')
    return {
      PersonName: n || g || 'Person',
      Year: d.yyyy, Month: d.mm, Day: d.dd,
      Hour: tm.hour, Minute: tm.minute, Second: 0,
      PlaceName: p || 'Chennai, India',
      Latitude: lat, Longitude: lng,
      UtcOffsetHours: 5.5, AyanamsaType: 'Lahiri',
      Gender: g,
    }
  }

  const handle = async () => {
    setLoading(true); setErr(''); setResult(null)

    try {
      let id1 = selId1, id2 = selId2
      let chart1: any = null, chart2: any = null

      // ── Calculate Chart 1 ──
      if (!useSaved1 || !id1) {
        if (!d1.dd||!d1.mm||!d1.yyyy) { setErr('Enter Person 1 date of birth'); setLoading(false); return }
        if (!p1.trim()) { setErr('Enter Person 1 place of birth'); setLoading(false); return }
        const fn = token ? calculateChart : calculateChartGuest
        const r1 = await fn(buildPayload(n1,d1,p1,lat1,lng1,g1))
        chart1 = r1?.data?.data ?? r1?.data
        if (!chart1) { setErr('Could not calculate Person 1 chart'); setLoading(false); return }
        id1 = chart1.horoscopeId || chart1.id || ''
      } else {
        chart1 = saved.find(c => (c.horoscopeId||c.HoroscopeId) === id1)
      }

      // ── Calculate Chart 2 ──
      if (!useSaved2 || !id2) {
        if (!d2.dd||!d2.mm||!d2.yyyy) { setErr('Enter Person 2 date of birth'); setLoading(false); return }
        if (!p2.trim()) { setErr('Enter Person 2 place of birth'); setLoading(false); return }
        const fn = token ? calculateChart : calculateChartGuest
        const r2 = await fn(buildPayload(n2,d2,p2,lat2,lng2,g2))
        chart2 = r2?.data?.data ?? r2?.data
        if (!chart2) { setErr('Could not calculate Person 2 chart'); setLoading(false); return }
        id2 = chart2.horoscopeId || chart2.id || ''
      } else {
        chart2 = saved.find(c => (c.horoscopeId||c.HoroscopeId) === id2)
      }

      // ── Match ──
      if (!id1 || !id2) { setErr('Could not get chart IDs to match'); setLoading(false); return }
      const mres = await matchCharts(id1, id2)
      const mdata = mres?.data?.data ?? mres?.data

      if (mdata) {
        const nm1 = n1 || chart1?.personName || chart1?.PersonName || g1 || 'Person 1'
        const nm2 = n2 || chart2?.personName || chart2?.PersonName || g2 || 'Person 2'
        setResult({ ...mdata, name1: nm1, name2: nm2, chart1, chart2 })
      } else {
        setErr('Compatibility calculation failed. Both charts must be saved (requires login for full match).')
      }
    } catch(e:any) {
      setErr(e?.response?.data?.message || e?.message || 'Calculation failed — please try again')
    }
    setLoading(false)
  }

  const score  = result?.ashtaKootaScore  ?? result?.AshtaKootaScore  ?? 0
  const total  = result?.ashtaKootaTotal  ?? result?.AshtaKootaTotal  ?? 36
  const pScore = result?.pathuPoruthamScore ?? result?.PathuPoruthamScore ?? 0
  const pTotal = result?.pathuPoruthamTotal ?? result?.PathuPoruthamTotal ?? 10
  const mangal = result?.mangalDosha ?? result?.MangalDosha
  const kuta   = result?.kootaDetails || result?.KootaDetails || []
  const pct    = total > 0 ? Math.round((score/total)*100) : 0
  const scoreColor = pct>=70?'#16A34A':pct>=50?'#B45309':'#DC2626'

  // ── PersonCard component ──────────────────────────────────────────
  const PersonCard = ({ num, gender, setGender, name, setName, dob, setDob,
    place, setPlace, setLat, setLng, useSaved, setUseSaved, selId, setSelId }:any) => (
    <div className="card" style={{padding:'20px'}}>
      <div className="card-hd" style={{marginBottom:'14px'}}>
        <Heart style={{width:'14px',height:'14px',color:num===1?'#F87171':'#F472B6'}}/>
        <span className="card-title">Person {num}</span>
        {/* Male / Female toggle */}
        <div style={{marginLeft:'auto',display:'flex',gap:'6px'}}>
          {GENDER.map(g => (
            <button key={g} onClick={()=>setGender(g)}
              style={{padding:'3px 12px',borderRadius:'20px',border:'none',cursor:'pointer',
                fontSize:'11px',fontWeight:700,fontFamily:'inherit',
                background:gender===g?'var(--acc)':'var(--bg2)',
                color:gender===g?'#fff':'var(--txm)'}}>
              {g==='Male'?'♂ Male':'♀ Female'}
            </button>
          ))}
        </div>
      </div>

      {/* Saved chart selector (if logged in + has saved charts) */}
      {token && saved.length > 0 && (
        <div style={{marginBottom:'12px'}}>
          <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
            <button onClick={()=>setUseSaved(false)}
              style={{flex:1,padding:'6px',borderRadius:'8px',border:'none',cursor:'pointer',
                fontSize:'11px',fontWeight:600,fontFamily:'inherit',
                background:!useSaved?'var(--acc)':'var(--bg2)',
                color:!useSaved?'#fff':'var(--txm)'}}>
              Enter Details
            </button>
            <button onClick={()=>setUseSaved(true)}
              style={{flex:1,padding:'6px',borderRadius:'8px',border:'none',cursor:'pointer',
                fontSize:'11px',fontWeight:600,fontFamily:'inherit',
                background:useSaved?'var(--acc)':'var(--bg2)',
                color:useSaved?'#fff':'var(--txm)'}}>
              Use Saved Chart
            </button>
          </div>
          {useSaved && (
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              {saved.slice(0,6).map((c:any) => {
                const id = c.horoscopeId||c.HoroscopeId
                const nm = c.personName||c.PersonName||'Chart'
                const lg = c.ascendantName||c.AscendantName||''
                const md = c.currentMd||c.CurrentMd||''
                const sel = id === selId
                return (
                  <button key={id} onClick={()=>setSelId(id)}
                    style={{padding:'8px 10px',borderRadius:'8px',textAlign:'left',
                      border:`1.5px solid ${sel?'var(--gold)':'var(--bd)'}`,
                      background:sel?'rgba(196,146,42,.08)':'var(--bg2)',
                      cursor:'pointer',fontSize:'11px'}}>
                    <span style={{fontWeight:700,color:'var(--acc)',fontFamily:'Cinzel,serif'}}>{nm}</span>
                    <span style={{color:'var(--txm)',marginLeft:'6px'}}>{lg}</span>
                    {md&&<span style={{color:'var(--gold)',marginLeft:'6px',fontSize:'10px'}}>{md} MD</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Manual entry form */}
      {(!useSaved || !token) && (
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div>
            <label className="label">Full Name (optional)</label>
            <input className="input" value={name} onChange={e=>setName(e.target.value)}
              placeholder={`${gender} name`}/>
          </div>
          <div>
            <label className="label">Date & Time of Birth</label>
            <DatePicker value={dob} onChange={setDob} showTime showUnknown prefix={`m${num}`}/>
          </div>
          <div>
            <label className="label">Place of Birth</label>
            <CityAutocomplete value={place}
              onChange={(city:string,la:number,ln:number)=>{setPlace(city);setLat(la);setLng(ln)}}
              placeholder="City, Country"/>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div style={{maxWidth:'1100px',margin:'0 auto',padding:'20px 16px'}}>
      <div style={{marginBottom:'20px'}}>
        <h1 style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'22px',color:'var(--acc)'}}>
          Compatibility Matching
        </h1>
        <p style={{fontSize:'13px',color:'var(--txm)',marginTop:'4px'}}>
          Ashta Koota · Pathu Porutham · Mangal Dosha · Detailed Koota Analysis
        </p>
        {!token && (
          <div style={{marginTop:'8px',fontSize:'12px',color:'var(--warn,#9C6B14)',
            background:'rgba(156,107,20,.07)',padding:'8px 12px',borderRadius:'8px',
            display:'inline-block'}}>
            🔒 Guest mode — charts won't be saved. <a href="/signin" style={{color:'var(--acc)',fontWeight:600}}>Sign in</a> to use saved charts & see full match report.
          </div>
        )}
      </div>

      {/* Two person forms */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginBottom:'16px'}}
        className="match-grid">
        <PersonCard num={1} gender={g1} setGender={setG1}
          name={n1} setName={setN1} dob={d1} setDob={setD1}
          place={p1} setPlace={setP1} setLat={setLat1} setLng={setLng1}
          useSaved={useSaved1} setUseSaved={setUseSaved1}
          selId={selId1} setSelId={setSelId1}/>
        <PersonCard num={2} gender={g2} setGender={setG2}
          name={n2} setName={setN2} dob={d2} setDob={setD2}
          place={p2} setPlace={setP2} setLat={setLat2} setLng={setLng2}
          useSaved={useSaved2} setUseSaved={setUseSaved2}
          selId={selId2} setSelId={setSelId2}/>
      </div>

      {err && (
        <div style={{padding:'12px 16px',borderRadius:'10px',marginBottom:'16px',
          background:'rgba(220,38,38,.08)',border:'1px solid rgba(220,38,38,.2)',
          fontSize:'13px',color:'#DC2626'}}>{err}</div>
      )}

      <button onClick={handle} disabled={loading}
        className="btn-primary" style={{width:'100%',padding:'14px',
          fontFamily:'Cinzel,serif',fontSize:'15px',display:'flex',
          alignItems:'center',justifyContent:'center',gap:'10px',marginBottom:'24px'}}>
        {loading
          ? <><RefreshCw style={{width:'16px',height:'16px',animation:'spin 1s linear infinite'}}/> Calculating...</>
          : <>Check Compatibility <ChevronRight style={{width:'16px',height:'16px'}}/></>}
      </button>

      {/* ── RESULTS ── */}
      {result && (
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

          {/* Overall score banner */}
          <div className="card" style={{padding:'28px',textAlign:'center'}}>
            <div style={{fontSize:'14px',fontWeight:600,color:'var(--txm)',marginBottom:'6px',
              fontFamily:'Cinzel,serif'}}>
              {result.name1} × {result.name2}
            </div>
            <div style={{fontFamily:'Cinzel,serif',fontWeight:900,fontSize:'64px',
              lineHeight:1,color:scoreColor,marginBottom:'4px'}}>{pct}%</div>
            <div style={{fontSize:'13px',color:'var(--txm)',marginBottom:'16px'}}>
              {pct>=70?'Excellent match 🌟':pct>=50?'Good compatibility ✓':'Needs consideration ⚠'}
            </div>
            <div style={{width:'100%',height:'10px',background:'var(--bd)',borderRadius:'5px',
              overflow:'hidden',maxWidth:'500px',margin:'0 auto 16px'}}>
              <div style={{height:'100%',width:`${pct}%`,background:scoreColor,
                borderRadius:'5px',transition:'width 1s'}}/>
            </div>
            <div style={{display:'flex',justifyContent:'center',gap:'24px',fontSize:'12px',flexWrap:'wrap'}}>
              <span><strong style={{color:scoreColor}}>{score}/{total}</strong> <span style={{color:'var(--txm)'}}>Ashta Koota</span></span>
              <span><strong style={{color:pScore/pTotal>=0.5?'#16A34A':'#DC2626'}}>{pScore}/{pTotal}</strong> <span style={{color:'var(--txm)'}}>Pathu Porutham</span></span>
              <span><strong style={{color:mangal===false?'#16A34A':'#DC2626'}}>{mangal===false?'✓ No':'⚠ Yes'}</strong> <span style={{color:'var(--txm)'}}>Mangal Dosha</span></span>
            </div>
          </div>

          {/* Chart summaries */}
          {(result.chart1 || result.chart2) && (
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
              {[{name:result.name1,chart:result.chart1,gender:'Male'},
                {name:result.name2,chart:result.chart2,gender:'Female'}].map((person,i)=>{
                const c = person.chart
                if (!c) return null
                const moon = c.planets?.find((p:any)=>(p.planet||p.Planet)==='Moon')
                return (
                  <div key={i} className="card" style={{padding:'16px'}}>
                    <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'14px',
                      color:'var(--acc)',marginBottom:'10px',display:'flex',alignItems:'center',gap:'6px'}}>
                      {i===0?'♂':'♀'} {person.name}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px',fontSize:'12px'}}>
                      {[
                        ['Lagna',      c.ascendantName||c.AscendantName||'—'],
                        ['Moon Rasi',  moon?.rasiName||moon?.RasiName||'—'],
                        ['Nakshatra',  moon?.nakshatra||moon?.nakshatraName||'—'],
                        ['Dasha',      (c.vimshottariDasa||c.VimshottariDasa||[])[0]?.planet||'—'],
                      ].map(([lbl,val])=>(
                        <div key={lbl}>
                          <div style={{color:'var(--txm)',fontSize:'10px',fontWeight:700,
                            textTransform:'uppercase',letterSpacing:'.04em'}}>{lbl}</div>
                          <div style={{color:'var(--tx)',fontWeight:600,fontFamily:'Cinzel,serif',
                            fontSize:'13px'}}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Koota breakdown */}
          {kuta.length > 0 && (
            <div className="card">
              <div className="card-hd"><span className="card-title">Ashta Koota Breakdown</span></div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                  <thead><tr style={{borderBottom:'2px solid var(--bd)'}}>
                    {['Koota','Max','Score','Result'].map(h=>(
                      <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:'9px',
                        fontWeight:700,textTransform:'uppercase',color:'var(--txm)'}}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{kuta.map((k:any,i:number)=>{
                    const ks = k.score||k.Score||0
                    const km = k.maxScore||k.MaxScore||k.max||1
                    const ok = ks >= km*0.5
                    return (
                      <tr key={i} style={{borderBottom:'1px solid var(--bd)',
                        background:i%2?'var(--bg2)':'transparent'}}>
                        <td style={{padding:'8px 12px',fontWeight:600,fontFamily:'Cinzel,serif',
                          color:'var(--tx)'}}>{k.kootaName||k.KootaName||`Koota ${i+1}`}</td>
                        <td style={{padding:'8px 12px',color:'var(--txm)'}}>{km}</td>
                        <td style={{padding:'8px 12px',fontWeight:700,
                          color:ok?'#16A34A':'#DC2626'}}>{ks}</td>
                        <td style={{padding:'8px 12px',fontSize:'11px',
                          color:ok?'#16A34A':'#DC2626'}}>{ok?'✓ Compatible':'✗ Incompatible'}</td>
                      </tr>
                    )
                  })}</tbody>
                </table>
              </div>
            </div>
          )}

          {/* Detailed remarks */}
          {result.remarks && (
            <div className="card">
              <div className="card-hd"><span className="card-title">Detailed Analysis</span></div>
              <div className="card-bd" style={{fontSize:'13px',lineHeight:1.8,color:'var(--tx2)'}}>
                {result.remarks}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
