'use client'
import { useState, useEffect, useRef } from 'react'
import { useStore } from '@/store'
import { useRouter } from 'next/navigation'
import { Phone, PhoneOff, Mic, MicOff, Star, Clock, CreditCard,
         RefreshCw, MessageCircle, Video } from 'lucide-react'

interface Astrologer {
  id: string; name: string; speciality: string; lang: string[]
  rating: number; ratePerMin: number; status: 'online'|'busy'|'offline'
  experience: number; totalReadings: number; avatar: string
}

const MOCK_ASTROLOGERS: Astrologer[] = [
  { id:'a1', name:'Pandit Krishnaswami', speciality:'Vedic & KP',
    lang:['Tamil','English'], rating:4.9, ratePerMin:15,
    status:'online', experience:22, totalReadings:4820, avatar:'🧘' },
  { id:'a2', name:'Dr. Meenakshi Devi', speciality:'Marriage & Career',
    lang:['Tamil','Telugu','English'], rating:4.8, ratePerMin:12,
    status:'online', experience:18, totalReadings:3150, avatar:'🌟' },
  { id:'a3', name:'Jyotishi Raghavendra', speciality:'Numerology & Vastu',
    lang:['Kannada','Hindi','English'], rating:4.7, ratePerMin:10,
    status:'busy', experience:15, totalReadings:2890, avatar:'🔮' },
  { id:'a4', name:'Astrologer Selvam', speciality:'Nadi & Prashna',
    lang:['Tamil','English'], rating:4.9, ratePerMin:20,
    status:'online', experience:30, totalReadings:7200, avatar:'✨' },
]

type CallState = 'idle'|'connecting'|'active'|'ended'

export default function ConsultPage() {
  const router = useRouter()
  const { token, user, currency, currencySym } = useStore()

  const [astros,   setAstros]   = useState<Astrologer[]>(MOCK_ASTROLOGERS)
  const [filter,   setFilter]   = useState<'all'|'online'>('online')
  const [selAstro, setSelAstro] = useState<Astrologer|null>(null)
  const [callState,setCallState]= useState<CallState>('idle')
  const [elapsed,  setElapsed]  = useState(0)
  const [muted,    setMuted]    = useState(false)
  const [cost,     setCost]     = useState(0)
  const [loading,  setLoading]  = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  // Load real astrologers from backend
  useEffect(() => {
    const CHART_URL = process.env.NEXT_PUBLIC_CHART_URL || 'https://enchanting-dedication-production.up.railway.app'
    fetch(`${CHART_URL}/api/consult/astrologers?status=online`)
      .then(r=>r.json())
      .then(d => {
        const list = d?.data?.astrologers || d?.data || []
        if (Array.isArray(list) && list.length > 0) setAstros(list)
      })
      .catch(()=>{}) // fallback to mock
  }, [])

  const startCall = async (astro: Astrologer) => {
    if (!token) { router.push('/signin?next=/consult'); return }
    setSelAstro(astro); setCallState('connecting'); setLoading(true)
    setElapsed(0); setCost(0)

    try {
      const CHART_URL = process.env.NEXT_PUBLIC_CHART_URL || 'https://enchanting-dedication-production.up.railway.app'
      const res = await fetch(`${CHART_URL}/api/consult/session/start`, {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
        body: JSON.stringify({ astrologerId: astro.id, channelType: 'voice' })
      }).then(r=>r.json())

      // Agora token from backend
      const agoraToken = res?.data?.agoraToken || res?.agoraToken
      const channelId  = res?.data?.channelId  || res?.channelId  || `vh_${Date.now()}`

      // TODO: Initialize Agora RTC with agoraToken + channelId
      // For now simulate call
      setCallState('active')

      // Start billing timer
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1
          setCost(Math.floor(next / 60) * astro.ratePerMin)
          return next
        })
      }, 1000)
    } catch {
      // Simulate call for demo
      setCallState('active')
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          const next = prev + 1
          setCost(Math.floor(next / 60) * astro.ratePerMin)
          return next
        })
      }, 1000)
    }
    setLoading(false)
  }

  const endCall = async () => {
    clearInterval(timerRef.current)
    setCallState('ended')
    if (selAstro) {
      try {
        const CHART_URL = process.env.NEXT_PUBLIC_CHART_URL || 'https://enchanting-dedication-production.up.railway.app'
        await fetch(`${CHART_URL}/api/consult/session/end`, {
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
          body: JSON.stringify({ channelId: `vh_session`, duration: elapsed })
        })
      } catch {}
    }
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  const fmt = (s:number) =>
    `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const shown = astros.filter(a => filter==='all' || a.status==='online')

  // ── ACTIVE CALL UI ──
  if (callState === 'connecting' || callState === 'active') return (
    <div style={{minHeight:'100vh',background:'#0f0f1a',display:'flex',
      flexDirection:'column',alignItems:'center',justifyContent:'center',
      color:'#fff',padding:'20px'}}>

      {/* Astrologer avatar */}
      <div style={{fontSize:'80px',marginBottom:'16px'}}>{selAstro?.avatar}</div>
      <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'22px',
        color:'#fff',marginBottom:'4px'}}>{selAstro?.name}</div>
      <div style={{fontSize:'13px',color:'rgba(255,255,255,.6)',marginBottom:'32px'}}>
        {selAstro?.speciality}
      </div>

      {callState==='connecting' ? (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'12px'}}>
          <RefreshCw style={{width:'32px',height:'32px',color:'#C4922A',
            animation:'spin 1s linear infinite'}}/>
          <span style={{color:'rgba(255,255,255,.7)',fontSize:'14px'}}>Connecting...</span>
        </div>
      ) : (
        <>
          {/* Timer + cost */}
          <div style={{fontFamily:'Courier,monospace',fontSize:'42px',fontWeight:700,
            color:'#C4922A',letterSpacing:'4px',marginBottom:'8px'}}>{fmt(elapsed)}</div>
          <div style={{fontSize:'13px',color:'rgba(255,255,255,.6)',marginBottom:'40px'}}>
            {currency==='INR' ? `₹${cost}` : `$${Math.floor(cost*0.012)}`} charged
            · ₹{selAstro?.ratePerMin}/min
          </div>

          {/* Controls */}
          <div style={{display:'flex',gap:'24px',alignItems:'center'}}>
            <button onClick={()=>setMuted(m=>!m)}
              style={{width:'56px',height:'56px',borderRadius:'50%',
                border:'none',cursor:'pointer',display:'flex',
                alignItems:'center',justifyContent:'center',
                background:muted?'rgba(239,68,68,.3)':'rgba(255,255,255,.15)'}}>
              {muted
                ? <MicOff style={{width:'22px',height:'22px',color:'#EF4444'}}/>
                : <Mic    style={{width:'22px',height:'22px',color:'#fff'}}/>}
            </button>

            <button onClick={endCall}
              style={{width:'72px',height:'72px',borderRadius:'50%',
                border:'none',cursor:'pointer',display:'flex',
                alignItems:'center',justifyContent:'center',
                background:'#EF4444',boxShadow:'0 0 24px rgba(239,68,68,.4)'}}>
              <PhoneOff style={{width:'28px',height:'28px',color:'#fff'}}/>
            </button>

            <button
              style={{width:'56px',height:'56px',borderRadius:'50%',
                border:'none',cursor:'pointer',display:'flex',
                alignItems:'center',justifyContent:'center',
                background:'rgba(255,255,255,.15)'}}>
              <MessageCircle style={{width:'22px',height:'22px',color:'#fff'}}/>
            </button>
          </div>
        </>
      )}
    </div>
  )

  // ── CALL ENDED ──
  if (callState === 'ended') return (
    <div style={{minHeight:'80vh',display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:'20px',gap:'16px'}}>
      <div style={{fontSize:'56px'}}>✅</div>
      <h2 style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'22px',color:'var(--acc)'}}>
        Call Ended
      </h2>
      <div style={{display:'flex',gap:'32px',fontSize:'14px',color:'var(--txm)'}}>
        <div>Duration: <strong style={{color:'var(--tx)'}}>{fmt(elapsed)}</strong></div>
        <div>Cost: <strong style={{color:'var(--gold)'}}>
          {currency==='INR' ? `₹${cost}` : `$${Math.floor(cost*0.012)}`}
        </strong></div>
      </div>
      <p style={{fontSize:'13px',color:'var(--txm)',maxWidth:'320px',textAlign:'center'}}>
        Please rate your experience with {selAstro?.name}
      </p>
      <div style={{display:'flex',gap:'8px'}}>
        {[1,2,3,4,5].map(n=>(
          <button key={n} style={{fontSize:'28px',background:'none',border:'none',
            cursor:'pointer'}}>⭐</button>
        ))}
      </div>
      <button onClick={()=>{ setCallState('idle'); setSelAstro(null) }}
        className="btn-primary" style={{padding:'10px 28px',fontFamily:'Cinzel,serif'}}>
        Back to Astrologers
      </button>
    </div>
  )

  // ── ASTROLOGER LIST ──
  return (
    <div style={{maxWidth:'1200px',margin:'0 auto',padding:'20px 16px'}}>
      <div style={{marginBottom:'24px'}}>
        <h1 style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'22px',
          color:'var(--acc)',marginBottom:'4px'}}>Talk to an Astrologer</h1>
        <p style={{fontSize:'13px',color:'var(--txm)'}}>
          Live voice consultations with verified Vedic astrologers
        </p>
      </div>

      {/* Filter */}
      <div style={{display:'flex',gap:'8px',marginBottom:'20px'}}>
        {(['online','all'] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            style={{padding:'6px 16px',borderRadius:'20px',fontSize:'12px',
              fontWeight:600,border:`1.5px solid ${filter===f?'var(--gold)':'var(--bd)'}`,
              background:filter===f?'rgba(196,146,42,.1)':'transparent',
              color:filter===f?'var(--gold)':'var(--txm)',cursor:'pointer',
              fontFamily:'inherit',textTransform:'capitalize'}}>
            {f==='online' ? '🟢 Online Now' : 'All Astrologers'}
          </button>
        ))}
        <span style={{marginLeft:'auto',fontSize:'12px',color:'var(--txm)',
          alignSelf:'center'}}>{shown.length} available</span>
      </div>

      {/* Grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',
        gap:'16px'}} className="astro-grid">
        {shown.map(a=>(
          <div key={a.id} className="card" style={{padding:'20px'}}>
            <div style={{display:'flex',gap:'14px',alignItems:'flex-start'}}>
              <div style={{fontSize:'40px',flexShrink:0}}>{a.avatar}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',
                  marginBottom:'2px',flexWrap:'wrap'}}>
                  <span style={{fontFamily:'Cinzel,serif',fontWeight:700,
                    fontSize:'15px',color:'var(--acc)'}}>{a.name}</span>
                  <span style={{width:'8px',height:'8px',borderRadius:'50%',flexShrink:0,
                    background:a.status==='online'?'#16A34A':
                               a.status==='busy'?'#F59E0B':'#9CA3AF'}}/>
                  <span style={{fontSize:'10px',color:'var(--txm)',
                    textTransform:'capitalize'}}>{a.status}</span>
                </div>
                <div style={{fontSize:'12px',color:'var(--txm)',marginBottom:'6px'}}>
                  {a.speciality}
                </div>
                <div style={{display:'flex',gap:'12px',fontSize:'11px',
                  color:'var(--txm)',flexWrap:'wrap',marginBottom:'12px'}}>
                  <span>⭐ {a.rating}</span>
                  <span>🕐 {a.experience}y exp</span>
                  <span>📖 {a.totalReadings.toLocaleString()} readings</span>
                  <span>🌐 {a.lang.join(', ')}</span>
                </div>
                <div style={{display:'flex',alignItems:'center',
                  justifyContent:'space-between',gap:'10px',flexWrap:'wrap'}}>
                  <span style={{fontWeight:700,color:'var(--gold)',fontSize:'14px'}}>
                    ₹{a.ratePerMin}/min
                    <span style={{fontSize:'10px',color:'var(--txm)',fontWeight:400,
                      marginLeft:'4px'}}>({currencySym}{Math.round(a.ratePerMin*0.012)}/min)</span>
                  </span>
                  <button
                    onClick={()=>a.status==='online'?startCall(a):null}
                    disabled={a.status!=='online' || loading}
                    style={{display:'flex',alignItems:'center',gap:'6px',
                      padding:'8px 16px',borderRadius:'8px',border:'none',
                      background:a.status==='online'?'var(--acc)':'var(--bd)',
                      color:a.status==='online'?'#fff':'var(--txm)',
                      cursor:a.status==='online'?'pointer':'not-allowed',
                      fontSize:'12px',fontWeight:700,fontFamily:'Cinzel,serif'}}>
                    <Phone style={{width:'12px',height:'12px'}}/>
                    {a.status==='online'?'Call Now':'Busy'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!token && (
        <div style={{textAlign:'center',marginTop:'24px',padding:'20px',
          background:'rgba(196,146,42,.06)',borderRadius:'14px',
          border:'1px solid rgba(196,146,42,.2)'}}>
          <p style={{color:'var(--txm)',fontSize:'14px',marginBottom:'12px'}}>
            Sign in to start a consultation
          </p>
          <a href="/signin" className="btn-primary"
            style={{padding:'10px 24px',fontFamily:'Cinzel,serif',
              textDecoration:'none',display:'inline-block'}}>
            Sign in to Call
          </a>
        </div>
      )}
    </div>
  )
}
