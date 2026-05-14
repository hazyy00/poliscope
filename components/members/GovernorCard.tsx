import Link from 'next/link'
import { PartyBadge } from '@/components/ui/PartyBadge'
import type { Governor, RegionData } from '@/lib/regions'

interface Props {
  region: RegionData
}

export function GovernorCard({ region }: Props) {
  const { governor, name: regionName } = region
  const initials = governor.name[0]

  return (
    <Link
      href={`/regions/${encodeURIComponent(regionName)}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--iv)',
        border: '1px solid var(--bd)',
        borderRadius: 10,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
      }}
      className="hover-card"
    >
      {/* Photo placeholder */}
      <div style={{ position: 'relative', aspectRatio: '3/4', background: 'var(--ivd)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 40, fontWeight: 300, color: 'var(--t3)', fontFamily: 'var(--font-serif), serif' }}>
          {initials}
        </span>
        {/* 시장/도지사 badge */}
        <span style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 10, fontWeight: 500, color: 'white',
          background: 'rgba(0,0,0,0.38)', borderRadius: 4,
          padding: '2px 6px', backdropFilter: 'blur(4px)',
        }}>
          {governor.title}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--t1)' }}>{governor.name}</div>
        <PartyBadge party={governor.party} size="sm" />
        <div style={{ fontSize: 12, color: 'var(--t3)' }}>{regionName}</div>
      </div>
    </Link>
  )
}
