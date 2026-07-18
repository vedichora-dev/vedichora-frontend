'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import {
  calculateChart, listCharts, getChart,
  getShadbala, getAshtakavarga, getVargaChart,
  getSpecialLagnas, getDoshas, downloadPdfBasic,
  getInterpretPersonality, getInterpretCareer,
  getInterpretMarriage, getInterpretCurrentPeriod,
  getChartReportStage1,
} from '@/api'
import { to24Hour } from '@/lib/utils'
import { useT, usePlanetName, useSignName } from '@/lib/i18n'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'
import NorthIndianChart from '@/components/chart/NorthIndianChart'
import SouthIndianChart from '@/components/chart/SouthIndianChart'
import { MapPin, User, ChevronRight, Plus, Star, Clock,
         RefreshCw, Download, AlertTriangle } from 'lucide-react'

const EMPTY: DateValue = { dd:0,mm:0,yyyy:0 }

type Tab = 'north'|'south'|'planets'|'dasha'|'shadbala'|'ashtakavarga'|
           'varga'|'arudha'|'dosha'|'interpret'|'report'

export default function ChartPage() {
  const router   = useRouter()
  const { token, setHoroId, setRedirectAfterLogin } = useStore()
  const t        = useT()
  const gPlanet  = usePlanetName()
  const gSign    = useSignName()

  // Form
  const [name, setName]   = useState('')
  const [dob,  setDob]    = useState<DateValue>(EMPTY)
  const [place, setPlace] = useState('')
  const [loading, setLoading]   = useState(false)
  const [err, setErr]           = useState('')

  // Saved charts
  const [saved, setSaved] = useState<any[]>([])

  // Current chart
  const [result,    setResult]    = useState<any>(null)
  const [tab,       setTab]       = useState<Tab>('north')
  const [tabData,   setTabData]   = useState<Record<string,any>>({})
  const [tabLoad,   setTabLoad]   = useState<Record<string,boolean>>({})
  const [horoId,    setHoroIdLocal] = useState<string>('')

  const loadSaved = useCallback(async () => {
    if (!token) return
    try {
      const res = await listCharts()
      setSaved(Array.isArray(res) ? res : (res as any)?.data || [])
    } catch {}
  }, [token])

  useEffect(() => { loadSaved() }, [loadSaved])

  // Lazy-load tab data when tab changes
  useEffect(() => {
    if (!horoId || !result) return
    const loaders: Record<Tab, ()=>Promise<any>> = {
      north:        async () => null,
      south:        async () => null,
      planets:      async () => null,
      dasha:        async () => null,
      shadbala:     async () => (await getShadbala(horoId))?.data,
      ashtakavarga: async () => (await getAshtakavarga(horoId))?.data,
      varga:        async () => (await getVargaChart(horoId, 9))?.data,
      arudha:       async () => (await getSpecialLagnas(horoId))?.data,
      dosha:        async () => (await getDoshas(horoId))?.data,
      interpret:    async () => {
        const [pers, career, marr, cur] = await Promise.all([
          getInterpretPersonality(horoId).catch(()=>null),
          getInterpretCareer(horoId).catch(()=>null),
          getInterpretMarriage(horoId).catch(()=>null),
          getInterpretCurrentPeriod(horoId).catch(()=>null),
        ])
        return { personality: pers?.data, career: career?.data,
                 marriage: marr?.data, currentPeriod: cur?.data }
      },
      report:       async () => (await getChartReportStage1(horoId))?.data,
    }
    const staticTabs = ['north','south','planets','dasha']
    if (staticTabs.includes(tab)) return
    if (tabData[tab] !== undefined) return // already loaded
    setTabLoad(l => ({...l, [tab]: true}))
    loaders[tab]().then(data => {
      setTabData(d => ({...d, [tab]: data || null}))
      setTabLoad(l => ({...l, [tab]: false}))
    }).catch(() => {
      setTabData(d => ({...d, [tab]: null}))
      setTabLoad(l => ({...l, [tab]: false}))
    })
  }, [tab, horoId, result])

  const openSaved = async (id: string) => {
    setLoading(true); setErr(''); setTabData({})
    try {
      const res = await getChart(id)
      const data = (res as any)?.data || res
      if (data) {
        setResult(data); setHoroIdLocal(id)
        setHoroId(id); localStorage.setItem('vh_horoid', id)
        setTab('north')
      }
    } catch { setErr('Could not load chart') }
    setLoading(false)
  }

  const handleGenerate = async () => {
    if (!dob.dd||!dob.mm||!dob.yyyy) { setErr('Enter date of birth'); return }
    if (!place.trim()) { setErr('Enter place of birth'); return }
    if (!token) { setRedirectAfterLogin('/chart'); router.push('/signup'); return }
    setLoading(true); setErr(''); setResult(null); setTabData({})
    try {
      const {hour,minute} = dob.unknownTime
        ? {hour:12,minute:0} : to24Hour(dob.hr||12,dob.mi||0,dob.ap||'AM')
      const res = await calculateChart({
        PersonName:name.trim()||'My Chart', Year:dob.yyyy, Month:dob.mm, Day:dob.dd,
        Hour:hour, Minute:minute, Second:0, PlaceName:place,
        UtcOffsetHours:5.5, AyanamsaType:'Lahiri',
      })
      const data = (res as any)?.data?.data||(res as any)?.data
      if (data) {
        const id = data.horoscopeId||data.id||''
        setResult(data); setHoroIdLocal(id)
        if (id) { setHoroId(id); localStorage.setItem('vh_horoid', id) }
        setTab('north')
        await loadSaved()
      } else setErr((res as any)?.data?.message||'Calculation failed')
    } catch(e:any) { setErr(e?.response?.data?.message||'Calculation failed') }
    setLoading(false)
  }

  const handlePdf = async () => {
    if (!horoId) return
    try {
      // PdfController returns HTML — open in new tab for print/save as PDF
      const res = await downloadPdfBasic(horoId)
      const html = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2)
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        setTimeout(() => win.print(), 500)
      }
    } catch { alert('PDF generation failed. Please try again.') }
  }

  const planets = result?.planets||result?.Planets||[]
  const dashas  = result?.vimshottariDasa||result?.VimshottariDasa||[]
  const ascNum  = result?.ascendant??result?.Ascendant??0
  const lagna   = result?.ascendantName||result?.AscendantName||'—'
  const moon    = planets.find((p:any)=>(p.planet||p.Planet)==='Moon')
  const moonRasi= moon?.rasiName||moon?.RasiName||'—'
  const naksh   = moon?.nakshatraName||moon?.NakshatraName||'—'
  const curDasha= dashas[0]?.planet||dashas[0]?.Planet||'—'

  const TABS: {key:Tab,label:string}[] = [
    {key:'north',    label:'♦ North'},
    {key:'south',    label:'⊞ South'},
    {key:'planets',  label:'Planets'},
    {key:'dasha',    label:'Dasha'},
    {key:'shadbala', label:'Shadbala'},
    {key:'ashtakavarga',label:'Ashtakavarga'},
    {key:'varga',    label:'D9 Navamsha'},
    {key:'arudha',   label:'Arudha'},
    {key:'dosha',    label:'Doshas'},
    {key:'interpret',label:'Analysis'},
    {key:'report',   label:'Full Report'},
  ]

  const TabContent = () => {
    const data    = tabData[tab]
    const loading2 = tabLoad[tab]

    if (loading2) return (
      <div style={{padding:'40px',textAlign:'center',color:'var(--txm)'}}>
        <RefreshCw style={{width:'20px',height:'20px',animation:'spin 1s linear infinite',
          display:'inline-block',marginBottom:'8px'}}/><br/>Loading {tab}...
      </div>
    )

    // ── NORTH INDIAN ──
    if (tab==='north') return (
      <div style={{display:'flex',justifyContent:'center',padding:'20px'}}>
        <div style={{maxWidth:'380px',width:'100%'}}>
          <div style={{textAlign:'center',marginBottom:'12px',fontSize:'12px',color:'var(--txm)',fontWeight:600}}>
            North Indian Chart · {result?.personName||result?.PersonName||''}
          </div>
          <NorthIndianChart planets={planets} ascendant={ascNum}/>
        </div>
      </div>
    )

    // ── SOUTH INDIAN ──
    if (tab==='south') return (
      <div style={{display:'flex',justifyContent:'center',padding:'20px'}}>
        <div style={{maxWidth:'380px',width:'100%'}}>
          <div style={{textAlign:'center',marginBottom:'12px',fontSize:'12px',color:'var(--txm)',fontWeight:600}}>
            South Indian Chart · {result?.personName||result?.PersonName||''}
          </div>
          <SouthIndianChart planets={planets} ascendant={ascNum}/>
        </div>
      </div>
    )

    // ── PLANETS TABLE ──
    if (tab==='planets') return (
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
            const d2  = Math.floor(lon%30), m2=Math.floor(((lon%30)%1)*60),
                        s2=Math.floor(((((lon%30)%1)*60)%1)*60)
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
                <td style={{padding:'7px 10px',fontVariantNumeric:'tabular-nums',whiteSpace:'nowrap',
                  fontSize:'11px',color:'var(--txm)'}}>{d2}°{m2}'{s2}"</td>
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
    )

    // ── DASHA TABLE ──
    if (tab==='dasha') return (
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
    )

    // ── SHADBALA ──
    if (tab==='shadbala') return (
      <div style={{overflowX:'auto'}}>
        {!data ? <div style={{padding:'20px',color:'var(--txm)',fontSize:'13px'}}>
          Shadbala data not available</div> :
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
          <thead><tr style={{borderBottom:'2px solid var(--bd)'}}>
            {['Planet','Total Bala','Sthana','Dig','Kaala','Chesta','Naisargika','Drig'].map(h=>(
              <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:'9px',
                fontWeight:700,textTransform:'uppercase',color:'var(--txm)',whiteSpace:'nowrap'}}>{h}</th>
            ))}
          </tr></thead>
          <tbody>{(data?.planets||Object.entries(data||{})).map((p:any,i:number)=>{
            const planet = p.planet||p.Planet||p[0]||''
            const bala   = p.totalBala||p.TotalBala||p[1]?.totalBala||'—'
            const sthana = p.sthanaBala||p.SthanaBala||'—'
            const dig    = p.digBala||p.DigBala||'—'
            const kaala  = p.kaalaBala||p.KaalaBala||'—'
            const chesta = p.chestaBala||p.ChestaBala||'—'
            const nai    = p.naisargikaBala||p.NaisargikaBala||'—'
            const drig   = p.drigBala||p.DrigBala||'—'
            const strong = typeof bala==='number' && bala > 5
            return (
              <tr key={i} style={{borderBottom:'1px solid var(--bd)',
                background:i%2?'var(--bg2)':'transparent'}}>
                <td style={{padding:'7px 10px',fontWeight:700,color:'var(--acc)',
                  fontFamily:'Cinzel,serif'}}>{gPlanet(planet)}</td>
                <td style={{padding:'7px 10px',fontWeight:700,
                  color:strong?'#16A34A':'var(--tx)'}}>{typeof bala==='number'?bala.toFixed(2):bala}</td>
                {[sthana,dig,kaala,chesta,nai,drig].map((v,j)=>(
                  <td key={j} style={{padding:'7px 10px',color:'var(--txm)',fontSize:'11px',
                    fontVariantNumeric:'tabular-nums'}}>
                    {typeof v==='number'?v.toFixed(2):v}
                  </td>
                ))}
              </tr>
            )
          })}</tbody>
        </table>}
      </div>
    )

    // ── ASHTAKAVARGA ──
    if (tab==='ashtakavarga') return (
      <div>
        {!data ? <div style={{padding:'20px',color:'var(--txm)',fontSize:'13px'}}>
          Ashtakavarga data not available</div> :
        <div>
          {/* Sarvashtakavarga summary */}
          {data?.sarvashtakavarga&&(
            <div style={{marginBottom:'16px'}}>
              <div style={{fontSize:'12px',fontWeight:700,color:'var(--acc)',marginBottom:'8px',
                fontFamily:'Cinzel,serif'}}>Sarvashtakavarga (Total Points per Rasi)</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:'4px'}}>
                {['Mes','Vrs','Mit','Kar','Sim','Kan','Tul','Vri','Dha','Mak','Kum','Mee']
                  .map((rs,i)=>{
                  const pts = data.sarvashtakavarga[i]||data.sarvashtakavarga[rs]||0
                  const good = pts>=28
                  return (
                    <div key={i} style={{textAlign:'center',padding:'6px 4px',
                      borderRadius:'6px',border:'1px solid var(--bd)',
                      background:good?'rgba(74,222,128,.1)':'var(--bg2)'}}>
                      <div style={{fontSize:'9px',color:'var(--txm)'}}>{rs}</div>
                      <div style={{fontSize:'14px',fontWeight:700,color:good?'#16A34A':'var(--tx)'}}>{pts}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          {/* Per-planet ashtakavarga */}
          {data?.planets&&(
            <div>
              <div style={{fontSize:'12px',fontWeight:700,color:'var(--acc)',marginBottom:'8px',
                fontFamily:'Cinzel,serif'}}>Planet Ashtakavarga</div>
              {data.planets.map((p:any,i:number)=>(
                <div key={i} style={{marginBottom:'10px'}}>
                  <div style={{fontSize:'11px',fontWeight:600,color:'var(--tx)',marginBottom:'4px'}}>
                    {gPlanet(p.planet||p.Planet||'')}
                  </div>
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
        </div>}
      </div>
    )

    // ── D9 NAVAMSHA ──
    if (tab==='varga') {
      // Navamsha from /api/strength/{id}/varga/9
      let vargaPlanets: any[] = []
      try {
        const vd = data?.data || data
        vargaPlanets = Array.isArray(vd?.planets) ? vd.planets :
                       Array.isArray(vd) ? vd : []
      } catch { vargaPlanets = [] }
      return (
        <div>
          {vargaPlanets.length===0 ? <div style={{padding:'20px',color:'var(--txm)',fontSize:'13px'}}>
            Navamsha (D9) data not available</div> :
        <div style={{overflowX:'auto'}}>
          <div style={{fontSize:'12px',fontWeight:700,color:'var(--acc)',marginBottom:'12px',
            fontFamily:'Cinzel,serif'}}>D9 Navamsha Chart</div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
            <thead><tr style={{borderBottom:'2px solid var(--bd)'}}>
              {['Planet','Navamsha Rasi','Degree'].map(h=>(
                <th key={h} style={{padding:'8px 10px',textAlign:'left',fontSize:'9px',
                  fontWeight:700,textTransform:'uppercase',color:'var(--txm)'}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{(data?.planets||data||[]).map((p:any,i:number)=>(
              <tr key={i} style={{borderBottom:'1px solid var(--bd)',
                background:i%2?'var(--bg2)':'transparent'}}>
                <td style={{padding:'7px 10px',fontWeight:700,color:'var(--acc)',
                  fontFamily:'Cinzel,serif'}}>{gPlanet(p.planet||p.Planet||'')}</td>
                <td style={{padding:'7px 10px'}}>{gSign(p.rasiName||p.RasiName||'—')}</td>
                <td style={{padding:'7px 10px',color:'var(--txm)',fontSize:'11px'}}>
                  {typeof(p.longitude||p.Longitude)==='number'
                    ?(p.longitude||p.Longitude).toFixed(2)+'°':'—'}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>}
        </div>
      )
    }

    // ── ARUDHA LAGNAS ──
    if (tab==='arudha') {
      // API returns {success, data: {horaLagna, ghatiLagna, varnadaLagna, sreeLagna, ...}}
      const lagnas = data?.data || data
      const LAGNA_LABELS: Record<string,string> = {
        horaLagna:'Hora Lagna', ghatiLagna:'Ghati Lagna', varnadaLagna:'Varnada Lagna',
        sreeLagna:'Sree Lagna', induLagna:'Indu Lagna', karkamsaLagna:'Karkamsa',
        svanamsaLagna:'Svanamsa', niryanapadaLagna:'Niryanapadha',
        upapada:'Upapada Lagna', arudhaLagna:'Arudha Lagna (AL)',
      }
      return (
        <div>
          {!lagnas ? <div style={{padding:'20px',color:'var(--txm)',fontSize:'13px'}}>
            Arudha/Special Lagnas not available</div> :
          <div>
            <div style={{fontSize:'12px',color:'var(--txm)',marginBottom:'12px'}}>
              Special Lagnas (Jaimini) — calculated from {gSign(lagna)} Lagna
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'}}>
              {Object.entries(lagnas||{}).filter(([k])=>typeof lagnas[k]==='string').map(([key,val]:any)=>(
                <div key={key} style={{background:'var(--bg2)',borderRadius:'10px',
                  padding:'12px 14px',border:'1px solid var(--bd)'}}>
                  <div style={{fontSize:'10px',fontWeight:700,color:'var(--txm)',
                    marginBottom:'4px',textTransform:'uppercase',letterSpacing:'.04em'}}>
                    {LAGNA_LABELS[key]||key.replace(/([A-Z])/g,' $1').trim()}
                  </div>
                  <div style={{fontSize:'14px',fontWeight:700,color:'var(--acc)',
                    fontFamily:'Cinzel,serif'}}>{gSign(val)}</div>
                </div>
              ))}
            </div>
          </div>}
        </div>
      )
    }

    // ── DOSHAS ──
    if (tab==='dosha') return (
      <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
        {!data ? <div style={{padding:'20px',color:'var(--txm)',fontSize:'13px'}}>
          Dosha data not available</div> :
        Object.entries(data||{}).map(([key,val]:any)=>{
          const present = val?.present||val?.isPresent||val===true
          const severity= val?.severity||val?.Severity||''
          return (
            <div key={key} style={{background:'var(--bg2)',borderRadius:'12px',
              padding:'16px',border:'1px solid var(--bd)'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'8px'}}>
                <AlertTriangle style={{width:'14px',height:'14px',
                  color:present?'#F87171':'#4ADE80'}}/>
                <span style={{fontWeight:700,color:'var(--acc)',fontFamily:'Cinzel,serif',
                  fontSize:'13px'}}>{key.replace(/([A-Z])/g,' $1').trim()}</span>
                <span style={{marginLeft:'auto',padding:'2px 8px',borderRadius:'20px',
                  fontSize:'10px',fontWeight:700,
                  background:present?'rgba(248,113,113,.15)':'rgba(74,222,128,.15)',
                  color:present?'#DC2626':'#16A34A'}}>
                  {present?'Present':'Not Present'}
                </span>
              </div>
              {typeof val==='object'&&val!==null&&Object.entries(val).map(([k,v]:any)=>(
                k!=='present'&&k!=='isPresent'&&(
                  <div key={k} style={{fontSize:'12px',color:'var(--tx2)',marginTop:'4px'}}>
                    <strong>{k}:</strong> {String(v)}
                  </div>
                )
              ))}
            </div>
          )
        })}
      </div>
    )

    // ── ANALYSIS/INTERPRET ──
    if (tab==='interpret') return (
      <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
        {!data ? <div style={{padding:'20px',color:'var(--txm)',fontSize:'13px'}}>
          Analysis not available — requires AI key</div> :
        [
          {key:'personality',label:'Personality & Character'},
          {key:'career',label:'Career & Profession'},
          {key:'marriage',label:'Marriage & Relationships'},
          {key:'currentPeriod',label:'Current Period Analysis'},
        ].map(({key,label})=>{
          // Each section is {success, data: {horoscopeId, topic, interpretation}}
          const raw = (data as any)[key]
          if (!raw) return null
          const text = raw?.data?.interpretation || raw?.interpretation ||
                       raw?.data?.text || raw?.text || raw?.summary ||
                       (typeof raw==='string'?raw:null)
          return (
            <div key={key} className="card">
              <div className="card-hd">
                <span className="card-title">{label}</span>
                {raw?.data?.currentDasa&&(
                  <span style={{marginLeft:'auto',fontSize:'11px',color:'var(--gold)'}}>
                    {raw.data.currentDasa}
                  </span>
                )}
              </div>
              <div className="card-bd" style={{fontSize:'13px',lineHeight:1.8,color:'var(--tx2)'}}>
                {text||<span style={{color:'var(--txm)'}}>AI interpretation temporarily unavailable</span>}
              </div>
            </div>
          )
        })}
      </div>
    )

    // ── FULL REPORT ──
    if (tab==='report') {
      const report = data?.data || data
      const basic = report?.basic
      const planets = report?.planets || []
      return (
        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {!report ? <div style={{padding:'20px',color:'var(--txm)',fontSize:'13px'}}>
            Full report not available</div> :
          <>
            {/* Basic info */}
            {basic && (
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px'}}>
                {[
                  {l:'Name',v:basic.personName},
                  {l:'Lagna',v:gSign(basic.lagnaName||basic.ascendantName||'—')},
                  {l:'Moon',v:gSign(basic.moonSign||basic.moonRasi||'—')},
                  {l:'Nakshatra',v:basic.nakshatra},
                ].map(s=>(
                  <div key={s.l} style={{background:'var(--bg2)',borderRadius:'8px',
                    padding:'10px',border:'1px solid var(--bd)',textAlign:'center'}}>
                    <div style={{fontSize:'9px',color:'var(--txm)',textTransform:'uppercase',
                      letterSpacing:'.05em',marginBottom:'4px'}}>{s.l}</div>
                    <div style={{fontSize:'13px',fontWeight:700,color:'var(--acc)',
                      fontFamily:'Cinzel,serif'}}>{s.v||'—'}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Planet positions from report */}
            {planets.length > 0 && (
              <div className="card">
                <div className="card-hd"><span className="card-title">Planetary Positions</span></div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
                    <thead><tr style={{borderBottom:'2px solid var(--bd)'}}>
                      {['Planet','Rasi','Degree','Nakshatra','Retro'].map(h=>(
                        <th key={h} style={{padding:'7px 10px',textAlign:'left',fontSize:'9px',
                          fontWeight:700,textTransform:'uppercase',color:'var(--txm)'}}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>{planets.map((p:any,i:number)=>(
                      <tr key={i} style={{borderBottom:'1px solid var(--bd)',
                        background:i%2?'var(--bg2)':'transparent'}}>
                        <td style={{padding:'7px 10px',fontWeight:700,color:'var(--acc)',
                          fontFamily:'Cinzel,serif'}}>{gPlanet(p.planet||p.Planet||'')} </td>
                        <td style={{padding:'7px 10px'}}>{gSign(p.rasi||p.rasiName||p.Rasi||'—')}</td>
                        <td style={{padding:'7px 10px',color:'var(--txm)',fontSize:'11px'}}>
                          {typeof(p.degree||p.longitude)==='number'?(p.degree||p.longitude).toFixed(2)+'°':'—'}</td>
                        <td style={{padding:'7px 10px'}}>{p.nakshatra||p.nakshatraName||'—'}</td>
                        <td style={{padding:'7px 10px',textAlign:'center'}}>
                          {(p.retrograde||p.isRetrograde)&&<span style={{color:'#F87171'}}>℞</span>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Interpretation if present */}
            {report?.interpretation && (
              <div className="card">
                <div className="card-hd"><span className="card-title">AI Interpretation</span></div>
                <div className="card-bd" style={{fontSize:'13px',lineHeight:1.8,color:'var(--tx2)'}}>
                  {report.interpretation}
                </div>
              </div>
            )}
          </>}
        </div>
      )
    }

    return <div style={{padding:'20px',color:'var(--txm)'}}>Select a tab to view data</div>
  }

  return (
    <div style={{maxWidth:'1400px',margin:'0 auto',padding:'16px'}}>
      <div style={{marginBottom:'16px'}}>
        <h1 style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'20px',color:'var(--acc)'}}>
          {t('chart.title')}
        </h1>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'210px 1fr',gap:'16px'}} className="chart-grid">

        {/* Sidebar */}
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <button onClick={()=>{setResult(null);setErr('');setTabData({})}}
            style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',
              padding:'9px',borderRadius:'10px',border:'2px dashed var(--gold)',
              background:'rgba(196,146,42,.06)',color:'var(--gold)',cursor:'pointer',
              fontFamily:'Cinzel,serif',fontSize:'12px',fontWeight:600}}>
            <Plus style={{width:'14px',height:'14px'}}/> New Chart
          </button>

          <div className="card">
            <div className="card-hd">
              <User style={{width:'12px',height:'12px',color:'var(--gold)'}}/>
              <span className="card-title" style={{fontSize:'11px'}}>{t('chart.section')}</span>
            </div>
            <div className="card-bd" style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              <input className="input" style={{fontSize:'11px',padding:'6px 9px'}}
                value={name} onChange={e=>setName(e.target.value)} placeholder="Name (optional)"/>
              <DatePicker value={dob} onChange={setDob} showTime showUnknown prefix="c"/>
              <div style={{position:'relative'}}>
                <MapPin style={{position:'absolute',left:'9px',top:'50%',
                  transform:'translateY(-50%)',width:'10px',height:'10px',color:'var(--txm)'}}/>
                <input className="input" style={{fontSize:'11px',padding:'6px 9px 6px 26px'}}
                  value={place} onChange={e=>setPlace(e.target.value)} placeholder="City, Country"/>
              </div>
              {err&&<div style={{fontSize:'10px',color:'var(--bad,#7A1F1F)',
                background:'rgba(122,31,31,.08)',padding:'6px',borderRadius:'6px'}}>{err}</div>}
              {!token&&<div style={{fontSize:'10px',color:'var(--warn,#9C6B14)',
                background:'rgba(156,107,20,.08)',padding:'6px',borderRadius:'6px'}}>
                🔒 Sign in to save charts</div>}
              <button onClick={handleGenerate} disabled={loading} className="btn-primary"
                style={{fontSize:'11px',padding:'8px',display:'flex',alignItems:'center',
                  justifyContent:'center',gap:'5px'}}>
                {loading?<><RefreshCw style={{width:'11px',height:'11px'}}/> Calculating...</>
                  :<>{t('chart.generate')} <ChevronRight style={{width:'12px',height:'12px'}}/></>}
              </button>
            </div>
          </div>

          {token&&(
            <div className="card">
              <div className="card-hd">
                <Star style={{width:'12px',height:'12px',color:'var(--gold)'}}/>
                <span className="card-title" style={{fontSize:'11px'}}>Saved</span>
                <span style={{marginLeft:'auto',fontSize:'10px',color:'var(--txm)'}}>{saved.length}</span>
              </div>
              <div style={{maxHeight:'260px',overflowY:'auto'}}>
                {saved.length===0
                  ?<div style={{padding:'10px',fontSize:'11px',color:'var(--txm)',textAlign:'center'}}>
                    No charts yet</div>
                  :saved.map((c:any)=>{
                    const id=c.horoscopeId||c.HoroscopeId
                    return (
                      <button key={id} onClick={()=>openSaved(id)}
                        style={{width:'100%',display:'flex',flexDirection:'column',
                          alignItems:'flex-start',padding:'8px 12px',border:'none',
                          borderBottom:'1px solid var(--bd)',background:'none',cursor:'pointer'}}
                        onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
                        onMouseLeave={e=>e.currentTarget.style.background='none'}>
                        <div style={{fontSize:'12px',fontWeight:600,color:'var(--tx)',
                          fontFamily:'Cinzel,serif'}}>{c.personName||c.PersonName}</div>
                        <div style={{fontSize:'10px',color:'var(--txm)',marginTop:'1px'}}>
                          {(c.ascendantName||c.AscendantName)||c.placeName||c.PlaceName||''}
                          {(c.moonRasi||c.MoonRasi)?` · ${c.moonRasi||c.MoonRasi}`:''}</div>
                        {(c.nakshatraName||c.NakshatraName)&&(
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

        {/* Main */}
        <div>
          {result?(
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>

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
              <div style={{display:'flex',gap:'2px',borderBottom:'2px solid var(--bd)',
                flexWrap:'wrap',alignItems:'flex-end'}}>
                {TABS.map(t2=>(
                  <button key={t2.key} onClick={()=>setTab(t2.key)}
                    style={{padding:'6px 12px',fontSize:'11px',fontWeight:600,border:'none',
                      background:'none',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap',
                      color:tab===t2.key?'var(--acc)':'var(--txm)',
                      borderBottom:tab===t2.key?'2px solid var(--gold)':'2px solid transparent',
                      marginBottom:'-2px'}}>
                    {t2.label}
                  </button>
                ))}
                <div style={{marginLeft:'auto',paddingBottom:'2px'}}>
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
                <div className="card-bd">
                  <TabContent/>
                </div>
              </div>

            </div>
          ):(
            <div className="card" style={{padding:'60px 32px',display:'flex',
              flexDirection:'column',alignItems:'center',justifyContent:'center',
              textAlign:'center',gap:'16px',minHeight:'400px'}}>
              <div style={{fontSize:'56px'}}>🌟</div>
              <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'18px',
                color:'var(--acc)'}}>Vedic Birth Chart</div>
              <p style={{fontSize:'13px',color:'var(--txm)',maxWidth:'280px',lineHeight:1.7}}>
                Enter birth details to generate your complete Vedic chart with
                North/South Indian styles, Shadbala, Ashtakavarga, Doshas and full analysis.
              </p>
              {!token&&(
                <button onClick={()=>{setRedirectAfterLogin('/chart');router.push('/signup')}}
                  className="btn-primary" style={{padding:'10px 24px',fontFamily:'Cinzel,serif'}}>
                  Sign up free to start
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
