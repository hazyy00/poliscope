import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface Props {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      fontSize: 11, color: 'var(--t3)',
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.04em',
    }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {i > 0 && <span style={{ color: 'var(--t3)', opacity: 0.4 }}>/</span>}
          {item.href ? (
            <Link href={item.href} style={{
              color: i === items.length - 1 ? 'var(--t1)' : 'var(--t3)',
              textDecoration: 'none',
            }}>
              {item.label}
            </Link>
          ) : (
            <span style={{ color: i === items.length - 1 ? 'var(--t1)' : 'var(--t3)' }}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}
