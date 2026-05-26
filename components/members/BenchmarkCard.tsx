'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { CompareBar } from './CompareBar'
import { partyColor, partyDot, partyTone, termLabel } from '@/lib/party-colors'
import { PARTY_ROLES } from '@/lib/party-roles'
import type { TopCommittee } from '@/lib/bill-stats'

export interface EnrichedMember {
  id: string
  name: string
  party: string | null
  district: string | null
  is_pr: boolean
  photo_url: string | null
  committee: string[] | null
  term: number | null
  billsCount: number
  passRate: number
  topCommittees: TopCommittee[]
}

interface PartyAverage {
  avgBills: number
  avgPassRate: number
}

interface BenchmarkCardProps {
  member: EnrichedMember
  partyAvg: PartyAverage
  billsBarMax: number
}

function MemberPhotoPlaceholder({ name, party, size }: { name: string; party: string | null; size: number }) {
  const soft = partyTone(party)
  const color = partyColor(party)
  const initial = name.slice(0, 1)
  return (
    <div style={{
      width: size, height: size, borderRadius: 6, overflow: 'hidden',
      background: soft, position: 'relative', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(45deg, ${partyDot(party)}18 0 6px, transparent 6px 14px)`,
      }} />
      <span style={{
        position: 'relative', fontFamily: 'var(--font-display)',
        fontSize: size * 0.42, color, fontWeight: 700,
        letterSpacing: '-0.02em', opacity: 0.85,
      }}>{initial}</span>
    </div>
  )
}

export function BenchmarkCard({ member, partyAvg, billsBarMax }: BenchmarkCardProps) {
  const router = useRouter()
  const color = partyColor(member.party)
  const dot = partyDot(member.party)
  const soft = partyTone(member.party)
  const termStr = termLabel(member.term)
  const partyRole = PARTY_ROLES[member.id]

  return (
    <div
      onClick={() => router.push(`/members/${member.id}`)}
      style={{
        background: 'var(--m-panel)',
        border: '1px solid var(--m-faint)',
        padding: 16,
        cursor: 'pointer',
        transition: 'border-color .15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--m-line)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--m-faint)')}
    >
      {/* Header: photo + identity */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0 }}>
          {member.photo_url ? (
            <div style={{ width: 80, height: 80, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
              <Image
                src={member.photo_url}
                alt={member.name}
                fill
                style={{ objectFit: 'cover', objectPosition: 'top center' }}
                sizes="80px"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          ) : (
            <MemberPhotoPlaceholder name={member.name} party={member.party} size={80} />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700,
              letterSpacing: '-0.02em', lineHeight: 1.1,
            }}>
              {member.name}
            </span>
            {termStr && (
              <span style={{
                fontSize: 10, color: 'var(--m-muted)', fontFamily: 'var(--font-mono)',
                background: 'var(--iv)', padding: '2px 6px',
              }}>
                {termStr}
              </span>
            )}
            {partyRole && (
              <span style={{
                fontSize: 10, color, fontFamily: 'var(--font-mono)',
                background: soft, padding: '2px 7px', fontWeight: 600,
                letterSpacing: '0.03em',
              }}>
                {partyRole}
              </span>
            )}
          </div>
          {/* Party pill */}
          <div style={{ marginBottom: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '3px 8px', fontSize: 11,
              color, background: soft, borderRadius: 999, fontWeight: 500, whiteSpace: 'nowrap',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: dot, display: 'inline-block' }} />
              {member.party ?? '무소속'}
            </span>
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--m-muted)', lineHeight: 1.5 }}>
            {member.is_pr ? '비례대표' : member.district ?? ''}
          </div>
        </div>
      </div>

      {/* Comparison bars */}
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <CompareBar
          label="발의 법안"
          value={member.billsCount}
          avg={partyAvg.avgBills}
          max={billsBarMax}
          color={color}
          unit="건"
        />
        <CompareBar
          label="가결율"
          value={member.passRate}
          avg={partyAvg.avgPassRate}
          max={100}
          color={color}
          unit="%"
        />
      </div>

      {/* Footer: policy areas */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--m-faint)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{
            fontSize: 10, color: 'var(--m-muted)', letterSpacing: '0.06em',
            textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
          }}>
            주요 분야
          </span>
        </div>
        <PolicyAreas areas={member.topCommittees} />
      </div>
    </div>
  )
}

function PolicyAreas({ areas }: { areas: TopCommittee[] }) {
  if (!areas || areas.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
      {areas.slice(0, 3).map((area, i) => (
        <span key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, padding: '3px 8px',
          color: i === 0 ? 'var(--m-accent)' : 'var(--m-ink-soft)',
          background: i === 0 ? 'var(--m-accent-soft)' : 'transparent',
          fontWeight: i === 0 ? 500 : 400,
          letterSpacing: '-0.005em', whiteSpace: 'nowrap',
          border: i === 0 ? '1px solid transparent' : '1px solid var(--m-faint)',
        }}>
          {area.label}
          <span style={{ opacity: 0.6, fontSize: 10 }}>{area.pct}%</span>
        </span>
      ))}
    </div>
  )
}
