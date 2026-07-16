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
}

export default function DatePicker({ value, onChange, showTime = true, showUnknown = false }: Props) {
  const upd = (patch: Partial<DateValue>) => onChange({ ...value, ...patch })

  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const years = Array.from({ length: 126 }, (_, i) => 2025 - i)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1)
  const mins  = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {/* Day */}
        <div className="flex flex-col gap-1">
          <span className="label">Day</span>
          <select className="select w-20" value={value.dd || ''} onChange={e => upd({ dd: +e.target.value })}>
            <option value="">Day</option>
            {days.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        {/* Month */}
        <div className="flex flex-col gap-1">
          <span className="label">Month</span>
          <select className="select w-36" value={value.mm || ''} onChange={e => upd({ mm: +e.target.value })}>
            <option value="">Month</option>
            {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        {/* Year */}
        <div className="flex flex-col gap-1">
          <span className="label">Year</span>
          <select className="select w-24" value={value.yyyy || ''} onChange={e => upd({ yyyy: +e.target.value })}>
            <option value="">Year</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {showTime && (
          <>
            <div className="flex items-end text-gray-300 pb-2.5 text-lg">·</div>
            {/* Hour */}
            <div className="flex flex-col gap-1">
              <span className="label">Hour</span>
              <select className="select w-18" value={value.hr || ''} onChange={e => upd({ hr: +e.target.value })} disabled={value.unknownTime}>
                <option value="">Hr</option>
                {hours.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div className="flex items-end text-gray-400 pb-2.5 font-semibold">:</div>
            {/* Min */}
            <div className="flex flex-col gap-1">
              <span className="label">Min</span>
              <select className="select w-18" value={value.mi ?? ''} onChange={e => upd({ mi: +e.target.value })} disabled={value.unknownTime}>
                <option value="">Min</option>
                {mins.map(m => <option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
              </select>
            </div>
            {/* AM/PM */}
            <div className="flex flex-col gap-1">
              <span className="label">AM/PM</span>
              <select className="select w-20" value={value.ap || 'AM'} onChange={e => upd({ ap: e.target.value as 'AM'|'PM' })} disabled={value.unknownTime}>
                <option>AM</option>
                <option>PM</option>
              </select>
            </div>
          </>
        )}
      </div>

      {showUnknown && (
        <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-500">
          <input
            type="checkbox"
            checked={!!value.unknownTime}
            onChange={e => upd({ unknownTime: e.target.checked })}
            className="accent-gold w-4 h-4"
          />
          I don't know my exact birth time
        </label>
      )}
    </div>
  )
}
