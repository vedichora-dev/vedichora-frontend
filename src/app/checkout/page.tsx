'use client'
import { useState, useEffect } from 'react'
import { useStore } from '@/store'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Shield, CheckCircle, RefreshCw } from 'lucide-react'

const PLANS = [
  { id:'starter',  name:'Starter',   credits:100,  inr:199,   usd:3,   desc:'100 minutes of consultations' },
  { id:'basic',    name:'Basic',     credits:300,  inr:499,   usd:7,   desc:'300 minutes — most popular', popular:true },
  { id:'pro',      name:'Pro',       credits:1000, inr:1299,  usd:16,  desc:'1000 minutes for power users' },
  { id:'yearly',   name:'Annual Pro',credits:15000,inr:9999,  usd:120, desc:'Unlimited for one year', best:true },
]

declare global { interface Window { Razorpay: any } }

export default function CheckoutPage() {
  const router = useRouter()
  const params = useSearchParams()
  const { token, user, currency, currencySym } = useStore()

  const [sel,      setSel]     = useState(PLANS[1])
  const [loading,  setLoading] = useState(false)
  const [success,  setSuccess] = useState(false)
  const [err,      setErr]     = useState('')

  useEffect(() => {
    const plan = params.get('plan')
    if (plan) {
      const found = PLANS.find(p => p.id === plan)
      if (found) setSel(found)
    }
    // Load Razorpay SDK
    if (!document.getElementById('razorpay-sdk')) {
      const s = document.createElement('script')
      s.id  = 'razorpay-sdk'
      s.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.head.appendChild(s)
    }
  }, [])

  const handlePay = async () => {
    if (!token) { router.push('/signin?next=/checkout'); return }
    setLoading(true); setErr('')

    try {
      if (!window.Razorpay && isINR) {
        setErr('Payment gateway loading. Please wait a moment and try again.')
        setLoading(false)
        return
      }
      const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'https://vedichora-platform-production.up.railway.app'
      const isINR = currency === 'INR'
      const amount = isINR ? sel.inr : sel.usd

      if (isINR) {
        // Razorpay for India
        const orderRes = await fetch(`${AUTH_URL}/api/payment/razorpay/create-order`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
          body: JSON.stringify({ planId: sel.id, amount: sel.inr, currency: 'INR' })
        }).then(r=>r.json())

        const orderId = orderRes?.data?.orderId || orderRes?.orderId
        if (!orderId) {
          // Demo mode — open Razorpay with test credentials
          console.warn('Order API not ready, running in demo mode:', orderRes?.message)
          const rzpDemo = new window.Razorpay({
            key: 'rzp_test_DUMMY_REPLACE',
            amount: sel.inr * 100,
            currency: 'INR',
            name: 'VedicHora',
            description: sel.desc + ' (Demo)',
            handler: () => setSuccess(true),
            theme: { color: '#8B1A1A' },
            modal: { ondismiss: () => setLoading(false) }
          })
          rzpDemo.open()
          return
        }

        const rzp = new window.Razorpay({
          key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY || 'rzp_test_DUMMY_REPLACE',
          amount:      sel.inr * 100,
          currency:    'INR',
          name:        'VedicHora',
          description: sel.desc,
          order_id:    orderId,
          prefill: {
            name:  user?.displayName || '',
            email: user?.email || '',
          },
          theme: { color: '#8B1A1A' },
          handler: async (response: any) => {
            // Verify payment
            const verify = await fetch(`${AUTH_URL}/api/payment/razorpay/verify`, {
              method:'POST',
              headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
              body: JSON.stringify({
                orderId: orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              })
            }).then(r=>r.json())
            if (verify?.data?.success || verify?.success) {
              setSuccess(true)
            } else {
              setErr('Payment verification failed. Contact support.')
            }
          },
          modal: { ondismiss: () => setLoading(false) }
        })
        rzp.open()
      } else {
        // Stripe for international
        const stripeRes = await fetch(`${AUTH_URL}/api/payment/stripe/create-session`, {
          method:'POST',
          headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`},
          body: JSON.stringify({
            planId:   sel.id,
            amount:   sel.usd,
            currency: currency.toLowerCase(),
            successUrl: `${window.location.origin}/checkout?success=1`,
            cancelUrl:  `${window.location.origin}/checkout`,
          })
        }).then(r=>r.json())

        const url = stripeRes?.data?.url || stripeRes?.url
        if (url) {
          window.location.href = url
        } else {
          throw new Error(stripeRes?.message || 'Could not create Stripe session')
        }
      }
    } catch(e:any) {
      setErr(e?.message || 'Payment failed. Please try again.')
      setLoading(false)
    }
  }

  // Handle Stripe redirect back
  useEffect(() => {
    if (params.get('success') === '1') setSuccess(true)
  }, [params])

  if (success) return (
    <div style={{minHeight:'80vh',display:'flex',alignItems:'center',
      justifyContent:'center',padding:'20px'}}>
      <div style={{textAlign:'center',maxWidth:'400px'}}>
        <CheckCircle style={{width:'64px',height:'64px',color:'#16A34A',margin:'0 auto 16px'}}/>
        <h2 style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'24px',
          color:'var(--acc)',marginBottom:'8px'}}>Payment Successful!</h2>
        <p style={{color:'var(--txm)',fontSize:'14px',marginBottom:'24px'}}>
          Your {sel.credits.toLocaleString()} minutes have been credited to your account.
        </p>
        <button onClick={()=>router.push('/chart')} className="btn-primary"
          style={{padding:'12px 32px',fontFamily:'Cinzel,serif'}}>
          Go to Chart →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{maxWidth:'900px',margin:'0 auto',padding:'28px 16px'}}>
      <div style={{textAlign:'center',marginBottom:'32px'}}>
        <h1 style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'26px',
          color:'var(--acc)',marginBottom:'6px'}}>Add Consultation Minutes</h1>
        <p style={{color:'var(--txm)',fontSize:'14px'}}>
          Buy minutes to consult with our Vedic astrologers
        </p>
      </div>

      {/* Plan cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',
        marginBottom:'28px'}} className="plan-grid">
        {PLANS.map(plan => (
          <button key={plan.id} onClick={() => setSel(plan)}
            style={{
              padding:'20px 16px', borderRadius:'14px', textAlign:'center',
              border:`2px solid ${sel.id===plan.id ? 'var(--gold)' : 'var(--bd)'}`,
              background: sel.id===plan.id ? 'rgba(196,146,42,.08)' : 'var(--bg2)',
              cursor:'pointer', position:'relative',
              boxShadow: sel.id===plan.id ? '0 0 0 3px rgba(196,146,42,.15)' : 'none',
              transition:'all .15s',
            }}>
            {plan.popular && (
              <div style={{position:'absolute',top:'-11px',left:'50%',
                transform:'translateX(-50%)',background:'var(--gold)',color:'#fff',
                fontSize:'10px',fontWeight:700,padding:'2px 10px',borderRadius:'20px',
                whiteSpace:'nowrap'}}>Most Popular</div>
            )}
            {plan.best && (
              <div style={{position:'absolute',top:'-11px',left:'50%',
                transform:'translateX(-50%)',background:'var(--acc)',color:'#fff',
                fontSize:'10px',fontWeight:700,padding:'2px 10px',borderRadius:'20px',
                whiteSpace:'nowrap'}}>Best Value</div>
            )}
            <div style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'15px',
              color:'var(--acc)',marginBottom:'8px'}}>{plan.name}</div>
            <div style={{fontWeight:900,fontSize:'28px',lineHeight:1,
              color:sel.id===plan.id?'var(--gold)':'var(--tx)',marginBottom:'4px'}}>
              {currency==='INR' ? `₹${plan.inr.toLocaleString('en-IN')}` : `$${plan.usd}`}
            </div>
            <div style={{fontSize:'11px',color:'var(--txm)',marginBottom:'8px'}}>
              {plan.credits.toLocaleString()} minutes
            </div>
            <div style={{fontSize:'11px',color:'var(--tx2)',lineHeight:1.4}}>
              {plan.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Summary + Pay */}
      <div className="card" style={{maxWidth:'480px',margin:'0 auto',padding:'24px'}}>
        <div style={{marginBottom:'16px'}}>
          <div style={{fontSize:'12px',fontWeight:700,color:'var(--txm)',
            textTransform:'uppercase',letterSpacing:'.05em',marginBottom:'12px'}}>
            Order Summary
          </div>
          <div style={{display:'flex',justifyContent:'space-between',
            alignItems:'center',marginBottom:'8px'}}>
            <span style={{fontSize:'14px',color:'var(--tx2)'}}>{sel.name} Plan</span>
            <span style={{fontWeight:700,fontSize:'14px',color:'var(--tx)'}}>
              {currency==='INR' ? `₹${sel.inr.toLocaleString('en-IN')}` : `$${sel.usd}`}
            </span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',
            alignItems:'center',fontSize:'12px',color:'var(--txm)',marginBottom:'16px'}}>
            <span>{sel.credits.toLocaleString()} consultation minutes</span>
            <span>
              {currency==='INR'
                ? `₹${(sel.inr/sel.credits).toFixed(1)}/min`
                : `$${(sel.usd/sel.credits).toFixed(2)}/min`}
            </span>
          </div>
          <div style={{borderTop:'1px solid var(--bd)',paddingTop:'12px',
            display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontWeight:700,color:'var(--tx)'}}>Total</span>
            <span style={{fontWeight:900,fontSize:'20px',color:'var(--gold)'}}>
              {currency==='INR' ? `₹${sel.inr.toLocaleString('en-IN')}` : `$${sel.usd}`}
            </span>
          </div>
        </div>

        {err && (
          <div style={{padding:'10px 12px',borderRadius:'8px',marginBottom:'12px',
            background:'rgba(220,38,38,.08)',border:'1px solid rgba(220,38,38,.2)',
            fontSize:'12px',color:'#DC2626'}}>{err}</div>
        )}

        <button onClick={handlePay} disabled={loading || !token}
          className="btn-primary" style={{width:'100%',padding:'14px',
            fontFamily:'Cinzel,serif',fontSize:'15px',display:'flex',
            alignItems:'center',justifyContent:'center',gap:'8px'}}>
          {loading
            ? <><RefreshCw style={{width:'14px',height:'14px',
                animation:'spin 1s linear infinite'}}/> Processing...</>
            : <><CreditCard style={{width:'16px',height:'16px'}}/>
                Pay {currency==='INR' ? `₹${sel.inr.toLocaleString('en-IN')}` : `$${sel.usd}`}
                {currency==='INR' ? ' via Razorpay' : ' via Stripe'}</>}
        </button>

        {!token && (
          <p style={{textAlign:'center',fontSize:'12px',color:'var(--txm)',marginTop:'10px'}}>
            <a href="/signin" style={{color:'var(--acc)',fontWeight:600}}>Sign in</a> to purchase
          </p>
        )}

        <div style={{display:'flex',alignItems:'center',justifyContent:'center',
          gap:'6px',marginTop:'14px',fontSize:'11px',color:'var(--txm)'}}>
          <Shield style={{width:'12px',height:'12px'}}/>
          Secured by {currency==='INR' ? 'Razorpay' : 'Stripe'} · 256-bit SSL
        </div>
      </div>
    </div>
  )
}
