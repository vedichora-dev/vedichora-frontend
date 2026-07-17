'use client'
import { useState, useEffect } from 'react'

const SIZES   = [{ label:'A',   val:'14.5px' }, { label:'A+',  val:'16.5px' }, { label:'A++', val:'18.5px' }, { label:'A+++',val:'20.5px' }]
const FONTS   = [{ label:'Standard',     val:'normal'   }, { label:'OpenDyslexic', val:'dyslexic' }]
const MOTION  = [{ label:'Normal', val:'normal' }, { label:'Off', val:'off' }]
const SPACING = [{ label:'Normal', val:'1.6' }, { label:'Wide', val:'1.9' }, { label:'Wider', val:'2.15' }]

function apply(type: string, val: string) {
  if (type === 'sz') {
    document.documentElement.style.fontSize = val
    localStorage.setItem('vh_sz', val)
  }
  if (type === 'fn') {
    document.body.style.fontFamily = val === 'dyslexic' ? "'OpenDyslexic',sans-serif" : ''
    localStorage.setItem('vh_fn', val)
  }
  if (type === 'mo') {
    document.documentElement.style.setProperty('--transition', val === 'off' ? 'none' : '')
    if (val === 'off') document.documentElement.classList.add('reduce-motion')
    else document.documentElement.classList.remove('reduce-motion')
    localStorage.setItem('vh_mo', val)
  }
  if (type === 'ls') {
    document.body.style.lineHeight = val
    localStorage.setItem('vh_ls', val)
  }
}

function reset() {
  document.documentElement.style.fontSize = ''
  document.body.style.fontFamily = ''
  document.body.style.lineHeight = ''
  document.documentElement.classList.remove('reduce-motion')
  localStorage.removeItem('vh_sz')
  localStorage.removeItem('vh_fn')
  localStorage.removeItem('vh_mo')
  localStorage.removeItem('vh_ls')
}

export default function A11yPanel() {
  const [open, setOpen] = useState(false)
  const [sz, setSz] = useState('14.5px')
  const [fn, setFn] = useState('normal')
  const [mo, setMo] = useState('normal')
  const [ls, setLs] = useState('1.6')

  // Restore saved preferences on mount
  useEffect(() => {
    const savedSz = localStorage.getItem('vh_sz')
    const savedFn = localStorage.getItem('vh_fn')
    const savedMo = localStorage.getItem('vh_mo')
    const savedLs = localStorage.getItem('vh_ls')
    if (savedSz) { setSz(savedSz); document.documentElement.style.fontSize = savedSz }
    if (savedFn) { setFn(savedFn); apply('fn', savedFn) }
    if (savedMo) { setMo(savedMo); apply('mo', savedMo) }
    if (savedLs) { setLs(savedLs); document.body.style.lineHeight = savedLs }
  }, [])

  const handleReset = () => { reset(); setSz('14.5px'); setFn('normal'); setMo('normal'); setLs('1.6') }

  const optBtn = (active: boolean, label: string, onClick: () => void) => (
    <button key={label} onClick={onClick}
      style={{
        padding:'5px 10px', borderRadius:'6px', fontSize:'11px', cursor:'pointer',
        fontFamily:'inherit', border: active ? '1.5px solid var(--gold)' : '1.5px solid var(--bd)',
        background: active ? 'var(--acc-l,#FBEAE6)' : 'var(--bg2)',
        color: active ? 'var(--acc)' : 'var(--tx2)', transition:'all .15s',
      }}>
      {label}
    </button>
  )

  return (
    <>
      {/* Floating trigger button */}
      <button
        id="afab"
        onClick={() => setOpen(o => !o)}
        aria-label="Accessibility settings"
        aria-expanded={open}
        style={{
          position:'fixed', bottom:'72px', right:'18px', zIndex:400,
          width:'36px', height:'36px', borderRadius:'9px',
          background:'var(--surf)', border:'1px solid var(--bd)',
          color:'var(--txm)', display:'flex', alignItems:'center',
          justifyContent:'center', cursor:'pointer', boxShadow:'var(--sh1)',
          transition:'border-color .15s, color .15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='var(--gold)'; e.currentTarget.style.color='var(--gold)' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='var(--bd)';   e.currentTarget.style.color='var(--txm)' }}
        title="Accessibility settings"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
          <path d="M5 9h14M9 9v11M15 9v11M9 14h6"/>
        </svg>
      </button>

      {/* Backdrop */}
      {open && (
        <div onClick={() => setOpen(false)}
          style={{ position:'fixed', inset:0, zIndex:449, background:'rgba(0,0,0,.2)' }} />
      )}

      {/* Drawer — slides in from left, exact match to original HTML */}
      <div
        role="dialog" aria-label="Accessibility settings" aria-modal="true"
        style={{
          position:'fixed', top:0, bottom:0, left: open ? 0 : '-270px',
          width:'260px', background:'var(--surf)', borderRight:'1px solid var(--bd)',
          boxShadow:'var(--sh3)', zIndex:450, padding:'16px',
          overflowY:'auto', transition:'left .25s ease',
        }}
      >
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'13px'}}>
          <div>
            <div style={{fontFamily:"Cinzel,serif",fontSize:'14px',color:'var(--tx)'}}>Accessibility</div>
            <div style={{fontSize:'10.5px',color:'var(--txm)',marginTop:'2px'}}>Customise your reading experience</div>
          </div>
          <button onClick={() => setOpen(false)}
            style={{background:'none',border:'1px solid var(--bd)',borderRadius:'6px',cursor:'pointer',
              padding:'4px 8px',color:'var(--tx2)',fontSize:'11px',fontFamily:'inherit'}}>
            ✕
          </button>
        </div>

        {/* Text size */}
        <div style={{marginBottom:'14px'}}>
          <div style={{fontSize:'9.5px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--txm)',marginBottom:'7px'}}>Text size</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
            {SIZES.map(s => optBtn(sz===s.val, s.label, () => { setSz(s.val); apply('sz',s.val) }))}
          </div>
        </div>

        {/* Font */}
        <div style={{marginBottom:'14px'}}>
          <div style={{fontSize:'9.5px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--txm)',marginBottom:'7px'}}>Font</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
            {FONTS.map(f => optBtn(fn===f.val, f.label, () => { setFn(f.val); apply('fn',f.val) }))}
          </div>
        </div>

        {/* Motion */}
        <div style={{marginBottom:'14px'}}>
          <div style={{fontSize:'9.5px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--txm)',marginBottom:'7px'}}>Motion</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
            {MOTION.map(m => optBtn(mo===m.val, m.label, () => { setMo(m.val); apply('mo',m.val) }))}
          </div>
        </div>

        {/* Line spacing */}
        <div style={{marginBottom:'14px'}}>
          <div style={{fontSize:'9.5px',fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:'var(--txm)',marginBottom:'7px'}}>Line spacing</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:'5px'}}>
            {SPACING.map(s => optBtn(ls===s.val, s.label, () => { setLs(s.val); apply('ls',s.val) }))}
          </div>
        </div>

        <button onClick={handleReset}
          style={{width:'100%',padding:'8px',borderRadius:'8px',border:'1px solid var(--bd)',
            background:'transparent',color:'var(--tx2)',fontSize:'12px',cursor:'pointer',
            fontFamily:'inherit',marginTop:'8px'}}>
          Reset to defaults
        </button>
      </div>
    </>
  )
}
