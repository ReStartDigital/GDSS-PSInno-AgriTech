/**
 * RoutePreviewSvg — lightweight, no-Leaflet route preview for job cards.
 * Draws a stylized origin→destination route line with dot markers.
 * Zero DOM weight, no iframe, no z-index bleed.
 */

interface RoutePreviewSvgProps {
  distanceKm?: number
  accent?: string
  tint?: string
  route?: string
}

export function RoutePreviewSvg({
  distanceKm,
  accent = '#264123',
  tint = 'rgba(38,65,35,0.06)',
  route = 'Route',
}: RoutePreviewSvgProps) {
  const w = 320
  const h = 110
  const pad = 32

  const x1 = pad, y1 = h * 0.65
  const x2 = w - pad, y2 = h * 0.35
  const cx = w / 2, cy = h * 0.15

  const pathD = `M ${x1},${y1} Q ${cx},${cy} ${x2},${y2}`

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: '100%', display: 'block' }}
      aria-label={route}
      role="img"
    >
      <rect width={w} height={h} fill={tint} rx={0} />

      {[0.25, 0.5, 0.75].map((f) => (
        <line key={`v${f}`} x1={w * f} y1={0} x2={w * f} y2={h} stroke="rgba(0,0,0,0.04)" strokeWidth={1} />
      ))}
      {[0.33, 0.66].map((f) => (
        <line key={`h${f}`} x1={0} y1={h * f} x2={w} y2={h * f} stroke="rgba(0,0,0,0.04)" strokeWidth={1} />
      ))}

      <path d={pathD} fill="none" stroke={accent} strokeWidth={2.5} strokeDasharray="6 4" strokeLinecap="round" opacity={0.75} />

      <circle cx={x1} cy={y1} r={7} fill="#22c55e" stroke="#fff" strokeWidth={2} />
      <text x={x1 + 11} y={y1 + 4} fontSize={9} fill="#374151" fontFamily="sans-serif" fontWeight={600}>Pickup</text>

      <circle cx={x2} cy={y2} r={7} fill="#ef4444" stroke="#fff" strokeWidth={2} />
      <text x={x2 - 45} y={y2 - 9} fontSize={9} fill="#374151" fontFamily="sans-serif" fontWeight={600}>Drop-off</text>

      {distanceKm && (
        <g transform={`translate(${w / 2}, ${h / 2 - 4})`}>
          <rect x={-22} y={-10} width={44} height={18} rx={6} fill="rgba(255,255,255,0.88)" />
          <text textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={700} fill={accent} fontFamily="sans-serif">
            {distanceKm} km
          </text>
        </g>
      )}
    </svg>
  )
}
