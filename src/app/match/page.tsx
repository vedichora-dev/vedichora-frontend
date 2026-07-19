'use client'
import { useState, useEffect } from 'react'
import { calculateChart, calculateChartGuest, listCharts } from '@/api'
import { useStore } from '@/store'
import { to24Hour } from '@/lib/utils'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'
import CityAutocomplete from '@/components/ui/CityAutocomplete'
import { Heart, ChevronRight, RefreshCw, Star } from 'lucide-react'

const EMPTY: DateValue = { dd: 0, mm: 0, yyyy: 0 }

// ── Geocode helper ────────────────────────────────────────────
async function geocode(place: string): Promise<{lat:number,lng:number}|null> {
  try {
    const r = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(place)}&limit=1&lang=en`).then(r => r.json())
    const f = r?.features?.[0]
    return f ? { lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] } : null
  } catch { return null }
}

function buildPayload(n: string, d: DateValue, p: string, lat?: number, lng?: number, g?: string) {
  const tm = d.unknownTime ? { hour: 12, minute: 0 } : to24Hour(d.hr || 12, d.mi || 0, d.ap || 'AM')
  return {
    PersonName: n || g || 'Person',
    Year: d.yyyy, Month: d.mm, Day: d.dd,
    Hour: tm.hour, Minute: tm.minute, Second: 0,
    PlaceName: p || 'Chennai, India',
    Latitude: lat, Longitude: lng,
    UtcOffsetHours: 5.5, AyanamsaType: 'Lahiri',
    Gender: g,
  }
}

// ── PersonCard: defined at MODULE level so it never remounts on parent re-render ──
interface PersonCardProps {
  num: number
  gender: 'Male'|'Female'; setGender: (g: 'Male'|'Female') => void
  name: string; setName: (n: string) => void
  dob: DateValue; setDob: (d: DateValue) => void
  place: string; setPlace: (p: string) => void
  setLat: (lat: number|undefined) => void; setLng: (lng: number|undefined) => void
  saved: any[]; token: string|null
  useSaved: boolean; setUseSaved: (b: boolean) => void
  selId: string; setSelId: (id: string) => void
}

function PersonCard({ num, gender, setGender, name, setName, dob, setDob,
  place, setPlace, setLat, setLng, saved, token, useSaved, setUseSaved, selId, setSelId }: PersonCardProps) {
  return (
    <div className="card" style={{ padding: '20px' }}>
      {/* Header: person name + M/F toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Heart style={{ width: '14px', height: '14px', color: num === 1 ? '#F87171' : '#F472B6', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '14px', color: 'var(--acc)' }}>Person {num}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {(['Male', 'Female'] as const).map(g => (
            <button key={g} onClick={() => setGender(g)}
              style={{ padding: '3px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: 700, fontFamily: 'inherit',
                background: gender === g ? 'var(--acc)' : 'var(--bg2)',
                color: gender === g ? '#fff' : 'var(--txm)' }}>
              {g === 'Male' ? '♂ Male' : '♀ Female'}
            </button>
          ))}
        </div>
      </div>

      {/* Saved chart selector */}
      {token && saved.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            {['Enter Details', 'Saved Chart'].map((lbl, i) => (
              <button key={lbl} onClick={() => setUseSaved(i === 1)}
                style={{ flex: 1, padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 600, fontFamily: 'inherit',
                  background: (useSaved ? i === 1 : i === 0) ? 'var(--acc)' : 'var(--bg2)',
                  color: (useSaved ? i === 1 : i === 0) ? '#fff' : 'var(--txm)' }}>
                {lbl}
              </button>
            ))}
          </div>
          {useSaved && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
              {saved.map((c: any) => {
                const id = c.horoscopeId || c.HoroscopeId
                const nm = c.personName || c.PersonName || 'Chart'
                const lg = c.ascendantName || c.AscendantName || ''
                const sel = id === selId
                return (
                  <button key={id} onClick={() => setSelId(id)}
                    style={{ padding: '8px 10px', borderRadius: '8px', textAlign: 'left',
                      border: `1.5px solid ${sel ? 'var(--gold)' : 'var(--bd)'}`,
                      background: sel ? 'rgba(196,146,42,.08)' : 'var(--bg2)',
                      cursor: 'pointer', fontSize: '11px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--acc)', fontFamily: 'Cinzel,serif' }}>{nm}</span>
                    <span style={{ color: 'var(--txm)', marginLeft: '6px' }}>{lg}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Manual entry */}
      {(!useSaved || !token) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Row 1: Name */}
          <div>
            <label className="label">Full Name (optional)</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder={`${gender} name`} />
          </div>
          {/* Row 2: Date + Time inline */}
          <div>
            <label className="label">Date & Time of Birth</label>
            <DatePicker value={dob} onChange={setDob} showTime showUnknown prefix={`m${num}`} />
          </div>
          {/* Row 3: Place */}
          <div>
            <label className="label">Place of Birth</label>
            <CityAutocomplete
              value={place}
              onChange={(city: string, la?: number, ln?: number) => {
                setPlace(city)
                setLat(la)
                setLng(ln)
              }}
              placeholder="City, Country"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function MatchPage() {
  const { token } = useStore()
  const [saved, setSaved] = useState<any[]>([])

  const [n1, setN1] = useState(''); const [d1, setD1] = useState<DateValue>(EMPTY)
  const [p1, setP1] = useState(''); const [lat1, setLat1] = useState<number|undefined>(); const [lng1, setLng1] = useState<number|undefined>()
  const [g1, setG1] = useState<'Male'|'Female'>('Male')
  const [useSaved1, setUseSaved1] = useState(false); const [selId1, setSelId1] = useState('')

  const [n2, setN2] = useState(''); const [d2, setD2] = useState<DateValue>(EMPTY)
  const [p2, setP2] = useState(''); const [lat2, setLat2] = useState<number|undefined>(); const [lng2, setLng2] = useState<number|undefined>()
  const [g2, setG2] = useState<'Male'|'Female'>('Female')
  const [useSaved2, setUseSaved2] = useState(false); const [selId2, setSelId2] = useState('')

  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [tested, setTested] = useState(0)

  useEffect(() => {
    if (!token) return
    listCharts().then((res: any) => {
      const list = Array.isArray(res) ? res : (res?.data?.data ?? res?.data ?? [])
      setSaved(list)
    }).catch(() => {})
  }, [token])

  const calcChart = async (n: string, d: DateValue, p: string, lat?: number, lng?: number, g?: string, savedId?: string, savedChart?: any) => {
    if (savedId && savedChart) return { chart: savedChart, id: savedId }
    if (!d.dd || !d.mm || !d.yyyy) throw new Error('Date of birth required')
    if (!p.trim()) throw new Error('Place of birth required')
    let rlat = lat, rlng = lng
    if (!rlat) { const gc = await geocode(p); if (gc) { rlat = gc.lat; rlng = gc.lng } }
    const fn = token ? calculateChart : calculateChartGuest
    const r = await fn(buildPayload(n, d, p, rlat, rlng, g))
    const chart = r?.data?.data ?? r?.data
    if (!chart) throw new Error('Chart calculation failed')
    return { chart, id: chart.horoscopeId || chart.id || '' }
  }

  const handle = async () => {
    setLoading(true); setErr(''); setResult(null)
    try {
      // Calculate both charts
      const s1 = useSaved1 ? saved.find(c => (c.horoscopeId || c.HoroscopeId) === selId1) : null
      const s2 = useSaved2 ? saved.find(c => (c.horoscopeId || c.HoroscopeId) === selId2) : null

      const [r1, r2] = await Promise.all([
        calcChart(n1, d1, p1, lat1, lng1, g1, useSaved1 ? selId1 : undefined, s1).catch(e => { throw new Error('Person 1: ' + e.message) }),
        calcChart(n2, d2, p2, lat2, lng2, g2, useSaved2 ? selId2 : undefined, s2).catch(e => { throw new Error('Person 2: ' + e.message) }),
      ])

      const id1 = r1.id, id2 = r2.id
      if (!id1 || !id2) throw new Error('Could not get chart IDs')

      // Call match API with IDs
      const CHART_URL = process.env.NEXT_PUBLIC_CHART_URL || 'https://enchanting-dedication-production.up.railway.app'
      const mHeaders: Record<string,string> = { 'Content-Type': 'application/json' }
      if (token) mHeaders['Authorization'] = `Bearer ${token}`

      // Try /api/chart/match with horoscopeId pair first
      let mdata: any = null
      const mres = await fetch(`${CHART_URL}/api/chart/match`, {
        method: 'POST', headers: mHeaders,
        body: JSON.stringify({ Person1: id1, Person2: id2 })
      }).then(r => r.json()).catch(() => null)

      mdata = mres?.data?.data ?? mres?.data ?? mres

      // Fallback: /api/compat/score
      if (!mdata || mdata?.status === 400 || mdata?.statusCode === 400) {
        const mres2 = await fetch(`${CHART_URL}/api/compat/score`, {
          method: 'POST', headers: mHeaders,
          body: JSON.stringify({ Person1: id1, Person2: id2 })
        }).then(r => r.json()).catch(() => null)
        mdata = mres2?.data?.data ?? mres2?.data ?? mres2
      }

      if (!mdata) throw new Error('Compatibility calculation failed')

      const nm1 = n1 || r1.chart?.personName || r1.chart?.PersonName || g1
      const nm2 = n2 || r2.chart?.personName || r2.chart?.PersonName || g2
      setResult({ ...mdata, name1: nm1, name2: nm2, chart1: r1.chart, chart2: r2.chart })
      setTested(t => t + 1)
    } catch(e: any) {
      setErr(e?.message || 'Calculation failed — please try again')
    }
    setLoading(false)
  }

  const score  = result?.ashtaKootaScore  ?? result?.AshtaKootaScore  ?? 0
  const total  = result?.ashtaKootaTotal  ?? result?.AshtaKootaTotal  ?? 36
  const pScore = result?.pathuPoruthamScore ?? result?.PathuPoruthamScore ?? 0
  const pTotal = result?.pathuPoruthamTotal ?? result?.PathuPoruthamTotal ?? 10
  const mangal = result?.mangalDosha ?? result?.MangalDosha
  const kuta   = result?.kootaDetails || result?.KootaDetails || []
  const pct    = total > 0 ? Math.round((score / total) * 100) : 0
  const scoreColor = pct >= 70 ? '#16A34A' : pct >= 50 ? '#B45309' : '#DC2626'

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '22px', color: 'var(--acc)' }}>
          Compatibility Matching
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--txm)', marginTop: '4px' }}>
          Ashta Koota · Pathu Porutham · Mangal Dosha · Traditional Vedic Matching
        </p>
        {!token && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--warn,#9C6B14)',
            background: 'rgba(156,107,20,.07)', padding: '8px 12px', borderRadius: '8px', display: 'inline-block' }}>
            🔒 Guest mode — <a href="/signin" style={{ color: 'var(--acc)', fontWeight: 600 }}>Sign in</a> to use saved charts & full match report.
          </div>
        )}
      </div>

      {/* Two person forms side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}
        className="match-grid">
        <PersonCard num={1} gender={g1} setGender={setG1}
          name={n1} setName={setN1} dob={d1} setDob={setD1}
          place={p1} setPlace={setP1} setLat={setLat1} setLng={setLng1}
          saved={saved} token={token}
          useSaved={useSaved1} setUseSaved={setUseSaved1}
          selId={selId1} setSelId={setSelId1} />
        <PersonCard num={2} gender={g2} setGender={setG2}
          name={n2} setName={setN2} dob={d2} setDob={setD2}
          place={p2} setPlace={setP2} setLat={setLat2} setLng={setLng2}
          saved={saved} token={token}
          useSaved={useSaved2} setUseSaved={setUseSaved2}
          selId={selId2} setSelId={setSelId2} />
      </div>

      {err && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px',
          background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)',
          fontSize: '13px', color: '#DC2626' }}>{err}</div>
      )}

      <button onClick={handle} disabled={loading}
        className="btn-primary"
        style={{ width: '100%', padding: '14px', fontFamily: 'Cinzel,serif', fontSize: '15px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
        {loading
          ? <><RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Calculating...</>
          : <>Check Compatibility <ChevronRight style={{ width: '16px', height: '16px' }} /></>}
      </button>

      {/* ── RESULTS ── */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Score banner */}
          <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txm)', marginBottom: '6px', fontFamily: 'Cinzel,serif' }}>
              {result.name1} × {result.name2}
            </div>
            <div style={{ fontFamily: 'Cinzel,serif', fontWeight: 900, fontSize: '64px', lineHeight: 1, color: scoreColor, marginBottom: '4px' }}>{pct}%</div>
            <div style={{ fontSize: '13px', color: 'var(--txm)', marginBottom: '16px' }}>
              {pct >= 70 ? 'Excellent match 🌟' : pct >= 50 ? 'Good compatibility ✓' : 'Needs consideration ⚠'}
            </div>
            <div style={{ width: '100%', height: '10px', background: 'var(--bd)', borderRadius: '5px', overflow: 'hidden', maxWidth: '500px', margin: '0 auto 16px' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: scoreColor, borderRadius: '5px', transition: 'width 1s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '12px', flexWrap: 'wrap' }}>
              <span><strong style={{ color: scoreColor }}>{score}/{total}</strong> <span style={{ color: 'var(--txm)' }}>Ashta Koota</span></span>
              <span><strong style={{ color: pScore / pTotal >= 0.5 ? '#16A34A' : '#DC2626' }}>{pScore}/{pTotal}</strong> <span style={{ color: 'var(--txm)' }}>Pathu Porutham</span></span>
              <span><strong style={{ color: mangal === false ? '#16A34A' : '#DC2626' }}>{mangal === false ? '✓ No' : '⚠ Yes'}</strong> <span style={{ color: 'var(--txm)' }}>Mangal Dosha</span></span>
            </div>
          </div>

          {/* Chart summaries */}
          {(result.chart1 || result.chart2) && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {[{ name: result.name1, chart: result.chart1, sym: '♂' }, { name: result.name2, chart: result.chart2, sym: '♀' }].map((person, i) => {
                const c = person.chart
                if (!c) return null
                const moon = c.planets?.find((p: any) => (p.planet || p.Planet) === 'Moon')
                return (
                  <div key={i} className="card" style={{ padding: '16px' }}>
                    <div style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '14px', color: 'var(--acc)', marginBottom: '10px' }}>
                      {person.sym} {person.name}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '12px' }}>
                      {[
                        ['Lagna', c.ascendantName || c.AscendantName || '—'],
                        ['Moon Rasi', moon?.rasiName || moon?.RasiName || '—'],
                        ['Nakshatra', moon?.nakshatraName || moon?.NakshatraName || '—'],
                        ['Dasha', (c.vimshottariDasa || c.VimshottariDasa || [])[0]?.planet || '—'],
                      ].map(([lbl, val]) => (
                        <div key={lbl}>
                          <div style={{ color: 'var(--txm)', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>{lbl}</div>
                          <div style={{ color: 'var(--tx)', fontWeight: 600, fontFamily: 'Cinzel,serif', fontSize: '13px' }}>{String(val)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Koota breakdown */}
          {kuta.length > 0 && (
            <div className="card">
              <div className="card-hd"><span className="card-title">Ashta Koota Breakdown</span></div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead><tr style={{ borderBottom: '2px solid var(--bd)' }}>
                    {['Koota', 'Max', 'Score', 'Result'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--txm)' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{kuta.map((k: any, i: number) => {
                    const ks = k.score || k.Score || 0
                    const km = k.maxScore || k.MaxScore || k.max || 1
                    const ok = ks >= km * 0.5
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--bd)', background: i % 2 ? 'var(--bg2)' : 'transparent' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, fontFamily: 'Cinzel,serif', color: 'var(--tx)' }}>{k.kootaName || k.KootaName || `Koota ${i + 1}`}</td>
                        <td style={{ padding: '8px 12px', color: 'var(--txm)' }}>{km}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: ok ? '#16A34A' : '#DC2626' }}>{ks}</td>
                        <td style={{ padding: '8px 12px', fontSize: '11px', color: ok ? '#16A34A' : '#DC2626' }}>{ok ? '✓ Compatible' : '✗ Incompatible'}</td>
                      </tr>
                    )
                  })}</tbody>
                </table>
              </div>
            </div>
          )}

          {result.remarks && (
            <div className="card">
              <div className="card-hd"><span className="card-title">Detailed Analysis</span></div>
              <div className="card-bd" style={{ fontSize: '13px', lineHeight: 1.8, color: 'var(--tx2)' }}>{result.remarks}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
