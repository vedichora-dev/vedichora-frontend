"use client"
import { useState } from "react"
import { useStore } from "@/store"
import { getVarshaphal, getVarshaphalMonthly } from "@/api"

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

export default function VarshaphalPage() {
  const { token, currentHoroId } = useStore()
  const [year, setYear] = useState(new Date().getFullYear())
  const [result, setResult] = useState<any>(null)
  const [monthly, setMonthly] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!currentHoroId) { alert("Please generate your birth chart first"); return }
    setLoading(true)
    try {
      const [ann, mon] = await Promise.all([getVarshaphal(currentHoroId, year), getVarshaphalMonthly(currentHoroId, year)])
      setResult(ann); setMonthly(mon?.months || [])
    } catch { alert("Failed to load annual chart") }
    finally { setLoading(false) }
  }

  if (!token) return (
    <div className="page-wrap max-w-3xl">
      <div className="page-header"><h1>Varshaphal</h1><p>Annual solar return chart</p></div>
      <div className="card card-bd text-center py-12">
        <div className="text-4xl mb-3">📅</div>
        <div className="font-cinzel font-bold text-lg mb-2" style={{color:"var(--maroon)"}}>What is Varshaphal?</div>
        <p className="text-sm max-w-md mx-auto mb-6" style={{color:"var(--txm)"}}>Varshaphal (वर्षफल) is the Vedic annual prediction system based on the Solar Return — the exact moment the Sun returns to its natal degree each year. It includes the Muntha, Varsha Lagna, and Panchadhikaris for precise yearly predictions.</p>
        <a href="/signup" className="btn-primary px-6 py-2.5 text-sm font-cinzel inline-block">Create free account to view</a>
      </div>
    </div>
  )

  return (
    <div className="page-wrap max-w-4xl">
      <div className="page-header"><h1>Varshaphal {year}</h1><p>Annual solar return chart</p></div>
      <div className="card card-bd flex items-center gap-4 mb-6 flex-wrap">
        <div>
          <label className="label">Year</label>
          <select className="select w-32" value={year} onChange={e=>setYear(+e.target.value)}>
            {Array.from({length:10},(_,i)=>new Date().getFullYear()+i-2).map(y=><option key={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="btn-primary px-6 py-2.5 font-cinzel text-sm">
          {loading?"Loading…":"Generate →"}
        </button>
      </div>

      {monthly.length > 0 && (
        <div className="card">
          <div className="card-hd"><span className="card-title">Month-by-Month Forecast {year}</span></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr style={{background:"var(--bg2)",borderBottom:"1px solid var(--bd)"}}>
                {["Month","Mudda Dasha","Theme","Score"].map(h=><th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{color:"var(--maroon)"}}>{h}</th>)}
              </tr></thead>
              <tbody>
                {monthly.map((m,i)=>(
                  <tr key={i} style={{borderBottom:"1px solid var(--bd)"}}>
                    <td className="px-4 py-2.5 font-semibold" style={{color:"var(--maroon)"}}>{MONTHS_SHORT[i]}</td>
                    <td className="px-4 py-2.5" style={{color:"var(--tx)"}}>{m.muddaDashaLord||m.lord||"—"}</td>
                    <td className="px-4 py-2.5 text-xs" style={{color:"var(--tx2)"}}>{m.theme||m.prediction||"—"}</td>
                    <td className="px-4 py-2.5"><span className={m.score>=65?"badge-ok":m.score>=45?"badge-gold":"badge-warn"}>{Math.round(m.score||0)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
