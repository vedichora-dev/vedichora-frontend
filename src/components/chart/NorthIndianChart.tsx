'use client'
interface Props { planets: any[]; ascendant: number }

const ABBR: Record<string,string> = {
  Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',
  Venus:'Ve',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke'
}

// North Indian diamond chart — 300x300
// 12 cells arranged as nested diamonds
// H1=top, clockwise: H2 right-of-top, H3 far-right, H4 bottom-right...
const CELLS = [
  {d:"M150,0 L300,100 L150,150 L0,100 Z",           cx:150, cy:70 },  // H1 top
  {d:"M300,100 L300,200 L150,150 Z",                 cx:255, cy:155},  // H2
  {d:"M300,200 L300,300 L150,150 Z",                 cx:255, cy:245},  // H3
  {d:"M300,300 L150,150 L0,300 Z",                   cx:150, cy:255},  // H4 bottom
  {d:"M0,300 L150,150 L0,200 Z",                     cx:45,  cy:245},  // H5
  {d:"M0,200 L150,150 L0,100 Z",                     cx:45,  cy:155},  // H6
  {d:"M0,100 L150,150 L150,0 Z",                     cx:70,  cy:80 },  // H7
  {d:"M150,0 L150,150 L300,100 Z",                   cx:230, cy:80 },  // H8
  {d:"M300,100 L150,150 L300,200 Z",                 cx:240, cy:150},  // H9
  {d:"M300,200 L150,150 L150,300 Z",                 cx:220, cy:235},  // H10
  {d:"M150,300 L150,150 L0,200 Z",                   cx:80,  cy:235},  // H11
  {d:"M0,200 L150,150 L0,100 Z",                     cx:60,  cy:150},  // H12
]

export default function NorthIndianChart({ planets, ascendant }: Props) {
  const hmap: Record<number,string[]> = Object.fromEntries(
    Array.from({length:12},(_,i)=>[i,[]])
  )
  planets.forEach(p => {
    const h = (Number(p.house||p.House||1)-1+12)%12
    const abbr = ABBR[p.planet||p.Planet||''] || (p.planet||p.Planet||'').slice(0,2)
    const retro = p.isRetrograde||p.IsRetrograde
    hmap[h].push(retro ? abbr+'®' : abbr)
  })
  return (
    <svg viewBox="0 0 300 300" style={{width:'100%',maxWidth:'340px'}} xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="300" fill="none" stroke="var(--bd)" strokeWidth="1.5"/>
      <line x1="0" y1="0" x2="300" y2="300" stroke="var(--bd)" strokeWidth="0.6"/>
      <line x1="300" y1="0" x2="0" y2="300" stroke="var(--bd)" strokeWidth="0.6"/>
      <line x1="150" y1="0" x2="150" y2="300" stroke="var(--bd)" strokeWidth="0.6"/>
      <line x1="0" y1="150" x2="300" y2="150" stroke="var(--bd)" strokeWidth="0.6"/>
      {CELLS.map((c,i)=>(
        <g key={i}>
          <path d={c.d} fill={i===0?'rgba(196,146,42,.06)':'transparent'} stroke="var(--bd)" strokeWidth="0.8"/>
          <text x={c.cx} y={c.cy-8} textAnchor="middle" fontSize="8" fill="var(--txm)" opacity="0.5">{i+1}</text>
          {i===0 && <text x={c.cx} y={c.cy+2} textAnchor="middle" fontSize="8" fill="var(--acc)" fontWeight="700">Asc</text>}
          {hmap[i].map((a,j)=>(
            <text key={j} x={c.cx} y={c.cy+(i===0?12:0)+j*12+(i===0?2:0)}
              textAnchor="middle" fontSize="10" fontWeight="700" fontFamily="serif"
              fill={a.includes('®')?'#F87171':'var(--gold)'}>{a}</text>
          ))}
        </g>
      ))}
    </svg>
  )
}
