'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { authRegister } from '@/api'
import { Eye, EyeOff, Star } from 'lucide-react'

export default function SignUp() {
  const router = useRouter()
  const { setAuth, redirectAfterLogin, setRedirectAfterLogin } = useStore()
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [pw,    setPw]    = useState('')
  const [show,  setShow]  = useState(false)
  const [err,   setErr]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setErr('Please enter your name'); return }
    if (!email.trim()) { setErr('Please enter your email'); return }
    if (pw.length < 8) { setErr('Password must be at least 8 characters'); return }
    setLoading(true); setErr('')
    try {
      const res = await authRegister(email, pw, name)
      const d = res.data?.data
      if (d?.accessToken) {
        setAuth(d.accessToken, d.refreshToken || '', {
          displayName: d.displayName || name,
          email, plan: d.plan || 'free',
        })
        // Go to intended page or chart — NO email verification needed
        const dest = redirectAfterLogin || '/chart'
        setRedirectAfterLogin(null)
        router.push(dest)
      } else {
        // If email already exists, suggest sign in
        const msg = res.data?.message || ''
        if (msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('taken') || res.status === 409) {
          setErr('This email is already registered. Please sign in instead.')
        } else {
          setErr(msg || 'Registration failed — please try again')
        }
      }
    } catch (e: any) {
      const status = e.response?.status
      const msg = e.response?.data?.message || ''
      if (status === 409 || msg.toLowerCase().includes('exist')) {
        setErr('This email is already registered.')
      } else if (status === 400) {
        setErr(msg || 'Please check your details and try again')
      } else {
        setErr('Connection failed — please try again')
      }
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'var(--bg)'}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg mb-4" style={{background:'var(--acc)'}}>
            <Star className="w-7 h-7 fill-current" style={{color:'var(--gold)'}} />
          </div>
          <h1 className="font-cinzel font-bold text-2xl" style={{color:'var(--acc)'}}>
            Create Free Account
          </h1>
          <p className="text-sm mt-1" style={{color:'var(--txm)'}}>
            No email verification · Start immediately
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{padding:'24px',display:'flex',flexDirection:'column',gap:'16px'}}>
          <div>
            <label className="label">Your name</label>
            <input className="input" type="text" value={name} onChange={e=>setName(e.target.value)}
              placeholder="Ravi Kumar" autoComplete="name" autoFocus />
          </div>
          <div>
            <label className="label">Email address</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)}
              placeholder="you@example.com" autoComplete="email" />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input className="input" style={{paddingRight:'40px'}} type={show?'text':'password'}
                value={pw} onChange={e=>setPw(e.target.value)} placeholder="Min 8 characters" autoComplete="new-password" />
              <button type="button" onClick={()=>setShow(s=>!s)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{color:'var(--txm)',background:'none',border:'none',cursor:'pointer'}}>
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs mt-1" style={{color:'var(--txm)'}}>Minimum 8 characters · No special requirements</p>
          </div>

          {err && (
            <div className="text-sm rounded-lg px-3 py-2.5" style={{background:'var(--bad-l,#FBEAE6)',color:'var(--bad,#7A1F1F)',border:'1px solid rgba(122,31,31,.2)'}}>
              {err}
              {err.includes('already registered') && (
                <> <Link href="/signin" style={{color:'var(--acc)',fontWeight:700,textDecoration:'underline'}}>Sign in here</Link></>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 font-cinzel" style={{marginTop:'4px'}}>
            {loading
              ? <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Creating account…
                </span>
              : 'Create account — free →'
            }
          </button>

          <p className="text-center text-xs" style={{color:'var(--txm)'}}>
            By signing up you agree to our Terms of Service
          </p>
        </form>

        <p className="text-center text-sm mt-5" style={{color:'var(--txm)'}}>
          Already have an account?{' '}
          <Link href="/signin" className="font-semibold hover:underline" style={{color:'var(--acc)'}}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
