"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/store"
import { listCharts, getCredits } from "@/api"
import { LayoutDashboard } from "lucide-react"

export default function DashboardPage() {
  const { token, user } = useStore()
  const router = useRouter()
  const [charts, setCharts] = useState<any[]>([])
  const [credits, setCredits] = useState<number>(0)

  useEffect(() => {
    if (!token) { router.push("/signin"); return }
    listCharts().then(data => { if (data?.length) setCharts(data) })
    getCredits().then((r: any) => {
      const bal = r?.data?.data?.balance ?? r?.data?.balance ?? 0
      setCredits(bal)
    }).catch(() => {})
  }, [token])

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.displayName || "Astrologer"}</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          { label:"Saved Charts",    value:charts.length || 0, icon:"📜" },
          { label:"Consultations",   value:0,                  icon:"🔮" },
          { label:"Credits Balance", value:credits,             icon:"💰" },
        ].map(s => (
          <div key={s.label} className="card card-bd text-center">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="font-cinzel font-black text-3xl" style={{color:"var(--maroon)"}}>{s.value}</div>
            <div className="text-xs mt-1" style={{color:"var(--txm)"}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-hd"><span className="card-title">Saved Charts</span></div>
        <div className="card-bd">
          {charts.length === 0 ? (
            <div className="text-center py-8" style={{color:"var(--txm)"}}>
              <div className="text-3xl mb-2">📜</div>
              <div className="text-sm">No saved charts yet</div>
              <a href="/chart" className="btn-primary px-5 py-2 text-sm font-cinzel inline-block mt-4">Generate your chart</a>
            </div>
          ) : (
            <div className="space-y-2">
              {charts.map((c,i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                  style={{background:"var(--bg2)",border:"1px solid var(--bd)"}}
                  onClick={() => router.push("/chart")}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{background:"var(--maroon)"}}>{(c.personName||"U")[0]}</div>
                  <div>
                    <div className="text-sm font-semibold" style={{color:"var(--maroon)"}}>{c.personName||"Chart "+(i+1)}</div>
                    <div className="text-xs" style={{color:"var(--txm)"}}>{c.ascendantName||""} · {c.moonRasi||""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
