'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { calculateChart } from '@/api'
import { to24Hour } from '@/lib/utils'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'
import PlanetTable from '@/components/chart/PlanetTable'
import NorthChart from '@/components/chart/NorthChart'
import { MapPin, User, ChevronRight, Download } from 'lucide-react'

const EMPTY_DATE: DateValue = { dd: 0, mm: 0, yyyy: 0, hr: 8, mi: 30, ap: 'AM' }

export default function ChartPage() {
  const router = useRouter()
  const { token, setHoroId, chartMode } = useStore()
  const [name, setName]   = useState('')
  const [dob, setDob]     = useState<DateValue>(EMPTY_DATE)
  const [place, setPlace] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr]     = useState('')
  const [result, setResult] = useState<any>(null)

  const handleGenerate = async () => {
    if (!dob.dd || !dob.mm || !dob.yyyy) { setErr('Please select Day, Month and Year'); return }
    if (!place.trim()) { setErr('Please enter place of birth'); return }

    if (!token) {
      sessionStorage.setItem('pending_chart', JSON.stringify({ dob, place, name }))
      router.push('/signup')
      return
    }

    setLoading(true); setErr('')
    try {
      const { hour, minute } = dob.unknownTime ? { hour: 12, minute: 0 } : to24Hour(dob.hr || 12, dob.mi || 0, dob.ap || 'AM')
      const res = await calculateChart({
        PersonName: name || 'My Chart',
        Year: dob.yyyy, Month: dob.mm, Day: dob.dd,
        Hour: hour, Minute: minute, Second: 0,
        PlaceName: place,
        UtcOffsetHours: 5.5,
        AyanamsaType: 'Lahiri',
      })
      const data = res.data?.data
      if (data) {
        setResult(data)
        if (data.horoscopeId || data.id) setHoroId(data.horoscopeId || data.id)
      } else {
        setErr(res.data?.message || 'Chart calculation failed')
      }
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Chart calculation failed — check your details')
    } finally {
      setLoading(false)
    }
  }

  const stats = result ? [
    { label: 'Lagna',          value: result.ascendantName || '—' },
    { label: 'Moon Sign',      value: result.moonRasi || result.moonSign || '—' },
    { label: 'Nakshatra',      value: result.nakshatra || result.planets?.find((p:any)=>p.planet==='Moon')?.nakshatraName || '—' },
    { label: 'Current Dasha',  value: result.currentDashaLord || result.vimshottariDasa?.[0]?.planet || '—' },
  ] : []

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="page-header">
        <h1>Birth Chart Calculator</h1>
        <p>Enter birth details to generate your Vedic chart — free</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-hd">
              <User className="w-4 h-4 text-gold" />
              <span className="card-title">Birth Details</span>
            </div>
            <div className="card-bd space-y-5">
              <div>
                <label className="label">Full name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ravi Kumar" />
              </div>

              <div>
                <label className="label">Date &amp; Time of Birth</label>
                <DatePicker value={dob} onChange={setDob} showTime showUnknown />
              </div>

              <div>
                <label className="label"><MapPin className="w-3 h-3 inline mr-1" />Place of birth</label>
                <input className="input" value={place} onChange={e => setPlace(e.target.value)} placeholder="Start typing city..." />
              </div>

              {err && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>}

              {!token && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                  🔒 Sign in to generate your chart — it's free
                </p>
              )}

              <button onClick={handleGenerate} disabled={loading}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-cinzel text-sm">
                {loading ? (
                  <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> Calculating…</>
                ) : (
                  <> Generate chart <ChevronRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-3 space-y-5">
          {result ? (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map(s => (
                  <div key={s.label} className="card p-4 text-center">
                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1.5">{s.label}</div>
                    <div className="font-cinzel font-bold text-maroon text-sm">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Chart + Planet table */}
              <div className="grid md:grid-cols-2 gap-5">
                <div className="card">
                  <div className="card-hd">
                    <span className="card-title">{chartMode === 'north' ? 'North Indian' : 'South Indian'} Chart</span>
                  </div>
                  <div className="card-bd">
                    <NorthChart planets={result.planets || []} />
                  </div>
                </div>

                <div className="card">
                  <div className="card-hd"><span className="card-title">Planet Positions</span></div>
                  <PlanetTable planets={result.planets || []} />
                </div>
              </div>

              {/* Dasha */}
              {result.vimshottariDasa?.length > 0 && (
                <div className="card">
                  <div className="card-hd"><span className="card-title">Vimshottari Dasha</span></div>
                  <div className="card-bd">
                    <div className="grid sm:grid-cols-2 gap-2">
                      {result.vimshottariDasa.slice(0,8).map((d: any, i: number) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-border">
                          <span className="text-sm font-medium text-maroon">{d.planet} MD</span>
                          <span className="text-xs text-gray-400">{d.startYear || d.start || ''}–{d.endYear || d.end || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Download + upgrade */}
              <div className="bg-gradient-to-r from-maroon/5 to-gold/5 border border-gold/20 rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-cinzel font-semibold text-maroon">Save chart + daily predictions</div>
                  <p className="text-xs text-gray-500 mt-0.5">Navamsha D9 · Shadbala · Full Dasha tree · PDF download</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => window.print()}
                    className="btn-ghost text-xs py-2 px-3.5 flex items-center gap-1.5">
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                  {!token && (
                    <button onClick={() => router.push('/signup')} className="btn-primary text-xs py-2 px-4">
                      Sign up free
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card p-10 flex flex-col items-center justify-center text-center gap-4 h-full min-h-64">
              <div className="text-5xl">🌟</div>
              <div className="font-cinzel font-semibold text-maroon">Your chart will appear here</div>
              <p className="text-sm text-gray-400 max-w-xs">Enter your birth details and click Generate chart to see your complete Vedic horoscope</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
