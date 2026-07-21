'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader } from 'lucide-react'

interface City { name: string; country: string; lat: number; lng: number }
interface Props {
  value: string
  onChange: (city: string, lat?: number, lng?: number, tz?: string) => void
  placeholder?: string
}
interface DropPos { top: number; left: number; width: number }

const CHART_URL = process.env.NEXT_PUBLIC_CHART_URL || 'https://enchanting-dedication-production.up.railway.app'

// Search using our own GeoNamesAtlas backend (no external API, no CORS issues)
// Falls back to Nominatim OSM if backend returns nothing
async function searchCities(q: string): Promise<City[]> {
  // 1. Our own backend — GeoNamesAtlas (150 bundled cities + GeoNames files on server)
  try {
    const res  = await fetch(`${CHART_URL}/api/geography/suggest?q=${encodeURIComponent(q)}&limit=8`)
    const data = await res.json()
    const suggestions: string[] = data?.data?.data ?? data?.data ?? data ?? []
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      // suggestions are city name strings — resolve each to lat/lng via lookup
      const resolved = await Promise.allSettled(
        suggestions.slice(0, 6).map(async (name: string) => {
          const r2 = await fetch(`${CHART_URL}/api/geography/lookup?place=${encodeURIComponent(name)}`)
          const d2 = await r2.json()
          const loc = d2?.data?.data ?? d2?.data ?? d2
          return {
            name: loc?.placeName ?? name.split(',')[0].trim(),
            country: loc?.country ?? (name.includes(',') ? name.split(',').slice(-1)[0].trim() : ''),
            lat:  loc?.latitude  ?? 0,
            lng: loc?.longitude ?? 0,
          } as City
        })
      )
      const cities = resolved
        .filter(r => r.status === 'fulfilled' && (r as any).value.lat !== 0)
        .map(r => (r as any).value) as City[]
      if (cities.length > 0) return cities
    }
  } catch {}

  // 2. Fallback — Nominatim OSM (free, no key, good Indian city coverage)
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&accept-language=en`,
      { headers: { 'User-Agent': 'VedicHora/1.0' } }
    )
    const data = await res.json()
    return (data || [])
      .filter((f: any) => f.lat && f.lon)
      .map((f: any) => {
        const addr = f.address || {}
        const name = addr.city || addr.town || addr.village || addr.county || f.display_name.split(',')[0]
        return { name, country: addr.country || '', lat: parseFloat(f.lat), lng: parseFloat(f.lon) }
      })
      .filter((c: City) => c.name)
      .slice(0, 6)
  } catch { return [] }
}

export default function CityAutocomplete({ value, onChange, placeholder = 'Type city name...' }: Props) {
  const [query,   setQuery]   = useState(value)
  const [results, setResults] = useState<City[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropPos, setDropPos] = useState<DropPos | null>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const dropRef   = useRef<HTMLDivElement>(null)
  const timer     = useRef<NodeJS.Timeout>()
  const selecting = useRef(false)

  const hideDropdown = useCallback(() => {
    if (dropRef.current) dropRef.current.style.display = 'none'
    selecting.current = true
    setOpen(false)
    setResults([])
    setTimeout(() => { selecting.current = false }, 400)
  }, [])

  const updatePos = useCallback(() => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width })
  }, [])

  useEffect(() => { if (open && dropRef.current) dropRef.current.style.display = '' }, [open])
  useEffect(() => { if (open) updatePos() }, [open, updatePos])

  useEffect(() => {
    const close = (e: Event) => {
      if (e.type === 'scroll') { hideDropdown(); return }
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) hideDropdown()
    }
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', updatePos)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [hideDropdown, updatePos])

  useEffect(() => {
    clearTimeout(timer.current)
    if (query.length < 2) { hideDropdown(); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      const cities = await searchCities(query)
      const seen = new Set<string>()
      const unique = cities.filter(c => {
        const k = c.name + '|' + c.country
        if (seen.has(k)) return false
        seen.add(k); return true
      })
      setResults(unique)
      if (unique.length > 0 && !selecting.current) { setOpen(true); updatePos() }
      setLoading(false)
    }, 300)
  }, [query, updatePos, hideDropdown])

  const select = (city: City) => {
    const label = city.name + (city.country ? ', ' + city.country : '')
    if (dropRef.current) dropRef.current.style.display = 'none'
    selecting.current = true
    setResults([]); setOpen(false)
    setQuery(label)
    onChange(label, city.lat, city.lng)
    setTimeout(() => { selecting.current = false }, 400)
  }

  return (
    <>
      <div style={{ position: 'relative' }}>
        <MapPin style={{
          position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)',
          width: '12px', height: '12px', color: 'var(--txm)', pointerEvents: 'none'
        }} />
        <input
          ref={inputRef}
          className="input"
          style={{ paddingLeft: '28px', width: '100%', paddingRight: '28px' }}
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value) }}
          onFocus={() => {
            if (!selecting.current && results.length > 0) { setOpen(true); updatePos() }
          }}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        {loading && (
          <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }}>
            <Loader style={{ width: '13px', height: '13px', color: 'var(--txm)', animation: 'spin 1s linear infinite' }} />
          </div>
        )}
      </div>

      {query.length >= 2 && loading && (
        <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '3px' }}>Searching cities...</div>
      )}

      {open && results.length > 0 && dropPos && (
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            top: dropPos.top, left: dropPos.left, width: dropPos.width,
            background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,.22)', zIndex: 999999, overflow: 'hidden',
          }}
        >
          <div style={{ padding: '5px 12px', fontSize: '10px', color: 'var(--txm)',
            borderBottom: '1px solid var(--bd)', background: 'var(--bg2)',
            display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MapPin style={{ width: '9px', height: '9px', color: 'var(--gold)' }} />
            Click to select city
          </div>
          {results.map((city, i) => (
            <button
              key={i}
              type="button"
              data-city-option="true"
              onClick={() => select(city)}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 12px',
                border: 'none', background: 'none', cursor: 'pointer',
                textAlign: 'left', fontSize: '13px', fontFamily: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <MapPin style={{ width: '11px', height: '11px', color: 'var(--gold)', flexShrink: 0 }} />
              <div>
                <span style={{ color: 'var(--tx)', fontWeight: 600 }}>{city.name}</span>
                {city.country && (
                  <span style={{ color: 'var(--txm)', marginLeft: '6px', fontSize: '11px' }}>{city.country}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
