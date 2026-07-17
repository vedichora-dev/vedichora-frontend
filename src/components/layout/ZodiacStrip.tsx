'use client'
import { useEffect, useState } from 'react'
import { RASI } from '@/lib/constants'
import { getHoroscopeAll } from '@/api'
import { useStore } from '@/store'

const SYM = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']

const N: Record<string, string[]> = {
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
    getHoroscopeAll().then((d: any) => {
      if (Array.isArray(d) && d.length) setScores(d.map((x: any) => x.overallScore || x.score || 70))
    }).catch(() => {})
  }, [])

  const names = N[language] || N.en
  const dot = (s: number) => s >= 75 ? '#4ADE80' : s >= 60 ? '#FBBF24' : '#F87171'

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      background: 'var(--strip,#3A1414)',
      borderBottom: '2px solid rgba(212,165,43,.2)',
    }}>
      {RASI.map((r, i) => {
        const active = i === selected
        return (
          <button
            key={`${r.ic}-${language}`}
            onClick={() => onSelect(i)}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              padding: '7px 0 5px',
              background: active ? 'rgba(212,165,43,.18)' : 'transparent',
              border: 'none',
              borderBottom: active ? '2.5px solid #D4A52B' : '2.5px solid transparent',
              cursor: 'pointer',
              color: active ? '#D4A52B' : 'rgba(232,201,122,.75)',
              transition: 'all .15s',
            }}
          >
            <span style={{fontSize:'15px', lineHeight:1}}>{SYM[i]}</span>
            <span style={{
              fontSize:'9px', fontWeight:600, lineHeight:1.2,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              width:'100%', textAlign:'center', padding:'0 1px',
              display:'block',
            }}>{names[i]}</span>
            <span style={{
              width:'4px', height:'4px', borderRadius:'50%',
              background: dot(scores[i] || 70), display:'block',
            }}/>
          </button>
        )
      })}
    </div>
  )
}
