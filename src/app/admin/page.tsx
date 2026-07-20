'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { adminStats, adminUsers, adminGiftCredits, adminUserBan, adminUserUnban, adminLogs } from '@/api'
import { Users, BarChart3, CreditCard, Star, RefreshCw, MessageSquare,
         Shield, Sparkles, AlertCircle, Activity, ChevronRight, Gift } from 'lucide-react'

type Tab = 'overview' | 'users' | 'logs'

export default function AdminPage() {
  const router  = useRouter()
  const { token, user } = useStore()
  const [tab,     setTab]     = useState<Tab>('overview')
  const [stats,   setStats]   = useState<any>({})
  const [users,   setUsers]   = useState<any[]>([])
  const [logs,    setLogs]    = useState<any[]>([])
  const [logType, setLogType] = useState<'app'|'requests'|'safety'>('app')
  const [loading, setLoading] = useState(true)
  const [err,     setErr]     = useState('')
  const [giftId,  setGiftId]  = useState<number | null>(null)
  const [giftAmt, setGiftAmt] = useState('10')
  const [giftReason, setGiftReason] = useState('Admin gift')

  useEffect(() => {
    if (!token) { router.push('/signin'); return }
    fetchStats()
    fetchUsers()
  }, [token])

  useEffect(() => {
    if (tab === 'logs') fetchLogs()
  }, [tab, logType])

  const fetchStats = useCallback(async () => {
    setLoading(true); setErr('')
    try {
      const r = await adminStats()
      setStats(r?.data?.data ?? r?.data ?? {})
    } catch(e: any) {
      setErr(e?.response?.data?.message || e?.message || 'Failed to load stats')
    }
    setLoading(false)
  }, [])

  const fetchUsers = useCallback(async () => {
    try {
      const r = await adminUsers()
      const list = r?.data?.data?.users ?? r?.data?.users ?? r?.data?.data ?? r?.data ?? []
      setUsers(Array.isArray(list) ? list : [])
    } catch {}
  }, [])

  const fetchLogs = useCallback(async () => {
    try {
      const r = await adminLogs(logType)
      const list = r?.data?.data?.logs ?? r?.data?.logs ?? r?.data?.data ?? r?.data ?? []
      setLogs(Array.isArray(list) ? list : [])
    } catch {}
  }, [logType])

  const handleGift = async (userId: number) => {
    try {
      await adminGiftCredits(userId, +giftAmt, giftReason)
      setGiftId(null)
      alert(`Gifted ${giftAmt} credits to user ${userId}`)
    } catch(e: any) {
      alert(e?.response?.data?.message || 'Failed to gift credits')
    }
  }

  const handleBan = async (userId: number, banned: boolean) => {
    try {
      if (banned) await adminUserUnban(userId)
      else        await adminUserBan(userId)
      await fetchUsers()
    } catch(e: any) {
      alert(e?.response?.data?.message || 'Action failed')
    }
  }

  const s = stats
  const StatCard = ({ icon, label, value, sub, color='var(--acc)' }: any) => (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px',
          background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--txm)', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      </div>
      <div style={{ fontFamily: 'Cinzel,serif', fontWeight: 900, fontSize: '28px',
        color, lineHeight: 1 }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '4px' }}>{sub}</div>}
    </div>
  )

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 16px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <Shield style={{ width: '20px', height: '20px', color: 'var(--acc)' }} />
        <div>
          <h1 style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '20px', color: 'var(--acc)' }}>
            Admin Panel
          </h1>
          <div style={{ fontSize: '11px', color: 'var(--txm)' }}>Platform management</div>
        </div>
        <button onClick={() => { fetchStats(); fetchUsers() }}
          style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--bd)',
            background: 'var(--bg2)', cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit',
            color: 'var(--txm)' }}>
          <RefreshCw style={{ width: '12px', height: '12px' }} />
          Refresh
        </button>
      </div>

      {err && (
        <div style={{ padding: '12px', borderRadius: '10px', marginBottom: '16px',
          background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)',
          fontSize: '12px', color: '#DC2626', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <AlertCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
          {err} — Make sure you're signed in as Admin
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--bd)',
        marginBottom: '20px', overflowX: 'auto' }}>
        {(['overview','users','logs'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 16px', fontSize: '12px', fontWeight: 600, border: 'none',
              background: 'none', cursor: 'pointer', fontFamily: 'inherit',
              color: tab === t ? 'var(--acc)' : 'var(--txm)',
              borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: '-2px', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
            {t === 'overview' ? '📊 Overview' : t === 'users' ? '👥 Users' : '📋 Logs'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--txm)' }}>
              <RefreshCw style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
            </div>
          ) : (
            <>
              {/* User stats */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--txm)',
                  textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>Users</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
                  <StatCard icon={<Users style={{width:'16px',height:'16px',color:'var(--acc)'}}/>}
                    label="Total Users" value={s.totalUsers} sub={`+${s.usersToday ?? 0} today`} />
                  <StatCard icon={<Users style={{width:'16px',height:'16px',color:'#16A34A'}}/>}
                    label="This Week" value={s.usersThisWeek} color="#16A34A" />
                  <StatCard icon={<Star style={{width:'16px',height:'16px',color:'var(--gold)'}}/>}
                    label="Active Practitioners" value={s.activePractitioners} color="var(--gold)"
                    sub={`${s.pendingApplications ?? 0} pending`} />
                  <StatCard icon={<Activity style={{width:'16px',height:'16px',color:'#8B5CF6'}}/>}
                    label="Active Sessions" value={s.activeSessions}
                    sub={`${s.sessionsToday ?? 0} today`} color="#8B5CF6" />
                </div>
              </div>

              {/* Credits & Revenue */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--txm)',
                  textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>Credits & Revenue</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
                  <StatCard icon={<CreditCard style={{width:'16px',height:'16px',color:'#16A34A'}}/>}
                    label="Credits in Circulation" value={s.creditsInCirculation?.toLocaleString()}
                    color="#16A34A" />
                  <StatCard icon={<BarChart3 style={{width:'16px',height:'16px',color:'#0EA5E9'}}/>}
                    label="Earned Today" value={s.creditsEarnedToday} color="#0EA5E9" />
                  <StatCard icon={<BarChart3 style={{width:'16px',height:'16px',color:'#F59E0B'}}/>}
                    label="Spent Today" value={s.creditsSpentToday} color="#F59E0B" />
                  <StatCard icon={<CreditCard style={{width:'16px',height:'16px',color:'#DC2626'}}/>}
                    label="Pending Payouts" value={`₹${(s.pendingPayouts ?? 0).toLocaleString()}`}
                    color="#DC2626" />
                </div>
              </div>

              {/* Activity */}
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--txm)',
                  textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px' }}>Activity (24h)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '10px' }}>
                  <StatCard icon={<BarChart3 style={{width:'16px',height:'16px',color:'var(--acc)'}}/>}
                    label="Charts Generated" value={s.chartsToday ?? s.totalReportsToday} />
                  <StatCard icon={<Sparkles style={{width:'16px',height:'16px',color:'var(--gold)'}}/>}
                    label="Jyoti AI Chats" value={s.jyotiMessagesToday} color="var(--gold)" />
                  <StatCard icon={<AlertCircle style={{width:'16px',height:'16px',color:'#DC2626'}}/>}
                    label="Error Logs" value={s.errorLogsToday} color="#DC2626" />
                  <StatCard icon={<Activity style={{width:'16px',height:'16px',color:'#16A34A'}}/>}
                    label="API Requests" value={s.apiRequestsToday?.toLocaleString()} color="#16A34A" />
                </div>
              </div>

              {/* Raw JSON for debugging */}
              <div className="card">
                <div className="card-hd"><span className="card-title">Raw Stats (debug)</span></div>
                <div className="card-bd">
                  <pre style={{ fontSize: '11px', color: 'var(--txm)', overflow: 'auto',
                    maxHeight: '200px', margin: 0 }}>
                    {JSON.stringify(s, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── USERS ── */}
      {tab === 'users' && (
        <div className="card">
          <div className="card-hd"><span className="card-title">Users ({users.length})</span></div>
          {users.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--txm)', fontSize: '12px' }}>
              No users found or access denied
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead><tr style={{ borderBottom: '2px solid var(--bd)' }}>
                  {['ID','Name','Email','Role','Credits','Joined','Actions'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '10px',
                      fontWeight: 700, textTransform: 'uppercase', color: 'var(--txm)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{users.map((u: any, i: number) => {
                  const uid = u.userId || u.UserId || u.id || u.Id
                  const banned = u.isBanned || u.IsBanned
                  return (
                    <tr key={uid || i} style={{ borderBottom: '1px solid var(--bd)',
                      background: i%2 ? 'var(--bg2)' : 'transparent',
                      opacity: banned ? 0.6 : 1 }}>
                      <td style={{ padding: '8px 12px', color: 'var(--txm)' }}>{uid}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--acc)',
                        fontFamily: 'Cinzel,serif' }}>{u.displayName || u.DisplayName || '—'}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--txm)' }}>{u.email || u.Email}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px',
                          fontWeight: 700, background: u.role === 'Admin' ? 'rgba(196,146,42,.15)' : 'var(--bg2)',
                          color: u.role === 'Admin' ? 'var(--gold)' : 'var(--txm)' }}>
                          {u.role || u.Role || 'User'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--txm)' }}>{u.credits ?? u.Credits ?? '—'}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--txm)' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => setGiftId(giftId === uid ? null : uid)}
                            style={{ padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--gold)',
                              background: 'transparent', cursor: 'pointer', fontSize: '10px',
                              color: 'var(--gold)', fontFamily: 'inherit' }}>
                            <Gift style={{ width: '10px', height: '10px', display: 'inline', marginRight: '3px' }} />
                            Gift
                          </button>
                          <button onClick={() => handleBan(uid, banned)}
                            style={{ padding: '3px 8px', borderRadius: '6px',
                              border: `1px solid ${banned ? '#16A34A' : '#DC2626'}`,
                              background: 'transparent', cursor: 'pointer', fontSize: '10px',
                              color: banned ? '#16A34A' : '#DC2626', fontFamily: 'inherit' }}>
                            {banned ? 'Unban' : 'Ban'}
                          </button>
                        </div>
                        {giftId === uid && (
                          <div style={{ marginTop: '6px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input value={giftAmt} onChange={e => setGiftAmt(e.target.value)}
                              style={{ width: '60px', padding: '3px 6px', fontSize: '11px',
                                border: '1px solid var(--bd)', borderRadius: '4px', background: 'var(--bg)' }}
                              type="number" min="1" />
                            <input value={giftReason} onChange={e => setGiftReason(e.target.value)}
                              style={{ width: '100px', padding: '3px 6px', fontSize: '11px',
                                border: '1px solid var(--bd)', borderRadius: '4px', background: 'var(--bg)' }}
                              placeholder="Reason" />
                            <button onClick={() => handleGift(uid)}
                              style={{ padding: '3px 8px', borderRadius: '4px', border: 'none',
                                background: 'var(--gold)', color: '#fff', cursor: 'pointer', fontSize: '10px' }}>
                              ✓
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── LOGS ── */}
      {tab === 'logs' && (
        <div className="card">
          <div className="card-hd">
            <span className="card-title">System Logs</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
              {(['app','requests','safety'] as const).map(lt => (
                <button key={lt} onClick={() => setLogType(lt)}
                  style={{ padding: '4px 10px', borderRadius: '6px', border: 'none',
                    cursor: 'pointer', fontSize: '11px', fontFamily: 'inherit', fontWeight: 600,
                    background: logType === lt ? 'var(--acc)' : 'var(--bg2)',
                    color: logType === lt ? '#fff' : 'var(--txm)' }}>
                  {lt}
                </button>
              ))}
            </div>
          </div>
          {logs.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--txm)', fontSize: '12px' }}>
              No logs or access denied
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead><tr style={{ borderBottom: '2px solid var(--bd)' }}>
                  {['Time','Level','Message'].map(h => (
                    <th key={h} style={{ padding: '7px 10px', textAlign: 'left', fontSize: '10px',
                      fontWeight: 700, textTransform: 'uppercase', color: 'var(--txm)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{logs.slice(0, 50).map((l: any, i: number) => {
                  const level = (l.level || l.Level || 'info').toLowerCase()
                  const color = level === 'error' ? '#DC2626' : level === 'warn' ? '#F59E0B' : 'var(--tx2)'
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--bd)',
                      background: i%2 ? 'var(--bg2)' : 'transparent' }}>
                      <td style={{ padding: '6px 10px', color: 'var(--txm)', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                        {l.createdAt ? new Date(l.createdAt).toLocaleTimeString('en-IN') : '—'}
                      </td>
                      <td style={{ padding: '6px 10px', fontWeight: 700, color, whiteSpace: 'nowrap' }}>
                        {(l.level || l.Level || 'INFO').toUpperCase()}
                      </td>
                      <td style={{ padding: '6px 10px', color: 'var(--tx2)',
                        maxWidth: '600px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.message || l.Message || l.summary || JSON.stringify(l)}
                      </td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
