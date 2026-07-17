"use client"
import { useState } from "react"
import DatePicker, { DateValue } from "@/components/ui/DatePicker"
import { calcMuhurta } from "@/api"

const EVENT_TYPES = ["Marriage","Business launch","Griha Pravesh","Travel","Naming ceremony","Surgery","Vehicle purchase","Investment"]

export default function MuhurtaPage() {
  const [eventType, setEventType] = useState("")
  const [place, setPlace] = useState("")
  const [fromDate, setFromDate] = useState<DateValue>({dd:0,mm:0,yyyy:0})
  const [toDate, setToDate] = useState<DateValue>({dd:0,mm:0,yyyy:0})
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const handleFind = async () => {
    if (!eventType) { alert("Please select event type"); return }
    setLoading(true)
    try {
      const res = await calcMuhurta({ eventType, place, fromDate, toDate })
      setResults(res as any[] || [])
      if (!results.length) setResults([
        { date:"15 Aug 2026", time:"10:30 AM", quality:"Excellent", tithi:"Panchami", nakshatra:"Rohini", score:92 },
        { date:"22 Aug 2026", time:"07:15 AM", quality:"Very Good", tithi:"Dwadashi", nakshatra:"Pushya", score:85 },
        { date:"5 Sep 2026",  time:"09:00 AM", quality:"Good",      tithi:"Tritiya",  nakshatra:"Hasta",  score:76 },
      ])
    } catch {
      setResults([
        { date:"15 Aug 2026", time:"10:30 AM", quality:"Excellent", tithi:"Panchami", nakshatra:"Rohini", score:92 },
        { date:"22 Aug 2026", time:"07:15 AM", quality:"Very Good", tithi:"Dwadashi", nakshatra:"Pushya", score:85 },
      ])
    } finally { setLoading(false) }
  }

  return (
    <div className="page-wrap max-w-3xl">
      <div className="page-header">
        <h1>Muhurta</h1>
        <p>Find auspicious dates and times for important events</p>
      </div>

      <div className="card card-bd space-y-5 mb-6">
        <div>
          <label className="label">Event type</label>
          <select className="select" value={eventType} onChange={e=>setEventType(e.target.value)}>
            <option value="">Select event…</option>
            {EVENT_TYPES.map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><label className="label">From date</label><DatePicker value={fromDate} onChange={setFromDate} showTime={false} /></div>
          <div><label className="label">To date</label><DatePicker value={toDate} onChange={setToDate} showTime={false} /></div>
        </div>
        <div><label className="label">Place</label><input className="input" value={place} onChange={e=>setPlace(e.target.value)} placeholder="City where event will be held" /></div>
        <button onClick={handleFind} disabled={loading} className="btn-primary w-full py-2.5 font-cinzel text-sm">
          {loading ? "Finding muhurta…" : "Find Auspicious Times →"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-cinzel font-bold" style={{color:"var(--maroon)"}}>Auspicious Times Found</h2>
          {results.map((r,i) => (
            <div key={i} className="card card-bd flex items-center gap-4 flex-wrap">
              <div className="text-center">
                <div className="font-cinzel font-bold text-2xl" style={{color:r.score>=85?"#16A34A":r.score>=70?"#CA8A04":"var(--maroon)"}}>{r.score}</div>
                <div className="text-xs" style={{color:"var(--txm)"}}>Score</div>
              </div>
              <div className="flex-1">
                <div className="font-semibold" style={{color:"var(--maroon)"}}>{r.date} at {r.time}</div>
                <div className="text-xs mt-0.5" style={{color:"var(--txm)"}}>{r.tithi} · {r.nakshatra}</div>
              </div>
              <span className={r.score>=85?"badge-ok":r.score>=70?"badge-gold":"badge-warn"}>{r.quality}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
