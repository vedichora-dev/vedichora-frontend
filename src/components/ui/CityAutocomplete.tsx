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
  utcOffset: number
  display: string
}

interface Props {
  value: string
  onChange: (city: string, lat?: number, lng?: number) => void
  placeholder?: string
}

const CHART_URL = process.env.NEXT_PUBLIC_CHART_URL ||
  'https://enchanting-dedication-production.up.railway.app'

// Single call to our backend — which proxies Photon server-side
// No CORS issues, worldwide coverage, full city data in one request
async function searchCities(q: string): Promise<CityResult[]> {
  const res = await fetch(
    `${CHART_URL}/api/geography/suggest?q=${encodeURIComponent(q)}&limit=8`,
    { cache: 'no-store' }
  )
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const list = data?.data?.data ?? data?.data ?? []
  if (!Array.isArray(list)) return []
  // New format returns objects; old format returns strings — handle both
  return list
    .filter((c: any) => typeof c === 'object' ? c.lat : false)
    .map((c: any) => ({
      name: c.name ?? '',
      state: c.state ?? '',
      country: c.country ?? '',
      countryCode: c.countryCode ?? '',
      lat: c.lat ?? 0,
      lng: c.lng ?? 0,
      utcOffset: c.utcOffset ?? 5.5,
      display: c.display ?? [c.name, c.state, c.country].filter(Boolean).join(', ')
    }))
}

export default function CityAutocomplete({
  value, onChange, placeholder = 'Type city name...'
}: Props) {
  const [query,    setQuery]    = useState(value)
  const [results,  setResults]  = useState<CityResult[]>([])
  const [open,     setOpen]     = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState(false)
  const [errMsg,   setErrMsg]   = useState('')
  const [dropPos,  setDropPos]  = useState<{top:number;left:number;width:number}|null>(null)

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

  // Close on outside click or scroll
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

  // Debounced search
  useEffect(() => {
    clearTimeout(timerRef.current)
    setSelected(false)
    setErrMsg('')

    if (query.length < 2) {
      closeDropdown()
      setLoading(false)
      return
    }

    setLoading(true)
    timerRef.current = setTimeout(async () => {
      try {
        const cities = await searchCities(query)
        setResults(cities)
        if (cities.length > 0 && !picking.current) {
          setOpen(true)
        } else if (cities.length === 0) {
          closeDropdown()
          setErrMsg(`No cities found for "${query}"`)
        }
      } catch (err) {
        closeDropdown()
        setErrMsg('Search unavailable — type city name and try again')
      }
      setLoading(false)
    }, 350)
  }, [query])

  const select = (city: CityResult) => {
    picking.current = true
    if (dropRef.current) dropRef.current.style.display = 'none'
    setOpen(false)
    setResults([])
    setQuery(city.display)
    setSelected(true)
    setErrMsg('')
    onChange(city.display, city.lat, city.lng)
    setTimeout(() => { picking.current = false }, 300)
    inputRef.current?.blur()
  }

  const iconColor = selected ? '#16A34A' : loading ? 'var(--gold)' : 'var(--txm)'

  return (
    <div style={{ width: '100%' }}>

      {/* Input field */}
      <div style={{ position: 'relative' }}>
        <MapPin style={{
          position: 'absolute', left: '10px', top: '50%',
          transform: 'translateY(-50%)', width: '13px', height: '13px',
          color: iconColor, pointerEvents: 'none', zIndex: 1
        }} />
        <input
          ref={inputRef}
          className="input"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setSelected(false)
            onChange(e.target.value) // clear lat/lng while typing
          }}
          onFocus={() => {
            if (results.length > 0 && !picking.current) {
              setOpen(true); calcPos()
            }
          }}
          placeholder={placeholder}
          style={{ paddingLeft: '30px', paddingRight: '30px', width: '100%' }}
          autoComplete="off"
          spellCheck={false}
        />
        <div style={{
          position: 'absolute', right: '8px', top: '50%',
          transform: 'translateY(-50%)', pointerEvents: 'none'
        }}>
          {loading   && (
            <Loader2 style={{ width: '14px', height: '14px', color: 'var(--gold)',
              animation: 'spin 1s linear infinite' }} />
          )}
          {!loading && selected && (
            <CheckCircle2 style={{ width: '14px', height: '14px', color: '#16A34A' }} />
          )}
          {!loading && !selected && errMsg && (
            <AlertCircle style={{ width: '14px', height: '14px', color: '#DC2626' }} />
          )}
        </div>
      </div>

      {/* Status line */}
      <div style={{ fontSize: '11px', marginTop: '3px', minHeight: '15px',
        color: selected ? '#16A34A' : errMsg ? '#DC2626' : 'var(--txm)' }}>
        {selected  ? '✓ City confirmed'
         : loading  ? 'Searching worldwide...'
         : errMsg   ? errMsg
         : results.length > 0 && open ? '↓ Select a city from the list'
         : query.length >= 2 ? ''
         : query.length > 0  ? 'Type at least 2 letters'
         : ''}
      </div>

      {/* Dropdown — position:fixed to escape any overflow:hidden parents */}
      {open && results.length > 0 && dropPos && (
        <div
          ref={dropRef}
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: Math.max(dropPos.width, 300),
            maxHeight: '280px',
            overflowY: 'auto',
            background: 'var(--surf)',
            border: '1.5px solid var(--gold)',
            borderRadius: '10px',
            boxShadow: '0 12px 40px rgba(0,0,0,.22)',
            zIndex: 999999,
          }}
        >
          <div style={{
            padding: '6px 12px', fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '.05em',
            color: 'var(--gold)', background: 'rgba(196,146,42,.06)',
            borderBottom: '1px solid var(--bd)', position: 'sticky', top: 0
          }}>
            {results.length} cities found — click to select
          </div>

          {results.map((city, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={e => { e.preventDefault(); select(city) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                width: '100%', padding: '10px 12px',
                border: 'none',
                borderBottom: i < results.length - 1 ? '1px solid var(--bd)' : 'none',
                background: 'none', cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(196,146,42,.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <MapPin style={{ width: '12px', height: '12px', color: 'var(--gold)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tx)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {city.name}
                  {city.countryCode && (
                    <span style={{ fontSize: '10px', color: 'var(--txm)', marginLeft: '6px',
                      fontWeight: 400, background: 'var(--bg2)', padding: '1px 5px',
                      borderRadius: '4px' }}>
                      {city.countryCode}
                    </span>
                  )}
                </div>
                {(city.state || city.country) && (
                  <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '1px',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {[city.state, city.country].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--txm)', flexShrink: 0,
                fontVariantNumeric: 'tabular-nums' }}>
                {city.lat.toFixed(1)}° {city.lng.toFixed(1)}°
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
