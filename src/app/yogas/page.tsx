"use client"
import { useEffect, useState } from "react"
import { useStore } from "@/store"

const SAMPLE_YOGAS = [
  { name:"Gajakesari Yoga", planets:"Moon + Jupiter", type:"Wealth & Wisdom", desc:"Jupiter placed in a kendra from the Moon. Bestows wisdom, eloquence, fame, and prosperity. One of the most auspicious yogas.", strength:"Strong" },
  { name:"Budha-Aditya Yoga", planets:"Sun + Mercury", type:"Intelligence", desc:"Sun and Mercury in the same house. Produces sharp intelligence, communication skill, and scholarly ability.", strength:"Moderate" },
  { name:"Lakshmi Yoga", planets:"9th lord + Venus", type:"Wealth", desc:"9th lord strong and Venus in own/exalted sign. Brings great wealth, beauty, happiness, and devotion.", strength:"Very Strong" },
  { name:"Raja Yoga", planets:"Kendra + Trikona lords", type:"Power & Status", desc:"Conjunction or mutual aspect of kendra and trikona lords. Brings authority, status, and public recognition.", strength:"Moderate" },
]

const STRENGTH_COLOR: Record<string,string> = {
  "Very Strong":"badge-ok", Strong:"badge-ok", Moderate:"badge-gold", Weak:"badge-warn"
}

export default function YogasPage() {
  const { token, currentHoroId } = useStore()

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Active Yogas</h1>
        <p>Classical yoga combinations from BPHS and Jataka Parijata</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-6">
        {/* What are yogas */}
        <div className="card card-bd">
          <div className="font-cinzel font-bold mb-3" style={{color:"var(--maroon)"}}>What are Yogas?</div>
          <p className="text-sm leading-relaxed mb-3" style={{color:"var(--tx2)"}}>Yogas (योग) are specific planetary combinations that produce distinct results — wealth, fame, intelligence, or challenges. Classical texts describe over 300 yogas.</p>
          <p className="text-sm leading-relaxed" style={{color:"var(--tx2)"}}>A yoga becomes powerful when the planets are strong in Shadbala, not combust or debilitated, and their Mahadasha is active.</p>
        </div>

        {/* Sample yogas */}
        <div className="space-y-3">
          {SAMPLE_YOGAS.map(y => (
            <div key={y.name} className="card card-bd">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="font-semibold text-sm" style={{color:"var(--maroon)"}}>{y.name}</div>
                <span className={STRENGTH_COLOR[y.strength]||"badge-gold"}>{y.strength}</span>
              </div>
              <div className="text-xs font-semibold mb-1.5" style={{color:"var(--gold)"}}>{y.planets} · {y.type}</div>
              <p className="text-xs leading-relaxed" style={{color:"var(--tx2)"}}>{y.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {!token ? (
        <div className="card card-bd text-center py-10">
          <div className="text-4xl mb-3">💫</div>
          <div className="font-cinzel font-semibold mb-2" style={{color:"var(--maroon)"}}>See yogas in YOUR chart</div>
          <p className="text-sm mb-5" style={{color:"var(--txm)"}}>Sign in to identify all active yoga combinations with strength scores and dasha timing</p>
          <a href="/signup" className="btn-primary px-6 py-2.5 text-sm font-cinzel inline-block">Create free account</a>
        </div>
      ) : null}
    </div>
  )
}
