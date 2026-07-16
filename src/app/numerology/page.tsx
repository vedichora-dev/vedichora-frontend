'use client'
import { useState } from 'react'
import { calcNumerology } from '@/api'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'

const NUMS = [
  { key:'lifePathNumber',    label:'Life Path',       desc:'Your core life purpose',     large:true },
  { key:'destinyNumber',     label:'Destiny',         desc:'The path you must walk'              },
  { key:'soulUrgeNumber',    label:'Soul Urge',       desc:"Your heart's inner desire"           },
  { key:'personalityNumber', label:'Personality',     desc:'How others perceive you'             },
  { key:'nameNumber',        label:'Name Number',     desc:'Vibration of your name'              },
  { key:'birthdayNumber',    label:'Birthday Number', desc:'Gift you bring to this life'         },
  { key:'personalYear',      label:`Personal Year ${new Date().getFullYear()}`, desc:'Your theme for this year' },
  { key:'maturityNumber',    label:'Maturity Number', desc:'Emerges after age 35'               },
]

const MEANINGS: Record<number,string> = {
  1:'Independent, leader, pioneer', 2:'Cooperative, diplomatic, sensitive',
  3:'Creative, expressive, social', 4:'Practical, disciplined, builder',
  5:'Freedom-loving, adventurer',   6:'Nurturing, responsible, harmonious',
  7:'Analytical, spiritual',        8:'Ambitious, powerful, successful',
  9:'Humanitarian, compassionate',  11:'Master: intuitive visionary',
  22:'Master builder',              33:'Master teacher',
}

export default function NumerologyPage() {
  const [name, setName] = useState('')
  const [dob, setDob] = useState<DateValue>({ dd:0, mm:0, yyyy:0 })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const handleCalc = async () => {
    if (!name.trim()) { setErr('Please enter your full name'); return }
    if (!dob.dd || !dob.mm || !dob.yyyy) { setErr('Please select date of birth'); return }
    setLoading(true); setErr('')
    try {
      const res = await calcNumerology(name, dob.dd, dob.mm, dob.yyyy)
      setResult(res.data?.data || res.data)
    } catch { setErr('Calculation failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="page-header">
        <h1>Numerology</h1>
        <p>Vedic numerology — life path, destiny, and name numbers</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card">
          <div className="card-hd"><span className="card-title">Calculate Your Numbers</span></div>
          <div className="card-bd space-y-5">
            <div>
              <label className="label">Full name (as given at birth)</label>
              <input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full birth name" />
            </div>
            <div>
              <label className="label">Date of birth</label>
              <DatePicker value={dob} onChange={setDob} showTime={false} />
            </div>
            {err && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}
            <button onClick={handleCalc} disabled={loading} className="btn-primary w-full py-2.5 font-cinzel text-sm">
              {loading ? 'Calculating…' : 'Calculate →'}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="card">
          <div className="card-hd"><span className="card-title">Your Numbers</span></div>
          <div className="card-bd">
            {result ? (
              <div className="space-y-3">
                {/* Life Path — large */}
                <div className="bg-gradient-to-r from-maroon to-maroon-light rounded-xl p-4 text-center mb-4">
                  <div className="text-xs text-white/50 uppercase tracking-widest mb-1">Life Path Number</div>
                  <div className="font-cinzel font-black text-6xl text-gold-star">{result.lifePathNumber || '—'}</div>
                  <div className="text-white/60 text-xs mt-1">{MEANINGS[result.lifePathNumber] || 'Your core life purpose'}</div>
                </div>
                {/* Other numbers */}
                <div className="grid grid-cols-2 gap-3">
                  {NUMS.slice(1).map(n => {
                    const val = result[n.key]
                    return (
                      <div key={n.key} className="bg-gray-50 rounded-lg p-3 border border-border">
                        <div className="text-xs text-gray-400 mb-0.5">{n.label}</div>
                        <div className="font-cinzel font-bold text-2xl text-maroon">{val || '—'}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{n.desc}</div>
                        {val && MEANINGS[val] && <div className="text-xs text-gold mt-1 italic">{MEANINGS[val]}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-300">
                <div className="text-5xl mb-3">🔢</div>
                <div className="text-sm text-gray-400">Your numbers will appear here</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
