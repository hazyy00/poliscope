import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PartyBadge } from '@/components/ui/PartyBadge'

interface Props {
  id: string
  title: string
  status: string
  committee: string | null
  proposed_at: string | null
  summary_short: string | null
  proposer_name: string | null
  proposer_party: string | null
}

export function BillCard({ id, title, status, committee, proposed_at, summary_short, proposer_name, proposer_party }: Props) {
  return (
    <Link
      href={`/bills/${id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '16px 0',
        borderBottom: '1px solid var(--bd)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <StatusBadge status={status} size="sm" />
        {committee && (
          <span style={{ fontSize: 11, color: 'var(--t3)' }}>{committee}</span>
        )}
        {proposed_at && (
          <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 'auto' }}>
            {proposed_at.slice(0, 10)}
          </span>
        )}
      </div>

      <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--t1)', lineHeight: 1.4 }}>
        {title.length > 80 ? title.slice(0, 80) + '…' : title}
      </div>

      {summary_short && (
        <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>
          {summary_short.length > 120 ? summary_short.slice(0, 120) + '…' : summary_short}
        </div>
      )}

      {proposer_name && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--t3)' }}>발의:</span>
          <span style={{ fontSize: 12, color: 'var(--t2)', fontWeight: 500 }}>{proposer_name}</span>
          <PartyBadge party={proposer_party} size="sm" />
        </div>
      )}
    </Link>
  )
}
