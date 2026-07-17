'use client'
import { useState, useEffect } from 'react'
import { RASI } from '@/lib/constants'
import { getHoroscopeAll } from '@/api'
import { useStore } from '@/store'

// Inline SVG paths for 12 rasis — hand-drawn style
const SVG: Record<string,string> = {
  aries:       '<path d="M12 9.5C10 7 8 5 7.5 3.5C7 2 8 1.5 9 2.5C10 3.5 11 6 12 9.5C13 6 14 3.5 15 2.5C16 1.5 17 2 16.5 3.5C16 5 14 7 12 9.5Z" fill="currentColor" opacity=".2"/><path d="M12 9.5C10 7 8 5 7.5 3.5C7 2 8 1.5 9 2.5C10 3.5 11 6 12 9.5C13 6 14 3.5 15 2.5C16 1.5 17 2 16.5 3.5C16 5 14 7 12 9.5Z"/><circle cx="12" cy="15" r="4.5"/>',
  taurus:      '<ellipse cx="12" cy="15" rx="5.5" ry="4.5" fill="currentColor" opacity=".15"/><ellipse cx="12" cy="15" rx="5.5" ry="4.5"/><path d="M6.5 8.5Q6 5 8.5 3.5Q11 2 12 5Q13 2 15.5 3.5Q18 5 17.5 8.5"/><path d="M6.5 8.5Q9 7 12 7.5Q15 7 17.5 8.5"/>',
  gemini:      '<line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="17" x2="20" y2="17"/>',
  cancer:      '<path d="M8 8.5A4.5 4.5 0 0 1 12 4a4.5 4.5 0 0 1 0 9 4.5 4.5 0 0 0 0 9 4.5 4.5 0 0 0 4-4.5"/><circle cx="8" cy="8.5" r="1.5" fill="currentColor"/><circle cx="16" cy="15.5" r="1.5" fill="currentColor"/>',
  leo:         '<circle cx="12" cy="9" r="4" fill="currentColor" opacity=".15"/><circle cx="12" cy="9" r="4"/><path d="M12 13Q13.5 18 17 18.5Q20 19 20 16Q20 13 17 13"/><path d="M4 5Q7 2 9.5 5.5"/>',
  virgo:       '<path d="M6 2V15Q6 20 10 20"/><path d="M10 2V13Q10 18 14 18Q18 18 18 13V2"/><path d="M14 18Q14 21 12 22"/>',
  libra:       '<line x1="3" y1="20" x2="21" y2="20"/><line x1="12" y1="20" x2="12" y2="12"/><path d="M6 12Q12 5 18 12"/><circle cx="6" cy="12" r="2" fill="currentColor" opacity=".3"/><circle cx="18" cy="12" r="2" fill="currentColor" opacity=".3"/>',
  scorpio:     '<path d="M3 6Q3 3 7 3Q11 3 11 7V13"/><path d="M11 3Q11 1 14 1Q17 1 17 4Q17 7 14 7V13"/><path d="M14 13L19 18L22 15"/>',
  sagittarius: '<line x1="4" y1="20" x2="20" y2="4"/><path d="M11 4H20V13"/><circle cx="4" cy="20" r="2" fill="currentColor" opacity=".3"/>',
  capricorn:   '<path d="M4 19Q4 10 8 8Q12 6 12 11Q12 15 8 15Q4 15 4 11"/><path d="M12 11Q16 6 18 11Q20 16 18 19"/><path d="M18 15Q20 17 20 20"/>',
  aquarius:    '<path d="M2 8Q5 4 8 8Q11 12 14 8Q17 4 22 8"/><path d="M2 16Q5 12 8 16Q11 20 14 16Q17 12 22 16"/>',
  pisces:      '<line x1="7" y1="3" x2="7" y2="21"/><line x1="17" y1="3" x2="17" y2="21"/><path d="M4 7Q7 9 10 7"/><path d="M4 17Q7 15 10 17"/><path d="M14 7Q17 9 20 7"/><path d="M14 17Q17 15 20 17"/>',
}

// Rasi names by language — inline so strip re-renders on language change
const NAMES: Record<string,string[]> = {
  en: ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'],
  ta: ['மேஷம்','ரிஷபம்','மிதுனம்','கர்கடகம்','சிம்மம்','கன்னி','துலாம்','விருச்சிகம்','தனுசு','மகரம்','கும்பம்','மீனம்'],
  hi: ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'],
  te: ['మేషం','వృషభం','మిథున','కర్కాటకం','సింహం','కన్య','తుల','వృశ్చికం','ధనుస్సు','మకరం','కుంభం','మీనం'],
  ml: ['മേടം','ഇടവം','മിഥുനം','കർക്കടകം','ചിങ്ങം','കന്നി','തുലാം','വൃശ്ചികം','ധനു','മകരം','കുംഭം','മീനം'],
  kn: ['ಮೇಷ','ವೃಷಭ','ಮಿಥುನ','ಕರ್ಕಾಟಕ','ಸಿಂಹ','ಕನ್ಯಾ','ತುಲಾ','ವೃಶ್ಚಿಕ','ಧನು','ಮಕರ','ಕುಂಭ','ಮೀನ'],
}

interface Props { selected: number; onSelect: (i: number) => void }

export default function ZodiacStrip({ selected, onSelect }: Props) {
  const { language } = useStore()
  const [scores, setScores] = useState<number[]>(RASI.map(r => r.sc.Daily))

  useEffect(() => {
    getHoroscopeAll().then(data => {
      if (Array.isArray(data) && data.length)
        setScores(data.map((d: any) => d.overallScore || d.score || 70))
    })
  }, [])

  const names = NAMES[language] || NAMES.en
  const dotCol = (s: number) => s >= 75 ? '#4ADE80' : s >= 60 ? '#FBBF24' : '#F87171'

  return (
    <div style={{
      background:'var(--strip,#3A1414)',
      borderBottom:'1px solid rgba(255,255,255,.08)',
      width:'100%',
    }}>
      {/* Grid of exactly 12 equal columns — full width always */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'repeat(12,1fr)',
        width:'100%',
      }}>
        {RASI.map((r, i) => {
          const active = i === selected
          const score  = scores[i] || r.sc.Daily
          const svgPath = SVG[r.ic] || ''
          return (
            <button key={r.ic} onClick={() => onSelect(i)}
              style={{
                display:'flex', flexDirection:'column', alignItems:'center',
                gap:'3px', padding:'8px 4px', border:'none', cursor:'pointer',
                borderBottom: active ? '2px solid var(--strip-sel,#D4A52B)' : '2px solid transparent',
                background: active ? 'var(--strip-chip,rgba(255,255,255,.08))' : 'transparent',
                color: active ? 'var(--strip-sel,#D4A52B)' : 'var(--strip-tx,#E8C97A)',
                transition:'all .15s',
                minWidth:0,
              }}>
              <svg viewBox="0 0 24 24" width={18} height={18}
                fill="none" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"
                dangerouslySetInnerHTML={{ __html: svgPath }} />
              <span style={{
                fontSize:'9.5px', fontWeight:600, whiteSpace:'nowrap',
                overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%',
                lineHeight:1.2,
              }}>{names[i]}</span>
              <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:dotCol(score), flexShrink:0 }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
