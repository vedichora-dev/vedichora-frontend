'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { authRegister } from '@/api'
import { Eye, EyeOff, Star } from 'lucide-react'

export default function SignUp() {
  const router = useRouter()
  const { setAuth } = useStore()
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw]       = useState('')
  const [show, setShow]   = useState(false)
  const [err, setErr]     = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !pw) { setErr('All fields are required'); return }
    if (pw.length < 8) { setErr('Password must be at least 8 characters'); return }
    setLoading(true); setErr('')
    try {
      const res = await authRegister(email, pw, name)
      const d = res.data?.data
      if (d?.accessToken) {
        setAuth(d.accessToken, d.refreshToken || '', {
          displayName: d.displayName || name,
          email,
          plan: d.plan || 'free',
        })
        router.push('/chart')
      } else {
        setErr(res.data?.message || 'Registration failed')
      }
    } catch (e: any) {
      setErr(e.response?.data?.message || 'Registration failed — try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-maroon shadow-lg mb-4">
            <Star className="w-7 h-7 text-gold-star fill-gold-star" />
          </div>
          <h1 className="font-cinzel font-bold text-2xl text-maroon">Create Account</h1>
          <p className="text-sm text-gray-400 mt-1">Free forever — no credit card needed</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="label">Full name</label>
            <input className="input" type="text" value={name}
              onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className="label">Email address</label>
            <input className="input" type="email" value={email}
              onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input className="input pr-10" type={show ? 'text' : 'password'}
                value={pw} onChange={e => setPw(e.target.value)} placeholder="Min 8 characters" />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {err && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{err}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-2 font-cinzel">
            {loading ? 'Creating account…' : 'Create free account →'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400 mt-5">
          Already have an account?{' '}
          <Link href="/signin" className="text-maroon font-semibold hover:text-gold transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
