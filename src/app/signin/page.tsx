"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useStore } from "@/store"
import { authLogin } from "@/api"
import { Eye, EyeOff, Star } from "lucide-react"

export default function SignIn() {
  const router = useRouter()
  const { setAuth } = useStore()
  const [email, setEmail] = useState("admin@vedichora.com")
  const [pw, setPw]       = useState("Admin@123")
  const [show, setShow]   = useState(false)
  const [err, setErr]     = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !pw) { setErr("Please enter email and password"); return }
    setLoading(true); setErr("")
    try {
      const res = await authLogin(email, pw)
      const d = res.data?.data
      if (d?.accessToken) {
        setAuth(d.accessToken, d.refreshToken || "", {
          displayName: d.displayName || email.split("@")[0],
          email,
          plan: d.plan || "free",
        })
        // Restore pending chart if any
        const pending = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("pending_chart") : null
        if (pending) { sessionStorage.removeItem("pending_chart"); router.push("/chart"); return }
        router.push("/chart")
      } else {
        setErr(res.data?.message || "Invalid email or password — please check and try again")
      }
    } catch (e: any) {
      const msg = e.response?.data?.message
      if (e.response?.status === 401) setErr("Invalid email or password")
      else if (e.response?.status === 404) setErr("Account not found — please sign up")
      else setErr(msg || "Connection failed — please try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:"var(--bg)"}}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl shadow-lg mb-4" style={{background:"var(--maroon)"}}>
            <Star className="w-7 h-7 fill-current" style={{color:"var(--star)"}} />
          </div>
          <h1 className="font-cinzel font-bold text-2xl" style={{color:"var(--maroon)"}}>
            Vedic<span style={{color:"var(--gold)"}}>Hora</span>
          </h1>
          <p className="text-sm mt-1" style={{color:"var(--txm)"}}>Sign in to your account</p>
        </div>

        {/* Demo hint */}
        <div className="rounded-xl p-3.5 mb-5 flex gap-2.5" style={{background:"rgba(196,146,42,.08)",border:"1px solid rgba(196,146,42,.2)"}}>
          <Star className="w-4 h-4 shrink-0 mt-0.5" style={{color:"var(--gold)"}} />
          <div className="text-xs" style={{color:"var(--tx2)"}}>
            <strong style={{color:"var(--maroon)"}}>Demo: </strong>admin@vedichora.com / Admin@123
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card" style={{padding:"24px",gap:"16px",display:"flex",flexDirection:"column"}}>
          <div>
            <label className="label">Email address</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input className="input" style={{paddingRight:"40px"}} type={show?"text":"password"}
                value={pw} onChange={e=>setPw(e.target.value)} placeholder="Your password" autoComplete="current-password" />
              <button type="button" onClick={()=>setShow(s=>!s)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:"var(--txm)"}}>
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {err && (
            <div className="text-sm rounded-lg px-3 py-2.5" style={{background:"#FEF2F2",color:"#DC2626",border:"1px solid #FECACA"}}>
              {err}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 mt-1 font-cinzel">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Signing in…
              </span>
            ) : "Sign in →"}
          </button>
        </form>

        <p className="text-center text-sm mt-5" style={{color:"var(--txm)"}}>
          New here?{" "}
          <Link href="/signup" className="font-semibold hover:underline" style={{color:"var(--maroon)"}}>
            Create free account
          </Link>
        </p>
      </div>
    </div>
  )
}
