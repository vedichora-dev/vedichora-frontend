"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/store"
import { listCharts, getCredits, jyotiSessions } from "@/api"
import { Sparkles, ChevronRight, MessageSquare, Star } from "lucide-react"

export default function DashboardPage() {
  const { token, user } = useStore()
  const router = useRouter()
  const [charts,   setCharts]   = useState<any[]>([])
  const [credits,  setCredits]  = useState<number>(0)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!token) { router.push("/signin"); return }
    Promise.all([
      listCharts().then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.data?.data ?? data?.data ?? [])
        setCharts(list)
      }).catch(() => {}),
      getCredits().then((r: any) => {
        setCredits(r?.data?.data?.balance ?? r?.data?.balance ?? 0)
      }).catch(() => {}),
      jyotiSessions().then((r: any) => {
        const list = r?.data?.data ?? r?.data ?? []
        setSessions(Array.isArray(list) ? list.slice(0, 3) : [])
      }).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [token])

  const formatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) }
    catch { return '' }
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 16px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '22px', color: 'var(--acc)' }}>
          Dashboard
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--txm)', marginTop: '4px' }}>
          Welcome back, {user?.displayName || 'Astrologer'} 🙏
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Saved Charts',    value: charts.length,  icon: '📜', href: '/chart' },
          { label: 'Credits Balance', value: credits,         icon: '💰', href: '/checkout' },
          { label: 'AI Chats',        value: sessions.length, icon: '🌟', href: '/jyoti' },
        ].map(s => (
          <div key={s.label} className="card"
            onClick={() => router.push(s.href)}
            style={{ padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'opacity .15s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <div style={{ fontSize: '28px', marginBottom: '6px' }}>{s.icon}</div>
            <div style={{ fontFamily: 'Cinzel,serif', fontWeight: 900, fontSize: '28px',
              color: 'var(--acc)', lineHeight: 1 }}>{loading ? '—' : s.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '4px', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => router.push('/jyoti')}
          style={{ padding: '16px 20px', borderRadius: '12px', border: '1.5px solid var(--gold)',
            background: 'linear-gradient(135deg, rgba(196,146,42,.08), rgba(196,146,42,.02))',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
            textAlign: 'left', fontFamily: 'inherit' }}>
          <Sparkles style={{ width: '22px', height: '22px', color: 'var(--gold)', flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '14px', color: 'var(--acc)' }}>
              Ask Jyoti AI
            </div>
            <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '2px' }}>
              Get AI-powered chart analysis & predictions
            </div>
          </div>
          <ChevronRight style={{ width: '14px', height: '14px', color: 'var(--txm)', marginLeft: 'auto' }} />
        </button>
        <button onClick={() => router.push('/chart')}
          style={{ padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--bd)',
            background: 'var(--surf)', cursor: 'pointer', display: 'flex', alignItems: 'center',
            gap: '12px', textAlign: 'left', fontFamily: 'inherit' }}>
          <span style={{ fontSize: '22px', flexShrink: 0 }}>📜</span>
          <div>
            <div style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '14px', color: 'var(--acc)' }}>
              Kundali Chart
            </div>
            <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '2px' }}>
              Generate or view your Vedic birth chart
            </div>
          </div>
          <ChevronRight style={{ width: '14px', height: '14px', color: 'var(--txm)', marginLeft: 'auto' }} />
        </button>
      </div>

      {/* Two-col: Charts + Jyoti sessions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Saved Charts */}
        <div className="card">
          <div className="card-hd">
            <span className="card-title">Saved Charts</span>
            <button onClick={() => router.push('/chart')}
              style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--acc)', background: 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              + New
            </button>
          </div>
          <div className="card-bd">
            {charts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--txm)', fontSize: '12px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>📜</div>
                No saved charts yet
                <div style={{ marginTop: '10px' }}>
                  <button onClick={() => router.push('/chart')} className="btn-primary"
                    style={{ padding: '6px 16px', fontSize: '11px', fontFamily: 'Cinzel,serif' }}>
                    Generate Chart
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {charts.slice(0, 5).map((c: any, i: number) => (
                  <div key={i}
                    onClick={() => router.push('/chart')}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
                      borderRadius: '8px', background: 'var(--bg2)', border: '1px solid var(--bd)',
                      cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bd)'}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%',
                      background: 'var(--acc)', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 700,
                      flexShrink: 0 }}>
                      {((c.personName || c.PersonName || 'U')[0]).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--acc)',
                        fontFamily: 'Cinzel,serif', overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' }}>
                        {c.personName || c.PersonName || `Chart ${i + 1}`}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--txm)', marginTop: '1px' }}>
                        {c.ascendantName || c.AscendantName || '—'} lagna
                        {c.currentMd || c.CurrentMd ? ` · ${c.currentMd || c.CurrentMd} MD` : ''}
                      </div>
                    </div>
                  </div>
                ))}
                {charts.length > 5 && (
                  <div style={{ fontSize: '11px', color: 'var(--txm)', textAlign: 'center', paddingTop: '4px' }}>
                    +{charts.length - 5} more
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Recent Jyoti Sessions */}
        <div className="card">
          <div className="card-hd">
            <Sparkles style={{ width: '13px', height: '13px', color: 'var(--gold)' }} />
            <span className="card-title">Recent Jyoti Chats</span>
            <button onClick={() => router.push('/jyoti')}
              style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--gold)', background: 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
              Open
            </button>
          </div>
          <div className="card-bd">
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--txm)', fontSize: '12px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🌟</div>
                No conversations yet
                <div style={{ marginTop: '10px' }}>
                  <button onClick={() => router.push('/jyoti')} className="btn-primary"
                    style={{ padding: '6px 16px', fontSize: '11px', fontFamily: 'Cinzel,serif' }}>
                    Ask Jyoti AI
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {sessions.map((s: any, i: number) => (
                  <div key={i}
                    onClick={() => router.push('/jyoti')}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px',
                      borderRadius: '8px', background: 'var(--bg2)', border: '1px solid var(--bd)',
                      cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--bd)'}>
                    <MessageSquare style={{ width: '13px', height: '13px', color: 'var(--txm)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.title || s.Title || 'Jyoti Chat'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--txm)', marginTop: '1px' }}>
                        {formatDate(s.lastMessageAt || s.LastMessageAt || '')}
                      </div>
                    </div>
                    <ChevronRight style={{ width: '11px', height: '11px', color: 'var(--txm)', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
