'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { calculateChart, listCharts, getChart } from '@/api'
import { to24Hour } from '@/lib/utils'
import { useT, usePlanetName, useSignName } from '@/lib/i18n'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'
import NorthIndianChart from '@/components/chart/NorthIndianChart'
import SouthIndianChart from '@/components/chart/SouthIndianChart'
import { MapPin, User, ChevronRight, Plus, Star, Clock, RefreshCw, Download } from 'lucide-react'

const EMPTY: DateValue = { dd:0, mm:0, yyyy:0 }
type ChartView = 'north'|'south'|'planets'|'dasha'

export default function ChartPage() {
  const router = useRouter()
  const { token, setHoroId, setRedirectAfterLogin } = useStore()
  const t       = useT()
  const gPlanet = usePlanetName()
  const gSign   = useSignName()

  const [name, setName]   = useState('')
  const [dob,  setDob]    = useState<DateValue>(EMPTY)
  const [place, setPlace] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr]     = useState('')
  const [saved, setSaved] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [view, setView]   = useState<ChartView>('north')

  const loadSaved = useCallback(async () => {
    if (!token) return
    try {
      const res = await listCharts()
      setSaved(Array.isArray(res) ? res : (res as any)?.data || [])
    } catch {}
  }, [token])

  useEffect(() => { loadSaved() }, [loadSaved])

  const openSaved = async (horoId: string) => {
    setLoading(true); setErr('')
    try {
      const res = await getChart(horoId)
      const data = (res as any)?.data || res
      if (data) { setResult(data); setHoroId(horoId); localStorage.setItem('vh_horoid', horoId) }
    } catch { setErr('Could not load chart') }
    setLoading(false)
  }

  const handleGenerate = async () => {
    if (!dob.dd||!dob.mm||!dob.yyyy) { setErr('Enter date of birth'); return }
    if (!place.trim()) { setErr('Enter place of birth'); return }
    if (!token) { setRedirectAfterLogin('/chart'); router.push('/signup'); return }
    setLoading(true); setErr(''); setResult(null)
    try {
      const { hour, minute } = dob.unknownTime
        ? { hour:12, minute:0 } : to24Hour(dob.hr||12, dob.mi||0, dob.ap||'AM')
      const res = await calculateChart({
        PersonName: name.trim()||'My Chart', Year:dob.yyyy, Month:dob.mm, Day:dob.dd,
        Hour:hour, Minute:minute, Second:0, PlaceName:place,
        UtcOffsetHours:5.5, AyanamsaType:'Lahiri',
      })
      const data = (res as any)?.data?.data || (res as any)?.data
      if (data) {
        setResult(data)
        const id = data.horoscopeId||data.id
        if (id) { setHoroId(id); localStorage.setItem('vh_horoid', id) }
        await loadSaved()
      } else setErr((res as any)?.data?.message||'Chart calculation failed')
    } catch(e:any) { setErr(e?.response?.data?.message||'Chart calculation failed') }
    setLoading(false)
  }

  const planets = result?.planets || result?.Planets || []
  const dashas  = result?.vimshottariDasa || result?.VimshottariDasa || []
  const ascNum  = result?.ascendant ?? result?.Ascendant ?? 0
  const lagna   = result?.ascendantName||result?.AscendantName||'—'
  const moon    = planets.find((p:any)=>(p.planet||p.Planet)==='Moon')
  const moonRasi= moon?.rasiName||moon?.RasiName||'—'
  const naksh   = moon?.nakshatraName||moon?.NakshatraName||'—'
  const curDasha= dashas[0]?.planet||dashas[0]?.Planet||'—'
  const scoreC  = (s:number)=>s>=75?'#16A34A':s>=60?'#B45309':'#DC2626'

  const tabs: {key:ChartView,label:string}[] = [
    {key:'north',label:'North'},
    {key:'south',label:'South'},
    {key:'planets',label:'Planets'},
    {key:'dasha',label:'Dasha'},
  ]

  return (
    <div style={{maxWidth:'1400px',margin:'0 auto',padding:'16px'}}>
      <div style={{marginBottom:'16px'}}>
        <h1 style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'20px',color:'var(--acc)'}}>
          {t('chart.title')}
        </h1>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:'16px'}} className="chart-grid">

        {/* Sidebar */}
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <button onClick={()=>{setResult(null);setErr('')}}
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',
              padding:'9px',borderRadius:'10px',border:'2px dashed var(--gold)',
              background:'rgba(196,146,42,.06)',color:'var(--gold)',
              cursor:'pointer',fontFamily:'Cinzel,serif',fontSize:'12px',fontWeight:600}}>
            <Plus style={{width:'14px',height:'14px'}}/> New Chart
          </button>

          <div className="card">
            <div className="card-hd">
              <User style={{width:'12px',height:'12px',color:'var(--gold)'}}/>
              <span className="card-title" style={{fontSize:'11px'}}>{t('chart.section')}</span>
            </div>
            <div className="card-bd" style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <div>
                <label className="label" style={{fontSize:'10px'}}>{t('chart.name')}</label>
                <input className="input" style={{fontSize:'11px',padding:'6px 9px'}}
                  value={name} onChange={e=>setName(e.target.value)} placeholder="Name"/>
              </div>
              <div>
                <label className="label" style={{fontSize:'10px'}}>{t('chart.dob')}</label>
                <DatePicker value={dob} onChange={setDob} showTime showUnknown prefix="c"/>
              </div>
              <div>
                <label className="label" style={{fontSize:'10px'}}>
                  <MapPin style={{width:'9px',height:'9px',display:'inline',marginRight:'2px'}}/>
                  {t('chart.place')}
                </label>
                <input className="input" style={{fontSize:'11px',padding:'6px 9px'}}
                  value={place} onChange={e=>setPlace(e.target.value)} placeholder="City..."/>
              </div>
              {err && <div style={{fontSize:'10px',color:'var(--bad,#7A1F1F)',
                background:'rgba(122,31,31,.08)',padding:'6px',borderRadius:'6px'}}>{err}</div>}
              <button onClick={handleGenerate} disabled={loading} className="btn-primary"
                style={{fontSize:'11px',padding:'8px',display:'flex',alignItems:'center',
                  justifyContent:'center',gap:'5px'}}>
                {loading
                  ? <><RefreshCw style={{width:'11px',height:'11px'}}/> Calculating...</>
                  : <>{t('chart.generate')} <ChevronRight style={{width:'12px',height:'12px'}}/></>}
              </button>
            </div>
          </div>

          {token && (
            <div className="card">
              <div className="card-hd">
                <Star style={{width:'12px',height:'12px',color:'var(--gold)'}}/>
                <span className="card-title" style={{fontSize:'11px'}}>Saved Charts</span>
                <span style={{marginLeft:'auto',fontSize:'10px',color:'var(--txm)'}}>{saved.length}</span>
              </div>
              <div style={{maxHeight:'280px',overflowY:'auto'}}>
                {saved.length===0
                  ? <div style={{padding:'10px',fontSize:'11px',color:'var(--txm)',textAlign:'center'}}>
                      No saved charts yet
                    </div>
                  : saved.map((c:any)=>{
                    const id=c.horoscopeId||c.HoroscopeId
                    return (
                      <button key={id} onClick={()=>openSaved(id)}
                        style={{width:'100%',display:'flex',flexDirection:'column',
                          alignItems:'flex-start',padding:'9px 12px',border:'none',
                          borderBottom:'1px solid var(--bd)',background:'none',
                          cursor:'pointer',textAlign:'left'}}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                        onMouseLeave={e=>e.currentTarget.style.background='none'}>
                        <div style={{fontSize:'12px',fontWeight:600,color:'var(--tx)',
                          fontFamily:'Cinzel,serif'}}>{c.personName||c.PersonName}</div>
                        <div style={{fontSize:'10px',color:'var(--txm)',marginTop:'1px'}}>
                          {(c.ascendantName||c.AscendantName)
                            ? `${c.ascendantName||c.AscendantName} · ${c.moonRasi||c.MoonRasi||''}`
                            : c.placeName||c.PlaceName||''}
                        </div>
                        {(c.nakshatraName||c.NakshatraName) && (
                          <div style={{fontSize:'10px',color:'var(--gold)',marginTop:'1px'}}>
                            {c.nakshatraName||c.NakshatraName} · {c.currentDasha||c.CurrentDasha||''} MD
                          </div>
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Main panel */}
        <div>
          {result ? (
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>

              {/* Summary */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px'}}>
                {[
                  {label:'Lagna',     val:gSign(lagna)},
                  {label:'Moon Rasi', val:gSign(moonRasi)},
                  {label:'Nakshatra', val:naksh},
                  {label:'Dasha',     val:gPlanet(curDasha)+' MD'},
                ].map(s=>(
                  <div key={s.label} className="card" style={{padding:'12px',textAlign:'center'}}>
                    <div style={{fontSize:'9px',fontWeight:700,textTransform:'uppercase',
                      letterSpacing:'.06em',color:'var(--txm)',marginBottom:'4px'}}>{s.label}</div>
                    <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'13px',
                      color:'var(--acc)'}}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Tab bar */}
              <div style={{display:'flex',gap:'4px',borderBottom:'2px solid var(--bd)',paddingBottom:'0'}}>
                {tabs.map(tab=>(
                  <button key={tab.key} onClick={()=>setView(tab.key)}
                    style={{padding:'7px 16px',fontSize:'12px',fontWeight:600,border:'none',
                      background:'none',cursor:'pointer',fontFamily:'Cinzel,serif',
                      color:view===tab.key?'var(--acc)':'var(--txm)',
                      borderBottom:view===tab.key?'2px solid var(--gold)':'2px solid transparent',
                      marginBottom:'-2px'}}>
                    {tab.label}
                  </button>
                ))}
                <div style={{marginLeft:'auto'}}>
                  <button onClick={()=>window.print()}
                    style={{display:'flex',alignItems:'center',gap:'5px',padding:'6px 12px',
                      borderRadius:'6px',border:'1px solid var(--bd)',background:'var(--bg2)',
                      cursor:'pointer',fontSize:'11px',color:'var(--tx2)',fontFamily:'inherit'}}>
                    <Download style={{width:'11px',height:'11px'}}/> PDF
                  </button>
                </div>
              </div>

              {/* Chart views */}
              {view==='north' && (
                <div className="card" style={{padding:'20px',display:'flex',justifyContent:'center'}}>
                  <div style={{maxWidth:'360px',width:'100%'}}>
                    <div style={{textAlign:'center',marginBottom:'12px',fontSize:'11px',
                      color:'var(--txm)',fontWeight:600}}>
                      North Indian Chart — {result.personName||result.PersonName||''}
                    </div>
                    <NorthIndianChart planets={planets} ascendant={ascNum}/>
                  </div>
                </div>
              )}

              {view==='south' && (
                <div className="card" style={{padding:'20px',display:'flex',justifyContent:'center'}}>
                  <div style={{maxWidth:'360px',width:'100%'}}>
                    <div style={{textAlign:'center',marginBottom:'12px',fontSize:'11px',
                      color:'var(--txm)',fontWeight:600}}>
                      South Indian Chart — {result.personName||result.PersonName||''}
                    </div>
                    <SouthIndianChart planets={planets} ascendant={ascNum}/>
                  </div>
                </div>
              )}

              {view==='planets' && (
                <div className="card">
                  <div className="card-hd"><span className="card-title">Planet Positions</span></div>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                      <thead>
                        <tr style={{borderBottom:'2px solid var(--bd)'}}>
                          {['Planet','Rasi','House','Degrees','Nakshatra','Pada','Retro','Dignity'].map(h=>(
                            <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:'9px',
                              fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',
                              color:'var(--txm)',whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {planets.map((p:any,i:number)=>{
                          const pname  = p.planet||p.Planet||''
                          const rasi   = p.rasiName||p.RasiName||''
                          const house  = p.house||p.House||'—'
                          const lon    = p.longitude||p.Longitude||0
                          const deg    = Math.floor(lon%30)
                          const min    = Math.floor(((lon%30)%1)*60)
                          const sec    = Math.floor(((((lon%30)%1)*60)%1)*60)
                          const degStr = `${deg}°${min}'${sec}"`
                          const naksh2 = p.nakshatraName||p.NakshatraName||'—'
                          const pada   = p.pada||p.Pada||'—'
                          const retro  = p.isRetrograde||p.IsRetrograde
                          const dign   = p.dignity||p.Dignity||''
                          const dignColor = dign==='Exalted'?'#16A34A':dign==='Debilitated'?'#DC2626':
                            dign==='Own Sign'?'#2563EB':'var(--txm)'
                          return (
                            <tr key={i} style={{borderBottom:'1px solid var(--bd)',
                              background:i%2===0?'transparent':'var(--bg2)'}}>
                              <td style={{padding:'7px 10px',fontWeight:700,color:'var(--acc)',
                                fontFamily:'Cinzel,serif',whiteSpace:'nowrap'}}>{gPlanet(pname)}</td>
                              <td style={{padding:'7px 10px'}}>{gSign(rasi)}</td>
                              <td style={{padding:'7px 10px',textAlign:'center',color:'var(--txm)'}}>{house}</td>
                              <td style={{padding:'7px 10px',color:'var(--txm)',fontVariantNumeric:'tabular-nums',
                                whiteSpace:'nowrap'}}>{degStr}</td>
                              <td style={{padding:'7px 10px',whiteSpace:'nowrap'}}>{naksh2}</td>
                              <td style={{padding:'7px 10px',textAlign:'center',color:'var(--txm)'}}>{pada}</td>
                              <td style={{padding:'7px 10px',textAlign:'center'}}>
                                {retro&&<span style={{color:'#F87171',fontWeight:700}}>℞</span>}
                              </td>
                              <td style={{padding:'7px 10px',fontSize:'11px',color:dignColor,
                                fontWeight:dign?600:400}}>{dign||'—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {view==='dasha' && (
                <div className="card">
                  <div className="card-hd">
                    <Clock style={{width:'13px',height:'13px',color:'var(--gold)'}}/>
                    <span className="card-title">Vimshottari Dasha</span>
                  </div>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                      <thead>
                        <tr style={{borderBottom:'2px solid var(--bd)'}}>
                          {['MD Lord','AD Lords (first 3)','Start','End','Duration'].map(h=>(
                            <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:'9px',
                              fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',
                              color:'var(--txm)',whiteSpace:'nowrap'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dashas.map((d:any,i:number)=>{
                          const planet = d.planet||d.Planet||''
                          const start  = d.startAt||d.StartAt||d.start||''
                          const end    = d.endAt||d.EndAt||d.end||''
                          const ads    = d.antaraDasas||d.AntaraDasas||[]
                          const sy = start?new Date(start).getFullYear():'—'
                          const ey = end?new Date(end).getFullYear():'—'
                          const yrs = (start&&end)
                            ? ((new Date(end).getTime()-new Date(start).getTime())/(365.25*24*3600*1000)).toFixed(1)
                            : '—'
                          const now = start&&end&&new Date(start)<=new Date()&&new Date()<=new Date(end)
                          return (
                            <tr key={i} style={{
                              borderBottom:'1px solid var(--bd)',
                              background:now?'rgba(196,146,42,.08)':i%2===0?'transparent':'var(--bg2)'}}>
                              <td style={{padding:'8px 10px',fontWeight:now?700:500,
                                color:now?'var(--gold)':'var(--acc)',fontFamily:'Cinzel,serif',
                                whiteSpace:'nowrap'}}>
                                {gPlanet(planet)}
                                {now&&<span style={{marginLeft:'6px',fontSize:'8px',
                                  background:'var(--gold)',color:'#fff',padding:'1px 4px',
                                  borderRadius:'3px'}}>NOW</span>}
                              </td>
                              <td style={{padding:'8px 10px',fontSize:'11px',color:'var(--txm)'}}>
                                {ads.slice(0,3).map((a:any)=>gPlanet(a.planet||a.Planet||'')).join(' · ')}
                              </td>
                              <td style={{padding:'8px 10px',color:'var(--txm)',
                                fontVariantNumeric:'tabular-nums'}}>{sy}</td>
                              <td style={{padding:'8px 10px',color:'var(--txm)',
                                fontVariantNumeric:'tabular-nums'}}>{ey}</td>
                              <td style={{padding:'8px 10px',color:'var(--txm)'}}>{yrs}y</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="card" style={{padding:'60px 32px',display:'flex',flexDirection:'column',
              alignItems:'center',justifyContent:'center',textAlign:'center',gap:'16px',minHeight:'400px'}}>
              <div style={{fontSize:'56px'}}>🌟</div>
              <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'18px',color:'var(--acc)'}}>
                Vedic Birth Chart
              </div>
              <p style={{fontSize:'13px',color:'var(--txm)',maxWidth:'280px',lineHeight:1.7}}>
                Enter birth details on the left to generate your Vedic chart with North/South Indian styles, planet positions and dasha timeline.
              </p>
              {!token&&(
                <button onClick={()=>{setRedirectAfterLogin('/chart');router.push('/signup')}}
                  className="btn-primary" style={{padding:'10px 24px',fontFamily:'Cinzel,serif'}}>
                  Sign up free to get started
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
