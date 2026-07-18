'use client'
interface Props { planets: any[]; ascendant: number }

const ABBR: Record<string,string> = {
  Sun:'Su',Moon:'Mo',Mars:'Ma',Mercury:'Me',Jupiter:'Ju',
  Venus:'Ve',Saturn:'Sa',Rahu:'Ra',Ketu:'Ke'
}

// South Indian fixed rasi grid 4x4 (corners empty)
// Row 0: _ Pis Ari Tau | Row 1: Aqu _ _ Gem
// Row 2: Cap _ _ Can  | Row 3: Sag Sco Lib Vir
const GRID: (number|null)[] = [
  null,11,0,1,  10,null,null,2,  9,null,null,3,  8,7,6,5
]

export default function SouthIndianChart({ planets, ascendant }: Props) {
  const RASI = ['Mes','Vrs','Mit','Kar','Sim','Kan','Tul','Vri','Dha','Mak','Kum','Mee']
  const rmap: Record<number,string[]> = Object.fromEntries(Array.from({length:12},(_,i)=>[i,[]]))
  planets.forEach(p => {
    const ri = Number(p.rasi??p.Rasi??0)
    const abbr = ABBR[p.planet||p.Planet||''] || (p.planet||p.Planet||'').slice(0,2)
    const retro = p.isRetrograde||p.IsRetrograde
    if (rmap[ri]) rmap[ri].push(retro ? abbr+'(R)' : abbr)
  })
  const cw=75, ch=75
  return (
    <svg viewBox="0 0 300 300" style={{width:'100%',maxWidth:'340px'}} xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="300" fill="none" stroke="var(--bd)" strokeWidth="1.5"/>
      {GRID.map((ri,gi)=>{
        if(ri===null) return null
        const row=Math.floor(gi/4), col=gi%4
        const x=col*cw, y=row*ch
        const isAsc=ri===ascendant
        const house=((ri-ascendant+12)%12)+1
        const pls=rmap[ri]||[]
        return (
          <g key={gi}>
            <rect x={x} y={y} width={cw} height={ch}
              fill={isAsc?'rgba(196,146,42,.1)':'transparent'} stroke="var(--bd)" strokeWidth="1"/>
            <text x={x+3} y={y+10} fontSize="7.5" fill="var(--txm)" fontFamily="serif">{RASI[ri]}</text>
            <text x={x+cw-3} y={y+10} fontSize="7.5" fill={isAsc?'var(--acc)':'var(--txm)'}
              textAnchor="end" fontFamily="serif" fontWeight={isAsc?'700':'400'}>{house}</text>
            {isAsc && <line x1={x} y1={y} x2={x+12} y2={y+12} stroke="var(--acc)" strokeWidth="2"/>}
            {pls.map((a,pi)=>(
              <text key={pi} x={x+cw/2} y={y+26+pi*13} textAnchor="middle"
                fontSize="10" fontWeight="700" fontFamily="serif"
                fill={a.includes('(R)')?'#F87171':'var(--gold)'}>
                {a.replace('(R)','')}
              </text>
            ))}
          </g>
        )
      })}
    </svg>
  )
}
