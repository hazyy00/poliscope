import { cn } from '@/lib/utils'

type Status = '계류' | '가결' | '부결' | '폐기' | '철회' | '수정가결'

const STATUS_STYLE: Record<Status, string> = {
  '계류':   'bg-amber-100  text-amber-800',
  '가결':   'bg-green-100  text-green-800',
  '수정가결': 'bg-green-100  text-green-800',
  '부결':   'bg-slate-100  text-slate-600',
  '폐기':   'bg-slate-100  text-slate-600',
  '철회':   'bg-slate-100  text-slate-600',
}

interface Props {
  status: string
  size?: 'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, size = 'md', className }: Props) {
  const style = STATUS_STYLE[status as Status] ?? 'bg-slate-100 text-slate-600'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        style,
        className,
      )}
    >
      {status}
    </span>
  )
}
