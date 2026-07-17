'use client'
import { useState, useEffect } from 'react'
import ZodiacStrip from '@/components/layout/ZodiacStrip'
import { RASI } from '@/lib/constants'
import { getRasiHoroscope } from '@/api'
import { scoreColor } from '@/lib/utils'
import { useSignName, useT } from '@/lib/i18n'
import { useStore } from '@/store'

const DOMAIN_KEYS = ['Love','Career','Health','Finance']

export default function HomePage() {
  const [sel, setSel] = useState(0)
  const [horoscope, setHoroscope] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<'Daily'|'Weekly'|'Monthly'>('Daily')
  const { language } = useStore()
  const getSign = useSignName()
  const t = useT()

  useEffect(() => {
    setLoading(true)
    getRasiHoroscope(sel, language).then(data => {
      setHoroscope(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [sel, language])

  const rasi = RASI[sel]
  const signName = getSign(rasi.vd)  // translates based on selected language
  const score = horoscope?.overallScore || horoscope?.score || rasi.sc.Daily
  const prediction = horoscope?.generalPrediction || horoscope?.GeneralPrediction || horoscope?.prediction || horoscope?.summary ||
    `${signName} is under the influence of ${rasi.lord}. This is a period for reflection and action. Focus on your core strengths and trust the cosmic guidance of your ruling planet.`
  const mood = horoscope?.overallMood || horoscope?.OverallMood || ''
  const favorable = horoscope?.favorableFor || horoscope?.FavorableFor || ''
  const avoid = horoscope?.avoidFor || horoscope?.AvoidFor || ''
  const moonNote = horoscope?.moonNote || horoscope?.MoonNote || ''
  const domainScores = horoscope?.domainScores || { Love:68, Career:82, Health:71, Finance:65 }

  const domainLabels: Record<string,string> = {
    Love: t('home.love'), Career: t('home.career'),
    Health: t('home.health'), Finance: t('home.finance')
  }

  return (
    <div>
      <ZodiacStrip key={language} selected={sel} onSelect={setSel} />

      <div style={{maxWidth:'1200px',margin:'0 auto',padding:'24px 16px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:'24px'}} className="lg:grid-cols-5">

          {/* Sign card */}
          <div className="card" style={{padding:'24px'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'20px'}}>
              <div>
                <h2 style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'22px',
                  color:'var(--acc)',marginBottom:'4px',textTransform:'uppercase'}}>{signName}</h2>
                <div style={{fontSize:'12px',color:'var(--txm)'}}>{rasi.dates}</div>
                <div style={{fontSize:'12px',color:'var(--txm)',marginTop:'2px'}}>
                  {rasi.element === 'Fire' ? '🔥' : rasi.element === 'Earth' ? '🌿' : rasi.element === 'Air' ? '💨' : '💧'}{' '}
                  {rasi.element} · Ruled by {rasi.lord}
                </div>
              </div>
              <div style={{textAlign:'center'}}>
                <div style={{fontFamily:'Cinzel,serif',fontWeight:900,fontSize:'36px',lineHeight:1,
                  color:score>=75?'var(--good,#2D5C45)':score>=60?'var(--warn,#9C6B14)':'var(--bad,#7A1F1F)'}}>
                  {score}
                </div>
                <div style={{fontSize:'9px',color:'var(--txm)',fontWeight:700,letterSpacing:'.06em',
                  textTransform:'uppercase',marginTop:'2px'}}>TODAY</div>
              </div>
            </div>

            {/* Domain bars */}
            <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
              {DOMAIN_KEYS.map(d => {
                const s = domainScores[d] || domainScores[d.toLowerCase()] || 65
                return (
                  <div key={d}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:'12px',marginBottom:'4px'}}>
                      <span style={{color:'var(--tx2)'}}>{domainLabels[d]}</span>
                      <span style={{fontWeight:600,color:'var(--tx)'}}>{s}</span>
                    </div>
                    <div style={{height:'5px',background:'var(--bd)',borderRadius:'3px',overflow:'hidden'}}>
                      <div style={{height:'100%',width:`${s}%`,borderRadius:'3px',transition:'width .7s',
                        background:s>=75?'var(--good,#2D5C45)':s>=60?'var(--gold)':'var(--bad,#7A1F1F)'}} />
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{marginTop:'16px',paddingTop:'14px',borderTop:'1px solid var(--bd)',
              display:'flex',gap:'16px',fontSize:'11px',color:'var(--txm)'}}>
              <span>Lucky colour: <strong style={{color:'var(--tx)'}}>{rasi.lucky[0]}</strong></span>
              <span>Number: <strong style={{color:'var(--tx)'}}>{rasi.lucky[1]}</strong></span>
            </div>
          </div>

          {/* Prediction card */}
          <div className="card">
            <div className="card-hd">
              <span className="card-title">Daily Horoscope · {signName}</span>
              <div style={{display:'flex',gap:'4px',marginLeft:'auto'}}>
                {(['Daily','Weekly','Monthly'] as const).map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    style={{
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
                <div style={{display:'flex',gap:'8px',marginBottom:'12px',flexWrap:'wrap'}}>
                  <span style={{padding:'3px 10px',borderRadius:'20px',fontSize:'11px',fontWeight:700,
                    background: mood.includes('சாதக')||mood.includes('शुभ')||mood.includes('Auspi') ? 'rgba(74,222,128,.15)' : mood.includes('சவால்')||mood.includes('चुनौती')||mood.includes('Chall') ? 'rgba(248,113,113,.15)' : 'rgba(251,191,36,.15)',
                    color: mood.includes('சாதக')||mood.includes('शुभ')||mood.includes('Auspi') ? '#16A34A' : mood.includes('சவால்')||mood.includes('चुनौती')||mood.includes('Chall') ? '#DC2626' : '#B45309',
                  }}>{mood}</span>
                  {moonNote && <span style={{fontSize:'11px',color:'var(--txm)',padding:'3px 0'}}>{moonNote}</span>}
                </div>
              )}

              {loading ? (
                <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                  {[1,2,3].map(i => <div key={i} style={{height:'14px',background:'var(--bd)',borderRadius:'4px',
                    width:i===3?'60%':'100%',animation:'pulse 1.5s infinite'}} />)}
                </div>
              ) : (
                <p style={{fontSize:'14px',lineHeight:1.8,color:'var(--tx2)',
                  borderLeft:'3px solid var(--gold)',paddingLeft:'14px',fontStyle:'italic',marginBottom:'20px'}}>
                  {prediction}
                </p>
              )}

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px'}}>
                {DOMAIN_KEYS.map(d => {
                  const s = domainScores[d] || domainScores[d.toLowerCase()] || 65
                  const c = s>=75?'var(--good,#2D5C45)':s>=60?'var(--warn,#9C6B14)':'var(--bad,#7A1F1F)'
                  return (
                    <div key={d} style={{background:'var(--bg2)',borderRadius:'12px',
                      padding:'14px',border:'1px solid var(--bd)'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                        <span style={{fontSize:'12px',color:'var(--tx2)'}}>{domainLabels[d]}</span>
                        <span style={{fontSize:'22px',fontWeight:900,fontFamily:'Cinzel,serif',color:c}}>{s}</span>
                      </div>
                      <div style={{height:'4px',background:'var(--bd)',borderRadius:'2px',overflow:'hidden'}}>
                        <div style={{height:'100%',width:`${s}%`,background:c,borderRadius:'2px',transition:'width .7s'}} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

              {/* Favorable / Avoid */}
              {(favorable || avoid) && (
                <div style={{marginTop:'16px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px'}}>
                  {favorable && (
                    <div style={{background:'rgba(74,222,128,.08)',borderRadius:'8px',padding:'10px 12px',border:'1px solid rgba(74,222,128,.2)'}}>
                      <div style={{fontSize:'10px',fontWeight:700,color:'#16A34A',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'.05em'}}>✓ Favorable</div>
                      <div style={{fontSize:'12px',color:'var(--tx2)'}}>{favorable}</div>
                    </div>
                  )}
                  {avoid && (
                    <div style={{background:'rgba(248,113,113,.08)',borderRadius:'8px',padding:'10px 12px',border:'1px solid rgba(248,113,113,.2)'}}>
                      <div style={{fontSize:'10px',fontWeight:700,color:'#DC2626',marginBottom:'4px',textTransform:'uppercase',letterSpacing:'.05em'}}>✗ Avoid</div>
                      <div style={{fontSize:'12px',color:'var(--tx2)'}}>{avoid}</div>
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
