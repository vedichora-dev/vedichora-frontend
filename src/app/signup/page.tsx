'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { authRegister, sendEmailOtp, verifyEmailOtp } from '@/api'

type Step = 'details' | 'email-otp' | 'done'

export default function SignupPage() {
  const router = useRouter()
  const { setAuth, redirectAfterLogin, setRedirectAfterLogin } = useStore()

  const [step, setStep]       = useState<Step>('details')
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [phone, setPhone]     = useState('')
  const [pw, setPw]           = useState('')
  const [otp, setOtp]         = useState('')
  const [show, setShow]       = useState(false)
  const [err, setErr]         = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId]   = useState<number>(0)

  // Step 1: Register → get token immediately + send email OTP
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim())  { setErr('Please enter your name'); return }
    if (!email.trim()) { setErr('Please enter your email'); return }
    if (!pw || pw.length < 8) { setErr('Password must be at least 8 characters'); return }
    setLoading(true); setErr('')
    try {
      const res = await authRegister(name, email, pw)
      const data = res?.data?.data || res?.data
      if (data?.accessToken) {
        setAuth(data.accessToken, data.refreshToken || '', data.user || { displayName: name, email, plan: 'free' })
      }
      // Send email OTP for verification
      try { await sendEmailOtp(email) } catch { /* continue even if OTP send fails */ }
      setStep('email-otp')
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Registration failed'
      if (msg.toLowerCase().includes('already')) {
        setErr('Email already registered. ')
      } else {
        setErr(msg)
      }
    }
    setLoading(false)
  }

  // Step 2: Verify email OTP
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp.trim() || otp.length < 6) { setErr('Enter the 6-digit code'); return }
    setLoading(true); setErr('')
    try {
      await verifyEmailOtp(email, otp)
      // Go to app
      const dest = redirectAfterLogin || '/chart'
      setRedirectAfterLogin(null)
      router.push(dest)
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Invalid or expired code. Please try again.')
    }
    setLoading(false)
  }

  // Skip email verification
  const handleSkip = () => {
    const dest = redirectAfterLogin || '/chart'
    setRedirectAfterLogin(null)
    router.push(dest)
  }

  const inp = {
    className: 'input',
    style: { width: '100%', marginTop: '4px' }
  }

  return (
    <div style={{minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', padding:'20px', background:'var(--bg)'}}>
      <div style={{width:'100%', maxWidth:'420px'}}>

        {/* Logo */}
        <div style={{textAlign:'center', marginBottom:'28px'}}>
          <div style={{fontFamily:'Cinzel,serif', fontWeight:700, fontSize:'24px', color:'var(--acc)'}}>
            Vedic<span style={{color:'var(--gold)'}}>Hora</span>
          </div>
          <p style={{fontSize:'13px', color:'var(--txm)', marginTop:'4px'}}>
            Vedic Astrology Platform
          </p>
        </div>

        {/* Step: Details */}
        {step === 'details' && (
          <form onSubmit={handleRegister} className="card"
            style={{padding:'28px', display:'flex', flexDirection:'column', gap:'16px'}}>
            <div>
              <div style={{fontFamily:'Cinzel,serif', fontWeight:700, fontSize:'18px',
                color:'var(--acc)', marginBottom:'4px'}}>Create Free Account</div>
              <div style={{fontSize:'12px', color:'var(--txm)'}}>
                No email verification required to start · Upgrade anytime
              </div>
            </div>

            <div>
              <label className="label">Your name</label>
              <input {...inp} type="text" value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ravi Kumar" autoFocus />
            </div>
            <div>
              <label className="label">Email address</label>
              <input {...inp} type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Phone (optional — for OTP login)</label>
              <input {...inp} type="tel" value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210" />
            </div>
            <div>
              <label className="label">Password</label>
              <div style={{position:'relative', marginTop:'4px'}}>
                <input className="input" style={{width:'100%', paddingRight:'44px'}}
                  type={show ? 'text' : 'password'} value={pw}
                  onChange={e => setPw(e.target.value)}
                  placeholder="Min 8 characters" />
                <button type="button" onClick={() => setShow(s => !s)}
                  style={{position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)',
                    background:'none', border:'none', cursor:'pointer', color:'var(--txm)',
                    fontSize:'11px', fontFamily:'inherit'}}>
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {err && (
              <div style={{fontSize:'12px', color:'var(--bad,#7A1F1F)',
                background:'rgba(122,31,31,.08)', padding:'10px', borderRadius:'8px'}}>
                {err}
                {err.includes('already') && (
                  <Link href="/signin" style={{marginLeft:'4px', color:'var(--acc)',
                    fontWeight:600, textDecoration:'none'}}>Sign in →</Link>
                )}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary"
              style={{padding:'12px', fontFamily:'Cinzel,serif', fontSize:'14px',
                display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
              {loading ? 'Creating account...' : 'Create account — free →'}
            </button>

            <div style={{textAlign:'center', fontSize:'12px', color:'var(--txm)'}}>
              Already have an account?{' '}
              <Link href="/signin" style={{color:'var(--acc)', fontWeight:600, textDecoration:'none'}}>
                Sign in
              </Link>
            </div>

            <div style={{fontSize:'11px', color:'var(--txm)', textAlign:'center',
              paddingTop:'8px', borderTop:'1px solid var(--bd)'}}>
              By signing up you agree to our Terms of Service and Privacy Policy.
              Your data is encrypted and never sold.
            </div>
          </form>
        )}

        {/* Step: Email OTP */}
        {step === 'email-otp' && (
          <form onSubmit={handleVerifyEmail} className="card"
            style={{padding:'28px', display:'flex', flexDirection:'column', gap:'16px'}}>
            <div>
              <div style={{fontFamily:'Cinzel,serif', fontWeight:700, fontSize:'18px',
                color:'var(--acc)', marginBottom:'4px'}}>Verify your email</div>
              <div style={{fontSize:'12px', color:'var(--txm)', lineHeight:1.6}}>
                We sent a 6-digit code to <strong>{email}</strong>.
                Check your inbox (and spam folder).
              </div>
            </div>

            <div>
              <label className="label">6-digit verification code</label>
              <input {...inp} type="text" inputMode="numeric" maxLength={6}
                value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
                placeholder="• • • • • •"
                style={{...inp.style, fontSize:'24px', letterSpacing:'8px',
                  textAlign:'center', fontFamily:'Cinzel,serif'}}
                autoFocus />
            </div>

            {err && (
              <div style={{fontSize:'12px', color:'var(--bad,#7A1F1F)',
                background:'rgba(122,31,31,.08)', padding:'10px', borderRadius:'8px'}}>
                {err}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary"
              style={{padding:'12px', fontFamily:'Cinzel,serif', fontSize:'14px'}}>
              {loading ? 'Verifying...' : 'Verify & Continue →'}
            </button>

            <div style={{display:'flex', gap:'12px', justifyContent:'center'}}>
              <button type="button" onClick={async () => {
                try { await sendEmailOtp(email) } catch {}
              }} style={{background:'none', border:'none', cursor:'pointer',
                fontSize:'12px', color:'var(--acc)', fontFamily:'inherit'}}>
                Resend code
              </button>
              <span style={{color:'var(--bd)'}}>·</span>
              <button type="button" onClick={handleSkip}
                style={{background:'none', border:'none', cursor:'pointer',
                  fontSize:'12px', color:'var(--txm)', fontFamily:'inherit'}}>
                Skip for now
              </button>
            </div>

            <div style={{fontSize:'11px', color:'var(--txm)', textAlign:'center'}}>
              Your account is already active. Verification unlocks higher usage limits.
            </div>
          </form>
        )}

      </div>
    </div>
  )
}
