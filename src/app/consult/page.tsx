'use client'
import { useState, useEffect } from 'react'
import { getAstrologers } from '@/api'
import { SAMPLE_ASTROLOGERS } from '@/lib/constants'
import AstrologerCard from '@/components/consult/AstrologerCard'
import { Search, SlidersHorizontal } from 'lucide-react'

export default function ConsultPage() {
  const [astros, setAstros] = useState(SAMPLE_ASTROLOGERS)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState({ specialty:'', online: false })

  useEffect(() => {
    getAstrologers().then(data => { if (data?.length) setAstros(data) })
  }, [])

  const filtered = astros.filter(a => {
    if (search && !a.displayName.toLowerCase().includes(search.toLowerCase())) return false
    if (filter.specialty && !a.specialties?.includes(filter.specialty)) return false
    if (filter.online && !a.isOnline) return false
    return true
  })

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="page-header">
        <h1>Consult an Astrologer</h1>
        <p>Talk to expert Jyotishis · First 10 minutes FREE</p>
      </div>

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-maroon-dark to-maroon rounded-2xl p-5 mb-8 flex items-center gap-4 flex-wrap">
        <div className="text-3xl">🔮</div>
        <div className="flex-1">
          <div className="font-cinzel font-bold text-white text-lg">First consultation FREE</div>
          <div className="text-white/50 text-sm mt-0.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block mr-1.5 animate-pulse" />
            {astros.filter(a=>a.isOnline).length} astrologers online now · Chat · Voice · Video
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Search astrologer…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <select className="select w-44" value={filter.specialty} onChange={e=>setFilter(f=>({...f,specialty:e.target.value}))}>
          <option value="">All specialties</option>
          {['Vedic','KP','Tarot','Numerology','Vastu','Nadi','Prashna'].map(s=><option key={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 bg-white border border-border rounded-lg px-3.5 py-2.5">
          <input type="checkbox" checked={filter.online} onChange={e=>setFilter(f=>({...f,online:e.target.checked}))} className="accent-gold" />
          Online only
        </label>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(a => <AstrologerCard key={a.userId} a={a} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <div className="font-semibold">No astrologers found</div>
          <div className="text-sm mt-1">Try changing your filters</div>
        </div>
      )}
    </div>
  )
}
