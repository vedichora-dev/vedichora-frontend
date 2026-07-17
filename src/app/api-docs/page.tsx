"use client"
import { useState } from "react"
import { Code, Zap, Shield } from "lucide-react"
import { useStore } from "@/store"

const PLANS = [
  { name:"Free",         price:{INR:0,USD:0,GBP:0},     calls:"100/day",       support:"Docs only",            features:["100 calls/day","Chart calculate","Horoscope","Numerology"] },
  { name:"Starter",      price:{INR:999,USD:11.99,GBP:9.99}, calls:"1,000/day",  support:"Docs + community",  features:["1,000 calls/day","All free features","Match API","Forecast API","Muhurta API"] },
  { name:"Professional", price:{INR:4999,USD:59.99,GBP:49.99}, calls:"10,000/day", support:"Email support",   features:["10,000 calls/day","All starter features","Yogas API","Remedies API","Varshaphal","Priority response"] },
  { name:"Enterprise",   price:{INR:19999,USD:239.99,GBP:199.99}, calls:"Unlimited", support:"Dedicated",      features:["Unlimited calls","All features","White-label option","SLA guarantee","Dedicated support"] },
]

export default function ApiDocsPage() {
  const { currency, currencySym } = useStore()
  const curr = (currency as "INR"|"USD"|"GBP")
  const getPrice = (p: any) => p[curr] === 0 ? "Free" : `${currencySym}${p[curr]}/mo`

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Developer API</h1>
        <p>Integrate Vedic astrology into your applications</p>
      </div>

      {/* Base URLs */}
      <div className="card card-bd mb-8">
        <div className="font-cinzel font-bold mb-3" style={{color:"var(--maroon)"}}>Base URLs</div>
        <div className="space-y-2">
          {[
            { label:"Chart API", url:"https://enchanting-dedication-production.up.railway.app" },
            { label:"Auth API",  url:"https://vedichora-platform-production.up.railway.app" },
          ].map(u => (
            <div key={u.label} className="flex items-center gap-3 p-3 rounded-lg font-mono text-sm"
              style={{background:"var(--bg2)",border:"1px solid var(--bd)"}}>
              <span className="badge-gold shrink-0">{u.label}</span>
              <span style={{color:"var(--tx)"}}>{u.url}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Plans */}
      <h2 className="font-cinzel font-bold text-lg mb-5" style={{color:"var(--maroon)"}}>API Plans</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {PLANS.map(p => (
          <div key={p.name} className="card flex flex-col">
            <div className="card-bd flex flex-col flex-1 gap-3">
              <div className="font-cinzel font-bold" style={{color:"var(--maroon)"}}>{p.name}</div>
              <div className="font-cinzel font-black text-2xl" style={{color:"var(--gold)"}}>{getPrice(p.price)}</div>
              <div className="text-xs font-semibold" style={{color:"var(--txm)"}}>{p.calls} · {p.support}</div>
              <ul className="space-y-1.5 mt-2">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs" style={{color:"var(--tx2)"}}>
                    <span className="text-green-500 mt-0.5">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button className="btn-primary w-full py-2 text-xs mt-auto font-cinzel">
                {p.price.INR === 0 ? "Start free" : "Get started"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sample request */}
      <div className="card card-bd">
        <div className="font-cinzel font-bold mb-3" style={{color:"var(--maroon)"}}>Sample: Calculate Birth Chart</div>
        <pre className="text-xs overflow-x-auto p-4 rounded-lg" style={{background:"var(--bg2)",color:"var(--tx)",fontFamily:"monospace"}}>
{`POST /api/chart/calculate
Authorization: Bearer YOUR_TOKEN

{
  "PersonName": "Ravi Kumar",
  "Year": 1985, "Month": 6, "Day": 15,
  "Hour": 10, "Minute": 30, "Second": 0,
  "PlaceName": "Chennai, Tamil Nadu",
  "UtcOffsetHours": 5.5,
  "AyanamsaType": "Lahiri"
}`}
        </pre>
      </div>
    </div>
  )
}
