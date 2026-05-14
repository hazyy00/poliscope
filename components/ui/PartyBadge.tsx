import { cn } from '@/lib/utils'
import { getPartyColor } from '@/lib/utils'

interface Props {
  party: string | null | undefined
  size?: 'sm' | 'md'
  className?: string
}

export function PartyBadge({ party, size = 'md', className }: Props) {
  const color = getPartyColor(party)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        className,
      )}
      style={{ backgroundColor: `${color}18`, color }}
    >
      <span
        className="inline-block rounded-full"
        style={{ width: 6, height: 6, backgroundColor: color, flexShrink: 0 }}
      />
      {party ?? '무소속'}
    </span>
  )
}
