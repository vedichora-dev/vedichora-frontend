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
  const days = Array.from({length:31},(_,i)=>i+1)
  const years = Array.from({length:126},(_,i)=>2025-i)
  const hours = Array.from({length:12},(_,i)=>i+1)
  const mins  = Array.from({length:60},(_,i)=>i)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
      <div style={{display:'flex',gap:'8px',alignItems:'flex-end',flexWrap:'wrap'}}>
        <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
          <div className="label">Day</div>
          <select className="select" style={{width:'72px'}} value={value.dd||''} onChange={e=>u({dd:+e.target.value})}>
            <option value="">Day</option>
            {days.map(d=><option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
          <div className="label">Month</div>
          <select className="select" style={{width:'138px'}} value={value.mm||''} onChange={e=>u({mm:+e.target.value})}>
            <option value="">Month</option>
            {MONTHS.map((m,i)=><option key={m} value={i+1}>{m}</option>)}
          </select>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
          <div className="label">Year</div>
          <select className="select" style={{width:'90px'}} value={value.yyyy||''} onChange={e=>u({yyyy:+e.target.value})}>
            <option value="">Year</option>
            {years.map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {showTime && <>
          <div style={{color:'var(--txm)',paddingBottom:'10px',fontSize:'18px',lineHeight:1}}>·</div>
          <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
            <div className="label">Hour</div>
            <select className="select" style={{width:'72px'}} value={value.hr||''} onChange={e=>u({hr:+e.target.value})} disabled={value.unknownTime}>
              <option value="">Hr</option>
              {hours.map(h=><option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div style={{color:'var(--txm)',paddingBottom:'10px',fontSize:'18px',fontWeight:600,lineHeight:1}}>:</div>
          <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
            <div className="label">Min</div>
            <select className="select" style={{width:'72px'}} value={value.mi===undefined?'':value.mi} onChange={e=>u({mi:+e.target.value})} disabled={value.unknownTime}>
              <option value="">Min</option>
              {mins.map(m=><option key={m} value={m}>{String(m).padStart(2,'0')}</option>)}
            </select>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
            <div className="label">AM/PM</div>
            <select className="select" style={{width:'76px'}} value={value.ap||'AM'} onChange={e=>u({ap:e.target.value as 'AM'|'PM'})} disabled={value.unknownTime}>
              <option>AM</option><option>PM</option>
            </select>
          </div>
        </>}
      </div>
      {showUnknown && (
        <label style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:'var(--txm)',cursor:'pointer',marginTop:'4px'}}>
          <input type="checkbox" id={`${prefix}unk`} checked={!!value.unknownTime}
            onChange={e=>u({unknownTime:e.target.checked})}
            style={{width:'14px',height:'14px',accentColor:'var(--gold)',cursor:'pointer'}} />
          I don't know my exact birth time
        </label>
      )}
    </div>
  )
}
