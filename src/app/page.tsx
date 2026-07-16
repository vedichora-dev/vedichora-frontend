'use client'
import { useState, useEffect } from 'react'
import ZodiacStrip from '@/components/layout/ZodiacStrip'
import { RASI } from '@/lib/constants'
import { getRasiHoroscope } from '@/api'
import { scoreColor, scoreDot } from '@/lib/utils'

const DOMAINS = ['Love','Career','Health','Finance']

export default function HomePage() {
  const [sel, setSel] = useState(0)
  const [horoscope, setHoroscope] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getRasiHoroscope(sel).then(data => {
      setHoroscope(data)
      setLoading(false)
    })
  }, [sel])

  const rasi = RASI[sel]
  const score = horoscope?.overallScore || horoscope?.score || 72
  const prediction = horoscope?.prediction || horoscope?.summary || `${rasi.vd} is under the influence of ${rasi.lord}. This is a period for reflection and action. Focus on your core strengths and trust the cosmic guidance of your ruling planet.`
  const domainScores = horoscope?.domainScores || { Love:68, Career:82, Health:71, Finance:65 }

  return (
    <div>
      <ZodiacStrip selected={sel} onSelect={setSel} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Sign hero */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-cinzel font-bold text-2xl text-maroon">{rasi.vd}</h2>
                  <div className="text-xs text-gray-400 mt-0.5">{rasi.dates}</div>
                  <div className="text-xs text-gray-500 mt-1">🔥 {rasi.element} · Ruled by {rasi.lord}</div>
                </div>
                {/* Score gauge */}
                <div className="text-center">
                  <div className={`font-cinzel font-black text-3xl ${scoreColor(score)}`}>{score}</div>
                  <div className="text-xs text-gray-400">TODAY</div>
                </div>
              </div>

              {/* Domain bars */}
              <div className="space-y-2.5">
                {DOMAINS.map(d => {
                  const s = domainScores[d] || domainScores[d.toLowerCase()] || 65
                  return (
                    <div key={d}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{d}</span>
                        <span className="font-semibold text-maroon">{s}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-gold to-gold-star rounded-full transition-all duration-700"
                          style={{ width: `${s}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Lucky */}
              <div className="mt-4 pt-4 border-t border-border flex gap-3 text-xs text-gray-400">
                <span>Lucky colour: <strong className="text-maroon">{rasi.lucky[0]}</strong></span>
                <span>·</span>
                <span>Number: <strong className="text-maroon">{rasi.lucky[1]}</strong></span>
              </div>
            </div>
          </div>

          {/* Prediction */}
          <div className="lg:col-span-3 space-y-4">
            <div className="card">
              <div className="card-hd">
                <span className="card-title">Daily Horoscope · {rasi.vd}</span>
                <div className="flex gap-1 ml-auto">
                  {['Daily','Weekly','Monthly'].map(p => (
                    <button key={p} className="text-xs px-2.5 py-1 rounded-md border border-border hover:border-gold hover:text-maroon transition-colors text-gray-400">{p}</button>
                  ))}
                </div>
              </div>
              <div className="card-bd">
                {loading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-4/5" />
                    <div className="h-4 bg-gray-100 rounded w-3/5" />
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed border-l-4 border-gold pl-4 italic">{prediction}</p>
                )}

                <div className="grid grid-cols-2 gap-3 mt-5">
                  {DOMAINS.map(d => {
                    const s = domainScores[d] || domainScores[d.toLowerCase()] || 65
                    return (
                      <div key={d} className="bg-gray-50 rounded-xl p-3.5 border border-border">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-gray-600">{d}</span>
                          <span className={`text-lg font-black font-cinzel ${scoreColor(s)}`}>{s}</span>
                        </div>
                        <div className="h-1 bg-gray-200 rounded-full">
                          <div className={`h-full rounded-full ${s>=75?'bg-emerald-500':s>=55?'bg-amber-400':'bg-red-400'}`}
                            style={{ width:`${s}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
