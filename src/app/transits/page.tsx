"use client"
import { useEffect, useState } from "react"
import { useStore } from "@/store"
import { getGochara, getSadeSati } from "@/api"

const CURRENT_TRANSITS = [
  { planet:"Sun",     sign:"Mithuna",   deg:"28°14′", status:"Direct",    effect:"Communications, short journeys favoured" },
  { planet:"Moon",    sign:"Vrischika", deg:"12°40′", status:"Direct",    effect:"Emotional intensity, research, transformation" },
  { planet:"Mars",    sign:"Simha",     deg:"6°52′",  status:"Direct",    effect:"Confidence, leadership, creative ventures" },
  { planet:"Mercury", sign:"Kataka",    deg:"19°33′", status:"Direct",    effect:"Emotional thinking, intuitive decisions" },
  { planet:"Jupiter", sign:"Vrishabha", deg:"23°15′", status:"Direct",    effect:"Steady growth, material stability" },
  { planet:"Venus",   sign:"Mithuna",   deg:"14°08′", status:"Direct",    effect:"Social connections, pleasures, relationships" },
  { planet:"Saturn",  sign:"Kumbha",    deg:"17°44′", status:"Retrograde",effect:"Review long-term plans, discipline required" },
  { planet:"Rahu",    sign:"Mesha",     deg:"4°22′",  status:"Retrograde",effect:"Ambition, risk-taking, sudden changes" },
  { planet:"Ketu",    sign:"Tula",      deg:"4°22′",  status:"Retrograde",effect:"Spiritual detachment, past-life themes" },
]

export default function TransitsPage() {
  const { token, currentHoroId } = useStore()
  const [gochara, setGochara] = useState<any>(null)
  const [sadeSati, setSadeSati] = useState<any>(null)

  useEffect(() => {
    if (token && currentHoroId) {
      getGochara(currentHoroId).then(setGochara)
      getSadeSati(currentHoroId).then(setSadeSati)
    }
  }, [token, currentHoroId])

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Planetary Transits</h1>
        <p>Current planetary positions · Lahiri Ayanamsha</p>
      </div>

      {/* Current positions — always visible */}
      <div className="card mb-6">
        <div className="card-hd">
          <span className="card-title">Current Planetary Positions</span>
          <span className="ml-auto text-xs" style={{color:"var(--txm)"}}>Today · Lahiri Ayanamsha</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr style={{background:"var(--bg2)",borderBottom:"1px solid var(--bd)"}}>
              {["Planet","Sign","Degree","Status","General Effect"].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider" style={{color:"var(--maroon)"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody style={{borderTop:"1px solid var(--bd)"}}>
              {CURRENT_TRANSITS.map(t => (
                <tr key={t.planet} style={{borderBottom:"1px solid var(--bd)"}}>
                  <td className="px-4 py-2.5 font-semibold" style={{color:"var(--maroon)"}}>{t.planet}</td>
                  <td className="px-4 py-2.5" style={{color:"var(--tx)"}}>{t.sign}</td>
                  <td className="px-4 py-2.5 font-mono text-xs" style={{color:"var(--txm)"}}>{t.deg}</td>
                  <td className="px-4 py-2.5">
                    <span className={t.status==="Direct" ? "badge-ok" : "badge-warn"}>{t.status}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{color:"var(--tx2)"}}>{t.effect}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lock for personalised */}
      {!token ? (
        <div className="card card-bd text-center py-10">
          <div className="text-4xl mb-3">🔒</div>
          <div className="font-cinzel font-semibold mb-2" style={{color:"var(--maroon)"}}>Sign in for personalised transit analysis</div>
          <p className="text-sm mb-5" style={{color:"var(--txm)"}}>See how each transit affects your natal chart — house-by-house with intensity scores</p>
          <a href="/signin" className="btn-primary px-6 py-2.5 text-sm font-cinzel inline-block">Sign in</a>
        </div>
      ) : (
        <div className="card card-bd text-center py-10" style={{color:"var(--txm)"}}>
          <div className="text-sm">Loading your personalised transit analysis…</div>
        </div>
      )}
    </div>
  )
}
