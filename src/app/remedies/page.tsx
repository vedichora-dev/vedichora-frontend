"use client"
const GEMS = [
  { planet:"Sun",     gem:"Ruby (Manik)",            color:"#DC2626", effect:"Leadership, health, confidence" },
  { planet:"Moon",    gem:"Pearl (Moti)",             color:"#6B7280", effect:"Mind, emotions, mother" },
  { planet:"Mars",    gem:"Red Coral (Moonga)",       color:"#EA580C", effect:"Courage, energy, siblings" },
  { planet:"Mercury", gem:"Emerald (Panna)",          color:"#16A34A", effect:"Intelligence, speech, business" },
  { planet:"Jupiter", gem:"Yellow Sapphire (Pukhraj)",color:"#CA8A04", effect:"Wisdom, marriage, wealth" },
  { planet:"Venus",   gem:"Diamond (Heera)",          color:"#7C3AED", effect:"Love, arts, luxury" },
  { planet:"Saturn",  gem:"Blue Sapphire (Neelam)",   color:"#1D4ED8", effect:"Discipline, karma, longevity" },
  { planet:"Rahu",    gem:"Hessonite (Gomedha)",      color:"#92400E", effect:"Ambition, material gains" },
  { planet:"Ketu",    gem:"Cat's Eye (Lehsuniya)",    color:"#6B7280", effect:"Spiritual growth, past karma" },
]

const MANTRAS = [
  { planet:"Sun",     day:"Sundays",   mantra:"ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः",    count:"7,000 times" },
  { planet:"Moon",    day:"Mondays",   mantra:"ॐ श्रां श्रीं श्रौं सः चन्द्रमसे नमः",  count:"11,000 times" },
  { planet:"Jupiter", day:"Thursdays", mantra:"ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः",      count:"19,000 times" },
]

export default function RemediesPage() {
  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Remedies</h1>
        <p>Classical Vedic remedies — gemstones, mantras, and practices</p>
      </div>

      <h2 className="font-cinzel font-bold text-lg mb-4" style={{color:"var(--maroon)"}}>Navagraha Gemstones</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {GEMS.map(g => (
          <div key={g.planet} className="card card-bd flex gap-3 items-start">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold"
              style={{background:g.color}}>{g.planet[0]}</div>
            <div>
              <div className="font-semibold text-sm" style={{color:"var(--maroon)"}}>{g.gem}</div>
              <div className="text-xs font-semibold mb-1" style={{color:"var(--gold)"}}>For {g.planet}</div>
              <div className="text-xs" style={{color:"var(--tx2)"}}>{g.effect}</div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-cinzel font-bold text-lg mb-4" style={{color:"var(--maroon)"}}>Navagraha Mantras</h2>
      <div className="space-y-4 mb-10">
        {MANTRAS.map(m => (
          <div key={m.planet} className="card card-bd">
            <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"var(--txm)"}}>{m.planet} · {m.day}</div>
            <div className="text-xl font-serif mb-2" style={{color:"var(--gold)",letterSpacing:".05em"}}>{m.mantra}</div>
            <div className="text-xs" style={{color:"var(--txm)"}}>Chant {m.count} for full benefit</div>
          </div>
        ))}
      </div>

      <div className="card card-bd text-center">
        <div className="font-cinzel font-bold mb-2" style={{color:"var(--maroon)"}}>Your personalised remedy plan</div>
        <p className="text-sm mb-4" style={{color:"var(--txm)"}}>Sign in to see remedies specific to your weak planets, active doshas, and current dasha period</p>
        <a href="/signin" className="btn-primary px-6 py-2.5 text-sm font-cinzel inline-block">Sign in for personalised remedies</a>
      </div>
    </div>
  )
}
