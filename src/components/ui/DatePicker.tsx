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

export default function DatePicker({ value, onChange, showTime = true, showUnknown = false, prefix = '' }: Props) {
  const u = (p: Partial<DateValue>) => onChange({ ...value, ...p })

  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const years = Array.from({ length: 126 }, (_, i) => 2025 - i)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const mins = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className="bdp-wrap">
      <div className="bdp-row">
        <div className="bdp-field">
          <div className="bdp-lbl">Day</div>
          <select className="bdp-sel bdp-day" value={value.dd || ''} onChange={e => u({ dd: +e.target.value })}>
            <option value="">Day</option>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="bdp-field">
          <div className="bdp-lbl">Month</div>
          <select className="bdp-sel bdp-mon" value={value.mm || ''} onChange={e => u({ mm: +e.target.value })}>
            <option value="">Month</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="bdp-field">
          <div className="bdp-lbl">Year</div>
          <select className="bdp-sel bdp-yr" value={value.yyyy || ''} onChange={e => u({ yyyy: +e.target.value })}>
            <option value="">Year</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {showTime && (
          <>
            <div className="bdp-field">
              <div className="bdp-lbl">Hour</div>
              <select className="bdp-sel bdp-hr" value={value.hr || ''} onChange={e => u({ hr: +e.target.value })} disabled={value.unknownTime}>
                <option value="">Hr</option>
                {hours.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="bdp-field">
              <div className="bdp-lbl">Min</div>
              <select className="bdp-sel bdp-mi" value={value.mi ?? ''} onChange={e => u({ mi: +e.target.value })} disabled={value.unknownTime}>
                <option value="">Min</option>
                {mins.map(m => <option key={m} value={m}>{String(m).padStart(2, '0')}</option>)}
              </select>
            </div>
            <div className="bdp-field">
              <div className="bdp-lbl">AM/PM</div>
              <select className="bdp-sel bdp-ap" value={value.ap || 'AM'} onChange={e => u({ ap: e.target.value as 'AM'|'PM' })} disabled={value.unknownTime}>
                <option>AM</option>
                <option>PM</option>
              </select>
            </div>
          </>
        )}
      </div>
      {showUnknown && (
        <div className="bdp-unk" style={{display:'flex',alignItems:'center',gap:'8px',marginTop:'8px',fontSize:'12px',color:'var(--txm)',cursor:'pointer'}}>
          <input type="checkbox" id={`${prefix}unk`} checked={!!value.unknownTime}
            onChange={e => u({ unknownTime: e.target.checked })}
            style={{width:'14px',height:'14px',accentColor:'var(--gold)',cursor:'pointer'}} />
          <label htmlFor={`${prefix}unk`} style={{cursor:'pointer'}}>I don't know my exact birth time</label>
        </div>
      )}
    </div>
  )
}
