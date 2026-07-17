'use client'
import { useEffect, useState } from 'react'
import { RASI } from '@/lib/constants'
import { getHoroscopeAll } from '@/api'
import { useStore } from '@/store'

// Hand-crafted SVG paths for all 12 Indian Vedic rasi — traditional animal/object symbols
const RASI_SVG: Record<string, string> = {
  'mesha': '<path d="M12 18c-3.3 0-6-2-6-5 0-1.5.6-2.8 1.6-3.8L6 7.5C4.8 6.4 4 4.8 4 3h2c0 1.1.5 2.1 1.3 2.8L9 7.5c.9-.3 1.9-.5 3-.5s2.1.2 3 .5l1.7-1.7C17.5 5.1 18 4.1 18 3h2c0 1.8-.8 3.4-2 4.5l-1.6 1.7C17.4 10.2 18 11.5 18 13c0 3-2.7 5-6 5zm-2-5.5c0 .8.9 1.5 2 1.5s2-.7 2-1.5-.9-1.5-2-1.5-2 .7-2 1.5z" fill="currentColor"/>',
  'vrishabha': '<path d="M5 4h2v3h10V4h2v4c0 1-.6 1.9-1.5 2.3L19 14h-2l-1.5-3.5c-.5.3-1 .5-1.5.5h-4c-.5 0-1-.2-1.5-.5L7 14H5l1.5-3.7C5.6 9.9 5 9 5 8V4zm4 5h6c.6 0 1-.4 1-1H8c0 .6.4 1 1 1zm-1 7c0-1.1 1.8-2 4-2s4 .9 4 2v2H8v-2z" fill="currentColor"/>',
  'mithuna': '<path d="M8 3a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4zM6 8c-1.1 0-2 .9-2 2v4h2v6h4v-6h.5v6h4v-6H15v-4c0-1.1-.9-2-2-2H6zm8 0c-1.1 0-2 .9-2 2v.5c.6-.3 1.3-.5 2-.5h2c.7 0 1.4.2 2 .5V10c0-1.1-.9-2-2-2h-2z" fill="currentColor"/>',
  'karka': '<path d="M12 10c-2.2 0-4 1.3-4 4s1.8 4 4 4 4-1.3 4-4-1.8-4-4-4zm0 6c-1.1 0-2-.7-2-2s.9-2 2-2 2 .7 2 2-.9 2-2 2zM7 9c0-1.1-.9-2-2-2S3 7.9 3 9s.9 2 2 2c.4 0 .7-.1 1-.3L7.5 13H9l-1-2.7C8.6 9.9 9 9.5 9 9c0-.4-.1-.7-.3-1H7zm10 0c0-1.1-.9-2-2-2s-2 .9-2 2c0 .5.4.9.7 1.3L12.5 13h1.5l1.3-2.3c.5.2.8.3 1.2.3 1.1 0 2-.9 2-2zM7 17c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2c0-.4-.1-.7-.3-1L8.5 15H7l-.3 1.3C6.4 16.4 6 16.7 6 17h1zm10 0c0-.3-.4-.6-.7-.7L16 15h-1.5l.8 1.3c-.2.3-.3.6-.3 1 0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2z" fill="currentColor"/>',
  'simha': '<path d="M12 3C9.8 3 8 4.8 8 7c0 1 .4 2 1 2.7V11c-2.2.5-4 2-4 4v2h2v4h8v-4h2v-2c0-2-1.8-3.5-4-4V9.7c.6-.7 1-1.7 1-2.7 0-2.2-1.8-4-4-4zm0 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 7c2.2 0 4 1.3 4 3v1h-8v-1c0-1.7 1.8-3 4-3z" fill="currentColor"/>',
  'kanya': '<path d="M12 2a3 3 0 100 6 3 3 0 000-6zm0 7c-2.7 0-5 1.3-5 4v2h2v7h6v-7h2v-2c0-2.7-2.3-4-5-4zm-1 6h2v5h-2v-5z" fill="currentColor"/>',
  'tula': '<path d="M12 3v1M4 7l4 6H4l4-6zm12 0l4 6h-8l4-6zM3 19h18M12 4v15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/><line x1="3" y1="19" x2="21" y2="19" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  'vrishchika': '<path d="M8 16c0-2.2 1.8-4 4-4s4 1.8 4 4v1c0 .6-.4 1-1 1h-6c-.6 0-1-.4-1-1v-1zm4-6C9.8 10 8 8.2 8 6V4h2v2c0 1.1.9 2 2 2s2-.9 2-2V4h2v2c0 2.2-1.8 4-4 4zm5 7l2-2 2 2-2 2-2-2z" fill="currentColor"/>',
  'dhanu': '<path d="M5 19l14-14M14 5h5v5M9 14l-4 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/>',
  'makara': '<path d="M3 12c0-2.5 2-4.5 4.5-4.5 1.2 0 2.3.5 3.1 1.2L14 5l1.5 1.5-3.5 3.5c.3.5.5 1.1.5 1.7V13l4.5 4.5L15 19l-4.5-4.5H9c-3.3 0-6-2.7-6-6zm6 0c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2z" fill="currentColor"/>',
  'kumbha': '<path d="M8 5h8l1 7H7L8 5zm-1 8h10c0 2.5-1.8 4-5 4s-5-1.5-5-4z" fill="currentColor"/><path d="M12 16v2M9 18c0 1.5 1.3 3 3 3s3-1.5 3-3" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>',
  'meena': '<path d="M6 8c0-1.7 1.3-3 3-3 .8 0 1.5.3 2 .8.5-.5 1.2-.8 2-.8 1.7 0 3 1.3 3 3s-1.3 3-3 3c-.8 0-1.5-.3-2-.8-.5.5-1.2.8-2 .8-1.7 0-3-1.3-3-3zm0 8c0-1.7 1.3-3 3-3 .8 0 1.5.3 2 .8.5-.5 1.2-.8 2-.8 1.7 0 3 1.3 3 3s-1.3 3-3 3c-.8 0-1.5-.3-2-.8-.5.5-1.2.8-2 .8-1.7 0-3-1.3-3-3zM12 11v2" stroke="currentColor" stroke-width="1" fill="none" stroke-linecap="round"/>',
}

const RASI_KEYS = ['mesha','vrishabha','mithuna','karka','simha','kanya',
                   'tula','vrishchika','dhanu','makara','kumbha','meena']

const NAMES: Record<string, string[]> = {
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
      if (Array.isArray(d) && d.length)
        setScores(d.map((x: any) => x.overallScore || x.score || 70))
    }).catch(() => {})
  }, [])

  const names = NAMES[language] || NAMES.en
  const dot = (s: number) => s >= 75 ? '#4ADE80' : s >= 60 ? '#FBBF24' : '#F87171'

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      background: 'var(--strip,#3A1414)',
      borderBottom: '2px solid var(--strip-bd,rgba(212,165,43,.2))',
    }}>
      {RASI_KEYS.map((key, i) => {
        const active = i === selected
        const score = scores[i] || 70
        const col = active ? 'var(--strip-sel,#D4A52B)' : 'var(--strip-tx,rgba(232,201,122,.75))'
        return (
          <button
            key={`${key}-${language}`}
            onClick={() => onSelect(i)}
            aria-label={names[i]}
            aria-pressed={active}
            style={{
              flex: '1 1 0',
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '6px 0 5px',
              background: active ? 'var(--strip-chip,rgba(212,165,43,.15))' : 'transparent',
              border: 'none',
              borderBottom: active ? '2.5px solid var(--strip-sel,#D4A52B)' : '2.5px solid transparent',
              cursor: 'pointer',
              color: col,
              transition: 'all .15s',
            }}
          >
            {/* Indian Vedic rasi illustration */}
            <svg
              viewBox="0 0 24 24"
              width={20} height={20}
              fill={active ? 'var(--strip-sel,#D4A52B)' : 'var(--strip-tx,rgba(232,201,122,.85))'}
              stroke={active ? 'var(--strip-sel,#D4A52B)' : 'var(--strip-tx,rgba(232,201,122,.85))'}
              strokeWidth="0.5"
              xmlns="http://www.w3.org/2000/svg"
              dangerouslySetInnerHTML={{ __html: RASI_SVG[key] || '' }}
            />
            {/* Name in current language */}
            <span style={{
              fontSize: '9px',
              fontWeight: 600,
              lineHeight: 1.2,
              textAlign: 'center',
              width: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '0 2px',
              display: 'block',
              color: col,
            }}>{names[i]}</span>
            {/* Score dot */}
            <span style={{
              width: '4px', height: '4px',
              borderRadius: '50%',
              background: dot(score),
              display: 'block', flexShrink: 0,
            }} />
          </button>
        )
      })}
    </div>
  )
}
