'use client'
import { useEffect, useState } from 'react'
import { RASI } from '@/lib/constants'
import { getHoroscopeAll } from '@/api'
import { useStore } from '@/store'

// Proper zodiac Unicode symbols — used worldwide for Vedic/Indian astrology
// These are the same symbols as in traditional panchang / Indian almanac software
const SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']

// Sign names per language — inline for reactivity
const NAMES: Record<string, string[]> = {
  en: ['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'],
  ta: ['மேஷம்','ரிஷபம்','மிதுனம்','கர்கடகம்','சிம்மம்','கன்னி','துலாம்','விருச்சிகம்','தனுசு','மகரம்','கும்பம்','மீனம்'],
  hi: ['मेष','वृषभ','मिथुन','कर्क','सिंह','कन्या','तुला','वृश्चिक','धनु','मकर','कुम्भ','मीन'],
  te: ['మేషం','వృషభం','మిథున','కర్కాటకం','సింహం','కన్య','తుల','వృశ్చికం','ధనుస్సు','మకరం','కుంభం','మీనం'],
  ml: ['മേടം','ഇടവം','മിഥുനം','കർക്കടകം','ചിങ്ങം','കന്നി','തുലാം','വൃശ്ചികം','ധനു','മകരം','കുംഭം','മീനം'],
  kn: ['ಮೇಷ','ವೃಷಭ','ಮಿಥುನ','ಕರ್ಕಾಟಕ','ಸಿಂಹ','ಕನ್ಯಾ','ತುಲಾ','ವೃಶ್ಚಿಕ','ಧನು','ಮಕರ','ಕುಂಭ','ಮೀನ'],
  sa: ['मेषः','वृषभः','मिथुनः','कर्कटः','सिंहः','कन्याः','तुलाः','वृश्चिकः','धनुः','मकरः','कुम्भः','मीनः'],
  fr: ['Bélier','Taureau','Gémeaux','Cancer','Lion','Vierge','Balance','Scorpion','Sagittaire','Capricorne','Verseau','Poissons'],
  de: ['Widder','Stier','Zwillinge','Krebs','Löwe','Jungfrau','Waage','Skorpion','Schütze','Steinbock','Wassermann','Fische'],
  es: ['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'],
}

interface Props { selected: number; onSelect: (i: number) => void }

export default function ZodiacStrip({ selected, onSelect }: Props) {
  const { language } = useStore()
  const [scores, setScores] = useState<number[]>(RASI.map(r => r.sc.Daily))

  useEffect(() => {
    getHoroscopeAll().then((data: any) => {
      if (Array.isArray(data) && data.length)
        setScores(data.map((d: any) => d.overallScore || d.score || 70))
    }).catch(() => {})
  }, [])

  const names = NAMES[language] || NAMES.en
  const dotCol = (s: number) => s >= 75 ? '#4ADE80' : s >= 60 ? '#FBBF24' : '#F87171'

  return (
    <div style={{
      background: 'var(--strip,#3A1414)',
      borderBottom: '2px solid rgba(212,165,43,.3)',
      width: '100%',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12,1fr)',
        width: '100%',
        maxWidth: '100%',
      }}>
        {RASI.map((r, i) => {
          const active = i === selected
          const score  = scores[i] || r.sc.Daily
          return (
            <button
              key={r.ic}
              onClick={() => onSelect(i)}
              aria-label={names[i]}
              aria-pressed={active}
              style={{
                all: 'unset',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: '7px 2px 6px',
                cursor: 'pointer',
                borderBottom: active
                  ? '2.5px solid var(--strip-sel,#D4A52B)'
                  : '2.5px solid transparent',
                background: active
                  ? 'rgba(212,165,43,.12)'
                  : 'transparent',
                color: active
                  ? 'var(--strip-sel,#D4A52B)'
                  : 'var(--strip-tx,rgba(232,201,122,.7))',
                transition: 'all .15s',
                boxSizing: 'border-box',
              }}
            >
              {/* Unicode zodiac symbol — large, visible */}
              <span style={{
                fontSize: '17px',
                lineHeight: 1,
                opacity: active ? 1 : 0.85,
              }}>{SYMBOLS[i]}</span>

              {/* Sign name in current language */}
              <span style={{
                fontSize: '9px',
                fontWeight: 600,
                letterSpacing: '.01em',
                lineHeight: 1.2,
                textAlign: 'center',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                padding: '0 2px',
              }}>{names[i]}</span>

              {/* Score dot */}
              <span style={{
                width: '4px', height: '4px',
                borderRadius: '50%',
                background: dotCol(score),
                flexShrink: 0,
                display: 'block',
              }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
