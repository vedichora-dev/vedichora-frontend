'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
const CityAutocomplete = dynamic(() => import('@/components/ui/CityAutocomplete'), { ssr: false })
import { calculateChart, calculateChartGuest, listCharts } from '@/api'
import { useStore } from '@/store'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const MOON_SIGNS = [
  { name:'Aries',       elem:'Fire',  color:'#C0392B', planet:'Mars',    trait:'Bold, driven, pioneering',      dates:'Mar 21–Apr 19' },
  { name:'Taurus',      elem:'Earth', color:'#27AE60', planet:'Venus',   trait:'Stable, sensual, devoted',      dates:'Apr 20–May 20' },
  { name:'Gemini',      elem:'Air',   color:'#2980B9', planet:'Mercury', trait:'Curious, witty, adaptable',     dates:'May 21–Jun 20' },
  { name:'Cancer',      elem:'Water', color:'#16A085', planet:'Moon',    trait:'Nurturing, intuitive, deep',    dates:'Jun 21–Jul 22' },
  { name:'Leo',         elem:'Fire',  color:'#D4A52B', planet:'Sun',     trait:'Creative, radiant, generous',   dates:'Jul 23–Aug 22' },
  { name:'Virgo',       elem:'Earth', color:'#8E44AD', planet:'Mercury', trait:'Precise, healing, devoted',     dates:'Aug 23–Sep 22' },
  { name:'Libra',       elem:'Air',   color:'#E91E8C', planet:'Venus',   trait:'Harmonious, just, elegant',     dates:'Sep 23–Oct 22' },
  { name:'Scorpio',     elem:'Water', color:'#922B21', planet:'Pluto',   trait:'Intense, magnetic, transforming',dates:'Oct 23–Nov 21' },
  { name:'Sagittarius', elem:'Fire',  color:'#CA6F1E', planet:'Jupiter', trait:'Free, philosophical, joyful',   dates:'Nov 22–Dec 21' },
  { name:'Capricorn',   elem:'Earth', color:'#2C3E50', planet:'Saturn',  trait:'Ambitious, disciplined, wise',  dates:'Dec 22–Jan 19' },
  { name:'Aquarius',    elem:'Air',   color:'#1F618D', planet:'Uranus',  trait:'Innovative, unique, visionary', dates:'Jan 20–Feb 18' },
  { name:'Pisces',      elem:'Water', color:'#6C3483', planet:'Neptune', trait:'Dreamy, empathic, spiritual',   dates:'Feb 19–Mar 20' },
]

const PREDS: {[key:string]:{[key:string]:string}} = {
  Aries: {
    Love:'Your directness is magnetic right now. Someone appreciates your honesty -- let yourself be seen without armour.',
    Career:'Bold moves pay off this week. Trust your instincts on a decision you\'ve been sitting with.',
    Wellbeing:'Channel excess energy into movement. Your body thrives when your mind is challenged.',
    Finance:'An opportunity to act decisively on a financial matter -- do your homework first, then commit fully.',
  },
  Taurus: {
    Love:'Patience in love is your strength. Depth of connection matters more than speed -- trust the slow build.',
    Career:'Your reliability is noticed by those who matter. Steady progress brings you closer to a significant milestone.',
    Wellbeing:'Honour your need for rest and sensory pleasure. A peaceful environment restores you deeply.',
    Finance:'Conservative choices serve you well now. Security is being built even when it feels slow.',
  },
  Gemini: {
    Love:'Conversation is your love language -- and it\'s working beautifully. Keep the exchange light, curious and fun.',
    Career:'Multiple ideas are competing for your attention. Choose the one with the most genuine excitement behind it.',
    Wellbeing:'Your nervous system needs grounding. Short walks in nature calm the constant mental chatter.',
    Finance:'Research before committing. Your natural curiosity will find the best option if you look carefully.',
  },
  Cancer: {
    Love:'Your emotional intelligence makes you extraordinarily lovable. Let someone see your vulnerability -- it connects.',
    Career:'Trust your intuition on a workplace dynamic. You sense something others have missed -- you\'re right.',
    Wellbeing:'Home is your sanctuary right now. Nourishing food and meaningful connections restore you completely.',
    Finance:'Family and home-related finances come into focus. Security matters -- trust your cautious instincts.',
  },
  Leo: {
    Love:'Your warmth draws people in effortlessly. A creative shared experience deepens a bond meaningfully.',
    Career:'Step forward and own your expertise. Leadership is not arrogance -- it\'s answering a genuine call.',
    Wellbeing:'Joy is medicine for you. Seek out what genuinely makes your heart light and follow it deliberately.',
    Finance:'Generosity brings return. Investing in yourself -- skills, appearance, confidence -- pays real dividends.',
  },
  Virgo: {
    Love:'Your attentiveness is a profound form of love. Notice how your small gestures create lasting impressions.',
    Career:'A detail you\'ve been refining is ready. Perfectionism served its purpose -- now release and present.',
    Wellbeing:'Digestive health and daily routine are your foundations. Small consistent habits build remarkable resilience.',
    Finance:'Analysis pays off. You see what others miss -- trust your careful reading of a financial situation.',
  },
  Libra: {
    Love:'Balance in giving and receiving is your lesson now. You deserve the same thoughtfulness you offer others.',
    Career:'Your ability to see all sides makes you invaluable in a current negotiation or collaboration.',
    Wellbeing:'Beauty and harmony are not luxuries -- they\'re necessities for your wellbeing. Create them deliberately.',
    Finance:'Fair exchange matters. Ensure partnerships -- financial or professional -- are genuinely equitable.',
  },
  Scorpio: {
    Love:'Profound emotional honesty opens a door you\'ve kept guarded. Someone is ready to meet you at that depth.',
    Career:'Your research and insight give you an edge others simply don\'t have. Use this power responsibly.',
    Wellbeing:'Transformation requires releasing the old. Let go of what no longer serves with intention and grace.',
    Finance:'Hidden assets or overlooked opportunities surface now. Look below the obvious layer.',
  },
  Sagittarius: {
    Love:'Your optimism is contagious and deeply attractive. Adventures shared create bonds that last.',
    Career:'Think bigger. The horizon you\'ve been aiming for is closer than your current vantage point suggests.',
    Wellbeing:'Freedom of movement feeds your soul. Travel, exploration or simply new environments restore you fully.',
    Finance:'Expansive thinking opens financial doors -- while keeping practicality close to ensure sound choices.',
  },
  Capricorn: {
    Love:'Your devotion runs deep though you show it quietly. Let someone see the warmth beneath the composure.',
    Career:'Long-term effort is crystallising into something tangible. Recognition arrives in proportion to your patience.',
    Wellbeing:'Rest without guilt. Your body is asking for recovery -- honour it as part of your high standards.',
    Finance:'Disciplined choices made earlier are bearing fruit. Stay the course -- the plan is working.',
  },
  Aquarius: {
    Love:'Your uniqueness is your greatest gift in relationship. Someone values your unconventional perspective deeply.',
    Career:'Innovation you\'ve championed is gaining ground. The future belongs to those who imagined it clearly.',
    Wellbeing:'Community and belonging nourish your spirit as much as solitude. Seek both with intentionality.',
    Finance:'Unconventional financial ideas deserve serious consideration now. Research thoroughly then act boldly.',
  },
  Pisces: {
    Love:'Your empathy creates extraordinary intimacy. Allow yourself to receive as generously as you give.',
    Career:'Creative and intuitive work reaches new heights. Trust impressions that don\'t have immediate logical backing.',
    Wellbeing:'Water, sleep and creative expression are your three pillars of health. Prioritise all three deliberately.',
    Finance:'Intuition about a financial matter is worth examining carefully. Look beyond surface appearances.',
  },
}

const COMPAT: {[key:string]:{score:number,label:string,desc:string}} = {
  'Fire-Fire':{score:88,label:'Blazing Together',desc:'Passionate, energetic and mutually inspiring. You push each other towards greatness -- just watch for power clashes.'},
  'Fire-Air':{score:85,label:'Fan the Flames',desc:'Air fuels Fire beautifully. Stimulating conversation, shared adventures and genuine mutual admiration flow naturally.'},
  'Fire-Earth':{score:62,label:'Grounded Sparks',desc:'Earth steadies Fire while Fire energises Earth. Different rhythms -- but real growth happens when you honour the contrast.'},
  'Fire-Water':{score:67,label:'Steam & Intensity',desc:'Magnetic chemistry with emotional complexity. Deep bonds form when both partners honour each other\'s very different needs.'},
  'Earth-Earth':{score:92,label:'Built to Last',desc:'Exceptional loyalty, shared values and quiet devotion. You build together with patience and an eye firmly on the long term.'},
  'Earth-Water':{score:88,label:'Fertile Ground',desc:'Water nourishes Earth while Earth provides Water with security. A naturally supportive, emotionally rich partnership.'},
  'Earth-Air':{score:58,label:'Different Rhythms',desc:'Air brings ideas, Earth brings follow-through. Real complementarity exists -- patience and appreciation bridge the gap.'},
  'Earth-Fire':{score:62,label:'Grounded Sparks',desc:'Different energies that teach each other. Earth provides stability while Fire brings excitement neither could create alone.'},
  'Air-Air':{score:86,label:'Meeting of Minds',desc:'Brilliant intellectual connection, endless conversation and shared curiosity keep this partnership lively and genuinely fresh.'},
  'Air-Water':{score:71,label:'Heart & Mind',desc:'Head meets heart -- complementary when you communicate about your different processing styles with patience and curiosity.'},
  'Air-Fire':{score:85,label:'Fan the Flames',desc:'Dynamic and stimulating. Ideas inspire action, adventure is always possible and you genuinely bring out each other\'s best.'},
  'Air-Earth':{score:58,label:'Different Rhythms',desc:'Air sees possibility, Earth seeks proof. Together you are more complete -- appreciate what the other brings unconditionally.'},
  'Water-Water':{score:90,label:'Oceanic Bond',desc:'Extraordinary emotional depth, intuitive understanding and a profoundly healing bond that few other combinations achieve.'},
  'Water-Fire':{score:67,label:'Steam & Intensity',desc:'Intense chemistry -- emotional Water and passionate Fire create a magnetic connection that is never boring or predictable.'},
  'Water-Earth':{score:88,label:'Fertile Ground',desc:'Deep mutual nourishment. Earth provides the security Water craves; Water brings emotional richness Earth quietly needs.'},
  'Water-Air':{score:71,label:'Heart & Mind',desc:'Feeling meets intellect. With genuine communication and curiosity about your differences, this becomes beautifully complementary.'},
}

function getMoon(dd:number,mm:number,yyyy:number):number{
  const base=new Date(yyyy,mm-1,dd).getTime()
  return Math.floor(((base/86400000)+13)%360/30)%12
}

function getCompat(a:number,b:number){
  const ea=MOON_SIGNS[a].elem,eb=MOON_SIGNS[b].elem
  return COMPAT[`${ea}-${eb}`]||COMPAT[`${eb}-${ea}`]||{score:72,label:'Unique Connection',desc:'Your combination is rare -- growth comes through genuine curiosity about each other.'}
}

const CURRENCIES=[
  {code:'USD',sym:'$',flag:'🇺🇸',name:'US Dollar'},
  {code:'EUR',sym:'€',flag:'🇪🇺',name:'Euro'},
  {code:'GBP',sym:'£',flag:'🇬🇧',name:'British Pound'},
  {code:'AUD',sym:'A$',flag:'🇦🇺',name:'Australian Dollar'},
  {code:'CAD',sym:'C$',flag:'🇨🇦',name:'Canadian Dollar'},
  {code:'SGD',sym:'S$',flag:'🇸🇬',name:'Singapore Dollar'},
  {code:'INR',sym:'₹',flag:'🇮🇳',name:'Indian Rupee'},
]

const THEMES=[
  {key:'cream', label:'Ivory',   bg:'#FDFAF3',surf:'#FFFFFF',tx:'#1A1208',tx2:'#5C4A2A',acc:'#7A4A1A',gold:'#C4922A',bd:'#E8D8B8'},
  {key:'rose',  label:'Rose',    bg:'#FDF5F8',surf:'#FFFFFF',tx:'#2D0A18',tx2:'#7A3050',acc:'#9B2355',gold:'#C4922A',bd:'#EDD0DC'},
  {key:'sage',  label:'Sage',    bg:'#F2F7F2',surf:'#FFFFFF',tx:'#0A200A',tx2:'#305030',acc:'#2D6030',gold:'#C4922A',bd:'#C8DCC8'},
  {key:'slate', label:'Slate',   bg:'#F4F6F9',surf:'#FFFFFF',tx:'#0A1020',tx2:'#304060',acc:'#1A4080',gold:'#C4922A',bd:'#C8D4E8'},
  {key:'lavender',label:'Lavender',bg:'#F6F4FD',surf:'#FFFFFF',tx:'#140828',tx2:'#4A3070',acc:'#5B3A9E',gold:'#C4922A',bd:'#D8CFF0'},
  {key:'midnight',label:'Midnight',bg:'#0D0D18',surf:'#16162A',tx:'#E8E0F0',tx2:'#A898C8',acc:'#9B72EF',gold:'#D4A52B',bd:'#2A2850'},
  {key:'forest', label:'Forest',  bg:'#0C1810',surf:'#162814',tx:'#E0EEE0',tx2:'#80A880',acc:'#3A8A3A',gold:'#D4A52B',bd:'#2A4A2A'},
]

type Tab='horoscope'|'compatibility'|'chart'
const DAYS=Array.from({length:31},(_,i)=>i+1)
const YEARS_100=Array.from({length:100},(_,i)=>2025-i)

function Sel({value,onChange,opts,placeholder,w}:{value:number|string,onChange:(v:string)=>void,opts:{v:number|string,l:string}[],placeholder:string,w?:string}){
  return(
    <select value={value||''} onChange={e=>onChange(e.target.value)}
      style={{width:w||'100%',padding:'10px 12px',borderRadius:'10px',fontSize:'14px',
        cursor:'pointer',appearance:'none',WebkitAppearance:'none',
        border:'1.5px solid var(--w-bd)',background:'var(--w-surf)',color:'var(--w-tx)',
        fontFamily:'inherit',outline:'none'}}>
      <option value="" style={{background:'var(--w-surf)'}}>{placeholder}</option>
      {opts.map(o=><option key={o.v} value={o.v} style={{background:'var(--w-surf)'}}>{o.l}</option>)}
    </select>
  )
}


// ── Western Layered Matching Section ─────────────────────────────────────
function WesternDashaSection({
  compatResult, name1, name2, scoreColor, saved, token, together
}: {
  compatResult: any; name1: string; name2: string
  scoreColor: (n:number)=>string; saved: any[]; token: string|null; together: 'yes'|'no'
}) {
  const r       = compatResult as any
  const [deep, setDeep]       = useState<any>(null)
  const [viewMode, setViewMode] = useState<'simple'|'detailed'>('simple')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded]   = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [demoMode, setDemoMode] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDemoMode(new URLSearchParams(window.location.search).get('demo') === '1')
    }
  }, [])

  // Auto-load deep whenever compatResult arrives with chart IDs
  useEffect(() => {
    const preloaded = (compatResult as any)?.deepResult ?? null
    if (preloaded && !loaded) {
      // Deep result came bundled with compatResult (from calcRealCompat)
      setDeep(preloaded)
      setLoaded(true)
    } else if (!preloaded && hid1 && hid2 && !loaded && !loading) {
      // No bundled deep — auto-load it immediately
      loadDeep()
    }
  }, [compatResult])
  const [relType, setRelType] = useState('Other')
  const [mode, setMode]       = useState<'3m'|'6m'|'5y'|'10y'|'past'|'full'>('10y')
  const ashta   = r?.AshtaKootaScore   ?? r?.ashtaKootaScore   ?? 0
  const aTotal  = r?.AshtaKootaTotal   ?? r?.ashtaKootaTotal   ?? 36
  const pathu   = r?.PathuPoruthamScore?? r?.pathuPoruthamScore?? 0
  const pTotal  = 10
  const rajjuOk = r?.RajjuPass ?? r?.rajjuPass ?? true
  const hid1    = r?.hid1 || r?.horoscopeId1
  const hid2    = r?.hid2 || r?.horoscopeId2
  const hasSaved= !!(hid1 && hid2)

  // Use overlay engine deepCompatScore if available (−1 to +1 → 0 to 100)
  // Otherwise fall back to Ashta Koota + Pathu blend
  const rawDeep = r?.deepResult?.deepCompatScore ?? r?.deepResult?.deepScore
  const score   = rawDeep !== undefined && rawDeep !== null
    ? Math.round((rawDeep + 1) / 2 * 100)  // −1..+1 → 0..100
    : Math.round((ashta / aTotal * 0.55 + pathu / pTotal * 0.35 + (rajjuOk ? 0.10 : 0)) * 100)
  const label   = score >= 80 ? 'Exceptional Match'
                : score >= 65 ? 'Strong Match'
                : score >= 50 ? 'Good Match'
                : score >= 38 ? 'Average Match'
                : score >= 22 ? 'Needs Consideration'
                : 'Not Compatible'
  const desc    = together === 'yes' ? (
    score >= 80
    ? `${name1} and ${name2} show exceptional alignment across all major factors. The foundations here are genuinely strong.`
    : score >= 65
    ? `${name1} and ${name2} show strong compatibility. The relationship has solid foundations with a few areas worth conscious attention.`
    : score >= 50
    ? `${name1} and ${name2} show good compatibility overall. Some differences exist but the relationship can thrive with awareness.`
    : score >= 38
    ? `${name1} and ${name2} show average compatibility. Conscious effort in specific areas will make the difference.`
    : score >= 22
    ? `${name1} and ${name2} face real friction in core areas. This can still work, but it will take sustained, deliberate effort from both sides — go in aware of that.`
    : `${name1} and ${name2} show fundamental incompatibility across the areas that matter most here. This isn't a small gap to work around — it's worth taking seriously before committing further.`
  ) : (
    score >= 80
    ? `If ${name1} and ${name2} were to be together, they would show exceptional alignment across all major factors — genuinely strong foundations to build on.`
    : score >= 65
    ? `If ${name1} and ${name2} were to be together, they would have solid foundations, with a few areas worth conscious attention going in.`
    : score >= 50
    ? `If ${name1} and ${name2} were to be together, the compatibility looks good overall — some differences exist but the relationship could thrive with awareness.`
    : score >= 38
    ? `If ${name1} and ${name2} were to be together, compatibility would be average — conscious effort in specific areas would make the difference.`
    : score >= 22
    ? `If ${name1} and ${name2} were to be together, there would be real friction in core areas. It could still work, but would take sustained, deliberate effort from both sides.`
    : `If ${name1} and ${name2} were to be together, there would be fundamental incompatibility across the areas that matter most here. Worth knowing clearly before going further.`
  )

  const loadDeep = async (overrideMode?: typeof mode) => {
    const useMode = overrideMode ?? mode
    if (!hid1 || !hid2) return
    if (useMode === 'full' && !demoMode) { setShowPaywall(true); return }
    setLoading(true)
    try {
      const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'
      const now = 2026
      const body: any = {
        GroomId: hid1, BrideId: hid2,
        RelationshipType: relType,
        GroomName: r?.name1 || name1,
        BrideName: r?.name2 || name2,
      }
      if (useMode === '3m')  {
        const t = new Date()
        const from3 = new Date(t); from3.setMonth(from3.getMonth() - 1)   // small past buffer for testing
        const to3   = new Date(t); to3.setMonth(to3.getMonth() + 3)
        body.FromDate = from3.toISOString().slice(0,10)
        body.ToDate   = to3.toISOString().slice(0,10)
      }
      if (useMode === '6m')  {
        const t = new Date()
        const from6 = new Date(t); from6.setMonth(from6.getMonth() - 1)   // 1mo buffer into the past for testing
        const to6   = new Date(t); to6.setMonth(to6.getMonth() + 6)
        body.FromDate = from6.toISOString().slice(0,10)
        body.ToDate   = to6.toISOString().slice(0,10)
      }
      if (useMode === '5y')   { body.FromYear = now - 1;  body.ToYear = now + 5 }   // small past buffer for testing
      if (useMode === '10y')  { body.FromYear = now;      body.ToYear = now + 10 }
      if (useMode === 'past') { body.FromYear = now - 10; body.ToYear = now }
      if (useMode === 'full') { body.FullRange = true }
      const hdrs: any = { 'Content-Type': 'application/json' }
      if (token) hdrs['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${CHART_URL}/api/matchmaking/deep`, {
        method: 'POST', headers: hdrs, body: JSON.stringify(body)
      }).then(r => r.json())
      setDeep(res?.data?.data ?? res?.data ?? res)
    } catch {}
    setLoading(false); setLoaded(true)
  }

  const yearSummary: any[] = deep?.yearSummary ?? []
  const crossPreds: any[]  = deep?.crossPredictions ?? []
  const p1Infl: any[]      = deep?.p1Influences ?? []
  const p2Infl: any[]      = deep?.p2Influences ?? []
  const truncate = (s:string, max:number) => {
    if (!s || s.length <= max) return s
    const cut = s.slice(0, max)
    const lastSpace = cut.lastIndexOf(' ')
    return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut) + '…'
  }
  const friendlyLabel = (label:string) => {
    const L = (label||'').toUpperCase()
    if (L==='CRITICAL')  return 'Very Challenging'
    if (L==='SEVERE')    return 'Highly Challenging'
    if (L==='HIGH')      return 'Challenging'
    if (L==='MODERATE')  return 'Somewhat Challenging'
    return label
  }
  const now = 2026

  // Backend windows can overlap each other and can extend slightly outside the
  // selected range — clamp every period to the actual selected window, then merge
  // any that now overlap/duplicate so the list never shows two rows for the same
  // stretch of time or a date outside the tab that's selected.
  const rangeStart = new Date((deep?.fromYear ?? now - 10), 0, 1)
  const rangeEnd   = new Date((deep?.toYear   ?? now + 10), 11, 31)
  const sevRank: Record<string, number> = { MILD:1, MODERATE:2, MIXED:2, SEVERE:3, HIGH:4, CRITICAL:5, ENEMY:3, 'DEFINITIVE ENEMY':5 }
  const mergePeriods = (periods: any[]) => {
    const clamped = periods
      .map((p: any) => {
        const s = new Date(p.startDate), e = new Date(p.endDate)
        return { ...p, _s: s < rangeStart ? rangeStart : s, _e: e > rangeEnd ? rangeEnd : e }
      })
      .filter((p: any) => p._s <= p._e)
      .sort((a: any, b: any) => a._s.getTime() - b._s.getTime())
    const merged: any[] = []
    for (const p of clamped) {
      const last = merged[merged.length - 1]
      if (last && p._s.getTime() <= last._e.getTime()) {
        if (p._e.getTime() > last._e.getTime()) last._e = p._e
        const curRank = sevRank[(p.label || '').toUpperCase()] || 0
        const lastRank = sevRank[(last.label || '').toUpperCase()] || 0
        if (curRank > lastRank) { last.label = p.label; if (p.note) last.note = p.note }
        else if (!last.note && p.note) { last.note = p.note }
      } else {
        merged.push({ ...p })
      }
    }
    return merged.map((p: any) => ({ ...p, startDate: p._s.toISOString(), endDate: p._e.toISOString() }))
  }
  const bestYears: any[] = mergePeriods(deep?.bestYears ?? [])
  const chalYears: any[] = mergePeriods(deep?.challengingYears ?? [])
  const enmityWindows: any[] = mergePeriods(deep?.adEnmityWindows ?? [])

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'20px'}}>

      {/* ── Big score ─────────────────────────────────────────────────── */}
      <div style={{background:'var(--w-surf)',border:'1px solid var(--w-bd)',borderRadius:'24px',
        padding:'40px 32px',boxShadow:'0 4px 32px rgba(0,0,0,.07)',textAlign:'center'}}>

        {score < 22 && (
          <div style={{background:'#DC2626',color:'#fff',padding:'10px 16px',borderRadius:'10px',
            fontSize:'12px',fontWeight:700,letterSpacing:'.03em',marginBottom:'24px'}}>
            ⚠ Significant Incompatibility Detected
          </div>
        )}

        {/* Circular score */}
        <div style={{position:'relative',width:'160px',height:'160px',margin:'0 auto 24px'}}>
          <svg width="160" height="160" style={{transform:'rotate(-90deg)'}}>
            <circle cx="80" cy="80" r="68" fill="none" stroke="var(--w-bd)" strokeWidth="10"/>
            <circle cx="80" cy="80" r="68" fill="none"
              stroke={scoreColor(score)} strokeWidth="10"
              strokeDasharray={`${2*Math.PI*68*score/100} ${2*Math.PI*68*(1-score/100)}`}
              strokeLinecap="round"/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'40px',fontWeight:800,color:scoreColor(score),lineHeight:1}}>
              {score}
            </div>
            <div style={{fontSize:'12px',color:'var(--w-tx2)',marginTop:'2px'}}>out of 100</div>
          </div>
        </div>

        <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'22px',fontWeight:700,color:'var(--w-tx)',marginBottom:'6px'}}>
          {label}
        </div>
        <div style={{fontSize:'13px',color:'var(--w-tx2)',marginBottom:'6px'}}>
          {name1} & {name2}
        </div>
        <div style={{fontSize:'14px',color:'var(--w-tx)',lineHeight:1.7,maxWidth:'420px',margin:'16px auto 0',
          padding:'14px',background:'var(--w-bg)',borderRadius:'10px',borderLeft:'3px solid var(--w-acc)'}}>
          {desc}
        </div>
      </div>

      {/* ── View toggle ──────────────────────────────────────────────── */}
      {loaded && (
        <div style={{display:'flex',justifyContent:'center',gap:'8px'}}>
          {(['simple','detailed'] as const).map(v=>(
            <button key={v} onClick={()=>setViewMode(v)}
              style={{padding:'7px 18px',fontSize:'11px',borderRadius:'20px',cursor:'pointer',
                border:`1px solid ${viewMode===v?'var(--w-acc)':'var(--w-bd)'}`,
                background:viewMode===v?'var(--w-acc)':'transparent',
                color:viewMode===v?'#fff':'var(--w-tx2)',fontWeight:viewMode===v?700:400,
                textTransform:'capitalize'}}>
              {v==='simple'?'Simple':'Full Detail'}
            </button>
          ))}
        </div>
      )}

      {/* ── Who They Are ──────────────────────────────────────────────── */}
      {viewMode==='detailed' && (p1Infl.length>0 || p2Infl.length>0) && (
        <div style={{background:'var(--w-surf)',border:'1px solid var(--w-bd)',borderRadius:'24px',
          padding:'28px 32px',boxShadow:'0 4px 32px rgba(0,0,0,.07)'}}>
          <div style={{fontSize:'11px',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',
            color:'var(--w-acc)',marginBottom:'18px',textAlign:'center'}}>
            Who They Are
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px'}}>
            {[{nm:name1, infl:p1Infl},{nm:name2, infl:p2Infl}].map(({nm,infl},i)=>{
              const narratives = infl
                .map((p:any)=>p.narrative||p.Narrative)
                .filter(Boolean)
                .slice(0,3)
              return (
                <div key={i}>
                  <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:'15px',
                    color:'var(--w-tx)',marginBottom:'10px',paddingBottom:'8px',borderBottom:'1px solid var(--w-bd)'}}>
                    {nm}
                  </div>
                  {narratives.length>0 ? narratives.map((n:string,j:number)=>(
                    <p key={j} style={{fontSize:'12.5px',color:'var(--w-tx2)',lineHeight:1.7,marginBottom:'8px'}}>{n}</p>
                  )) : (
                    <p style={{fontSize:'12px',color:'var(--w-tx2)',opacity:.6}}>Loading personality details…</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Timeline ─────────────────────────────────────────────────── */}
      <div style={{background:'var(--w-surf)',border:'1px solid var(--w-bd)',borderRadius:'24px',
        padding:'28px 32px',boxShadow:'0 4px 32px rgba(0,0,0,.07)'}}>

        <div style={{fontSize:'11px',fontWeight:700,letterSpacing:'.1em',textTransform:'uppercase',
          color:'var(--w-acc)',marginBottom:'18px',textAlign:'center'}}>
          Compatibility Timeline
          {demoMode && <span style={{marginLeft:'10px',fontSize:'9px',background:'#0F1117',color:'#D4AF55',
            padding:'2px 8px',borderRadius:'10px',letterSpacing:'.05em'}}>DEMO MODE — ALL UNLOCKED</span>}
        </div>

        {/* Saved charts → load deep */}
        {hasSaved && !loaded && (
          <div>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'10px'}}>
              {['Marriage','Business','Sibling','Friendship','Other'].map(rt=>(
                <button key={rt} onClick={()=>setRelType(rt)}
                  style={{padding:'5px 12px',fontSize:'11px',borderRadius:'6px',cursor:'pointer',border:'none',
                    background:relType===rt?'var(--w-acc)':'var(--w-bg)',
                    color:relType===rt?'#fff':'var(--w-tx)',fontWeight:relType===rt?700:400}}>
                  {rt}
                </button>
              ))}
            </div>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginBottom:'14px'}}>
              {([['3m','Next 3 months'],['6m','Next 6 months'],['5y','Next 5 years'],['10y','Next 10 years'],['past','Past 10 years'],['full','Full lifetime ★']] as [string,string][]).map(([v,l])=>(
                <button key={v} onClick={()=>setMode(v as any)}
                  style={{padding:'5px 12px',fontSize:'11px',borderRadius:'6px',cursor:'pointer',border:'none',
                    background:mode===v?'var(--w-acc)':'var(--w-bg)',
                    color:mode===v?'#fff':'var(--w-tx)',fontWeight:mode===v?700:400}}>
                  {l}
                </button>
              ))}
            </div>
            <button onClick={loadDeep} disabled={loading}
              style={{width:'100%',padding:'13px',background:'var(--w-acc)',color:'#fff',border:'none',
                borderRadius:'10px',cursor:'pointer',fontSize:'13px',fontWeight:600,
                fontFamily:"'Playfair Display',Georgia,serif"}}>
              {loading ? 'Analysing…' : 'See Year-by-Year Compatibility →'}
            </button>
          </div>
        )}

        {/* Year timeline */}
        {loaded && yearSummary.length > 2 && (

          <div style={{marginBottom:'20px'}}>
            <div style={{fontSize:'11px',color:'var(--w-tx2)',textAlign:'center',marginBottom:'12px'}}>
              Showing {yearSummary[0]?.year} – {yearSummary[yearSummary.length-1]?.year} · each tile is one year
            </div>
            <div style={{display:'flex',gap:'4px',flexWrap:'wrap',marginBottom:'8px',justifyContent:'center'}}>
              {yearSummary.map((y:any)=>(
                <div key={y.year} title={y.note||y.verdict}
                  style={{width:'42px',height:'34px',borderRadius:'5px',display:'flex',alignItems:'center',
                    justifyContent:'center',fontSize:'10.5px',fontWeight:700,cursor:'default',
                    background:y.verdict==='Favourable'?'#bbf7d0':y.verdict==='Mixed'?'#fed7aa':y.verdict==='Challenging'?'#fdba74':y.verdict==='Difficult'?'#fecaca':'#e5e7eb',
                    color:y.verdict==='Favourable'?'#15803d':y.verdict==='Mixed'?'#92400e':y.verdict==='Challenging'?'#c2410c':y.verdict==='Difficult'?'#dc2626':'#6b7280',
                    border:y.isPast?'1px dashed #9ca3af':'none',opacity:y.isPast?0.7:1}}>
                  {y.year}
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'14px',fontSize:'9px',marginBottom:'16px',flexWrap:'wrap',justifyContent:'center'}}>
              {[['#bbf7d0','#15803d','Favourable'],['#fed7aa','#92400e','Mixed'],['#fdba74','#c2410c','Challenging'],['#fecaca','#dc2626','Difficult']].map(([bg,c,l])=>(
                <div key={l} style={{display:'flex',alignItems:'center',gap:'3px'}}>
                  <div style={{width:'10px',height:'10px',borderRadius:'2px',background:bg}}/>
                  <span style={{color:c}}>{l}</span>
                </div>
              ))}
              <span style={{color:'#9ca3af'}}>Dashed border = already past</span>
            </div>
          </div>
        )}
        {loaded && yearSummary.length <= 2 && (
          <div style={{fontSize:'11px',color:'var(--w-tx2)',textAlign:'center',marginBottom:'16px',
            padding:'10px',background:'var(--w-bg)',borderRadius:'8px'}}>
            Short window selected — showing the specific periods below instead of a year-by-year grid.
          </div>
        )}

        {/* Best periods */}
        {bestYears.length > 0 && (
          <div style={{marginBottom:'14px',padding:'16px',background:'#f0fdf4',border:'1px solid #86efac',borderRadius:'12px'}}>
            <div style={{fontSize:'10px',fontWeight:700,color:'#15803d',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'.06em'}}>
              🌟 Good Times Together
            </div>
            {bestYears.slice(0,viewMode==='simple'?6:3).map((y:any,i:number)=>(
              <div key={i} style={{marginBottom:'8px',paddingBottom:'8px',
                borderBottom:i<bestYears.slice(0,viewMode==='simple'?6:3).length-1?'1px solid #bbf7d0':'none'}}>
                <div style={{fontSize:'13px',fontWeight:700,color:'#15803d'}}>
                  {new Date(y.startDate).toLocaleDateString('en-US',{month:'short',year:'numeric'})} – {new Date(y.endDate).toLocaleDateString('en-US',{month:'short',year:'numeric'})}
                  {viewMode==='simple' && y.label && <span style={{fontWeight:400,color:'#166534'}}> · {y.label}</span>}
                </div>
                {viewMode==='detailed' && y.note && <div style={{fontSize:'12px',color:'#166534',marginTop:'3px',lineHeight:1.5}}>{truncate(y.note,220)}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Biggest friction periods — AD-level planetary enmity, highlighted distinctly */}
        {enmityWindows.length > 0 && (
          <div style={{marginBottom:'14px',padding:'16px',background:'#1c0a0a',border:'2px solid #dc2626',borderRadius:'12px'}}>
            <div style={{fontSize:'10px',fontWeight:700,color:'#fca5a5',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'.06em'}}>
              🔺 Biggest Friction Periods
            </div>
            {enmityWindows.slice(0,viewMode==='simple'?6:3).map((y:any,i:number)=>{
              const isSevere = y.label==='Definitive Enemy'
              const displayLabel = isSevere ? 'Severe Clash — Almost Enemy Level' : 'High Friction'
              return (
              <div key={i} style={{marginBottom:'10px',paddingBottom:'10px',
                borderLeft:isSevere?'4px solid #f87171':'4px solid #fca5a5',paddingLeft:'10px',
                borderBottom:i<enmityWindows.slice(0,viewMode==='simple'?6:3).length-1?'1px solid #7f1d1d':'none'}}>
                <div style={{fontSize:isSevere?'14px':'13px',fontWeight:700,color:'#fff'}}>
                  {new Date(y.startDate).toLocaleDateString('en-US',{month:'short',year:'numeric'})} – {new Date(y.endDate).toLocaleDateString('en-US',{month:'short',year:'numeric'})}
                </div>
                <div style={{fontWeight:700,color:isSevere?'#f87171':'#fca5a5',marginTop:'2px',
                  fontSize:isSevere?'11px':'10px',textTransform:'uppercase',letterSpacing:'.03em'}}>
                  {isSevere ? '🔴🔴🔴 ' : '🔴 '}{displayLabel}
                </div>
                {viewMode==='detailed' && y.note && <div style={{fontSize:'12px',color:'#fecaca',marginTop:'4px',lineHeight:1.5}}>{truncate(y.note,220)}</div>}
              </div>
              )
            })}
          </div>
        )}


        {/* Challenging periods */}
        {chalYears.length > 0 && (
          <div style={{marginBottom:'14px',padding:'16px',background:'#fef2f2',border:'1px solid #fca5a5',borderRadius:'12px'}}>
            <div style={{fontSize:'10px',fontWeight:700,color:'#dc2626',marginBottom:'10px',textTransform:'uppercase',letterSpacing:'.06em'}}>
              ⚠ Difficult Times to Watch
            </div>
            {chalYears.slice(0,viewMode==='simple'?6:3).map((y:any,i:number)=>(
              <div key={i} style={{marginBottom:'8px',paddingBottom:'8px',
                borderBottom:i<chalYears.slice(0,viewMode==='simple'?6:3).length-1?'1px solid #fecaca':'none'}}>
                <div style={{fontSize:'13px',fontWeight:700,color:'#dc2626'}}>
                  {new Date(y.startDate).toLocaleDateString('en-US',{month:'short',year:'numeric'})} – {new Date(y.endDate).toLocaleDateString('en-US',{month:'short',year:'numeric'})}
                  {viewMode==='simple' && y.label && <span style={{fontWeight:400,color:'#991b1b'}}> · {friendlyLabel(y.label)}</span>}
                </div>
                {viewMode==='detailed' && y.note && <div style={{fontSize:'12px',color:'#991b1b',marginTop:'3px',lineHeight:1.5}}>{truncate(y.note,220)}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Dual narrative cards — full detail only */}
        {viewMode==='detailed' && crossPreds.filter((p:any)=>p.intensity==='SEVERE'||p.intensity==='POSITIVE').slice(0,4).map((p:any,i:number)=>{
          const other = p.who===name1 ? name2 : name1
          return (
          <div key={i} style={{marginBottom:'10px',padding:'14px',borderRadius:'12px',
            background:p.intensity==='POSITIVE'?'#f0fdf4':'#fef2f2',
            border:`1px solid ${p.intensity==='POSITIVE'?'#86efac':'#fca5a5'}`}}>
            <div style={{fontSize:'10px',fontWeight:700,
              color:p.intensity==='POSITIVE'?'#15803d':'#dc2626',
              marginBottom:'6px',textTransform:'uppercase',letterSpacing:'.05em'}}>
              {p.intensity==='POSITIVE'?'🌟':'⚠'} About {p.who} · {p.yearRange}
              {p.isCurrent&&<span style={{marginLeft:'6px',fontSize:'9px',background:'var(--w-acc)',color:'#fff',padding:'1px 5px',borderRadius:'3px'}}>Now</span>}
            </div>
            {p.fromTheirSide&&<div style={{fontSize:'12px',color:'var(--w-tx)',lineHeight:1.6,marginBottom:'4px'}}>{p.fromTheirSide}</div>}
            {p.fromPartnerSide&&<div style={{fontSize:'11px',color:'var(--w-tx2)',lineHeight:1.5,fontStyle:'italic'}}>How this shows up for {other}: {p.fromPartnerSide}</div>}
          </div>
          )
        })}

        {/* Re-run + PDF */}
        {loaded && (
          <div style={{marginTop:'14px'}}>
            <div style={{fontSize:'10px',color:'var(--w-tx2)',marginBottom:'8px'}}>
              Recent past shows how accurate this is for events that already happened. Longer future ranges help you plan ahead.
            </div>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center',marginBottom:'10px'}}>
              {(['past','3m','6m','5y','10y'] as const).map(m=>(
                <button key={m}
                  title={
                    m==='past' ? 'Last 10 years — see how well this matches what already happened between you.'
                    : m==='3m' ? 'Next 3 months — a quick close-up view.'
                    : m==='6m' ? 'Next 6 months — a bit more runway to plan around.'
                    : m==='5y' ? 'Next 5 years — good for near-term decisions like marriage or a joint venture.'
                    : 'Next 10 years — the default full free view.'
                  }
                  onClick={()=>{setMode(m);setLoaded(false);loadDeep(m)}}
                  style={{padding:'6px 12px',fontSize:'10px',borderRadius:'6px',cursor:'pointer',border:'none',
                    background:mode===m?'var(--w-acc)':'var(--w-bg)',
                    color:mode===m?'#fff':'var(--w-tx)',fontWeight:mode===m?700:400}}>
                  {m==='past'?`Past · ${now-10}–${now}`:m==='3m'?'Next 3mo':m==='6m'?'Next 6mo':m==='5y'?`5yr · ${now-1}–${now+5}`:`10yr · ${now}–${now+10}`}
                </button>
              ))}
              <span style={{width:'1px',height:'22px',background:'var(--w-bd)',margin:'0 2px'}} />
              <button
                title="Your entire life, birth to your 70s — every friction and best-period window, not just the next 10 years."
                onClick={()=>{setMode('full');setLoaded(false);loadDeep('full')}}
                style={{padding:'6px 12px',fontSize:'10px',borderRadius:'6px',cursor:'pointer',
                  border:demoMode?'1px dashed var(--w-acc)':'1px solid var(--w-acc)',
                  background:mode==='full'?'var(--w-acc)':'transparent',
                  color:mode==='full'?'#fff':'var(--w-acc)',fontWeight:700}}>
                {demoMode ? '🔓 Full 70yr (Demo)' : '🔒 Full 70yr ★ Premium'}
              </button>
            </div>
          </div>
        )}
        {loaded && (
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap',alignItems:'center'}}>
            <button disabled={pdfGenerating} onClick={async ()=>{
                setPdfGenerating(true)
                try {
                  const tmpl = await fetch('/western-report.html').then(res=>res.text())
                  const d={
                    name1:r?.name1||name1, name2:r?.name2||name2,
                    gender1:r?.gender1||'Male', gender2:r?.gender2||'Female',
                    groomLagna:deep?.groomLagna||deep?.GroomLagna, brideLagna:deep?.brideLagna||deep?.BrideLagna,
                    fromYear:yearSummary.length>0?yearSummary[0].year:(mode==='past'?now-10:mode==='5y'?now-1:now),
                    toYear:yearSummary.length>0?yearSummary[yearSummary.length-1].year:(mode==='full'?now+70:mode==='5y'?now+5:mode==='10y'?now+10:now),
                    deep,
                  }
                  const html=tmpl.replace('</head>',`<script>window.__VH_DATA=${JSON.stringify(d)}<\/script></head>`)
                  const res=await fetch('/api/pdf/generate',{
                    method:'POST', headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({html, filename:`${(r?.name1||name1)}-${(r?.name2||name2)}-Compatibility.pdf`})
                  })
                  const isPdf=(res.headers.get('Content-Type')||'').includes('application/pdf')
                  if (isPdf) {
                    // Real PDF bytes — trigger an actual file download
                    const blob=await res.blob()
                    const url=URL.createObjectURL(blob)
                    const a=document.createElement('a')
                    a.href=url; a.download=`${(r?.name1||name1)}-${(r?.name2||name2)}-Compatibility.pdf`
                    document.body.appendChild(a); a.click(); a.remove()
                    setTimeout(()=>URL.revokeObjectURL(url),2000)
                  } else {
                    // Serverless Chromium unavailable — fall back to opening the report so the
                    // person can still use the browser's own Print → Save as PDF.
                    const w=window.open('','_blank')
                    if (w) { w.document.write(html); w.document.close(); setTimeout(()=>w.print(),800) }
                  }
                } catch(e) { console.error('PDF generation failed', e) }
                setPdfGenerating(false)
              }}
              style={{marginLeft:'auto',padding:'7px 16px',background:'#0F1117',color:'#D4AF55',
                border:'none',borderRadius:'8px',cursor:pdfGenerating?'wait':'pointer',opacity:pdfGenerating?0.6:1,
                fontFamily:"'Playfair Display',Georgia,serif",fontSize:'11px',fontWeight:600}}>
              {pdfGenerating?'Generating PDF…':'⬇ Download PDF'}
            </button>
          </div>
        )}

        {/* Guest prompt */}
        {!hasSaved && (
          <div style={{padding:'16px',background:'var(--w-bg)',borderRadius:'12px',
            fontSize:'13px',color:'var(--w-tx2)',lineHeight:1.7,textAlign:'center'}}>
            <strong style={{color:'var(--w-tx)'}}>Sign in & save charts</strong> to unlock the year-by-year compatibility timeline, best periods for major decisions, and challenging windows to navigate carefully.{' '}
            <a href="/signin" style={{color:'var(--w-acc)',fontWeight:700}}>Sign in →</a>
          </div>
        )}
      </div>

      {/* ── FULL 70-YEAR PAYWALL ── */}
      {showPaywall && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.7)',
          display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}
          onClick={()=>setShowPaywall(false)}>
          <div style={{background:'var(--w-surf)',borderRadius:'16px',padding:'32px',maxWidth:'400px',
            width:'90%',textAlign:'center',boxShadow:'0 20px 60px rgba(0,0,0,.4)'}}
            onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:'32px',marginBottom:'8px'}}>✦</div>
            <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'18px',fontWeight:700,
              color:'var(--w-tx)',marginBottom:'8px'}}>Full 70-Year Compatibility</div>
            <div style={{fontSize:'13px',color:'var(--w-tx2)',marginBottom:'20px',lineHeight:1.7,textAlign:'left'}}>
              • Your entire life's compatibility, birth to your 70s<br/>
              • Every biggest-friction and best-period window, not just the next 10 years<br/>
              • The same year-by-year timeline and PDF report — just the full span<br/>
            </div>
            <div style={{display:'flex',gap:'10px',marginBottom:'14px'}}>
              <button onClick={()=>{setShowPaywall(false); setMode('full'); setLoaded(false); loadDeep('full')}}
                style={{flex:1,padding:'14px',background:'#0F1117',color:'#D4AF55',
                  border:'none',borderRadius:'10px',fontFamily:"'Playfair Display',Georgia,serif",
                  fontSize:'13px',fontWeight:700,cursor:'pointer'}}>
                Use Credits<br/><span style={{fontSize:'10px',opacity:.8}}>10 credits</span>
              </button>
              <a href="/pricing" style={{flex:1,padding:'14px',background:'var(--w-acc)',color:'#fff',
                  border:'none',borderRadius:'10px',fontFamily:"'Playfair Display',Georgia,serif",textDecoration:'none',
                  fontSize:'13px',fontWeight:700,cursor:'pointer',display:'flex',flexDirection:'column',
                  alignItems:'center',justifyContent:'center'}}>
                Upgrade Plan<br/><span style={{fontSize:'10px',opacity:.85}}>Unlimited</span>
              </a>
            </div>
            <button onClick={()=>setShowPaywall(false)} style={{background:'none',border:'none',
              color:'var(--w-tx2)',fontSize:'12px',cursor:'pointer',textDecoration:'underline'}}>
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  )
}


// ── Download western PDF ──────────────────────────────────────────────────
async function downloadWesternPdf(
  compatResult: any, deep: any, n1: string, n2: string,
  d1: any, d2: any, g1: string, g2: string
) {
  try {
    const tmpl = await fetch('/western-report.html').then(r => r.text())
    const now = 2026
    // Derive year range from actual yearSummary if available
    const ys = deep?.yearSummary || []
    const fromYear = ys.length > 0 ? ys[0].year : now
    const toYear   = ys.length > 0 ? ys[ys.length-1].year : now + 12
    const data = {
      name1: n1 || 'Person 1',
      name2: n2 || 'Person 2',
      gender1: g1 || 'Male',
      gender2: g2 || 'Female',
      dob1: d1?.yyyy ? `${d1.dd}/${d1.mm}/${d1.yyyy}` : '',
      dob2: d2?.yyyy ? `${d2.dd}/${d2.mm}/${d2.yyyy}` : '',
      fromYear,
      toYear,
      // From guest-match result
      GroomNakshatra: compatResult?.GroomNakshatra || '',
      BrideNakshatra: compatResult?.BrideNakshatra || '',
      GroomRasi:      compatResult?.GroomRasi || '',
      BrideRasi:      compatResult?.BrideRasi || '',
      groomLagna:     deep?.groomLagna || '',
      brideLagna:     deep?.brideLagna || '',
      // Deep analysis
      deep: deep || null,
    }
    const injected = tmpl.replace('</head>', `<script>window.__VH_DATA=${JSON.stringify(data)}<\/script></head>`)
    const w = window.open('', '_blank')
    if (w) { w.document.write(injected); w.document.close(); setTimeout(() => w.print(), 800) }
  } catch(e) { console.error('PDF error', e) }
}

export default function WesternPage(){
  const [tab,setTab]=useState<Tab>('compatibility')
  const [themeKey,setThemeKey]=useState('cream')
  const [curr,setCurr]=useState({code:'USD',sym:'$'})
  // Horoscope
  const [dob,setDob]=useState({dd:0,mm:0,yyyy:0,hr:0,mi:0,ap:'AM'})
  const [moonIdx,setMoonIdx]=useState<number|null>(null)
  const [domain,setDomain]=useState('Love')
  // Compat
  const EMPTY: any = { dd: 0, mm: 0, yyyy: 0 }
  const [d1,setD1]=useState({dd:0,mm:0,yyyy:0,hr:12,mi:0,ap:'AM' as 'AM'|'PM',unknownTime:false})
  const [d2,setD2]=useState({dd:0,mm:0,yyyy:0,hr:12,mi:0,ap:'AM' as 'AM'|'PM',unknownTime:false})
  const [n1,setN1]=useState('')
  const [n2,setN2]=useState('')
  const [g1,setG1]=useState<'Male'|'Female'>('Male')
  const [g2,setG2]=useState<'Male'|'Female'>('Female')
  const [together,setTogether]=useState<'yes'|'no'>('yes')
  const [place1,setPlace1]=useState(''); const [lat1c,setLat1c]=useState<number|undefined>(undefined); const [lng1c,setLng1c]=useState<number|undefined>(undefined)
  const [place2,setPlace2]=useState(''); const [lat2c,setLat2c]=useState<number|undefined>(undefined); const [lng2c,setLng2c]=useState<number|undefined>(undefined)
  const { token, user, logout } = useStore()
  const [acctOpen, setAcctOpen] = useState(false)
  const [saved, setSaved] = useState<any[]>([])
  const [collapsed, setCollapsed] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [selId1, setSelId1] = useState(''); const [useSaved1, setUseSaved1] = useState(false)
  const [selId2, setSelId2] = useState(''); const [useSaved2, setUseSaved2] = useState(false)
  const [loveResult,setLoveResult]=useState<any>(null)
  const [m1,setM1]=useState<number|null>(null)
  const [m2,setM2]=useState<number|null>(null)
  const [compatResult, setCompatResult] = useState<any>(null)
  const [compatLoading, setCompatLoading] = useState(false)
  const [compatErr, setCompatErr] = useState('')
  // Chart tab state
  const [chartName,setChartName]=useState('')
  const [chartDay,setChartDay]=useState(0)
  const [chartMon,setChartMon]=useState(0)
  const [chartYr,setChartYr]=useState(0)
  const [chartHr,setChartHr]=useState(0)
  const [chartMi,setChartMi]=useState(0)
  const [chartAp,setChartAp]=useState('AM')
  const [chartPlace,setChartPlace]=useState('')
  const [chartLoading,setChartLoading]=useState(false)
  const [chartResult,setChartResult]=useState<any>(null)
  const [chartErr,setChartErr]=useState('')

  const theme=THEMES.find(t=>t.key===themeKey)||THEMES[0]
  const isDark=themeKey==='midnight'||themeKey==='forest'

  const vars={
    '--w-bg':theme.bg,'--w-surf':theme.surf,'--w-tx':theme.tx,
    '--w-tx2':theme.tx2,'--w-acc':theme.acc,'--w-gold':theme.gold,'--w-bd':theme.bd,
  } as React.CSSProperties

  const moon=moonIdx!==null?MOON_SIGNS[moonIdx]:null
  const compat=m1!==null&&m2!==null?getCompat(m1,m2):null
  const ms1=m1!==null?MOON_SIGNS[m1]:null
  const ms2=m2!==null?MOON_SIGNS[m2]:null

  const generateChart=async()=>{
    if(!chartDay||!chartMon||!chartYr){setChartErr('Enter date of birth');return}
    setChartLoading(true);setChartErr('');setChartResult(null)
    try{
      const CHART_URL='https://enchanting-dedication-production.up.railway.app'
      // Convert 12hr to 24hr
      let hr24=chartHr||12
      if(chartAp==='PM'&&hr24!==12) hr24+=12
      if(chartAp==='AM'&&hr24===12) hr24=0
      const payload={
        PersonName:chartName||'Guest',
        Year:chartYr,Month:chartMon,Day:chartDay,
        Hour:hr24,Minute:chartMi,Second:0,
        PlaceName:chartPlace||'Chennai, India',
        // UtcOffsetHours omitted — backend auto-resolves from place+date (DST-aware)AyanamsaType:'Lahiri',
      }
      // Geocode if place entered
      if(chartPlace){
        try{
          const geo=await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(chartPlace)}&limit=1&lang=en`).then(r=>r.json())
          const f=geo?.features?.[0]
          if(f){(payload as any).Latitude=f.geometry.coordinates[1];(payload as any).Longitude=f.geometry.coordinates[0]}
        }catch{}
      }
      const res=await fetch(`${CHART_URL}/api/chart/guest`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload)
      }).then(r=>r.json())
      const data=res?.data?.data??res?.data??res
      if(data?.ascendantName||data?.AscendantName){
        setChartResult(data)
      }else{
        setChartErr(res?.message||res?.data?.message||'Chart calculation failed')
      }
    }catch(e:any){setChartErr(e?.message||'Connection failed')}
    setChartLoading(false)
  }

  // Load saved charts when logged in (v3)
  useEffect(() => {
    if (token) {
      listCharts().then((res: any) => {
        const list = Array.isArray(res) ? res : (res?.data?.data ?? res?.data ?? [])
        setSaved(Array.isArray(list) ? list : [])
      }).catch(() => {})
    }
  }, [token])

  const calcRealCompat = async () => {
    if (!d1.yyyy || !d2.yyyy) { setCompatErr('Enter both dates of birth'); return }
    setCompatLoading(true); setCompatErr(''); setLoveResult(null)
    try {
      const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'
      const to24 = (hr:number, mi:number, ap:string) => {
        let h = hr || 12
        if (ap === 'PM' && h !== 12) h += 12
        if (ap === 'AM' && h === 12) h = 0
        return { hour: h, minute: mi || 0 }
      }
      const tm1 = d1.unknownTime ? {hour:12,minute:0} : to24(d1.hr||12, d1.mi||0, d1.ap||'AM')
      const tm2 = d2.unknownTime ? {hour:12,minute:0} : to24(d2.hr||12, d2.mi||0, d2.ap||'AM')
      // Geocode places to get lat/lng/UTC offset
      const geocode = async (place: string, lat?: number, lng?: number) => {
        if (lat !== undefined && lng !== undefined && lat !== 0 && lng !== 0) return { lat, lng, utc: Math.round(lng / 15 * 2) / 2 }
        if (!place.trim()) return { lat: 0, lng: 0, utc: 0 }
        try {
          const r = await fetch('https://nominatim.openstreetmap.org/search?q='+encodeURIComponent(place)+'&format=json&limit=1',
            { headers: {'User-Agent':'VedicHora/1.0'} })
          const j = await r.json()
          if (j[0]) {
            const la=parseFloat(j[0].lat), lo=parseFloat(j[0].lon)
            // UTC offset from longitude (rough): lng/15
            const utc = Math.round(lo / 15 * 2) / 2
            return { lat: la, lng: lo, utc }
          }
        } catch {}
        return { lat: 0, lng: 0, utc: 0 }
      }
      const [geo1, geo2] = await Promise.all([
        geocode(place1, lat1c, lng1c),
        geocode(place2, lat2c, lng2c),
      ])

      const p1 = {
        PersonName: n1 || 'Person 1',
        Year: d1.yyyy||0, Month: d1.mm||1, Day: d1.dd||1,
        Hour: tm1.hour, Minute: tm1.minute, Second: 0,
        PlaceName: place1 || 'Unknown', Latitude: geo1.lat, Longitude: geo1.lng,
        UtcOffsetHours: geo1.utc || 0, AyanamsaType: 'Lahiri',
        BirthTimeKnown: true,
      }
      const p2 = {
        PersonName: n2 || 'Person 2',
        Year: d2.yyyy||0, Month: d2.mm||1, Day: d2.dd||1,
        Hour: tm2.hour, Minute: tm2.minute, Second: 0,
        PlaceName: place2 || 'Unknown', Latitude: geo2.lat, Longitude: geo2.lng,
        UtcOffsetHours: geo2.utc || 0, AyanamsaType: 'Lahiri',
        BirthTimeKnown: true,
      }
      // Calculate charts — save to DB if logged in, otherwise guest
      const authToken = useStore.getState().token
      const chartHeaders: any = { 'Content-Type': 'application/json' }
      if (token) chartHeaders['Authorization'] = `Bearer ${token}`
      const calcEndpoint = authToken ? `${CHART_URL}/api/chart/calculate` : `${CHART_URL}/api/chart/guest`
      const [r1, r2] = await Promise.all([
        fetch(calcEndpoint, {method:'POST', headers:chartHeaders, body:JSON.stringify(p1)}).then(r=>r.json()),
        fetch(calcEndpoint, {method:'POST', headers:chartHeaders, body:JSON.stringify(p2)}).then(r=>r.json()),
      ])
      const c1 = r1?.data?.data ?? r1?.data ?? r1
      const c2 = r2?.data?.data ?? r2?.data ?? r2
      // Also get guest-match for Ashta Koota score
      const mres = await fetch(`${CHART_URL}/api/chart/guest-match`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({Person1:p1,Person2:p2})
      }).then(r=>r.json())
      const mdata = mres?.data?.data ?? mres?.data ?? mres
      // Store chart horoscopeIds in result so WesternDashaSection can load deep analysis
      const h1 = c1?.horoscopeId || c1?.HoroscopeId
      const h2 = c2?.horoscopeId || c2?.HoroscopeId
      // Merge IDs into mdata so WesternDashaSection gets them
      // Immediately run overlay engine to get the real compatibility score
      // This is the same engine used for year-by-year — deepCompatScore is the truth
      let deepResult: any = null
      if (h1 && h2) {
        try {
          const authToken2 = useStore.getState().token
          const deepHdrs: any = { 'Content-Type': 'application/json' }
          if (authToken2) deepHdrs['Authorization'] = `Bearer ${authToken2}`
          const now = 2026
          const dr = await fetch(`${CHART_URL}/api/matchmaking/deep`, {
            method: 'POST', headers: deepHdrs,
            body: JSON.stringify({
              GroomId: h1, BrideId: h2,
              GroomName: n1||'Person 1', BrideName: n2||'Person 2',
              RelationshipType: 'Other',
              FromYear: now, ToYear: now + 10,
            })
          }).then(r => r.json())
          deepResult = dr?.data?.data ?? dr?.data ?? dr
        } catch {}
      }
      const enrichedResult = { ...mdata, hid1: h1, hid2: h2,
        name1: n1||'Person 1', name2: n2||'Person 2',
        gender1: g1, gender2: g2,
        // Pass deep result so score + timeline shown immediately without extra click
        deepResult,
      }
      setCompatResult(enrichedResult)
      setCollapsed(true)
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    } catch (e: any) {
      setCompatErr(e?.message || 'Calculation failed')
    }
    setCompatLoading(false)
  }

  const scoreColor=(s:number)=>s>=80?'#22C55E':s>=65?'#D4A52B':'#EF4444'

  const btn=(text:string,onClick:()=>void,disabled=false)=>(
    <button onClick={onClick} disabled={disabled} style={{
      padding:'12px 24px',borderRadius:'10px',border:'none',cursor:disabled?'not-allowed':'pointer',
      background:disabled?'rgba(128,128,128,.2)':`linear-gradient(135deg,${theme.acc},${theme.gold})`,
      color:isDark?'#0D0D14':'#fff',fontSize:'14px',fontWeight:700,
      fontFamily:"'Playfair Display',Georgia,serif",opacity:disabled?.5:1,transition:'opacity .15s'}}>
      {text}
    </button>
  )

  return(
    <div style={{...vars,minHeight:'100vh',background:'var(--w-bg)',color:'var(--w-tx)',fontFamily:"'Inter',system-ui,sans-serif"} as React.CSSProperties}>

      {/* ── NAV ── */}
      <nav style={{position:'sticky',top:0,zIndex:100,height:'58px',
        background:'var(--w-surf)',borderBottom:'1px solid var(--w-bd)',
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'0 24px',boxShadow:'0 1px 8px rgba(0,0,0,.06)'}}>

        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{width:'34px',height:'34px',borderRadius:'8px',
            background:`linear-gradient(135deg,${theme.acc},${theme.gold})`,
            display:'flex',alignItems:'center',justifyContent:'center',
            fontSize:'16px',color:'#fff',fontWeight:700}}>✦</div>
          <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,
            fontSize:'18px',color:'var(--w-acc)',letterSpacing:'-.01em'}}>CosmicMatch</span>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:'2px',background:'var(--w-bg)',borderRadius:'8px',padding:'3px'}}>
          {(['horoscope','compatibility','chart'] as Tab[]).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              padding:'6px 16px',borderRadius:'6px',fontSize:'13px',fontWeight:600,
              border:'none',cursor:'pointer',fontFamily:'inherit',textTransform:'capitalize',
              background:tab===t?`linear-gradient(135deg,${theme.acc},${theme.gold})`:`transparent`,
              color:tab===t?(isDark?'#0D0D14':'#fff'):'var(--w-tx2)',transition:'all .15s'}}>
              {t==='horoscope'?'🌙 Horoscope':t==='compatibility'?'♥ Compatibility':'✦ Birth Chart'}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
          {/* Currency */}
          <select value={curr.code} onChange={e=>{const c=CURRENCIES.find(x=>x.code===e.target.value)!;setCurr({code:c.code,sym:c.sym})}}
            style={{padding:'5px 10px',borderRadius:'8px',border:'1px solid var(--w-bd)',
              background:'var(--w-bg)',color:'var(--w-tx2)',fontSize:'12px',cursor:'pointer',appearance:'none'}}>
            {CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.flag} {c.sym} {c.code}</option>)}
          </select>
          {/* Theme swatches */}
          <div style={{display:'flex',gap:'4px'}}>
            {THEMES.map(t=>(
              <button key={t.key} title={t.label} onClick={()=>setThemeKey(t.key)} style={{
                width:'20px',height:'20px',borderRadius:'50%',border:themeKey===t.key?`2px solid ${theme.gold}`:`2px solid ${t.bd}`,
                background:`linear-gradient(135deg,${t.bg},${t.acc})`,cursor:'pointer',padding:0,flexShrink:0}} />
            ))}
          </div>
          <Link href="/" style={{fontSize:'12px',color:'var(--w-tx2)',textDecoration:'none',
            border:'1px solid var(--w-bd)',borderRadius:'6px',padding:'5px 10px',whiteSpace:'nowrap'}}>
            🪔 Vedic Mode
          </Link>
          {token && user ? (
            <div style={{position:'relative'}}>
              <button onClick={()=>setAcctOpen(v=>!v)} style={{display:'flex',alignItems:'center',gap:'6px',
                padding:'5px 10px',borderRadius:'6px',border:'1px solid var(--w-bd)',background:'var(--w-bg)',
                color:'var(--w-tx)',fontSize:'12px',cursor:'pointer',whiteSpace:'nowrap'}}>
                <span style={{width:'18px',height:'18px',borderRadius:'50%',background:'var(--w-acc)',color:'#fff',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:700}}>
                  {(user.displayName||'U')[0].toUpperCase()}
                </span>
                {(user.displayName||'Account').split(' ')[0]}
              </button>
              {acctOpen && (
                <div style={{position:'absolute',top:'40px',right:0,background:'var(--w-surf)',
                  border:'1px solid var(--w-bd)',borderRadius:'8px',boxShadow:'0 8px 24px rgba(0,0,0,.12)',
                  minWidth:'160px',padding:'6px',zIndex:200}}>
                  <div style={{padding:'8px 10px',fontSize:'11px',color:'var(--w-tx2)',borderBottom:'1px solid var(--w-bd)',marginBottom:'4px'}}>
                    {user.email}
                  </div>
                  <button onClick={()=>{logout();setAcctOpen(false)}} style={{width:'100%',textAlign:'left',
                    padding:'8px 10px',fontSize:'12px',border:'none',background:'transparent',color:'var(--w-tx)',
                    cursor:'pointer',borderRadius:'6px'}}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/signin" style={{fontSize:'12px',fontWeight:700,color:'#fff',textDecoration:'none',
              background:'var(--w-acc)',borderRadius:'6px',padding:'6px 14px',whiteSpace:'nowrap'}}>
              Sign In
            </Link>
          )}
        </div>
      </nav>

      {/* ── CONTENT ── */}
      <div style={{maxWidth:'860px',margin:'0 auto',padding:'48px 24px 80px'}}>

        {/* ═══════ HOROSCOPE ═══════ */}
        {tab==='horoscope' && (
          <div>
            <div style={{textAlign:'center',marginBottom:'40px'}}>
              <div style={{fontSize:'11px',color:'var(--w-gold)',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:'12px'}}>Daily Moon Reading</div>
              <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(28px,4vw,46px)',fontWeight:700,lineHeight:1.15,color:'var(--w-tx)',marginBottom:'12px'}}>Your Moon Sign Reveals<br/>Your Emotional World</h1>
              <p style={{fontSize:'15px',color:'var(--w-tx2)',maxWidth:'460px',margin:'0 auto',lineHeight:1.7}}>Your Moon sign governs your emotional instincts, deepest needs and inner life -- more revealing than any Sun sign.</p>
            </div>

            {moonIdx===null ? (
              <div style={{background:'var(--w-surf)',border:'1px solid var(--w-bd)',borderRadius:'20px',padding:'40px',maxWidth:'500px',margin:'0 auto',boxShadow:'0 4px 24px rgba(0,0,0,.06)'}}>
                <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'16px',fontWeight:600,color:'var(--w-acc)',textAlign:'center',marginBottom:'28px'}}>Enter your date & time of birth</div>
                {/* Date row */}
                <div style={{display:'flex',gap:'8px',marginBottom:'12px',flexWrap:'wrap'}}>
                  <div style={{flex:1,minWidth:'70px'}}>
                    <div style={{fontSize:'10px',color:'var(--w-tx2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'5px'}}>Day</div>
                    <Sel value={dob.dd} onChange={v=>setDob(d=>({...d,dd:+v}))} placeholder="Day" w="100%" opts={DAYS.map(d=>({v:d,l:String(d)}))} />
                  </div>
                  <div style={{flex:2,minWidth:'120px'}}>
                    <div style={{fontSize:'10px',color:'var(--w-tx2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'5px'}}>Month</div>
                    <Sel value={dob.mm} onChange={v=>setDob(d=>({...d,mm:+v}))} placeholder="Month" w="100%" opts={MONTHS.map((m,i)=>({v:i+1,l:m}))} />
                  </div>
                  <div style={{flex:1.5,minWidth:'86px'}}>
                    <div style={{fontSize:'10px',color:'var(--w-tx2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'5px'}}>Year</div>
                    <Sel value={dob.yyyy} onChange={v=>setDob(d=>({...d,yyyy:+v}))} placeholder="Year" w="100%" opts={YEARS_100.map(y=>({v:y,l:String(y)}))} />
                  </div>
                </div>
                {/* Time row */}
                <div style={{display:'flex',gap:'8px',marginBottom:'24px',alignItems:'flex-end'}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'10px',color:'var(--w-tx2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'5px'}}>Hour <span style={{fontSize:'9px',opacity:.6}}>(optional)</span></div>
                    <Sel value={dob.hr} onChange={v=>setDob(d=>({...d,hr:+v}))} placeholder="Hr" w="100%" opts={Array.from({length:12},(_,i)=>({v:i+1,l:String(i+1)}))} />
                  </div>
                  <div style={{paddingBottom:'10px',color:'var(--w-tx2)',fontWeight:300,fontSize:'18px'}}>:</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'10px',color:'var(--w-tx2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'5px'}}>Min</div>
                    <Sel value={dob.mi} onChange={v=>setDob(d=>({...d,mi:+v}))} placeholder="Min" w="100%" opts={Array.from({length:60},(_,i)=>({v:i,l:String(i).padStart(2,'0')}))} />
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'10px',color:'var(--w-tx2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'5px'}}>AM/PM</div>
                    <Sel value={dob.ap} onChange={v=>setDob(d=>({...d,ap:v}))} placeholder="AM/PM" w="100%" opts={[{v:'AM',l:'AM'},{v:'PM',l:'PM'}]} />
                  {/* Place of birth */}
                  <input value={place1} onChange={e=>setPlace1(e.target.value)}
                    onBlur={async()=>{
                      if(place1&&!lat1c){
                        try{const r=await fetch('https://nominatim.openstreetmap.org/search?q='+encodeURIComponent(place1)+'&format=json&limit=1',{headers:{'User-Agent':'VedicHora/1.0'}});const j=await r.json();if(j[0]){setLat1c(+j[0].lat);setLng1c(+j[0].lon)}}catch{}
                      }
                    }}
                    placeholder="Place of birth (city, country)"
                    style={{width:'100%',padding:'8px 10px',borderRadius:'8px',border:'1.5px solid var(--w-bd)',background:'var(--w-bg)',color:'var(--w-tx)',fontSize:'13px',marginTop:'6px',boxSizing:'border-box',fontFamily:'inherit'}} />
                  </div>
                </div>
                <div style={{textAlign:'center'}}>{btn('Reveal My Moon Sign ✦',()=>setMoonIdx(getMoon(dob.dd,dob.mm,dob.yyyy)),!dob.dd||!dob.mm||!dob.yyyy)}</div>
                <p style={{textAlign:'center',fontSize:'11px',color:'var(--w-tx2)',marginTop:'12px',opacity:.6}}>Time improves Moon accuracy · Not required</p>
              </div>
            ) : moon && (
              <div>
                {/* Moon sign result */}
                <div style={{background:'var(--w-surf)',border:`2px solid ${moon.color}40`,borderRadius:'20px',padding:'36px',marginBottom:'24px',textAlign:'center',boxShadow:`0 4px 32px ${moon.color}18`}}>
                  <div style={{fontSize:'64px',marginBottom:'12px'}}>🌙</div>
                  <div style={{fontSize:'11px',color:moon.color,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:'6px'}}>Your Moon Sign</div>
                  <h2 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'40px',fontWeight:700,color:'var(--w-tx)',marginBottom:'6px'}}>{moon.name}</h2>
                  <div style={{display:'inline-block',background:`${moon.color}18`,color:moon.color,borderRadius:'20px',padding:'4px 16px',fontSize:'13px',fontWeight:600,marginBottom:'24px'}}>{moon.elem} · {moon.trait}</div>
                  {/* Domain tabs */}
                  <div style={{display:'flex',gap:'6px',justifyContent:'center',flexWrap:'wrap',marginBottom:'20px'}}>
                    {Object.keys(PREDS[moon.name]).map(d=>(
                      <button key={d} onClick={()=>setDomain(d)} style={{padding:'6px 16px',borderRadius:'20px',border:`1.5px solid ${domain===d?moon.color:'var(--w-bd)'}`,
                        background:domain===d?`${moon.color}18`:`transparent`,color:domain===d?moon.color:'var(--w-tx2)',
                        fontSize:'12px',fontWeight:600,cursor:'pointer',transition:'all .15s'}}>{d}</button>
                    ))}
                  </div>
                  <div style={{background:'var(--w-bg)',borderRadius:'12px',padding:'18px 22px',borderLeft:`3px solid ${moon.color}`,textAlign:'left'}}>
                    <p style={{fontSize:'14px',lineHeight:1.8,color:'var(--w-tx2)',margin:0}}>{PREDS[moon.name][domain]}</p>
                  </div>
                </div>

                {/* Score bars */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'14px',marginBottom:'28px'}}>
                  {Object.keys(PREDS[moon.name]).map((d,i)=>{
                    const scores=[82,74,88,71,79,85,68,92,76,83,65,88]
                    const s=scores[(moonIdx*4+i)%scores.length]
                    const c=scoreColor(s)
                    return(
                      <div key={d} style={{background:'var(--w-surf)',border:'1px solid var(--w-bd)',borderRadius:'12px',padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,.04)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                          <span style={{fontSize:'12px',color:'var(--w-tx2)',fontWeight:500}}>{d}</span>
                          <span style={{fontSize:'20px',fontWeight:700,color:c,fontFamily:"'Playfair Display',Georgia,serif"}}>{s}</span>
                        </div>
                        <div style={{height:'6px',background:'var(--w-bd)',borderRadius:'3px',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${s}%`,background:`linear-gradient(90deg,${c}88,${c})`,borderRadius:'3px',transition:'width .8s'}} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Personalised report CTA -- stays on Western, no redirect to Vedic */}
                <div style={{background:`linear-gradient(135deg,${theme.acc}12,${theme.gold}08)`,border:`1px solid ${theme.acc}30`,borderRadius:'20px',padding:'36px',textAlign:'center'}}>
                  <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'22px',fontWeight:600,color:'var(--w-acc)',marginBottom:'10px'}}>Your Complete Cosmic Portrait</div>
                  <p style={{fontSize:'14px',color:'var(--w-tx2)',marginBottom:'24px',maxWidth:'400px',margin:'0 auto 24px',lineHeight:1.7}}>Full natal chart · Year ahead forecast · Relationship compatibility · Life purpose reading</p>
                  <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
                    {btn('Get Full Reading -- Free',()=>setTab('chart'))}
                    <button onClick={()=>setMoonIdx(null)} style={{background:'transparent',color:'var(--w-tx2)',border:'1px solid var(--w-bd)',padding:'12px 20px',borderRadius:'10px',fontSize:'13px',cursor:'pointer'}}>Try another date</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════ COMPATIBILITY ═══════ */}
        {tab==='compatibility' && (
          <div>
            <div style={{textAlign:'center',marginBottom:'32px'}}>
              <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(24px,3.5vw,38px)',fontWeight:700,color:'var(--w-tx)',lineHeight:1.2,marginBottom:'10px'}}>How Compatible Are You?</h1>
              <p style={{fontSize:'14px',color:'var(--w-tx2)',maxWidth:'400px',margin:'0 auto',lineHeight:1.7}}>Enter both birth details to reveal your compatibility score and year-by-year outlook.</p>
            </div>

            {/* Edit button when result showing */}
            {collapsed && (
              <div style={{textAlign:'center',marginBottom:'16px'}}>
                <button onClick={()=>{setCollapsed(false);setCompatResult(null)}}
                  style={{padding:'8px 20px',background:'transparent',border:'1.5px solid var(--w-bd)',
                    borderRadius:'8px',cursor:'pointer',fontSize:'12px',color:'var(--w-tx2)',fontFamily:'inherit'}}>
                  ✎ Edit Details
                </button>
              </div>
            )}

            {!collapsed && (<>
            {/* Saved chart selector */}
            {token && saved.length > 0 && (
              <div style={{background:'var(--w-surf)',border:'1px solid var(--w-bd)',borderRadius:'16px',padding:'20px',marginBottom:'24px',boxShadow:'0 2px 12px rgba(0,0,0,.05)'}}>
                <div style={{fontSize:'11px',fontWeight:700,color:'var(--w-acc)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'14px'}}>
                  Use Saved Charts
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                  {[{label:'Person 1',id:selId1,set:setSelId1},{label:'Person 2',id:selId2,set:setSelId2}].map(({label,id,set})=>(
                    <div key={label}>
                      <div style={{fontSize:'11px',color:'var(--w-tx2)',marginBottom:'6px'}}>{label}</div>
                      <select value={id} onChange={e=>set(e.target.value)}
                        style={{width:'100%',padding:'9px 12px',borderRadius:'8px',border:'1.5px solid var(--w-bd)',
                          background:'var(--w-bg)',color:'var(--w-tx)',fontSize:'12px',cursor:'pointer'}}>
                        <option value="">— Select chart —</option>
                        {saved.map((c:any)=>{
                          const cid=c.horoscopeId||c.HoroscopeId
                          const nm=c.personName||c.PersonName||'Chart'
                          const lg=c.ascendantName||c.AscendantName||''
                          return <option key={cid} value={cid}>{nm}{lg?` — ${lg}`:''}</option>
                        })}
                      </select>
                    </div>
                  ))}
                </div>
                {selId1 && selId2 && (
                  <button
                    onClick={async()=>{
                      setCompatLoading(true); setCompatErr(''); setCompatResult(null)
                      try {
                        const CHART_URL='https://enchanting-dedication-production.up.railway.app'
                        const authHdrs={'Content-Type':'application/json','Authorization':`Bearer ${token}`}
                        const name1=saved.find((c:any)=>(c.horoscopeId||c.HoroscopeId)===selId1)?.personName||'Person 1'
                        const name2=saved.find((c:any)=>(c.horoscopeId||c.HoroscopeId)===selId2)?.personName||'Person 2'
                        const now=2026
                        // Call guest-match for Ashta Koota scores
                        const [mres, deepRes] = await Promise.all([
                          fetch(`${CHART_URL}/api/chart/guest-match`,{
                            method:'POST',headers:{'Content-Type':'application/json'},
                            body:JSON.stringify({Person1:{HoroscopeId:selId1},Person2:{HoroscopeId:selId2}})
                          }).then(r=>r.json()),
                          // Call matchmaking/deep directly for full analysis
                          fetch(`${CHART_URL}/api/matchmaking/deep`,{
                            method:'POST',headers:authHdrs,
                            body:JSON.stringify({
                              GroomId:selId1,BrideId:selId2,
                              GroomName:name1,BrideName:name2,
                              RelationshipType:'Other',
                              FromYear:now,ToYear:now+10
                            })
                          }).then(r=>r.json())
                        ])
                        const mdata=mres?.data?.data??mres?.data??mres
                        const deepResult=deepRes?.data?.data??deepRes?.data??deepRes
                        const enriched={...mdata,hid1:selId1,hid2:selId2,name1,name2,deepResult}
                        setCompatResult(enriched)
                        setCollapsed(true)
                        setTimeout(()=>{ resultsRef.current?.scrollIntoView({behavior:'smooth',block:'start'}) },150)
                      } catch(e:any){ setCompatErr(e?.message||'Failed') }
                      setCompatLoading(false)
                    }}
                    style={{width:'100%',marginTop:'12px',padding:'11px',background:'var(--w-acc)',
                      color:'#fff',border:'none',borderRadius:'10px',cursor:'pointer',
                      fontSize:'13px',fontWeight:700,fontFamily:"'Playfair Display',Georgia,serif"}}>
                    {compatLoading?'Calculating…':'Check Compatibility →'}
                  </button>
                )}
              </div>
            )}

            <div style={{background:'var(--w-surf)',border:'1px solid var(--w-bd)',borderRadius:'20px',padding:'36px',boxShadow:'0 4px 24px rgba(0,0,0,.06)',marginBottom:'28px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 48px 1fr',gap:'20px',alignItems:'start',marginBottom:'28px'}}>
                {/* Person 1 */}
                <div>
                  <div style={{fontSize:'11px',color:'var(--w-acc)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'12px'}}>♥ Person 1</div>
                  <input value={n1} onChange={e=>setN1(e.target.value)} placeholder="Name"
                    style={{width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1.5px solid var(--w-bd)',background:'var(--w-bg)',color:'var(--w-tx)',fontSize:'14px',marginBottom:'8px',boxSizing:'border-box',fontFamily:'inherit',outline:'none'}} />
                  {/* Hide manual entry if saved chart selected */}
                  {!selId1 && (<>
                  {/* DOB */}
                  <div style={{display:'flex',gap:'6px',marginBottom:'8px'}}>
                    <Sel value={d1.dd||''} onChange={v=>setD1(d=>({...d,dd:+v}))} placeholder="Day" w="30%"
                      opts={DAYS.map(d=>({v:d,l:String(d)}))} />
                    <Sel value={d1.mm||''} onChange={v=>setD1(d=>({...d,mm:+v}))} placeholder="Month" w="40%"
                      opts={MONTHS.map((m,i)=>({v:i+1,l:m}))} />
                    <Sel value={d1.yyyy||''} onChange={v=>setD1(d=>({...d,yyyy:+v}))} placeholder="Year" w="30%"
                      opts={YEARS_100.map(y=>({v:y,l:String(y)}))} />
                  </div>
                  {/* Time */}
                  <div style={{display:'flex',gap:'6px',marginBottom:'8px',opacity:d1.unknownTime?0.4:1}}>
                    <Sel value={d1.hr} onChange={v=>setD1(d=>({...d,hr:+v}))} placeholder="Hr" w="28%"
                      opts={[12,1,2,3,4,5,6,7,8,9,10,11].map(h=>({v:h,l:String(h)}))} />
                    <Sel value={d1.mi} onChange={v=>setD1(d=>({...d,mi:+v}))} placeholder="Min" w="28%"
                      opts={Array.from({length:60},(_,i)=>({v:i,l:String(i).padStart(2,'0')}))} />
                    <Sel value={d1.ap} onChange={v=>setD1(d=>({...d,ap:v as 'AM'|'PM'}))} placeholder="AM/PM" w="28%"
                      opts={[{v:'AM',l:'AM'},{v:'PM',l:'PM'}]} />
                    <label style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',color:'var(--w-tx2)',cursor:'pointer',flexShrink:0}}>
                      <input type="checkbox" checked={d1.unknownTime} onChange={e=>setD1(d=>({...d,unknownTime:e.target.checked}))} />
                      Unknown
                    </label>
                  </div>
                  {/* City — same autocomplete as match page */}
                  <CityAutocomplete
                    value={place1}
                    onChange={(city, la, ln) => { setPlace1(city); if(la) setLat1c(la); if(ln) setLng1c(ln); }}
                    placeholder="Place of birth" />
                  </>)}
                  {selId1 && <div style={{fontSize:'11px',color:'var(--w-tx2)',padding:'8px 0'}}>
                    ✓ Using saved chart
                  </div>}
                </div>
                <div style={{textAlign:'center',paddingTop:'60px',fontSize:'24px',color:'#EF4444'}}>♥</div>
                {/* Person 2 */}
                <div>
                  <div style={{fontSize:'11px',color:'var(--w-acc)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'12px'}}>♥ Person 2</div>
                  <input value={n2} onChange={e=>setN2(e.target.value)} placeholder="Name (optional)"
                    style={{width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1.5px solid var(--w-bd)',background:'var(--w-bg)',color:'var(--w-tx)',fontSize:'14px',marginBottom:'8px',boxSizing:'border-box',fontFamily:'inherit',outline:'none'}} />
                  {/* Hide manual entry if saved chart selected */}
                  {!selId2 && (<>
                  {/* DOB */}
                  <div style={{display:'flex',gap:'6px',marginBottom:'8px'}}>
                    <Sel value={d2.dd||''} onChange={v=>setD2(d=>({...d,dd:+v}))} placeholder="Day" w="30%"
                      opts={DAYS.map(d=>({v:d,l:String(d)}))} />
                    <Sel value={d2.mm||''} onChange={v=>setD2(d=>({...d,mm:+v}))} placeholder="Month" w="40%"
                      opts={MONTHS.map((m,i)=>({v:i+1,l:m}))} />
                    <Sel value={d2.yyyy||''} onChange={v=>setD2(d=>({...d,yyyy:+v}))} placeholder="Year" w="30%"
                      opts={YEARS_100.map(y=>({v:y,l:String(y)}))} />
                  </div>
                  {/* Time */}
                  <div style={{display:'flex',gap:'6px',marginBottom:'8px',opacity:d2.unknownTime?0.4:1}}>
                    <Sel value={d2.hr} onChange={v=>setD2(d=>({...d,hr:+v}))} placeholder="Hr" w="28%"
                      opts={[12,1,2,3,4,5,6,7,8,9,10,11].map(h=>({v:h,l:String(h)}))} />
                    <Sel value={d2.mi} onChange={v=>setD2(d=>({...d,mi:+v}))} placeholder="Min" w="28%"
                      opts={Array.from({length:60},(_,i)=>({v:i,l:String(i).padStart(2,'0')}))} />
                    <Sel value={d2.ap} onChange={v=>setD2(d=>({...d,ap:v as 'AM'|'PM'}))} placeholder="AM/PM" w="28%"
                      opts={[{v:'AM',l:'AM'},{v:'PM',l:'PM'}]} />
                    <label style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'11px',color:'var(--w-tx2)',cursor:'pointer',flexShrink:0}}>
                      <input type="checkbox" checked={d2.unknownTime} onChange={e=>setD2(d=>({...d,unknownTime:e.target.checked}))} />
                      Unknown
                    </label>
                  </div>
                  {/* City — same autocomplete as match page */}
                  <CityAutocomplete
                    value={place2}
                    onChange={(city, la, ln) => { setPlace2(city); if(la) setLat2c(la); if(ln) setLng2c(ln); }}
                    placeholder="Place of birth" />
                  </>)}
                  {selId2 && <div style={{fontSize:'11px',color:'var(--w-tx2)',padding:'8px 0'}}>
                    ✓ Using saved chart
                  </div>}
                  <div style={{fontSize:'10px',color:'var(--w-tx2)',marginTop:'3px',marginBottom:'6px'}}>Time of birth (optional — improves accuracy)</div>
                </div>
              </div>
              <div style={{textAlign:'center',marginBottom:'10px'}}>
                <div style={{fontSize:'10px',color:'var(--w-tx2)',marginBottom:'6px'}}>Are they already together?</div>
                <div style={{display:'inline-flex',gap:'6px'}}>
                  {(['yes','no'] as const).map(v=>(
                    <button key={v} onClick={()=>setTogether(v)}
                      style={{padding:'5px 14px',fontSize:'11px',borderRadius:'6px',cursor:'pointer',border:'none',
                        background:together===v?'var(--w-acc)':'var(--w-bg)',
                        color:together===v?'#fff':'var(--w-tx)',fontWeight:together===v?700:400}}>
                      {v==='yes'?'Yes, together':'Not yet — considering'}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{textAlign:'center'}}>{btn(compatLoading?'Calculating...':'Reveal Compatibility ✦',calcRealCompat,!d1.yyyy||!d2.yyyy)}</div>
            </div>
            </>)}{/* end !collapsed */}

            {/* Compat result */}
            {compat&&ms1&&ms2&&(
              <div style={{background:'var(--w-surf)',border:'1px solid var(--w-bd)',borderRadius:'20px',padding:'36px',boxShadow:'0 4px 24px rgba(0,0,0,.06)'}}>
                {/* Signs side by side */}
                <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:'20px',alignItems:'center',marginBottom:'32px'}}>
                  {[{ms:ms1,n:n1},{ms:ms2,n:n2}].map((p,i)=>(
                    <div key={i} style={{textAlign:'center',padding:'24px 16px',borderRadius:'16px',background:`${p.ms.color}10`,border:`1px solid ${p.ms.color}30`}}>
                      <div style={{fontSize:'44px',marginBottom:'10px'}}>🌙</div>
                      {p.n&&<div style={{fontSize:'13px',fontWeight:600,color:'var(--w-tx)',marginBottom:'4px'}}>{p.n}</div>}
                      <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'22px',fontWeight:700,color:'var(--w-tx)'}}>{p.ms.name}</div>
                      <div style={{fontSize:'11px',color:p.ms.color,fontWeight:600,marginTop:'4px'}}>{p.ms.elem} sign</div>
                    </div>
                  ))}
                  {/* Score */}
                  <div style={{textAlign:'center'}}>
                    <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'56px',fontWeight:700,lineHeight:1,color:scoreColor(compat.score)}}>{compat.score}%</div>
                    <div style={{fontSize:'15px',fontWeight:700,color:'var(--w-acc)',margin:'8px 0 12px'}}>{compat.label}</div>
                    <div style={{height:'8px',background:'var(--w-bd)',borderRadius:'4px',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${compat.score}%`,background:`linear-gradient(90deg,${scoreColor(compat.score)}88,${scoreColor(compat.score)})`,borderRadius:'4px',transition:'width .8s'}} />
                    </div>
                  </div>
                </div>

                {/* Sub-scores */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'24px'}}>
                  {[{l:'Emotional',adj:0},{l:'Intellectual',adj:5},{l:'Spiritual',adj:-3}].map(s=>{
                    const v=Math.min(99,Math.max(40,compat.score+s.adj+(moonIdx||0)%7-3))
                    return(
                      <div key={s.l} style={{background:'var(--w-bg)',borderRadius:'12px',padding:'16px',textAlign:'center',border:'1px solid var(--w-bd)'}}>
                        <div style={{fontSize:'11px',color:'var(--w-tx2)',marginBottom:'6px'}}>{s.l}</div>
                        <div style={{fontSize:'24px',fontWeight:700,color:scoreColor(v),fontFamily:"'Playfair Display',Georgia,serif"}}>{v}%</div>
                        <div style={{height:'4px',background:'var(--w-bd)',borderRadius:'2px',marginTop:'8px',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${v}%`,background:scoreColor(v),borderRadius:'2px'}} />
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{background:'var(--w-bg)',borderRadius:'12px',padding:'18px 22px',borderLeft:`3px solid ${theme.acc}`,marginBottom:'24px'}}>
                  <p style={{fontSize:'14px',lineHeight:1.8,color:'var(--w-tx2)',margin:0}}>{compat.desc}</p>
                </div>

                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'17px',color:'var(--w-acc)',marginBottom:'8px'}}>Want the complete picture?</div>
                  <p style={{fontSize:'13px',color:'var(--w-tx2)',marginBottom:'20px'}}>Full synastry chart · Month-by-month relationship forecast · Personalised guidance</p>
                  {btn(`Get Full Compatibility Report -- ${curr.sym}29`,()=>alert('Full report coming soon -- join waitlist'))}
                </div>
              </div>
            )}

            {/* ── VedicHora Layered Matching Results ── */}
            {compatResult && (
              <div ref={resultsRef} style={{marginTop:'20px'}}>
                <WesternDashaSection compatResult={compatResult} name1={n1||'Person 1'} name2={n2||'Person 2'} scoreColor={scoreColor} saved={saved} token={token} together={together} />
              </div>
            )}

          </div>
        )}

        {/* ═══════ BIRTH CHART ═══════ */}
        {tab==='chart' && (
          <div>
            <div style={{textAlign:'center',marginBottom:'40px'}}>
              <div style={{fontSize:'11px',color:'var(--w-gold)',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:'12px'}}>Birth Chart Analysis</div>
              <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(28px,4vw,44px)',fontWeight:700,color:'var(--w-tx)',lineHeight:1.15,marginBottom:'12px'}}>Your Complete Cosmic Blueprint</h1>
              <p style={{fontSize:'15px',color:'var(--w-tx2)',maxWidth:'440px',margin:'0 auto',lineHeight:1.7}}>Enter your birth details for a full reading of your personality, purpose, relationships and the year ahead.</p>
            </div>
            {/* DOB form */}
            <div style={{background:'var(--w-surf)',border:'1px solid var(--w-bd)',borderRadius:'20px',padding:'36px',maxWidth:'540px',margin:'0 auto',boxShadow:'0 4px 24px rgba(0,0,0,.06)'}}>
              <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
                <div>
                  <div style={{fontSize:'10px',color:'var(--w-tx2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'6px'}}>Full name</div>
                  <input value={chartName} onChange={e=>setChartName(e.target.value)} placeholder="Your full name" style={{width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1.5px solid var(--w-bd)',background:'var(--w-bg)',color:'var(--w-tx)',fontSize:'14px',boxSizing:'border-box',fontFamily:'inherit',outline:'none'}} />
                </div>
                <div>
                  <div style={{fontSize:'10px',color:'var(--w-tx2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'6px'}}>Date of birth</div>
                  <div style={{display:'flex',gap:'8px'}}>
                    <Sel value={chartDay} onChange={v=>setChartDay(+v)} placeholder="Day" w="80px" opts={DAYS.map(d=>({v:d,l:String(d)}))} />
                    <Sel value={chartMon} onChange={v=>setChartMon(+v)} placeholder="Month" w="140px" opts={MONTHS.map((m,i)=>({v:i+1,l:m}))} />
                    <Sel value={chartYr} onChange={v=>setChartYr(+v)} placeholder="Year" w="96px" opts={YEARS_100.map(y=>({v:y,l:String(y)}))} />
                  </div>
                </div>
                <div>
                  <div style={{fontSize:'10px',color:'var(--w-tx2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'6px'}}>Time of birth <span style={{fontSize:'9px',opacity:.6}}>(improves accuracy)</span></div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    <Sel value={chartHr} onChange={v=>setChartHr(+v)} placeholder="Hr" w="80px" opts={Array.from({length:12},(_,i)=>({v:i+1,l:String(i+1)}))} />
                    <span style={{color:'var(--w-tx2)',fontWeight:300,fontSize:'18px'}}>:</span>
                    <Sel value={chartMi} onChange={v=>setChartMi(+v)} placeholder="Min" w="80px" opts={Array.from({length:60},(_,i)=>({v:i,l:String(i).padStart(2,'0')}))} />
                    <Sel value={chartAp} onChange={v=>setChartAp(v)} placeholder="AM/PM" w="90px" opts={[{v:'AM',l:'AM'},{v:'PM',l:'PM'}]} />
                  </div>
                </div>
                <div>
                  <div style={{fontSize:'10px',color:'var(--w-tx2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'6px'}}>Place of birth</div>
                  <input value={chartPlace} onChange={e=>setChartPlace(e.target.value)} placeholder="City, Country" style={{width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1.5px solid var(--w-bd)',background:'var(--w-bg)',color:'var(--w-tx)',fontSize:'14px',boxSizing:'border-box',fontFamily:'inherit',outline:'none'}} />
                </div>
                <div style={{textAlign:'center'}}>{btn(chartLoading?'Generating...':'Generate My Chart -- Free ✦',generateChart,chartLoading)}</div>
                {chartErr&&<div style={{color:'#DC2626',fontSize:'12px',textAlign:'center',marginTop:'8px'}}>{chartErr}</div>}
                <p style={{textAlign:'center',fontSize:'11px',color:'var(--w-tx2)',margin:0,opacity:.6}}>Premium reports from {curr.sym}19 · No subscription</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
