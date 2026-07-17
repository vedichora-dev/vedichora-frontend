"use client"
import { useState } from "react"
import { BookOpen, Clock } from "lucide-react"

const ARTICLES = [
  { id:1, cat:"basics",        title:"What is Lagna? Your rising sign and why it matters more than Sun sign",       mins:6,  level:"Beginner",     icon:"🌅" },
  { id:2, cat:"planets",       title:"Vimshottari Dasha — the planetary period system that times life events",       mins:10, level:"Intermediate",  icon:"🪐" },
  { id:3, cat:"transits",      title:"Saturn transit through Pisces — what it means for each rasi in 2025–2027",    mins:8,  level:"Current",       icon:"🪐" },
  { id:4, cat:"compatibility", title:"Ashta Koota — the 8 factors of Vedic marriage compatibility explained",       mins:12, level:"Intermediate",  icon:"💑" },
  { id:5, cat:"basics",        title:"Mangal Dosha — myths, facts, and the cancellation conditions",                mins:7,  level:"Beginner",      icon:"♂️" },
  { id:6, cat:"transits",      title:"Sade Sati — Saturn 7.5 year transit and how to navigate it",                  mins:9,  level:"All levels",    icon:"⏳" },
  { id:7, cat:"planets",       title:"Navagraha — the 9 planets of Vedic astrology and what they signify",          mins:15, level:"Beginner",      icon:"✨" },
  { id:8, cat:"remedies",      title:"How to choose the right gemstone — the classical Jyotish approach",            mins:11, level:"Intermediate",  icon:"💎" },
  { id:9, cat:"compatibility", title:"Nadi Dosha — the most important factor in Koota matching",                    mins:8,  level:"Advanced",      icon:"🧬" },
]

const CATS = [
  { key:"all",          label:"All" },
  { key:"basics",       label:"Vedic Basics" },
  { key:"planets",      label:"Planets & Houses" },
  { key:"transits",     label:"Transits" },
  { key:"compatibility",label:"Compatibility" },
  { key:"remedies",     label:"Remedies" },
]

const CAT_COLORS: Record<string,string> = {
  basics:"#7A4A1A", planets:"#1A5A8A", transits:"#1A6A2A", compatibility:"#8B2252", remedies:"#4A2878"
}

export default function LearnPage() {
  const [cat, setCat] = useState("all")
  const filtered = cat === "all" ? ARTICLES : ARTICLES.filter(a => a.cat === cat)

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Learn Astrology</h1>
        <p>Guides, articles, and lessons from classical Vedic texts</p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATS.map(c => (
          <button key={c.key} onClick={() => setCat(c.key)}
            className="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={cat===c.key
              ? {background:"var(--maroon)",color:"#fff"}
              : {background:"var(--bg2)",color:"var(--tx2)",border:"1px solid var(--bd)"}}>
            {c.label}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(a => (
          <div key={a.id} className="card cursor-pointer hover:shadow-lg transition-all"
            onClick={() => alert("Full article coming soon")}>
            <div className="h-28 rounded-t-xl flex items-center justify-center text-4xl"
              style={{background:`linear-gradient(135deg,${CAT_COLORS[a.cat]||"var(--maroon)"},${CAT_COLORS[a.cat]||"var(--maroon)"}99)`}}>
              {a.icon}
            </div>
            <div className="card-bd">
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"var(--gold)"}}>
                {CATS.find(c=>c.key===a.cat)?.label}
              </div>
              <div className="font-semibold text-sm leading-snug mb-3" style={{color:"var(--tx)"}}>{a.title}</div>
              <div className="flex items-center gap-3 text-xs" style={{color:"var(--txm)"}}>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {a.mins} min read</span>
                <span className="badge-gold">{a.level}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
