'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: '국회의원', href: '/members' },
  { label: '법안', href: '/bills' },
]

export function SiteNav() {
  const pathname = usePathname()

  if (pathname === '/') return null

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 52px', height: 60,
      borderBottom: '0.5px solid var(--bd)',
      background: 'color-mix(in srgb, var(--iv) 92%, transparent)',
      backdropFilter: 'blur(14px)',
    }}>
      <Link href="/" style={{ textDecoration: 'none', fontSize: 15, display: 'flex', alignItems: 'center', gap: 9, color: 'inherit' }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pu)', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 400, fontFamily: 'var(--font-modern),sans-serif' }}>PoliScope</div>
          <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.04em', marginTop: 2, fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap' }}>
            대한민국 국회 투명성 플랫폼
          </div>
        </div>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {NAV_LINKS.map(({ label, href }) => {
          const isActive = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              style={{
                fontSize: 13,
                color: isActive ? 'var(--t1)' : 'var(--t2)',
                textDecoration: 'none',
                position: 'relative',
                paddingBottom: 2,
              }}
            >
              {label}
              {isActive && (
                <span style={{
                  position: 'absolute', left: 0, right: 0, bottom: -22,
                  height: 2, background: 'var(--pu)',
                }} />
              )}
            </Link>
          )
        })}
        <Link
          href="/bills"
          style={{
            fontSize: 12, fontWeight: 500, color: 'var(--iv)',
            background: 'var(--bk)', padding: '8px 18px', borderRadius: 2,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}
        >
          검색하기 →
        </Link>
      </div>
    </nav>
  )
}
