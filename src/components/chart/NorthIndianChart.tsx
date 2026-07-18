'use client'
// North Indian (Diamond) Kundali chart
// Standard layout: H1 top, clockwise H2-H12
// Asc = top-centre diamond

const ABBR: Record<string,string> = {
  Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',
  Venus:'Ve',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke',Ascendant:'As'
}

// 12 house cells — North Indian diamond chart (300x300 viewBox)
// Houses: 1=top, 2=right-of-1, going clockwise
const CELLS = [
  // Outer 4 corner triangles (H1,H4,H7,H10) + 4 side diamonds
  // H1 - top
  {d:"M150,0 L300,150 L150,150 L0,150 Z",              cx:150, cy:75  },
  // H2 - top-right  
  {d:"M300,0 L300,150 L150,150 L150,0 Z",              cx:235, cy:75  },
  // H3 - right
  {d:"M300,150 L300,300 L150,150 Z",                   cx:240, cy:215 },
  // H4 - bottom-right
  {d:"M300,300 L150,300 L150,150 Z",                   cx:235, cy:235 },
  // H5 - bottom
  {d:"M150,300 L0,300 L150,150 L300,300 Z",            cx:150, cy:240 },
  // H6 - bottom-left
  {d:"M0,300 L0,150 L150,150 Z",                       cx:60,  cy:215 },
  // H7 - left
  {d:"M0,150 L0,0 L150,150 Z",                         cx:55,  cy:80  },
  // H8 - top-left
  {d:"M0,0 L150,0 L150,150 Z",                         cx:65,  cy:75  },
  // H9 - inner top-left
  {d:"M150,0 L150,150 L0,150 Z",                       cx:80,  cy:90  },
  // H10 - inner top
  {d:"M150,0 L300,0 L150,150 Z",                       cx:220, cy:90  },
  // H11 - inner right
  {d:"M300,0 L300,150 L150,150 Z",                     cx:245, cy:115 },
  // H12 - inner bottom-right
  {d:"M300,150 L150,150 L300,300 Z",                   cx:240, cy:185 },
]

interface Props { planets: any[]; ascendant: number }

export default function NorthIndianChart({ planets, ascendant }: Props) {
  // Map planets to houses
  const hmap: Record<number,{abbr:string,retro:boolean}[]> = 
    Object.fromEntries(Array.from({length:12},(_,i)=>[i,[]]))

  planets.forEach(p => {
    const house = (Number(p.house||p.House||1)-1+12)%12
    const name  = p.planet||p.Planet||''
    const abbr  = ABBR[name] || name.slice(0,2)
    const retro = !!(p.isRetrograde||p.IsRetrograde)
    hmap[house].push({abbr, retro})
  })

  return (
    <div style={{background:'var(--bg2)',borderRadius:'12px',padding:'8px',
      border:'1px solid var(--bd)'}}>
      <svg viewBox="0 0 300 300" style={{width:'100%',maxWidth:'320px',display:'block',margin:'0 auto'}}
        xmlns="http://www.w3.org/2000/svg">
        
        {/* Background */}
        <rect width="300" height="300" fill="transparent"/>
        
        {/* Outer border */}
        <rect x="0" y="0" width="300" height="300"
          fill="none" stroke="var(--bd)" strokeWidth="1.5"/>

        {/* Cross lines */}
        <line x1="0" y1="0" x2="300" y2="300" stroke="var(--bd)" strokeWidth="0.8" opacity="0.6"/>
        <line x1="300" y1="0" x2="0" y2="300" stroke="var(--bd)" strokeWidth="0.8" opacity="0.6"/>
        <line x1="150" y1="0" x2="150" y2="300" stroke="var(--bd)" strokeWidth="0.8" opacity="0.4"/>
        <line x1="0" y1="150" x2="300" y2="150" stroke="var(--bd)" strokeWidth="0.8" opacity="0.4"/>

        {CELLS.map((cell,i) => {
          const items  = hmap[i]||[]
          const isH1   = i===0
          return (
            <g key={i}>
              <path d={cell.d}
                fill={isH1?'rgba(196,146,42,.08)':'transparent'}
                stroke="var(--bd)" strokeWidth="0.6"/>
              
              {/* House number - small, top-left of cell */}
              <text x={cell.cx-2} y={cell.cy-9}
                textAnchor="middle" fontSize="7.5"
                fill="var(--txm)" opacity="0.5" fontFamily="serif">{i+1}</text>

              {/* Asc marker in H1 */}
              {isH1 && (
                <text x={cell.cx} y={cell.cy+1}
                  textAnchor="middle" fontSize="8"
                  fill="var(--acc)" fontWeight="700" fontFamily="serif" opacity="0.7">Asc</text>
              )}

              {/* Planet abbreviations */}
              {items.map(({abbr,retro},pi) => (
                <text key={pi}
                  x={cell.cx}
                  y={cell.cy + (isH1?10:4) + pi*12}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="700"
                  fontFamily="serif"
                  fill={retro?'#F87171':'var(--gold)'}>
                  {abbr}{retro&&<tspan fontSize="7" dy="-3">℞</tspan>}
                </text>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
