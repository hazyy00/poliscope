import { createServerClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { cache } from 'react'
import type { Metadata } from 'next'
import type { CareerEntry } from '@/lib/types'
import { partyColor, partyDot, partyTone, termLabel } from '@/lib/party-colors'
import { PARTY_ROLES } from '@/lib/party-roles'
import { CompareBar } from '@/components/members/CompareBar'
import { DetailTabs } from '@/components/members/DetailTabs'
import { fetchAllBillStats, aggregateBillStats, computePartyAverages } from '@/lib/bill-stats'

const MEMBER_COLS = 'id, name, name_en, party, district, is_pr, photo_url, committee, term, career, sns, contact_email, contact_phone, contact_office, contact_homepage' as const

async function fetchAllMemberVotes(supabase: ReturnType<typeof createServerClient>, memberId: string) {
  const { count } = await supabase
    .from('member_votes')
    .select('*', { count: 'exact', head: true })
    .eq('member_id', memberId)

  if (!count) return []

  const pages = Math.ceil(count / 1000)
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      supabase
        .from('member_votes')
        .select('stance, vote_id, votes(id, title, voted_at, result)')
        .eq('member_id', memberId)
        .order('voted_at', { referencedTable: 'votes', ascending: false })
        .range(i * 1000, i * 1000 + 999)
    )
  )
  return results.flatMap(r => r.data ?? [])
}

const getMember = cache(async (id: string) => {
  const supabase = createServerClient()
  return supabase.from('members').select(MEMBER_COLS).eq('id', id).single()
})

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getMember(id)
  if (!data) return { title: '의원 | PoliScope' }
  return {
    title: `${data.name} (${data.party ?? '무소속'}) | PoliScope`,
    description: `${data.party ?? '무소속'} · ${data.district ?? '비례대표'} · 발의·표결 기록`,
  }
}

export default async function MemberDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab: tabParam } = await searchParams
  const tab = tabParam ?? 'voting'
  const supabase = createServerClient()

  const [memberRes, billsRes, votes, allBillStats, allMembersRes] = await Promise.all([
    getMember(id),
    supabase
      .from('bills')
      .select('id, title, status, proposed_at, committee, category, cosponsor_count')
      .eq('proposer_id', id)
      .order('proposed_at', { ascending: false }),
    fetchAllMemberVotes(supabase, id),
    fetchAllBillStats(supabase),
    supabase.from('members').select('id, party'),
  ])

  if (!memberRes.data) notFound()
  const member = memberRes.data as typeof memberRes.data & {
    career: CareerEntry[] | null
    sns: Record<string, string> | null
    contact_email: string | null
    contact_phone: string | null
    contact_office: string | null
    contact_homepage: string | null
    term: number | null
  }
  const bills = billsRes.data ?? []
  const allMembers = allMembersRes.data ?? []

  // Bill stats for this member (from bills tab — exact count)
  const billsCount = bills.length
  const passedCount = bills.filter(b => b.status === '가결' || b.status === '수정가결').length
  const passRate = billsCount > 0 ? Math.round((passedCount / billsCount) * 100) : 0

  // Party averages (full dataset via paginated fetch)
  const billStatsMap = aggregateBillStats(allBillStats)
  const partyAverages = computePartyAverages(allMembers, billStatsMap)

  const myParty = member.party ?? '무소속'
  const myPartyAvg = partyAverages[myParty] ?? { avgBills: 0, avgPassRate: 0 }
  const avgBills = myPartyAvg.avgBills
  const avgPassRate = myPartyAvg.avgPassRate

  const maxBills = Math.max(...Object.values(billStatsMap).map(s => s.total), 1)
  const billsBarMax = Math.ceil(maxBills / 20) * 20

  // Voting stats
  const voteCounts = { yes: 0, no: 0, abstain: 0, missed: 0 }
  for (const v of votes) {
    if (v.stance === '찬성') voteCounts.yes++
    else if (v.stance === '반대') voteCounts.no++
    else if (v.stance === '기권') voteCounts.abstain++
    else if (v.stance === '불참') voteCounts.missed++
  }
  const totalVotes = votes.length

  // Policy areas — from actual proposed bills' category distribution
  const categoryCounts: Record<string, number> = {}
  for (const bill of bills) {
    if (bill.category) {
      categoryCounts[bill.category] = (categoryCounts[bill.category] ?? 0) + 1
    }
  }
  const totalWithCategory = Object.values(categoryCounts).reduce((s, v) => s + v, 0)
  const topCommittees = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({
      name,
      label: name,
      pct: totalWithCategory > 0 ? Math.round((count / totalWithCategory) * 100) : 0,
    }))

  const career = member.career ?? []

  // SNS
  const SNS_LABELS: Record<string, string> = { twitter: 'X', facebook: 'f', instagram: 'IG', youtube: 'YT' }
  const snsList = Object.entries(member.sns ?? {}).map(([kind, handle]) => ({
    kind: SNS_LABELS[kind] ?? kind,
    handle: String(handle),
  }))

  const color = partyColor(member.party)
  const dot = partyDot(member.party)
  const soft = partyTone(member.party)
  const termStr = termLabel(member.term)
  const partyRole = PARTY_ROLES[member.id]

  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', paddingBottom: 80 }}>
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '80px 48px 0' }}>

        {/* Breadcrumb */}
        <div style={{ fontSize: 12, color: 'var(--m-muted)', marginBottom: 28 }}>
          <Link href="/members" style={{ color: 'var(--m-muted)', textDecoration: 'none' }}>
            ‹ 의원 목록으로
          </Link>
        </div>

        {/* Profile header — 3 col */}
        <div style={{
          display: 'grid', gridTemplateColumns: '220px 1fr 320px', gap: 36,
          alignItems: 'flex-start', paddingBottom: 32, borderBottom: '1px solid var(--m-faint)',
          marginBottom: 28,
        }}>
          {/* Left: photo + ID */}
          <div>
            <div style={{
              width: 220, height: 220, overflow: 'hidden',
              background: soft, position: 'relative', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {member.photo_url ? (
                <Image
                  src={member.photo_url}
                  alt={member.name}
                  fill
                  style={{ objectFit: 'cover', objectPosition: 'top center' }}
                  sizes="220px"
                />
              ) : (
                <>
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `repeating-linear-gradient(45deg, ${dot}18 0 6px, transparent 6px 14px)`,
                  }} />
                  <span style={{
                    position: 'relative', fontFamily: 'var(--font-display)',
                    fontSize: 90, color, fontWeight: 700, opacity: 0.85,
                  }}>
                    {member.name.slice(0, 1)}
                  </span>
                </>
              )}
            </div>
            <div style={{
              marginTop: 10, fontSize: 10, color: 'var(--m-muted)',
              fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
            }}>
              ID · {member.id.toUpperCase()}
            </div>
          </div>

          {/* Center: identity + bio */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
              <h1 style={{
                margin: 0, fontFamily: 'var(--font-display)', fontSize: 64,
                fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1,
                color: 'var(--m-ink)',
              }}>
                {member.name}
              </h1>
              {termStr && (
                <span style={{
                  fontFamily: 'var(--font-display)', fontStyle: 'italic',
                  fontSize: 24, color: 'var(--m-muted)', fontWeight: 400,
                }}>
                  {termStr}
                </span>
              )}
              {partyRole && (
                <span style={{
                  fontSize: 13, color, background: soft,
                  padding: '4px 12px', fontWeight: 700,
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                  alignSelf: 'center',
                }}>
                  {partyRole}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', fontSize: 12, color, background: soft,
                borderRadius: 999, fontWeight: 500, whiteSpace: 'nowrap',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: dot, display: 'inline-block' }} />
                {member.party ?? '무소속'}
              </span>
              <span style={{ color: 'var(--m-muted)', fontSize: 13 }}>·</span>
              <span style={{ fontSize: 14, color: 'var(--m-ink-soft)' }}>
                {member.is_pr ? '비례대표' : (member.district ?? '')}
              </span>
            </div>
            <div style={{ marginBottom: 22 }}>
              <a
                href={`https://www.assembly.go.kr/members/22nd/${(member.name_en ?? '').replace(/\s+/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', border: '1px solid var(--m-ink)',
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--m-ink)', textDecoration: 'none',
                  letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  fontWeight: 500,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="3.5" r="2" stroke="currentColor" strokeWidth="0.8"/>
                  <path d="M1.5 9c0-1.933 1.567-3.5 3.5-3.5S8.5 7.067 8.5 9" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
                </svg>
                국회 의원 페이지
              </a>
            </div>

            {/* Bio rows */}
            <div style={{
              display: 'grid', gridTemplateColumns: '90px 1fr',
              rowGap: 11, columnGap: 16,
              fontSize: 13, color: 'var(--m-ink-soft)', lineHeight: 1.5,
            }}>
              {/* 위원회 */}
              {member.committee && member.committee.length > 0 && (
                <>
                  <div style={{
                    color: 'var(--m-muted)', fontFamily: 'var(--font-mono)',
                    fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', paddingTop: 4,
                  }}>위원회</div>
                  <div>{member.committee.join(' · ')}</div>
                </>
              )}
            </div>
          </div>

          {/* Right: contact card */}
          <div style={{ background: 'var(--m-panel)', padding: '20px 22px', border: '1px solid var(--m-faint)' }}>
            <div style={{
              fontSize: 10, color: 'var(--m-muted)', fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em', marginBottom: 14,
            }}>
              CONTACT
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {member.contact_email && (
                <div>
                  <div style={{
                    color: 'var(--m-muted)', fontFamily: 'var(--font-mono)',
                    fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3,
                  }}>이메일</div>
                  <span style={{ color: 'var(--m-ink-soft)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {member.contact_email}
                  </span>
                </div>
              )}
              {(member.contact_office || member.contact_phone) && (
                <div>
                  <div style={{
                    color: 'var(--m-muted)', fontFamily: 'var(--font-mono)',
                    fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3,
                  }}>사무실</div>
                  <span style={{ color: 'var(--m-ink-soft)', fontSize: 12 }}>
                    {[member.contact_office, member.contact_phone].filter(Boolean).join(' · ')}
                  </span>
                </div>
              )}
              {member.contact_homepage && (
                <div>
                  <div style={{
                    color: 'var(--m-muted)', fontFamily: 'var(--font-mono)',
                    fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3,
                  }}>홈페이지</div>
                  <a
                    href={member.contact_homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: 'var(--m-accent)', fontFamily: 'var(--font-mono)', fontSize: 11,
                      textDecoration: 'none', borderBottom: '1px dotted var(--m-accent)',
                      wordBreak: 'break-all',
                    }}
                  >
                    {member.contact_homepage.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            {!member.contact_email && !member.contact_phone && !member.contact_office && !member.contact_homepage && (
              <div style={{ fontSize: 13, color: 'var(--m-muted)' }}>연락처 정보 없음</div>
            )}
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12, marginBottom: 36 }}>
          {/* 발의 법안 KPI */}
          <KPICard
            label="발의 법안"
            value={billsCount}
            unit="건"
            avg={avgBills}
            max={billsBarMax}
            color={color}
            party={myParty}
          />
          {/* 가결율 KPI */}
          <KPICard
            label="법안 가결율"
            value={passRate}
            unit="%"
            avg={avgPassRate}
            max={100}
            color={color}
            party={myParty}
          />
          {/* Policy areas — from actual bills */}
          <div style={{ background: 'var(--m-panel)', padding: '20px 24px', border: '1px solid var(--m-faint)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{
                fontSize: 11, color: 'var(--m-muted)', fontFamily: 'var(--font-mono)',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>주요 분야</span>
              <span style={{ fontSize: 10.5, color: 'var(--m-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>
                발의 법안 기반
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
              {topCommittees.length > 0 ? topCommittees.map((tc, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: i === 0 ? '8px 14px' : '7px 13px',
                  fontSize: i === 0 ? 15 : 13,
                  fontFamily: 'var(--font-display)',
                  fontWeight: i === 0 ? 600 : 500,
                  letterSpacing: '-0.01em',
                  color: i === 0 ? '#fff' : 'var(--m-ink-soft)',
                  background: i === 0 ? color : 'var(--iv)',
                  border: i === 0 ? 'none' : '1px solid var(--m-faint)',
                }}>
                  {tc.label}
                  <span style={{ opacity: 0.65, fontSize: i === 0 ? 12 : 11, fontFamily: 'var(--font-mono)', fontWeight: 400 }}>
                    {tc.pct}%
                  </span>
                </span>
              )) : (
                <span style={{ fontSize: 13, color: 'var(--m-muted)' }}>분야 정보 없음</span>
              )}
            </div>
            {topCommittees.length > 0 && (
              <div style={{
                fontSize: 11, color: 'var(--m-muted)', fontFamily: 'var(--font-mono)',
                letterSpacing: '0.02em',
              }}>
                총 {billsCount}건 발의 · 위원회별 분포
              </div>
            )}
          </div>
        </div>

        {/* Tabs + content */}
        <DetailTabs
          memberId={id}
          activeTab={tab}
          bills={bills as BillRow[]}
          votes={votes as unknown as VoteRow[]}
          voteCounts={voteCounts}
          totalVotes={totalVotes}
          career={career}
          partyColor={color}
          crossParty={0}
        />
      </div>
    </main>
  )
}

function KPICard({
  label, value, unit, avg, max, color, party
}: {
  label: string; value: number; unit: string; avg: number; max: number; color: string; party: string
}) {
  const diff = value - avg
  const sign = diff > 0 ? '+' : ''
  const deltaColor = Math.abs(diff) < 2 ? 'var(--m-muted)' : diff > 0 ? 'var(--성공)' : 'var(--위험)'

  return (
    <div style={{ background: 'var(--m-panel)', padding: '20px 22px', border: '1px solid var(--m-faint)' }}>
      <div style={{
        fontSize: 11, color: 'var(--m-muted)', fontFamily: 'var(--font-mono)',
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14,
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
        <span style={{
          fontFamily: 'var(--font-display)', fontSize: 48,
          fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--m-ink)',
        }}>
          {value}
        </span>
        <span style={{ fontSize: 16, color: 'var(--m-muted)', fontWeight: 400 }}>{unit}</span>
        <span style={{
          marginLeft: 'auto', fontSize: 11, color: deltaColor, fontFamily: 'var(--font-mono)',
        }}>
          {sign}{diff}{unit}
        </span>
      </div>
      <CompareBar label="" value={value} avg={avg} max={max} color={color} unit={unit} />
      <div style={{ marginTop: 7, fontSize: 10.5, color: 'var(--m-muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
        {party} 평균 <span style={{ color: 'var(--m-ink-soft)' }}>{avg}{unit}</span>
      </div>
    </div>
  )
}

// These types are passed to client component
export interface BillRow {
  id: string
  title: string
  status: string | null
  proposed_at: string | null
  committee: string | null
  category: string | null
  cosponsor_count?: number | null
}

export interface VoteRow {
  stance: string
  vote_id: string
  votes: { id: string; title: string; voted_at: string | null; result: string | null } | null
}
