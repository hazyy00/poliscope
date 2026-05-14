import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Props {
  page: number
  totalPages: number
  buildHref: (page: number) => string
  className?: string
}

export function Pagination({ page, totalPages, buildHref, className }: Props) {
  if (totalPages <= 1) return null

  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…')
    }
  }

  return (
    <div className={cn('flex items-center justify-center gap-1', className)}>
      {page > 1 && (
        <Link href={buildHref(page - 1)} style={{ padding: '6px 12px', fontSize: 13, color: 'var(--t2)', textDecoration: 'none', borderRadius: 6, border: '1px solid var(--bd)' }}>
          이전
        </Link>
      )}
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e${i}`} style={{ padding: '6px 4px', color: 'var(--t3)', fontSize: 13 }}>…</span>
        ) : (
          <Link
            key={p}
            href={buildHref(p as number)}
            style={{
              padding: '6px 11px',
              fontSize: 13,
              textDecoration: 'none',
              borderRadius: 6,
              border: '1px solid var(--bd)',
              background: p === page ? 'var(--bk)' : 'transparent',
              color: p === page ? 'var(--iv)' : 'var(--t2)',
            }}
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages && (
        <Link href={buildHref(page + 1)} style={{ padding: '6px 12px', fontSize: 13, color: 'var(--t2)', textDecoration: 'none', borderRadius: 6, border: '1px solid var(--bd)' }}>
          다음
        </Link>
      )}
    </div>
  )
}
