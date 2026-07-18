'use client'
import { useState, useEffect } from 'react'
import ZodiacStrip from '@/components/layout/ZodiacStrip'
import { RASI } from '@/lib/constants'
import { getRasiHoroscope } from '@/api'
import { useStore } from '@/store'
import { useSignName, useT } from '@/lib/i18n'

const DOMAIN_KEYS = ['Love','Career','Health','Finance']

export default function HomePage() {
  const [sel, setSel] = useState(0)
  const [horoscope, setHoroscope] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<t('home.daily')|t('home.weekly')|t('home.monthly')>(t('home.daily'))
  const { language } = useStore()
  const getSign = useSignName()
  const t = useT()

  useEffect(() => {
    setLoading(true)
    setHoroscope(null)
    getRasiHoroscope(sel, language).then((data: any) => {
      setHoroscope(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [sel, language])

  const rasi      = RASI[sel]
  const signName  = getSign(rasi.vd)
  const score     = horoscope?.overallScore || horoscope?.score || rasi.sc.Daily
  const prediction = horoscope?.generalPrediction || horoscope?.GeneralPrediction
    || horoscope?.prediction || horoscope?.summary
    || `${signName} is under the influence of ${rasi.lord}. This is a period for reflection and action.`
  const mood      = horoscope?.overallMood || horoscope?.OverallMood || ''
  const moonNote  = horoscope?.moonNote || horoscope?.MoonNote || ''
  const favorable = horoscope?.favorableFor || horoscope?.FavorableFor || ''
  const avoid     = horoscope?.avoidFor || horoscope?.AvoidFor || ''
  const domainScores = horoscope?.domainScores || { Love:68, Career:82, Health:71, Finance:65 }

  const domainLabels: Record<string,string> = {
    Love: t('home.love'), Career: t('home.career'),
    Health: t('home.health'), Finance: t('home.finance'),
  }

  const scoreColor = (s: number) =>
    s >= 75 ? 'var(--good,#2D5C45)' : s >= 60 ? 'var(--warn,#9C6B14)' : 'var(--bad,#7A1F1F)'

  const moodColor = (m: string) => {
    const pos = ['சாதகம்','शुभ','Auspi','శుభం','ശുഭം','ಶುಭ']
    const neg = ['சவால்','चुनौती','Chall','సవాలు','വെല്ലുവിളി','ಸವಾಲು']
    if (pos.some(p => m.includes(p))) return { bg:'rgba(74,222,128,.12)', color:'#16A34A' }
    if (neg.some(p => m.includes(p))) return { bg:'rgba(248,113,113,.12)', color:'#DC2626' }
    return { bg:'rgba(251,191,36,.12)', color:'#B45309' }
  }

  return (
    <div>
      <ZodiacStrip key={language} selected={sel} onSelect={setSel} />

      <div style={{maxWidth:'1200px', margin:'0 auto', padding:'24px 16px'}}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'24px'}} className="home-grid">

          {/* Left — sign card */}
          <div className="card" style={{padding:'24px'}}>
            <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'20px'}}>
              <div>
                <h2 style={{fontFamily:'Cinzel,serif', fontWeight:700, fontSize:'22px',
                  color:'var(--acc)', marginBottom:'4px', textTransform:'uppercase'}}>{signName}</h2>
                <div style={{fontSize:'12px', color:'var(--txm)'}}>{rasi.dates}</div>
                <div style={{fontSize:'12px', color:'var(--txm)', marginTop:'2px'}}>
                  {rasi.element === 'Fire' ? '🔥' : rasi.element === 'Earth' ? '🌿' : rasi.element === 'Air' ? '💨' : '💧'}{' '}
                  {rasi.element} · Ruled by {rasi.lord}
                </div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontFamily:'Cinzel,serif', fontWeight:900, fontSize:'36px', lineHeight:1,
                  color:scoreColor(score)}}>{score}</div>
                <div style={{fontSize:'9px', color:'var(--txm)', fontWeight:700,
                  letterSpacing:'.06em', textTransform:'uppercase', marginTop:'2px'}}>TODAY</div>
              </div>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              {DOMAIN_KEYS.map(d => {
                const s = domainScores[d] || domainScores[d.toLowerCase()] || 65
                return (
                  <div key={d}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'4px'}}>
                      <span style={{color:'var(--tx2)'}}>{domainLabels[d]}</span>
                      <span style={{fontWeight:600, color:'var(--tx)'}}>{s}</span>
                    </div>
                    <div style={{height:'5px', background:'var(--bd)', borderRadius:'3px', overflow:'hidden'}}>
                      <div style={{height:'100%', width:`${s}%`, borderRadius:'3px', transition:'width .7s',
                        background:scoreColor(s)}} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{marginTop:'16px', paddingTop:'14px', borderTop:'1px solid var(--bd)',
              display:'flex', gap:'16px', fontSize:'11px', color:'var(--txm)', flexWrap:'wrap'}}>
              <span>Lucky colour: <strong style={{color:'var(--tx)'}}>{rasi.lucky[0]}</strong></span>
              <span>Number: <strong style={{color:'var(--tx)'}}>{rasi.lucky[1]}</strong></span>
            </div>
          </div>

          {/* Right — prediction card */}
          <div className="card">
            <div className="card-hd">
              <span className="card-title">Daily Horoscope · {signName}</span>
              <div style={{display:'flex', gap:'4px', marginLeft:'auto'}}>
                {([t('home.daily'),t('home.weekly'),t('home.monthly')] as const).map(p => (
                  <button key={p} onClick={() => setPeriod(p)} style={{
                    padding:'4px 10px', borderRadius:'6px', fontSize:'11px',
                    border: period===p ? '1px solid var(--gold)' : '1px solid var(--bd)',
                    background: period===p ? 'var(--acc-l,#FBEAE6)' : 'transparent',
                    color: period===p ? 'var(--acc)' : 'var(--txm)',
                    cursor:'pointer', fontFamily:'inherit',
                  }}>{p}</button>
                ))}
              </div>
            </div>
            <div className="card-bd">

              {/* Mood badge */}
              {mood && (
                <div style={{display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap', alignItems:'center'}}>
                  <span style={{padding:'3px 10px', borderRadius:'20px', fontSize:'11px', fontWeight:700,
                    ...moodColor(mood)}}>{mood}</span>
                  {moonNote && <span style={{fontSize:'11px', color:'var(--txm)'}}>{moonNote}</span>}
                </div>
              )}

              {loading ? (
                <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                  {[1,2,3].map(i => (
                    <div key={i} style={{height:'14px', background:'var(--bd)', borderRadius:'4px',
                      width: i===3 ? '60%' : '100%'}} />
                  ))}
                </div>
              ) : (
                <p style={{fontSize:'14px', lineHeight:1.8, color:'var(--tx2)',
                  borderLeft:'3px solid var(--gold)', paddingLeft:'14px',
                  fontStyle:'italic', marginBottom:'20px'}}>{prediction}</p>
              )}

              {/* Domain scores */}
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px'}} className="domain-grid">
                {DOMAIN_KEYS.map(d => {
                  const s = domainScores[d] || domainScores[d.toLowerCase()] || 65
                  const c = scoreColor(s)
                  return (
                    <div key={d} style={{background:'var(--bg2)', borderRadius:'12px',
                      padding:'14px', border:'1px solid var(--bd)'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px'}}>
                        <span style={{fontSize:'12px', color:'var(--tx2)'}}>{domainLabels[d]}</span>
                        <span style={{fontSize:'22px', fontWeight:900, fontFamily:'Cinzel,serif', color:c}}>{s}</span>
                      </div>
                      <div style={{height:'4px', background:'var(--bd)', borderRadius:'2px', overflow:'hidden'}}>
                        <div style={{height:'100%', width:`${s}%`, background:c, borderRadius:'2px', transition:'width .7s'}} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Favorable / Avoid */}
              {(favorable || avoid) && (
                <div style={{marginTop:'16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                  {favorable && (
                    <div style={{background:'rgba(74,222,128,.08)', borderRadius:'8px',
                      padding:'10px 12px', border:'1px solid rgba(74,222,128,.2)'}}>
                      <div style={{fontSize:'10px', fontWeight:700, color:'#16A34A',
                        marginBottom:'4px', textTransform:'uppercase', letterSpacing:'.05em'}}>✓ Favorable</div>
                      <div style={{fontSize:'12px', color:'var(--tx2)'}}>{favorable}</div>
                    </div>
                  )}
                  {avoid && (
                    <div style={{background:'rgba(248,113,113,.08)', borderRadius:'8px',
                      padding:'10px 12px', border:'1px solid rgba(248,113,113,.2)'}}>
                      <div style={{fontSize:'10px', fontWeight:700, color:'#DC2626',
                        marginBottom:'4px', textTransform:'uppercase', letterSpacing:'.05em'}}>✗ Avoid</div>
                      <div style={{fontSize:'12px', color:'var(--tx2)'}}>{avoid}</div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
