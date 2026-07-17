"use client"
import { Star, Shield, Globe, Users } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="page-wrap max-w-4xl">
      <div className="page-header text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5" style={{background:"var(--maroon)"}}>
          <Star className="w-8 h-8 fill-current" style={{color:"var(--star)"}} />
        </div>
        <h1>About VedicHora</h1>
        <p className="text-base mt-2 max-w-lg mx-auto" style={{color:"var(--txm)"}}>
          Bringing the ancient wisdom of Jyotish to the modern world through technology
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        {[
          { icon:<Star className="w-5 h-5" />, title:"Our Mission", text:"To make authentic Vedic astrology accessible to everyone — from free birth charts to live consultations with expert Jyotishis. We combine the precision of Swiss Ephemeris with 16-layer predictive algorithms based on classical texts." },
          { icon:<Shield className="w-5 h-5" />, title:"Our Technology", text:"Built on Swiss Ephemeris with Lahiri ayanamsa for maximum accuracy. Our 16-layer prediction engine (patent pending) analyses Dasha, Gochara, Yogas, Doshas, and domain scores to deliver actionable insights." },
          { icon:<Globe className="w-5 h-5" />, title:"Global Reach", text:"Available in 9 currencies across India, UK, USA, Singapore, Malaysia, UAE, Australia, Canada, and Sri Lanka. Phase 1 languages: English, Tamil, Hindi." },
          { icon:<Users className="w-5 h-5" />, title:"Our Astrologers", text:"Verified Jyotishis trained in Parashara, KP, Nadi, and Jaimini systems. Every astrologer goes through a rigorous certification process before joining our platform." },
        ].map((c,i) => (
          <div key={i} className="card card-bd flex gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:"var(--acc-l)",color:"var(--maroon)"}}>
              {c.icon}
            </div>
            <div>
              <div className="font-cinzel font-bold mb-2" style={{color:"var(--maroon)"}}>{c.title}</div>
              <p className="text-sm leading-relaxed" style={{color:"var(--tx2)"}}>{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card card-bd text-center">
        <div className="font-cinzel font-bold text-lg mb-2" style={{color:"var(--maroon)"}}>Contact Us</div>
        <p className="text-sm mb-1" style={{color:"var(--txm)"}}>support@vedichora.com</p>
        <p className="text-xs" style={{color:"var(--txm)"}}>Registered in India · GST: 29XXXXX1234X1Z5</p>
      </div>
    </div>
  )
}
