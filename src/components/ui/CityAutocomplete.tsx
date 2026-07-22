'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react'

interface City { name: string; state: string; country: string; lat: number; lng: number }
interface Props {
  value: string
  onChange: (city: string, lat?: number, lng?: number, tz?: string) => void
  placeholder?: string
}

const CHART_URL = process.env.NEXT_PUBLIC_CHART_URL || 'https://enchanting-dedication-production.up.railway.app'

// Search cities — Nominatim first (fast, comprehensive Indian cities), backend fallback
async function searchCities(q: string): Promise<City[]> {
  // Primary: Nominatim OpenStreetMap — free, comprehensive, no API key
  try {
    const url = `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=8&accept-language=en` +
      `&featuretype=city&countrycodes=in,gb,us,au,ca,sg,ae,my,lk`
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'VedicHora/1.0 (vedichora.com)' },
      signal: AbortSignal.timeout(5000)
    })
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      return data.map((f: any) => {
        const a = f.address || {}
        const name = a.city || a.town || a.village || a.municipality || a.county || f.display_name.split(',')[0].trim()
        const state = a.state || a.state_district || ''
        const country = a.country || ''
        return { name, state, country, lat: parseFloat(f.lat), lng: parseFloat(f.lon) }
      }).filter((c: City) => c.name && c.lat)
    }
  } catch {}

  // Fallback: our GeoNamesAtlas backend (150 embedded cities)
  try {
    const res = await fetch(`${CHART_URL}/api/geography/suggest?q=${encodeURIComponent(q)}&limit=8`)
    const data = await res.json()
    const names: string[] = data?.data?.data ?? data?.data ?? []
    if (Array.isArray(names) && names.length > 0) {
      // batch lookup via our backend
      const results = await Promise.all(names.slice(0,6).map(async name => {
        try {
          const r2 = await fetch(`${CHART_URL}/api/geography/lookup?place=${encodeURIComponent(name)}`)
          const d2 = await r2.json()
          const loc = d2?.data?.data ?? d2?.data ?? d2
          return { name: loc?.placeName ?? name, state: '', country: loc?.country ?? '', lat: loc?.latitude ?? 0, lng: loc?.longitude ?? 0 }
        } catch { return null }
      }))
      return results.filter((c): c is City => !!c && c.lat !== 0)
    }
  } catch {}
  return []
}

export default function CityAutocomplete({ value, onChange, placeholder = 'City, Country' }: Props) {
  const [query,    setQuery]    = useState(value)
  const [results,  setResults]  = useState<City[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(!!value)
  const [dropPos,  setDropPos]  = useState<{top:number;left:number;width:number}|null>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const dropRef   = useRef<HTMLDivElement>(null)
  const timer     = useRef<NodeJS.Timeout>()
  const isSelecting = useRef(false)

  const hide = useCallback(() => {
    if (dropRef.current) dropRef.current.style.display = 'none'
    isSelecting.current = true
    setOpen(false); setResults([])
    setTimeout(() => { isSelecting.current = false }, 300)
  }, [])

  const updatePos = useCallback(() => {
    if (!inputRef.current) return
    const r = inputRef.current.getBoundingClientRect()
    setDropPos({ top: r.bottom + window.scrollY + 2, left: r.left + window.scrollX, width: r.width })
  }, [])

  useEffect(() => { if (open && dropRef.current) dropRef.current.style.display = '' }, [open])
  useEffect(() => { if (open) updatePos() }, [open, updatePos])
  useEffect(() => {
    const fn = (e: Event) => {
      if (e.type === 'scroll') { hide(); return }
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) hide()
    }
    document.addEventListener('mousedown', fn)
    window.addEventListener('scroll', fn, true)
    window.addEventListener('resize', updatePos)
    return () => { document.removeEventListener('mousedown', fn); window.removeEventListener('scroll', fn, true); window.removeEventListener('resize', updatePos) }
  }, [hide, updatePos])

  useEffect(() => {
    clearTimeout(timer.current)
    setSelected(false)
    if (query.length < 2) { hide(); return }
    setLoading(true)
    timer.current = setTimeout(async () => {
      const cities = await searchCities(query)
      // deduplicate
      const seen = new Set<string>()
      const unique = cities.filter(c => {
        const k = `${c.name}|${c.country}`.toLowerCase()
        if (seen.has(k)) return false
        seen.add(k); return true
      })
      setResults(unique)
      if (unique.length > 0 && !isSelecting.current) { setOpen(true); updatePos() }
      else if (unique.length === 0) { hide() }
      setLoading(false)
    }, 300)
  }, [query])

  const select = (city: City) => {
    const label = [city.name, city.state, city.country].filter(Boolean).join(', ')
    if (dropRef.current) dropRef.current.style.display = 'none'
    isSelecting.current = true
    setResults([]); setOpen(false); setSelected(true)
    setQuery(label)
    onChange(label, city.lat, city.lng)
    setTimeout(() => { isSelecting.current = false }, 300)
  }

  return (
    <>
      <div style={{ position: 'relative' }}>
        <MapPin style={{
          position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
          width: '13px', height: '13px',
          color: selected ? '#16A34A' : 'var(--txm)',
          pointerEvents: 'none', flexShrink: 0
        }} />
        <input
          ref={inputRef}
          className="input"
          style={{ paddingLeft: '30px', paddingRight: '30px', width: '100%' }}
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); setSelected(false) }}
          onFocus={() => { if (!isSelecting.current && results.length > 0) { setOpen(true); updatePos() } }}
          placeholder={placeholder}
          autoComplete="off" autoCorrect="off" spellCheck={false}
        />
        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
          {loading
            ? <Loader2 style={{ width: '13px', height: '13px', color: 'var(--txm)', animation: 'spin 1s linear infinite' }} />
            : selected
              ? <CheckCircle2 style={{ width: '13px', height: '13px', color: '#16A34A' }} />
              : null
          }
        </div>
      </div>

      {/* Status hint */}
      {query.length >= 2 && !selected && (
        <div style={{ fontSize: '11px', marginTop: '3px',
          color: loading ? 'var(--txm)' : results.length === 0 && !loading ? '#DC2626' : 'var(--txm)' }}>
          {loading
            ? 'Searching...'
            : results.length === 0 && !open
              ? `No cities found for "${query}" — try a different spelling`
              : 'Select a city from the list below'}
        </div>
      )}
      {query.length > 0 && query.length < 2 && (
        <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '3px' }}>Type at least 2 letters</div>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && dropPos && (
        <div ref={dropRef} style={{
          position: 'fixed', top: dropPos.top, left: dropPos.left, width: Math.max(dropPos.width, 260),
          background: 'var(--surf)', border: '1.5px solid var(--gold)', borderRadius: '10px',
          boxShadow: '0 8px 32px rgba(0,0,0,.18)', zIndex: 999999, overflow: 'hidden',
        }}>
          <div style={{ padding: '6px 12px', fontSize: '10px', fontWeight: 700,
            color: 'var(--txm)', background: 'var(--bg2)', letterSpacing: '.04em',
            textTransform: 'uppercase', borderBottom: '1px solid var(--bd)' }}>
            {results.length} cities found — click to select
          </div>
          {results.map((city, i) => (
            <button key={i} type="button" onClick={() => select(city)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '9px 12px', border: 'none', background: 'none',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(196,146,42,.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <MapPin style={{ width: '11px', height: '11px', color: 'var(--gold)', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx)' }}>{city.name}</span>
                {(city.state || city.country) && (
                  <span style={{ fontSize: '11px', color: 'var(--txm)', marginLeft: '6px' }}>
                    {[city.state, city.country].filter(Boolean).join(', ')}
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
