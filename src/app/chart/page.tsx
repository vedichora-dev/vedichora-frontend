'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { calculateChart, listCharts, getChart } from '@/api'
import { to24Hour } from '@/lib/utils'
import { useT, usePlanetName, useSignName } from '@/lib/i18n'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'
import { MapPin, User, ChevronRight, Plus, Star, Clock, RefreshCw } from 'lucide-react'

const EMPTY: DateValue = { dd:0, mm:0, yyyy:0 }

export default function ChartPage() {
  const router = useRouter()
  const { token, setHoroId, setRedirectAfterLogin } = useStore()
  const t = useT()
  const getPlanet = usePlanetName()
  const getSign   = useSignName()

  // Form state
  const [name, setName]   = useState('')
  const [dob,  setDob]    = useState<DateValue>(EMPTY)
  const [place, setPlace] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr]     = useState('')

  // Saved charts
  const [saved, setSaved]   = useState<any[]>([])
  const [loadingSaved, setLoadingSaved] = useState(false)

  // Current chart result
  const [result, setResult] = useState<any>(null)
  const [mode, setMode]     = useState<'new'|'saved'>('new')

  // Load saved charts on mount
  const loadSaved = useCallback(async () => {
    if (!token) return
    setLoadingSaved(true)
    try {
      const res = await listCharts()
      setSaved(res.data || [])
    } catch { }
    setLoadingSaved(false)
  }, [token])

  useEffect(() => { loadSaved() }, [loadSaved])

  // Load a saved chart by ID
  const openSaved = async (horoId: string) => {
    if (!horoId) return
    setLoading(true); setErr('')
    try {
      const res = await getChart(horoId)
      const data = res.data || res
      if (data) {
        setResult(data)
        setHoroId(horoId)
        localStorage.setItem('vh_horoid', horoId)
        setMode('saved')
      }
    } catch (e: any) {
      setErr('Could not load chart — ' + (e.message || 'try again'))
    }
    setLoading(false)
  }

  // Calculate new chart
  const handleGenerate = async () => {
    if (!dob.dd || !dob.mm || !dob.yyyy) { setErr('Please enter date of birth'); return }
    if (!place.trim()) { setErr('Please enter place of birth'); return }
    if (!token) {
      setRedirectAfterLogin('/chart')
      router.push('/signup')
      return
    }
    setLoading(true); setErr(''); setResult(null)
    try {
      const { hour, minute } = dob.unknownTime
        ? { hour:12, minute:0 }
        : to24Hour(dob.hr||12, dob.mi||0, dob.ap||'AM')
      const res = await calculateChart({
        PersonName: name.trim() || 'My Chart',
        Year: dob.yyyy, Month: dob.mm, Day: dob.dd,
        Hour: hour, Minute: minute, Second: 0,
        PlaceName: place, UtcOffsetHours: 5.5, AyanamsaType: 'Lahiri',
      })
      const data = res.data?.data || res.data
      if (data) {
        setResult(data)
        setMode('new')
        const id = data.horoscopeId || data.id
        if (id) {
          setHoroId(id)
          localStorage.setItem('vh_horoid', id)
        }
        await loadSaved() // refresh sidebar
      } else {
        setErr(res.data?.message || 'Chart calculation failed')
      }
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Chart calculation failed')
    }
    setLoading(false)
  }

  const planets = result?.planets || []
  const dashas  = result?.vimshottariDasa || result?.VimshottariDasa || []
  const lagna   = result?.ascendantName || result?.AscendantName || '—'
  const moon    = planets.find((p:any) => p.planet === 'Moon' || p.Planet === 'Moon')
  const moonSign = moon?.rasiName || moon?.RasiName || '—'
  const naksh   = moon?.nakshatraName || moon?.NakshatraName || '—'
  const currentDasha = dashas[0]?.planet || dashas[0]?.Planet || '—'

  return (
    <div style={{maxWidth:'1400px', margin:'0 auto', padding:'16px'}}>

      {/* Page header */}
      <div style={{marginBottom:'20px', display:'flex', alignItems:'center', gap:'12px'}}>
        <div>
          <h1 style={{fontFamily:'Cinzel,serif', fontWeight:700, fontSize:'22px', color:'var(--acc)'}}>
            {t('chart.title')}
          </h1>
          <p style={{fontSize:'13px', color:'var(--txm)', marginTop:'2px'}}>{t('chart.subtitle')}</p>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'240px 1fr', gap:'20px'}} className="chart-grid">

        {/* ── LEFT SIDEBAR: saved charts + new form ── */}
        <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>

          {/* New chart button */}
          <button
            onClick={() => { setResult(null); setMode('new'); setErr('') }}
            style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
              padding:'10px', borderRadius:'10px', border:'2px dashed var(--gold)',
              background:'rgba(196,146,42,.06)', color:'var(--gold)',
              cursor:'pointer', fontFamily:'Cinzel,serif', fontSize:'13px', fontWeight:600,
            }}>
            <Plus style={{width:'16px',height:'16px'}} /> New Chart
          </button>

          {/* Birth detail form */}
          <div className="card">
            <div className="card-hd">
              <User style={{width:'14px',height:'14px',color:'var(--gold)'}} />
              <span className="card-title" style={{fontSize:'12px'}}>{t('chart.section')}</span>
            </div>
            <div className="card-bd" style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              <div>
                <label className="label" style={{fontSize:'11px'}}>{t('chart.name')}</label>
                <input className="input" style={{fontSize:'12px',padding:'7px 10px'}}
                  value={name} onChange={e=>setName(e.target.value)}
                  placeholder={t('chart.name_placeholder')} />
              </div>
              <div>
                <label className="label" style={{fontSize:'11px'}}>{t('chart.dob')}</label>
                <DatePicker value={dob} onChange={setDob} showTime showUnknown prefix="c" />
              </div>
              <div>
                <label className="label" style={{fontSize:'11px'}}>
                  <MapPin style={{width:'10px',height:'10px',display:'inline',marginRight:'3px'}} />
                  {t('chart.place')}
                </label>
                <input className="input" style={{fontSize:'12px',padding:'7px 10px'}}
                  value={place} onChange={e=>setPlace(e.target.value)}
                  placeholder={t('chart.place_placeholder')} />
              </div>

              {err && <div style={{fontSize:'11px',color:'var(--bad,#7A1F1F)',
                background:'rgba(122,31,31,.08)',padding:'8px',borderRadius:'6px'}}>{err}</div>}

              {!token && <div style={{fontSize:'11px',color:'var(--warn,#9C6B14)',
                background:'rgba(156,107,20,.08)',padding:'8px',borderRadius:'6px'}}>
                🔒 Sign in to generate and save charts
              </div>}

              <button onClick={handleGenerate} disabled={loading}
                className="btn-primary" style={{fontSize:'12px',padding:'9px',
                  display:'flex',alignItems:'center',justifyContent:'center',gap:'6px'}}>
                {loading
                  ? <><RefreshCw style={{width:'12px',height:'12px',animation:'spin 1s linear infinite'}} /> Calculating...</>
                  : <>{t('chart.generate')} <ChevronRight style={{width:'14px',height:'14px'}} /></>}
              </button>
            </div>
          </div>

          {/* Saved charts list */}
          {token && (
            <div className="card">
              <div className="card-hd">
                <Star style={{width:'14px',height:'14px',color:'var(--gold)'}} />
                <span className="card-title" style={{fontSize:'12px'}}>Saved Charts</span>
                <span style={{marginLeft:'auto',fontSize:'10px',color:'var(--txm)'}}>{saved.length}</span>
              </div>
              <div style={{maxHeight:'320px',overflowY:'auto'}}>
                {loadingSaved ? (
                  <div style={{padding:'12px',fontSize:'12px',color:'var(--txm)',textAlign:'center'}}>Loading...</div>
                ) : saved.length === 0 ? (
                  <div style={{padding:'12px',fontSize:'12px',color:'var(--txm)',textAlign:'center'}}>No saved charts yet</div>
                ) : saved.map((c:any) => (
                  <button key={c.horoscopeId || c.HoroscopeId}
                    onClick={() => openSaved(c.horoscopeId || c.HoroscopeId)}
                    style={{
                      width:'100%', display:'flex', flexDirection:'column', alignItems:'flex-start',
                      padding:'10px 14px', border:'none', borderBottom:'1px solid var(--bd)',
                      background:'none', cursor:'pointer', textAlign:'left',
                      transition:'background .15s',
                    }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                    onMouseLeave={e=>e.currentTarget.style.background='none'}>
                    <div style={{fontSize:'13px',fontWeight:600,color:'var(--tx)',
                      fontFamily:'Cinzel,serif'}}>{c.personName || c.PersonName}</div>
                    <div style={{fontSize:'10px',color:'var(--txm)',marginTop:'2px'}}>
                      {c.ascendantName || c.AscendantName
                        ? `${c.ascendantName||c.AscendantName} lagna · ${c.moonRasi||c.MoonRasi||''}`
                        : `${c.placeName||c.PlaceName||''}`}
                    </div>
                    {(c.nakshatraName||c.NakshatraName) && (
                      <div style={{fontSize:'10px',color:'var(--gold)',marginTop:'1px'}}>
                        {c.nakshatraName||c.NakshatraName} nakshatra · {c.currentDasha||c.CurrentDasha||''} MD
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: chart display ── */}
        <div>
          {result ? (
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>

              {/* Summary strip */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px'}}>
                {[
                  {label:'Lagna',     val: getSign(lagna)},
                  {label:'Moon Rasi', val: getSign(moonSign)},
                  {label:'Nakshatra', val: naksh},
                  {label:'Current Dasha', val: getPlanet(currentDasha)},
                ].map(s => (
                  <div key={s.label} className="card" style={{padding:'12px',textAlign:'center'}}>
                    <div style={{fontSize:'10px',fontWeight:700,textTransform:'uppercase',
                      letterSpacing:'.06em',color:'var(--txm)',marginBottom:'4px'}}>{s.label}</div>
                    <div style={{fontFamily:'Cinzel,serif',fontWeight:700,
                      fontSize:'14px',color:'var(--acc)'}}>{s.val}</div>
                  </div>
                ))}
              </div>

              {/* Planet table */}
              <div className="card">
                <div className="card-hd"><span className="card-title">Planet Positions</span></div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
                    <thead>
                      <tr style={{borderBottom:'2px solid var(--bd)'}}>
                        {['Planet','Rasi','House','Degrees','Nakshatra','Pada','Retro','Status'].map(h => (
                          <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:'10px',
                            fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',
                            color:'var(--txm)',whiteSpace:'nowrap'}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {planets.map((p:any, i:number) => {
                        const pname  = p.planet || p.Planet || ''
                        const rasi   = p.rasiName || p.RasiName || ''
                        const house  = p.house || p.House || (i+1)
                        const deg    = typeof(p.longitude||p.Longitude) === 'number'
                          ? `${Math.floor((p.longitude||p.Longitude)%30)}°${Math.floor(((p.longitude||p.Longitude)%1)*60)}'`
                          : '—'
                        const naksh2 = p.nakshatraName || p.NakshatraName || '—'
                        const pada   = p.pada || p.Pada || '—'
                        const retro  = p.isRetrograde || p.IsRetrograde
                        const status = p.dignity || p.Dignity || ''
                        return (
                          <tr key={i} style={{borderBottom:'1px solid var(--bd)',
                            background: i%2===0 ? 'transparent' : 'var(--bg2)'}}>
                            <td style={{padding:'8px 12px',fontWeight:600,color:'var(--acc)',
                              fontFamily:'Cinzel,serif',whiteSpace:'nowrap'}}>
                              {getPlanet(pname)}
                            </td>
                            <td style={{padding:'8px 12px',color:'var(--tx)'}}>{getSign(rasi)}</td>
                            <td style={{padding:'8px 12px',color:'var(--txm)',textAlign:'center'}}>{house}</td>
                            <td style={{padding:'8px 12px',color:'var(--txm)',fontVariantNumeric:'tabular-nums'}}>{deg}</td>
                            <td style={{padding:'8px 12px',color:'var(--tx)',whiteSpace:'nowrap'}}>{naksh2}</td>
                            <td style={{padding:'8px 12px',color:'var(--txm)',textAlign:'center'}}>{pada}</td>
                            <td style={{padding:'8px 12px',textAlign:'center'}}>
                              {retro && <span style={{color:'#F87171',fontWeight:700,fontSize:'11px'}}>℞</span>}
                            </td>
                            <td style={{padding:'8px 12px',fontSize:'11px',color:
                              status==='Exalted'?'#16A34A':status==='Debilitated'?'#DC2626':
                              status==='Own Sign'?'#2563EB':'var(--txm)'}}>{status}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vimshottari Dasha timeline */}
              {dashas.length > 0 && (
                <div className="card">
                  <div className="card-hd">
                    <Clock style={{width:'14px',height:'14px',color:'var(--gold)'}} />
                    <span className="card-title">Vimshottari Dasha Timeline</span>
                  </div>
                  <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
                      <thead>
                        <tr style={{borderBottom:'2px solid var(--bd)'}}>
                          {['MD Lord','AD Lords','Start','End','Years'].map(h => (
                            <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:'10px',
                              fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',
                              color:'var(--txm)'}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {dashas.map((d:any, i:number) => {
                          const planet = d.planet || d.Planet || ''
                          const start  = d.startAt || d.StartAt || d.start || ''
                          const end    = d.endAt   || d.EndAt   || d.end   || ''
                          const ads    = d.antaraDasas || d.AntaraDasas || []
                          const startY = start ? new Date(start).getFullYear() : '—'
                          const endY   = end   ? new Date(end).getFullYear()   : '—'
                          const years  = (start && end)
                            ? ((new Date(end).getTime()-new Date(start).getTime())/(365.25*24*3600*1000)).toFixed(1)
                            : '—'
                          const isCurrent = start && end &&
                            new Date(start) <= new Date() && new Date() <= new Date(end)
                          return (
                            <tr key={i} style={{
                              borderBottom:'1px solid var(--bd)',
                              background: isCurrent ? 'rgba(196,146,42,.1)' : i%2===0 ? 'transparent' : 'var(--bg2)',
                            }}>
                              <td style={{padding:'8px 12px',fontWeight:isCurrent?700:500,
                                color:isCurrent?'var(--gold)':'var(--acc)',fontFamily:'Cinzel,serif'}}>
                                {getPlanet(planet)}
                                {isCurrent && <span style={{marginLeft:'6px',fontSize:'9px',
                                  background:'var(--gold)',color:'#fff',
                                  padding:'1px 5px',borderRadius:'4px'}}>NOW</span>}
                              </td>
                              <td style={{padding:'8px 12px',fontSize:'11px',color:'var(--txm)'}}>
                                {ads.slice(0,3).map((a:any)=>getPlanet(a.planet||a.Planet||'')).join(' · ')}
                                {ads.length>3 && ' ...'}
                              </td>
                              <td style={{padding:'8px 12px',color:'var(--txm)',
                                fontVariantNumeric:'tabular-nums'}}>{startY}</td>
                              <td style={{padding:'8px 12px',color:'var(--txm)',
                                fontVariantNumeric:'tabular-nums'}}>{endY}</td>
                              <td style={{padding:'8px 12px',color:'var(--txm)'}}>{years}y</td>
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
            <div className="card" style={{padding:'60px 32px',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
              textAlign:'center',gap:'16px',minHeight:'400px'}}>
              <div style={{fontSize:'56px'}}>🌟</div>
              <div className="font-cinzel font-semibold" style={{color:'var(--acc)',fontSize:'18px'}}>
                {t('chart.title')}
              </div>
              <p style={{fontSize:'13px',color:'var(--txm)',maxWidth:'300px',lineHeight:1.7}}>
                Enter birth details on the left to generate your Vedic chart, or click a saved chart below.
              </p>
              {!token && (
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
