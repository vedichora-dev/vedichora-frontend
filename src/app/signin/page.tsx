'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { authLogin } from '@/api'
import { Eye, EyeOff, Star } from 'lucide-react'

export default function SignIn() {
  const router = useRouter()
  const { setAuth, redirectAfterLogin, setRedirectAfterLogin } = useStore()
  const [email, setEmail] = useState('admin@vedichora.com')
  const [pw, setPw]       = useState('Admin@123')
  const [show, setShow]   = useState(false)
  const [err, setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !pw) { setErr('Please enter email and password'); return }
    setLoading(true); setErr('')
    try {
      const res = await authLogin(email, pw)
      const d = res.data?.data
      if (d?.accessToken) {
        setAuth(d.accessToken, d.refreshToken || '', {
          displayName: d.displayName || email.split('@')[0],
          email, plan: d.plan || 'free',
        })
        // Go to intended page or chart
        const dest = redirectAfterLogin || '/chart'
        setRedirectAfterLogin(null)
        router.push(dest)
      } else {
        setErr(res.data?.message || 'Invalid email or password')
      }
    } catch (e: any) {
      const status = e.response?.status
      if (status === 401) setErr('Invalid email or password')
      else if (status === 404) setErr('Account not found — please sign up')
      else setErr(e.response?.data?.message || 'Connection failed — please try again')
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
            Vedic<span style={{color:'var(--gold)'}}>Hora</span>
          </h1>
          <p className="text-sm mt-1" style={{color:'var(--txm)'}}>Sign in to your account</p>
        </div>

        <div className="rounded-xl p-3.5 mb-5 flex gap-2.5" style={{background:'rgba(196,146,42,.08)',border:'1px solid rgba(196,146,42,.2)'}}>
          <Star className="w-4 h-4 shrink-0 mt-0.5" style={{color:'var(--gold)'}} />
          <div className="text-xs" style={{color:'var(--tx2)'}}>
            <strong style={{color:'var(--acc)'}}>Demo: </strong>admin@vedichora.com / Admin@123
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{padding:'24px',display:'flex',flexDirection:'column',gap:'16px'}}>
          <div>
            <label className="label">Email address</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input className="input" style={{paddingRight:'40px'}} type={show?'text':'password'}
                value={pw} onChange={e=>setPw(e.target.value)} placeholder="Your password" autoComplete="current-password" />
              <button type="button" onClick={()=>setShow(s=>!s)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'var(--txm)',background:'none',border:'none',cursor:'pointer'}}>
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {err && <div className="text-sm rounded-lg px-3 py-2.5" style={{background:'var(--bad-l,#FBEAE6)',color:'var(--bad,#7A1F1F)',border:'1px solid var(--bad,#7A1F1F)33'}}>{err}</div>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 font-cinzel">
            {loading ? <span className="flex items-center justify-center gap-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Signing in…</span> : 'Sign in →'}
          </button>
        </form>
        <p className="text-center text-sm mt-5" style={{color:'var(--txm)'}}>
          New here?{' '}<Link href="/signup" className="font-semibold hover:underline" style={{color:'var(--acc)'}}>Create free account</Link>
        </p>
      </div>
    </div>
  )
}
