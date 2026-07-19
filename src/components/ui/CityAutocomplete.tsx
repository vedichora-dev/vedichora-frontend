'use client'
import { useState, useRef, useEffect } from 'react'
import { MapPin } from 'lucide-react'

interface City { name: string; country: string; lat: number; lng: number; tz: string }

interface Props {
  value: string
  onChange: (city: string, lat?: number, lng?: number, tz?: string) => void
  placeholder?: string
}

export default function CityAutocomplete({ value, onChange, placeholder='City, Country' }: Props) {
  const [query, setQuery]     = useState(value)
  const [results, setResults] = useState<City[]>([])
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const timer = useRef<NodeJS.Timeout>()
  const ref   = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', h)
    return () => document.removeEventListener('click', h)
  }, [])

  // Debounced search via Geonames (free, no key needed for basic)
  useEffect(() => {
    clearTimeout(timer.current)
    if (query.length < 2) { setResults([]); return }
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        // Use photon API (OpenStreetMap powered, free, no key)
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`
        )
        const data = await res.json()
        const cities: City[] = (data.features || [])
          .filter((f: any) => f.properties?.type === 'city' || f.properties?.type === 'town' || f.properties?.type === 'village' || f.properties?.name)
          .slice(0, 6)
          .map((f: any) => ({
            name: f.properties.name || '',
            country: f.properties.country || '',
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            tz: '',
          }))
        // Deduplicate by name+country
        const seen = new Set<string>()
        const unique = cities.filter(c => {
          const key = c.name + '|' + c.country
          if (seen.has(key)) return false
          seen.add(key); return true
        })
        setResults(unique)
        setOpen(unique.length > 0)
      } catch {
        setResults([])
      }
      setLoading(false)
    }, 350)
  }, [query])

  const select = (city: City) => {
    const label = `${city.name}${city.country ? ', ' + city.country : ''}`
    setQuery(label)
    setOpen(false)
    setResults([])  // Clear results so onFocus can't reopen
    onChange(label, city.lat, city.lng, city.tz)
  }

  return (
    <div ref={ref} style={{position:'relative'}}>
      <div style={{position:'relative'}}>
        <MapPin style={{position:'absolute',left:'9px',top:'50%',transform:'translateY(-50%)',
          width:'12px',height:'12px',color:'var(--txm)',pointerEvents:'none'}}/>
        <input
          className="input"
          style={{paddingLeft:'28px',width:'100%'}}
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value) }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
        />
        {loading && (
          <div style={{position:'absolute',right:'8px',top:'50%',transform:'translateY(-50%)',
            fontSize:'11px',color:'var(--txm)'}}>…</div>
        )}
      </div>
      {open && results.length > 0 && (
        <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,
          background:'var(--surf)',border:'1px solid var(--bd)',borderRadius:'10px',
          boxShadow:'0 8px 24px rgba(0,0,0,.12)',zIndex:9999,overflow:'hidden'}}>
          {results.map((city, i) => (
            <button key={i} onMouseDown={() => select(city)}
              style={{display:'flex',alignItems:'center',gap:'8px',width:'100%',
                padding:'9px 12px',border:'none',background:'none',cursor:'pointer',
                textAlign:'left',fontSize:'13px'}}
              onMouseEnter={e=>e.currentTarget.style.background='var(--bg2)'}
              onMouseLeave={e=>e.currentTarget.style.background='none'}>
              <MapPin style={{width:'11px',height:'11px',color:'var(--txm)',flexShrink:0}}/>
              <div>
                <span style={{color:'var(--tx)',fontWeight:500}}>{city.name}</span>
                {city.country && (
                  <span style={{color:'var(--txm)',marginLeft:'4px',fontSize:'11px'}}>
                    {city.country}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
