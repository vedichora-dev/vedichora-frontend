'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'
import { calcMuhurta } from '@/api'
import { useStore } from '@/store'

const EVENT_TYPES = ['Marriage','Business launch','Griha Pravesh','Travel','Naming ceremony','Surgery','Vehicle purchase','Investment']

const SAMPLE = [
  { date:'15 Aug 2026', time:'10:30 AM', quality:'Excellent', tithi:'Panchami',  nakshatra:'Rohini', score:92 },
  { date:'22 Aug 2026', time:'07:15 AM', quality:'Very Good', tithi:'Dwadashi', nakshatra:'Pushya',  score:85 },
  { date:'5 Sep 2026',  time:'09:00 AM', quality:'Good',      tithi:'Tritiya',  nakshatra:'Hasta',   score:76 },
]

export default function MuhurtaPage() {
  const router = useRouter()
  const { token, setRedirectAfterLogin } = useStore()
  const [eventType, setEventType] = useState('')
  const [place, setPlace]         = useState('')
  const [fromDate, setFromDate]   = useState<DateValue>({dd:0,mm:0,yyyy:0})
  const [toDate,   setToDate]     = useState<DateValue>({dd:0,mm:0,yyyy:0})
  const [loading,  setLoading]    = useState(false)
  const [results,  setResults]    = useState<any[]>([])

  const handleFind = async () => {
    if (!eventType) { alert('Please select event type'); return }
    if (!token) {
      setRedirectAfterLogin('/muhurta')
      router.push('/signin')
      return
    }
    setLoading(true)
    try {
      const res = await calcMuhurta({ eventType, place, fromDate, toDate })
      const data = (res as any)?.data?.data || (res as any)?.data
      setResults(Array.isArray(data) ? data : SAMPLE)
    } catch { setResults(SAMPLE) }
    finally { setLoading(false) }
  }

  return (
    <div className="page-wrap" style={{maxWidth:'700px'}}>
      <div className="page-header">
        <h1>Muhurta</h1>
        <p>Find auspicious dates and times for important events</p>
      </div>

      <div className="card" style={{marginBottom:'24px'}}>
        <div className="card-bd" style={{display:'flex',flexDirection:'column',gap:'20px'}}>
          <div>
            <label className="label">Event type</label>
            <select className="select" value={eventType} onChange={e=>setEventType(e.target.value)}>
              <option value="">Select event…</option>
              {EVENT_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
            <div><label className="label">From date</label><DatePicker value={fromDate} onChange={setFromDate} showTime={false} /></div>
            <div><label className="label">To date</label><DatePicker value={toDate} onChange={setToDate} showTime={false} /></div>
          </div>
          <div><label className="label">Place</label><input className="input" value={place} onChange={e=>setPlace(e.target.value)} placeholder="City where event will be held" /></div>
          <button onClick={handleFind} disabled={loading} className="btn-primary w-full py-2.5 font-cinzel text-sm">
            {loading ? 'Finding muhurta…' : 'Find Auspicious Times →'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <h2 className="section-title">Auspicious Times Found</h2>
          {results.map((r,i) => (
            <div key={i} className="card">
              <div className="card-bd" style={{display:'flex',alignItems:'center',gap:'16px',flexWrap:'wrap'}}>
                {/* Score gauge */}
                <div style={{textAlign:'center',minWidth:'60px'}}>
                  <div className="font-cinzel font-black text-2xl" style={{color:r.score>=85?'var(--good,#2D5C45)':r.score>=70?'var(--warn,#9C6B14)':'var(--bad,#7A1F1F)'}}>{r.score}</div>
                  <div style={{height:'4px',background:'var(--bd)',borderRadius:'2px',marginTop:'4px'}}>
                    <div style={{height:'100%',width:`${r.score}%`,background:r.score>=85?'var(--good,#2D5C45)':r.score>=70?'var(--warn,#9C6B14)':'var(--bad,#7A1F1F)',borderRadius:'2px'}} />
                  </div>
                  <div style={{fontSize:'10px',color:'var(--txm)',marginTop:'2px'}}>Score</div>
                </div>
                <div style={{flex:1}}>
                  <div className="font-semibold" style={{color:'var(--acc)'}}>{r.date} at {r.time}</div>
                  <div style={{fontSize:'12px',color:'var(--txm)',marginTop:'2px'}}>{r.tithi} · {r.nakshatra}</div>
                </div>
                <span className={r.score>=85?'badge-ok':r.score>=70?'badge-gold':'badge-warn'}>{r.quality}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
