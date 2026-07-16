interface Planet {
  planet: string
  rasiName: string
  houseNumber: number
  nakshatraName: string
  isRetrograde?: boolean
  isRetrograd?: boolean
}

export default function PlanetTable({ planets }: { planets: Planet[] }) {
  const rows = planets.filter(p => p.planet !== 'Ascendant')

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-maroon/5 border-b border-border">
            <th className="text-left px-4 py-2.5 font-semibold text-maroon text-xs uppercase tracking-wider">Planet</th>
            <th className="text-left px-4 py-2.5 font-semibold text-maroon text-xs uppercase tracking-wider">Sign</th>
            <th className="text-left px-4 py-2.5 font-semibold text-maroon text-xs uppercase tracking-wider">House</th>
            <th className="text-left px-4 py-2.5 font-semibold text-maroon text-xs uppercase tracking-wider">Nakshatra</th>
            <th className="text-left px-4 py-2.5 font-semibold text-maroon text-xs uppercase tracking-wider">R</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map(p => (
            <tr key={p.planet} className="hover:bg-gold/3 transition-colors">
              <td className="px-4 py-2.5 font-semibold text-maroon">{p.planet}</td>
              <td className="px-4 py-2.5 text-gray-700">{p.rasiName || '—'}</td>
              <td className="px-4 py-2.5 text-gray-500">{p.houseNumber || '—'}</td>
              <td className="px-4 py-2.5 text-gray-600">{p.nakshatraName || '—'}</td>
              <td className="px-4 py-2.5">
                {(p.isRetrograde || p.isRetrograd) && (
                  <span className="text-amber-600 font-bold text-xs">℞</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
