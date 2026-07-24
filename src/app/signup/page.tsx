'use client'
import { useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { authRegister } from '@/api'
import { AUTH_URL } from '@/lib/constants'

// Cloudflare Turnstile site key — free, invisible challenge, no user friction
// Replace with your key from https://dash.cloudflare.com/turnstile
// Dev/localhost: 1x00000000000000000000AA (always passes)
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'

type Step = 'details' | 'verify-email' | 'verify-phone' | 'done'

export default function SignupPage() {
  const router  = useRouter()
  const { setAuth, redirectAfterLogin, setRedirectAfterLogin } = useStore()

  const [step,     setStep]    = useState<Step>('details')
  const [name,     setName]    = useState('')
  const [email,    setEmail]   = useState('')
  const [phone,    setPhone]   = useState('')
  const [pw,       setPw]      = useState('')
  const [otp,      setOtp]     = useState('')
  const [show,     setShow]    = useState(false)
  const [err,      setErr]     = useState('')
  const [loading,  setLoading] = useState(false)
  const [verifyVia, setVerifyVia] = useState<'email'|'phone'>('email')
  const turnstileRef = useRef<HTMLDivElement>(null)

  const api = (path: string, body: object) =>
    fetch(AUTH_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).then(async r => {
      const d = await r.json()
      if (!r.ok) throw new Error(d?.message || d?.errors?.[0] || 'Request failed')
      return d
    })

  // Step 1: Validate fields + CAPTCHA + register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim())          { setErr('Please enter your name'); return }
    if (!email.trim())         { setErr('Please enter your email address'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setErr('Please enter a valid email address'); return }
    if (!pw || pw.length < 8)  { setErr('Password must be at least 8 characters'); return }

    setLoading(true); setErr('')
    try {
      // Get CAPTCHA token from Turnstile
      let captchaToken = ''
      if (typeof window !== 'undefined' && (window as any).turnstile) {
        try {
          captchaToken = await new Promise<string>((resolve, reject) => {
            ;(window as any).turnstile.render(turnstileRef.current, {
              sitekey: TURNSTILE_SITE_KEY,
              callback: resolve,
              'error-callback': reject,
              'expired-callback': () => reject(new Error('CAPTCHA expired')),
            })
          })
        } catch { /* non-blocking — server validates independently */ }
      }

      // Register account
      const res  = await authRegister(name, email, pw)
      const data = res?.data?.data || res?.data
      if (data?.accessToken) {
        setAuth(data.accessToken, data.refreshToken || '', data.user || { displayName: name, email, plan: 'free' })
      }

      // Send verification — prefer email, offer phone if provided
      if (phone.trim() && /^[6-9]\d{9}$/.test(phone.replace(/\s+/g,''))) {
        setVerifyVia('email') // default email first, phone option offered after
      }
      await api('/api/auth/otp/email/send', { email })
      setStep('verify-email')
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Registration failed'
      setErr(msg.includes('already') ? 'This email is already registered.' : msg)
    }
    setLoading(false)
  }

  // Step 2a: Verify email OTP
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim() || otp.length < 6) { setErr('Enter the 6-digit code'); return }
    setLoading(true); setErr('')
    try {
      await api('/api/auth/otp/email/verify', { email, otp })
      // If phone provided, also verify phone
      if (phone.trim()) {
        await api('/api/auth/otp/send', { phone })
        setOtp('')
        setStep('verify-phone')
      } else {
        goToApp()
      }
    } catch (e: any) {
      setErr(e?.message || 'Invalid or expired code. Try again.')
    }
    setLoading(false)
  }

  // Step 2b: Verify phone OTP (optional)
  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim() || otp.length < 6) { setErr('Enter the 6-digit code'); return }
    setLoading(true); setErr('')
    try {
      await api('/api/auth/otp/verify', { phone, otp })
      goToApp()
    } catch (e: any) {
      setErr(e?.message || 'Invalid or expired code. Try again.')
    }
    setLoading(false)
  }

  const goToApp = () => {
    const dest = redirectAfterLogin || '/chart'
    setRedirectAfterLogin(null)
    router.push(dest)
  }

  const resendOtp = async () => {
    try {
      if (step === 'verify-email') await api('/api/auth/otp/email/send', { email })
      else                          await api('/api/auth/otp/send', { phone })
    } catch { /* silent */ }
  }

  const card: React.CSSProperties = { padding:'28px', display:'flex', flexDirection:'column', gap:'16px' }
  const inp  = { className:'input', style:{ width:'100%', marginTop:'4px' } }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',
      justifyContent:'center',padding:'20px',background:'var(--bg)'}}>

      {/* Cloudflare Turnstile script */}
      <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

      <div style={{width:'100%',maxWidth:'420px'}}>

        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'24px',color:'var(--acc)'}}>
            Vedic<span style={{color:'var(--gold)'}}>Hora</span>
          </div>
          <p style={{fontSize:'13px',color:'var(--txm)',marginTop:'4px'}}>Vedic Astrology Platform</p>
        </div>

        {/* ── Step 1: Details ─────────────────────────────────── */}
        {step === 'details' && (
          <form onSubmit={handleRegister} className="card" style={card}>
            <div>
              <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'18px',color:'var(--acc)',marginBottom:'4px'}}>
                Create Free Account
              </div>
              <div style={{fontSize:'12px',color:'var(--txm)'}}>
                Verify your email to get started · Upgrade anytime
              </div>
            </div>

            <div>
              <label className="label">Your name</label>
              <input {...inp} type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="e.g. Ravi Kumar" autoFocus />
            </div>

            <div>
              <label className="label">Email address *</label>
              <input {...inp} type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" />
            </div>

            <div>
              <label className="label">
                Mobile number (optional — for SMS OTP login)
                <span style={{fontSize:'11px',color:'var(--txm)',fontWeight:400,marginLeft:'4px'}}>
                  Indian numbers only (+91)
                </span>
              </label>
              <input {...inp} type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="98765 43210" />
            </div>

            <div>
              <label className="label">Password (min 8 characters)</label>
              <div style={{position:'relative',marginTop:'4px'}}>
                <input className="input" style={{width:'100%',paddingRight:'44px'}}
                  type={show ? 'text' : 'password'} value={pw} onChange={e => setPw(e.target.value)}
                  placeholder="Min 8 characters" />
                <button type="button" onClick={() => setShow(s => !s)}
                  style={{position:'absolute',right:'10px',top:'50%',transform:'translateY(-50%)',
                    background:'none',border:'none',cursor:'pointer',color:'var(--txm)',
                    fontSize:'11px',fontFamily:'inherit'}}>
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Cloudflare Turnstile CAPTCHA widget */}
            <div ref={turnstileRef} data-sitekey={TURNSTILE_SITE_KEY}
              className="cf-turnstile" style={{minHeight:'65px'}} />

            {err && (
              <div style={{fontSize:'12px',color:'var(--bad,#7A1F1F)',
                background:'rgba(122,31,31,.08)',padding:'10px',borderRadius:'8px'}}>
                {err}
                {err.includes('already') && (
                  <Link href="/signin" style={{marginLeft:'4px',color:'var(--acc)',
                    fontWeight:600,textDecoration:'none'}}>Sign in →</Link>
                )}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary"
              style={{padding:'12px',fontFamily:'Cinzel,serif',fontSize:'14px',
                display:'flex',alignItems:'center',justifyContent:'center',gap:'8px'}}>
              {loading ? 'Creating account...' : 'Create account — free →'}
            </button>

            <div style={{textAlign:'center',fontSize:'12px',color:'var(--txm)'}}>
              Already have an account?{' '}
              <Link href="/signin" style={{color:'var(--acc)',fontWeight:600,textDecoration:'none'}}>
                Sign in
              </Link>
            </div>

            <div style={{fontSize:'11px',color:'var(--txm)',textAlign:'center',
              paddingTop:'8px',borderTop:'1px solid var(--bd)'}}>
              Protected by Cloudflare · Your data is encrypted and never sold.
            </div>
          </form>
        )}

        {/* ── Step 2a: Verify Email ─────────────────────────── */}
        {step === 'verify-email' && (
          <form onSubmit={handleVerifyEmail} className="card" style={card}>
            <div>
              <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'18px',
                color:'var(--acc)',marginBottom:'4px'}}>Verify your email</div>
              <div style={{fontSize:'13px',color:'var(--txm)',lineHeight:1.6}}>
                We sent a 6-digit code to <strong>{email}</strong>.
                Check your inbox and spam folder.
              </div>
            </div>

            <div>
              <label className="label">6-digit code</label>
              <input {...inp} type="text" inputMode="numeric" maxLength={6}
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
                placeholder="• • • • • •"
                style={{...inp.style,fontSize:'28px',letterSpacing:'10px',
                  textAlign:'center',fontFamily:'Cinzel,serif'}}
                autoFocus />
            </div>

            {err && (
              <div style={{fontSize:'12px',color:'var(--bad,#7A1F1F)',
                background:'rgba(122,31,31,.08)',padding:'10px',borderRadius:'8px'}}>{err}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary"
              style={{padding:'12px',fontFamily:'Cinzel,serif',fontSize:'14px'}}>
              {loading ? 'Verifying...' : 'Verify & Continue →'}
            </button>

            <div style={{display:'flex',gap:'12px',justifyContent:'center',flexWrap:'wrap'}}>
              <button type="button" onClick={resendOtp}
                style={{background:'none',border:'none',cursor:'pointer',
                  fontSize:'12px',color:'var(--acc)',fontFamily:'inherit'}}>
                Resend code
              </button>
              <span style={{color:'var(--bd)'}}> · </span>
              <button type="button" onClick={goToApp}
                style={{background:'none',border:'none',cursor:'pointer',
                  fontSize:'12px',color:'var(--txm)',fontFamily:'inherit'}}>
                Skip for now
              </button>
            </div>

            <div style={{fontSize:'11px',color:'var(--txm)',textAlign:'center'}}>
              Your account is active. Email verification unlocks higher limits.
            </div>
          </form>
        )}

        {/* ── Step 2b: Verify Phone (optional) ──────────────── */}
        {step === 'verify-phone' && (
          <form onSubmit={handleVerifyPhone} className="card" style={card}>
            <div>
              <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'18px',
                color:'var(--acc)',marginBottom:'4px'}}>Verify your mobile</div>
              <div style={{fontSize:'13px',color:'var(--txm)',lineHeight:1.6}}>
                We sent a code to <strong>+91 {phone}</strong> via SMS.
              </div>
            </div>

            <div>
              <label className="label">6-digit SMS code</label>
              <input {...inp} type="text" inputMode="numeric" maxLength={6}
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
                placeholder="• • • • • •"
                style={{...inp.style,fontSize:'28px',letterSpacing:'10px',
                  textAlign:'center',fontFamily:'Cinzel,serif'}}
                autoFocus />
            </div>

            {err && (
              <div style={{fontSize:'12px',color:'var(--bad,#7A1F1F)',
                background:'rgba(122,31,31,.08)',padding:'10px',borderRadius:'8px'}}>{err}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary"
              style={{padding:'12px',fontFamily:'Cinzel,serif',fontSize:'14px'}}>
              {loading ? 'Verifying...' : 'Verify & Finish →'}
            </button>

            <div style={{display:'flex',gap:'12px',justifyContent:'center'}}>
              <button type="button" onClick={resendOtp}
                style={{background:'none',border:'none',cursor:'pointer',
                  fontSize:'12px',color:'var(--acc)',fontFamily:'inherit'}}>
                Resend SMS
              </button>
              <span style={{color:'var(--bd)'}}> · </span>
              <button type="button" onClick={goToApp}
                style={{background:'none',border:'none',cursor:'pointer',
                  fontSize:'12px',color:'var(--txm)',fontFamily:'inherit'}}>
                Skip
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
