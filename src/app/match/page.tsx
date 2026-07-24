'use client'
import { useState, useEffect, useRef } from 'react'
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
    UtcOffsetHours: 5.5, AyanamsaType: 'Lahiri',
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
      // Fetch the HTML report template from public/
      const tmplRes = await fetch('/porutham-report.html')
      const tmpl = await tmplRes.text()
      // Inject data
      const data = {
        ...result,
        lang: reportLang,
        name1: result.name1 || 'Person 1',
        name2: result.name2 || 'Person 2',
        dob1:  result.dob1  || '',
        dob2:  result.dob2  || '',
        groomNakshatra: result.GroomNakshatra || result.groomNakshatra || '',
        brideNakshatra: result.BrideNakshatra || result.brideNakshatra || '',
        groomRasi: result.GroomRasi || result.groomRasi || '',
        brideRasi: result.BrideRasi || result.brideRasi || '',
        groomLagna: result.groomLagna || '',
        brideLagna: result.brideLagna || '',
        groomNadi: result.groomNadi || '',
        brideNadi: result.brideNadi || '',
        groomRajju: result.GroomRajju || result.groomRajju || '',
        brideRajju: result.BrideRajju || result.brideRajju || '',
      }
      // Open new window and inject data + template
      const win = window.open('', '_blank')
      if (!win) { alert('Please allow popups for PDF download'); setPdfLoading(null); return }
      win.document.write(tmpl)
      win.document.close()
      // Inject data after document is ready
      setTimeout(() => {
        try {
          win.__VH_DATA = data
          // Re-trigger init
          if (win.document.readyState === 'complete') {
            const script = win.document.createElement('script')
            script.textContent = 'window.__VH_DATA = ' + JSON.stringify(data) + '; if(typeof init==="function") init();'
            win.document.body.appendChild(script)
          }
        } catch {}
      }, 300)
    } catch(e) { alert('Report generation failed: ' + e) }
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
          UtcOffsetHours: 5.5, AyanamsaType: 'Lahiri',
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
                      const km = k.MaxScore ?? k.maxScore ?? 1
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
                        const name = p.KootaName || p.name || p.Name || `Porutham ${i+1}`
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



        </div>
      )}
    </div>
  )
}
