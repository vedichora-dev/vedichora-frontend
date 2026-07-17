'use client'
import { useState, useEffect } from 'react'
import { RASI } from '@/lib/constants'
import { getHoroscopeAll } from '@/api'

// Inline SVG paths for all 12 rasis (hand-drawn, from original VedicHora design)
const RASI_PATHS: Record<string, string> = {
  aries: `<ellipse cx="12" cy="14" rx="5" ry="4.5" fill="currentColor" opacity=".15"/><ellipse cx="12" cy="14" rx="5" ry="4.5"/><path d="M12 9.5C12 9.5 9 7 7.5 4.5C7 3.5 7.5 2.5 8.5 2.5C9.5 2.5 10 3.5 10.5 4.5L12 9.5Z"/><path d="M12 9.5C12 9.5 15 7 16.5 4.5C17 3.5 16.5 2.5 15.5 2.5C14.5 2.5 14 3.5 13.5 4.5L12 9.5Z"/>`,
  taurus: `<ellipse cx="12" cy="14.5" rx="5.5" ry="4.5" fill="currentColor" opacity=".12"/><ellipse cx="12" cy="14.5" rx="5.5" ry="4.5"/><path d="M6.5 8C6.5 8 5 5 7 3.5C9 2 10.5 4 12 4C13.5 4 15 2 17 3.5C19 5 17.5 8 17.5 8"/><path d="M6.5 8 Q8 6 12 7 Q16 6 17.5 8"/>`,
  gemini: `<line x1="8" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="16" y2="21"/><line x1="5" y1="8" x2="19" y2="8"/><line x1="5" y1="16" x2="19" y2="16"/>`,
  cancer: `<circle cx="9" cy="12" r="3.5"/><circle cx="15" cy="12" r="3.5"/><path d="M9 8.5 Q12 4 15 8.5"/><path d="M9 15.5 Q12 20 15 15.5"/>`,
  leo: `<circle cx="12" cy="10" r="4" fill="currentColor" opacity=".15"/><circle cx="12" cy="10" r="4"/><path d="M12 14 Q14 18 17 18 Q20 18 20 15 Q20 12 17 12"/><path d="M5 6 Q8 4 10 7"/>`,
  virgo: `<path d="M6 3 L6 14 Q6 18 10 18"/><path d="M10 3 L10 12 Q10 16 14 16 Q18 16 18 12 L18 3"/><path d="M14 16 Q14 20 12 21"/>`,
  libra: `<line x1="4" y1="19" x2="20" y2="19"/><line x1="12" y1="19" x2="12" y2="13"/><path d="M6 13 Q12 7 18 13"/><circle cx="6" cy="13" r="1.5"/><circle cx="18" cy="13" r="1.5"/>`,
  scorpio: `<path d="M3 9 Q3 5 7 5 Q11 5 11 9 L11 14"/><path d="M11 5 Q11 3 14 3 Q17 3 17 6 Q17 9 14 9 L14 14"/><path d="M14 14 L18 18 L21 15"/>`,
  sagittarius: `<line x1="5" y1="19" x2="19" y2="5"/><path d="M11 5 L19 5 L19 13"/><circle cx="5" cy="19" r="1.5" fill="currentColor"/>`,
  capricorn: `<path d="M4 18 Q4 10 8 8 Q12 6 12 10 Q12 14 8 14 Q4 14 4 10"/><path d="M12 10 Q16 6 18 10 Q20 14 18 18"/><path d="M18 14 Q20 16 20 18"/>`,
  aquarius: `<path d="M3 8 Q6 5 9 8 Q12 11 15 8 Q18 5 21 8"/><path d="M3 15 Q6 12 9 15 Q12 18 15 15 Q18 12 21 15"/>`,
  pisces: `<path d="M7 4 Q7 12 7 20"/><path d="M17 4 Q17 12 17 20"/><path d="M4 8 Q7 10 10 8"/><path d="M4 16 Q7 14 10 16"/><path d="M14 8 Q17 10 20 8"/><path d="M14 16 Q17 14 20 16"/>`,
}

interface Props {
  selected: number
  onSelect: (i: number) => void
  period?: 'Daily'|'Weekly'|'Monthly'|'Yearly'
}

export default function ZodiacStrip({ selected, onSelect, period = 'Daily' }: Props) {
  const [scores, setScores] = useState<number[]>(RASI.map(r => r.sc.Daily))

  useEffect(() => {
    getHoroscopeAll().then(data => {
      if (data?.length) setScores(data.map((d: any) => d.overallScore || d.score || 70))
      else setScores(RASI.map(r => r.sc[period as keyof typeof r.sc] || 70))
    })
  }, [period])

  const dotColor = (s: number) => s >= 75 ? '#4ADE80' : s >= 60 ? '#FBBF24' : '#F87171'

  return (
    <div style={{background:'var(--strip, #3A1414)', borderBottom:'1px solid rgba(255,255,255,.1)'}}
      className="overflow-x-auto">
      <div className="flex min-w-max mx-auto px-2">
        {RASI.map((r, i) => {
          const active = i === selected
          const score = scores[i] || r.sc.Daily
          const svgPath = RASI_PATHS[r.ic] || ''
          return (
            <button key={r.ic} onClick={() => onSelect(i)}
              className="flex flex-col items-center gap-1 px-3 py-2.5 transition-all relative"
              style={{
                color: active ? 'var(--strip-sel, #D4A52B)' : 'var(--strip-tx, #E8C97A)',
                background: active ? 'var(--strip-chip, #4D1C1C)' : 'transparent',
                borderBottom: active ? '2px solid var(--strip-sel, #D4A52B)' : '2px solid transparent',
                minWidth: '60px',
              }}>
              {/* SVG icon */}
              <svg viewBox="0 0 24 24" width={20} height={20}
                fill="none" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"
                dangerouslySetInnerHTML={{ __html: svgPath }} />
              {/* Name */}
              <span className="text-xs font-semibold whitespace-nowrap" style={{fontSize:'10px'}}>{r.vd}</span>
              {/* Score dot */}
              <div className="w-1.5 h-1.5 rounded-full" style={{background: dotColor(score)}} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
