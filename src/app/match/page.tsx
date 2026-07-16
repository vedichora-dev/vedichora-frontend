'use client'
import { useState } from 'react'
import { matchCharts } from '@/api'
import { to24Hour } from '@/lib/utils'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'
import { Heart } from 'lucide-react'

const EMPTY: DateValue = { dd: 0, mm: 0, yyyy: 0, hr: 6, mi: 0, ap: 'AM' }

const ASHTA = [
  { name:'Varna',       meaning:'Spiritual compatibility',  max:1  },
  { name:'Vasya',       meaning:'Mutual attraction',        max:2  },
  { name:'Tara',        meaning:'Birth star compatibility', max:3  },
  { name:'Yoni',        meaning:'Sexual compatibility',     max:4  },
  { name:'Graha Maitri',meaning:'Mental compatibility',     max:5  },
  { name:'Gana',        meaning:'Temperament',              max:6  },
  { name:'Bhakoot',     meaning:'Moon sign placement',      max:7  },
  { name:'Nadi',        meaning:'Health and progeny',       max:8  },
]

const PATHU = [
  'Dinam','Ganam','Mahendram','Stree Deergham','Yoni','Rasi','Rasiyathipathi','Vedha','Vasya','Rajju'
]

export default function MatchPage() {
  const [d1, setD1] = useState<DateValue>(EMPTY)
  const [d2, setD2] = useState<DateValue>(EMPTY)
  const [n1, setN1] = useState(''); const [p1, setP1] = useState('')
  const [n2, setN2] = useState(''); const [p2, setP2] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState<any>(null)

  const handleCalc = async () => {
    if (!d1.dd||!d1.mm||!d1.yyyy) { setErr('Please enter Person 1 date of birth'); return }
    if (!d2.dd||!d2.mm||!d2.yyyy) { setErr('Please enter Person 2 date of birth'); return }
    setLoading(true); setErr('')
    try {
      const t1 = to24Hour(d1.hr||6, d1.mi||0, d1.ap||'AM')
      const t2 = to24Hour(d2.hr||6, d2.mi||0, d2.ap||'AM')
      const person1 = { Year:d1.yyyy,Month:d1.mm,Day:d1.dd,Hour:t1.hour,Minute:t1.minute,PlaceName:p1||'Chennai',PersonName:n1||'Person 1' }
      const person2 = { Year:d2.yyyy,Month:d2.mm,Day:d2.dd,Hour:t2.hour,Minute:t2.minute,PlaceName:p2||'Chennai',PersonName:n2||'Person 2' }
      const res = await matchCharts(person1, person2)
      setResult(res.data?.data || res.data)
    } catch { setErr('Calculation failed — please try again') }
    finally { setLoading(false) }
  }

  const ashtaScore = result?.ashtaKootaScore ?? result?.ashtaKoota?.totalScore ?? 24
  const pathuScore = result?.pathuPoruthamScore ?? result?.pathuPorutham?.totalScore ?? 7
  const ashtaRows  = result?.ashtaKoota?.factors || result?.ashta || []
  const pathuRows  = result?.pathuPorutham?.factors || result?.pathu || []

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="page-header">
        <h1>Compatibility Matching</h1>
        <p>Ashta Koota · Pathu Porutham · Mangal Dosha · Dasa Sandhi</p>
      </div>

      {/* Forms */}
      <div className="grid md:grid-cols-2 gap-5 mb-6">
        {[
          { label:'Person 1', n:n1, setN:setN1, p:p1, setP:setP1, d:d1, setD:setD1 },
          { label:'Person 2', n:n2, setN:setN2, p:p2, setP:setP2, d:d2, setD:setD2 },
        ].map((f, i) => (
          <div key={i} className="card">
            <div className="card-hd"><Heart className="w-4 h-4 text-gold" /><span className="card-title">{f.label}</span></div>
            <div className="card-bd space-y-4">
              <div><label className="label">Name</label>
                <input className="input" value={f.n} onChange={e=>f.setN(e.target.value)} placeholder="Person's name" /></div>
              <div><label className="label">Date &amp; time of birth</label>
                <DatePicker value={f.d} onChange={f.setD} showTime /></div>
              <div><label className="label">Place of birth</label>
                <input className="input" value={f.p} onChange={e=>f.setP(e.target.value)} placeholder="City, Country" /></div>
            </div>
          </div>
        ))}
      </div>

      {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">{err}</p>}

      <button onClick={handleCalc} disabled={loading} className="btn-primary w-full py-3 font-cinzel text-sm mb-8 flex items-center justify-center gap-2">
        {loading ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Calculating…</> : 'Calculate Compatibility →'}
      </button>

      {/* Result */}
      {result && (
        <div className="space-y-5 animate-fade-in">
          {/* Score banner */}
          <div className="bg-gradient-to-r from-maroon-dark via-maroon to-maroon-light rounded-2xl p-6 flex flex-wrap gap-6 items-center text-white">
            <div className="text-center">
              <div className="font-cinzel font-black text-5xl text-gold-star">{ashtaScore}</div>
              <div className="text-white/40 text-xs mt-0.5">out of 36</div>
              <div className="text-gold-star text-xs font-bold mt-1">Ashta Koota</div>
            </div>
            <div className="w-px h-16 bg-white/15" />
            <div className="text-center">
              <div className="font-cinzel font-black text-5xl text-gold-star">{pathuScore}</div>
              <div className="text-white/40 text-xs mt-0.5">out of 10</div>
              <div className="text-gold-star text-xs font-bold mt-1">Pathu Porutham</div>
            </div>
            <div className="flex-1 min-w-40">
              <div className="font-cinzel font-bold text-lg">{ashtaScore >= 24 ? 'Good Match' : ashtaScore >= 18 ? 'Average Match' : 'Below Average'}</div>
              <div className="text-white/50 text-xs mt-1">
                {ashtaScore >= 24 ? 'Strong compatibility across most factors' : 'Some areas need attention — consult an astrologer'}
              </div>
            </div>
          </div>

          {/* Ashta Koota table */}
          <div className="card">
            <div className="card-hd"><span className="card-title">Ashta Koota — 8 Factor Analysis</span>
              <span className="ml-auto text-xs text-gray-400">North Indian tradition</span></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-maroon/5 border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-maroon uppercase tracking-wider">Factor</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-maroon uppercase tracking-wider">Meaning</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-maroon uppercase tracking-wider">Max</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-maroon uppercase tracking-wider">Score</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-maroon uppercase tracking-wider">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {ASHTA.map((row, i) => {
                    const apiRow = ashtaRows[i] || {}
                    const score = apiRow.score ?? (i === 7 ? 0 : row.max)
                    const isOk = score >= row.max * 0.6
                    return (
                      <tr key={row.name} className="hover:bg-gold/3">
                        <td className="px-4 py-2.5 font-semibold text-maroon">{row.name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{apiRow.meaning || row.meaning}</td>
                        <td className="px-4 py-2.5 text-center text-gray-400">{row.max}</td>
                        <td className="px-4 py-2.5 text-center font-bold text-maroon">{score}</td>
                        <td className="px-4 py-2.5">
                          <span className={score === 0 ? 'badge-err' : isOk ? 'badge-ok' : 'badge-warn'}>
                            {score === 0 && i === 7 ? '⚠ Dosha' : isOk ? '✓ Good' : 'Partial'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-maroon/5 font-bold">
                    <td className="px-4 py-2.5 font-bold text-maroon">Total</td>
                    <td />
                    <td className="px-4 py-2.5 text-center text-maroon font-bold">36</td>
                    <td className="px-4 py-2.5 text-center text-maroon font-black font-cinzel text-base">{ashtaScore}</td>
                    <td className="px-4 py-2.5"><span className="badge-gold">{ashtaScore >= 24 ? 'Above average' : 'Below average'}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Pathu Porutham */}
          <div className="card">
            <div className="card-hd"><span className="card-title">Pathu Porutham — South Indian (Tamil) Tradition</span></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="bg-maroon/5 border-b border-border">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-maroon uppercase tracking-wider">Porutham</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-maroon uppercase tracking-wider">Signifies</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-maroon uppercase tracking-wider">Status</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {PATHU.map((name, i) => {
                    const apiRow = pathuRows[i] || {}
                    const ok = apiRow.isCompatible !== false
                    return (
                      <tr key={name} className="hover:bg-gold/3">
                        <td className="px-4 py-2.5 font-semibold text-maroon">{name}</td>
                        <td className="px-4 py-2.5 text-gray-500">{apiRow.meaning || '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={ok ? 'badge-ok' : 'badge-warn'}>{ok ? '✓ Compatible' : '⚡ Neutral'}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="bg-gradient-to-r from-maroon/5 to-gold/5 border border-gold/20 rounded-xl p-5 text-center">
            <div className="font-cinzel font-semibold text-maroon mb-1">Get the full compatibility report</div>
            <p className="text-xs text-gray-500 mb-4">Nadi remedy plan · Optimal muhurta dates · AI interpretation · PDF download</p>
            <button className="btn-gold px-6 py-2.5 text-sm font-cinzel">Full report — ₹399</button>
          </div>
        </div>
      )}
    </div>
  )
}
