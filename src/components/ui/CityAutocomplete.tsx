'use client'
import { useState, useRef, useEffect } from 'react'
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react'

interface City { name: string; state: string; country: string; cc: string; lat: number; lng: number }
interface Props {
  value: string
  onChange: (city: string, lat?: number, lng?: number) => void
  placeholder?: string
}

async function searchCities(q: string): Promise<City[]> {
  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en`)
    const data = await res.json()
    const seen = new Set<string>()
    return (data?.features || [])
      .filter((f: any) => f.properties?.name && f.geometry?.coordinates)
      .map((f: any) => ({
        name:  f.properties.name ?? '',
        state: f.properties.state ?? f.properties.county ?? '',
        country: f.properties.country ?? '',
        cc:    (f.properties.countrycode ?? '').toUpperCase(),
        lat:   f.geometry.coordinates[1],
        lng:   f.geometry.coordinates[0],
      }))
      .filter((c: City) => {
        const k = `${c.name}|${c.country}`.toLowerCase()
        if (seen.has(k)) return false
        seen.add(k); return c.lat && c.lng
      })
  } catch { return [] }
}

export default function CityAutocomplete({ value, onChange, placeholder = 'Type city name...' }: Props) {
  const [query,    setQuery]    = useState(value)
  const [results,  setResults]  = useState<City[]>([])
  const [loading,  setLoading]  = useState(false)
  const [show,     setShow]     = useState(false)
  const [selected, setSelected] = useState(false)
  const timer    = useRef<ReturnType<typeof setTimeout>>()
  const wrapRef  = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setShow(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  // Search when query changes
  useEffect(() => {
    clearTimeout(timer.current)
    setSelected(false)
    if (query.length < 2) { setResults([]); setShow(false); setLoading(false); return }
    setLoading(true)
    timer.current = setTimeout(async () => {
      const cities = await searchCities(query)
      setResults(cities)
      setShow(cities.length > 0)
      setLoading(false)
    }, 350)
  }, [query])

  const select = (c: City) => {
    const label = [c.name, c.state, c.country].filter(Boolean).join(', ')
    setQuery(label)
    setSelected(true)
    setShow(false)
    setResults([])
    onChange(label, c.lat, c.lng)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%' }}>
      {/* Input */}
      <div style={{ position: 'relative' }}>
        <MapPin style={{
          position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
          width: '13px', height: '13px', pointerEvents: 'none',
          color: selected ? '#16A34A' : 'var(--txm)'
        }} />
        <input
          className="input"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(false); onChange(e.target.value) }}
          onFocus={() => { if (results.length > 0) setShow(true) }}
          placeholder={placeholder}
          style={{ paddingLeft: '30px', paddingRight: '28px', width: '100%' }}
          autoComplete="off"
          spellCheck={false}
        />
        <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          {loading && <Loader2 style={{ width: '13px', height: '13px', color: 'var(--txm)', animation: 'spin 1s linear infinite' }} />}
          {!loading && selected && <CheckCircle2 style={{ width: '13px', height: '13px', color: '#16A34A' }} />}
        </div>
      </div>

      {/* Status */}
      <div style={{ fontSize: '11px', marginTop: '3px', minHeight: '14px',
        color: selected ? '#16A34A' : 'var(--txm)' }}>
        {selected ? '✓ City confirmed'
          : loading ? 'Searching...'
          : show && results.length > 0 ? '↓ Click a city below to select'
          : query.length >= 3 && !loading && results.length === 0 ? `No results for "${query}"`
          : ''}
      </div>

      {/* Inline dropdown — no position:fixed, just absolute below input */}
      {show && results.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          marginTop: '2px',
          background: 'var(--surf)',
          border: '1.5px solid var(--gold)',
          borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,.18)',
          zIndex: 9999,
          overflow: 'hidden',
          maxHeight: '260px',
          overflowY: 'auto',
        }}>
          <div style={{
            padding: '5px 12px', fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.05em',
            color: 'var(--gold)', background: 'rgba(196,146,42,.06)',
            borderBottom: '1px solid var(--bd)',
          }}>
            {results.length} cities found — click to select
          </div>
          {results.map((c, i) => (
            <button key={i} type="button"
              onMouseDown={e => { e.preventDefault(); select(c) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '9px 12px', border: 'none',
                borderBottom: i < results.length - 1 ? '1px solid var(--bd)' : 'none',
                background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(196,146,42,.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <MapPin style={{ width: '11px', height: '11px', color: 'var(--gold)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx)' }}>{c.name}</span>
                {c.cc && <span style={{ fontSize: '10px', color: 'var(--txm)', marginLeft: '6px',
                  background: 'var(--bg2)', padding: '1px 5px', borderRadius: '3px' }}>{c.cc}</span>}
                {(c.state || c.country) && (
                  <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '1px' }}>
                    {[c.state, c.country].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
