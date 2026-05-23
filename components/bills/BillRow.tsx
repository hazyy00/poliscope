import Link from 'next/link'
import { formatDateShort } from '@/lib/utils'

interface VoteData {
  yes_count: number
  no_count: number
  abstain_count: number
  absent_count: number
  voted_at: string | null
}

interface Props {
  id: string
  title: string
  status: string
  committee: string | null
  proposed_at: string | null
  proposer_name: string | null
  proposer_party: string | null
  vote?: VoteData
  today: string
}

const STATUS_STYLE: Record<string, { color: string; bg: string }> = {
  '계류':    { color: 'var(--st-pend)', bg: 'var(--st-pend-bg)' },
  '가결':    { color: 'var(--st-pass)', bg: 'var(--st-pass-bg)' },
  '수정가결': { color: 'var(--st-pass)', bg: 'var(--st-pass-bg)' },
  '부결':    { color: 'var(--st-fail)', bg: 'var(--st-fail-bg)' },
  '폐기':    { color: 'var(--st-drop)', bg: 'var(--st-drop-bg)' },
  '철회':    { color: 'var(--st-drop)', bg: 'var(--st-drop-bg)' },
}

export function BillRow({ id, title, status, committee, proposed_at, proposer_name, proposer_party, vote, today }: Props) {
  const st = STATUS_STYLE[status] ?? { color: 'var(--t3)', bg: 'var(--ivd)' }

  const todayMs = new Date(today).getTime()
  const proposedMs = proposed_at ? new Date(proposed_at).getTime() : null
  const days = proposedMs ? Math.floor((todayMs - proposedMs) / 86400000) : 0

  const shortTitle = title.length > 70 ? title.slice(0, 70) + '…' : title
  const shortCommittee = committee ? (committee.length > 12 ? committee.slice(0, 12) + '…' : committee) : null

  const metaParts = [
    `#${id.slice(-6)}`,
    proposer_name,
    shortCommittee ? `${shortCommittee}위원회` : null,
  ].filter(Boolean)

  return (
    <Link
      href={`/bills/${id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '110px 1fr 280px 110px',
        gap: 24,
        padding: '20px 14px 20px 6px',
        borderBottom: '0.5px solid var(--bd)',
        textDecoration: 'none',
        color: 'inherit',
        alignItems: 'center',
      }}
      className="bill-row-grid"
    >
      {/* Col 1: Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 11,
          padding: '4px 10px',
          color: st.color,
          background: st.bg,
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}>
          {status}
        </span>
      </div>

      {/* Col 2: Title + meta */}
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 17,
          fontWeight: 400,
          color: 'var(--t1)',
          letterSpacing: '-0.015em',
          lineHeight: 1.3,
          marginBottom: 6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {shortTitle}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)',
          overflow: 'hidden', whiteSpace: 'nowrap',
        }}>
          {metaParts.map((part, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {i > 0 && <span style={{ width: 1, height: 9, background: 'var(--bd)', display: 'inline-block' }} />}
              <span style={i === 2 ? { color: 'var(--pu)' } : undefined}>{part}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Col 3: Vote bar or pending gauge */}
      <div className="bill-row-vote-col">
        {vote ? (
          <VoteBar vote={vote} />
        ) : status === '계류' ? (
          <PendingGauge days={days} />
        ) : null}
      </div>

      {/* Col 4: Date */}
      <div className="bill-row-date-col" style={{ textAlign: 'right' }}>
        {vote?.voted_at ? (
          <>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--t1)' }}>
              {formatDateShort(vote.voted_at)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.04em', marginTop: 3 }}>표결</div>
          </>
        ) : proposed_at ? (
          <>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--t1)' }}>
              {formatDateShort(proposed_at)}
            </div>
            <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.04em', marginTop: 3 }}>발의</div>
          </>
        ) : null}
      </div>
    </Link>
  )
}

function VoteBar({ vote }: { vote: VoteData }) {
  const total = (vote.yes_count ?? 0) + (vote.no_count ?? 0) + (vote.abstain_count ?? 0) + (vote.absent_count ?? 0)
  if (total === 0) return null

  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`

  return (
    <div>
      <div style={{ display: 'flex', height: 6, gap: 1, marginBottom: 7 }}>
        {vote.yes_count > 0 && <div style={{ width: pct(vote.yes_count), background: 'var(--pu)' }} />}
        {vote.no_count > 0 && <div style={{ width: pct(vote.no_count), background: 'var(--st-fail)' }} />}
        {vote.abstain_count > 0 && <div style={{ width: pct(vote.abstain_count), background: 'rgba(138,132,120,0.55)' }} />}
        {vote.absent_count > 0 && <div style={{ width: pct(vote.absent_count), background: 'rgba(26,25,22,.08)' }} />}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        <span><span style={{ color: 'var(--t3)', fontSize: 10 }}>찬 </span><span style={{ color: 'var(--pu)' }}>{vote.yes_count}</span></span>
        <span><span style={{ color: 'var(--t3)', fontSize: 10 }}>반 </span><span style={{ color: 'var(--st-fail)' }}>{vote.no_count}</span></span>
        <span><span style={{ color: 'var(--t3)', fontSize: 10 }}>기 </span><span style={{ color: 'var(--t1)' }}>{vote.abstain_count}</span></span>
        {vote.absent_count > 0 && <span style={{ color: 'var(--t3)', fontSize: 10 }}>· 불참 {vote.absent_count}</span>}
      </div>
    </div>
  )
}

function PendingGauge({ days }: { days: number }) {
  const MAX_DAYS = 365
  const fillPct = Math.min(days / MAX_DAYS, 1) * 100
  const markerPct = (90 / MAX_DAYS) * 100

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--st-pend)' }}>D+{days}</span>
        <span style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '0.04em' }}>계류 중</span>
      </div>
      <div style={{ position: 'relative', height: 4, background: 'rgba(26,25,22,.06)' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${fillPct}%`,
          background: 'var(--st-pend)', opacity: 0.55,
        }} />
        <div style={{
          position: 'absolute', left: `${markerPct}%`, top: -2, bottom: -2,
          width: 1, background: 'var(--t3)', opacity: 0.4,
        }} />
      </div>
    </div>
  )
}
