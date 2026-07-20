'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { sendPhoneOtp, verifyPhoneOtp } from '@/api'

type Step = 'phone' | 'otp'

export default function PhoneLoginPage() {
  const router = useRouter()
  const { redirectAfterLogin, setRedirectAfterLogin, setToken, setUser } = useStore()

  const [step, setStep]   = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp]     = useState('')
  const [err, setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim() || phone.length < 10) { setErr('Enter a valid phone number'); return }
    setLoading(true); setErr('')
    try {
      await sendPhoneOtp(phone.trim())
      setStep('otp')
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Could not send OTP. Try again.')
    }
    setLoading(false)
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim() || otp.length < 6) { setErr('Enter the 6-digit code'); return }
    setLoading(true); setErr('')
    try {
      const res = await verifyPhoneOtp(phone.trim(), otp.trim())
      const data = (res as any)?.data?.data ?? (res as any)?.data ?? {}
      const tok  = data.token || data.accessToken || data.access_token
      if (tok) {
        setToken(tok)
        localStorage.setItem('vh_token', tok)
        if (data.user) {
          setUser(data.user)
          localStorage.setItem('vh_user', JSON.stringify(data.user))
        }
      }
      const dest = redirectAfterLogin || '/dashboard'
      setRedirectAfterLogin(null)
      router.push(dest)
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Invalid or expired code.')
    }
    setLoading(false)
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',
      justifyContent:'center',padding:'20px',background:'var(--bg)'}}>
      <div style={{width:'100%',maxWidth:'400px'}}>
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'24px',color:'var(--acc)'}}>
            Vedic<span style={{color:'var(--gold)'}}>Hora</span>
          </div>
          <p style={{fontSize:'13px',color:'var(--txm)',marginTop:'4px'}}>Sign in with phone</p>
        </div>

        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="card"
            style={{padding:'28px',display:'flex',flexDirection:'column',gap:'16px'}}>
            <div>
              <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'18px',
                color:'var(--acc)',marginBottom:'4px'}}>Enter your phone number</div>
              <div style={{fontSize:'12px',color:'var(--txm)'}}>
                We'll send a 6-digit code via SMS
              </div>
            </div>
            <div>
              <label className="label">Phone number</label>
              <input className="input" type="tel" value={phone} autoFocus
                onChange={e=>setPhone(e.target.value)}
                placeholder="+91 98765 43210" style={{marginTop:'4px'}}/>
            </div>
            {err && <div style={{fontSize:'12px',color:'var(--bad,#7A1F1F)',
              background:'rgba(122,31,31,.08)',padding:'10px',borderRadius:'8px'}}>{err}</div>}
            <button type="submit" disabled={loading} className="btn-primary"
              style={{padding:'12px',fontFamily:'Cinzel,serif',fontSize:'14px'}}>
              {loading ? 'Sending...' : 'Send OTP →'}
            </button>
            <div style={{textAlign:'center',fontSize:'12px',color:'var(--txm)'}}>
              Sign in with email instead?{' '}
              <Link href="/signin" style={{color:'var(--acc)',fontWeight:600,textDecoration:'none'}}>
                Email login
              </Link>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerify} className="card"
            style={{padding:'28px',display:'flex',flexDirection:'column',gap:'16px'}}>
            <div>
              <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'18px',
                color:'var(--acc)',marginBottom:'4px'}}>Enter the code</div>
              <div style={{fontSize:'12px',color:'var(--txm)',lineHeight:1.6}}>
                Sent to <strong>{phone}</strong>
              </div>
            </div>
            <div>
              <label className="label">6-digit code</label>
              <input className="input" type="text" inputMode="numeric" maxLength={6}
                value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))}
                placeholder="• • • • • •" autoFocus
                style={{fontSize:'24px',letterSpacing:'8px',textAlign:'center',
                  fontFamily:'Cinzel,serif',marginTop:'4px'}}/>
            </div>
            {err && <div style={{fontSize:'12px',color:'var(--bad,#7A1F1F)',
              background:'rgba(122,31,31,.08)',padding:'10px',borderRadius:'8px'}}>{err}</div>}
            <button type="submit" disabled={loading} className="btn-primary"
              style={{padding:'12px',fontFamily:'Cinzel,serif',fontSize:'14px'}}>
              {loading ? 'Verifying...' : 'Verify & Sign in →'}
            </button>
            <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
              <button type="button" onClick={()=>setStep('phone')}
                style={{background:'none',border:'none',cursor:'pointer',
                  fontSize:'12px',color:'var(--txm)',fontFamily:'inherit'}}>
                ← Change number
              </button>
              <span style={{color:'var(--bd)'}}>·</span>
              <button type="button" onClick={async()=>{
                  try { await sendPhoneOtp(phone) } catch {}
                }}
                style={{background:'none',border:'none',cursor:'pointer',
                  fontSize:'12px',color:'var(--acc)',fontFamily:'inherit'}}>
                Resend code
              </button>
            </div>
          </form>
        )}

        <div style={{textAlign:'center',marginTop:'16px'}}>
          <Link href="/signup" style={{fontSize:'12px',color:'var(--txm)',textDecoration:'none'}}>
            No account? <span style={{color:'var(--acc)',fontWeight:600}}>Sign up free</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
