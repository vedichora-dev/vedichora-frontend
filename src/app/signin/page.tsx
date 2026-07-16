'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { authLogin } from '@/api'
import { Eye, EyeOff, Star } from 'lucide-react'

export default function SignIn() {
  const router = useRouter()
  const { setAuth } = useStore()
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
          email,
          plan: d.plan || 'free',
        })
        // Check for pending chart
        const pending = sessionStorage.getItem('pending_chart')
        if (pending) { sessionStorage.removeItem('pending_chart'); router.push('/chart') }
        else router.push('/chart')
      } else {
        setErr(res.data?.message || 'Invalid email or password')
      }
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Connection failed — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-maroon shadow-lg mb-4">
            <Star className="w-7 h-7 text-gold-star fill-gold-star" />
          </div>
          <h1 className="font-cinzel font-bold text-2xl text-maroon">Vedic<span className="text-gold">Hora</span></h1>
          <p className="text-sm text-gray-400 mt-1">Sign in to your account</p>
        </div>

        {/* Demo hint */}
        <div className="bg-gold/8 border border-gold/20 rounded-xl p-3.5 mb-6 flex gap-2.5">
          <Star className="w-4 h-4 text-gold shrink-0 mt-0.5" />
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-maroon">Demo account: </span>
            admin@vedichora.com / Admin@123
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Email address</label>
            <input className="input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input className="input pr-10" type={show ? 'text' : 'password'}
                value={pw} onChange={e => setPw(e.target.value)} placeholder="Your password" />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2 font-cinzel">
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-5">
          New here?{' '}
          <Link href="/signup" className="text-maroon font-semibold hover:text-gold transition-colors">
            Create free account
          </Link>
        </p>
      </div>
    </div>
  )
}
