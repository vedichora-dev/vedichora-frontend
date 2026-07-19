'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { chartApi } from '@/api/client'
import {
  calculateChart, calculateChartGuest, listCharts, getChart,
  getShadbala, getAshtakavarga, getVargaChart,
  getSpecialLagnas, getDoshas, downloadPdfBasic,
  getInterpretPersonality, getInterpretCareer,
  getInterpretMarriage, getInterpretCurrentPeriod,
  getChartReportStage1,
} from '@/api'
import { to24Hour } from '@/lib/utils'
import { useT, usePlanetName, useSignName } from '@/lib/i18n'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'
import CityAutocomplete from '@/components/ui/CityAutocomplete'
import NorthIndianChart from '@/components/chart/NorthIndianChart'
import SouthIndianChart from '@/components/chart/SouthIndianChart'
import { User, ChevronRight, Plus, Star, Clock, RefreshCw, Download, AlertTriangle, X } from 'lucide-react'

const EMPTY: DateValue = { dd:0,mm:0,yyyy:0 }
type Tab = 'rasi'|'planets'|'dasha'|'shadbala'|'ashtakavarga'|'arudha'|'dosha'|'interpret'|'report'

export default function ChartPage() {
  const router   = useRouter()
  const { token, language, setHoroId, setRedirectAfterLogin } = useStore()
  const t        = useT()
  const gPlanet  = usePlanetName()
  const gSign    = useSignName()

  // Form
  const [name,  setName]  = useState('')
  const [dob,   setDob]   = useState<DateValue>(EMPTY)
  const [place, setPlace] = useState('')
  const [lat,   setLat]   = useState<number|undefined>()
  const [lng,   setLng]   = useState<number|undefined>()
  const [showForm, setShowForm] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [err,      setErr]      = useState('')

  // Saved charts
  const [saved, setSaved] = useState<any[]>([])

  // Current chart
  const [result,  setResult]  = useState<any>(null)
  const [tab,     setTab]     = useState<Tab>('rasi')
  const [tabData, setTabData] = useState<Record<string,any>>({})
  const [tabLoad, setTabLoad] = useState<Record<string,boolean>>({})
  const [horoId,  setHoroIdL] = useState('')
  const [navData, setNavData] = useState<any>(null)
  const [chartStyle, setChartStyle] = useState<'north'|'south'>('north')

  const loadSaved = useCallback(async () => {
    if (!token) return
    try {
      const res = await listCharts()
      setSaved(Array.isArray(res) ? res : (res as any)?.data || [])
    } catch {}
  }, [token])

  useEffect(() => { loadSaved() }, [loadSaved])

  // Lazy-load tabs (all with lang param)
  useEffect(() => {
    if (!horoId || !result) return
    const STATIC: Tab[] = ['rasi','planets','dasha']
    if (STATIC.includes(tab)) return
    if (tabData[tab] !== undefined) return

    const loaders: Record<string, ()=>Promise<any>> = {
      shadbala: async () => {
        const r = await getShadbala(horoId)
        const d = r?.data?.data ?? r?.data ?? r
        // d should be { planets: [...] } or [...] directly
        return Array.isArray(d) ? { planets: d } : d
      },
      ashtakavarga: async () => {
        const r = await getAshtakavarga(horoId)
        return r?.data?.data ?? r?.data ?? r
      },
      arudha: async () => {
        const r = await getSpecialLagnas(horoId)
        return r?.data?.data ?? r?.data ?? r
      },
      dosha: async () => {
        const r = await getDoshas(horoId)
        return r?.data?.data ?? r?.data ?? r
      },
      interpret:    async () => {
        const [a,b,c,d] = await Promise.all([
          getInterpretPersonality(horoId).catch(()=>null),
          getInterpretCareer(horoId).catch(()=>null),
          getInterpretMarriage(horoId).catch(()=>null),
          getInterpretCurrentPeriod(horoId).catch(()=>null),
        ])
        return { personality:a?.data, career:b?.data, marriage:c?.data, currentPeriod:d?.data }
      },
      report: async () => {
        const [rep, yogas] = await Promise.all([
          getChartReportStage1(horoId).catch(()=>null),
          fetch(process.env.NEXT_PUBLIC_CHART_URL ? process.env.NEXT_PUBLIC_CHART_URL + '/api/chart/' + horoId + '/yogas' : 'https://enchanting-dedication-production.up.railway.app/api/chart/' + horoId + '/yogas',
            {headers: token ? {Authorization: 'Bearer ' + token} : {}}).then(r=>r.json()).catch(()=>null),
        ])
        const repData = rep?.data?.data ?? rep?.data ?? {}
        return { ...repData, yogas: yogas?.data?.data ?? yogas?.data ?? [] }
      },
    }

    if (!loaders[tab]) return
    setTabLoad(l => ({...l,[tab]:true}))
    loaders[tab]().then(d => {
      setTabData(p => ({...p,[tab]:d||null}))
      setTabLoad(l => ({...l,[tab]:false}))
    }).catch(() => {
      setTabData(p => ({...p,[tab]:null}))
      setTabLoad(l => ({...l,[tab]:false}))
    })
  }, [tab, horoId, result, language])

  const openSaved = async (id: string) => {
    setLoading(true); setErr(''); setTabData({}); setNavData(null)
    try {
      const res  = await getChart(id)
      const data = (res as any)?.data || res
      if (data) {
        setResult(data); setHoroIdL(id)
        setHoroId(id); localStorage.setItem('vh_horoid', id)
        setTab('rasi'); setShowForm(false)
        // Load navamsha in background
        getVargaChart(id, 9).then(nr => setNavData(nr?.data)).catch(()=>{})
      }
    } catch { setErr('Could not load chart') }
    setLoading(false)
  }

  const handleGenerate = async () => {
    if (!dob.dd||!dob.mm||!dob.yyyy) { setErr('Enter date of birth'); return }
    if (!place.trim()) { setErr('Enter place of birth'); return }
    setLoading(true); setErr(''); setResult(null); setTabData({}); setNavData(null)
    const isGuest = !token
    try {
      const {hour,minute} = dob.unknownTime
        ? {hour:12,minute:0} : to24Hour(dob.hr||12, dob.mi||0, dob.ap||'AM')
      const payload: any = {
        PersonName: name.trim()||'My Chart',
        Year:dob.yyyy, Month:dob.mm, Day:dob.dd,
        Hour:hour, Minute:minute, Second:0,
        PlaceName: place||'Chennai, India',
        UtcOffsetHours:5.5, AyanamsaType:'Lahiri',
        Language:language,
      }
      // If no lat/lng from city autocomplete selection, try to geocode first
      if (lat) {
        payload.Latitude  = lat
        payload.Longitude = lng
      } else if (place.trim()) {
        // Try to geocode via Photon so backend gets exact coordinates
        try {
          const geoRes = await fetch(
            'https://photon.komoot.io/api/?q=' + encodeURIComponent(place) + '&limit=1&lang=en'
          ).then(r => r.json())
          const feat = geoRes?.features?.[0]
          if (feat?.geometry?.coordinates) {
            payload.Latitude  = feat.geometry.coordinates[1]
            payload.Longitude = feat.geometry.coordinates[0]
          }
        } catch {}
      }
      if (!payload.PlaceName) payload.PlaceName = 'Chennai, India'
      const res = token
        ? await calculateChart(payload)
        : await calculateChartGuest(payload)
      const resObj = (res as any)
      // Check for backend error
      if (resObj?.data?.success === false || resObj?.success === false) {
        const msg = resObj?.data?.message || resObj?.message || 'Calculation failed'
        setErr(msg)
        setLoading(false)
        return
      }
      const data = resObj?.data?.data||resObj?.data
      if (data) {
        const id = data.horoscopeId||data.id||''
        setResult(data); setHoroIdL(id)
        setHoroIdL(id)  // Always set local horoId for tab loading
        if (id && token) { setHoroId(id); localStorage.setItem('vh_horoid',id) }
        setTab('rasi'); setShowForm(false)
        if (token) await loadSaved()
        // Load navamsha
        if (id) getVargaChart(id, 9).then(nr => setNavData(nr?.data)).catch(()=>{})
      } else {
        const errMsg = (res as any)?.data?.message || (res as any)?.message || 'Calculation failed'
        const errDetails = (res as any)?.data?.errors || []
        setErr(Array.isArray(errDetails) && errDetails.length 
          ? errDetails.join(' · ') 
          : errMsg)
      }
    } catch(e:any) {
      const errData = e?.response?.data
      const errMsg = errData?.message || errData?.errors?.join(' · ') || e?.message || 'Calculation failed'
      console.error('Chart error:', errData)
      setErr(errMsg)
    }
    setLoading(false)
  }

  const handlePdf = async () => {
    if (!horoId) return
    try {
      const res = await downloadPdfBasic(horoId)
      const html = typeof res.data==='string' ? res.data : JSON.stringify(res.data,null,2)
      const win = window.open('','_blank')
      if (win) { win.document.write(html); win.document.close(); setTimeout(()=>win.print(),500) }
    } catch { alert('PDF generation failed') }
  }

  const planets = result?.planets||result?.Planets||[]
  const dashas  = result?.vimshottariDasa||result?.VimshottariDasa||[]
  const ascNum  = result?.ascendant??result?.Ascendant??0
  const lagna   = result?.ascendantName||result?.AscendantName||'—'
  const moon    = planets.find((p:any)=>(p.planet||p.Planet)==='Moon')
  const moonRasi= moon?.rasiName||moon?.RasiName||'—'
  const naksh   = moon?.nakshatraName||moon?.NakshatraName||'—'
  const curDasha= dashas[0]?.planet||dashas[0]?.Planet||'—'

  const navPlanets = (() => {
    try {
      const d = navData?.data || navData
      return Array.isArray(d?.planets) ? d.planets : Array.isArray(d) ? d : []
    } catch { return [] }
  })()

  const TABS: {key:Tab,label:string}[] = [
    {key:'rasi',    label:'♦ Rasi + D9'},
    {key:'planets', label:'Planets'},
    {key:'dasha',   label:'Dasha'},
    {key:'shadbala',label:'Shadbala'},
    {key:'ashtakavarga',label:'Ashtakavarga'},
    {key:'arudha',  label:'Arudha'},
    {key:'dosha',   label:'Doshas'},
    {key:'interpret',label:'Analysis'},
    {key:'report',  label:'Full Report'},
  ]

  const isLoading = (t: string) => tabLoad[t]
  const data      = (t: string) => tabData[t]

  return (
    <div style={{maxWidth:'1500px',margin:'0 auto',padding:'12px 16px'}}>

      {/* ── SAVED CHARTS STRIP (TOP) ─────────────────────────── */}
      {token && (
        <div style={{marginBottom:'14px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px',flexWrap:'wrap'}}>
            <Star style={{width:'13px',height:'13px',color:'var(--gold)',flexShrink:0}}/>
            <span style={{fontSize:'11px',fontWeight:700,color:'var(--txm)',
              textTransform:'uppercase',letterSpacing:'.06em',flexShrink:0}}>
              Saved ({saved.length})
            </span>
            {/* Filter */}
            <input value={stripFilter} onChange={e=>setStripFilter(e.target.value)}
              placeholder="Filter charts..."
              style={{flex:1,minWidth:'100px',maxWidth:'180px',padding:'3px 8px',
                borderRadius:'6px',border:'1px solid var(--bd)',background:'var(--bg2)',
                color:'var(--tx)',fontSize:'11px',fontFamily:'inherit'}}/>
            <button onClick={()=>setShowForm(f=>!f)}
              style={{marginLeft:'auto',flexShrink:0,display:'flex',alignItems:'center',gap:'5px',
                padding:'5px 12px',borderRadius:'8px',border:'2px dashed var(--gold)',
                background:'rgba(196,146,42,.06)',color:'var(--gold)',cursor:'pointer',
                fontFamily:'Cinzel,serif',fontSize:'11px',fontWeight:700}}>
              <Plus style={{width:'12px',height:'12px'}}/> New Chart
            </button>
          </div>

          {saved.length === 0 ? (
            <div style={{fontSize:'12px',color:'var(--txm)',padding:'8px 0'}}>
              No saved charts yet — generate one below
            </div>
          ) : (
            <div className='saved-strip' style={{display:'flex',gap:'8px',overflowX:'auto',paddingBottom:'6px'}}>
              {(stripFilter ? saved.filter(c=>(c.personName||c.PersonName||'').toLowerCase().includes(stripFilter.toLowerCase())||(c.ascendantName||c.AscendantName||'').toLowerCase().includes(stripFilter.toLowerCase())) : saved).map((c:any)=>{
                const id  = c.horoscopeId||c.HoroscopeId
                const nm  = c.personName||c.PersonName||'Chart'
                const lg  = c.ascendantName||c.AscendantName||''
                const nak = c.nakshatraName||c.NakshatraName||''
                const md  = c.currentDasha||c.CurrentDasha||''
                const active = id === horoId
                return (
                  <button key={id} onClick={()=>openSaved(id)}
                    style={{
                      flexShrink:0, display:'flex', flexDirection:'column',
                      alignItems:'flex-start', gap:'2px',
                      padding:'10px 14px', borderRadius:'10px',
                      border:`1.5px solid ${active?'var(--gold)':'var(--bd)'}`,
                      background:active?'rgba(196,146,42,.08)':'var(--bg2)',
                      cursor:'pointer', textAlign:'left', minWidth:'120px',
                      boxShadow:active?'0 0 0 2px rgba(196,146,42,.2)':'none',
                    }}>
                    <div style={{fontSize:'12px',fontWeight:700,color:active?'var(--gold)':'var(--acc)',
                      fontFamily:'Cinzel,serif',whiteSpace:'nowrap',maxWidth:'140px',
                      overflow:'hidden',textOverflow:'ellipsis'}}>{nm}</div>
                    <div style={{fontSize:'10px',color:'var(--txm)',whiteSpace:'nowrap'}}>
                      {lg||'—'}</div>
                    {nak && <div style={{fontSize:'9px',color:'var(--gold)',whiteSpace:'nowrap'}}>
                      {nak}{md?` · ${md} MD`:''}</div>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── NEW CHART FORM (collapsible) ──────────────────────── */}
      {(showForm || !token || saved.length===0) && (
        <div className="card" style={{marginBottom:'14px'}}>
          <div className="card-hd">
            <User style={{width:'13px',height:'13px',color:'var(--gold)'}}/>
            <span className="card-title">{t('chart.section')}</span>
            {(showForm && token && saved.length>0) && (
              <button onClick={()=>setShowForm(false)}
                style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',
                  color:'var(--txm)',padding:'2px'}}>
                <X style={{width:'14px',height:'14px'}}/>
              </button>
            )}
          </div>
          <div className="card-bd">
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr auto',
              gap:'12px',alignItems:'end'}} className="form-grid">
              <div>
                <label className="label">{t('chart.name')}</label>
                <input className="input" value={name}
                  onChange={e=>setName(e.target.value)}
                  placeholder="Name (optional)"/>
              </div>
              <div>
                <label className="label">{t('chart.dob')}</label>
                <DatePicker value={dob} onChange={setDob} showTime showUnknown prefix="c"/>
              </div>
              <div>
                <label className="label">{t('chart.place')}</label>
                <CityAutocomplete value={place}
                  onChange={(city:string,la:number,ln:number)=>{ setPlace(city); setLat(la); setLng(ln) }}
                  placeholder="City, Country"/>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                {err && <div style={{fontSize:'10px',color:'var(--bad,#7A1F1F)'}}>{err}</div>}
                <button onClick={handleGenerate} disabled={loading}
                  className="btn-primary" style={{padding:'9px 20px',whiteSpace:'nowrap',
                    display:'flex',alignItems:'center',gap:'6px'}}>
                  {loading
                    ? <><RefreshCw style={{width:'12px',height:'12px'}}/> Calculating...</>
                    : <>{t('chart.generate')} <ChevronRight style={{width:'13px',height:'13px'}}/></>}
                </button>
              </div>
              {!token && (
                <div style={{fontSize:'11px',color:'var(--warn,#9C6B14)',
                  background:'rgba(156,107,20,.08)',padding:'8px',borderRadius:'8px',gridColumn:'span 5'}}>
                  🔒 Sign in to save charts
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CHART DISPLAY ──────────────────────────────────────── */}
      {result ? (
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>

          {/* Summary strip */}
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
          <div style={{display:'flex',gap:'0',borderBottom:'2px solid var(--bd)',
            flexWrap:'nowrap',overflowX:'auto',alignItems:'flex-end'}}>
            {TABS.map(tb=>(
              <button key={tb.key} onClick={()=>setTab(tb.key)}
                style={{padding:'7px 14px',fontSize:'11px',fontWeight:600,border:'none',
                  background:'none',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',
                  flexShrink:0,
                  color:tab===tb.key?'var(--acc)':'var(--txm)',
                  borderBottom:tab===tb.key?'2px solid var(--gold)':'2px solid transparent',
                  marginBottom:'-2px'}}>
                {tb.label}
              </button>
            ))}
            <div style={{marginLeft:'auto',paddingBottom:'4px',flexShrink:0}}>
              <button onClick={handlePdf}
                style={{display:'flex',alignItems:'center',gap:'4px',padding:'5px 10px',
                  borderRadius:'6px',border:'1px solid var(--bd)',background:'var(--bg2)',
                  cursor:'pointer',fontSize:'11px',color:'var(--tx2)',fontFamily:'inherit'}}>
                <Download style={{width:'11px',height:'11px'}}/> PDF
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div className="card">
            <div className="card-bd" style={{padding:'16px'}}>

              {/* ── RASI + NAVAMSHA TOGETHER ── */}
              {tab==='rasi' && (
                <div>
                  {/* North/South toggle */}
                  <div style={{display:'flex',gap:'6px',justifyContent:'center',marginBottom:'16px'}}>
                    {(['north','south'] as const).map(m=>(
                      <button key={m} onClick={()=>setChartStyle(m)}
                        style={{padding:'5px 14px',borderRadius:'20px',border:'none',
                          cursor:'pointer',fontSize:'11px',fontWeight:700,
                          background:chartStyle===m?'var(--acc)':'var(--bg2)',
                          color:chartStyle===m?'#fff':'var(--txm)',fontFamily:'inherit'}}>
                        {m==='north'?t('home.north_chart')||'North Indian':t('home.south_chart')||'South Indian'}
                      </button>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px',
                    justifyItems:'center'}} className="chart-duo">
                  <div style={{width:'100%',maxWidth:'380px'}}>
                    <div style={{textAlign:'center',fontSize:'11px',fontWeight:700,
                      color:'var(--txm)',marginBottom:'10px',textTransform:'uppercase',
                      letterSpacing:'.06em'}}>{t('home.tab_rasi')||'Rasi Chart (D1)'}</div>
                    {chartStyle==='north'
                      ? <NorthIndianChart planets={planets} ascendant={ascNum}/>
                      : <SouthIndianChart planets={planets} ascendant={ascNum}/>}
                    <div style={{marginTop:'10px',textAlign:'center'}}>
                      <button onClick={()=>{ /* could toggle to south */ }}
                        style={{fontSize:'10px',color:'var(--txm)',background:'none',
                          border:'none',cursor:'pointer',fontFamily:'inherit'}}>
                        North Indian style
                      </button>
                    </div>
                  </div>
                  <div style={{width:'100%',maxWidth:'380px'}}>
                    <div style={{textAlign:'center',fontSize:'11px',fontWeight:700,
                      color:'var(--txm)',marginBottom:'10px',textTransform:'uppercase',
                      letterSpacing:'.06em'}}>Navamsha (D9)</div>
                    {navPlanets.length > 0
                      ? <NorthIndianChart planets={navPlanets} ascendant={ascNum}/>
                      : <div style={{display:'flex',alignItems:'center',justifyContent:'center',
                          height:'200px',color:'var(--txm)',fontSize:'12px',
                          border:'1px dashed var(--bd)',borderRadius:'12px'}}>
                          Loading Navamsha...
                        </div>}
                  </div>
                </div>
                </div>
              )}

              {/* ── PLANETS TABLE ── */}
              {tab==='planets' && (
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                    <thead><tr style={{borderBottom:'2px solid var(--bd)'}}>
                      {['Planet','Rasi','House','Lon','Nakshatra','Pada','℞','Dignity'].map(h=>(
                        <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:'9px',
                          fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',
                          color:'var(--txm)',whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>{planets.map((p:any,i:number)=>{
                      const nm  = p.planet||p.Planet||''
                      const rs  = p.rasiName||p.RasiName||''
                      const lon = +(p.longitude||p.Longitude||0)
                      const d2  = Math.floor(lon%30)
                      const m2  = Math.floor(((lon%30)%1)*60)
                      const s2  = Math.floor(((((lon%30)%1)*60)%1)*60)
                      const ret = p.isRetrograde||p.IsRetrograde
                      const dg  = p.dignity||p.Dignity||''
                      const dc  = dg==='Exalted'?'#16A34A':dg==='Debilitated'?'#DC2626':
                                  dg==='Own Sign'?'#2563EB':'var(--txm)'
                      return (
                        <tr key={i} style={{borderBottom:'1px solid var(--bd)',
                          background:i%2===0?'transparent':'var(--bg2)'}}>
                          <td style={{padding:'7px 10px',fontWeight:700,color:'var(--acc)',
                            fontFamily:'Cinzel,serif',whiteSpace:'nowrap'}}>{gPlanet(nm)}</td>
                          <td style={{padding:'7px 10px'}}>{gSign(rs)}</td>
                          <td style={{padding:'7px 10px',textAlign:'center',color:'var(--txm)'}}>
                            {p.house||p.House||'—'}</td>
                          <td style={{padding:'7px 10px',fontVariantNumeric:'tabular-nums',
                            whiteSpace:'nowrap',fontSize:'11px',color:'var(--txm)'}}>
                            {d2}°{m2}'{s2}"</td>
                          <td style={{padding:'7px 10px',whiteSpace:'nowrap'}}>
                            {p.nakshatraName||p.NakshatraName||'—'}</td>
                          <td style={{padding:'7px 10px',textAlign:'center',color:'var(--txm)'}}>
                            {p.pada||p.Pada||'—'}</td>
                          <td style={{padding:'7px 10px',textAlign:'center'}}>
                            {ret&&<span style={{color:'#F87171',fontWeight:700}}>℞</span>}</td>
                          <td style={{padding:'7px 10px',fontSize:'11px',color:dc,fontWeight:dg?600:400}}>
                            {dg||'—'}</td>
                        </tr>
                      )
                    })}</tbody>
                  </table>
                </div>
              )}

              {/* ── DASHA ── */}
              {tab==='dasha' && (
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                    <thead><tr style={{borderBottom:'2px solid var(--bd)'}}>
                      {['MD','AD (first 3)','Start','End','Yrs'].map(h=>(
                        <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:'9px',
                          fontWeight:700,textTransform:'uppercase',letterSpacing:'.05em',
                          color:'var(--txm)'}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>{dashas.map((d:any,i:number)=>{
                      const pl  = d.planet||d.Planet||''
                      const st  = d.startAt||d.StartAt||d.start||''
                      const en  = d.endAt||d.EndAt||d.end||''
                      const ads = d.antaraDasas||d.AntaraDasas||[]
                      const sy  = st?new Date(st).getFullYear():'—'
                      const ey  = en?new Date(en).getFullYear():'—'
                      const yrs = (st&&en)
                        ? ((new Date(en).getTime()-new Date(st).getTime())/(365.25*24*3600*1000)).toFixed(1):'—'
                      const now = st&&en&&new Date(st)<=new Date()&&new Date()<=new Date(en)
                      return (
                        <tr key={i} style={{borderBottom:'1px solid var(--bd)',
                          background:now?'rgba(196,146,42,.08)':i%2?'var(--bg2)':'transparent'}}>
                          <td style={{padding:'8px 10px',fontWeight:now?700:500,
                            color:now?'var(--gold)':'var(--acc)',fontFamily:'Cinzel,serif',whiteSpace:'nowrap'}}>
                            {gPlanet(pl)}
                            {now&&<span style={{marginLeft:'6px',fontSize:'8px',background:'var(--gold)',
                              color:'#fff',padding:'1px 4px',borderRadius:'3px'}}>NOW</span>}
                          </td>
                          <td style={{padding:'8px 10px',fontSize:'11px',color:'var(--txm)'}}>
                            {ads.slice(0,3).map((a:any)=>gPlanet(a.planet||a.Planet||'')).join(' · ')}
                          </td>
                          <td style={{padding:'8px 10px',color:'var(--txm)',fontVariantNumeric:'tabular-nums'}}>{sy}</td>
                          <td style={{padding:'8px 10px',color:'var(--txm)',fontVariantNumeric:'tabular-nums'}}>{ey}</td>
                          <td style={{padding:'8px 10px',color:'var(--txm)'}}>{yrs}y</td>
                        </tr>
                      )
                    })}</tbody>
                  </table>
                </div>
              )}

              {/* ── LOADING PLACEHOLDER ── */}
              {(['shadbala','ashtakavarga','arudha','dosha','interpret','report'] as Tab[])
                .includes(tab) && isLoading(tab) && (
                <div style={{padding:'40px',textAlign:'center',color:'var(--txm)'}}>
                  <RefreshCw style={{width:'20px',height:'20px',
                    animation:'spin 1s linear infinite',display:'inline-block',
                    marginBottom:'8px'}}/><br/>Loading {tab}...
                </div>
              )}

              {/* ── SHADBALA ── */}
              {tab==='shadbala' && !isLoading('shadbala') && (
                <div style={{overflowX:'auto'}}>
                  {!data('shadbala') ? <div style={{padding:'20px',color:'var(--txm)'}}>Shadbala data not available</div> :
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                    <thead><tr style={{borderBottom:'2px solid var(--bd)'}}>
                      {['Planet','Total Bala','Sthana','Dig','Kaala','Chesta','Naisargika','Drig'].map(h=>(
                        <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:'9px',
                          fontWeight:700,textTransform:'uppercase',color:'var(--txm)',whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>{(()=>{
                        const raw = data('shadbala')
                        const planets = Array.isArray(raw) ? raw
                          : Array.isArray(raw?.planets) ? raw.planets
                          : Array.isArray(raw?.data?.planets) ? raw.data.planets
                          : []
                        return planets
                      })().map((p:any,i:number)=>{
                      const planet = p.planet||p.Planet||''
                      const bala   = p.totalBala||p.TotalBala||(p[1] as any)?.totalBala||'—'
                      const vals   = [p.sthanaBala||p.SthanaBala, p.digBala||p.DigBala,
                                      p.kaalaBala||p.KaalaBala, p.chestaBala||p.ChestaBala,
                                      p.naisargikaBala||p.NaisargikaBala, p.drigBala||p.DrigBala]
                      const strong = typeof bala==='number' && bala>5
                      return (
                        <tr key={i} style={{borderBottom:'1px solid var(--bd)',
                          background:i%2?'var(--bg2)':'transparent'}}>
                          <td style={{padding:'7px 10px',fontWeight:700,color:'var(--acc)',
                            fontFamily:'Cinzel,serif'}}>{gPlanet(planet)}</td>
                          <td style={{padding:'7px 10px',fontWeight:700,
                            color:strong?'#16A34A':'var(--tx)'}}>
                            {typeof bala==='number'?bala.toFixed(2):bala}</td>
                          {vals.map((v,j)=>(
                            <td key={j} style={{padding:'7px 10px',color:'var(--txm)',
                              fontSize:'11px',fontVariantNumeric:'tabular-nums'}}>
                              {typeof v==='number'?v.toFixed(2):v||'—'}</td>
                          ))}
                        </tr>
                      )
                    })}</tbody>
                  </table>}
                </div>
              )}

              {/* ── ASHTAKAVARGA ── */}
              {tab==='ashtakavarga' && !isLoading('ashtakavarga') && (
                <div>
                  {!data('ashtakavarga') ? <div style={{padding:'20px',color:'var(--txm)'}}>Ashtakavarga not available</div> : (
                  <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                    {data('ashtakavarga')?.sarvashtakavarga && (
                      <div>
                        <div style={{fontSize:'12px',fontWeight:700,color:'var(--acc)',
                          marginBottom:'8px',fontFamily:'Cinzel,serif'}}>
                          Sarvashtakavarga — Total Points per Rasi</div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:'4px'}}>
                          {['Mes','Vrs','Mit','Kar','Sim','Kan','Tul','Vri','Dha','Mak','Kum','Mee']
                            .map((rs,i)=>{
                              const pts = data('ashtakavarga').sarvashtakavarga[i]||0
                              const good = pts>=28
                              return (
                                <div key={i} style={{textAlign:'center',padding:'6px 2px',
                                  borderRadius:'6px',border:'1px solid var(--bd)',
                                  background:good?'rgba(74,222,128,.1)':'var(--bg2)'}}>
                                  <div style={{fontSize:'8px',color:'var(--txm)'}}>{rs}</div>
                                  <div style={{fontSize:'14px',fontWeight:700,
                                    color:good?'#16A34A':'var(--tx)'}}>{pts}</div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )}
                    {data('ashtakavarga')?.planets && (
                      <div>
                        <div style={{fontSize:'12px',fontWeight:700,color:'var(--acc)',
                          marginBottom:'8px',fontFamily:'Cinzel,serif'}}>Planet Ashtakavarga</div>
                        {data('ashtakavarga').planets.map((p:any,i:number)=>(
                          <div key={i} style={{marginBottom:'10px'}}>
                            <div style={{fontSize:'11px',fontWeight:600,color:'var(--tx)',
                              marginBottom:'4px'}}>{gPlanet(p.planet||p.Planet||'')}</div>
                            <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:'3px'}}>
                              {(p.points||p.Points||[]).map((pt:number,j:number)=>(
                                <div key={j} style={{textAlign:'center',padding:'4px 2px',
                                  borderRadius:'4px',fontSize:'11px',fontWeight:600,
                                  background:pt>=4?'rgba(74,222,128,.15)':'rgba(248,113,113,.1)',
                                  color:pt>=4?'#16A34A':'#DC2626'}}>{pt}</div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  )}
                </div>
              )}

              {/* ── ARUDHA LAGNAS ── */}
              {tab==='arudha' && !isLoading('arudha') && (
                <div>
                  {!data('arudha') ? <div style={{padding:'20px',color:'var(--txm)'}}>Arudha data not available</div> : (() => {
                    const raw   = data('arudha')
                    const lagnas= raw?.data || raw
                    const LABELS: Record<string,string> = {
                      horaLagna:'Hora Lagna', ghatiLagna:'Ghati Lagna',
                      varnadaLagna:'Varnada Lagna', sreeLagna:'Sree Lagna',
                      induLagna:'Indu Lagna', karkamsaLagna:'Karkamsa',
                      upapada:'Upapada Lagna', arudhaLagna:'Arudha (AL)',
                      niryanapadaLagna:'Niryanapada',
                    }
                    return (
                      <div>
                        <div style={{fontSize:'12px',color:'var(--txm)',marginBottom:'12px'}}>
                          Special & Arudha Lagnas from {gSign(lagna)} Lagna
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'}}>
                          {Object.entries(lagnas||{})
                            .filter(([,v])=>typeof v==='string')
                            .map(([k,v]:any)=>(
                            <div key={k} style={{background:'var(--bg2)',borderRadius:'10px',
                              padding:'12px 14px',border:'1px solid var(--bd)'}}>
                              <div style={{fontSize:'10px',fontWeight:700,color:'var(--txm)',
                                marginBottom:'4px',textTransform:'uppercase',letterSpacing:'.04em'}}>
                                {LABELS[k]||k.replace(/([A-Z])/g,' $1').trim()}</div>
                              <div style={{fontSize:'14px',fontWeight:700,color:'var(--acc)',
                                fontFamily:'Cinzel,serif'}}>{gSign(v)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* ── DOSHAS ── */}
              {tab==='dosha' && !tabLoad['dosha'] && (
                <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                  {!data('dosha') ? <div style={{padding:'20px',color:'var(--txm)'}}>Dosha data not available</div> :
                  (() => {
                    const raw = data('dosha')
                    const doshas = raw?.data || raw
                    return Object.entries(doshas||{}).map(([key,val]:any)=>{
                      const present = val?.present || val?.isPresent ||
                        (typeof val==='boolean'?val:false)
                      return (
                        <div key={key} style={{background:'var(--bg2)',borderRadius:'12px',
                          padding:'14px 16px',border:'1px solid var(--bd)'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                            <AlertTriangle style={{width:'13px',height:'13px',
                              color:present?'#F87171':'#4ADE80'}}/>
                            <span style={{fontWeight:700,color:'var(--acc)',
                              fontFamily:'Cinzel,serif',fontSize:'13px'}}>
                              {key.replace(/([A-Z])/g,' $1').trim()}
                            </span>
                            <span style={{marginLeft:'auto',padding:'2px 8px',borderRadius:'20px',
                              fontSize:'10px',fontWeight:700,
                              background:present?'rgba(248,113,113,.15)':'rgba(74,222,128,.15)',
                              color:present?'#DC2626':'#16A34A'}}>
                              {present?'Present':'Not Present'}
                            </span>
                          </div>
                          {typeof val==='object'&&val!==null&&Object.entries(val)
                            .filter(([k])=>k!=='present'&&k!=='isPresent')
                            .map(([k,v]:any)=>(
                              <div key={k} style={{fontSize:'12px',color:'var(--tx2)',marginTop:'3px'}}>
                                <strong style={{color:'var(--txm)'}}>{k}: </strong>{String(v)}
                              </div>
                            ))}
                        </div>
                      )
                    })
                  })()}
                </div>
              )}

              {/* ── ANALYSIS ── */}
              {tab==='interpret' && !isLoading('interpret') && (() => {
                // Build basic predictions from chart data (no AI needed)
                const lagna    = result?.ascendantName||result?.AscendantName||''
                const moonSign = (planets.find((p:any)=>(p.planet||p.Planet)==='Moon')?.rasiName)||''
                const curMD    = dashas[0]?.planet||dashas[0]?.Planet||''
                const curAD    = dashas[0]?.antaraDasas?.[0]?.planet || ''
                const mdEnd    = dashas[0]?.endAt||dashas[0]?.EndAt||''
                const mdEndYr  = mdEnd ? new Date(mdEnd).getFullYear() : ''
                const exalted  = planets.filter((p:any)=>(p.dignity||p.Dignity)==='Exalted').map((p:any)=>gPlanet(p.planet||p.Planet))
                const debil    = planets.filter((p:any)=>(p.dignity||p.Dignity)==='Debilitated').map((p:any)=>gPlanet(p.planet||p.Planet))
                const retroPl  = planets.filter((p:any)=>p.isRetrograde||p.IsRetrograde).map((p:any)=>gPlanet(p.planet||p.Planet))

                // Lagna-based personality keywords
                const LAGNA_TRAITS: Record<string,string> = {
                  'Aries':'dynamic, pioneering, and energetic. Natural leadership qualities with a drive to initiate',
                  'Taurus':'stable, patient, and determined. Strong affinity for beauty, comfort, and material security',
                  'Gemini':'versatile, communicative, and intellectually curious. Quick-witted and adaptable',
                  'Cancer':'intuitive, nurturing, and emotionally sensitive. Deep attachment to home and family',
                  'Leo':'confident, generous, and creative. Natural charisma and desire for recognition',
                  'Virgo':'analytical, methodical, and service-oriented. Attention to detail and perfectionist streak',
                  'Libra':'diplomatic, harmonious, and relationship-focused. Strong sense of justice and aesthetics',
                  'Scorpio':'intense, perceptive, and transformative. Deep emotional reserves and investigative nature',
                  'Sagittarius':'optimistic, philosophical, and freedom-loving. Expansive vision and love of learning',
                  'Capricorn':'disciplined, ambitious, and responsible. Patient builder of long-term success',
                  'Aquarius':'innovative, humanitarian, and independent. Visionary thinking and unconventional approach',
                  'Pisces':'compassionate, intuitive, and spiritual. Deep empathy and artistic sensitivity',
                }
                const MOON_TRAITS: Record<string,string> = {
                  'Aries':'Emotionally assertive and quick to act on feelings. Needs independence in relationships.',
                  'Taurus':'Emotionally stable and comfort-seeking. Finds security through material and sensory pleasures.',
                  'Gemini':'Emotionally curious and changeable. Needs mental stimulation and variety.',
                  'Cancer':'Deeply emotional and intuitive. Strongly connected to mother, home, and the past.',
                  'Leo':'Emotionally proud and warm-hearted. Needs appreciation and creative expression.',
                  'Virgo':'Emotionally practical and analytical. Expresses care through service and attention to detail.',
                  'Libra':'Emotionally balanced and relationship-oriented. Seeks harmony and avoids conflict.',
                  'Scorpio':'Emotionally intense and private. Transforms through emotional crises.',
                  'Sagittarius':'Emotionally optimistic and freedom-loving. Needs space and philosophical meaning.',
                  'Capricorn':'Emotionally controlled and achievement-focused. Expresses love through responsibility.',
                  'Aquarius':'Emotionally detached but humanitarian. Connects through ideas and causes.',
                  'Pisces':'Emotionally sensitive and empathetic. Highly spiritual and intuitive.',
                }
                const DASHA_THEMES: Record<string,string> = {
                  'Sun':'themes of authority, recognition, career advancement, and self-expression. Government and father-related matters come into focus.',
                  'Moon':'themes of emotions, mind, home, mother, and public life. Travel and fluctuating fortunes are common.',
                  'Mars':'themes of energy, property, siblings, and ambition. Conflicts may arise but goals are pursued with drive.',
                  'Mercury':'themes of communication, business, education, and intellect. Multiple activities and short travels marked.',
                  'Jupiter':'themes of wisdom, expansion, children, dharma, and prosperity. Generally auspicious period for growth.',
                  'Venus':'themes of relationships, luxury, arts, marriage, and comforts. Financial gains and pleasure are highlighted.',
                  'Saturn':'themes of discipline, karma, delays, and hard work. Foundation-building period with long-term rewards.',
                  'Rahu':'themes of ambition, worldly desires, foreign connections, and unconventional paths. Unexpected changes.',
                  'Ketu':'themes of spirituality, detachment, past karma, and liberation. Mystical experiences and introspection.',
                }

                const aiData = data('interpret') as any
                const getAI = (key: string) => {
                  const raw = aiData?.[key]
                  const text = raw?.data?.interpretation || raw?.interpretation || raw?.data?.text
                  return text && !text.includes('temporarily unavailable') && !text.includes('key was not') ? text : null
                }

                const sections = [
                  {
                    key: 'personality',
                    label: 'Personality & Character',
                    basic: lagna ? `With ${gSign(lagna)} as your Ascendant (Lagna), you are ${LAGNA_TRAITS[lagna] || 'endowed with unique qualities'}. Your Moon in ${gSign(moonSign)} indicates: ${MOON_TRAITS[moonSign] || 'a balanced emotional nature'}.${exalted.length ? ` Exalted planets (${exalted.join(', ')}) bestow exceptional strength in their significations.` : ''}${debil.length ? ` Debilitated planets (${debil.join(', ')}) indicate areas requiring extra effort and remedies.` : ''}` : '',
                  },
                  {
                    key: 'career',
                    label: 'Career & Profession',
                    basic: curMD ? `Currently running ${gPlanet(curMD)} Mahadasha${curAD ? ` / ${gPlanet(curAD)} Antardasha` : ''}${mdEndYr ? ` until ${mdEndYr}` : ''}. This period brings ${DASHA_THEMES[curMD] || 'significant life themes'}. ${lagna === 'Cancer' ? 'Moon rules your chart — career in public life, hospitality, or water-related fields suits you.' : lagna === 'Aries' || lagna === 'Scorpio' ? 'Mars rules your chart — leadership, defense, engineering, or surgery are natural fits.' : lagna === 'Gemini' || lagna === 'Virgo' ? 'Mercury rules your chart — communication, writing, trade, or IT fields are favourable.' : lagna === 'Taurus' || lagna === 'Libra' ? 'Venus rules your chart — arts, beauty, luxury goods, or finance are favourable areas.' : lagna === 'Leo' ? 'Sun rules your chart — government, management, politics, or medicine suit you.' : lagna === 'Sagittarius' || lagna === 'Pisces' ? 'Jupiter rules your chart — teaching, consulting, law, or spiritual fields are indicated.' : 'Saturn-ruled charts favour engineering, real estate, mining, or social service.'}` : '',
                  },
                  {
                    key: 'marriage',
                    label: 'Marriage & Relationships',
                    basic: moonSign ? `Moon in ${gSign(moonSign)} shapes your emotional approach to relationships. ${MOON_TRAITS[moonSign] || ''} The 7th house from your ${gSign(lagna)} Lagna indicates the nature of your partner and marriage.${retroPl.length ? ` Note: ${retroPl.join(', ')} ${retroPl.length > 1 ? 'are' : 'is'} retrograde — karmic lessons are associated with these planets' significations in relationships.` : ''}` : '',
                  },
                  {
                    key: 'currentPeriod',
                    label: 'Current Period Analysis',
                    basic: curMD ? `${gPlanet(curMD)} Mahadasha (${curAD ? gPlanet(curAD) + ' Antardasha' : 'major period'}) is active${mdEndYr ? ` until ${mdEndYr}` : ''}. This dasha brings ${DASHA_THEMES[curMD] || 'important life themes and transformations'}. Focus on the areas signified by ${gPlanet(curMD)} and its house placement in your chart.` : '',
                  },
                ]

                return (
                  <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                    {sections.map(({key,label,basic})=>{
                      const aiText = getAI(key)
                      const displayText = aiText || basic
                      if (!displayText) return null
                      return (
                        <div key={key} className="card">
                          <div className="card-hd">
                            <span className="card-title">{label}</span>
                            {aiText && <span style={{marginLeft:'auto',fontSize:'10px',
                              color:'#16A34A',padding:'1px 6px',borderRadius:'10px',
                              background:'rgba(22,163,74,.1)'}}>AI</span>}
                          </div>
                          <div className="card-bd" style={{fontSize:'13px',lineHeight:1.9,color:'var(--tx2)'}}>
                            {displayText}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              {/* ── FULL REPORT ── */}
              {tab==='report' && !isLoading('report') && (
                <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
                  {!data('report') ? <div style={{padding:'20px',color:'var(--txm)'}}>
                    Full report not available</div> : (() => {
                    const rpt  = data('report')
                    const basic= rpt?.basic
                    const pls  = rpt?.planets||[]
                    return (
                      <>
                        {basic && (
                          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px'}}>
                            {[
                              {l:'Name',     v:basic.personName},
                              {l:'Lagna',    v:gSign(basic.lagnaName||basic.ascendantName||'—')},
                              {l:'Moon',     v:gSign(basic.moonSign||basic.moonRasi||'—')},
                              {l:'Nakshatra',v:basic.nakshatra},
                            ].map(s=>(
                              <div key={s.l} style={{background:'var(--bg2)',borderRadius:'8px',
                                padding:'10px',textAlign:'center',border:'1px solid var(--bd)'}}>
                                <div style={{fontSize:'9px',color:'var(--txm)',textTransform:'uppercase',
                                  letterSpacing:'.05em',marginBottom:'4px'}}>{s.l}</div>
                                <div style={{fontSize:'13px',fontWeight:700,color:'var(--acc)',
                                  fontFamily:'Cinzel,serif'}}>{s.v||'—'}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {pls.length>0 && (
                          <div className="card">
                            <div className="card-hd"><span className="card-title">Planetary Positions</span></div>
                            <div style={{overflowX:'auto'}}>
                              <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                                <thead><tr style={{borderBottom:'2px solid var(--bd)'}}>
                                  {['Planet','Rasi','Degree','Nakshatra','℞'].map(h=>(
                                    <th key={h} style={{padding:'7px 10px',textAlign:'left',
                                      fontSize:'9px',fontWeight:700,textTransform:'uppercase',
                                      color:'var(--txm)'}}>{h}</th>
                                  ))}
                                </tr></thead>
                                <tbody>{pls.map((p:any,i:number)=>(
                                  <tr key={i} style={{borderBottom:'1px solid var(--bd)',
                                    background:i%2?'var(--bg2)':'transparent'}}>
                                    <td style={{padding:'7px 10px',fontWeight:700,
                                      color:'var(--acc)',fontFamily:'Cinzel,serif'}}>
                                      {gPlanet(p.planet||p.Planet||'')}</td>
                                    <td style={{padding:'7px 10px'}}>
                                      {gSign(p.rasi||p.rasiName||p.Rasi||'—')}</td>
                                    <td style={{padding:'7px 10px',color:'var(--txm)',fontSize:'11px'}}>
                                      {typeof(p.degree||p.longitude)==='number'
                                        ?(p.degree||p.longitude).toFixed(2)+'°':'—'}</td>
                                    <td style={{padding:'7px 10px'}}>
                                      {p.nakshatra||p.nakshatraName||'—'}</td>
                                    <td style={{padding:'7px 10px',textAlign:'center'}}>
                                      {(p.retrograde||p.isRetrograde)&&
                                        <span style={{color:'#F87171'}}>℞</span>}</td>
                                  </tr>
                                ))}</tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        {/* Yogas section */}
                        {(()=>{
                          const yogas = rpt?.yogas || []
                          const activeYogas = Array.isArray(yogas) ? yogas.filter((y:any)=>y.isActive||y.IsActive||y.active) : []
                          if (activeYogas.length === 0) return null
                          return (
                            <div className="card">
                              <div className="card-hd"><span className="card-title">Yogas Present</span></div>
                              <div className="card-bd">
                                <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                                  {activeYogas.map((y:any,i:number)=>(
                                    <div key={i} style={{borderLeft:'3px solid var(--gold)',
                                      paddingLeft:'12px'}}>
                                      <div style={{fontWeight:700,color:'var(--acc)',
                                        fontFamily:'Cinzel,serif',fontSize:'13px',marginBottom:'2px'}}>
                                        {y.yogaName||y.YogaName||y.name||`Yoga ${i+1}`}
                                      </div>
                                      <div style={{fontSize:'12px',color:'var(--tx2)',lineHeight:1.6}}>
                                        {y.description||y.Description||y.effect||y.Effect||'Active in chart'}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })()}
                        {rpt?.interpretation && !rpt.interpretation.includes('unavailable') && (
                          <div className="card">
                            <div className="card-hd"><span className="card-title">AI Interpretation</span></div>
                            <div className="card-bd" style={{fontSize:'13px',lineHeight:1.8,
                              color:'var(--tx2)'}}>{rpt.interpretation}</div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}

            </div>
          </div>
        </div>
      ) : !loading && (
        <div className="card" style={{padding:'60px 32px',display:'flex',flexDirection:'column',
          alignItems:'center',justifyContent:'center',textAlign:'center',gap:'16px',minHeight:'360px'}}>
          <div style={{fontSize:'48px'}}>🌟</div>
          <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'18px',color:'var(--acc)'}}>
            Vedic Birth Chart
          </div>
          <p style={{fontSize:'13px',color:'var(--txm)',maxWidth:'280px',lineHeight:1.7}}>
            Enter birth details above to generate your complete Vedic chart with
            Rasi, Navamsha, Planets, Dasha, Shadbala and full analysis.
          </p>
          {!token && (
            <button onClick={()=>{setRedirectAfterLogin('/chart');router.push('/signup')}}
              className="btn-primary" style={{padding:'10px 24px',fontFamily:'Cinzel,serif'}}>
              Sign up free to start
            </button>
          )}
        </div>
      )}
    </div>
  )
}
