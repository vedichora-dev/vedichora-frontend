'use client'
import { useState, useEffect } from 'react'
import { calculateChart, calculateChartGuest, listCharts } from '@/api'
import { useStore } from '@/store'
import { to24Hour } from '@/lib/utils'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'
import CityAutocomplete from '@/components/ui/CityAutocomplete'
import { Heart, ChevronRight, RefreshCw, CheckCircle, AlertCircle, MapPin } from 'lucide-react'

const EMPTY: DateValue = { dd: 0, mm: 0, yyyy: 0 }

// ── Geocode fallback ─────────────────────────────────────────────────────────
async function geocode(place: string): Promise<{lat:number,lng:number}|null> {
  try {
    const r = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(place)}&limit=1&lang=en`
    ).then(r => r.json())
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

// ── PersonCard — at module level so CityAutocomplete never remounts ───────────
interface PersonCardProps {
  num: number
  gender: 'Male'|'Female'; setGender: (g: 'Male'|'Female') => void
  name: string; setName: (n: string) => void
  dob: DateValue; setDob: (d: DateValue) => void
  place: string; setPlace: (p: string) => void
  lat: number|undefined; setLat: (v: number|undefined) => void
  lng: number|undefined; setLng: (v: number|undefined) => void
  saved: any[]; token: string|null
  useSaved: boolean; setUseSaved: (b: boolean) => void
  selId: string; setSelId: (id: string) => void
  error?: string   // field-level error
}

function PersonCard({
  num, gender, setGender, name, setName, dob, setDob,
  place, setPlace, lat, setLat, lng, setLng,
  saved, token, useSaved, setUseSaved, selId, setSelId, error
}: PersonCardProps) {
  const citySelected = !!lat && !!lng
  const dateOk = dob.dd > 0 && dob.mm > 0 && dob.yyyy > 0

  return (
    <div className="card" style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Heart style={{ width: '14px', height: '14px', color: num === 1 ? '#F87171' : '#F472B6', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '14px', color: 'var(--acc)' }}>
          Person {num}
        </span>
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
          {/* Name */}
          <div>
            <label className="label">Full Name <span style={{ color: 'var(--txm)', fontWeight: 400 }}>(optional)</span></label>
            <input className="input" value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`${gender} name`} />
          </div>

          {/* Date + Time */}
          <div>
            <label className="label">
              Date & Time of Birth
              {dateOk && <CheckCircle style={{ width: '11px', height: '11px', color: '#16A34A', marginLeft: '6px', display: 'inline' }} />}
            </label>
            <DatePicker value={dob} onChange={setDob} showTime showUnknown prefix={`m${num}`} />
            {!dateOk && (
              <div style={{ fontSize: '11px', color: '#B45309', marginTop: '4px' }}>
                ↑ Please select day, month and year
              </div>
            )}
          </div>

          {/* City */}
          <div>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Place of Birth
              {citySelected
                ? <CheckCircle style={{ width: '11px', height: '11px', color: '#16A34A' }} />
                : <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: 400 }}>* required</span>
              }
            </label>
            <div style={{ position: 'relative' }}>
              <CityAutocomplete
                value={place}
                onChange={(city: string, la?: number, ln?: number) => {
                  setPlace(city)
                  setLat(la)
                  setLng(ln)
                }}
                placeholder="Type and select city from dropdown ▾"
              />
            </div>
            {place.trim() && !citySelected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px',
                fontSize: '11px', color: '#DC2626', background: 'rgba(220,38,38,.06)',
                padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(220,38,38,.2)' }}>
                <AlertCircle style={{ width: '11px', height: '11px', flexShrink: 0 }} />
                Please <strong style={{ margin: '0 3px' }}>select a city from the dropdown</strong> — don't just type
              </div>
            )}
            {!place.trim() && (
              <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin style={{ width: '10px', height: '10px' }} />
                Type city name and click the suggestion that appears
              </div>
            )}
          </div>

          {/* Field-level error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px',
              borderRadius: '8px', background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)',
              fontSize: '12px', color: '#DC2626' }}>
              <AlertCircle style={{ width: '13px', height: '13px', flexShrink: 0 }} />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function MatchPage() {
  const { token } = useStore()
  const [saved, setSaved] = useState<any[]>([])

  const [n1, setN1] = useState('')
  const [d1, setD1] = useState<DateValue>(EMPTY)
  const [p1, setP1] = useState('')
  const [lat1, setLat1] = useState<number|undefined>()
  const [lng1, setLng1] = useState<number|undefined>()
  const [g1, setG1] = useState<'Male'|'Female'>('Male')
  const [useSaved1, setUseSaved1] = useState(false)
  const [selId1,    setSelId1]    = useState('')

  const [n2, setN2] = useState('')
  const [d2, setD2] = useState<DateValue>(EMPTY)
  const [p2, setP2] = useState('')
  const [lat2, setLat2] = useState<number|undefined>()
  const [lng2, setLng2] = useState<number|undefined>()
  const [g2, setG2] = useState<'Male'|'Female'>('Female')
  const [useSaved2, setUseSaved2] = useState(false)
  const [selId2,    setSelId2]    = useState('')

  const [result,  setResult]  = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')
  const [err1,    setErr1]    = useState('')  // person-1 field error
  const [err2,    setErr2]    = useState('')  // person-2 field error

  useEffect(() => {
    if (!token) return
    listCharts().then((res: any) => {
      const list = Array.isArray(res) ? res : (res?.data?.data ?? res?.data ?? [])
      setSaved(list)
    }).catch(() => {})
  }, [token])

  // ── Validate one person ────────────────────────────────────────────────────
  const validatePerson = (
    label: string, d: DateValue, p: string, lat?: number, lng?: number,
    useSaved: boolean = false, selId: string = ''
  ): string => {
    if (useSaved && selId) return ''            // saved chart — always valid
    if (!d.dd || !d.mm || !d.yyyy)
      return `${label}: please select day, month and year`
    if (!p.trim())
      return `${label}: place of birth is required`
    // lat/lng validated at runtime in calcChart with geocode fallback
    if (!p.trim())
      return label + ': place of birth is required'
    return ''
  }

  // ── Calc one chart ─────────────────────────────────────────────────────────
  const calcChart = async (
    n: string, d: DateValue, p: string,
    lat?: number, lng?: number, g?: string,
    savedId?: string, savedChart?: any
  ) => {
    if (savedId && savedChart) return { chart: savedChart, id: savedId }
    let rlat = lat, rlng = lng
    if ((!rlat || !rlng) && p.trim()) {
      const gc = await geocode(p)
      if (gc) { rlat = gc.lat; rlng = gc.lng }
    }
    if (!rlat || !rlng) throw new Error('Could not locate "' + p + '" — please select from the dropdown')
    const fn = token ? calculateChart : calculateChartGuest
    const r = await fn(buildPayload(n, d, p, rlat, rlng, g))
    const chart = r?.data?.data ?? r?.data
    if (!chart) throw new Error('Chart calculation failed — check date and location')
    return { chart, id: chart.horoscopeId || chart.id || '' }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handle = async () => {
    setErr(''); setErr1(''); setErr2(''); setResult(null)

    // Validate both persons before any API call
    const e1 = validatePerson('Person 1', d1, p1, lat1, lng1, useSaved1, selId1)
    const e2 = validatePerson('Person 2', d2, p2, lat2, lng2, useSaved2, selId2)

    if (e1) setErr1(e1.replace('Person 1: ', ''))
    if (e2) setErr2(e2.replace('Person 2: ', ''))
    if (e1 || e2) {
      setErr(e1 && e2 ? 'Please fix the issues highlighted above for both persons.'
        : e1 ? e1 : e2)
      return
    }

    setLoading(true)
    try {
      const s1 = useSaved1 ? saved.find(c => (c.horoscopeId || c.HoroscopeId) === selId1) : null
      const s2 = useSaved2 ? saved.find(c => (c.horoscopeId || c.HoroscopeId) === selId2) : null

      const [r1, r2] = await Promise.all([
        calcChart(n1, d1, p1, lat1, lng1, g1, useSaved1 ? selId1 : undefined, s1)
          .catch(e => { throw new Error('Person 1: ' + e.message) }),
        calcChart(n2, d2, p2, lat2, lng2, g2, useSaved2 ? selId2 : undefined, s2)
          .catch(e => { throw new Error('Person 2: ' + e.message) }),
      ])

      // Match via guest-match (full payloads) — always works without saved IDs
      const CHART_URL = process.env.NEXT_PUBLIC_CHART_URL || 'https://enchanting-dedication-production.up.railway.app'
      const gp1 = buildPayload(n1, d1, p1, lat1, lng1, g1)
      const gp2 = buildPayload(n2, d2, p2, lat2, lng2, g2)
      const gres = await fetch(`${CHART_URL}/api/chart/guest-match`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Person1: gp1, Person2: gp2 })
      }).then(r => r.json()).catch(() => null)

      const mdata = gres?.data?.data ?? gres?.data ?? gres

      if (!mdata || (mdata?.AshtaKootaScore === undefined && mdata?.ashtaKootaScore === undefined)) {
        throw new Error('Compatibility calculation failed — please try again')
      }

      const nm1 = n1 || r1.chart?.personName || r1.chart?.PersonName || g1
      const nm2 = n2 || r2.chart?.personName || r2.chart?.PersonName || g2
      setResult({ ...mdata, name1: nm1, name2: nm2, chart1: r1.chart, chart2: r2.chart })
    } catch (e: any) {
      const msg = e?.message || 'Calculation failed — please try again'
      // Parse person-specific errors
      if (msg.startsWith('Person 1:')) { setErr1(msg.replace('Person 1: ', '')); setErr(msg) }
      else if (msg.startsWith('Person 2:')) { setErr2(msg.replace('Person 2: ', '')); setErr(msg) }
      else setErr(msg)
    }
    setLoading(false)
  }

  const score  = result?.AshtaKootaScore  ?? result?.ashtaKootaScore  ?? 0
  const total  = result?.AshtaKootaTotal  ?? result?.ashtaKootaTotal  ?? 36
  const pScore = result?.PathuPoruthamScore ?? result?.pathuPoruthamScore ?? 0
  const pTotal = result?.PathuPoruthamTotal ?? result?.pathuPoruthamTotal ?? 10
  const kuta   = result?.KootaDetails || result?.kootaDetails || []
  const pct    = total > 0 ? Math.round((score / total) * 100) : 0
  const scoreColor = pct >= 70 ? '#16A34A' : pct >= 50 ? '#B45309' : '#DC2626'

  // Button disabled if obvious validation fails
  const canSubmit = !loading  // button always clickable; validation is in handle()

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
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#9C6B14',
            background: 'rgba(156,107,20,.07)', padding: '8px 12px', borderRadius: '8px', display: 'inline-block' }}>
            🔒 Guest mode — <a href="/signin" style={{ color: 'var(--acc)', fontWeight: 600 }}>Sign in</a> to use saved charts
          </div>
        )}
      </div>

      {/* Instructions banner */}
      <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px',
        background: 'rgba(196,146,42,.07)', border: '1px solid rgba(196,146,42,.2)',
        fontSize: '12px', color: 'var(--txm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MapPin style={{ width: '13px', height: '13px', color: 'var(--gold)', flexShrink: 0 }} />
        <span>
          <strong style={{ color: 'var(--tx)' }}>How to use:</strong> Fill in the date of birth, type a city and
          <strong style={{ color: 'var(--acc)' }}> click the city suggestion</strong> from the dropdown —
          then click Check Compatibility.
        </span>
      </div>

      {/* Two person forms */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}
        className="match-grid">
        <PersonCard num={1} gender={g1} setGender={setG1}
          name={n1} setName={setN1} dob={d1} setDob={setD1}
          place={p1} setPlace={setP1} lat={lat1} setLat={setLat1} lng={lng1} setLng={setLng1}
          saved={saved} token={token}
          useSaved={useSaved1} setUseSaved={setUseSaved1}
          selId={selId1} setSelId={setSelId1}
          error={err1} />
        <PersonCard num={2} gender={g2} setGender={setG2}
          name={n2} setName={setN2} dob={d2} setDob={setD2}
          place={p2} setPlace={setP2} lat={lat2} setLat={setLat2} lng={lng2} setLng={setLng2}
          saved={saved} token={token}
          useSaved={useSaved2} setUseSaved={setUseSaved2}
          selId={selId2} setSelId={setSelId2}
          error={err2} />
      </div>

      {/* Global error */}
      {err && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 16px',
          borderRadius: '10px', marginBottom: '16px',
          background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)',
          fontSize: '13px', color: '#DC2626' }}>
          <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '1px' }} />
          {err}
        </div>
      )}

      <button onClick={handle} disabled={loading}
        className="btn-primary"
        style={{ width: '100%', padding: '14px', fontFamily: 'Cinzel,serif', fontSize: '15px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
        {loading
          ? <><RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Calculating...</>
          : <>Check Compatibility <ChevronRight style={{ width: '16px', height: '16px' }} /></>
        }
      </button>

      {/* ── RESULTS ── */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Score banner */}
          <div className="card" style={{ padding: '28px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--txm)', marginBottom: '6px', fontFamily: 'Cinzel,serif' }}>
              {result.name1} × {result.name2}
            </div>
            <div style={{ fontFamily: 'Cinzel,serif', fontWeight: 900, fontSize: '64px', lineHeight: 1,
              color: scoreColor, marginBottom: '4px' }}>{pct}%</div>
            <div style={{ fontSize: '13px', color: 'var(--txm)', marginBottom: '16px' }}>
              {pct >= 70 ? 'Excellent match 🌟' : pct >= 50 ? 'Good compatibility ✓' : 'Needs consideration ⚠'}
            </div>
            <div style={{ width: '100%', height: '10px', background: 'var(--bd)', borderRadius: '5px',
              overflow: 'hidden', maxWidth: '500px', margin: '0 auto 16px' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: scoreColor,
                borderRadius: '5px', transition: 'width 1s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', fontSize: '12px', flexWrap: 'wrap' }}>
              <span><strong style={{ color: scoreColor }}>{score}/{total}</strong> <span style={{ color: 'var(--txm)' }}>Ashta Koota</span></span>
              <span><strong style={{ color: pScore / (pTotal||10) >= 0.5 ? '#16A34A' : '#DC2626' }}>{pScore}/{pTotal}</strong> <span style={{ color: 'var(--txm)' }}>Pathu Porutham</span></span>
            </div>
          </div>

          {/* Koota breakdown */}
          {kuta.length > 0 && (
            <div className="card">
              <div className="card-hd"><span className="card-title">Ashta Koota Breakdown</span></div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead><tr style={{ borderBottom: '2px solid var(--bd)' }}>
                    {['Koota', 'Max', 'Score', 'Status'].map(h => (
                      <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '9px',
                        fontWeight: 700, textTransform: 'uppercase', color: 'var(--txm)' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{kuta.map((k: any, i: number) => {
                    const ks = k.Score ?? k.score ?? 0
                    const km = k.MaxScore ?? k.maxScore ?? 1
                    const ok = ks >= km * 0.5
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--bd)',
                        background: i % 2 ? 'var(--bg2)' : 'transparent' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600, fontFamily: 'Cinzel,serif', color: 'var(--tx)' }}>
                          {k.KootaName || k.kootaName || `Koota ${i + 1}`}
                        </td>
                        <td style={{ padding: '8px 12px', color: 'var(--txm)' }}>{km}</td>
                        <td style={{ padding: '8px 12px', fontWeight: 700, color: ok ? '#16A34A' : '#DC2626' }}>{ks}</td>
                        <td style={{ padding: '8px 12px', fontSize: '11px', color: ok ? '#16A34A' : '#DC2626' }}>
                          {ok ? '✓ Compatible' : '✗ Incompatible'}
                        </td>
                      </tr>
                    )
                  })}</tbody>
                </table>
              </div>
            </div>
          )}

          {result.Summary && (
            <div className="card">
              <div className="card-hd"><span className="card-title">Analysis</span></div>
              <div className="card-bd" style={{ fontSize: '13px', lineHeight: 1.8, color: 'var(--tx2)' }}>
                {result.Summary}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
