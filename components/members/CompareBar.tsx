interface CompareBarProps {
  label: string
  value: number
  avg: number
  max: number
  color: string
  unit?: string
  size?: 'sm' | 'md' | 'lg'
}

export function CompareBar({ label, value, avg, max, color, unit = '', size = 'md' }: CompareBarProps) {
  const vw = Math.min(value / max, 1) * 100
  const aw = Math.min(avg / max, 1) * 100
  const labelFs = size === 'lg' ? 13 : 11
  const valueFs = size === 'lg' ? 22 : 16
  const avgFs = size === 'lg' ? 12 : 10
  const barH = size === 'lg' ? 6 : 4
  const tickH = size === 'lg' ? 12 : 8

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
        <span style={{
          color: 'var(--m-muted)', letterSpacing: '0.02em', fontSize: labelFs,
          textTransform: 'uppercase', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap'
        }}>
          {label}
        </span>
        <span style={{ fontWeight: 600, color: 'var(--m-ink)', fontFamily: 'var(--font-display)', fontSize: valueFs, letterSpacing: '-0.01em' }}>
          {value}
          <span style={{ fontSize: valueFs * 0.65, color: 'var(--m-muted)', fontWeight: 400, marginLeft: 1 }}>{unit}</span>
          <span style={{ fontSize: avgFs, color: 'var(--m-muted)', fontWeight: 400, marginLeft: 10, fontFamily: 'var(--font-pretendard)' }}>
            정당 {avg.toFixed(avg % 1 === 0 ? 0 : 1)}{unit}
          </span>
        </span>
      </div>
      <div style={{ position: 'relative', height: barH, background: 'var(--m-faint)' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${vw}%`, background: color }} />
        {/* 정당 평균 tick */}
        <div style={{
          position: 'absolute',
          left: `${aw}%`,
          top: -(tickH - barH) / 2,
          width: 3,
          height: tickH,
          background: 'var(--m-ink)',
          opacity: 1,
        }} />
      </div>
    </div>
  )
}
