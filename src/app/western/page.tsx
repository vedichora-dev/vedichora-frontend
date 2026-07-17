'use client'
import { useState } from 'react'
import Link from 'next/link'

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

const PREDS: Record<string,Record<string,string>> = {
  Aries: {
    Love:'Your directness is magnetic right now. Someone appreciates your honesty — let yourself be seen without armour.',
    Career:'Bold moves pay off this week. Trust your instincts on a decision you've been sitting with.',
    Wellbeing:'Channel excess energy into movement. Your body thrives when your mind is challenged.',
    Finance:'An opportunity to act decisively on a financial matter — do your homework first, then commit fully.',
  },
  Taurus: {
    Love:'Patience in love is your strength. Depth of connection matters more than speed — trust the slow build.',
    Career:'Your reliability is noticed by those who matter. Steady progress brings you closer to a significant milestone.',
    Wellbeing:'Honour your need for rest and sensory pleasure. A peaceful environment restores you deeply.',
    Finance:'Conservative choices serve you well now. Security is being built even when it feels slow.',
  },
  Gemini: {
    Love:'Conversation is your love language — and it's working beautifully. Keep the exchange light, curious and fun.',
    Career:'Multiple ideas are competing for your attention. Choose the one with the most genuine excitement behind it.',
    Wellbeing:'Your nervous system needs grounding. Short walks in nature calm the constant mental chatter.',
    Finance:'Research before committing. Your natural curiosity will find the best option if you look carefully.',
  },
  Cancer: {
    Love:'Your emotional intelligence makes you extraordinarily lovable. Let someone see your vulnerability — it connects.',
    Career:'Trust your intuition on a workplace dynamic. You sense something others have missed — you're right.',
    Wellbeing:'Home is your sanctuary right now. Nourishing food and meaningful connections restore you completely.',
    Finance:'Family and home-related finances come into focus. Security matters — trust your cautious instincts.',
  },
  Leo: {
    Love:'Your warmth draws people in effortlessly. A creative shared experience deepens a bond meaningfully.',
    Career:'Step forward and own your expertise. Leadership is not arrogance — it's answering a genuine call.',
    Wellbeing:'Joy is medicine for you. Seek out what genuinely makes your heart light and follow it deliberately.',
    Finance:'Generosity brings return. Investing in yourself — skills, appearance, confidence — pays real dividends.',
  },
  Virgo: {
    Love:'Your attentiveness is a profound form of love. Notice how your small gestures create lasting impressions.',
    Career:'A detail you've been refining is ready. Perfectionism served its purpose — now release and present.',
    Wellbeing:'Digestive health and daily routine are your foundations. Small consistent habits build remarkable resilience.',
    Finance:'Analysis pays off. You see what others miss — trust your careful reading of a financial situation.',
  },
  Libra: {
    Love:'Balance in giving and receiving is your lesson now. You deserve the same thoughtfulness you offer others.',
    Career:'Your ability to see all sides makes you invaluable in a current negotiation or collaboration.',
    Wellbeing:'Beauty and harmony are not luxuries — they're necessities for your wellbeing. Create them deliberately.',
    Finance:'Fair exchange matters. Ensure partnerships — financial or professional — are genuinely equitable.',
  },
  Scorpio: {
    Love:'Profound emotional honesty opens a door you've kept guarded. Someone is ready to meet you at that depth.',
    Career:'Your research and insight give you an edge others simply don't have. Use this power responsibly.',
    Wellbeing:'Transformation requires releasing the old. Let go of what no longer serves with intention and grace.',
    Finance:'Hidden assets or overlooked opportunities surface now. Look below the obvious layer.',
  },
  Sagittarius: {
    Love:'Your optimism is contagious and deeply attractive. Adventures shared create bonds that last.',
    Career:'Think bigger. The horizon you've been aiming for is closer than your current vantage point suggests.',
    Wellbeing:'Freedom of movement feeds your soul. Travel, exploration or simply new environments restore you fully.',
    Finance:'Expansive thinking opens financial doors — while keeping practicality close to ensure sound choices.',
  },
  Capricorn: {
    Love:'Your devotion runs deep though you show it quietly. Let someone see the warmth beneath the composure.',
    Career:'Long-term effort is crystallising into something tangible. Recognition arrives in proportion to your patience.',
    Wellbeing:'Rest without guilt. Your body is asking for recovery — honour it as part of your high standards.',
    Finance:'Disciplined choices made earlier are bearing fruit. Stay the course — the plan is working.',
  },
  Aquarius: {
    Love:'Your uniqueness is your greatest gift in relationship. Someone values your unconventional perspective deeply.',
    Career:'Innovation you've championed is gaining ground. The future belongs to those who imagined it clearly.',
    Wellbeing:'Community and belonging nourish your spirit as much as solitude. Seek both with intentionality.',
    Finance:'Unconventional financial ideas deserve serious consideration now. Research thoroughly then act boldly.',
  },
  Pisces: {
    Love:'Your empathy creates extraordinary intimacy. Allow yourself to receive as generously as you give.',
    Career:'Creative and intuitive work reaches new heights. Trust impressions that don't have immediate logical backing.',
    Wellbeing:'Water, sleep and creative expression are your three pillars of health. Prioritise all three deliberately.',
    Finance:'Intuition about a financial matter is worth examining carefully. Look beyond surface appearances.',
  },
}

const COMPAT: Record<string,{score:number,label:string,desc:string}> = {
  'Fire-Fire':{score:88,label:'Blazing Together',desc:'Passionate, energetic and mutually inspiring. You push each other towards greatness — just watch for power clashes.'},
  'Fire-Air':{score:85,label:'Fan the Flames',desc:'Air fuels Fire beautifully. Stimulating conversation, shared adventures and genuine mutual admiration flow naturally.'},
  'Fire-Earth':{score:62,label:'Grounded Sparks',desc:'Earth steadies Fire while Fire energises Earth. Different rhythms — but real growth happens when you honour the contrast.'},
  'Fire-Water':{score:67,label:'Steam & Intensity',desc:'Magnetic chemistry with emotional complexity. Deep bonds form when both partners honour each other's very different needs.'},
  'Earth-Earth':{score:92,label:'Built to Last',desc:'Exceptional loyalty, shared values and quiet devotion. You build together with patience and an eye firmly on the long term.'},
  'Earth-Water':{score:88,label:'Fertile Ground',desc:'Water nourishes Earth while Earth provides Water with security. A naturally supportive, emotionally rich partnership.'},
  'Earth-Air':{score:58,label:'Different Rhythms',desc:'Air brings ideas, Earth brings follow-through. Real complementarity exists — patience and appreciation bridge the gap.'},
  'Earth-Fire':{score:62,label:'Grounded Sparks',desc:'Different energies that teach each other. Earth provides stability while Fire brings excitement neither could create alone.'},
  'Air-Air':{score:86,label:'Meeting of Minds',desc:'Brilliant intellectual connection, endless conversation and shared curiosity keep this partnership lively and genuinely fresh.'},
  'Air-Water':{score:71,label:'Heart & Mind',desc:'Head meets heart — complementary when you communicate about your different processing styles with patience and curiosity.'},
  'Air-Fire':{score:85,label:'Fan the Flames',desc:'Dynamic and stimulating. Ideas inspire action, adventure is always possible and you genuinely bring out each other's best.'},
  'Air-Earth':{score:58,label:'Different Rhythms',desc:'Air sees possibility, Earth seeks proof. Together you are more complete — appreciate what the other brings unconditionally.'},
  'Water-Water':{score:90,label:'Oceanic Bond',desc:'Extraordinary emotional depth, intuitive understanding and a profoundly healing bond that few other combinations achieve.'},
  'Water-Fire':{score:67,label:'Steam & Intensity',desc:'Intense chemistry — emotional Water and passionate Fire create a magnetic connection that is never boring or predictable.'},
  'Water-Earth':{score:88,label:'Fertile Ground',desc:'Deep mutual nourishment. Earth provides the security Water craves; Water brings emotional richness Earth quietly needs.'},
  'Water-Air':{score:71,label:'Heart & Mind',desc:'Feeling meets intellect. With genuine communication and curiosity about your differences, this becomes beautifully complementary.'},
}

function getMoon(dd:number,mm:number,yyyy:number):number{
  const base=new Date(yyyy,mm-1,dd).getTime()
  return Math.floor(((base/86400000)+13)%360/30)%12
}

function getCompat(a:number,b:number){
  const ea=MOON_SIGNS[a].elem,eb=MOON_SIGNS[b].elem
  return COMPAT[`${ea}-${eb}`]||COMPAT[`${eb}-${ea}`]||{score:72,label:'Unique Connection',desc:'Your combination is rare — growth comes through genuine curiosity about each other.'}
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
const YEARS_100=Array.from({length:100},(_,i)=>new Date().getFullYear()-i)

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

export default function WesternPage(){
  const [tab,setTab]=useState<Tab>('horoscope')
  const [themeKey,setThemeKey]=useState('cream')
  const [curr,setCurr]=useState({code:'USD',sym:'$'})
  // Horoscope
  const [dob,setDob]=useState({dd:0,mm:0,yyyy:0,hr:0,mi:0,ap:'AM'})
  const [moonIdx,setMoonIdx]=useState<number|null>(null)
  const [domain,setDomain]=useState('Love')
  // Compat
  const [d1,setD1]=useState({dd:0,mm:0,yyyy:0})
  const [d2,setD2]=useState({dd:0,mm:0,yyyy:0})
  const [n1,setN1]=useState('')
  const [n2,setN2]=useState('')
  const [m1,setM1]=useState<number|null>(null)
  const [m2,setM2]=useState<number|null>(null)

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
              <p style={{fontSize:'15px',color:'var(--w-tx2)',maxWidth:'460px',margin:'0 auto',lineHeight:1.7}}>Your Moon sign governs your emotional instincts, deepest needs and inner life — more revealing than any Sun sign.</p>
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

                {/* Personalised report CTA — stays on Western, no redirect to Vedic */}
                <div style={{background:`linear-gradient(135deg,${theme.acc}12,${theme.gold}08)`,border:`1px solid ${theme.acc}30`,borderRadius:'20px',padding:'36px',textAlign:'center'}}>
                  <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'22px',fontWeight:600,color:'var(--w-acc)',marginBottom:'10px'}}>Your Complete Cosmic Portrait</div>
                  <p style={{fontSize:'14px',color:'var(--w-tx2)',marginBottom:'24px',maxWidth:'400px',margin:'0 auto 24px',lineHeight:1.7}}>Full natal chart · Year ahead forecast · Relationship compatibility · Life purpose reading</p>
                  <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
                    {btn('Get Full Reading — Free',()=>setTab('chart'))}
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
            <div style={{textAlign:'center',marginBottom:'40px'}}>
              <div style={{fontSize:'11px',color:'var(--w-gold)',fontWeight:700,letterSpacing:'.12em',textTransform:'uppercase',marginBottom:'12px'}}>Moon Sign Compatibility</div>
              <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(28px,4vw,44px)',fontWeight:700,color:'var(--w-tx)',lineHeight:1.15,marginBottom:'12px'}}>Are You Truly Compatible?</h1>
              <p style={{fontSize:'15px',color:'var(--w-tx2)',maxWidth:'440px',margin:'0 auto',lineHeight:1.7}}>Moon sign compatibility reveals the emotional foundation of any relationship — the most reliable measure of long-term harmony.</p>
            </div>

            <div style={{background:'var(--w-surf)',border:'1px solid var(--w-bd)',borderRadius:'20px',padding:'36px',boxShadow:'0 4px 24px rgba(0,0,0,.06)',marginBottom:'28px'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 48px 1fr',gap:'20px',alignItems:'start',marginBottom:'28px'}}>
                {/* Person 1 */}
                <div>
                  <div style={{fontSize:'11px',color:'var(--w-acc)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'12px'}}>♥ Person 1</div>
                  <input value={n1} onChange={e=>setN1(e.target.value)} placeholder="Name (optional)"
                    style={{width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1.5px solid var(--w-bd)',background:'var(--w-bg)',color:'var(--w-tx)',fontSize:'14px',marginBottom:'8px',boxSizing:'border-box',fontFamily:'inherit',outline:'none'}} />
                  {(['dd','mm','yyyy'] as const).map(f=>(
                    <div key={f} style={{marginBottom:'8px'}}>
                      <Sel value={d1[f]||''} onChange={v=>setD1(d=>({...d,[f]:+v}))} placeholder={f==='dd'?'Day':f==='mm'?'Month':'Year'} w="100%"
                        opts={f==='dd'?DAYS.map(d=>({v:d,l:String(d)})):f==='mm'?MONTHS.map((m,i)=>({v:i+1,l:m})):YEARS_100.map(y=>({v:y,l:String(y)}))} />
                    </div>
                  ))}
                </div>
                <div style={{textAlign:'center',paddingTop:'60px',fontSize:'24px',color:'#EF4444'}}>♥</div>
                {/* Person 2 */}
                <div>
                  <div style={{fontSize:'11px',color:'var(--w-acc)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',marginBottom:'12px'}}>♥ Person 2</div>
                  <input value={n2} onChange={e=>setN2(e.target.value)} placeholder="Name (optional)"
                    style={{width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1.5px solid var(--w-bd)',background:'var(--w-bg)',color:'var(--w-tx)',fontSize:'14px',marginBottom:'8px',boxSizing:'border-box',fontFamily:'inherit',outline:'none'}} />
                  {(['dd','mm','yyyy'] as const).map(f=>(
                    <div key={f} style={{marginBottom:'8px'}}>
                      <Sel value={d2[f]||''} onChange={v=>setD2(d=>({...d,[f]:+v}))} placeholder={f==='dd'?'Day':f==='mm'?'Month':'Year'} w="100%"
                        opts={f==='dd'?DAYS.map(d=>({v:d,l:String(d)})):f==='mm'?MONTHS.map((m,i)=>({v:i+1,l:m})):YEARS_100.map(y=>({v:y,l:String(y)}))} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{textAlign:'center'}}>{btn('Reveal Compatibility ✦',()=>{setM1(getMoon(d1.dd,d1.mm,d1.yyyy));setM2(getMoon(d2.dd,d2.mm,d2.yyyy))},!d1.dd||!d1.mm||!d1.yyyy||!d2.dd||!d2.mm||!d2.yyyy)}</div>
            </div>

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
                  {btn(`Get Full Compatibility Report — ${curr.sym}29`,()=>alert('Full report coming soon — join waitlist'))}
                </div>
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
                  <input placeholder="Your full name" style={{width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1.5px solid var(--w-bd)',background:'var(--w-bg)',color:'var(--w-tx)',fontSize:'14px',boxSizing:'border-box',fontFamily:'inherit',outline:'none'}} />
                </div>
                <div>
                  <div style={{fontSize:'10px',color:'var(--w-tx2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'6px'}}>Date of birth</div>
                  <div style={{display:'flex',gap:'8px'}}>
                    <Sel value="" onChange={()=>{}} placeholder="Day" w="80px" opts={DAYS.map(d=>({v:d,l:String(d)}))} />
                    <Sel value="" onChange={()=>{}} placeholder="Month" w="140px" opts={MONTHS.map((m,i)=>({v:i+1,l:m}))} />
                    <Sel value="" onChange={()=>{}} placeholder="Year" w="96px" opts={YEARS_100.map(y=>({v:y,l:String(y)}))} />
                  </div>
                </div>
                <div>
                  <div style={{fontSize:'10px',color:'var(--w-tx2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'6px'}}>Time of birth <span style={{fontSize:'9px',opacity:.6}}>(improves accuracy)</span></div>
                  <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
                    <Sel value="" onChange={()=>{}} placeholder="Hr" w="80px" opts={Array.from({length:12},(_,i)=>({v:i+1,l:String(i+1)}))} />
                    <span style={{color:'var(--w-tx2)',fontWeight:300,fontSize:'18px'}}>:</span>
                    <Sel value="" onChange={()=>{}} placeholder="Min" w="80px" opts={Array.from({length:60},(_,i)=>({v:i,l:String(i).padStart(2,'0')}))} />
                    <Sel value="" onChange={()=>{}} placeholder="AM/PM" w="90px" opts={[{v:'AM',l:'AM'},{v:'PM',l:'PM'}]} />
                  </div>
                </div>
                <div>
                  <div style={{fontSize:'10px',color:'var(--w-tx2)',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',marginBottom:'6px'}}>Place of birth</div>
                  <input placeholder="City, Country" style={{width:'100%',padding:'10px 12px',borderRadius:'10px',border:'1.5px solid var(--w-bd)',background:'var(--w-bg)',color:'var(--w-tx)',fontSize:'14px',boxSizing:'border-box',fontFamily:'inherit',outline:'none'}} />
                </div>
                <div style={{textAlign:'center'}}>{btn('Generate My Chart — Free ✦',()=>alert('Chart generation — connect to API'))}</div>
                <p style={{textAlign:'center',fontSize:'11px',color:'var(--w-tx2)',margin:0,opacity:.6}}>Premium reports from {curr.sym}19 · No subscription</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
