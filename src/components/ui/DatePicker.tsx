'use client'
import { MONTHS } from '@/lib/constants'

export interface DateValue {
  dd: number; mm: number; yyyy: number
  hr?: number; mi?: number; ap?: 'AM'|'PM'
  unknownTime?: boolean
}

interface Props {
  value: DateValue
  onChange: (v: DateValue) => void
  showTime?: boolean
  showUnknown?: boolean
  prefix?: string
}

export default function DatePicker({ value, onChange, showTime=true, showUnknown=false, prefix='' }: Props) {
  const u = (p: Partial<DateValue>) => onChange({ ...value, ...p })
  const days  = Array.from({length:31},(_,i)=>i+1)
  const years = Array.from({length:126},(_,i)=>2025-i)
  const hours = Array.from({length:12},(_,i)=>i+1)
  const mins  = Array.from({length:60},(_,i)=>i)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Row 1: Day · Month · Year */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
        <select className="select" style={{ flex: '0 0 80px' }}
          value={value.dd || ''} onChange={e => u({ dd: +e.target.value })}>
          <option value="">Day</option>
          {days.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="select" style={{ flex: '0 0 130px' }}
          value={value.mm || ''} onChange={e => u({ mm: +e.target.value })}>
          <option value="">Month</option>
          {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
        </select>
        <select className="select" style={{ flex: '0 0 90px' }}
          value={value.yyyy || ''} onChange={e => u({ yyyy: +e.target.value })}>
          <option value="">Year</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Row 2: Hour : Min AM/PM */}
      {showTime && (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap',
          opacity: value.unknownTime ? 0.4 : 1, pointerEvents: value.unknownTime ? 'none' : 'auto' }}>
          <select className="select" style={{ flex: '0 0 74px' }}
            value={value.hr || ''} onChange={e => u({ hr: +e.target.value })} disabled={value.unknownTime}>
            <option value="">Hr</option>
            {hours.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <span style={{ color: 'var(--txm)', fontWeight: 700, fontSize: '16px', lineHeight: 1 }}>:</span>
          <select className="select" style={{ flex: '0 0 74px' }}
            value={value.mi === undefined ? '' : value.mi} onChange={e => u({ mi: +e.target.value })} disabled={value.unknownTime}>
            <option value="">Min</option>
            {mins.map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
          </select>
          <select className="select" style={{ flex: '0 0 74px' }}
            value={value.ap || 'AM'} onChange={e => u({ ap: e.target.value as 'AM'|'PM' })} disabled={value.unknownTime}>
            <option>AM</option>
            <option>PM</option>
          </select>
        </div>
      )}

      {/* Unknown time checkbox */}
      {showUnknown && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '12px', color: 'var(--txm)', cursor: 'pointer' }}>
          <input type="checkbox" checked={!!value.unknownTime}
            onChange={e => u({ unknownTime: e.target.checked })}
            style={{ width: '14px', height: '14px', accentColor: 'var(--gold)', cursor: 'pointer' }} />
          I don't know my exact birth time
        </label>
      )}
    </div>
  )
}
