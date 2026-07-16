interface Planet { planet: string; houseNumber: number }

const HOUSE_POSITIONS: Record<number, { x: number; y: number }> = {
  1:  { x: 120, y: 38  },
  2:  { x: 204, y: 120 },
  3:  { x: 204, y: 200 },
  4:  { x: 120, y: 202 },
  5:  { x: 36,  y: 200 },
  6:  { x: 36,  y: 120 },
  7:  { x: 120, y: 118 },
  8:  { x: 36,  y: 38  },
  9:  { x: 120, y: 38  },
  10: { x: 120, y: 120 },
  11: { x: 204, y: 38  },
  12: { x: 120, y: 118 },
}

const HOUSE_COORDS: Record<number, { x: number; y: number }> = {
  1:  { x:120, y:40  },
  2:  { x:198, y:118 },
  3:  { x:198, y:202 },
  4:  { x:120, y:200 },
  5:  { x:42,  y:202 },
  6:  { x:42,  y:118 },
  7:  { x:120, y:200 },
  8:  { x:42,  y:40  },
  9:  { x:120, y:40  },
  10: { x:120, y:118 },
  11: { x:198, y:40  },
  12: { x:120, y:118 },
}

export default function NorthChart({ planets = [] }: { planets: Planet[] }) {
  // Group planets by house
  const byHouse: Record<number, string[]> = {}
  for (let i = 1; i <= 12; i++) byHouse[i] = []
  planets.forEach(p => {
    if (p.planet !== 'Ascendant' && p.houseNumber >= 1 && p.houseNumber <= 12) {
      byHouse[p.houseNumber].push(p.planet.slice(0,3))
    }
  })

  return (
    <svg viewBox="0 0 240 240" className="w-full max-w-xs mx-auto" style={{ filter: 'drop-shadow(0 2px 8px rgba(58,20,20,0.1))' }}>
      {/* Outer square */}
      <rect x="2" y="2" width="236" height="236" fill="none" stroke="#D4C4A0" strokeWidth="1.5" rx="2" />
      {/* Inner square */}
      <rect x="62" y="62" width="116" height="116" fill="none" stroke="#D4C4A0" strokeWidth="1" />
      {/* Diagonals */}
      <line x1="2" y1="2"   x2="120" y2="120" stroke="#C4922A" strokeWidth="1.2" opacity="0.6" />
      <line x1="238" y1="2"   x2="120" y2="120" stroke="#C4922A" strokeWidth="1.2" opacity="0.6" />
      <line x1="2" y1="238" x2="120" y2="120" stroke="#C4922A" strokeWidth="1.2" opacity="0.6" />
      <line x1="238" y1="238" x2="120" y2="120" stroke="#C4922A" strokeWidth="1.2" opacity="0.6" />
      {/* Top box */}
      <rect x="62" y="2" width="116" height="60" fill="#FDFAF5" stroke="#D4C4A0" strokeWidth="1" />
      {/* Bottom box */}
      <rect x="62" y="178" width="116" height="60" fill="#FDFAF5" stroke="#D4C4A0" strokeWidth="1" />
      {/* Left box */}
      <rect x="2" y="62" width="60" height="116" fill="#FDFAF5" stroke="#D4C4A0" strokeWidth="1" />
      {/* Right box */}
      <rect x="178" y="62" width="60" height="116" fill="#FDFAF5" stroke="#D4C4A0" strokeWidth="1" />
      {/* Center */}
      <rect x="62" y="62" width="116" height="116" fill="#FFFDF8" />

      {/* Lagna marker on house 1 */}
      <text x="120" y="24" textAnchor="middle" fontSize="7" fill="#C4922A" fontWeight="bold" fontFamily="Cinzel,serif">Lagna</text>

      {/* Planet labels by house */}
      {Object.entries(byHouse).map(([house, ps]) => {
        if (!ps.length) return null
        const pos = HOUSE_COORDS[+house] || { x: 120, y: 120 }
        return (
          <text key={house} x={pos.x} y={pos.y} textAnchor="middle"
            fontSize="7.5" fill="#3A1414" fontFamily="serif">
            {ps.join(' ')}
          </text>
        )
      })}

      {/* House numbers */}
      {[1,2,3,4,5,6,7,8,9,10,11,12].map(h => {
        const positions: Record<number,{x:number,y:number}> = {
          1:{x:120,y:16},2:{x:204,y:96},3:{x:204,y:176},4:{x:120,y:224},
          5:{x:36,y:176},6:{x:36,y:96},7:{x:120,y:152},8:{x:36,y:16},
          9:{x:84,y:16},10:{x:120,y:96},11:{x:204,y:16},12:{x:120,y:96}
        }
        const p = positions[h]
        if (!p) return null
        return null // House numbers omitted for cleanliness
      })}
    </svg>
  )
}
