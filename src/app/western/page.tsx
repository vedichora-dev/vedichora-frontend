"use client"
import Link from "next/link"

const SIGNS = [
  {en:"Aries",sym:"♈",dates:"Mar 21–Apr 19",elem:"Fire",lord:"Mars"},
  {en:"Taurus",sym:"♉",dates:"Apr 20–May 20",elem:"Earth",lord:"Venus"},
  {en:"Gemini",sym:"♊",dates:"May 21–Jun 20",elem:"Air",lord:"Mercury"},
  {en:"Cancer",sym:"♋",dates:"Jun 21–Jul 22",elem:"Water",lord:"Moon"},
  {en:"Leo",sym:"♌",dates:"Jul 23–Aug 22",elem:"Fire",lord:"Sun"},
  {en:"Virgo",sym:"♍",dates:"Aug 23–Sep 22",elem:"Earth",lord:"Mercury"},
  {en:"Libra",sym:"♎",dates:"Sep 23–Oct 22",elem:"Air",lord:"Venus"},
  {en:"Scorpio",sym:"♏",dates:"Oct 23–Nov 21",elem:"Water",lord:"Mars"},
  {en:"Sagittarius",sym:"♐",dates:"Nov 22–Dec 21",elem:"Fire",lord:"Jupiter"},
  {en:"Capricorn",sym:"♑",dates:"Dec 22–Jan 19",elem:"Earth",lord:"Saturn"},
  {en:"Aquarius",sym:"♒",dates:"Jan 20–Feb 18",elem:"Air",lord:"Saturn"},
  {en:"Pisces",sym:"♓",dates:"Feb 19–Mar 20",elem:"Water",lord:"Jupiter"},
]

export default function WesternPage() {
  return (
    <div className="page-wrap">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="page-header mb-0">
          <h1>Western Astrology</h1>
          <p>Sun sign horoscopes and compatibility</p>
        </div>
        <Link href="/" className="btn-ghost text-sm px-4 py-2">🪔 Switch to Vedic</Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {SIGNS.map(s => (
          <div key={s.en} className="card card-bd text-center cursor-pointer hover:shadow-lg transition-all"
            onClick={() => alert(`${s.en} daily horoscope coming soon`)}>
            <div className="text-4xl mb-2">{s.sym}</div>
            <div className="font-cinzel font-bold text-sm mb-1" style={{color:"var(--maroon)"}}>{s.en}</div>
            <div className="text-xs" style={{color:"var(--txm)"}}>{s.dates}</div>
            <div className="text-xs mt-1" style={{color:"var(--gold)"}}>{s.elem} · {s.lord}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
