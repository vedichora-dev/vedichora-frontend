'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { calculateChart } from '@/api'
import { to24Hour } from '@/lib/utils'
import { useT, usePlanetName, useSignName } from '@/lib/i18n'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'
import PlanetTable from '@/components/chart/PlanetTable'
import NorthChart from '@/components/chart/NorthChart'
import { MapPin, User, ChevronRight, Download, Save } from 'lucide-react'

const EMPTY: DateValue = { dd:0, mm:0, yyyy:0 }

export default function ChartPage() {
  const router = useRouter()
  const { token, setHoroId, chartMode, setRedirectAfterLogin } = useStore()
  const t = useT()
  const getPlanet = usePlanetName()
  const getSign = useSignName()

  const [name, setName]     = useState('')
  const [dob, setDob]       = useState<DateValue>(EMPTY)
  const [place, setPlace]   = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr]       = useState('')
  const [result, setResult] = useState<any>(null)
  const [saved, setSaved]   = useState(false)

  const handleGenerate = async () => {
    if (!dob.dd || !dob.mm || !dob.yyyy) { setErr(t('chart.generate') + ' — ' + t('chart.day')); return }
    if (!place.trim()) { setErr(t('chart.place')); return }

    if (!token) {
      setRedirectAfterLogin('/chart')
      sessionStorage.setItem('pending_chart', JSON.stringify({ dob, place, name }))
      router.push('/signup')
      return
    }

    setLoading(true); setErr('')
    try {
      const { hour, minute } = dob.unknownTime
        ? { hour:12, minute:0 }
        : to24Hour(dob.hr||12, dob.mi||0, dob.ap||'AM')

      const res = await calculateChart({
        PersonName: name || t('chart.title'),
        Year: dob.yyyy, Month: dob.mm, Day: dob.dd,
        Hour: hour, Minute: minute, Second: 0,
        PlaceName: place,
        UtcOffsetHours: 5.5,
        AyanamsaType: 'Lahiri',
      })
      const data = res.data?.data
      if (data) {
        setResult(data)
        const id = data.horoscopeId || data.id
        if (id) { setHoroId(id); localStorage.setItem('vh_horoid', id) }
      } else {
        setErr(res.data?.message || 'Chart calculation failed')
      }
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Chart calculation failed — please check your details')
    } finally { setLoading(false) }
  }

  // Restore pending chart after login
  if (typeof window !== 'undefined' && token) {
    const pending = sessionStorage.getItem('pending_chart')
    if (pending && !result && !loading) {
      try {
        const saved = JSON.parse(pending)
        sessionStorage.removeItem('pending_chart')
        if (saved.dob) {
          setDob(saved.dob)
          if (saved.place) setPlace(saved.place)
          if (saved.name) setName(saved.name)
          setTimeout(handleGenerate, 200)
        }
      } catch {}
    }
  }

  const stats = result ? [
    { label: t('chart.lagna'),     value: getSign(result.ascendantName||result.lagna||'—') },
    { label: t('chart.rashi'),     value: getSign(result.moonRasi||result.moonSign||'—') },
    { label: t('chart.nakshatra'), value: result.nakshatra||result.planets?.find((p:any)=>p.planet==='Moon')?.nakshatraName||'—' },
    { label: t('chart.dasha'),     value: result.currentDashaLord||result.vimshottariDasa?.[0]?.planet||'—' },
  ] : []

  // Translate planets in result
  const translatedPlanets = result?.planets?.map((p: any) => ({
    ...p,
    planet: getPlanet(p.planet || p.Planet || ''),
    rasiName: getSign(p.rasiName || p.rasi || ''),
    nakshatraName: p.nakshatraName || p.nakshatra || '—',
  })) || []

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>{t('chart.title')}</h1>
        <p>{t('chart.subtitle')}</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:'24px'}} className="lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-hd">
              <User style={{width:'16px',height:'16px',color:'var(--gold)'}} />
              <span className="card-title">{t('chart.section')}</span>
            </div>
            <div className="card-bd" style={{display:'flex',flexDirection:'column',gap:'20px'}}>
              <div>
                <label className="label">{t('chart.name')}</label>
                <input className="input" value={name} onChange={e=>setName(e.target.value)}
                  placeholder={t('chart.name_placeholder')} />
              </div>
              <div>
                <label className="label">{t('chart.dob')}</label>
                <DatePicker value={dob} onChange={setDob} showTime showUnknown prefix="c" />
              </div>
              <div>
                <label className="label">
                  <MapPin style={{width:'12px',height:'12px',display:'inline',marginRight:'4px'}} />
                  {t('chart.place')}
                </label>
                <input className="input" value={place} onChange={e=>setPlace(e.target.value)}
                  placeholder={t('chart.place_placeholder')} />
              </div>

              {err && (
                <div className="text-sm rounded-lg px-3 py-2" style={{background:'var(--bad-l,#FBEAE6)',color:'var(--bad,#7A1F1F)',border:'1px solid rgba(122,31,31,.2)'}}>
                  {err}
                </div>
              )}

              {!token && (
                <div className="text-xs rounded-lg px-3 py-2.5" style={{background:'var(--warn-l,#FBF0DC)',color:'var(--warn,#9C6B14)',border:'1px solid rgba(156,107,20,.2)'}}>
                  🔒 {t('chart.signin_required')}
                </div>
              )}

              <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full font-cinzel"
                style={{padding:'12px',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
                {loading
                  ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> {t('chart.generating')}</>
                  : <>{t('chart.generate')} <ChevronRight style={{width:'16px',height:'16px'}} /></>
                }
              </button>
            </div>
          </div>
        </div>

        <div style={{gridColumn:'span 3',display:'flex',flexDirection:'column',gap:'20px'}}>
          {result ? (
            <>
              {/* Stat cards */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'12px'}} className="sm:grid-cols-4">
                {stats.map(s => (
                  <div key={s.label} className="card" style={{padding:'16px',textAlign:'center'}}>
                    <div className="text-xs uppercase tracking-wider mb-1.5" style={{color:'var(--txm)',fontSize:'10px',fontWeight:700}}>{s.label}</div>
                    <div className="font-cinzel font-bold" style={{color:'var(--acc)',fontSize:'14px'}}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Chart + Table */}
              <div style={{display:'grid',gridTemplateColumns:'1fr',gap:'20px'}} className="md:grid-cols-2">
                <div className="card">
                  <div className="card-hd">
                    <span className="card-title">{chartMode === 'north' ? 'North Indian' : 'South Indian'} Chart</span>
                    <div style={{display:'flex',gap:'4px',marginLeft:'auto'}}>
                      {['north','south'].map(m=>(
                        <button key={m} style={{padding:'2px 8px',borderRadius:'4px',fontSize:'11px',
                          border:'1px solid var(--bd)',cursor:'pointer',fontFamily:'inherit',
                          background:chartMode===m?'var(--acc)':'transparent',
                          color:chartMode===m?'#fff':'var(--txm)'}}>
                          {m.charAt(0).toUpperCase()+m.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="card-bd">
                    <NorthChart planets={result.planets || []} />
                  </div>
                </div>

                <div className="card">
                  <div className="card-hd"><span className="card-title">Planet Positions</span></div>
                  <PlanetTable planets={translatedPlanets} />
                </div>
              </div>

              {/* Dasha */}
              {result.vimshottariDasa?.length > 0 && (
                <div className="card">
                  <div className="card-hd"><span className="card-title">{t('chart.dasha')} — Vimshottari</span></div>
                  <div className="card-bd" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:'8px'}}>
                    {result.vimshottariDasa.slice(0,8).map((d:any,i:number) => (
                      <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',
                        padding:'8px 12px',borderRadius:'8px',border:'1px solid var(--bd)',background:'var(--bg2)'}}>
                        <span style={{fontSize:'13px',fontWeight:600,color:'var(--acc)'}}>{getPlanet(d.planet)} MD</span>
                        <span style={{fontSize:'11px',color:'var(--txm)'}}>{d.startYear||d.start||''}–{d.endYear||d.end||''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Save + Download */}
              <div style={{display:'flex',gap:'12px',flexWrap:'wrap'}}>
                <button onClick={()=>setSaved(true)} className="btn-ghost" style={{display:'flex',alignItems:'center',gap:'6px',padding:'10px 18px'}}>
                  <Save style={{width:'14px',height:'14px'}} />
                  {saved ? '✓ Saved' : t('chart.save')}
                </button>
                <button onClick={()=>window.print()} className="btn-ghost" style={{display:'flex',alignItems:'center',gap:'6px',padding:'10px 18px'}}>
                  <Download style={{width:'14px',height:'14px'}} />
                  {t('chart.download')}
                </button>
              </div>

              {!token && (
                <div style={{background:'linear-gradient(135deg,rgba(var(--acc-rgb,122,31,31),.05),rgba(196,146,42,.05))',
                  border:'1px solid rgba(196,146,42,.2)',borderRadius:'16px',padding:'24px',textAlign:'center'}}>
                  <div className="font-cinzel font-semibold mb-2" style={{color:'var(--acc)'}}>Save your chart + daily predictions</div>
                  <p style={{fontSize:'13px',color:'var(--txm)',marginBottom:'16px'}}>Navamsha · Shadbala · Full Dasha tree · PDF download</p>
                  <button onClick={()=>{setRedirectAfterLogin('/chart');router.push('/signup')}} className="btn-primary font-cinzel text-sm" style={{padding:'8px 20px'}}>
                    Sign up free
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{padding:'60px 32px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',gap:'16px',minHeight:'280px'}}>
              <div style={{fontSize:'48px'}}>🌟</div>
              <div className="font-cinzel font-semibold" style={{color:'var(--acc)',fontSize:'16px'}}>{t('chart.title')}</div>
              <p style={{fontSize:'13px',color:'var(--txm)',maxWidth:'280px'}}>{t('chart.subtitle')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
