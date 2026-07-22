'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

interface CityResult {
  name: string
  state: string
  country: string
  countryCode: string
  lat: number
  lng: number
  display: string
}

interface Props {
  value: string
  onChange: (city: string, lat?: number, lng?: number) => void
  placeholder?: string
}

const CHART_URL = process.env.NEXT_PUBLIC_CHART_URL ||
  'https://enchanting-dedication-production.up.railway.app'

// Direct Photon search — works from browser, worldwide, free, no API key
async function searchPhoton(q: string): Promise<CityResult[]> {
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en`
  const res  = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`photon ${res.status}`)
  const data = await res.json()
  const features = (data?.features || []) as any[]
  return features
    .filter((f: any) => f.properties?.name && f.geometry?.coordinates)
    .map((f: any) => {
      const p = f.properties
      return {
        name:        p.name ?? '',
        state:       p.state ?? p.county ?? '',
        country:     p.country ?? '',
        countryCode: p.countrycode?.toUpperCase() ?? '',
        lat:         f.geometry.coordinates[1],
        lng:         f.geometry.coordinates[0],
        display:     [p.name, p.state || p.county, p.country].filter(Boolean).join(', ')
      }
    })
    .filter((c: CityResult) => c.lat && c.lng)
    .reduce((acc: CityResult[], c: CityResult) => {
      const key = `${c.name}|${c.country}`.toLowerCase()
      if (!acc.find(x => `${x.name}|${x.country}`.toLowerCase() === key)) acc.push(c)
      return acc
    }, [])
}

// Backend proxy (Railway) — fallback
async function searchBackend(q: string): Promise<CityResult[]> {
  const res  = await fetch(`${CHART_URL}/api/geography/suggest?q=${encodeURIComponent(q)}&limit=8`,
    { cache: 'no-store' })
  if (!res.ok) throw new Error(`backend ${res.status}`)
  const data = await res.json()
  const list = data?.data?.data ?? data?.data ?? []
  if (!Array.isArray(list) || list.length === 0) return []
  // New format: objects with lat/lng
  if (typeof list[0] === 'object' && list[0].lat) {
    return list.map((c: any) => ({
      name:        c.name ?? '',
      state:       c.state ?? '',
      country:     c.country ?? '',
      countryCode: c.countryCode ?? '',
      lat:         c.lat ?? 0,
      lng:         c.lng ?? 0,
      display:     c.display ?? c.name ?? ''
    })).filter((c: CityResult) => c.lat)
  }
  return []
}

async function searchCities(q: string): Promise<CityResult[]> {
  // Try Photon first (direct, always works from browser)
  try {
    const results = await searchPhoton(q)
    if (results.length > 0) return results
  } catch {}
  // Fallback to backend proxy
  try { return await searchBackend(q) } catch {}
  return []
}

export default function CityAutocomplete({ value, onChange, placeholder = 'Type city name...' }: Props) {
  const [query,    setQuery]    = useState(value)
  const [results,  setResults]  = useState<CityResult[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(false)
  const [errMsg,   setErrMsg]   = useState('')
  const [dropPos,  setDropPos]  = useState<{ top: number; left: number; width: number } | null>(null)

  const inputRef  = useRef<HTMLInputElement>(null)
  const dropRef   = useRef<HTMLDivElement>(null)
  const timerRef  = useRef<ReturnType<typeof setTimeout>>()
  const picking   = useRef(false)

  const calcPos = useCallback(() => {
    if (!inputRef.current) return
    const r = inputRef.current.getBoundingClientRect()
    setDropPos({ top: r.bottom + window.scrollY + 3, left: r.left + window.scrollX, width: r.width })
  }, [])

  const closeDropdown = useCallback(() => {
    if (dropRef.current) dropRef.current.style.display = 'none'
    setOpen(false)
  }, [])

  useEffect(() => {
    const fn = (e: Event) => {
      if (e.type === 'scroll') { closeDropdown(); return }
      const t = e.target as Node
      if (inputRef.current?.contains(t) || dropRef.current?.contains(t)) return
      closeDropdown()
    }
    document.addEventListener('mousedown', fn)
    window.addEventListener('scroll', fn, true)
    window.addEventListener('resize', calcPos)
    return () => {
      document.removeEventListener('mousedown', fn)
      window.removeEventListener('scroll', fn, true)
      window.removeEventListener('resize', calcPos)
    }
  }, [closeDropdown, calcPos])

  useEffect(() => {
    if (open && dropRef.current) dropRef.current.style.display = ''
    if (open) calcPos()
  }, [open, calcPos])

  useEffect(() => {
    clearTimeout(timerRef.current)
    setSelected(false)
    setErrMsg('')
    if (query.length < 2) { closeDropdown(); setLoading(false); return }
    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const cities = await searchCities(query)
        setResults(cities)
        if (cities.length > 0 && !picking.current) {
          setOpen(true)
        } else {
          closeDropdown()
          setErrMsg(query.length >= 3 ? `No results for "${query}" — check spelling` : '')
        }
      } catch {
        closeDropdown()
        setErrMsg('Search unavailable — please try again')
      }
      setLoading(false)
    }, 350)
  }, [query])

  const select = (city: CityResult) => {
    picking.current = true
    if (dropRef.current) dropRef.current.style.display = 'none'
    setOpen(false); setResults([])
    setQuery(city.display)
    setSelected(true); setErrMsg('')
    onChange(city.display, city.lat, city.lng)
    setTimeout(() => { picking.current = false }, 300)
    inputRef.current?.blur()
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <MapPin style={{
          position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
          width: '13px', height: '13px', pointerEvents: 'none',
          color: selected ? '#16A34A' : loading ? 'var(--gold)' : 'var(--txm)'
        }} />
        <input
          ref={inputRef}
          className="input"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(false); onChange(e.target.value) }}
          onFocus={() => { if (results.length > 0 && !picking.current) { setOpen(true); calcPos() } }}
          placeholder={placeholder}
          style={{ paddingLeft: '30px', paddingRight: '30px', width: '100%' }}
          autoComplete="off" spellCheck={false}
        />
        <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          {loading   && <Loader2 style={{ width: '14px', height: '14px', color: 'var(--gold)', animation: 'spin 1s linear infinite' }} />}
          {!loading && selected && <CheckCircle2 style={{ width: '14px', height: '14px', color: '#16A34A' }} />}
          {!loading && !selected && errMsg && <AlertCircle style={{ width: '14px', height: '14px', color: '#DC2626' }} />}
        </div>
      </div>

      {/* Status hint */}
      <div style={{ fontSize: '11px', marginTop: '3px', minHeight: '14px',
        color: selected ? '#16A34A' : errMsg ? '#DC2626' : 'var(--txm)' }}>
        {selected  ? '✓ City confirmed'
         : loading  ? 'Searching...'
         : errMsg   ? errMsg
         : results.length > 0 && open ? '↓ Click a city to select'
         : query.length >= 2 ? ''
         : query.length > 0  ? 'Keep typing...'
         : ''}
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && dropPos && (
        <div ref={dropRef} style={{
          position: 'fixed', top: dropPos.top, left: dropPos.left,
          width: Math.max(dropPos.width, 300), maxHeight: '280px', overflowY: 'auto',
          background: 'var(--surf)', border: '1.5px solid var(--gold)',
          borderRadius: '10px', boxShadow: '0 12px 40px rgba(0,0,0,.22)', zIndex: 999999,
        }}>
          <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--gold)',
            background: 'rgba(196,146,42,.06)', borderBottom: '1px solid var(--bd)',
            position: 'sticky', top: 0 }}>
            {results.length} cities — click to select
          </div>
          {results.map((city, i) => (
            <button key={i} type="button"
              onMouseDown={e => { e.preventDefault(); select(city) }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%',
                padding: '10px 12px', border: 'none',
                borderBottom: i < results.length - 1 ? '1px solid var(--bd)' : 'none',
                background: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(196,146,42,.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <MapPin style={{ width: '12px', height: '12px', color: 'var(--gold)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx)' }}>
                  {city.name}
                  {city.countryCode && (
                    <span style={{ fontSize: '10px', color: 'var(--txm)', marginLeft: '6px',
                      fontWeight: 400, background: 'var(--bg2)', padding: '1px 5px', borderRadius: '4px' }}>
                      {city.countryCode}
                    </span>
                  )}
                </div>
                {(city.state || city.country) && (
                  <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '1px' }}>
                    {[city.state, city.country].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--txm)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                {city.lat.toFixed(1)}°{city.lng >= 0 ? '+' : ''}{city.lng.toFixed(1)}°
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
