import Link from 'next/link'
import Image from 'next/image'
import { PartyBadge } from '@/components/ui/PartyBadge'

export interface Cosponsor {
  member_id: string
  members: {
    name: string
    party: string | null
    photo_url: string | null
  } | null
}

interface Props {
  cosponsors: Cosponsor[]
  totalCount?: number
}

export function Cosponsors({ cosponsors, totalCount }: Props) {
  const visible = cosponsors.slice(0, 10)
  const overflow = (totalCount ?? cosponsors.length) - 10

  if (cosponsors.length === 0) {
    return <p style={{ color: 'var(--t3)', fontSize: 13 }}>공동발의자 없음</p>
  }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: overflow > 0 ? 8 : 0 }}>
        {visible.map(cs => (
          <Link
            key={cs.member_id}
            href={`/members/${cs.member_id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', padding: '4px 8px', borderRadius: 6, border: '1px solid var(--bd)', background: 'var(--iv)' }}
          >
            <div style={{ width: 24, height: 24, borderRadius: '50%', overflow: 'hidden', background: 'var(--ivd)', flexShrink: 0, position: 'relative' }}>
              {cs.members?.photo_url ? (
                <Image src={cs.members.photo_url} alt={cs.members.name ?? ''} fill style={{ objectFit: 'cover' }} sizes="24px" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--t3)' }}>
                  {cs.members?.name?.slice(0, 1)}
                </div>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--t1)' }}>{cs.members?.name}</span>
          </Link>
        ))}
      </div>
      {overflow > 0 && (
        <p style={{ fontSize: 12, color: 'var(--t3)' }}>외 {overflow}명</p>
      )}
    </div>
  )
}
