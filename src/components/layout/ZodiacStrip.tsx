'use client'
import { useState, useEffect } from 'react'
import { RASI } from '@/lib/constants'
import { getHoroscopeAll } from '@/api'
import { scoreDot } from '@/lib/utils'

interface Props {
  selected: number
  onSelect: (i: number) => void
}

export default function ZodiacStrip({ selected, onSelect }: Props) {
  const [scores, setScores] = useState<number[]>(RASI.map(() => 70))

  useEffect(() => {
    getHoroscopeAll().then(data => {
      if (data?.length) setScores(data.map((d: any) => d.overallScore || d.score || 70))
    })
  }, [])

  return (
    <div className="sticky top-14 z-30 bg-white border-b border-border shadow-sm">
      <div className="flex overflow-x-auto scrollbar-hide">
        {RASI.map((r, i) => (
          <button
            key={r.ic}
            onClick={() => onSelect(i)}
            className={`flex flex-col items-center gap-1 px-3 py-2.5 shrink-0 transition-all border-b-2 ${
              selected === i
                ? 'border-gold bg-gold/5 text-maroon'
                : 'border-transparent text-gray-500 hover:text-maroon hover:bg-gray-50'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${scoreDot(scores[i])}`} />
            <span className="text-xs font-semibold whitespace-nowrap">{r.vd}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
