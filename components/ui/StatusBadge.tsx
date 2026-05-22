type Status = '계류' | '가결' | '부결' | '폐기' | '철회' | '수정가결'

const STATUS_VAR: Record<Status, { color: string; bg: string }> = {
  '계류':    { color: 'var(--st-pend)', bg: 'var(--st-pend-bg)' },
  '가결':    { color: 'var(--st-pass)', bg: 'var(--st-pass-bg)' },
  '수정가결': { color: 'var(--st-pass)', bg: 'var(--st-pass-bg)' },
  '부결':    { color: 'var(--st-fail)', bg: 'var(--st-fail-bg)' },
  '폐기':    { color: 'var(--st-drop)', bg: 'var(--st-drop-bg)' },
  '철회':    { color: 'var(--st-drop)', bg: 'var(--st-drop-bg)' },
}

const DEFAULT_VAR = { color: 'var(--t3)', bg: 'var(--ivd)' }

interface Props {
  status: string
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, size = 'md', className }: Props) {
  const vars = STATUS_VAR[status as Status] ?? DEFAULT_VAR
  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 20,
        fontWeight: 600,
        fontSize: size === 'sm' ? 11 : 12,
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        color: vars.color,
        background: vars.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  )
}
