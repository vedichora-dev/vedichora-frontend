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

// Primary: Nominatim (OSM) — reliable, no API key, supports Indian cities well
// Fallback: Photon (komoot)
async function searchCities(q: string): Promise<City[]> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=6&accept-language=en`
    const res  = await fetch(url, { headers: { 'Accept-Language': 'en' } })
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) throw new Error('no results')
    return data
      .filter((f: any) => f.lat && f.lon && f.display_name)
      .map((f: any) => {
        const addr = f.address || {}
        const name = addr.city || addr.town || addr.village || addr.county || f.name ||
                     f.display_name.split(',')[0]
        const country = addr.country || ''
        return { name, country, lat: parseFloat(f.lat), lng: parseFloat(f.lon) }
      })
      .filter((c: City) => c.name)
      .slice(0, 6)
  } catch {
    // Fallback to Photon
    try {
      const res  = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en`)
      const data = await res.json()
      return (data.features || [])
        .filter((f: any) => f.properties?.name)
        .slice(0, 6)
        .map((f: any) => ({
          name: f.properties.name || '',
          country: f.properties.country || '',
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
        }))
    } catch { return [] }
  }
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
      // Deduplicate
      const seen = new Set<string>()
      const unique = cities.filter(c => {
        const k = c.name + '|' + c.country
        if (seen.has(k)) return false
        seen.add(k); return true
      })
      setResults(unique)
      if (unique.length > 0 && !selecting.current) { setOpen(true); updatePos() }
      setLoading(false)
    }, 250)  // 250ms debounce — faster response
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

  const citySelected = results.length === 0 && query.length > 2 && !loading &&
    !open && !selecting.current  // after selection query has value but no results open

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

      {/* Hint text */}
      {query.length > 0 && query.length < 2 && (
        <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '3px' }}>
          Keep typing...
        </div>
      )}
      {query.length >= 2 && loading && (
        <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '3px' }}>
          Searching cities...
        </div>
      )}

      {/* Dropdown — position:fixed to escape any card z-index stacking */}
      {open && results.length > 0 && dropPos && (
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            top: dropPos.top, left: dropPos.left, width: dropPos.width,
            background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: '10px',
            boxShadow: '0 8px 32px rgba(0,0,0,.20)', zIndex: 999999, overflow: 'hidden',
          }}
        >
          <div style={{ padding: '4px 12px', fontSize: '10px', color: 'var(--txm)',
            borderBottom: '1px solid var(--bd)', background: 'var(--bg2)' }}>
            Select your city ↓
          </div>
          {results.map((city, i) => (
            <button
              key={i}
              type="button"
              data-city-option="true"
              onClick={() => select(city)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
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
                  <span style={{ color: 'var(--txm)', marginLeft: '6px', fontSize: '11px' }}>
                    {city.country}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
