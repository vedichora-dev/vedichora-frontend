'use client'
import React, { useState, useEffect, useRef } from 'react'
import { calculateChart, calculateChartGuest, listCharts } from '@/api'
import { useStore } from '@/store'
import { to24Hour } from '@/lib/utils'
import DatePicker, { DateValue } from '@/components/ui/DatePicker'
import CityAutocomplete from '@/components/ui/CityAutocomplete'
import { Heart, ChevronRight, RefreshCw, CheckCircle, AlertCircle, MapPin, Download } from 'lucide-react'

const EMPTY: DateValue = { dd: 0, mm: 0, yyyy: 0 }

// ── Geocode fallback ─────────────────────────────────────────────────────────
// geocode now inline in calcChart using Nominatim

function buildPayload(n: string, d: DateValue, p: string, lat?: number, lng?: number, g?: string) {
  const tm = d.unknownTime ? { hour: 12, minute: 0 } : to24Hour(d.hr || 12, d.mi || 0, d.ap || 'AM')
  return {
    PersonName: n || g || 'Person',
    Year: d.yyyy, Month: d.mm, Day: d.dd,
    Hour: tm.hour, Minute: tm.minute, Second: 0,
    PlaceName: p || 'Chennai, India',
    Latitude: lat, Longitude: lng,
    // UtcOffsetHours omitted — backend auto-resolves timezone+DST from PlaceName+birthDate AyanamsaType: 'Lahiri',
    Gender: g,
  }
}

// ── PersonCard — at module level so CityAutocomplete never remounts ───────────
interface PersonCardProps {
  num: number
  gender: 'Male'|'Female'; setGender: (g: 'Male'|'Female') => void
  name: string; setName: (n: string) => void
  dob: DateValue; setDob: (d: DateValue) => void
  place: string; setPlace: (p: string) => void
  lat: number|undefined; setLat: (v: number|undefined) => void
  lng: number|undefined; setLng: (v: number|undefined) => void
  saved: any[]; token: string|null
  useSaved: boolean; setUseSaved: (b: boolean) => void
  selId: string; setSelId: (id: string) => void
  error?: string   // field-level error
}

function PersonCard({
  num, gender, setGender, name, setName, dob, setDob,
  place, setPlace, lat, setLat, lng, setLng,
  saved, token, useSaved, setUseSaved, selId, setSelId, error
}: PersonCardProps) {
  const citySelected = !!lat && !!lng
  const dateOk = dob.dd > 0 && dob.mm > 0 && dob.yyyy > 0

  return (
    <div className="card" style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <Heart style={{ width: '14px', height: '14px', color: num === 1 ? '#F87171' : '#F472B6', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '14px', color: 'var(--acc)' }}>
          Person {num}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {(['Male', 'Female'] as const).map(g => (
            <button key={g} onClick={() => setGender(g)}
              style={{ padding: '3px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                fontSize: '11px', fontWeight: 700, fontFamily: 'inherit',
                background: gender === g ? 'var(--acc)' : 'var(--bg2)',
                color: gender === g ? '#fff' : 'var(--txm)' }}>
              {g === 'Male' ? '♂ Male' : '♀ Female'}
            </button>
          ))}
        </div>
      </div>

      {/* Saved chart selector */}
      {token && saved.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            {['Enter Details', 'Saved Chart'].map((lbl, i) => (
              <button key={lbl} onClick={() => setUseSaved(i === 1)}
                style={{ flex: 1, padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontSize: '11px', fontWeight: 600, fontFamily: 'inherit',
                  background: (useSaved ? i === 1 : i === 0) ? 'var(--acc)' : 'var(--bg2)',
                  color: (useSaved ? i === 1 : i === 0) ? '#fff' : 'var(--txm)' }}>
                {lbl}
              </button>
            ))}
          </div>
          {useSaved && (
            <select
              value={selId}
              onChange={e => setSelId(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px',
                border: '1.5px solid var(--gold)', background: 'var(--bg)',
                color: 'var(--tx)', fontSize: '13px', fontFamily: 'inherit', cursor: 'pointer' }}>
              <option value="">— Select a chart —</option>
              {saved.map((c: any) => {
                const id = c.horoscopeId || c.HoroscopeId
                const nm = c.personName || c.PersonName || 'Chart'
                const lg = c.ascendantName || c.AscendantName || ''
                const nak = c.nakshatraName || c.NakshatraName || ''
                return <option key={id} value={id}>{nm} — {lg}{nak ? ' · ' + nak : ''}</option>
              })}
            </select>
          )}
        </div>
      )}

      {/* Manual entry */}
      {(!useSaved || !token) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Name */}
          <div>
            <label className="label">Full Name <span style={{ color: 'var(--txm)', fontWeight: 400 }}>(optional)</span></label>
            <input className="input" value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`${gender} name`} />
          </div>

          {/* Date + Time */}
          <div>
            <label className="label">
              Date & Time of Birth
              {dateOk && <CheckCircle style={{ width: '11px', height: '11px', color: '#16A34A', marginLeft: '6px', display: 'inline' }} />}
            </label>
            <DatePicker value={dob} onChange={setDob} showTime showUnknown prefix={`m${num}`} />
            {!dateOk && (
              <div style={{ fontSize: '11px', color: '#B45309', marginTop: '4px' }}>
                ↑ Please select day, month and year
              </div>
            )}
          </div>

          {/* City */}
          <div>
            <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Place of Birth
              {citySelected
                ? <CheckCircle style={{ width: '11px', height: '11px', color: '#16A34A' }} />
                : <span style={{ fontSize: '10px', color: '#DC2626', fontWeight: 400 }}>* required</span>
              }
            </label>
            <div style={{ position: 'relative' }}>
              <CityAutocomplete
                value={place}
                onChange={(city: string, la?: number, ln?: number) => {
                  setPlace(city)
                  setLat(la)
                  setLng(ln)
                }}
                placeholder="Type and select city from dropdown ▾"
              />
            </div>
            {place.trim() && !citySelected && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px',
                fontSize: '11px', color: '#DC2626', background: 'rgba(220,38,38,.06)',
                padding: '5px 8px', borderRadius: '6px', border: '1px solid rgba(220,38,38,.2)' }}>
                <AlertCircle style={{ width: '11px', height: '11px', flexShrink: 0 }} />
                Please <strong style={{ margin: '0 3px' }}>select a city from the dropdown</strong> — don't just type
              </div>
            )}
            {!place.trim() && (
              <div style={{ fontSize: '11px', color: 'var(--txm)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin style={{ width: '10px', height: '10px' }} />
                Type city name and click the suggestion that appears
              </div>
            )}
          </div>

          {/* Field-level error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px',
              borderRadius: '8px', background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)',
              fontSize: '12px', color: '#DC2626' }}>
              <AlertCircle style={{ width: '13px', height: '13px', flexShrink: 0 }} />
              {error}
            </div>
          )}


        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════

// ── Multilingual labels ──────────────────────────────────────────────────────
const L = {
  reportTitle:         { en: 'Vivaha Porutham Report', ta: 'திருமண பொருத்த அறிக்கை', hi: 'विवाह पोरुथम रिपोर्ट' },
  ashtaKoota:         { en: 'Ashta Koota', ta: 'அஷ்டகூட குணங்கள்', hi: 'अष्ट कूट' },
  pathuPorutham:      { en: 'Pathu Porutham', ta: 'பத்து பொருத்தம்', hi: 'पत्तु पोरुथम' },
  recommended:        { en: 'Recommendation', ta: 'பரிந்துரை', hi: 'अनुशंसा' },
  ashtaKootaDetail:   { en: 'Ashta Koota Breakdown', ta: 'அஷ்டகூட விரிவான அட்டவணை', hi: 'अष्ट कूट विवरण' },
  pathuPoruthamDetail:{ en: 'Pathu Porutham', ta: 'பத்து பொருத்தம் — விரிவான அட்டவணை', hi: 'पत्तु पोरुथम विवरण' },
  koota:   { en: 'Koota',   ta: 'கூட்டம்',   hi: 'कूट' },
  max:     { en: 'Max',     ta: 'அதிகபட்சம்', hi: 'अधिकतम' },
  score:   { en: 'Score',   ta: 'மதிப்பு',    hi: 'अंक' },
  result:  { en: 'Result',  ta: 'முடிவு',     hi: 'परिणाम' },
  meaning: { en: 'Significance', ta: 'பொருள்', hi: 'महत्व' },
  total:   { en: 'Total',   ta: 'மொத்தம்',    hi: 'कुल' },
  excellent:    { en: 'Excellent match', ta: 'சிறந்த பொருத்தம்', hi: 'उत्कृष्ट मिलान' },
  good:         { en: 'Good',            ta: 'நல்லது',           hi: 'अच्छा' },
  needsReview:  { en: 'Needs review',    ta: 'ஆய்வு தேவை',      hi: 'समीक्षा आवश्यक' },
  pass:         { en: 'Pass', ta: 'உண்டு', hi: 'हाँ' },
  fail:         { en: 'Fail', ta: 'இல்லை', hi: 'नहीं' },
  yes:          { en: 'Recommended', ta: 'பரிந்துரைக்கப்படுகிறது', hi: 'अनुशंसित' },
  porutham:     { en: 'Porutham', ta: 'பொருத்தம்', hi: 'पोरुथम' },
  rajjuNote:    { en: 'Rajju & Vedha are critical — failure requires Muhurtha correction.', ta: 'ரஜ்ஜு மற்றும் வேதா முக்கியமானவை — தோல்வி முகூர்த்தம் மூலம் சரிசெய்யலாம்.', hi: 'राजू और वेधा महत्वपूर्ण हैं — असफलता पर मुहूर्त सुधार आवश्यक।' },
  footer:       { en: "World's Most Accurate Vedic Astrology Predictions", ta: 'உலகின் மிகவும் துல்லியமான ஜோதிட கணிப்புகள்', hi: 'विश्व की सबसे सटीक वैदिक ज्योतिष भविष्यवाणियाँ' },
  kootaNames: {
    'Varna':        { en: 'Varna',        ta: 'வர்ணம்',      hi: 'वर्ण' },
    'Vashya':       { en: 'Vashya',       ta: 'வஸ்யம்',     hi: 'वश्य' },
    'Tara':         { en: 'Tara',         ta: 'தாரா',       hi: 'तारा' },
    'Yoni':         { en: 'Yoni',         ta: 'யோனி',       hi: 'योनि' },
    'Graha Maitri': { en: 'Graha Maitri', ta: 'கிரக மைத்திரி', hi: 'ग्रह मैत्री' },
    'Gana':         { en: 'Gana',         ta: 'கணம்',       hi: 'गण' },
    'Bhakoota':     { en: 'Bhakoota',     ta: 'பகூட்டம்',   hi: 'भकूट' },
    'Nadi':         { en: 'Nadi',         ta: 'நாடி',       hi: 'नाड़ी' },
  },
  poruthamNames: {
    'Dina':           { en: 'Dina',           ta: 'திணம்',        hi: 'दिना' },
    'Gana':           { en: 'Gana',           ta: 'கணம்',         hi: 'गण' },
    'Mahendra':       { en: 'Mahendra',       ta: 'மஹேந்திரம்',   hi: 'महेंद्र' },
    'Sthree Dheerga': { en: 'Sthree Dheerga', ta: 'ஸ்த்ரீ தீர்க்கம்', hi: 'स्त्री दीर्घ' },
    'Yoni':           { en: 'Yoni',           ta: 'யோனி',         hi: 'योनि' },
    'Rasi':           { en: 'Rasi',           ta: 'ராசி',         hi: 'राशि' },
    'Rasyadhipa':     { en: 'Rasyadhipa',     ta: 'ராசியாதிபதி',  hi: 'राश्याधिप' },
    'Vasiya':         { en: 'Vasiya',         ta: 'வசியம்',       hi: 'वश्य' },
    'Rajju':          { en: 'Rajju',          ta: 'ரஜ்ஜு',        hi: 'राजू' },
    'Vedha':          { en: 'Vedha',          ta: 'வேதம்',        hi: 'वेधा' },
  },
}

const KOOTA_MEANING_LANG: Record<string, Record<string,string>> = {
  'Varna':        { en: 'Spiritual & work compatibility', ta: 'ஆன்மீக & தொழில் பொருத்தம்', hi: 'आध्यात्मिक और कार्य अनुकूलता' },
  'Vashya':       { en: 'Mutual attraction & control',   ta: 'பரஸ்பர ஈர்ப்பு',            hi: 'परस्पर आकर्षण' },
  'Tara':         { en: 'Birth star harmony & health',   ta: 'நட்சத்திர நல்லிணக்கம்',      hi: 'जन्म नक्षत्र सामंजस्य' },
  'Yoni':         { en: 'Physical & intimate compatibility', ta: 'உடல் பொருத்தம்',          hi: 'शारीरिक अनुकूलता' },
  'Graha Maitri': { en: 'Mental & emotional bonding',   ta: 'மன & உணர்வு பிணைப்பு',        hi: 'मानसिक और भावनात्मक बंधन' },
  'Gana':         { en: 'Temperament & nature match',   ta: 'குணம் & இயல்பு பொருத்தம்',    hi: 'स्वभाव और प्रकृति मिलान' },
  'Bhakoota':     { en: 'Financial & family harmony',   ta: 'பொருளாதார & குடும்ப நல்லிணக்கம்', hi: 'वित्तीय और पारिवारिक सामंजस्य' },
  'Nadi':         { en: 'Genetic & health compatibility', ta: 'மரபணு & உடல் நலன் பொருத்தம்', hi: 'आनुवंशिक और स्वास्थ्य अनुकूलता' },
}

const PORUTHAM_MEANING_LANG: Record<string, Record<string,string>> = {
  'Dina':           { en: 'Day-star harmony — health & longevity', ta: 'நாள் நட்சத்திர பொருத்தம் — நீண்ட ஆயுள்', hi: 'दिन-तारा सामंजस्य — स्वास्थ्य और दीर्घायु' },
  'Gana':           { en: 'Nature & temperament match',             ta: 'குணம் பொருத்தம்',                      hi: 'स्वभाव मिलान' },
  'Mahendra':       { en: 'Prosperity & progeny — wealth & children', ta: 'செல்வம் & குழந்தை வரம்',            hi: 'समृद्धि और संतान' },
  'Sthree Dheerga': { en: 'Long & prosperous marriage — longevity',  ta: 'நீண்ட சுபீட்சமான திருமணம்',         hi: 'दीर्घ और समृद्ध विवाह' },
  'Yoni':           { en: 'Physical & intimate compatibility',        ta: 'உடல் பொருத்தம்',                    hi: 'शारीरिक अनुकूलता' },
  'Rasi':           { en: 'Moon sign — family harmony',              ta: 'ராசி — குடும்ப நல்லிணக்கம்',         hi: 'राशि — पारिवारिक सामंजस्य' },
  'Rasyadhipa':     { en: 'Moon lord friendship — mental harmony',   ta: 'ராசியாதிபதி நட்பு — மன பொருத்தம்',  hi: 'राश्याधिप मित्रता — मानसिक सामंजस्य' },
  'Vasiya':         { en: 'Mutual attraction & attachment',          ta: 'பரஸ்பர ஈர்ப்பு & ஆர்வம்',            hi: 'परस्पर आकर्षण और लगाव' },
  'Rajju':          { en: 'Husband longevity — most critical dosha', ta: 'கணவன் ஆயுள் — மிக முக்கியமான தோஷம்', hi: 'पति दीर्घायु — सबसे महत्वपूर्ण दोष' },
  'Vedha':          { en: 'Absence of obstruction — removes afflictions', ta: 'தடையின்மை — துன்பங்களை நீக்குகிறது', hi: 'बाधा का अभाव — दोषों को दूर करता है' },
}


// ── VedicHora Layered Matching Section ─────────────────────────────────────
// Uses /api/matchmaking/deep — dual narrative, time window, year summary
function DashaMatchSection({ result, lang }: { result: any; lang: string }) {
  const [deep, setDeep]       = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)
  const [loaded, setLoaded]   = React.useState(false)
  const [relType, setRelType] = React.useState('Other')
  const [askYear, setAskYear] = React.useState('')
  const [mode, setMode]       = React.useState<'future'|'past'|'year'|'full'>('future')

  const CHART_URL = process.env.NEXT_PUBLIC_CHART_URL || 'https://enchanting-dedication-production.up.railway.app'

  const relTypes = [
    { v:'Marriage',   l: lang==='ta'?'திருமணம்':'Marriage' },
    { v:'Business',   l: lang==='ta'?'தொழில்':'Business' },
    { v:'Sibling',    l: lang==='ta'?'உடன்பிறப்பு':'Sibling' },
    { v:'Friendship', l: lang==='ta'?'நட்பு':'Friendship' },
    { v:'Other',      l: lang==='ta'?'பிற':'Other' },
  ]

  const hid1 = result?.hid1 || result?.horoscopeId1
  const hid2 = result?.hid2 || result?.horoscopeId2

  const loadDeep = async () => {
    if (!hid1 || !hid2) return
    setLoading(true)
    try {
      const { chartApi } = await import('@/api/client')
      const now = new Date().getFullYear()
      const body: any = {
        GroomId: hid1, BrideId: hid2,
        RelationshipType: relType,
        GroomName: result?.name1 || 'Person 1',
        BrideName: result?.name2 || 'Person 2',
      }
      if (mode === 'past')   { body.FromYear = now - 10; body.ToYear = now }
      if (mode === 'future') { body.FromYear = now; body.ToYear = now + 10 }
      if (mode === 'year' && askYear) { body.FromYear = parseInt(askYear); body.ToYear = parseInt(askYear) }
      if (mode === 'full')   { body.FullRange = true }

      const res = await chartApi.post('/api/matchmaking/deep', body).catch(() => null)
      const d = res?.data?.data ?? res?.data
      setDeep(d)
    } catch {}
    setLoading(false); setLoaded(true)
  }

  const ashta   = result?.AshtaKootaScore  ?? result?.ashtaKootaScore  ?? 0
  const pathu   = result?.PathuPoruthamScore ?? result?.pathuPoruthamScore ?? 0
  const isRec   = result?.IsRecommended ?? result?.isRecommended ?? false
  const hasSaved = !!(hid1 && hid2)
  const now     = new Date().getFullYear()

  const verdictColor = (v: string) => {
    if (!v) return '#6B4C2A'
    const u = v.toUpperCase()
    if (u.includes('FAVOURABLE') || u.includes('POSITIVE')) return '#15803D'
    if (u.includes('CHALLENG') || u.includes('DIFFICULT') || u.includes('CRITICAL')) return '#DC2626'
    return '#B45309'
  }

  return (
    <div style={{marginTop:'20px',padding:'18px',background:'linear-gradient(135deg,#FAF6F0,#FFF8F0)',border:'1.5px solid #C8A96A',borderRadius:'10px'}}>

      {/* Title */}
      <div style={{fontFamily:'Georgia,serif',fontSize:'12px',fontWeight:700,color:'#3D0808',marginBottom:'14px',display:'flex',alignItems:'center',gap:'8px'}}>
        <div style={{flex:1,height:'1px',background:'linear-gradient(90deg,#C8A96A,transparent)'}}/>
        {lang==='ta'?'வேதிக்ஹோரா — ஆழமான இணக்கம்':'VedicHora — Deep Compatibility Analysis'}
        <div style={{flex:1,height:'1px',background:'linear-gradient(270deg,#C8A96A,transparent)'}}/>
      </div>

      {/* Quick score summary */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'8px',marginBottom:'14px'}}>
        {[
          {label: lang==='ta'?'அஷ்டகூட':'Ashta Koota', val:`${ashta}/36`, ok:ashta>=21},
          {label: lang==='ta'?'பத்து பொருத்தம்':'Pathu Porutham', val:`${pathu}/24`, ok:pathu>=12},
          {label: lang==='ta'?'மொத்த பொருத்தம்':'Overall', val:isRec?'✓ Match':'⚠ Review', ok:isRec},
        ].map(({label,val,ok})=>(
          <div key={label} style={{background:ok?'#F0FDF4':'#FEF9F0',border:`1px solid ${ok?'#16A34A':'#D97706'}`,borderRadius:'8px',padding:'10px',textAlign:'center'}}>
            <div style={{fontFamily:'Georgia,serif',fontSize:'18px',fontWeight:900,color:ok?'#15803D':'#B45309'}}>{val}</div>
            <div style={{fontSize:'8.5px',color:'#6B4C2A',textTransform:'uppercase',letterSpacing:'.05em',marginTop:'3px'}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Deep analysis — logged in + saved charts only */}
      {hasSaved && !loaded && (
        <div style={{marginBottom:'14px'}}>
          {/* Step 1: Relationship type */}
          <div style={{marginBottom:'10px'}}>
            <div style={{fontSize:'10px',fontWeight:700,color:'#3D0808',marginBottom:'6px'}}>
              {lang==='ta'?'உறவின் வகை:':'What is this relationship?'}
            </div>
            <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
              {relTypes.map(r=>(
                <button key={r.v} onClick={()=>setRelType(r.v)}
                  style={{padding:'5px 12px',fontSize:'10px',borderRadius:'6px',cursor:'pointer',border:'none',
                    background:relType===r.v?'#3D0808':'#E8D8C0',color:relType===r.v?'#C8A96A':'#3D0808',fontWeight:relType===r.v?700:400}}>
                  {r.l}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: General compatibility OR specific time */}
          <div style={{marginBottom:'10px',padding:'10px',background:'rgba(200,169,106,.08)',borderRadius:'8px',border:'1px solid #E8D8C0'}}>
            <div style={{fontSize:'10px',fontWeight:700,color:'#3D0808',marginBottom:'8px'}}>
              {lang==='ta'?'என்ன பார்க்க விரும்புகிறீர்கள்?':'What would you like to know?'}
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
              <button onClick={()=>{setMode('future');loadDeep()}} disabled={loading}
                style={{padding:'9px 12px',background:'#3D0808',color:'#C8A96A',border:'none',borderRadius:'7px',cursor:'pointer',fontSize:'10.5px',fontWeight:700,textAlign:'left'}}>
                🌟 {lang==='ta'?`பொது பொருத்தம் — அடுத்த 10 ஆண்டுகள் (${now}–${now+10})`:`General compatibility & next 10 years (${now}–${now+10})`}
              </button>
              <button onClick={()=>{setMode('past');loadDeep()}} disabled={loading}
                style={{padding:'9px 12px',background:'#6B4C2A',color:'#FFF8F0',border:'none',borderRadius:'7px',cursor:'pointer',fontSize:'10.5px',fontWeight:700,textAlign:'left'}}>
                📜 {lang==='ta'?`கடந்த காலம் — கடந்த 10 ஆண்டுகள் (${now-10}–${now})`:`What happened — past 10 years (${now-10}–${now})`}
              </button>
              <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                <input type="number" placeholder={`Year e.g. ${now-2}`}
                  value={askYear} onChange={e=>setAskYear(e.target.value)}
                  style={{flex:1,padding:'7px 10px',border:'1px solid #C8A96A',borderRadius:'7px',fontSize:'11px',background:'#FFF8F0'}}/>
                <button onClick={()=>{setMode('year');loadDeep()}} disabled={loading||!askYear}
                  style={{padding:'7px 14px',background:askYear?'#C8A96A':'#E8D8C0',color:askYear?'#3D0808':'#9CA3AF',border:'none',borderRadius:'7px',cursor:askYear?'pointer':'default',fontSize:'10px',fontWeight:700,whiteSpace:'nowrap'}}>
                  {lang==='ta'?'அந்த ஆண்டு →':'That year →'}
                </button>
              </div>
              <button onClick={()=>{setMode('full');loadDeep()}} disabled={loading}
                style={{padding:'9px 12px',background:'linear-gradient(135deg,#3D0808,#6B4C2A)',color:'#C8A96A',border:'none',borderRadius:'7px',cursor:'pointer',fontSize:'10.5px',fontWeight:700,textAlign:'left'}}>
                ★ {lang==='ta'?'முழு வாழ்க்கை — 70 ஆண்டு அறிக்கை (பிரீமியம்)':'Full lifetime — 70-year report (Premium)'}
              </button>
            </div>
          </div>

          {loading && <div style={{textAlign:'center',fontSize:'11px',color:'#6B4C2A',padding:'8px'}}>
            {lang==='ta'?'ஆராய்கிறோம்…':'Analysing compatibility…'}
          </div>}
        </div>
      )}

      {/* Re-run with different time window after loading */}
      {hasSaved && loaded && (
        <div style={{marginBottom:'10px',display:'flex',gap:'6px',flexWrap:'wrap'}}>
          {([
            {v:'future',l:`${now}–${now+10}`},
            {v:'past',l:`${now-10}–${now}`},
            {v:'full',l:'70yr ★'},
          ] as {v:string,l:string}[]).map(m=>(
            <button key={m.v} onClick={()=>{setMode(m.v as any);setLoaded(false);setTimeout(()=>loadDeep(),50)}}
              style={{padding:'4px 10px',fontSize:'9px',borderRadius:'5px',cursor:'pointer',border:'none',
                background:mode===m.v?'#3D0808':'#E8D8C0',color:mode===m.v?'#C8A96A':'#3D0808',fontWeight:mode===m.v?700:400}}>
              {m.l}
            </button>
          ))}
          <input type="number" placeholder={`Year`}
            value={askYear} onChange={e=>setAskYear(e.target.value)}
            style={{width:'70px',padding:'4px 6px',border:'1px solid #C8A96A',borderRadius:'5px',fontSize:'9px',background:'#FFF8F0'}}/>
          {askYear && <button onClick={()=>{setMode('year');setLoaded(false);setTimeout(()=>loadDeep(),50)}}
            style={{padding:'4px 10px',fontSize:'9px',borderRadius:'5px',cursor:'pointer',border:'none',background:'#C8A96A',color:'#3D0808',fontWeight:700}}>
            Go
          </button>}
        </div>
      )}

      {/* Results */}
      {deep && (
        <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>

          {/* Year timeline bar */}
          {deep.yearSummary?.length > 0 && (
            <div>
              <div style={{fontSize:'10px',fontWeight:700,color:'#3D0808',marginBottom:'8px',fontFamily:'Georgia,serif'}}>
                {deep.fromYear}–{deep.toYear} — {lang==='ta'?'ஆண்டுவாரி இணக்கம்':'Year-by-Year Compatibility'}
              </div>
              <div style={{display:'flex',gap:'2px',flexWrap:'wrap'}}>
                {deep.yearSummary.map((y: any)=>(
                  <div key={y.year} title={y.note}
                    style={{
                      width:'28px',height:'28px',borderRadius:'4px',display:'flex',flexDirection:'column',
                      alignItems:'center',justifyContent:'center',cursor:'default',fontSize:'8px',fontWeight:600,
                      background: y.verdict==='Favourable'?'#BBF7D0'
                                : y.verdict==='Difficult'?'#FECACA'
                                : y.verdict==='Challenging'?'#FED7AA'
                                : '#E5E7EB',
                      color: y.verdict==='Favourable'?'#15803D'
                           : y.verdict==='Difficult'?'#DC2626'
                           : y.verdict==='Challenging'?'#B45309'
                           : '#6B7280',
                      border: y.isPast?'1px dashed #9CA3AF':'1px solid transparent',
                      opacity: y.isPast ? 0.7 : 1,
                    }}>
                    <span>{y.year.toString().slice(2)}</span>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',gap:'12px',marginTop:'6px',fontSize:'8.5px',color:'#6B4C2A'}}>
                {[['#BBF7D0','#15803D','Favourable'],['#FED7AA','#B45309','Mixed'],['#FECACA','#DC2626','Difficult']].map(([bg,c,l])=>(
                  <div key={l} style={{display:'flex',alignItems:'center',gap:'3px'}}>
                    <div style={{width:'10px',height:'10px',borderRadius:'2px',background:bg}}/>
                    <span style={{color:c}}>{l}</span>
                  </div>
                ))}
                <span style={{color:'#9CA3AF'}}>Dashed = past</span>
              </div>
            </div>
          )}

          {/* Marriage continuation (if marriage) */}
          {(deep.p1MarriageContinuation || deep.p2MarriageContinuation) && (
            <div style={{background:'#FFF8F0',border:'1px solid #E8D8C0',borderRadius:'8px',padding:'12px'}}>
              <div style={{fontSize:'10px',fontWeight:700,color:'#3D0808',marginBottom:'8px',fontFamily:'Georgia,serif'}}>
                {lang==='ta'?'திருமண ஆயுள் பலம்':'Marriage Durability'}
              </div>
              {[deep.p1MarriageContinuation, deep.p2MarriageContinuation].filter(Boolean).map((cont:any, i:number)=>(
                <div key={i} style={{marginBottom:'6px',padding:'8px',background:cont.continuationScore>=0?'#F0FDF4':'#FEF2F2',borderRadius:'6px',border:`1px solid ${cont.continuationScore>=0?'#16A34A':'#FCA5A5'}`}}>
                  <div style={{fontSize:'10px',fontWeight:600,color:cont.continuationScore>=0?'#15803D':'#DC2626'}}>
                    {i===0?deep.groomName:deep.brideName}: {cont.outlook}
                  </div>
                  <div style={{fontSize:'9px',color:'#6B4C2A',marginTop:'2px'}}>
                    {cont.seventhAfflicted && `⚠ Partnership area under pressure from ${cont.afflictingPlanets?.join(', ')}. `}
                    {lang==='ta'?'குடும்ப பலம்':'Family bond'}: {cont.lord2Quality>=0?'Stable':'Weak'} · {lang==='ta'?'துணை இணைப்பு':'Partnership link'}: {cont.lord7Quality>=0?'Strong':'Vulnerable'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Challenging periods */}
          {deep.challengingYears?.length > 0 && (
            <div style={{background:'#FEF2F2',border:'1px solid #FCA5A5',borderRadius:'8px',padding:'12px'}}>
              <div style={{fontSize:'10px',fontWeight:700,color:'#DC2626',marginBottom:'8px'}}>
                ⚠ {lang==='ta'?'சவாலான காலங்கள்':'Challenging Periods'}
              </div>
              {deep.challengingYears.slice(0,4).map((y:any,i:number)=>(
                <div key={i} style={{marginBottom:'6px',borderBottom:'1px solid #FECACA',paddingBottom:'6px'}}>
                  <div style={{fontSize:'10px',fontWeight:600,color:'#DC2626'}}>
                    {new Date(y.startDate).getFullYear()}–{new Date(y.endDate).getFullYear()} · {y.label}
                  </div>
                  <div style={{fontSize:'9px',color:'#6B4C2A',lineHeight:1.4,marginTop:'2px'}}>{y.note?.slice(0,150)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Best periods */}
          {deep.bestYears?.length > 0 && (
            <div style={{background:'#F0FDF4',border:'1px solid #16A34A',borderRadius:'8px',padding:'12px'}}>
              <div style={{fontSize:'10px',fontWeight:700,color:'#15803D',marginBottom:'8px'}}>
                🌟 {lang==='ta'?'சிறந்த காலங்கள்':'Best Periods'}
              </div>
              {deep.bestYears.slice(0,4).map((y:any,i:number)=>(
                <div key={i} style={{marginBottom:'4px',fontSize:'10px',color:'#15803D',fontWeight:600}}>
                  {new Date(y.startDate).getFullYear()}–{new Date(y.endDate).getFullYear()}: {y.note?.slice(0,100)}
                </div>
              ))}
            </div>
          )}

          {/* Dual-narrative cross-predictions */}
          {deep.crossPredictions?.filter((p:any)=>p.intensity==='SEVERE'||p.intensity==='POSITIVE').slice(0,8).map((p:any,i:number)=>(
            <div key={i} style={{
              border:`1px solid ${p.intensity==='POSITIVE'?'#16A34A':p.intensity==='SEVERE'?'#DC2626':'#E8D8C0'}`,
              borderRadius:'8px',padding:'12px',
              background:p.intensity==='POSITIVE'?'#F0FDF4':p.intensity==='SEVERE'?'#FEF2F2':'#FFF8F0'
            }}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                <div style={{fontSize:'10px',fontWeight:700,color:p.intensity==='POSITIVE'?'#15803D':'#DC2626'}}>
                  {p.intensity==='POSITIVE'?'🌟':'⚠'} {p.yearRange} · {p.intensity}
                  {p.isCurrent && <span style={{marginLeft:'6px',fontSize:'9px',background:'#3D0808',color:'#C8A96A',padding:'1px 5px',borderRadius:'3px'}}>NOW</span>}
                  {p.isPast && <span style={{marginLeft:'6px',fontSize:'9px',color:'#9CA3AF'}}>(past)</span>}
                </div>
                <div style={{fontSize:'9px',color:'#6B4C2A'}}>{p.who}</div>
              </div>
              {p.fromTheirSide && (
                <div style={{fontSize:'9.5px',color:'#374151',lineHeight:1.5,marginBottom:'4px'}}>
                  <strong style={{color:'#3D0808'}}>{p.who}:</strong> {p.fromTheirSide}
                </div>
              )}
              {p.fromPartnerSide && (
                <div style={{fontSize:'9.5px',color:'#6B4C2A',lineHeight:1.5,fontStyle:'italic'}}>
                  {p.fromPartnerSide}
                </div>
              )}
            </div>
          ))}

          {/* Full range upsell */}
          {!deep.isFullRange && (
            <div style={{fontSize:'10px',color:'#6B4C2A',padding:'10px',background:'rgba(200,169,106,.1)',borderRadius:'6px',borderLeft:'3px solid #C8A96A',textAlign:'center'}}>
              {lang==='ta'
                ? 'முழு 70 ஆண்டு ஆழமான இணக்க அறிக்கை — பிரீமியம் திட்டம்'
                : 'Full 70-year deep compatibility report available with Premium plan'}
              <a href="/pricing" style={{color:'var(--acc)',fontWeight:700,marginLeft:'6px'}}>Upgrade →</a>
            </div>
          )}

          {/* Guest sign-in prompt */}
        </div>
      )}

      {/* Guest: sign in prompt */}
      {!hasSaved && (
        <div style={{fontSize:'10px',color:'#6B4C2A',padding:'10px',background:'rgba(200,169,106,.1)',borderRadius:'6px',borderLeft:'3px solid #C8A96A'}}>
          <strong style={{color:'#3D0808'}}>
            {lang==='ta'?'ஆழமான பகுப்பாய்வு:':'Deep Compatibility Analysis:'}
          </strong>{' '}
          {lang==='ta'
            ? 'உள்நுழைந்து வரைபடங்களை சேமிக்கவும் — ஆண்டுவாரி இணக்கம், சிறந்த திருமண காலம், இரண்டு பக்க கதை காண்க.'
            : 'Sign in and save charts to unlock year-by-year timeline, best periods, challenging windows, and dual perspective analysis.'}
          <a href="/signin" style={{color:'var(--acc)',fontWeight:700,marginLeft:'4px'}}>Sign in →</a>
        </div>
      )}
    </div>
  )
}


export default function MatchPage() {
  const { token } = useStore()
  const [saved, setSaved] = useState<any[]>([])

  const [n1, setN1] = useState('')
  const [d1, setD1] = useState<DateValue>(EMPTY)
  const [p1, setP1] = useState('')
  const [lat1, setLat1] = useState<number|undefined>()
  const [lng1, setLng1] = useState<number|undefined>()
  const [g1, setG1] = useState<'Male'|'Female'>('Male')
  const [useSaved1, setUseSaved1] = useState(false)
  const [selId1,    setSelId1]    = useState('')

  const [n2, setN2] = useState('')
  const [d2, setD2] = useState<DateValue>(EMPTY)
  const [p2, setP2] = useState('')
  const [lat2, setLat2] = useState<number|undefined>()
  const [lng2, setLng2] = useState<number|undefined>()
  const [g2, setG2] = useState<'Male'|'Female'>('Female')
  const [useSaved2, setUseSaved2] = useState(false)
  const [selId2,    setSelId2]    = useState('')

  const [result,  setResult]  = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState('')
  const [err1,    setErr1]    = useState('')  // person-1 field error
  const [err2,    setErr2]    = useState('')  // person-2 field error


  const KOOTA_MEANING: Record<string, string> = {
    'Varna':        'Spiritual & work compatibility',
    'Vashya':       'Mutual attraction & control',
    'Tara':         'Birth star harmony & health',
    'Yoni':         'Physical & intimate compatibility',
    'Graha Maitri': 'Mental & emotional bonding',
    'Gana':         'Temperament & nature match',
    'Bhakoota':     'Financial & family harmony',
    'Nadi':         'Genetic & health compatibility',
  }

  const PORUTHAM_MEANING: Record<string, string> = {
    'Dina':      'Day star compatibility — health & longevity',
    'Gana':      'Temperament match — nature & character',
    'Mahendra':  'Prosperity & children — wealth & progeny',
    'Sthree Dheerga': 'Long & prosperous marriage — wife longevity',
    'Yoni':      'Physical compatibility — intimacy & attraction',
    'Rasi':      'Moon sign compatibility — family & harmony',
    'Rasyadhipa': 'Moon lord friendship — mental compatibility',
    'Vasiya':    'Attraction & attachment — mutual affection',
    'Rajju':     'Longevity of husband — most critical dosha',
    'Vedha':     'Absence of obstruction — removes afflictions',
  }
  const [pdfLoading, setPdfLoading] = useState<string|null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [lang, setLang] = useState<'en'|'ta'|'hi'>('en')
  const resultsRef = useRef<HTMLDivElement>(null)

  const downloadPdf = async (reportLang: 'en'|'ta'|'hi' = lang) => {
    if (!result) return
    setPdfLoading('gen')
    try {
      // Fetch HTML template
      const tmplRes = await fetch(`/porutham-report.html?v=${Date.now()}`)
      let tmpl = await tmplRes.text()

      // Build data object with all normalised field names
      const r = result as any
      const data = {
        lang: reportLang,
        // Names from form inputs (n1/n2) since API doesn't echo them back
        // Name: use form input if filled, else API echo, else PersonName from payload, else gender
        name1: (typeof n1 !== 'undefined' && n1 && n1 !== (typeof g1 !== 'undefined' ? g1 : ''))
          ? n1 : (r.name1 || gp1?.PersonName || n1 || (typeof g1 !== 'undefined' ? g1 : '') || 'Person 1'),
        name2: (typeof n2 !== 'undefined' && n2 && n2 !== (typeof g2 !== 'undefined' ? g2 : ''))
          ? n2 : (r.name2 || gp2?.PersonName || n2 || (typeof g2 !== 'undefined' ? g2 : '') || 'Person 2'),
        // DOB from form date pickers
        // When saved charts used, pull DOB/time/place from the saved chart data
        dob1: d1?.yyyy ? `${String(d1.dd).padStart(2,'0')}/${String(d1.mm).padStart(2,'0')}/${d1.yyyy}` : (saved.find((c:any)=>(c.horoscopeId||c.HoroscopeId)===r.hid1)?.dateOfBirth || r.dob1 || ''),
        dob2: d2?.yyyy ? `${String(d2.dd).padStart(2,'0')}/${String(d2.mm).padStart(2,'0')}/${d2.yyyy}` : (saved.find((c:any)=>(c.horoscopeId||c.HoroscopeId)===r.hid2)?.dateOfBirth || r.dob2 || ''),
        tob1: (() => {
          if (d1?.unknownTime) return 'Unknown'
          if (d1?.hr && d1?.yyyy) return `${d1.hr}:${String(d1.mi||0).padStart(2,'0')} ${d1.ap||'AM'}`
          const sc1 = saved.find((c:any)=>(c.horoscopeId||c.HoroscopeId)===r.hid1)
          return sc1?.timeOfBirth || sc1?.birthTime || ''
        })(),
        tob2: (() => {
          if (d2?.unknownTime) return 'Unknown'
          if (d2?.hr && d2?.yyyy) return `${d2.hr}:${String(d2.mi||0).padStart(2,'0')} ${d2.ap||'AM'}`
          const sc2 = saved.find((c:any)=>(c.horoscopeId||c.HoroscopeId)===r.hid2)
          return sc2?.timeOfBirth || sc2?.birthTime || ''
        })(),
        pob1: (typeof place1 !== 'undefined' && place1) ? place1 : (saved.find((c:any)=>(c.horoscopeId||c.HoroscopeId)===r.hid1)?.placeOfBirth || saved.find((c:any)=>(c.horoscopeId||c.HoroscopeId)===r.hid1)?.cityName || ''),
        pob2: (typeof place2 !== 'undefined' && place2) ? place2 : (saved.find((c:any)=>(c.horoscopeId||c.HoroscopeId)===r.hid2)?.placeOfBirth || saved.find((c:any)=>(c.horoscopeId||c.HoroscopeId)===r.hid2)?.cityName || ''),
        // Ashta Koota
        AshtaKootaScore:  r.AshtaKootaScore  ?? r.ashtaKootaScore  ?? 0,
        AshtaKootaTotal:  r.AshtaKootaTotal  ?? r.ashtaKootaTotal  ?? 36,
        AshtaKootaPct:    r.AshtaKootaPct    ?? r.ashtaKootaPct    ?? 0,
        KootaDetails:     (r.KootaDetails ?? r.kootaDetails ?? []).map((k: any) => ({
          KootaName: k.KootaName || k.kootaName || '',
          Score:     k.Score     ?? k.score     ?? 0,
          MaxScore:  k.MaxScore  ?? k.maxScore  ?? 0,
          Description: k.Description || k.description || '',
        })),
        // Pathu Porutham
        PathuPoruthamScore: r.PathuPoruthamScore ?? r.pathuPoruthamScore ?? 0,
        PathuPoruthamTotal: r.PathuPoruthamTotal ?? r.pathuPoruthamTotal ?? 10,
        Poruthams:          (r.Poruthams ?? r.poruthams ?? []).map((p: any) => ({
          KootaName:   p.KootaName   || p.kootaName   || '',
          Score:       p.Score       ?? p.score       ?? 0,
          MaxScore:    p.MaxScore    ?? p.maxScore     ?? 0,
          Pass:        p.Pass        ?? p.pass         ?? false,
          Verdict:     p.Verdict     || p.verdict      || '',
          Description: p.Description || p.description  || '',
        })),
        // Flags
        IsRecommended:    r.IsRecommended    ?? r.isRecommended    ?? false,
        RajjuPass:        r.RajjuPass        ?? r.rajjuPass        ?? true,
        RajjuWarning:     r.RajjuWarning     ?? r.rajjuWarning     ?? '',
        VedhaPresent:     r.VedhaPresent     ?? r.vedhaPresent     ?? false,
        VedhaWarning:     r.VedhaWarning     ?? r.vedhaWarning     ?? '',
        MahendramPresent: r.MahendramPresent ?? r.mahendramPresent ?? false,
        MangalDosha:      r.MangalDosha      ?? r.mangalDosha      ?? false,
        MangalNote:       r.MangalNote       ?? r.mangalNote       ?? '',
        Summary:          r.Summary          ?? r.summary          ?? '',
        // Birth details
        GroomNakshatra: r.GroomNakshatra ?? r.groomNakshatra ?? '',
        BrideNakshatra: r.BrideNakshatra ?? r.brideNakshatra ?? '',
        GroomRasi:      r.GroomRasi      ?? r.groomRasi      ?? '',
        BrideRasi:      r.BrideRasi      ?? r.brideRasi      ?? '',
        GroomRajju:     r.GroomRajju     ?? r.groomRajju     ?? '',
        BrideRajju:     r.BrideRajju     ?? r.brideRajju     ?? '',
        groomLagna:     r.groomLagna     ?? '',
        brideLagna:     r.brideLagna     ?? '',
        groomNadi:      r.groomNadi  ?? r.GroomNadi  ?? '',
        brideNadi:      r.brideNadi  ?? r.BrideNadi  ?? '',
        groomLagna:     r.GroomLagna ?? r.groomLagna ?? '',
        brideLagna:     r.BrideLagna ?? r.brideLagna ?? '',
        groomNadi:      r.GroomNadi  ?? r.groomNadi  ?? '',
        brideNadi:      r.BrideNadi  ?? r.brideNadi  ?? '',
        groomGana:      r.GroomGana  ?? r.groomGana  ?? '',
        brideGana:      r.BrideGana  ?? r.brideGana  ?? '',
        groomPada:      r.GroomPada  ?? r.groomPada  ?? '',
        bridePada:      r.BridePada  ?? r.bridePada  ?? '',
        groomPada:      r.groomPada  ?? r.GroomPada  ?? '',
        bridePada:      r.bridePada  ?? r.BridePada  ?? '',
        // Deep overlay engine results — fetch live if not already loaded
        deepResult: await (async () => {
          // Already have it (e.g. from DashaMatchSection)
          if ((result as any)?.deepResult) return (result as any).deepResult
          // Fetch from deep engine if we have chart IDs
          const hid1 = (result as any)?.hid1
          const hid2 = (result as any)?.hid2
          if (hid1 && hid2 && token) {
            try {
              const CHART_URL = 'https://enchanting-dedication-production.up.railway.app'
              const dr = await fetch(`${CHART_URL}/api/matchmaking/deep`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ GroomId: hid1, BrideId: hid2, RelationshipType: 'Other',
                  GroomName: n1||'Person 1', BrideName: n2||'Person 2',
                  FromYear: 2025, ToYear: 2037 })
              }).then(r => r.json())
              return dr?.data?.data ?? dr?.data ?? null
            } catch { return null }
          }
          return null
        })(),
      }

      // Replace ALL {{placeholders}} directly in HTML string
      // This works even if scripts don't execute in the popup
      const r2 = result as any
      const safe = (v: any) => String(v ?? '')
      const pathuPct = data.PathuPoruthamTotal > 0
        ? Math.round((data.PathuPoruthamScore / data.PathuPoruthamTotal) * 100) : 0
      const ashtaPct = data.AshtaKootaTotal > 0
        ? Math.round((data.AshtaKootaScore / data.AshtaKootaTotal) * 100) : 0
      const doshaCount = (data.VedhaPresent ? 1 : 0) + (data.MangalDosha ? 1 : 0)

      // ── Language labels ──────────────────────────────────────────
      const L = reportLang
      const ta = (en: string, ta_: string, hi?: string) =>
        L === 'ta' ? ta_ : (L === 'hi' && hi ? hi : en)

      // ── Pathu Porutham labels (Tamil names from sample PDF) ──────
      const PATHU_LABELS: Record<string,{en:string;ta:string;meaning_en:string;meaning_ta:string}> = {
        'Dinam':         {en:'1. திணம் (Dinam)',        ta:'1. திணம் (திணம்)',       meaning_en:'Day star compatibility — health & longevity', meaning_ta:'உடல்நலம் & ஆயுள்'},
        'Ganam':         {en:'2. Ganam',                ta:'2. கணம்',                meaning_en:'Nature & temperament — mutual understanding',   meaning_ta:'குணம் & மனோபாவம்'},
        'Mahendram':     {en:'3. Mahendram',            ta:'3. மகேந்திரம்',          meaning_en:'Prosperity, strength & children',               meaning_ta:'செல்வம் & சந்ததி'},
        'Sthree Dheerga':{en:'4. Sthree Dheerga',      ta:'4. ஸ்திரீ தீர்க்கம்',   meaning_en:"Long life for the wife",                        meaning_ta:'மனைவியின் நலன்'},
        'Yoni':          {en:'5. Yoni',                 ta:'5. யோனி',               meaning_en:'Physical & intimate compatibility',              meaning_ta:'உடல் & நெருக்கம்'},
        'Rasi':          {en:'6. Rasi',                 ta:'6. ராசி',               meaning_en:'Moon sign — family harmony',                    meaning_ta:'குடும்ப நல்லிணக்கம்'},
        'Rasiyathipati': {en:'7. Rasiyathipati',        ta:'7. ராசியதிபதி',         meaning_en:'Lord of rasi — prosperity & harmony',           meaning_ta:'செல்வம் & நல்வாழ்வு'},
        'Rajju':         {en:'8. Rajju ★ critical',    ta:'8. ரஜ்ஜு ★ முக்கியம்', meaning_en:'Husband longevity — most critical dosha',       meaning_ta:'கணவனின் ஆயுள் — மிக முக்கியம்'},
        'Vedha':         {en:'9. Vedha',                ta:'9. வேதை',               meaning_en:'Affliction — must be absent',                   meaning_ta:'தோஷம் — இல்லாமல் இருக்க வேண்டும்'},
      }

      // ── Ashta Koota labels ────────────────────────────────────────
      const KOOTA_LABELS: Record<string,{en:string;ta:string;meaning_en:string;meaning_ta:string}> = {
        'Varna':        {en:'Varna',        ta:'வர்ணம்',       meaning_en:'Spiritual compatibility',              meaning_ta:'ஆன்மீக இணக்கம்'},
        'Vashya':       {en:'Vashya',       ta:'வசியம்',       meaning_en:'Mutual attraction & control',           meaning_ta:'பரஸ்பர ஈர்ப்பு'},
        'Tara':         {en:'Tara',         ta:'தாரா',         meaning_en:'Birth star compatibility — health',     meaning_ta:'நட்சத்திர இணக்கம்'},
        'Yoni':         {en:'Yoni',         ta:'யோனி',         meaning_en:'Physical compatibility',                meaning_ta:'உடல் இணக்கம்'},
        'Graha Maitri': {en:'Graha Maitri', ta:'கிரக மைத்திரி',meaning_en:'Mental harmony & friendship',          meaning_ta:'மன இணக்கம்'},
        'Gana':         {en:'Gana',         ta:'கணம்',         meaning_en:'Temperament & nature match',            meaning_ta:'குண இணக்கம்'},
        'Bhakoota':     {en:'Bhakoota',     ta:'பகூட்டம்',     meaning_en:'Wealth, progeny & family harmony',      meaning_ta:'செல்வம் & சந்ததி'},
        'Nadi':         {en:'Nadi',         ta:'நாடி',         meaning_en:'Health & progeny — critical (max 8)',   meaning_ta:'ஆரோக்கியம் & சந்ததி (முக்கியம்)'},
      }

            const pathuScore2 = data.PathuPoruthamScore  ?? 0
      const pathuTotal2 = data.PathuPoruthamTotal  ?? 24
      const ashtaScore2 = data.AshtaKootaScore     ?? 0
      const ashtaTotal2 = data.AshtaKootaTotal     ?? 36
      const pathuPct2   = pathuTotal2 > 0 ? Math.round((pathuScore2/pathuTotal2)*100) : 0
      const ashtaPct2   = ashtaTotal2 > 0 ? Math.round((ashtaScore2/ashtaTotal2)*100) : 0

      // Failed porutham count
      const failedCount = (data.Poruthams || []).filter((p: any) => !p.Pass && !p.pass).length

      // ── Pathu Porutham table rows ─────────────────────────────────
      const PATHU_ORDER = ['Dinam','Ganam','Mahendram','Sthree Dheerga','Yoni','Rasi','Rasiyathipati','Rajju']
      const pathuRows = (data.Poruthams || []).map((p: any, i: number) => {
        const key     = p.KootaName || p.kootaName || PATHU_ORDER[i] || `Porutham ${i+1}`
        const lbl     = PATHU_LABELS[key]
        const name    = lbl ? (L === 'ta' ? lbl.ta : lbl.en) : key
        const meaning = lbl ? (L === 'ta' ? lbl.meaning_ta : lbl.meaning_en) : (p.Description || p.description || '')
        const isPass  = p.Pass || p.pass || p.Verdict === 'Compatible'
        const isCrit  = key === 'Rajju' || key === 'Vedha'
        const score   = p.Score ?? p.score ?? ''
        const max     = p.MaxScore ?? p.maxScore ?? ''
        const scoreStr = (score !== '' && max !== '') ? `${score}/${max}` : (isPass ? '✓' : '✗')
        const passCell = isPass
          ? `<td class="td-pass">✓ ${ta('Pass','உண்டு')}</td>`
          : `<td class="td-fail">✗ ${ta('Fail','இல்லை')}</td>`
        const critBadge = isCrit ? `<span class="badge-critical">${ta('critical','முக்கியம்')}</span>` : ''
        const bg = i % 2 ? '#FAF5EC' : '#fff'
        return `<tr style="background:${bg}">
          <td style="color:#6B4C2A;font-size:11px">${i+1}</td>
          <td><div class="td-name">${name}${critBadge}</div><div class="td-sub">${meaning}</div></td>
          <td style="font-size:11px;color:#6B4C2A">${scoreStr}</td>
          ${passCell}
        </tr>`
      }).join('')

      // ── Ashta Koota table rows ────────────────────────────────────
      const ashtaRows = (data.KootaDetails || []).map((k: any, i: number) => {
        const key     = k.KootaName || k.kootaName || ''
        const lbl     = KOOTA_LABELS[key]
        const name    = lbl ? (L === 'ta' ? lbl.ta : lbl.en) : key
        const meaning = lbl ? (L === 'ta' ? lbl.meaning_ta : lbl.meaning_en) : ''
        const score   = k.Score   ?? k.score   ?? 0
        const max     = k.MaxScore ?? k.maxScore ?? 0
        const pct     = max > 0 ? Math.round((score/max)*100) : 0
        const ok      = score > 0 && score >= max * 0.5
        const oColor  = ok ? '#15803D' : '#DC2626'
        const barW    = max > 0 ? Math.round((score/max)*80) : 0
        const oText   = ok
          ? `<span style="color:#15803D;font-weight:700">✓ ${ta('Good','நல்லது')}</span>`
          : `<span style="color:#DC2626;font-weight:700">✗ ${ta('Low','குறைவு')}</span>`
        const bg = i % 2 ? '#FAF5EC' : '#fff'
        return `<tr style="background:${bg}">
          <td><div class="td-name">${name}</div><div class="td-sub">${meaning}</div></td>
          <td style="text-align:center;font-weight:700;color:#3D0808">${max}</td>
          <td style="text-align:center">
            <span style="font-size:18px;font-weight:700;color:${oColor}">${score}</span>
            <div class="score-bar-wrap"><div class="score-bar" style="background:${oColor};width:${barW}px"></div></div>
          </td>
          <td>${oText}</td>
          <td style="font-size:11px;color:#6B4C2A">${meaning}</td>
        </tr>`
      }).join('')

      // ── Dosha warnings ────────────────────────────────────────────
      const doshas: string[] = []
      if (data.MangalDosha && data.MangalNote && !data.MangalNote.includes('cancel'))
        doshas.push(`<div style="margin:6px 0;padding:10px 14px;background:#FFF5F5;border-left:3px solid #8B1A1A;border-radius:4px;color:#5C0A14;font-size:12px"><strong>${ta('Mangal Dosha','மாங்கலிக தோஷம்')}</strong> — ${safe(data.MangalNote)}</div>`)
      if (data.VedhaPresent)
        doshas.push(`<div style="margin:6px 0;padding:10px 14px;background:#FFF5F5;border-left:3px solid #8B1A1A;border-radius:4px;color:#5C0A14;font-size:12px"><strong>${ta('Vedha Dosha','வேதை தோஷம்')}</strong> — ${ta('Muhurtha correction required','முகூர்த்த திருத்தம் தேவை')}</div>`)
      const doshaHtml = doshas.join('')

      // ── Rajju warning ─────────────────────────────────────────────
      const rajjuWarn = data.RajjuWarning
        ? `<div style="margin:6px 0;padding:10px 14px;background:#FFFBEB;border-left:3px solid #B7862C;border-radius:4px;color:#7A4A00;font-size:12px"><strong>${ta('Important','முக்கியக் குறிப்பு')}</strong> — ${safe(data.RajjuWarning)}</div>`
        : (!data.RajjuPass
          ? `<div style="margin:6px 0;padding:10px 14px;background:#FFFBEB;border-left:3px solid #B7862C;border-radius:4px;color:#7A4A00;font-size:12px"><strong>${ta('Rajju Mismatch','ரஜ்ஜு பொருத்தமில்லை')}</strong> — ${safe(data.RajjuWarning) || ta('Same Rajju group — Muhurtha correction required','ஒரே ரஜ்ஜு குழு — முகூர்த்த திருத்தம் தேவை')}</div>`
          : '')

      // ── Verdict ───────────────────────────────────────────────────
      const isGood = ashtaScore2 >= 18 && pathuScore2 >= 12 && (data.RajjuPass !== false) && !data.VedhaPresent
      const isMod  = ashtaScore2 >= 14 && pathuScore2 >= 8
      const verdictColor = isGood ? '#15803D' : (isMod ? '#B4530A' : '#DC2626')
      const verdictText  = isGood
        ? `✓ ${ta('Marriage Recommended','திருமணம் பரிந்துரைக்கப்படுகிறது')}`
        : (isMod ? `⚠ ${ta('Moderate Match — Check Muhurtha','நடுத்தர பொருத்தம் — முகூர்த்தம் அவசியம்')}`
                 : `✗ ${ta('Not Recommended','பரிந்துரைக்கப்படவில்லை')}`)
      const verdictBody = isGood
        ? ta(`Ashta Koota: ${ashtaScore2}/36 (${ashtaPct2}%) · Pathu Porutham: ${pathuScore2}/24 · Doshas: Clear`,
             `அஷ்டகூட: ${ashtaScore2}/36 (${ashtaPct2}%) · பத்து பொருத்தம்: ${pathuScore2}/24 · தோஷங்கள்: இல்லை`)
        : ta(`Ashta Koota: ${ashtaScore2}/36 · Pathu Porutham: ${pathuScore2}/24 — Remedies recommended`,
             `அஷ்டகூட: ${ashtaScore2}/36 · பத்து பொருத்தம்: ${pathuScore2}/24 — பரிகாரங்கள் தேவை`)
      const ashtaVerdictNote = ashtaScore2 >= 21 ? ta('Excellent match','சிறந்த இணக்கம்')
        : ashtaScore2 >= 18 ? ta('Good match','நல்ல இணக்கம்')
        : ashtaScore2 >= 14 ? ta('Average match','சராசரி இணக்கம்')
        : ta('Below average','குறைவான இணக்கம்')

      // ── Strengths section ─────────────────────────────────────────
      const passedList = (data.Poruthams || []).filter((p: any) => p.Pass || p.pass)
      const strengthsHtml = passedList.slice(0,6).map((p: any) => {
        const key = p.KootaName || p.kootaName || ''
        const lbl = PATHU_LABELS[key]
        const name = lbl ? (L==='ta' ? lbl.ta : lbl.en) : key
        const meaning = lbl ? (L==='ta' ? lbl.meaning_ta : lbl.meaning_en) : ''
        const desc = p.Description || p.description || meaning
        return `<div class="strength-item">
          <div class="s-title">${name} — ${ta('Excellent match','முழுப் பொருத்தம்')}</div>
          <div class="s-body">${desc}</div>
        </div>`
      }).join('')

      // ── Remedies (from sample PDF — 3 standard remedies) ──────────
      const failedNames = (data.Poruthams || [])
        .filter((p: any) => !p.Pass && !p.pass)
        .map((p: any) => {
          const key = p.KootaName || p.kootaName || ''
          const lbl = PATHU_LABELS[key]
          return lbl ? (L==='ta' ? lbl.ta : lbl.en) : key
        }).join(', ')

      const remediesHtml = (() => {
        const isTa = L === 'ta'
        const r1title = isTa ? 'முகூர்த்த தேர்வு — மிக முக்கியமான பரிகாரம்' : 'Muhurtha Selection — Most Important Remedy'
        const r1body = isTa
          ? '<p>சரியான திருமண முகூர்த்தம் தேர்வு செய்வதே பிரதான பரிகாரம். சரியான திருமண முகூர்த்தம் மூலம் பெரும்பாலான தோஷங்களை நிவர்த்தி செய்யலாம்.</p><ul><li><strong>திருமண நட்சத்திரம்:</strong> ரோஹிணி, மிருகசீர்ஷம், உத்திர பல்குணி, ஹஸ்தம், சுவாதி, அனுராதா, உத்திராடம் அல்லது ரேவதி — சதயம் மற்றும் மகம் தவிர்க்கவும்</li><li><strong>தாரா பலம்:</strong> இருவரிடமிருந்தும் 2, 4, 6, 8வது நட்சத்திரத்தில் சந்திரன் இல்லாமல் இருக்க வேண்டும்</li><li><strong>லக்னம்:</strong> பெண் ராசிகள் (ரிஷபம், கன்னி, விருச்சிகம், கும்பம்) சிறந்தவை</li><li><strong>குரு நிலை:</strong> முகூர்த்த லக்னத்திலிருந்து குரு கேந்திரம் (1, 4, 7, 10) அல்லது திரிகோணம் (5, 9) இல் இருக்க வேண்டும்</li></ul>'
          : '<p>Selecting the right wedding date and time (Muhurtha) is the most powerful remedy — it neutralises most compatibility doshas.</p><ul><li><strong>Wedding Nakshatra:</strong> Rohini, Mrigasira, Uttara Phalguni, Hasta, Swati, Anuradha, Uttara Ashadha or Revati — avoid Shatabhisha and Magha</li><li><strong>Tara Bala:</strong> Moon should not be in 2nd, 4th, 6th or 8th Nakshatra from either partner</li><li><strong>Lagna:</strong> Female signs (Taurus, Virgo, Scorpio, Aquarius) preferred</li><li><strong>Jupiter:</strong> Should be in kendra (1,4,7,10) or trikona (5,9) from Muhurtha Lagna</li></ul>'
        const r2title = isTa ? 'நவக்கிரக சாந்தி ஹோமம்' : 'Navagraha Shanti Homam'
        const r2body = isTa
          ? '<p>திருமணத்திற்கு முன் நவக்கிரக சாந்தி ஹோமம் செய்வது மிகவும் நல்லது.</p><ul><li><strong>சிறப்பு ஆஹுதி:</strong> சூரியனுக்கும் சனிக்கும் தனியாக சிறப்பு ஆஹுதி கொடுக்கவும்</li><li><strong>உத்தம நேரம்:</strong> ஞாயிற்றுக்கிழமை அல்லது சனிக்கிழமை — புஷ்யமி அல்லது உத்திராடம் நட்சத்திரத்தில் செய்வது சிறந்தது</li><li><strong>இடம்:</strong> குல தெய்வ கோவில் அல்லது நவக்கிரக சன்னதி உள்ள சிவன் அல்லது விஷ்ணு கோவில்</li><li><strong>எப்போது:</strong> திருமணத்திற்கு குறைந்தது ஒரு மாதத்திற்கு முன்</li></ul>'
          : '<p>Performing Navagraha Shanti Homam before the wedding is strongly recommended.</p><ul><li><strong>Special Ahuti:</strong> Separate special Ahuti for Sun (Groom Rasi lord) and Saturn (Bride Rasi lord)</li><li><strong>Best time:</strong> Sunday morning (Surya Hora) or Saturday morning (Shani Hora) in Pushyami or Uttara Ashadha Nakshatra</li><li><strong>Location:</strong> Family temple or any Navagraha shrine</li><li><strong>When:</strong> At least one month before the wedding</li></ul>'
        const r3title = isTa ? 'நட்சத்திர தேவதா பூஜை' : 'Nakshatra Devata Pooja'
        const r3body = isTa
          ? '<ul><li><strong>மணமகள் — நட்சத்திர தேவதை வருணன்:</strong> வருண பகவான் கோவிலில் அபிஷேகம் செய்யவும். திணம் பொருத்தம் இல்லாத குறையை இந்த வழிபாடு சரிசெய்யும்.</li><li><strong>மணமகன் — நட்சத்திர தேவதை பித்ருக்கள் (மகம்):</strong> ராமேஸ்வரம் அல்லது குல கேஷேத்திரத்தில் பித்ரு தர்ப்பணம் செய்யவும். மகேந்திர பொருத்தம் இல்லாத குறை சரிசெய்யும்.</li></ul>'
          : '<ul><li><strong>Bride — Nakshatra Devata Varuna:</strong> Perform Varuna Abhisheka at Varuna temple. This addresses Dinam shortfall and protects longevity and health.</li><li><strong>Groom — Nakshatra Devata Pitru (Magha):</strong> Perform Pitru Tarpana at Rameshwaram or ancestral shrine. This addresses Mahendra shortfall and strengthens progeny and longevity.</li></ul>'
        const card = (num, title, body) =>
          '<div class="remedy-card"><div class="remedy-hd"><div class="remedy-num">' + num + '</div>' + title + '</div><div class="remedy-body">' + body + '</div></div>'
        return card(1, r1title, r1body) + card(2, r2title, r2body) + card(3, r3title, r3body)
      })()

      // ── Language-specific labels ──────────────────────────────────
      const labels: Record<string,string> = {
        REPORT_TITLE:        ta('Vivaha Porutham Report', 'திருமண பொருத்த அறிக்கை'),
        BRIDE_LABEL:         ta('மணமகள்', 'மணமகள்'),
        GROOM_LABEL:         ta('மணமகன்', 'மணமகன்'),
        DOB_LABEL:           ta('Date of Birth', 'பிறந்த தேதி'),
        NAK_LABEL:           ta('Nakshatra', 'நட்சத்திரம்'),
        RASI_LABEL:          ta('Rasi (Moon Sign)', 'ராசி'),
        LAGNA_LABEL:         ta('Lagna', 'லக்னம்'),
        GANA_LABEL:          ta('Gana', 'கணம்'),
        NADI_LABEL:          ta('Nadi', 'நாடி'),
        RAJJU_LABEL:         ta('Rajju Group', 'ரஜ்ஜு'),
        PATHU_LABEL:         ta('PATHU PORUTHAM', 'பத்து பொருத்தம்'),
        ASHTA_LABEL:         ta('ASHTA KOOTA', 'அஷ்டகூட குணங்கள்'),
        DOSHA_LABEL:         ta('BLOCKING DOSHAS', 'கடுமையான தோஷங்கள்'),
        FAILED_LABEL:        ta('FAILED PORUTHAMS', 'இல்லாத பொருத்தங்கள்'),
        FAILED_NOTE:         ta('(min 5 required)','(குறைந்தது 5 வேண்டும்)'),
        PATHU_TABLE_TITLE:   ta('Pathu Porutham — Detailed Table', 'பத்து பொருத்தம் — விரிவான அட்டவணை'),
        ASHTA_TABLE_TITLE:   ta('Ashta Koota — Detailed Breakdown', 'அஷ்டகூட — விரிவான பகுப்பாய்வு'),
        PORUTHAM_COL:        ta('Porutham', 'பொருத்தம்'),
        CALC_COL:            ta('Calculation & Explanation', 'கணக்கீடு & விளக்கம்'),
        RESULT_COL:          ta('Result', 'முடிவு'),
        KOOTA_COL:           ta('Koota', 'கூட்டம்'),
        MAX_COL:             ta('Max', 'அதிகபட்சம்'),
        SCORE_COL:           ta('Score', 'மதிப்பு'),
        STATUS_COL:          ta('Status', 'நிலை'),
        MEANING_COL:         ta('What it Measures', 'பொருள்'),
        TOTAL_LABEL:         ta('Total', 'மொத்தம்'),
        REMEDIES_TITLE:      ta('Remedies & Final Verdict', 'பரிகாரங்கள் மற்றும் இறுதி முடிவு'),
        STRENGTHS_TITLE:     ta('Strengths of this Match','பொருத்தத்தின் பலன்கள்'),
        REMEDIES_WHAT_TITLE: ta('Remedies — What to Do', 'பரிகாரங்கள் — என்ன செய்ய வேண்டும்'),
        ASTROLOGER_NOTE:     ta('VedicHora Report', 'ஜோதிட ஆசிரியர் | VedicHora'),
        CONTACT_LABEL:       ta('Generated by', 'தொடர்பு கொள்ள'),
        WORLD_ACCURATE:      ta("World's Most Accurate Vedic Astrology", 'உலகின் மிகச் சிறந்த வேத ஜோதிட கணிப்பு'),
        CLOSING_LINE:        ta('Vivaha Porutham Report', 'விவாஹ பொருத்த அறிக்கை'),
        PADA_LABEL:          ta('Pada', 'பாதம்'),
      }

      // ── Apply all replacements ────────────────────────────────────
      tmpl = tmpl
        // Core data
        .replaceAll('{{NAME1}}',        safe(data.name1))
        .replaceAll('{{NAME2}}',        safe(data.name2))
        .replaceAll('{{DOB1}}',         safe(data.dob1))
        .replaceAll('{{DOB2}}',         safe(data.dob2))
        .replaceAll('{{NAK1}}',         safe(data.GroomNakshatra))
        .replaceAll('{{NAK2}}',         safe(data.BrideNakshatra))
        .replaceAll('{{RASI1}}',        safe(data.GroomRasi))
        .replaceAll('{{RASI2}}',        safe(data.BrideRasi))
        .replaceAll('{{RAJJU1}}',       safe(data.GroomRajju))
        .replaceAll('{{RAJJU2}}',       safe(data.BrideRajju))
        .replaceAll('{{LAGNA1}}',       safe(data.groomLagna))
        .replaceAll('{{LAGNA2}}',       safe(data.brideLagna))
        .replaceAll('{{NADI1}}',        safe(data.groomNadi))
        .replaceAll('{{NADI2}}',        safe(data.brideNadi))
        .replaceAll('{{GANA1}}',        safe(data.groomGana))
        .replaceAll('{{GANA2}}',        safe(data.brideGana))
        .replaceAll('{{PADA1}}',        safe(data.groomPada))
        .replaceAll('{{PADA2}}',        safe(data.bridePada))
        .replaceAll('{{TOB1}}',         safe(data.tob1))
        .replaceAll('{{TOB2}}',         safe(data.tob2))
        .replaceAll('{{POB1}}',         safe(data.pob1))
        .replaceAll('{{POB2}}',         safe(data.pob2))
        // Scores
        .replaceAll('{{PATHU_SCORE}}',  safe(pathuScore2))
        .replaceAll('{{PATHU_TOTAL}}',  safe(pathuTotal2))
        .replaceAll('{{PATHU_PCT}}',    safe(pathuPct2))
        .replaceAll('{{ASHTA_SCORE}}',  safe(ashtaScore2))
        .replaceAll('{{ASHTA_TOTAL}}',  safe(ashtaTotal2))
        .replaceAll('{{ASHTA_PCT}}',    safe(ashtaPct2))
        .replaceAll('{{DOSHA_COUNT}}',  safe(doshaCount))
        .replaceAll('{{DOSHA_STATUS}}', doshaCount === 0 ? ta('Clear','இல்லை') : ta('Present','உளது'))
        .replaceAll('{{FAILED_COUNT}}', safe(failedCount))
        // Dynamic HTML
        .replaceAll('{{PATHU_ROWS}}',   pathuRows)
        .replaceAll('{{ASHTA_ROWS}}',   ashtaRows)
        .replaceAll('{{DOSHA_HTML}}',   doshaHtml)
        .replaceAll('{{RAJJU_WARN}}',   rajjuWarn)
        // Verdict
        .replaceAll('{{VERDICT_COLOR}}',verdictColor)
        .replaceAll('{{VERDICT_TEXT}}', verdictText)
        .replaceAll('{{VERDICT_BODY}}', verdictBody)
        .replaceAll('{{ASHTA_VERDICT_NOTE}}', ashtaVerdictNote)
        // Strengths & Remedies
        .replaceAll('{{STRENGTHS_HTML}}',strengthsHtml)
        .replaceAll('{{REMEDIES_HTML}}', remediesHtml)
        // Labels
        .replaceAll('{{LANG}}',          safe(reportLang))
      
      // Apply all text labels
      for (const [key, val] of Object.entries(labels)) {
        tmpl = tmpl.replaceAll(`{{${key}}}`, val)
      }

            // Also inject data for JS-rendered tables (poruthams, kootas)
      // Strip all scripts so no old JS overrides our static HTML
      tmpl = tmpl.replace(/<script[\s\S]*?<\/script>/gi, '')
      // Try window.open + document.write (works in all browsers)
      // Send to server-side PDF generation API
      const n1clean = (n1 || 'Person1').replace(/[^a-zA-Z0-9]/g, '_')
      const n2clean = (n2 || 'Person2').replace(/[^a-zA-Z0-9]/g, '_')
      const filename = `VedicHora_${n1clean}_${n2clean}_Porutham.pdf`

      // Inject __VH_DATA so HTML fallback also renders correctly when opened in browser
      const tmplWithData = tmpl.replace('</head>', `<script>window.__VH_DATA=${JSON.stringify(data)}<\/script></head>`)

      const res = await fetch('/api/pdf/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html: tmplWithData, filename, data: data })
      })

      if (!res.ok) throw new Error('PDF generation failed')

      const contentType = res.headers.get('content-type') || ''
      
      const blob = await res.blob()
      const isPdf = contentType.includes('application/pdf')
      const dlFilename = isPdf ? filename : filename.replace('.pdf', '.html')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = dlFilename
      document.body.appendChild(a); a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5000)
          } catch(e) { alert('Report failed: ' + String(e)) }
    setPdfLoading(null)
  }

  useEffect(() => {
    if (!token) return
    listCharts().then((res: any) => {
      const list = Array.isArray(res) ? res : (res?.data?.data ?? res?.data ?? [])
      setSaved(list)
    }).catch(() => {})
  }, [token])

  // ── Validate one person ────────────────────────────────────────────────────
  const validatePerson = (
    label: string, d: DateValue, p: string, lat?: number, lng?: number,
    useSaved: boolean = false, selId: string = ''
  ): string => {
    if (useSaved && selId) return ''            // saved chart — always valid
    if (!d.dd || !d.mm || !d.yyyy)
      return `${label}: please select day, month and year`
    if (!p.trim())
      return `${label}: place of birth is required`
    // lat/lng validated at runtime in calcChart with geocode fallback
    if (!p.trim())
      return label + ': place of birth is required'
    return ''
  }

  // ── Calc one chart ─────────────────────────────────────────────────────────
  const calcChart = async (
    n: string, d: DateValue, p: string,
    lat?: number, lng?: number, g?: string,
    savedId?: string, savedChart?: any
  ) => {
    if (savedId && savedChart) return { chart: savedChart, id: savedId }
    let rlat = lat, rlng = lng
    if ((!rlat || !rlng) && p.trim()) {
      // Use same Nominatim as CityAutocomplete for consistency
      try {
        const geoRes = await fetch(
          'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(p) + '&format=json&limit=1&accept-language=en',
          { headers: { 'User-Agent': 'VedicHora/1.0' } }
        ).then(r => r.json())
        if (Array.isArray(geoRes) && geoRes[0]) {
          rlat = parseFloat(geoRes[0].lat)
          rlng = parseFloat(geoRes[0].lon)
        }
      } catch {}
    }
    if (!rlat || !rlng) throw new Error('Could not locate "' + p + '" — please select from the dropdown')
    const fn = token ? calculateChart : calculateChartGuest
    const r = await fn(buildPayload(n, d, p, rlat, rlng, g))
    const chart = r?.data?.data ?? r?.data
    if (!chart) throw new Error('Chart calculation failed — check date and location')
    return { chart, id: chart.horoscopeId || chart.id || '' }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handle = async () => {
    setErr(''); setErr1(''); setErr2(''); setResult(null)

    // Validate both persons before any API call
    const e1 = validatePerson('Person 1', d1, p1, lat1, lng1, useSaved1, selId1)
    const e2 = validatePerson('Person 2', d2, p2, lat2, lng2, useSaved2, selId2)

    if (e1) setErr1(e1.replace('Person 1: ', ''))
    if (e2) setErr2(e2.replace('Person 2: ', ''))
    if (e1 || e2) {
      setErr(e1 && e2 ? 'Please fix the issues highlighted above for both persons.'
        : e1 ? e1 : e2)
      return
    }

    setLoading(true)
    try {
      const s1 = useSaved1 ? saved.find(c => (c.horoscopeId || c.HoroscopeId) === selId1) : null
      const s2 = useSaved2 ? saved.find(c => (c.horoscopeId || c.HoroscopeId) === selId2) : null

      // Geocode helper
      const geocode = async (place: string, lat?: number, lng?: number) => {
        if (lat && lng) return { lat, lng }
        if (!place?.trim()) return { lat: 13.0827, lng: 80.2707 } // default Chennai
        try {
          const res = await fetch(
            'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(place) + '&format=json&limit=1',
            { headers: { 'User-Agent': 'VedicHora/1.0' } }
          ).then(r => r.json())
          if (Array.isArray(res) && res[0]) return { lat: parseFloat(res[0].lat), lng: parseFloat(res[0].lon) }
        } catch {}
        return { lat: 13.0827, lng: 80.2707 } // fallback Chennai
      }

      const [geo1, geo2] = await Promise.all([
        geocode(p1, lat1, lng1),
        geocode(p2, lat2, lng2),
      ])

      // Dummy r1/r2 for name extraction (populated after match)
      const r1 = s1 ? { chart: s1, id: selId1 } : null
      const r2 = s2 ? { chart: s2, id: selId2 } : null

      const CHART_URL = process.env.NEXT_PUBLIC_CHART_URL || 'https://enchanting-dedication-production.up.railway.app'
      let mdata: any = null

      // Build birth payload from either saved chart or entered form data
      const makePayload = (chart: any, n: string, d: DateValue, geo: {lat:number,lng:number}, g?: string) => {
        if (chart) {
          const bdt = chart.birthDateTime || chart.BirthDateTime || ''
          const dt  = bdt ? new Date(bdt) : null
          return {
            PersonName: chart.personName || chart.PersonName || n || 'Person',
            Year:  dt ? dt.getFullYear() : (chart.year  || chart.Year  || d.yyyy || 2000),
            Month: dt ? dt.getMonth()+1  : (chart.month || chart.Month || d.mm   || 1),
            Day:   dt ? dt.getDate()     : (chart.day   || chart.Day   || d.dd   || 1),
            Hour:  dt ? dt.getHours()    : 12,
            Minute:dt ? dt.getMinutes()  : 0,
            Second: 0,
            PlaceName: chart.placeName || chart.PlaceName || 'Chennai, India',
            Latitude:  chart.latitude  || chart.Latitude  || geo.lat,
            Longitude: chart.longitude || chart.Longitude || geo.lng,
            UtcOffsetHours: chart.utcOffset || chart.UtcOffset || 5.5,
            AyanamsaType: 'Lahiri',
          }
        }
        const tm = d.unknownTime ? {hour:12,minute:0} : to24Hour(d.hr||12, d.mi||0, d.ap||'AM')
        return {
          PersonName: n || 'Person',
          Year: d.yyyy, Month: d.mm, Day: d.dd,
          Hour: tm.hour, Minute: tm.minute, Second: 0,
          PlaceName: 'Chennai, India',
          Latitude: geo.lat, Longitude: geo.lng,
          // UtcOffsetHours omitted — backend auto-resolves timezone+DST from PlaceName+birthDate AyanamsaType: 'Lahiri',
        }
      }

      const gp1 = makePayload(s1, n1, d1, geo1, g1)
      const gp2 = makePayload(s2, n2, d2, geo2, g2)

      // Always use guest-match — returns complete data: Ashta Koota + Pathu Porutham + Rajju
      if (true) {
        const gresp = await fetch(`${CHART_URL}/api/chart/guest-match`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ Person1: gp1, Person2: gp2 })
        })
        const gtext = await gresp.text()
        let gres: any = null
        try { gres = JSON.parse(gtext) } catch {}
        if (!gresp.ok) {
          const msg = gres?.error || gres?.message || gres?.title || `Server error ${gresp.status}`
          throw new Error(msg)
        }
        mdata = gres?.data?.data ?? gres?.data ?? gres
      }


      if (!mdata || (mdata?.AshtaKootaScore === undefined && mdata?.ashtaKootaScore === undefined)) {
        throw new Error('Compatibility calculation failed — please try again')
      }

      const nm1 = n1 || s1?.personName || s1?.PersonName || g1 || 'Person 1'
      const nm2 = n2 || s2?.personName || s2?.PersonName || g2 || 'Person 2'
      // Attach horoscopeIds for PDF download (from saved charts or API response)
      const hid1 = selId1 || mdata?.horoscopeId1 || mdata?.HoroscopeId1 || ''
      const hid2 = selId2 || mdata?.horoscopeId2 || mdata?.HoroscopeId2 || ''
      // Format dob strings for PDF report
      const fmtDate = (d: DateValue) => d.yyyy ? `${d.dd || '?'}/${d.mm || '?'}/${d.yyyy}` : ''
      setResult({
        ...mdata,
        name1: nm1, name2: nm2, chart1: s1, chart2: s2, hid1, hid2,
        dob1: s1?.birthDateTime ? new Date(s1.birthDateTime || s1.BirthDateTime).toLocaleDateString() : fmtDate(d1),
        dob2: s2?.birthDateTime ? new Date(s2.birthDateTime || s2.BirthDateTime).toLocaleDateString() : fmtDate(d2),
        groomLagna: s1?.ascendantName || s1?.AscendantName || '',
        brideLagna: s2?.ascendantName || s2?.AscendantName || '',
      })
      setCollapsed(true)
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    } catch (e: any) {
      const msg = e?.message || 'Calculation failed — please try again'
      // Parse person-specific errors
      if (msg.startsWith('Person 1:')) { setErr1(msg.replace('Person 1: ', '')); setErr(msg) }
      else if (msg.startsWith('Person 2:')) { setErr2(msg.replace('Person 2: ', '')); setErr(msg) }
      else setErr(msg)
    }
    setLoading(false)
  }

  const score  = result?.AshtaKootaScore  ?? result?.ashtaKootaScore  ?? 0
  const total  = result?.AshtaKootaTotal  ?? result?.ashtaKootaTotal  ?? 36
  const pScore = result?.PathuPoruthamScore ?? result?.pathuPoruthamScore ?? 0
  const pTotal = result?.PathuPoruthamTotal ?? result?.pathuPoruthamTotal
  // Normalise camelCase API response fields to PascalCase for JSX
  const poruthams   = result?.Poruthams   ?? result?.poruthams   ?? []
  const isRec       = result?.IsRecommended ?? result?.isRecommended ?? false
  const rajjuWarn   = result?.RajjuWarning  ?? result?.rajjuWarning  ?? ''
  const vedhaPresent= result?.VedhaPresent  ?? result?.vedhaPresent  ?? false
  const summary     = result?.Summary       ?? result?.summary       ?? ''
  const kuta   = result?.KootaDetails || result?.kootaDetails || []
  const pct    = total > 0 ? Math.round((score / total) * 100) : 0
  const scoreColor = pct >= 70 ? '#16A34A' : pct >= 50 ? '#B45309' : '#DC2626'

  // Button disabled if obvious validation fails
  const canSubmit = !loading  // button always clickable; validation is in handle()

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontFamily: 'Cinzel,serif', fontWeight: 700, fontSize: '22px', color: 'var(--acc)' }}>
          Compatibility Matching
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--txm)', marginTop: '4px' }}>
          Ashta Koota · Pathu Porutham · Mangal Dosha · Traditional Vedic Matching
        </p>
        {!token && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#9C6B14',
            background: 'rgba(156,107,20,.07)', padding: '8px 12px', borderRadius: '8px', display: 'inline-block' }}>
            🔒 Guest mode — <a href="/signin" style={{ color: 'var(--acc)', fontWeight: 600 }}>Sign in</a> to use saved charts
          </div>
        )}
      </div>

      {/* Instructions banner */}
      <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '10px',
        background: 'rgba(196,146,42,.07)', border: '1px solid rgba(196,146,42,.2)',
        fontSize: '12px', color: 'var(--txm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MapPin style={{ width: '13px', height: '13px', color: 'var(--gold)', flexShrink: 0 }} />
        <span>
          <strong style={{ color: 'var(--tx)' }}>How to use:</strong> Fill in the date of birth, type a city and
          <strong style={{ color: 'var(--acc)' }}> click the city suggestion</strong> from the dropdown —
          then click Check Compatibility.
        </span>
      </div>

      {/* Edit button when collapsed */}
      {collapsed && (
        <button onClick={() => setCollapsed(false)} style={{
          width: '100%', padding: '10px', borderRadius: '10px',
          border: '1px solid var(--bd)', background: 'var(--bg2)',
          color: 'var(--txm)', fontSize: '12px', cursor: 'pointer', marginBottom: '8px'
        }}>✎ Edit birth details</button>
      )}

      {!collapsed && (
      <>{/* Two person forms */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}
        className="match-grid">
        <PersonCard num={1} gender={g1} setGender={setG1}
          name={n1} setName={setN1} dob={d1} setDob={setD1}
          place={p1} setPlace={setP1} lat={lat1} setLat={setLat1} lng={lng1} setLng={setLng1}
          saved={saved} token={token}
          useSaved={useSaved1} setUseSaved={setUseSaved1}
          selId={selId1} setSelId={setSelId1}
          error={err1} />
        <PersonCard num={2} gender={g2} setGender={setG2}
          name={n2} setName={setN2} dob={d2} setDob={setD2}
          place={p2} setPlace={setP2} lat={lat2} setLat={setLat2} lng={lng2} setLng={setLng2}
          saved={saved} token={token}
          useSaved={useSaved2} setUseSaved={setUseSaved2}
          selId={selId2} setSelId={setSelId2}
          error={err2} />
      </div>

      {/* Global error */}
      {err && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '12px 16px',
          borderRadius: '10px', marginBottom: '16px',
          background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)',
          fontSize: '13px', color: '#DC2626' }}>
          <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '1px' }} />
          {err}
        </div>
      )}

      <button onClick={handle} disabled={loading}
        className="btn-primary"
        style={{ width: '100%', padding: '14px', fontFamily: 'Cinzel,serif', fontSize: '15px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
        {loading
          ? <><RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Calculating...</>
          : <>Check Compatibility <ChevronRight style={{ width: '16px', height: '16px' }} /></>
        }
      </button>
      </>
      )}{/* end !collapsed */}

      {/* ── RESULTS ── */}
      {result && (
        <div ref={resultsRef} style={{ display: 'flex', flexDirection: 'column', gap: '16px', scrollMarginTop: '20px' }}>

          {/* Language selector */}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--txm)' }}>Report language:</span>
            {(['en','ta','hi'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                style={{ padding: '4px 12px', borderRadius: '20px', border: '1px solid var(--acc)',
                  background: lang === l ? 'var(--acc)' : 'transparent',
                  color: lang === l ? '#fff' : 'var(--acc)',
                  fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                {l === 'en' ? 'English' : l === 'ta' ? 'தமிழ்' : 'हिन्दी'}
              </button>
            ))}
          </div>

          {/* ── REPORT CARD — styled like PDF ── */}
          <div style={{
            background: '#FAF6F0', border: '1px solid #C8A96A',
            borderRadius: '12px', overflow: 'hidden',
            boxShadow: '0 4px 32px rgba(61,8,8,.10)'
          }}>
            {/* Header — crimson band */}
            <div style={{ background: '#3D0808', padding: '28px 24px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Cinzel,serif', fontSize: '11px', color: '#C8A96A',
                letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: '6px' }}>
                ॐ VedicHora
              </div>
              <div style={{ fontFamily: 'Cinzel,serif', fontSize: '22px', color: '#fff',
                fontWeight: 700, marginBottom: '4px' }}>
                {L.reportTitle[lang]}
              </div>
              <div style={{ fontSize: '13px', color: '#C8A96A' }}>
                {result.name1} & {result.name2}
              </div>
            </div>

            {/* Score band */}
            <div style={{ background: '#fff8f0', borderBottom: '1px solid #e8d8c0',
              padding: '20px 24px', display: 'flex', justifyContent: 'center',
              gap: '40px', flexWrap: 'wrap', textAlign: 'center' }}>
              {[
                { val: `${score}/${total}`, label: L.ashtaKoota[lang], sub: `${pct}%`, color: pct>=60?'#16A34A':'#DC2626' },
                { val: `${pScore}/${pTotal}`, label: L.pathuPorutham[lang], sub: pScore>=5?L.pass[lang]:L.fail[lang], color: pScore>=5?'#16A34A':'#DC2626' },
                { val: isRec ? '✓' : '—', label: L.recommended[lang], sub: isRec ? L.yes[lang] : L.needsReview[lang], color: isRec?'#16A34A':'#B7862C' },
              ].map(({ val, label, sub, color }) => (
                <div key={label}>
                  <div style={{ fontFamily: 'Cinzel,serif', fontSize: '32px', fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
                  <div style={{ fontSize: '10px', color: '#6B4C2A', fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '.08em', margin: '4px 0 2px' }}>{label}</div>
                  <div style={{ fontSize: '12px', color, fontWeight: 600 }}>{sub}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '0 24px 24px' }}>

              {/* Ashta Koota table */}
              <div style={{ marginTop: '24px' }}>
                <div style={{ fontFamily: 'Cinzel,serif', fontSize: '13px', fontWeight: 700,
                  color: '#3D0808', borderBottom: '2px solid #C8A96A', paddingBottom: '6px',
                  marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  {L.ashtaKootaDetail[lang]}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#3D0808' }}>
                      {[L.koota[lang], L.max[lang], L.score[lang], L.result[lang], L.meaning[lang]].map(h => (
                        <th key={h} style={{ padding: '8px 10px', color: '#fff', textAlign: 'left',
                          fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {kuta.map((k: any, i: number) => {
                      const ks = k.Score ?? k.score ?? 0
                      const km = k.MaxScore ?? k.maxScore ?? (ks > 0 ? ks * 2 : 1)
                      const ok = ks >= km * 0.5
                      const name = k.KootaName || k.kootaName || ''
                      return (
                        <tr key={i} style={{ background: i%2 ? '#FDF6EE' : '#fff',
                          borderBottom: '1px solid #E8D8C0' }}>
                          <td style={{ padding: '8px 10px', fontWeight: 700, color: '#3D0808',
                            fontFamily: 'Cinzel,serif', fontSize: '11px' }}>
                            {(L.kootaNames as any)[name]?.[lang] || name}
                          </td>
                          <td style={{ padding: '8px 10px', color: '#6B4C2A', textAlign: 'center' }}>{km}</td>
                          <td style={{ padding: '8px 10px', fontWeight: 800, textAlign: 'center',
                            color: ok ? '#16A34A' : '#DC2626', fontSize: '14px' }}>{ks}</td>
                          <td style={{ padding: '8px 10px', fontSize: '11px',
                            color: ok ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
                            {ok ? '✓' : '✗'}
                          </td>
                          <td style={{ padding: '8px 10px', fontSize: '10px',
                            color: '#6B4C2A', fontStyle: 'italic' }}>
                            {(KOOTA_MEANING_LANG as any)[name]?.[lang] || KOOTA_MEANING[name] || ''}
                          </td>
                        </tr>
                      )
                    })}
                    <tr style={{ background: '#3D0808' }}>
                      <td colSpan={2} style={{ padding: '8px 10px', color: '#C8A96A',
                        fontWeight: 700, fontFamily: 'Cinzel,serif', fontSize: '11px' }}>
                        {L.total[lang]}
                      </td>
                      <td style={{ padding: '8px 10px', color: pct>=60?'#86EFAC':'#FCA5A5',
                        fontWeight: 900, fontSize: '16px', textAlign: 'center' }}>{score}</td>
                      <td colSpan={2} style={{ padding: '8px 10px', color: '#C8A96A', fontSize: '11px' }}>
                        / {total} · {pct}% · {pct>=70?L.excellent[lang]:pct>=50?L.good[lang]:L.needsReview[lang]}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Pathu Porutham table */}
              {poruthams.length > 0 && (
                <div style={{ marginTop: '28px' }}>
                  <div style={{ fontFamily: 'Cinzel,serif', fontSize: '13px', fontWeight: 700,
                    color: '#3D0808', borderBottom: '2px solid #C8A96A', paddingBottom: '6px',
                    marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                    {L.pathuPoruthamDetail[lang]}
                  </div>
                  {rajjuWarn && (
                    <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5',
                      borderRadius: '8px', padding: '10px 14px', fontSize: '12px',
                      color: '#DC2626', marginBottom: '12px' }}>
                      ⚠ {rajjuWarn}
                    </div>
                  )}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#3D0808' }}>
                        {['#', L.porutham[lang], L.result[lang], L.meaning[lang]].map(h => (
                          <th key={h} style={{ padding: '8px 10px', color: '#fff', textAlign: 'left',
                            fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {poruthams.map((p: any, i: number) => {
                        const pass = p.Verdict === 'Compatible' || p.pass || p.Pass
                        // Tamil porutham names in order (fallback if KootaName missing)
                        const PATHU_NAMES = ['Dinam','Ganam','Mahendram','Sthree Dheerga','Yoni','Rasi','Rasiyathipati','Rajju']
                        const rawName = p.KootaName || p.name || p.Name || ''
                        const name = rawName || PATHU_NAMES[i] || `Porutham ${i+1}`
                        const isCritical = name === 'Rajju' || name === 'Vedha'
                        return (
                          <tr key={i} style={{ background: i%2 ? '#FDF6EE' : '#fff',
                            borderBottom: '1px solid #E8D8C0' }}>
                            <td style={{ padding: '8px 10px', color: '#6B4C2A', fontSize: '11px',
                              textAlign: 'center', fontWeight: 700 }}>{i+1}</td>
                            <td style={{ padding: '8px 10px', fontWeight: 700, color: '#3D0808',
                              fontFamily: 'Cinzel,serif', fontSize: '11px' }}>
                              {(L.poruthamNames as any)[name]?.[lang] || name}
                              {isCritical && <span style={{ marginLeft: '6px', fontSize: '9px',
                                color: '#B7862C', fontFamily: 'sans-serif' }}>★ critical</span>}
                            </td>
                            <td style={{ padding: '8px 10px', fontWeight: 700,
                              color: pass ? '#16A34A' : '#DC2626', fontSize: '12px' }}>
                              {pass ? `✓ ${L.pass[lang]}` : `✗ ${L.fail[lang]}`}
                            </td>
                            <td style={{ padding: '8px 10px', fontSize: '10px',
                              color: '#6B4C2A', fontStyle: 'italic' }}>
                              {(PORUTHAM_MEANING_LANG as any)[name]?.[lang] || PORUTHAM_MEANING[name] || ''}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div style={{ fontSize: '10px', color: '#6B4C2A', marginTop: '10px',
                    padding: '8px 12px', background: '#FDF6EE', borderRadius: '6px',
                    border: '1px solid #E8D8C0' }}>
                    ★ {L.rajjuNote[lang]}
                    {pScore > 0 && (
                      <span> · {L.score[lang]}: <strong>{pScore}/{pTotal || 10}</strong></span>
                    )}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {vedhaPresent && (
                <div style={{ marginTop: '16px', padding: '12px 14px',
                  background: '#FFFBEB', border: '1px solid #F59E0B',
                  borderRadius: '8px', fontSize: '12px', color: '#92400E' }}>
                  ⚠ Vedha present — an inauspicious star combination exists. A proper Muhurtha selection can mitigate this.
                </div>
              )}

              {/* Footer band */}
              <div style={{ marginTop: '24px', paddingTop: '16px',
                borderTop: '1px solid #E8D8C0', textAlign: 'center',
                fontSize: '10px', color: '#6B4C2A' }}>
                www.vedichora.com · {L.footer[lang]}
              </div>
            </div>
          </div>

          {/* PDF Download — works for everyone, no login required */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--bd)', borderRadius:'12px', padding:'18px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
              <div>
                <div style={{ fontFamily:'Cinzel,serif', fontWeight:700, fontSize:'13px', color:'var(--acc)', marginBottom:'3px' }}>
                  📄 Download Full Report
                </div>
                <div style={{ fontSize:'11px', color:'var(--txm)' }}>
                  Complete Vivaha Porutham · All 10 Poruthams with meanings · Ashta Koota · Remedies
                </div>
              </div>
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                {(['en','ta','hi'] as const).map(l => (
                  <button key={l} onClick={() => downloadPdf(l)} disabled={pdfLoading==='gen'}
                    style={{ padding:'8px 16px', borderRadius:'8px', border:'none', cursor:'pointer',
                      background: pdfLoading==='gen' ? 'var(--bd)' : 'var(--acc)', color:'#fff',
                      fontSize:'12px', fontWeight:700, display:'flex', alignItems:'center', gap:'6px',
                      opacity: pdfLoading==='gen' ? 0.6 : 1 }}>
                    <Download style={{ width:'12px', height:'12px' }} />
                    {l==='en' ? '🇬🇧 English' : l==='ta' ? '🇮🇳 தமிழ்' : '🇮🇳 हिन्दी'}
                  </button>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}
