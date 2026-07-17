"use client"
import { useState, useEffect } from "react"
import { getPacks } from "@/api"
import { useStore } from "@/store"
import { useRouter } from "next/navigation"
import { ShoppingBag, Star, Zap, Crown } from "lucide-react"

const SAMPLE_PACKS = [
  { id:1, name:"Starter", description:"Perfect for exploring", credits:100, priceINR:199, priceUSD:2.49, priceGBP:1.99, popular:false, icon:"⭐" },
  { id:2, name:"Popular", description:"Most chosen plan", credits:300, priceINR:499, priceUSD:5.99, priceGBP:4.99, popular:true, icon:"🔮" },
  { id:3, name:"Pro", description:"For serious seekers", credits:700, priceINR:999, priceUSD:11.99, priceGBP:9.99, popular:false, icon:"👑" },
  { id:4, name:"Annual Chart", description:"Full birth chart report", credits:0, priceINR:299, priceUSD:3.49, priceGBP:2.99, popular:false, icon:"📜", type:"report" },
  { id:5, name:"Compatibility", description:"Full match report + PDF", credits:0, priceINR:399, priceUSD:4.79, priceGBP:3.99, popular:false, icon:"💑", type:"report" },
  { id:6, name:"Annual Forecast", description:"12-month Varshaphal", credits:0, priceINR:599, priceUSD:7.19, priceGBP:5.99, popular:false, icon:"📅", type:"report" },
]

export default function ShopPage() {
  const { token, currency, currencySym } = useStore()
  const router = useRouter()
  const [packs, setPacks] = useState(SAMPLE_PACKS)
  const [tab, setTab] = useState<"credits"|"reports">("credits")

  useEffect(() => {
    getPacks().then(data => { if (data?.length) setPacks(data) })
  }, [])

  const getPrice = (p: any) => {
    if (currency === "USD") return `$${p.priceUSD || p.priceINR / 83}`
    if (currency === "GBP") return `£${p.priceGBP || p.priceINR / 103}`
    return `₹${p.priceINR || p.price}`
  }

  const handleBuy = (packId: number) => {
    if (!token) { router.push("/signin"); return }
    alert("Payment integration coming soon — Razorpay for India, Stripe for global")
  }

  const credits = packs.filter(p => !p.type || p.type === "credit")
  const reports = packs.filter(p => p.type === "report")

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Shop</h1>
        <p>Credit packs and premium reports</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {(["credits","reports"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all capitalize"
            style={tab===t ? {background:"var(--maroon)",color:"#fff"} : {background:"var(--bg2)",color:"var(--tx2)",border:"1px solid var(--bd)"}}>
            {t === "credits" ? "💰 Credit Packs" : "📋 Reports"}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {(tab === "credits" ? credits : reports).map(p => (
          <div key={p.id} className="card relative flex flex-col"
            style={p.popular ? {border:"2px solid var(--gold)",boxShadow:"0 0 0 4px rgba(196,146,42,.1)"} : {}}>
            {p.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="badge-gold px-3 py-1 text-xs font-bold">Most Popular</span>
              </div>
            )}
            <div className="card-bd flex flex-col flex-1 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{background: p.popular ? "linear-gradient(135deg,var(--gold),var(--star))" : "var(--bg2)"}}>
                  {p.icon || "⭐"}
                </div>
                <div>
                  <div className="font-cinzel font-bold text-base" style={{color:"var(--maroon)"}}>{p.name}</div>
                  <div className="text-xs mt-0.5" style={{color:"var(--txm)"}}>{p.description}</div>
                  {p.credits > 0 && <div className="text-xs font-semibold mt-1" style={{color:"var(--gold)"}}>{p.credits} credits</div>}
                </div>
              </div>
              <div className="mt-auto">
                <div className="font-cinzel font-black text-3xl mb-1" style={{color:"var(--maroon)"}}>{getPrice(p)}</div>
                <div className="text-xs mb-4" style={{color:"var(--txm)"}}>One-time purchase · No subscription</div>
                <button onClick={() => handleBuy(p.id)} className="btn-primary w-full py-2.5 text-sm font-cinzel"
                  style={p.popular ? {background:"linear-gradient(135deg,var(--gold),var(--star))"} : {}}>
                  Buy now →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* GST note */}
      <p className="text-center text-xs mt-8" style={{color:"var(--txm)"}}>
        Indian users: 18% GST applicable · Global users: local taxes auto-calculated
      </p>
    </div>
  )
}
