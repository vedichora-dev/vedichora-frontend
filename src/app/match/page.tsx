'use client'
import { useState } from 'react'
import { calculateChart, matchCharts } from '@/api'
import { useT } from '@/lib/i18n'
import { to24Hour } from '@/lib/utils'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'
import CityAutocomplete from '@/components/ui/CityAutocomplete'
import { Heart, ChevronRight, RefreshCw } from 'lucide-react'

const EMPTY: DateValue = { dd:0, mm:0, yyyy:0 }

function PersonForm({
  title, prefix, name, setName, dob, setDob, place, setPlace
}: any) {
  const t = useT()
  return (
    <div className="card">
      <div className="card-hd">
        <Heart style={{width:'14px',height:'14px',color:'#F87171'}}/>
        <span className="card-title">{title}</span>
      </div>
      <div className="card-bd" style={{display:'flex',flexDirection:'column',gap:'14px'}}>
        <div>
          <label className="label">{t('chart.name')}</label>
          <input className="input" value={name}
            onChange={e=>setName(e.target.value)}
            placeholder="Full name (optional)"/>
        </div>
        <div>
          <label className="label">{t('chart.dob')}</label>
          <DatePicker value={dob} onChange={setDob} showTime showUnknown prefix={prefix}/>
        </div>
        <div>
          <label className="label">{t('chart.place')}</label>
          <input className="input" value={place}
            onChange={e=>setPlace(e.target.value)}
            placeholder={t('chart.place_placeholder')}/>
        </div>
      </div>
    </div>
  )
}

export default function MatchPage() {
  const t = useT()

  const [n1, setN1] = useState('')
  const [n2, setN2] = useState('')
  const [d1, setD1] = useState<DateValue>(EMPTY)
  const [d2, setD2] = useState<DateValue>(EMPTY)
  const [p1, setP1] = useState('')
  const [p2, setP2] = useState('')

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handle = async () => {
    if (!d1.dd||!d1.mm||!d1.yyyy) { setErr('Enter Person 1 date of birth'); return }
    if (!d2.dd||!d2.mm||!d2.yyyy) { setErr('Enter Person 2 date of birth'); return }
    if (!p1.trim()) { setErr('Enter Person 1 place of birth'); return }
    if (!p2.trim()) { setErr('Enter Person 2 place of birth'); return }

    setLoading(true); setErr(''); setResult(null)
    try {
      const t1 = d1.unknownTime ? {hour:12,minute:0} : to24Hour(d1.hr||12,d1.mi||0,d1.ap||'AM')
      const t2 = d2.unknownTime ? {hour:12,minute:0} : to24Hour(d2.hr||12,d2.mi||0,d2.ap||'AM')

      // Step 1: Calculate both charts
      const [c1res, c2res] = await Promise.all([
        calculateChart({
          PersonName:n1||'Person 1', Year:d1.yyyy, Month:d1.mm, Day:d1.dd,
          Hour:t1.hour, Minute:t1.minute, Second:0,
          PlaceName:p1, UtcOffsetHours:5.5, AyanamsaType:'Lahiri'
        }),
        calculateChart({
          PersonName:n2||'Person 2', Year:d2.yyyy, Month:d2.mm, Day:d2.dd,
          Hour:t2.hour, Minute:t2.minute, Second:0,
          PlaceName:p2, UtcOffsetHours:5.5, AyanamsaType:'Lahiri'
        })
      ])

      const chart1 = c1res?.data?.data || c1res?.data
      const chart2 = c2res?.data?.data || c2res?.data

      if (!chart1?.horoscopeId || !chart2?.horoscopeId) {
        setErr('Could not calculate one or both charts. Check birth details.')
        setLoading(false); return
      }

      // Step 2: Match using saved IDs
      const mres = await matchCharts(chart1.horoscopeId, chart2.horoscopeId)
      const mdata = mres?.data?.data || mres?.data
      if (mdata) {
        setResult({ ...mdata, name1: n1||'Person 1', name2: n2||'Person 2', chart1, chart2 })
      } else {
        setErr('Compatibility calculation failed. Please try again.')
      }
    } catch(e:any) {
      setErr(e?.response?.data?.message || 'Calculation failed — please try again')
    }
    setLoading(false)
  }

  const score = result?.ashtaKootaScore ?? result?.AshtaKootaScore ?? 0
  const total = result?.ashtaKootaTotal ?? result?.AshtaKootaTotal ?? 36
  const pScore = result?.pathuPoruthamScore ?? result?.PathuPoruthamScore ?? 0
  const pTotal = result?.pathuPoruthamTotal ?? result?.PathuPoruthamTotal ?? 10
  const mangal = result?.mangalDosha ?? result?.MangalDosha
  const kuta = result?.kootaDetails || result?.KootaDetails || []
  const pct = Math.round((score/total)*100)

  const scoreColor = pct>=70?'#16A34A':pct>=50?'#B45309':'#DC2626'

  return (
    <div style={{maxWidth:'1200px',margin:'0 auto',padding:'20px 16px'}}>
      <div className="page-header" style={{marginBottom:'24px'}}>
        <h1>{t('match.title')}</h1>
        <p style={{fontSize:'13px',color:'var(--txm)',marginTop:'4px'}}>
          {t('match.subtitle')}
        </p>
      </div>

      {/* Input forms */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginBottom:'20px'}}
        className="match-grid">
        <PersonForm title={t('match.person1')} prefix="p1"
          name={n1} setName={setN1} dob={d1} setDob={setD1} place={p1} setPlace={setP1}/>
        <PersonForm title={t('match.person2')} prefix="p2"
          name={n2} setName={setN2} dob={d2} setDob={setD2} place={p2} setPlace={setP2}/>
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
          : <>{t('match.calculate')} <ChevronRight style={{width:'16px',height:'16px'}}/></>}
      </button>

      {/* Results */}
      {result && (
        <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>

          {/* Overall score */}
          <div className="card" style={{padding:'28px',textAlign:'center'}}>
            <div style={{fontSize:'13px',color:'var(--txm)',marginBottom:'8px',fontWeight:600}}>
              {result.name1} × {result.name2}
            </div>
            <div style={{fontFamily:'Cinzel,serif',fontWeight:900,fontSize:'64px',
              lineHeight:1,color:scoreColor,marginBottom:'4px'}}>{pct}%</div>
            <div style={{fontSize:'13px',color:'var(--txm)',marginBottom:'20px'}}>
              Overall Compatibility
            </div>
            <div style={{width:'100%',height:'8px',background:'var(--bd)',borderRadius:'4px',
              overflow:'hidden',maxWidth:'400px',margin:'0 auto'}}>
              <div style={{height:'100%',width:`${pct}%`,background:scoreColor,
                borderRadius:'4px',transition:'width 1s'}}/>
            </div>
          </div>

          {/* Score breakdown */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'14px'}}>
            {[
              {label:'Ashta Koota',  score,  max:total,  desc:'28 factors across 8 kootas'},
              {label:'Pathu Porutham', score:pScore, max:pTotal, desc:'10 Tamil matching factors'},
              {label:'Mangal Dosha', score: mangal===false?0:mangal===true?1:0,
               max:1, desc:mangal===false?'No Mangal Dosha':'Mangal Dosha present'},
            ].map(s=>{
              const pct2 = Math.round((s.score/s.max)*100)
              const c = s.label.includes('Mangal')
                ? (s.score===0?'#16A34A':'#DC2626')
                : pct2>=70?'#16A34A':pct2>=50?'#B45309':'#DC2626'
              return (
                <div key={s.label} className="card" style={{padding:'20px',textAlign:'center'}}>
                  <div style={{fontSize:'10px',fontWeight:700,color:'var(--txm)',
                    textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'8px'}}>
                    {s.label}
                  </div>
                  <div style={{fontFamily:'Cinzel,serif',fontWeight:900,fontSize:'36px',
                    color:c,lineHeight:1,marginBottom:'4px'}}>
                    {s.label.includes('Mangal')
                      ? (s.score===0?'✓ Clear':'⚠ Present')
                      : `${s.score}/${s.max}`}
                  </div>
                  <div style={{fontSize:'11px',color:'var(--txm)'}}>{s.desc}</div>
                </div>
              )
            })}
          </div>

          {/* Chart details */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
            {[
              {name:result.name1, chart:result.chart1},
              {name:result.name2, chart:result.chart2},
            ].map((person,i)=>{
              const moon = person.chart?.planets?.find((p:any)=>p.planet==='Moon'||p.Planet==='Moon')
              return (
                <div key={i} className="card" style={{padding:'16px'}}>
                  <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'14px',
                    color:'var(--acc)',marginBottom:'8px'}}>{person.name}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:'4px',fontSize:'12px',color:'var(--tx2)'}}>
                    <div><span style={{color:'var(--txm)'}}>Lagna: </span>
                      {person.chart?.ascendantName||'—'}</div>
                    <div><span style={{color:'var(--txm)'}}>Moon: </span>
                      {moon?.rasiName||'—'}</div>
                    <div><span style={{color:'var(--txm)'}}>Nakshatra: </span>
                      {moon?.nakshatraName||'—'}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Koota details if available */}
          {kuta.length > 0 && (
            <div className="card">
              <div className="card-hd"><span className="card-title">Ashta Koota Details</span></div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                  <thead><tr style={{borderBottom:'2px solid var(--bd)'}}>
                    {['Koota','Max','Score','Status'].map(h=>(
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
                        <td style={{padding:'8px 12px',fontWeight:600,color:'var(--tx)',
                          fontFamily:'Cinzel,serif'}}>{k.kootaName||k.KootaName||k.name||`Koota ${i+1}`}</td>
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

        </div>
      )}
    </div>
  )
}
