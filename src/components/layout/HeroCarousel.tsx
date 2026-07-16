'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

const SLIDES = [
  {
    bg: 'from-[#1A0808] via-[#3A1010] to-[#1A0808]',
    icon: '🔮',
    title: 'Talk to an Astrologer',
    highlight: 'First 10 min FREE',
    sub: '24 online · Chat · Call · Video',
    cta1: { label: 'Consult Now', href: '/consult' },
    cta2: { label: 'Free Kundali', href: '/chart' },
  },
  {
    bg: 'from-[#080A1A] via-[#101840] to-[#080A1A]',
    icon: '💑',
    title: 'Kundali Matching',
    highlight: 'Ashta Koota + Pathu Porutham',
    sub: 'Mangal Dosha · Nadi Dosha · Best muhurta dates',
    cta1: { label: 'Check Matching', href: '/match' },
    cta2: { label: 'Full Report ₹399', href: '/shop' },
  },
  {
    bg: 'from-[#080A08] via-[#0D2010] to-[#080A08]',
    icon: '⭐',
    title: 'Free Vedic Horoscope',
    highlight: 'All 12 Rasis',
    sub: 'Daily · Weekly · Monthly · Yearly predictions',
    cta1: { label: 'View Horoscope', href: '/' },
    cta2: { label: 'My Kundali', href: '/chart' },
  },
  {
    bg: 'from-[#0A080A] via-[#1A0A28] to-[#0A080A]',
    icon: '📜',
    title: 'Free Kundali Report',
    highlight: 'North & South Indian Charts',
    sub: 'Lagna · Navamsha · 9 planets · Dashas · Yogas',
    cta1: { label: 'Generate Free', href: '/chart' },
    cta2: { label: 'Full PDF ₹299', href: '/shop' },
  },
]

export default function HeroCarousel() {
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => setIdx(i => (i + 1) % SLIDES.length), [])

  useEffect(() => {
    if (dismissed || paused) return
    const t = setInterval(next, 4000)
    return () => clearInterval(t)
  }, [dismissed, paused, next])

  useEffect(() => {
    if (localStorage.getItem('vh-hero-dismissed')) setDismissed(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem('vh-hero-dismissed', '1')
    setDismissed(true)
  }

  if (dismissed) return null

  const s = SLIDES[idx]

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-r ${s.bg} border-b-2 border-gold/60 transition-all duration-500`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center gap-4 flex-wrap">
        {/* Icon */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-star flex items-center justify-center text-xl shrink-0 shadow-lg">
          {s.icon}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="font-cinzel font-bold text-white text-sm md:text-base tracking-wide">
            {s.title} · <span className="text-gold-star">{s.highlight}</span>
          </div>
          <div className="text-xs text-white/50 flex items-center gap-2 mt-0.5">
            {idx === 0 && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />}
            {s.sub}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => router.push(s.cta1.href)}
            className="bg-gradient-to-r from-gold to-gold-light text-white text-xs font-bold px-4 py-2 rounded-lg font-cinzel tracking-wide hover:opacity-90 transition-opacity whitespace-nowrap">
            {s.cta1.label}
          </button>
          <button onClick={() => router.push(s.cta2.href)}
            className="bg-white/10 text-white/80 border border-white/20 text-xs px-4 py-2 rounded-lg hover:bg-white/15 transition whitespace-nowrap">
            {s.cta2.label}
          </button>
        </div>

        {/* Dots + close */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-gold-star w-4' : 'bg-white/25 w-1.5'}`} />
            ))}
          </div>
          <button onClick={dismiss} className="text-white/25 hover:text-white/60 transition-colors ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
