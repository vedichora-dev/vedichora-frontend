'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { Users, BarChart3, CreditCard, Star, TrendingUp, RefreshCw, Activity } from 'lucide-react'

interface Stats {
  totalUsers?: number; activeUsers?: number; totalCharts?: number
  totalRevenue?: number; totalConsults?: number; avgRating?: number
  recentUsers?: any[]; recentCharts?: any[]
}

export default function AdminPage() {
  const router = useRouter()
  const { token, user } = useStore()
  const [stats, setStats] = useState<Stats>({})
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!token) { router.push('/signin'); return }
    fetchStats()
  }, [token])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const CHART_URL = process.env.NEXT_PUBLIC_CHART_URL || 'https://enchanting-dedication-production.up.railway.app'
      const AUTH_URL  = process.env.NEXT_PUBLIC_AUTH_URL  || 'https://vedichora-platform-production.up.railway.app'
      const headers   = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }

      // Admin endpoints are on the Chart service
      const [statsRes, usersRes, creditRes] = await Promise.all([
        fetch(`${CHART_URL}/api/admin/stats`, { headers }).then(r=>r.json()).catch(()=>({})),
        fetch(`${CHART_URL}/api/admin/users?page=1&pageSize=10`, { headers }).then(r=>r.json()).catch(()=>({})),
        fetch(`${CHART_URL}/api/admin/credit-economy`, { headers }).then(r=>r.json()).catch(()=>({})),
      ])

      setStats({
        totalUsers:   statsRes?.data?.totalUsers   ?? statsRes?.totalUsers,
        activeUsers:  statsRes?.data?.activeUsers  ?? statsRes?.activeUsers,
        totalCharts:  statsRes?.data?.totalCharts  ?? statsRes?.totalCharts,
        totalRevenue: statsRes?.data?.totalRevenue ?? statsRes?.totalRevenue ?? 0,
        totalConsults:statsRes?.data?.totalConsults?? statsRes?.totalConsults ?? 0,
        avgRating:    statsRes?.data?.avgRating    ?? statsRes?.avgRating ?? 0,
        recentUsers:  usersRes?.data?.users || usersRes?.data || [],
      })
    } catch (e:any) {
      setErr('Failed to load stats: ' + (e?.message || 'Unknown error'))
    }
    setLoading(false)
  }

  const StatCard = ({ icon: Icon, label, value, color = 'var(--acc)', sub = '' }: any) => (
    <div className="card" style={{padding:'20px'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'12px'}}>
        <div style={{padding:'8px',borderRadius:'10px',background:`${color}18`}}>
          <Icon style={{width:'18px',height:'18px',color}}/>
        </div>
        {sub && <span style={{fontSize:'10px',color:'var(--txm)',
          background:'var(--bg2)',padding:'2px 8px',borderRadius:'20px'}}>{sub}</span>}
      </div>
      <div style={{fontFamily:'Cinzel,serif',fontWeight:900,fontSize:'28px',
        color:'var(--tx)',lineHeight:1,marginBottom:'4px'}}>
        {loading ? '—' : (value ?? '0')}
      </div>
      <div style={{fontSize:'12px',color:'var(--txm)',fontWeight:600}}>{label}</div>
    </div>
  )

  return (
    <div style={{maxWidth:'1400px',margin:'0 auto',padding:'20px 16px'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'24px'}}>
        <div>
          <h1 style={{fontFamily:'Cinzel,serif',fontWeight:700,fontSize:'22px',color:'var(--acc)'}}>
            Admin Dashboard
          </h1>
          <p style={{fontSize:'12px',color:'var(--txm)',marginTop:'2px'}}>VedicHora Platform</p>
        </div>
        <button onClick={fetchStats} disabled={loading}
          style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',
            borderRadius:'8px',border:'1px solid var(--bd)',background:'var(--bg2)',
            cursor:'pointer',fontSize:'12px',color:'var(--tx2)',fontFamily:'inherit'}}>
          <RefreshCw style={{width:'12px',height:'12px',
            animation:loading?'spin 1s linear infinite':'none'}}/> Refresh
        </button>
      </div>

      {err && (
        <div style={{padding:'12px',borderRadius:'8px',marginBottom:'16px',
          background:'rgba(220,38,38,.08)',border:'1px solid rgba(220,38,38,.2)',
          fontSize:'13px',color:'#DC2626'}}>{err}</div>
      )}

      {/* Stats grid */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginBottom:'24px'}}>
        <StatCard icon={Users}      label="Total Users"    value={stats.totalUsers}    color="#8B5CF6"/>
        <StatCard icon={Activity}   label="Active Users"   value={stats.activeUsers}   color="#10B981"/>
        <StatCard icon={Star}       label="Total Charts"   value={stats.totalCharts}   color="#F59E0B"/>
        <StatCard icon={CreditCard} label="Revenue (₹)"   value={stats.totalRevenue ? `₹${Number(stats.totalRevenue).toLocaleString('en-IN')}` : '₹0'} color="#EF4444"/>
        <StatCard icon={BarChart3}  label="Consultations" value={stats.totalConsults}  color="#3B82F6"/>
        <StatCard icon={TrendingUp} label="Avg Rating"    value={stats.avgRating ? `${Number(stats.avgRating).toFixed(1)} ⭐` : '—'} color="#F97316"/>
      </div>

      {/* Recent users */}
      <div className="card">
        <div className="card-hd">
          <Users style={{width:'14px',height:'14px',color:'var(--gold)'}}/>
          <span className="card-title">Recent Users</span>
          <span style={{marginLeft:'auto',fontSize:'11px',color:'var(--txm)'}}>
            {Array.isArray(stats.recentUsers) ? stats.recentUsers.length : 0} shown
          </span>
        </div>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'12px'}}>
            <thead>
              <tr style={{borderBottom:'2px solid var(--bd)'}}>
                {['Name','Email','Plan','Joined','Charts','Status'].map(h=>(
                  <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:'9px',
                    fontWeight:700,textTransform:'uppercase',color:'var(--txm)',
                    letterSpacing:'.05em'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{padding:'20px',textAlign:'center',
                  color:'var(--txm)'}}>Loading...</td></tr>
              ) : !Array.isArray(stats.recentUsers) || stats.recentUsers.length === 0 ? (
                <tr><td colSpan={6} style={{padding:'20px',textAlign:'center',
                  color:'var(--txm)'}}>No users found — admin API may need seeding</td></tr>
              ) : (
                stats.recentUsers.map((u:any, i:number) => (
                  <tr key={i} style={{borderBottom:'1px solid var(--bd)',
                    background:i%2===0?'transparent':'var(--bg2)'}}>
                    <td style={{padding:'8px 12px',fontWeight:600,color:'var(--tx)'}}>
                      {u.displayName||u.name||'—'}</td>
                    <td style={{padding:'8px 12px',color:'var(--txm)',fontSize:'11px'}}>
                      {u.email||'—'}</td>
                    <td style={{padding:'8px 12px'}}>
                      <span style={{padding:'2px 8px',borderRadius:'20px',fontSize:'10px',
                        fontWeight:700,background:'rgba(196,146,42,.15)',color:'var(--gold)'}}>
                        {u.plan||u.planName||'free'}</span></td>
                    <td style={{padding:'8px 12px',color:'var(--txm)',fontSize:'11px'}}>
                      {u.createdAt?new Date(u.createdAt).toLocaleDateString('en-IN'):'—'}</td>
                    <td style={{padding:'8px 12px',textAlign:'center',color:'var(--txm)'}}>
                      {u.chartCount||u.charts||0}</td>
                    <td style={{padding:'8px 12px'}}>
                      <span style={{padding:'2px 8px',borderRadius:'20px',fontSize:'10px',
                        fontWeight:700,
                        background:u.isActive||u.active?'rgba(74,222,128,.15)':'rgba(248,113,113,.15)',
                        color:u.isActive||u.active?'#16A34A':'#DC2626'}}>
                        {u.isActive||u.active?'Active':'Inactive'}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginTop:'16px'}}>
        {[
          {label:'API Docs',        href:'/api-docs',    icon:'📖'},
          {label:'Language Config', href:'/learn',       icon:'🌐'},
          {label:'Plans & Pricing', href:'/shop',        icon:'💳'},
        ].map(l=>(
          <a key={l.label} href={l.href}
            style={{display:'flex',alignItems:'center',gap:'10px',padding:'14px 16px',
              borderRadius:'10px',border:'1px solid var(--bd)',background:'var(--bg2)',
              textDecoration:'none',color:'var(--tx2)',fontSize:'13px',fontWeight:600}}>
            <span style={{fontSize:'18px'}}>{l.icon}</span>{l.label}
          </a>
        ))}
      </div>
    </div>
  )
}
