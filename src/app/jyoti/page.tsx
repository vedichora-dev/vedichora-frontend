'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { jyotiChat, jyotiSessions, jyotiSession, jyotiNewSession, jyotiDeleteSession, jyotiPersonas, listCharts } from '@/api'
import { Send, Plus, Trash2, ChevronRight, Sparkles, RefreshCw, MessageSquare, Star } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt?: string
}

interface Session {
  sessionId: string
  title: string
  horoscopeId?: string
  lastMessageAt: string
  messageCount?: number
}

const STARTERS = [
  'What does my current dasha period mean for my career?',
  'When is a good time for marriage based on my chart?',
  'What are the strongest yogas in my horoscope?',
  'How will Sade Sati affect me in the coming years?',
  'What remedies do you suggest for my chart challenges?',
  'Analyse my 10th house for career prospects',
  'What does my Moon nakshatra say about my personality?',
  'When will my financial situation improve?',
]

export default function JyotiPage() {
  const router  = useRouter()
  const { token } = useStore()

  const [sessions,     setSessions]     = useState<Session[]>([])
  const [activeSession,setActiveSession]= useState<string | null>(null)
  const [messages,     setMessages]     = useState<Message[]>([])
  const [input,        setInput]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [sessLoading,  setSessLoading]  = useState(false)
  const [msgLoading,   setMsgLoading]   = useState(false)
  const [charts,       setCharts]       = useState<any[]>([])
  const [selChart,     setSelChart]     = useState('')
  const [showSidebar,  setShowSidebar]  = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)

  // Redirect if not logged in
  useEffect(() => {
    if (!token) { router.push('/signin'); return }
  }, [token, router])

  // Load sessions + charts on mount
  useEffect(() => {
    if (!token) return
    loadSessions()
    listCharts().then((res: any) => {
      const list = Array.isArray(res) ? res : (res?.data?.data ?? res?.data ?? [])
      setCharts(list)
      if (list.length > 0) setSelChart(list[0].horoscopeId || list[0].HoroscopeId || '')
    }).catch(() => {})
  }, [token])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadSessions = async () => {
    setSessLoading(true)
    try {
      const res = await jyotiSessions()
      const list = res?.data?.data ?? res?.data ?? []
      setSessions(Array.isArray(list) ? list : [])
    } catch {}
    setSessLoading(false)
  }

  const loadSession = async (sessionId: string) => {
    setMsgLoading(true)
    setActiveSession(sessionId)
    setMessages([])
    try {
      const res = await jyotiSession(sessionId)
      const detail = res?.data?.data ?? res?.data ?? {}
      const msgs: Message[] = (detail.messages || []).map((m: any) => ({
        id: m.messageId || m.MessageId || Math.random().toString(36),
        role: (m.role || m.Role || 'assistant').toLowerCase() as 'user'|'assistant',
        content: m.content || m.Content || '',
        createdAt: m.createdAt || m.CreatedAt,
      }))
      setMessages(msgs)
    } catch {}
    setMsgLoading(false)
  }

  const newSession = async () => {
    const title = `Jyoti Chat ${new Date().toLocaleDateString('en-IN', {day:'numeric',month:'short'})}`
    try {
      const res = await jyotiNewSession(title, selChart || undefined)
      const sess = res?.data?.data ?? res?.data ?? {}
      const id = sess.sessionId || sess.SessionId
      if (id) {
        await loadSessions()
        setMessages([])
        setActiveSession(id)
      }
    } catch {}
  }

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await jyotiDeleteSession(id)
      if (activeSession === id) { setActiveSession(null); setMessages([]) }
      await loadSessions()
    } catch {}
  }

  const send = async (msg?: string) => {
    const text = (msg || input).trim()
    if (!text || loading) return

    // Optimistic add
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await jyotiChat({
        message: text,
        sessionId: activeSession || undefined,
        horoscopeId: selChart || undefined,
        lang: 'en',
      })
      const data = res?.data?.data ?? res?.data ?? {}
      const reply: Message = {
        id: (data.messageId || data.MessageId || Date.now() + 1).toString(),
        role: 'assistant',
        content: data.JyotiResponse || data.jyotiResponse || data.reply || data.Response || data.message || data.Message || 'I am unable to respond right now. Please ensure the AI API key is configured in the server.',
      }
      setMessages(prev => [...prev, reply])
      // Update session ID if new session was created
      if ((data.sessionId || data.SessionId) && !activeSession) {
        setActiveSession(data.sessionId || data.SessionId)
        await loadSessions()
      }
    } catch (e: any) {
      const errMsg = e?.response?.data?.message || e?.message || 'Failed to get response. Please try again.'
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: 'assistant',
        content: `⚠️ ${errMsg}`
      }])
    }
    setLoading(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const formatTime = (iso?: string) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  const formatDate = (iso?: string) => {
    if (!iso) return ''
    try {
      return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    } catch { return '' }
  }

  if (!token) return null

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

      {/* ── SIDEBAR ── */}
      {showSidebar && (
        <div style={{
          width: '260px', flexShrink: 0, borderRight: '1px solid var(--bd)',
          background: 'var(--bg)', display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bd)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Sparkles style={{ width: '16px', height: '16px', color: 'var(--gold)' }} />
              <span style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '14px', color: 'var(--acc)' }}>
                Jyoti AI
              </span>
            </div>
            {/* Chart selector */}
            {charts.length > 0 && (
              <select value={selChart} onChange={e => setSelChart(e.target.value)}
                className="input" style={{ fontSize: '11px', padding: '5px 8px' }}>
                <option value="">No chart selected</option>
                {charts.map((c: any) => {
                  const id = c.horoscopeId || c.HoroscopeId
                  const nm = c.personName  || c.PersonName || 'Chart'
                  const lg = c.ascendantName || c.AscendantName || ''
                  return <option key={id} value={id}>{nm}{lg ? ` · ${lg}` : ''}</option>
                })}
              </select>
            )}
          </div>

          {/* New Session button */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--bd)' }}>
            <button onClick={newSession}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px', borderRadius: '8px', border: '1.5px dashed var(--gold)',
                background: 'rgba(196,146,42,.06)', color: 'var(--gold)',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit' }}>
              <Plus style={{ width: '13px', height: '13px' }} /> New Conversation
            </button>
          </div>

          {/* Sessions list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {sessLoading && (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--txm)' }}>
                Loading...
              </div>
            )}
            {!sessLoading && sessions.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--txm)' }}>
                No conversations yet.<br />Start a new one above.
              </div>
            )}
            {sessions.map(sess => (
              <div key={sess.sessionId}
                onClick={() => loadSession(sess.sessionId)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  padding: '10px 12px', cursor: 'pointer',
                  background: activeSession === sess.sessionId ? 'rgba(196,146,42,.08)' : 'transparent',
                  borderLeft: `3px solid ${activeSession === sess.sessionId ? 'var(--gold)' : 'transparent'}`,
                  transition: 'background .1s',
                }}
                onMouseEnter={e => { if (activeSession !== sess.sessionId) e.currentTarget.style.background = 'var(--bg2)' }}
                onMouseLeave={e => { if (activeSession !== sess.sessionId) e.currentTarget.style.background = 'transparent' }}>
                <MessageSquare style={{ width: '13px', height: '13px', color: 'var(--txm)', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {sess.title}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--txm)', marginTop: '2px' }}>
                    {formatDate(sess.lastMessageAt)}
                  </div>
                </div>
                <button onClick={e => deleteSession(sess.sessionId, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px',
                    color: 'var(--txm)', flexShrink: 0, opacity: 0.5 }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}>
                  <Trash2 style={{ width: '11px', height: '11px' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── MAIN CHAT ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>

        {/* Chat header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--bd)',
          display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--surf)' }}>
          <button onClick={() => setShowSidebar(s => !s)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
              color: 'var(--txm)', display: 'flex' }}>
            <MessageSquare style={{ width: '16px', height: '16px' }} />
          </button>
          <Sparkles style={{ width: '16px', height: '16px', color: 'var(--gold)' }} />
          <div>
            <div style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '14px', color: 'var(--acc)' }}>
              Jyoti AI
            </div>
            <div style={{ fontSize: '10px', color: 'var(--txm)' }}>
              Senior Vedic Astrologer · Powered by AI
            </div>
          </div>
          {selChart && charts.length > 0 && (() => {
            const c = charts.find((x: any) => (x.horoscopeId || x.HoroscopeId) === selChart)
            if (!c) return null
            return (
              <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--txm)',
                background: 'var(--bg2)', padding: '4px 10px', borderRadius: '20px',
                border: '1px solid var(--bd)' }}>
                📊 {c.personName || c.PersonName} · {c.ascendantName || c.AscendantName}
              </div>
            )
          })()}
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Welcome screen */}
          {!activeSession && messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', flex: 1, gap: '24px', padding: '40px 20px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌟</div>
                <div style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '22px',
                  color: 'var(--acc)', marginBottom: '8px' }}>Namaste, I am Jyoti</div>
                <p style={{ fontSize: '13px', color: 'var(--txm)', maxWidth: '360px',
                  lineHeight: 1.7, margin: '0 auto' }}>
                  Your personal AI Vedic astrologer. I can analyse your birth chart, explain your
                  dashas, discuss planetary transits, and provide classical remedies — all grounded
                  in BPHS, BV Raman, and Uttara Kalamrita.
                </p>
              </div>
              {charts.length === 0 && (
                <div style={{ background: 'rgba(196,146,42,.08)', border: '1px solid var(--gold)',
                  borderRadius: '10px', padding: '12px 16px', fontSize: '12px', color: 'var(--gold)',
                  textAlign: 'center' }}>
                  💡 <a href="/chart" style={{ color: 'var(--gold)', fontWeight: 600 }}>Generate your chart</a> first
                  so I can give personalised predictions.
                </div>
              )}
              <div style={{ width: '100%', maxWidth: '600px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--txm)',
                  textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '10px',
                  textAlign: 'center' }}>
                  Suggested questions
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {STARTERS.map((s, i) => (
                    <button key={i} onClick={() => send(s)}
                      style={{ padding: '10px 12px', borderRadius: '10px', textAlign: 'left',
                        border: '1px solid var(--bd)', background: 'var(--surf)', cursor: 'pointer',
                        fontSize: '12px', color: 'var(--tx)', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'flex-start', gap: '8px',
                        transition: 'border-color .15s, background .15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'rgba(196,146,42,.04)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.background = 'var(--surf)' }}>
                      <ChevronRight style={{ width: '12px', height: '12px', color: 'var(--gold)', flexShrink: 0, marginTop: '2px' }} />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Loading session messages */}
          {msgLoading && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--txm)', fontSize: '13px' }}>
              <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite', display: 'inline-block', marginRight: '8px' }} />
              Loading conversation...
            </div>
          )}

          {/* Messages */}
          {!msgLoading && messages.map((msg, i) => (
            <div key={msg.id || i} style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '10px', alignItems: 'flex-start',
            }}>
              {/* Avatar for assistant */}
              {msg.role === 'assistant' && (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,var(--acc),var(--gold))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', color: '#fff', fontWeight: 700 }}>
                  🌟
                </div>
              )}
              <div style={{ maxWidth: '72%' }}>
                <div style={{
                  padding: '10px 14px', borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                  background: msg.role === 'user' ? 'var(--acc)' : 'var(--surf)',
                  color: msg.role === 'user' ? '#fff' : 'var(--tx)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--bd)',
                  fontSize: '13px', lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {msg.content}
                </div>
                {msg.createdAt && (
                  <div style={{ fontSize: '10px', color: 'var(--txm)', marginTop: '4px',
                    textAlign: msg.role === 'user' ? 'right' : 'left' }}>
                    {formatTime(msg.createdAt)}
                  </div>
                )}
              </div>
              {/* Avatar for user */}
              {msg.role === 'user' && (
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--bg2)', border: '1px solid var(--bd)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px' }}>
                  👤
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--acc),var(--gold))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', color: '#fff', flexShrink: 0 }}>
                🌟
              </div>
              <div style={{ padding: '10px 14px', borderRadius: '4px 18px 18px 18px',
                background: 'var(--surf)', border: '1px solid var(--bd)',
                display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: 'var(--txm)',
                    animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`,
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--bd)', background: 'var(--surf)' }}>
          {/* Starters (only when no messages) */}
          {messages.length === 0 && !activeSession && (
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '10px', paddingBottom: '4px' }}>
              {STARTERS.slice(0, 4).map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  style={{ flexShrink: 0, padding: '4px 10px', borderRadius: '20px',
                    border: '1px solid var(--bd)', background: 'var(--bg)', cursor: 'pointer',
                    fontSize: '11px', color: 'var(--txm)', fontFamily: 'inherit',
                    whiteSpace: 'nowrap' }}>
                  {s.length > 40 ? s.slice(0, 38) + '…' : s}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask Jyoti about your chart, dashas, remedies..."
              disabled={loading}
              rows={1}
              style={{
                flex: 1, resize: 'none', padding: '10px 14px', borderRadius: '12px',
                border: '1.5px solid var(--bd)', background: 'var(--bg)',
                color: 'var(--tx)', fontSize: '13px', fontFamily: 'inherit',
                outline: 'none', lineHeight: 1.5, maxHeight: '120px',
                transition: 'border-color .15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--gold)'}
              onBlur={e => e.target.style.borderColor = 'var(--bd)'}
              onInput={e => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = Math.min(t.scrollHeight, 120) + 'px'
              }}
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              style={{
                width: '42px', height: '42px', borderRadius: '12px', border: 'none',
                background: input.trim() && !loading ? 'var(--acc)' : 'var(--bd)',
                color: input.trim() && !loading ? '#fff' : 'var(--txm)',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all .15s', flexShrink: 0,
              }}>
              <Send style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
          <div style={{ marginTop: '6px', fontSize: '10px', color: 'var(--txm)', textAlign: 'center' }}>
            Enter to send · Shift+Enter for new line · Answers grounded in BPHS & BV Raman
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}
