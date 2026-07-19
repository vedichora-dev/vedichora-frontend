'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin } from 'lucide-react'

interface City { name: string; country: string; lat: number; lng: number; tz: string }
interface Props {
  value: string
  onChange: (city: string, lat?: number, lng?: number, tz?: string) => void
  placeholder?: string
}
interface DropPos { top: number; left: number; width: number }

export default function CityAutocomplete({ value, onChange, placeholder = 'City, Country' }: Props) {
  const [query,   setQuery]   = useState(value)
  const [results, setResults] = useState<City[]>([])
  const [open,    setOpen]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropPos, setDropPos] = useState<DropPos | null>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const timer       = useRef<NodeJS.Timeout>()
  const selecting   = useRef(false)   // guard against onFocus reopening during selection

  const updatePos = useCallback(() => {
    if (!inputRef.current) return
    const rect = inputRef.current.getBoundingClientRect()
    setDropPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width })
  }, [])

  useEffect(() => { if (open) updatePos() }, [open, updatePos])

  useEffect(() => {
    const close = (e: Event) => {
      if (e.type === 'scroll') { setOpen(false); return }
      const t = e.target as Node
      if (inputRef.current && !inputRef.current.contains(t)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', updatePos)
    return () => {
      document.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [updatePos])

  useEffect(() => {
    clearTimeout(timer.current)
    if (query.length < 2) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res  = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`)
        const data = await res.json()
        const cities: City[] = (data.features || [])
          .filter((f: any) => f.properties?.name)
          .slice(0, 6)
          .map((f: any) => ({
            name: f.properties.name || '', country: f.properties.country || '',
            lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0], tz: '',
          }))
        const seen = new Set<string>()
        const unique = cities.filter(c => { const k = c.name+'|'+c.country; if (seen.has(k)) return false; seen.add(k); return true })
        setResults(unique)
        if (unique.length > 0 && !selecting.current) { setOpen(true); updatePos() }
      } catch { setResults([]) }
      setLoading(false)
    }, 350)
  }, [query, updatePos])

  const select = (city: City) => {
    selecting.current = true           // block onFocus from reopening
    const label = `${city.name}${city.country ? ', ' + city.country : ''}`
    setResults([])                     // clear FIRST — onFocus checks results.length
    setOpen(false)
    setQuery(label)
    onChange(label, city.lat, city.lng, city.tz)
    // reset guard after a tick
    setTimeout(() => { selecting.current = false }, 300)
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
          style={{ paddingLeft: '28px', width: '100%' }}
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value) }}
          onFocus={() => {
            // Only reopen if not in the middle of a selection and results exist
            if (!selecting.current && results.length > 0) { setOpen(true); updatePos() }
          }}
          placeholder={placeholder}
          autoComplete="off"
        />
        {loading && (
          <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: 'var(--txm)' }}>…</div>
        )}
      </div>

      {open && results.length > 0 && dropPos && (
        <div style={{
          position: 'fixed',
          top: dropPos.top, left: dropPos.left, width: dropPos.width,
          background: 'var(--surf)', border: '1px solid var(--bd)', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,.18)', zIndex: 99999, overflow: 'hidden',
        }}>
          {results.map((city, i) => (
            <button
              key={i}
              type="button"
              data-city-option="true"
              onClick={() => select(city)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                width: '100%', padding: '9px 12px',
                border: 'none', background: 'none', cursor: 'pointer',
                textAlign: 'left', fontSize: '13px',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <MapPin style={{ width: '11px', height: '11px', color: 'var(--txm)', flexShrink: 0 }} />
              <div>
                <span style={{ color: 'var(--tx)', fontWeight: 500 }}>{city.name}</span>
                {city.country && (
                  <span style={{ color: 'var(--txm)', marginLeft: '4px', fontSize: '11px' }}>{city.country}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
