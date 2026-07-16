'use client'
import { useRouter } from 'next/navigation'
import { useStore } from '@/store'
import { getInitials } from '@/lib/utils'
import { Star, MessageCircle, Phone } from 'lucide-react'

interface Astrologer {
  userId: number
  displayName: string
  specialties: string[]
  ratePerMinute: number
  averageRating: number
  totalSessions: number
  isOnline: boolean
}

export default function AstrologerCard({ a }: { a: Astrologer }) {
  const router = useRouter()
  const { token, currencySym } = useStore()

  const handleAction = (mode: string) => {
    if (!token) { router.push('/signin'); return }
    router.push(`/session?astrologerId=${a.userId}&mode=${mode}`)
  }

  return (
    <div className="card flex flex-col gap-4 p-4 hover:shadow-card-hover transition-shadow">
      {/* Avatar */}
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-maroon to-maroon-light flex items-center justify-center text-white text-lg font-bold shadow-md">
            {getInitials(a.displayName)}
          </div>
          <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${a.isOnline ? 'bg-emerald-500' : 'bg-gray-300'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-maroon text-sm truncate">{a.displayName}</div>
          <div className="text-xs text-gray-400 truncate">{(a.specialties || []).join(' · ')}</div>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-3 h-3 text-gold fill-gold" />
            <span className="text-xs font-semibold text-gray-700">{(a.averageRating || 4.8).toFixed(1)}</span>
            <span className="text-xs text-gray-400">· {(a.totalSessions || 0).toLocaleString()} sessions</span>
          </div>
        </div>
      </div>

      {/* Rate */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-bold text-maroon font-cinzel">{currencySym}{a.ratePerMinute}</span>
          <span className="text-xs text-gray-400">/min</span>
        </div>
        {a.isOnline
          ? <span className="badge-ok text-xs px-2 py-0.5">Online</span>
          : <span className="badge-warn text-xs px-2 py-0.5">Offline</span>
        }
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button onClick={() => handleAction('chat')}
          className="flex-1 btn-primary text-xs py-2 flex items-center justify-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5" /> Chat
        </button>
        <button onClick={() => handleAction('call')}
          className="flex-1 btn-ghost text-xs py-2 flex items-center justify-center gap-1.5">
          <Phone className="w-3.5 h-3.5" /> Call
        </button>
      </div>
    </div>
  )
}
