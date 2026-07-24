'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { chartApi } from '@/api/client'
import {
  calculateChart, calculateChartGuest, listCharts, getChart,
  getShadbala, getAshtakavarga, getShadBalaGuest, getAshtakavargaGuest, getVargaChart,
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
import LifePredictionsTab from '@/components/chart/LifePredictionsTab'
import SouthIndianChart from '@/components/chart/SouthIndianChart'
import { User, ChevronRight, Plus, Star, Clock, RefreshCw, Download, AlertTriangle, X, BookOpen } from 'lucide-react'

const EMPTY: DateValue = { dd:0,mm:0,yyyy:0 }
type Tab = 'rasi'|'planets'|'dasha'|'shadbala'|'ashtakavarga'|'arudha'|'dosha'|'interpret'|'predictions'|'report'

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
  const [stripFilter, setStripFilter] = useState('')
  const [lagnaFilter,  setLagnaFilter]  = useState('')
  const [stripPage,    setStripPage]    = useState(0)
  const STRIP_PAGE_SIZE = 10

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
        // Try auth endpoint first (saved charts with login)
        const r1 = await getShadbala(horoId).catch(() => null)
        const d1 = r1?.data?.data ?? r1?.data?.Data ?? r1?.data ?? r1
        if (d1 && !d1.statusCode && (Array.isArray(d1) || d1.planets || d1.Planets)) {
          return d1
        }
        // Guest endpoint — works for any horoscopeId (guest chart saved in DB temporarily)
        const r2 = await getShadBalaGuest(horoId).catch(() => null)
        const d2 = r2?.data?.data ?? r2?.data ?? r2
        if (d2 && !d2.statusCode && (d2.planets || d2.strongestPlanet)) return d2
        return null
      },
      ashtakavarga: async () => {
        // Use fetch directly — bypasses axios interceptors that may interfere
        const id = horoId || navData?.horoscopeId || navData?.HoroscopeId || ''
        if (!id) return null
        try {
          const res = await fetch(`https://enchanting-dedication-production.up.railway.app/api/strength/${id}/ashtakavarga`)
          if (!res.ok) return null
          const json = await res.json()
          // API returns { success, data: { sav:[{rasiName,rawBindu}], bav:[...], totalSAV } }
          return json?.data ?? null
        } catch { return null }
      },
      arudha: async () => {
        const r = await getSpecialLagnas(horoId).catch(() => null)
        const d = r?.data?.data ?? r?.data ?? r
        if (d && typeof d === 'object' && !d.statusCode) return d

        // Guest fallback: compute Arudha Lagna (AL) from ascendant
        // AL = count from lagna lord's position back to lagna, same distance forward from lord
        const ps = chart?.planets || chart?.Planets || []
        const asc = chart?.ascendantHouse || chart?.AscendantHouse || 1
        const ascRasi = chart?.ascendantRasi ?? chart?.AscendantRasi ?? (asc - 1)
        
        // Lagna lord based on ascendant sign
        const lagnaLordMap: Record<number,string> = {
          0:'Mars',1:'Venus',2:'Mercury',3:'Moon',4:'Sun',5:'Mercury',
          6:'Venus',7:'Mars',8:'Jupiter',9:'Saturn',10:'Saturn',11:'Jupiter'
        }
        const lagnaLordName = lagnaLordMap[ascRasi % 12] || 'Sun'
        const lagnaLord = ps.find((x:any)=>(x.planet||x.Planet)===lagnaLordName)
        const lordHouse = lagnaLord ? (lagnaLord.house || lagnaLord.House || 1) : 1
        
        // Distance from lagna to lord
        const dist1 = ((lordHouse - asc + 12) % 12) || 12
        // AL = same distance from lord
        const alHouse = ((lordHouse + dist1 - 1) % 12) + 1
        
        // Also compute Upapada (UL) — from 12th lord
        const twelfthLordMap: Record<number,string> = {
          0:'Jupiter',1:'Mars',2:'Venus',3:'Mercury',4:'Moon',5:'Sun',
          6:'Mercury',7:'Venus',8:'Mars',9:'Jupiter',10:'Saturn',11:'Saturn'
        }
        const hhSign = ((asc + 10) % 12)  // 12th house sign = asc - 1
        const ulLordName = twelfthLordMap[hhSign] || 'Venus'
        const ulLord = ps.find((x:any)=>(x.planet||x.Planet)===ulLordName)
        const ulLordHouse = ulLord ? (ulLord.house || ulLord.House || 1) : 1
        const ulDist = ((ulLordHouse - ((asc+10)%12+1) + 12) % 12) || 12
        const ulHouse = ((ulLordHouse + ulDist - 1) % 12) + 1
        
        const RASI_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
        
        return {
          arudhaLagna: { house: alHouse, rasiName: RASI_NAMES[(alHouse-1)%12], description: 'AL — how the world perceives you; your public image and material status' },
          upapada:     { house: ulHouse, rasiName: RASI_NAMES[(ulHouse-1)%12], description: 'UL — karaka for marriage and life partner quality' },
          note: 'Computed from chart positions (approximate). Sign in and save chart for full classical Arudha padas.',
        }
      },
      dosha: async () => {
        const ps = (navData?.planets || navData?.Planets || []) as any[]
        const house = (planet: string): number => {
          const p = ps.find((x:any) => (x.planet||x.Planet) === planet)
          return p ? (p.house || p.House || 0) : 0
        }
        const rasi = (planet: string): number => {
          const p = ps.find((x:any) => (x.planet||x.Planet) === planet)
          return p ? (p.rasi || p.Rasi || 0) : 0
        }
        const marsH = house('Mars'), rahuH = house('Rahu'), ketuH = house('Ketu')
        const moonH = house('Moon'), jupH  = house('Jupiter')
        const sunH  = house('Sun'),  satH  = house('Saturn')
        const body  = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']
        const mangalPresent   = marsH > 0 && [1,2,4,7,8,12].includes(marsH)
        const ksPresent       = rasi('Rahu') > 0 && rasi('Ketu') > 0 && body.every(pn => {
          const rv = rasi(pn); if (!rv) return true
          const s = rasi('Rahu'), e = rasi('Ketu')
          return s < e ? (rv > s && rv < e) : (rv > s || rv < e)
        })
        const guruChandalPresent  = jupH > 0 && (jupH === rahuH || jupH === ketuH)
        const moonAdj = [((moonH-2+12)%12)+1, moonH%12+1]
        const kemadrumaPresent = moonH > 0 && !body.some(pn => moonAdj.includes(house(pn)))
        const grahanPresent   = (sunH > 0 && (sunH === rahuH || sunH === ketuH)) ||
                                (moonH > 0 && (moonH === rahuH || moonH === ketuH))
        const shrapitPresent  = satH > 0 && satH === rahuH
        const vishPresent     = satH > 0 && moonH > 0 && satH === moonH
        const pitraPresent    = sunH > 0 && sunH === rahuH
        const doshas = [
          { name:'Mangal Dosha',    isPresent:mangalPresent,   severity:mangalPresent?'Medium':'None',
            description:mangalPresent?'Mars in house '+marsH+' — creates friction in marriage and partnerships.':'No Mangal Dosha. Mars is well-placed.',
            remedies:mangalPresent?'Worship Lord Hanuman on Tuesdays. Consider wearing red coral.':'' },
          { name:'Kaal Sarpa Dosha',isPresent:ksPresent,       severity:ksPresent?'High':'None',
            description:ksPresent?'All planets between Rahu-Ketu axis — struggle before breakthrough.':'No Kaal Sarpa Dosha.',
            remedies:ksPresent?'Perform Kaal Sarpa puja. Chant Maha Mrityunjaya mantra.':'' },
          { name:'Guru Chandal Dosha',isPresent:guruChandalPresent,severity:guruChandalPresent?'Medium':'None',
            description:guruChandalPresent?'Jupiter conjunct '+(jupH===rahuH?'Rahu':'Ketu')+' — may cloud wisdom.':'Jupiter is free from Rahu/Ketu.',
            remedies:guruChandalPresent?'Donate yellow items on Thursdays. Chant Guru mantra.':'' },
          { name:'Kemadruma Dosha', isPresent:kemadrumaPresent, severity:kemadrumaPresent?'Low':'None',
            description:kemadrumaPresent?'Moon isolated — no planets in adjacent houses. Emotional instability possible.':'Moon has planetary support.',
            remedies:kemadrumaPresent?'Offer water to Moon on Mondays. Keep silver items.':'' },
          { name:'Grahan Dosha',    isPresent:grahanPresent,    severity:grahanPresent?'High':'None',
            description:grahanPresent?'Sun or Moon eclipsed by Rahu/Ketu.':'No eclipse on luminaries.',
            remedies:grahanPresent?'Chant Surya or Chandra mantra daily.':'' },
          { name:'Shrapit Dosha',   isPresent:shrapitPresent,   severity:shrapitPresent?'High':'None',
            description:shrapitPresent?'Saturn conjunct Rahu — karmic delays.':'No Saturn-Rahu conjunction.',
            remedies:shrapitPresent?'Perform Shrapit nivaran puja. Feed crows on Saturdays.':'' },
          { name:'Vish Yoga',       isPresent:vishPresent,      severity:vishPresent?'Medium':'None',
            description:vishPresent?'Saturn and Moon in house '+satH+' — emotional heaviness.':'Saturn and Moon in different houses.',
            remedies:vishPresent?'Chant Chandra mantra on Mondays. Wear pearl after consulting astrologer.':'' },
          { name:'Pitra Dosha',     isPresent:pitraPresent,     severity:pitraPresent?'Medium':'None',
            description:pitraPresent?'Sun conjunct Rahu — ancestral karma affecting this chart.':'No Sun-Rahu conjunction.',
            remedies:pitraPresent?'Perform Pitra Tarpan on Amavasya. Offer food to the needy.':'' },
        ]
        const present = doshas.filter(d => d.isPresent)
        const major   = present.filter(d => d.severity === 'High')
        return {
          doshas,
          totalDoshasFound: present.length,
          hasMajorDosha: major.length > 0,
          summary: present.length === 0 ? 'No major doshas found. Chart is harmonious.' : (present.length+' dosha(s) found: '+present.map((d:any)=>d.name).join(', ')+'.')
        }
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
        // Try to geocode via Nominatim (same as CityAutocomplete uses)
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1&accept-language=en`,
            { headers: { 'User-Agent': 'VedicHora/1.0' } }
          ).then(r => r.json())
          if (Array.isArray(geoRes) && geoRes[0]) {
            payload.Latitude  = parseFloat(geoRes[0].lat)
            payload.Longitude = parseFloat(geoRes[0].lon)
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
        // Load navamsha (works for both auth and guest)
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
    {key:'predictions', label:'🔮 Life Predictions'},
    {key:'report',  label:'Full Report'},
  ]

  const isLoading = (t: string) => tabLoad[t]
  const data      = (t: string) => tabData[t]

  return (
    <div style={{maxWidth:'1500px',margin:'0 auto',padding:'12px 16px'}}>

      {/* ── SAVED CHARTS STRIP (TOP) ─────────────────────────── */}
      {saved.length > 0 && (
        <>
          <select
            value={horoId}
            onChange={e => { if(e.target.value) openSaved(e.target.value) }}
            style={{ flex: '1 1 200px', maxWidth: '320px', padding: '7px 10px',
              borderRadius: '8px', border: '1.5px solid var(--bd)', background: 'var(--bg)',
              color: 'var(--tx)', fontSize: '12px', fontFamily: 'inherit', cursor: 'pointer' }}>
            <option value="">📋 {saved.length} saved charts — select one</option>
            {saved.map((c:any) => {
              const id  = c.horoscopeId||c.HoroscopeId
              const nm  = c.personName||c.PersonName||'Chart'
              const lg  = c.ascendantName||c.AscendantName||''
              return <option key={id} value={id}>{nm} — {lg}</option>
            })}
          </select>
          <button onClick={()=>setShowForm(f=>!f)}
            style={{ flexShrink:0, display:'flex', alignItems:'center', gap:'5px',
              padding:'7px 14px', borderRadius:'8px', border:'2px solid var(--gold)',
              background: showForm ? 'var(--gold)' : 'transparent',
              color: showForm ? '#fff' : 'var(--gold)',
              cursor:'pointer', fontFamily:'Cinzel,serif', fontSize:'11px', fontWeight:700 }}>
            <Plus style={{width:'11px',height:'11px'}}/> New Chart
          </button>
        </>
      )}

      {/* ── NEW CHART FORM (collapsible) ──────────────────────── */}
      {(showForm || !token || saved.length===0) && (
        <div className="card" style={{marginBottom:'14px'}}>
          <div className="card-hd">
            <span className="card-title">Birth Details</span>
            {(showForm && token && saved.length>0) && (
              <button onClick={()=>setShowForm(false)}
                style={{marginLeft:'auto',background:'none',border:'none',cursor:'pointer',
                  color:'var(--txm)',padding:'2px'}}>
                <X style={{width:'14px',height:'14px'}}/>
              </button>
            )}
          </div>
          <div className="card-bd">
            <div style={{display:'flex',flexDirection:'column',gap:'10px',maxWidth:'460px'}}>

              {/* Row 1: Full Name */}
              <div>
                <label className="label" style={{display:'block',marginBottom:'5px',fontWeight:700}}>
                  Full Name <span style={{color:'var(--txm)',fontWeight:400,fontSize:'11px'}}>(optional)</span>
                </label>
                <input className="input" value={name}
                  onChange={e=>setName(e.target.value)}
                  placeholder="e.g. Ravi Kumar"
                  style={{width:'100%'}}/>
              </div>

              {/* Row 2: Date of Birth — Day · Month · Year */}
              <div>
                <label className="label" style={{display:'block',marginBottom:'5px',fontWeight:700}}>
                  Date of Birth
                </label>
                <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                  <select className="select" style={{flex:'0 0 80px'}}
                    value={dob.dd||''} onChange={e=>setDob({...dob,dd:+e.target.value})}>
                    <option value="">Day</option>
                    {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className="select" style={{flex:'0 0 130px'}}
                    value={dob.mm||''} onChange={e=>setDob({...dob,mm:+e.target.value})}>
                    <option value="">Month</option>
                    {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i)=>(
                      <option key={m} value={i+1}>{m}</option>
                    ))}
                  </select>
                  <select className="select" style={{flex:'0 0 90px'}}
                    value={dob.yyyy||''} onChange={e=>setDob({...dob,yyyy:+e.target.value})}>
                    <option value="">Year</option>
                    {Array.from({length:126},(_,i)=>2025-i).map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 3: Time of Birth — Hr : Min AM/PM */}
              <div>
                <label className="label" style={{display:'block',marginBottom:'5px',fontWeight:700}}>
                  Time of Birth
                  <span style={{color:'var(--txm)',fontWeight:400,fontSize:'11px',marginLeft:'6px'}}>
                    (improves accuracy)
                  </span>
                </label>
                <div style={{display:'flex',gap:'8px',alignItems:'center',
                  opacity:dob.unknownTime?0.4:1,pointerEvents:dob.unknownTime?'none':'auto'}}>
                  <select className="select" style={{flex:'0 0 74px'}}
                    value={dob.hr||''} onChange={e=>setDob({...dob,hr:+e.target.value})} disabled={dob.unknownTime}>
                    <option value="">Hr</option>
                    {Array.from({length:12},(_,i)=>i+1).map(h=><option key={h} value={h}>{h}</option>)}
                  </select>
                  <span style={{color:'var(--txm)',fontWeight:700,fontSize:'18px'}}>:</span>
                  <select className="select" style={{flex:'0 0 74px'}}
                    value={dob.mi===undefined?'':dob.mi} onChange={e=>setDob({...dob,mi:+e.target.value})} disabled={dob.unknownTime}>
                    <option value="">Min</option>
                    {Array.from({length:60},(_,i)=>i).map(m=><option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
                  </select>
                  <select className="select" style={{flex:'0 0 74px'}}
                    value={dob.ap||'AM'} onChange={e=>setDob({...dob,ap:e.target.value as 'AM'|'PM'})} disabled={dob.unknownTime}>
                    <option>AM</option><option>PM</option>
                  </select>
                </div>
                <label style={{display:'flex',alignItems:'center',gap:'7px',
                  marginTop:'8px',fontSize:'12px',color:'var(--txm)',cursor:'pointer'}}>
                  <input type="checkbox" checked={!!dob.unknownTime}
                    onChange={e=>setDob({...dob,unknownTime:e.target.checked})}
                    style={{width:'14px',height:'14px',accentColor:'var(--gold)',cursor:'pointer'}}/>
                  I don't know my exact birth time
                </label>
              </div>

              {/* Row 4: Place of Birth */}
              <div>
                <label className="label" style={{display:'block',marginBottom:'5px',fontWeight:700}}>
                  Place of Birth
                </label>
                <CityAutocomplete value={place}
                  onChange={(city:string,la?:number,ln?:number)=>{ setPlace(city); setLat(la); setLng(ln) }}
                  placeholder="Type city name and select from list"/>
                {place && !lat && (
                  <div style={{fontSize:'11px',color:'#DC2626',marginTop:'4px'}}>
                    ↑ Please select a city from the dropdown list
                  </div>
                )}
              </div>

              {/* Error */}
              {err && <div style={{fontSize:'12px',color:'#DC2626',background:'rgba(220,38,38,.07)',
                padding:'8px 12px',borderRadius:'8px',border:'1px solid rgba(220,38,38,.2)'}}>{err}</div>}

              {/* Generate button */}
              <button onClick={handleGenerate} disabled={loading}
                className="btn-primary" style={{padding:'11px 24px',display:'flex',
                  alignItems:'center',justifyContent:'center',gap:'8px',fontSize:'14px',
                  fontFamily:'Cinzel,serif'}}>
                {loading
                  ? <><RefreshCw style={{width:'14px',height:'14px'}}/> Calculating...</>
                  : <>Generate Chart <ChevronRight style={{width:'14px',height:'14px'}}/></>}
              </button>

              {!token && (
                <div style={{fontSize:'11px',color:'#9C6B14',background:'rgba(156,107,20,.08)',
                  padding:'8px 12px',borderRadius:'8px'}}>
                  🔒 Sign in to save your charts and access full features
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
                      <button onClick={()=>setChartStyle(s=>s==='north'?'south':'north')}
                        style={{fontSize:'10px',color:'var(--txm)',background:'none',
                          border:'none',cursor:'pointer',fontFamily:'inherit'}}>
                        {chartStyle==='north'?'Switch to South Indian':'Switch to North Indian'}
                      </button>
                    </div>
                  </div>
                  <div style={{width:'100%',maxWidth:'380px'}}>
                    <div style={{textAlign:'center',fontSize:'11px',fontWeight:700,
                      color:'var(--txm)',marginBottom:'10px',textTransform:'uppercase',
                      letterSpacing:'.06em'}}>Navamsha (D9)</div>
                    {navPlanets.length > 0
                      ? (chartStyle === 'north'
                          ? <NorthIndianChart planets={navPlanets} ascendant={ascNum}/>
                          : <SouthIndianChart planets={navPlanets} ascendant={ascNum}/>)
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
                      const parseYr = (s:string) => { if(!s) return '—'; const m=s.match(/^(\d{4})/); return m?m[1]:'—' }
                      const sy  = parseYr(st)
                      const ey  = parseYr(en)
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
                  {!data('shadbala') ? <div style={{padding:'20px',color:'var(--txm)'}}>
                Shadbala data not available for this chart
              </div> :
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                    <thead><tr style={{borderBottom:'2px solid var(--bd)'}}>
                      {['Planet','Total Bala','Sthana','Dig','Kaala','Chesta','Naisargika','Drig'].map(h=>(
                        <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:'9px',
                          fontWeight:700,textTransform:'uppercase',color:'var(--txm)',whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>{(()=>{
                        const raw = data('shadbala')
                        // API returns { success, data: { planets: [...] } }
                        const shadResult = raw?.data ?? raw?.Data ?? raw
                        const planets: any[] = Array.isArray(shadResult?.planets) ? shadResult.planets
                          : Array.isArray(shadResult?.Planets) ? shadResult.Planets
                          : Array.isArray(raw) ? raw : []
                        return planets
                      })().map((p:any,i:number)=>{
                      const planet = p.planet||p.Planet||''
                      const bala   = p.total??p.Total??0
                      const vals   = [
                        p.sthaanaBala??p.SthaanaBala??null,
                        p.digBala??p.DigBala??null,
                        p.kalaBala??p.KalaBala??null,
                        p.cheshtaBala??p.CheshtaBala??null,
                        p.naisargikaBala??p.NaisargikaBala??null,
                        p.drikBala??p.DrikBala??null
                      ]
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
                              {v!=null?Number(v).toFixed(2):'—'}</td>
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
                  {!data('ashtakavarga') ? <div style={{padding:'20px',color:'var(--txm)'}}>Ashtakavarga data not available for this chart.</div> : (
                  <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                    {(() => {
                      const av = data('ashtakavarga')
                      // API: { success, data: { sav: [{rasiName,rawBindu,afterShodhana}], bav, totalSAV } }
                      const avData = av  // loader already returns inner data object
                      const savRows: any[] = avData?.sav ?? avData?.SAV ?? []
                      const totalSAV: number = avData?.totalSAV ?? avData?.TotalSAV ?? 0
                      if (!savRows.length) return <div style={{padding:'20px',color:'var(--txm)'}}>Ashtakavarga data not available</div>
                      return (
                      <div>
                        <div style={{fontSize:'13px',fontWeight:700,color:'var(--acc)',
                          marginBottom:'10px',fontFamily:'Cinzel,serif',display:'flex',justifyContent:'space-between'}}>
                          <span>Sarvashtakavarga — Bindus per Rasi</span>
                          <span style={{fontSize:'11px',color:'var(--txm)',fontWeight:400}}>Total: {totalSAV}</span>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'6px'}}>
                          {savRows.map((r:any,i:number)=>{
                            const rasi = r.rasiName??r.RasiName??`Rasi ${i+1}`
                            const pts  = r.rawBindu??r.RawBindu??0
                            const good = pts>=28
                            return (
                              <div key={i} style={{display:'flex',justifyContent:'space-between',
                                alignItems:'center',padding:'7px 12px',borderRadius:'8px',
                                border:`1.5px solid ${good?'rgba(74,222,128,.4)':'var(--bd)'}`,
                                background:good?'rgba(74,222,128,.06)':'var(--bg2)'}}>
                                <span style={{fontSize:'12px',color:'var(--tx)',fontWeight:600}}>{rasi}</span>
                                <span style={{fontSize:'14px',fontWeight:700,
                                  color:good?'#16A34A':pts<20?'#DC2626':'var(--txm)'}}>{pts}</span>
                              </div>
                            )
                          })}
                        </div>
                        {(avData?.strongestRasi||avData?.StrongestRasi) && (
                          <div style={{marginTop:'12px',fontSize:'12px',color:'var(--txm)'}}>
                            Strongest: <strong style={{color:'#16A34A'}}>{avData.strongestRasi??avData.StrongestRasi}</strong>
                            {(avData?.weakestRasi||avData?.WeakestRasi) && <> · Weakest: <strong style={{color:'#DC2626'}}>{avData.weakestRasi??avData.WeakestRasi}</strong></>}
                          </div>
                        )}
                      </div>
                      )
                    })()}
                    {false && data('ashtakavarga')?.sarvashtakavarga && (
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
                    // DoshaResult: { TotalDoshasFound, HasMajorDosha, Summary, Doshas: DoshaDetail[] }
                    // DoshaDetail: { Name, IsPresent, Severity, Description, Remedies }
                    const result = raw?.data ?? raw?.Data ?? raw
                    const total  = result?.totalDoshasFound ?? result?.TotalDoshasFound ?? 0
                    const major  = result?.hasMajorDosha ?? result?.HasMajorDosha ?? false
                    const summary= result?.summary ?? result?.Summary ?? ''
                    const doshas : any[] = result?.doshas ?? result?.Doshas ?? []
                    return (
                      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
                        {/* Summary header */}
                        <div style={{background:'var(--bg2)',borderRadius:'12px',padding:'14px 16px',
                          border:`1px solid ${major?'rgba(220,38,38,.3)':'var(--bd)'}`}}>
                          <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:summary?'8px':'0'}}>
                            <span style={{fontFamily:'Cinzel,serif',fontWeight:700,color:'var(--acc)',fontSize:'13px'}}>
                              Dosha Analysis
                            </span>
                            <span style={{marginLeft:'auto',padding:'3px 10px',borderRadius:'20px',
                              fontSize:'10px',fontWeight:700,
                              background:major?'rgba(220,38,38,.12)':'rgba(74,222,128,.12)',
                              color:major?'#DC2626':'#16A34A'}}>
                              {total} dosha{total!==1?'s':''} found
                            </span>
                          </div>
                          {summary && <p style={{fontSize:'12px',color:'var(--txm)',margin:0,lineHeight:1.7}}>{summary}</p>}
                        </div>

                        {/* Individual doshas */}
                        {doshas.length === 0
                          ? <div style={{padding:'12px 16px',borderRadius:'10px',
                              background:'rgba(74,222,128,.06)',border:'1px solid rgba(74,222,128,.2)',
                              fontSize:'13px',color:'#16A34A',fontWeight:600}}>
                              ✓ No major doshas found in this chart
                            </div>
                          : doshas.map((d:any,i:number) => {
                              const name     = d.name    ?? d.Name    ?? `Dosha ${i+1}`
                              const present  = d.isPresent ?? d.IsPresent ?? false
                              const severity = d.severity  ?? d.Severity  ?? 'None'
                              const desc     = d.description ?? d.Description ?? ''
                              const remedies = d.remedies ?? d.Remedies ?? ''
                              const sevColor = severity==='High'?'#DC2626':severity==='Medium'?'#F59E0B':'#6B7280'
                              return (
                                <div key={i} style={{background:'var(--bg2)',borderRadius:'12px',
                                  padding:'14px 16px',border:`1px solid ${present?'rgba(220,38,38,.25)':'var(--bd)'}`}}>
                                  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:desc?'8px':'0'}}>
                                    <AlertTriangle style={{width:'13px',height:'13px',
                                      color:present?'#F87171':'#4ADE80',flexShrink:0}}/>
                                    <span style={{fontWeight:700,color:'var(--acc)',
                                      fontFamily:'Cinzel,serif',fontSize:'13px'}}>{name}</span>
                                    <span style={{marginLeft:'auto',padding:'2px 8px',borderRadius:'20px',
                                      fontSize:'10px',fontWeight:700,
                                      background:present?'rgba(220,38,38,.1)':'rgba(74,222,128,.1)',
                                      color:present?'#DC2626':'#16A34A'}}>
                                      {present ? (severity!=='None'?severity:'Present') : 'Not Present'}
                                    </span>
                                  </div>
                                  {desc && <p style={{fontSize:'12px',color:'var(--txm)',margin:'4px 0 0',lineHeight:1.7}}>{desc}</p>}
                                  {present && remedies && (
                                    <div style={{marginTop:'8px',padding:'8px 10px',borderRadius:'8px',
                                      background:'rgba(196,146,42,.06)',border:'1px solid rgba(196,146,42,.2)',
                                      fontSize:'11px',color:'var(--txm)'}}>
                                      <strong style={{color:'var(--gold)'}}>Remedies:</strong> {remedies}
                                    </div>
                                  )}
                                </div>
                              )
                            })
                        }
                      </div>
                    )
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
              {/* ── LIFE PREDICTIONS TAB ── */}
              {tab==='predictions' && (
                <LifePredictionsTab horoId={horoId} isAdmin={!!token} />
              )}

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
