'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface City { name: string; state: string; country: string; lat: number; lng: number }
interface Props {
  value: string
  onChange: (city: string, lat?: number, lng?: number) => void
  placeholder?: string
}

// Photon by Komoot — OSM-based, free, worldwide, no API key, browser-friendly
// Falls back to our backend GeoNamesAtlas if Photon fails
async function searchCities(q: string): Promise<City[]> {
  // Primary: Photon (komoot) — works from browser, worldwide coverage, free, no key
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en`,
      { cache: 'no-store' }
    )
    if (!res.ok) throw new Error('photon failed')
    const data = await res.json()
    const features = data?.features || []
    if (features.length > 0) {
      const cities = features
        .filter((f: any) => f.geometry?.coordinates && f.properties?.name)
        .map((f: any) => {
          const p = f.properties
          const name = p.name || ''
          const state = p.state || p.county || ''
          const country = p.country || ''
          const lat = f.geometry.coordinates[1]
          const lng = f.geometry.coordinates[0]
          return { name, state, country, lat, lng }
        })
        .filter((c: City) => c.name && c.lat && c.lng)
      // Deduplicate
      const seen = new Set<string>()
      return cities.filter((c: City) => {
        const k = `${c.name}|${c.country}`.toLowerCase()
        if (seen.has(k)) return false
        seen.add(k); return true
      })
    }
  } catch {}

  // Fallback: our backend GeoNamesAtlas (embedded 150 major cities)
  try {
    const CHART_URL = process.env.NEXT_PUBLIC_CHART_URL || 'https://enchanting-dedication-production.up.railway.app'
    const res = await fetch(`${CHART_URL}/api/geography/suggest?q=${encodeURIComponent(q)}&limit=8`)
    if (!res.ok) throw new Error('backend failed')
    const data = await res.json()
    const names: string[] = data?.data?.data ?? data?.data ?? []
    if (names.length > 0) {
      const rows = await Promise.all(names.slice(0, 6).map(async (name: string) => {
        try {
          const r2 = await fetch(`${CHART_URL}/api/geography/lookup?place=${encodeURIComponent(name)}`)
          const d2 = await r2.json()
          const loc = d2?.data?.data ?? d2?.data ?? d2
          if (!loc?.latitude) return null
          const parts = name.split(',')
          return {
            name: loc.placeName ?? parts[0].trim(),
            state: parts.length > 1 ? parts[1].trim() : '',
            country: loc.country ?? '',
            lat: loc.latitude, lng: loc.longitude
          } as City
        } catch { return null }
      }))
      return rows.filter((c): c is City => !!c && c.lat !== 0)
    }
  } catch {}

  return []
}

export default function CityAutocomplete({ value, onChange, placeholder = 'Type city name...' }: Props) {
  const [query,    setQuery]    = useState(value)
  const [results,  setResults]  = useState<City[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(false)
  const [noResult, setNoResult] = useState(false)
  const [dropPos,  setDropPos]  = useState<{ top: number; left: number; width: number } | null>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const dropRef     = useRef<HTMLDivElement>(null)
  const timerRef    = useRef<ReturnType<typeof setTimeout>>()
  const selecting   = useRef(false)

  // ── position helpers ──────────────────────────────────────────────────────
  const calcPos = useCallback(() => {
    if (!inputRef.current) return
    const r = inputRef.current.getBoundingClientRect()
    setDropPos({ top: r.bottom + window.scrollY + 3, left: r.left + window.scrollX, width: r.width })
  }, [])

  const hide = useCallback(() => {
    if (dropRef.current) dropRef.current.style.display = 'none'
    selecting.current = true
    setOpen(false)
    setResults([])
    setTimeout(() => { selecting.current = false }, 300)
  }, [])

  // ── outside click / scroll ────────────────────────────────────────────────
  useEffect(() => {
    const fn = (e: Event) => {
      if (e.type === 'scroll') { hide(); return }
      const t = e.target as Node
      if (inputRef.current?.contains(t) || dropRef.current?.contains(t)) return
      hide()
    }
    document.addEventListener('mousedown', fn)
    window.addEventListener('scroll', fn, true)
    window.addEventListener('resize', calcPos)
    return () => {
      document.removeEventListener('mousedown', fn)
      window.removeEventListener('scroll', fn, true)
      window.removeEventListener('resize', calcPos)
    }
  }, [hide, calcPos])

  useEffect(() => { if (open && dropRef.current) dropRef.current.style.display = '' }, [open])
  useEffect(() => { if (open) calcPos() }, [open, calcPos])

  // ── search ────────────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(timerRef.current)
    setSelected(false)
    setNoResult(false)
    if (query.length < 2) { hide(); setLoading(false); return }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const cities = await searchCities(query)
        setResults(cities)
        if (cities.length > 0 && !selecting.current) {
          setOpen(true)
          calcPos()
          setNoResult(false)
        } else {
          setNoResult(true)
          hide()
        }
      } catch {
        setNoResult(true)
        hide()
      }
      setLoading(false)
    }, 350)
  }, [query])

  // ── select ────────────────────────────────────────────────────────────────
  const select = (city: City) => {
    const label = [city.name, city.state, city.country].filter(Boolean).join(', ')
    selecting.current = true
    if (dropRef.current) dropRef.current.style.display = 'none'
    setOpen(false)
    setResults([])
    setQuery(label)
    setSelected(true)
    setNoResult(false)
    onChange(label, city.lat, city.lng)
    setTimeout(() => { selecting.current = false }, 300)
  }

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width: '100%' }}>

      {/* Input */}
      <div style={{ position: 'relative' }}>
        <MapPin style={{
          position: 'absolute', left: '10px', top: '50%',
          transform: 'translateY(-50%)', width: '13px', height: '13px',
          color: selected ? '#16A34A' : loading ? 'var(--gold)' : 'var(--txm)',
          pointerEvents: 'none'
        }} />
        <input
          ref={inputRef}
          className="input"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setSelected(false)
            onChange(e.target.value)   // clear lat/lng while typing
          }}
          onFocus={() => {
            if (results.length > 0 && !selecting.current) { setOpen(true); calcPos() }
          }}
          placeholder={placeholder}
          style={{ paddingLeft: '30px', paddingRight: '28px', width: '100%' }}
          autoComplete="off"
          spellCheck={false}
        />
        <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          {loading   && <Loader2 style={{ width: '13px', height: '13px', color: 'var(--txm)', animation: 'spin 1s linear infinite' }} />}
          {!loading && selected  && <CheckCircle2 style={{ width: '13px', height: '13px', color: '#16A34A' }} />}
          {!loading && noResult && query.length >= 2 && <AlertCircle style={{ width: '13px', height: '13px', color: '#DC2626' }} />}
        </div>
      </div>

      {/* Hint */}
      <div style={{ fontSize: '11px', marginTop: '3px', minHeight: '16px',
        color: selected ? '#16A34A'
          : noResult && !loading && query.length >= 2 ? '#DC2626'
          : 'var(--txm)' }}>
        {selected                                    ? '✓ City selected'
          : loading                                  ? 'Searching cities...'
          : noResult && query.length >= 2            ? `No results for "${query}" — try different spelling`
          : results.length > 0 && open              ? 'Click a city below to select it'
          : query.length >= 2                        ? ''
          : query.length > 0                         ? 'Type at least 2 letters'
          : ''}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && dropPos && (
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: Math.max(dropPos.width, 280),
            background: 'var(--surf)',
            border: '1.5px solid var(--gold)',
            borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,.2)',
            zIndex: 999999,
            overflow: 'hidden',
          }}
        >
          <div style={{
            padding: '5px 12px', fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.05em',
            color: 'var(--gold)', background: 'rgba(196,146,42,.06)',
            borderBottom: '1px solid var(--bd)'
          }}>
            {results.length} results — click to select
          </div>
          {results.map((city, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={e => { e.preventDefault(); select(city) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 12px',
                border: 'none', borderBottom: i < results.length - 1 ? '1px solid var(--bd)' : 'none',
                background: 'none', cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(196,146,42,.07)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <MapPin style={{ width: '12px', height: '12px', color: 'var(--gold)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx)' }}>{city.name}</div>
                {(city.state || city.country) && (
                  <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '1px' }}>
                    {[city.state, city.country].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--txm)', flexShrink: 0,
                fontVariantNumeric: 'tabular-nums' }}>
                {city.lat.toFixed(2)}, {city.lng.toFixed(2)}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
