'use client'
import { useEffect, useState } from 'react'
import { RASI } from '@/lib/constants'
import { getHoroscopeAll } from '@/api'
import { useStore } from '@/store'

const SYMBOLS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']

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
  ar: ['الحمل','الثور','الجوزاء','السرطان','الأسد','العذراء','الميزان','العقرب','القوس','الجدي','الدلو','الحوت'],
  'zh-Hans': ['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'],
}

interface Props { selected: number; onSelect: (i: number) => void }

function Strip({ selected, onSelect, language }: Props & { language: string }) {
  const [scores, setScores] = useState<number[]>(RASI.map(r => r.sc.Daily))

  useEffect(() => {
    getHoroscopeAll().then((data: any) => {
      if (Array.isArray(data) && data.length)
        setScores(data.map((d: any) => d.overallScore || d.score || 70))
    }).catch(() => {})
  }, [])

  const names = NAMES[language] || NAMES.en
  const dot = (s: number) => s >= 75 ? '#4ADE80' : s >= 60 ? '#FBBF24' : '#F87171'

  return (
    <div style={{
      background: 'var(--strip,#3A1414)',
      borderBottom: '2px solid rgba(212,165,43,.25)',
      width: '100%',
      display: 'block',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12,1fr)',
        width: '100%',
      }}>
        {RASI.map((r, i) => {
          const active = i === selected
          return (
            <button key={r.ic} onClick={() => onSelect(i)}
              aria-label={names[i]} aria-pressed={active}
              style={{
                all: 'unset', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '2px',
                padding: '7px 1px 6px', cursor: 'pointer',
                borderBottom: active ? '2.5px solid var(--strip-sel,#D4A52B)' : '2.5px solid transparent',
                background: active ? 'rgba(212,165,43,.15)' : 'transparent',
                color: active ? 'var(--strip-sel,#D4A52B)' : 'var(--strip-tx,rgba(232,201,122,.75))',
                transition: 'all .15s', boxSizing: 'border-box',
              }}>
              <span style={{ fontSize: '16px', lineHeight: 1 }}>{SYMBOLS[i]}</span>
              <span style={{
                fontSize: '9px', fontWeight: 600, lineHeight: 1.2,
                textAlign: 'center', maxWidth: '100%',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                padding: '0 1px',
              }}>{names[i]}</span>
              <span style={{
                width: '4px', height: '4px', borderRadius: '50%',
                background: dot(scores[i] || r.sc.Daily), display: 'block', flexShrink: 0,
              }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Wrapper uses key={language} — forces full remount when language changes
export default function ZodiacStrip({ selected, onSelect }: Props) {
  const { language } = useStore()
  return <Strip key={language} selected={selected} onSelect={onSelect} language={language} />
}
