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
        // Try auth endpoint first (saved charts with login)
        const r1 = await getAshtakavarga(horoId).catch(() => null)
        // API returns { success, data: { sav:[{rasiName,rawBindu}], bav:[...], totalSAV } }
        const d1 = r1?.data?.data ?? r1?.data ?? r1
        if (d1 && !d1.statusCode && (d1.sav?.length || d1.bav?.length)) return d1

        const r2 = await getAshtakavargaGuest(horoId).catch(() => null)
        const d2 = r2?.data?.data ?? r2?.data ?? r2
        if (d2 && !d2.statusCode && (d2.sav?.length || d2.bav?.length)) return d2
        return null
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
        // Always compute from chart planets already loaded — no extra API call needed
        const ps = (navData?.planets || navData?.Planets || []) as any[]
        
        const house = (planet: string): number => {
          const p = ps.find((x:any) => (x.planet||x.Planet) === planet)
          return p ? (p.house || p.House || 0) : 0
        }
        const rasi = (planet: string): number => {
          const p = ps.find((x:any) => (x.planet||x.Planet) === planet)
          return p ? (p.rasi || p.Rasi || 0) : 0
        }

        const marsH = house('Mars');   const rahuH = house('Rahu')
        const ketuH = house('Ketu');   const moonH = house('Moon')
        const jupH  = house('Jupiter'); const sunH  = house('Sun')
        const satH  = house('Saturn'); const venH  = house('Venus')
        const bodyPlanets = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']

        // 1. Mangal Dosha: Mars in 1,2,4,7,8,12
        const mangalPresent = marsH > 0 && [1,2,4,7,8,12].includes(marsH)

        // 2. Kaal Sarpa: all 7 planets between Rahu and Ketu axis
        const rahuRasi = rasi('Rahu'), ketuRasi = rasi('Ketu')
        const ksPresent = rahuRasi > 0 && ketuRasi > 0 && bodyPlanets.every(pn => {
          const r = rasi(pn); if (!r) return true
          const start = rahuRasi, end = ketuRasi
          return start < end ? (r > start && r < end) : (r > start || r < end)
        })

        // 3. Guru Chandal: Jupiter same house as Rahu or Ketu
        const guruChandalPresent = jupH > 0 && (jupH === rahuH || jupH === ketuH)

        // 4. Kemadruma: Moon has no planets in 2nd/12th house from Moon
        const moonAdj = [((moonH - 2 + 12) % 12) + 1, moonH % 12 + 1]
        const kemadrumaPresent = moonH > 0 && !bodyPlanets.some(pn => moonAdj.includes(house(pn)))

        // 5. Grahan Dosha: Sun or Moon conjunct Rahu or Ketu
        const grahanPresent = (sunH > 0 && (sunH === rahuH || sunH === ketuH)) ||
                              (moonH > 0 && (moonH === rahuH || moonH === ketuH))

        // 6. Shrapit Dosha: Saturn conjunct Rahu
        const shrapitPresent = satH > 0 && satH === rahuH

        // 7. Vish Yoga: Saturn + Moon same house
        const vishPresent = satH > 0 && moonH > 0 && satH === moonH

        // 8. Pitra Dosha: Sun + Rahu same house (6th/9th axis)
        const pitraPresent = sunH > 0 && sunH === rahuH

        const doshas = [
          { name: 'Mangal Dosha',    isPresent: mangalPresent,   severity: mangalPresent ? 'Medium' : 'None',
            description: mangalPresent ? `Mars in house \${marsH} — creates friction in relationships and marriage.` : 'Mars is well-placed. No Mangal Dosha.',
            remedies: mangalPresent ? 'Worship Lord Hanuman on Tuesdays. Wear red coral after consulting an astrologer.' : '' },
          { name: 'Kaal Sarpa Dosha', isPresent: ksPresent,       severity: ksPresent ? 'High' : 'None',
            description: ksPresent ? 'All planets between Rahu-Ketu axis — periods of struggle and delay before breakthrough.' : 'No Kaal Sarpa Dosha. Planets are not enclosed by Rahu-Ketu axis.',
            remedies: ksPresent ? 'Perform Kaal Sarpa puja at Trimbakeshwar. Chant Maha Mrityunjaya mantra.' : '' },
          { name: 'Guru Chandal Dosha', isPresent: guruChandalPresent, severity: guruChandalPresent ? 'Medium' : 'None',
            description: guruChandalPresent ? `Jupiter conjunct \${jupH === rahuH ? 'Rahu' : 'Ketu'} — can cloud wisdom and ethics.` : 'Jupiter is free from Rahu/Ketu influence.',
            remedies: guruChandalPresent ? 'Donate yellow items on Thursdays. Chant Guru Beeja mantra.' : '' },
          { name: 'Kemadruma Dosha', isPresent: kemadrumaPresent,  severity: kemadrumaPresent ? 'Low' : 'None',
            description: kemadrumaPresent ? 'Moon isolated — no planets in adjacent houses. May cause emotional instability.' : 'Moon has planetary support. No Kemadruma Dosha.',
            remedies: kemadrumaPresent ? 'Offer water to the Moon on Mondays. Keep silver items.' : '' },
          { name: 'Grahan Dosha',    isPresent: grahanPresent,    severity: grahanPresent ? 'High' : 'None',
            description: grahanPresent ? 'Sun or Moon eclipsed by Rahu/Ketu — health and vitality may be affected.' : 'No eclipse combination on luminaries.',
            remedies: grahanPresent ? 'Chant Surya or Chandra mantra daily. Donate on eclipse days.' : '' },
          { name: 'Shrapit Dosha',   isPresent: shrapitPresent,   severity: shrapitPresent ? 'High' : 'None',
            description: shrapitPresent ? 'Saturn conjunct Rahu — karmic delays and obstacles in life.' : 'No Saturn-Rahu conjunction.',
            remedies: shrapitPresent ? 'Perform Shrapit Dosha nivaran puja. Feed crows on Saturdays.' : '' },
          { name: 'Vish Yoga',       isPresent: vishPresent,      severity: vishPresent ? 'Medium' : 'None',
            description: vishPresent ? `Saturn and Moon in house \${satH} — emotional heaviness and pessimism.` : 'Saturn and Moon are in different houses.',
            remedies: vishPresent ? 'Wear pearl after consulting astrologer. Chant Chandra mantra on Mondays.' : '' },
          { name: 'Pitra Dosha',     isPresent: pitraPresent,     severity: pitraPresent ? 'Medium' : 'None',
            description: pitraPresent ? 'Sun conjunct Rahu — ancestral karma affecting the chart. Obstacles from past-life debts.' : 'No Sun-Rahu conjunction indicating Pitra Dosha.',
            remedies: pitraPresent ? 'Perform Pitra Tarpan on Amavasya. Offer food to the needy on Sundays.' : '' },
        ]

        const presentDoshas  = doshas.filter(d => d.isPresent)
        const majorDoshas    = presentDoshas.filter(d => d.severity === 'High')
        const summaryText    = presentDoshas.length === 0
          ? 'No major doshas found in this chart. The planetary positions are generally harmonious.'
          : `\${presentDoshas.length} dosha\${presentDoshas.length > 1 ? 's' : ''} found: \${presentDoshas.map(d => d.name).join(', ')}.`

        return {
          doshas,
          totalDoshasFound: presentDoshas.length,
          hasMajorDosha:    majorDoshas.length > 0,
          summary:          summaryText,
        }
