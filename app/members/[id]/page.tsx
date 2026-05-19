import { createServerClient } from '@/lib/supabase'
import { PartyBadge } from '@/components/ui/PartyBadge'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { VotingRecord, type VoteRow } from '@/components/members/VotingRecord'
import { AttendanceChart } from '@/components/members/AttendanceChart'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { cache } from 'react'

const MEMBER_COLUMNS = 'id, name, party, district, is_pr, photo_url, committee' as const

const getMember = cache(async (id: string) => {
  const supabase = createServerClient()
  return supabase.from('members').select(MEMBER_COLUMNS).eq('id', id).single()
})

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getMember(id)
  if (!data) return { title: '의원 — PoliScope' }
  return {
    title: `${data.name} (${data.party ?? '무소속'}) — PoliScope`,
    description: `${data.party ?? '무소속'} · ${data.district ?? '비례대표'} · 발의·표결·출석 기록`,
    openGraph: {
      title: `${data.name} 의원 프로필`,
      description: `${data.party ?? '무소속'} · ${data.district ?? '비례대표'} · 발의·표결·출석 기록`,
    },
  }
}

export default async function MemberDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab: tabParam } = await searchParams
  const tab = tabParam ?? 'bills'
  const supabase = createServerClient()

  const [memberRes, billsRes, votesRes, attendanceRes] = await Promise.all([
    getMember(id),
    supabase
      .from('bills')
      .select('id, title, status, proposed_at, committee')
      .eq('proposer_id', id)
      .order('proposed_at', { ascending: false })
      .limit(20),
    supabase
      .from('member_votes')
      .select('stance, vote_id, votes(id, title, voted_at, result)')
      .eq('member_id', id)
      .order('vote_id', { ascending: false })
      .limit(30),
    supabase
      .from('attendance')
      .select('date, attended, session')
      .eq('member_id', id)
      .order('date', { ascending: false })
      .limit(200),
  ])

  if (!memberRes.data) notFound()
  const member = memberRes.data
  const bills = billsRes.data ?? []
  const votes = votesRes.data ?? []
  const attendance = attendanceRes.data ?? []

  // Compute attendance stats
  const totalDays = attendance.length
  const attendedDays = attendance.filter(a => a.attended).length
  const overallRate = totalDays > 0 ? Math.round((attendedDays / totalDays) * 100) : 0

  // Group attendance by month
  const monthMap = new Map<string, { attended: number; total: number }>()
  for (const a of attendance) {
    const month = a.date?.slice(0, 7)
    if (!month) continue
    const cur = monthMap.get(month) ?? { attended: 0, total: 0 }
    monthMap.set(month, { attended: cur.attended + (a.attended ? 1 : 0), total: cur.total + 1 })
  }
  const attendanceChartData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, { attended, total }]) => ({
      month: month.slice(2).replace('-', '.'),
      rate: Math.round((attended / total) * 100),
      attended,
      total,
    }))

  const TABS = [
    { id: 'bills', label: '발의 법안', count: bills.length },
    { id: 'votes', label: '표결 기록', count: votes.length },
    { id: 'attendance', label: '출석', count: null },
  ]

  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 80px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Link href="/members" style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}>
          ← 의원 목록
        </Link>

        {/* Profile header */}
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 32, marginBottom: 40 }}>
          <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--ivd)', aspectRatio: '3/4', position: 'relative' }}>
            {member.photo_url ? (
              <Image src={member.photo_url} alt={member.name} fill style={{ objectFit: 'cover' }} sizes="200px" />
            ) : (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'var(--t3)', fontFamily: 'var(--font-serif)' }}>
                {member.name.slice(0, 1)}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 8 }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--t1)', margin: 0 }}>
              {member.name}
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <PartyBadge party={member.party} />
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: 12, color: 'var(--t2)', border: '1px solid var(--bd)' }}>
                {member.is_pr ? '비례대표' : (member.district ?? '—')}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: 12, color: 'var(--t2)', border: '1px solid var(--bd)' }}>
                22대
              </span>
            </div>

            {member.committee && member.committee.length > 0 && (
              <div style={{ fontSize: 13, color: 'var(--t2)' }}>
                {member.committee.join(' · ')}
              </div>
            )}

            {/* Key stats */}
            <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
              {[
                { label: '발의 법안', value: `${bills.length}건` },
                { label: '출석률', value: `${overallRate}%` },
                { label: '표결 참여', value: `${votes.filter(v => v.stance !== '불참').length}건` },
              ].map(s => (
                <div key={s.label}>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--t1)' }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--bd)', marginBottom: 28 }}>
          {TABS.map(t => (
            <Link
              key={t.id}
              href={`/members/${id}?tab=${t.id}`}
              style={{
                padding: '10px 18px',
                fontSize: 14,
                textDecoration: 'none',
                color: tab === t.id ? 'var(--bk)' : 'var(--t3)',
                borderBottom: tab === t.id ? '2px solid var(--bk)' : '2px solid transparent',
                fontWeight: tab === t.id ? 600 : 400,
                marginBottom: -1,
                display: 'flex',
                gap: 6,
                alignItems: 'center',
              }}
            >
              {t.label}
              {t.count !== null && (
                <span style={{ fontSize: 11, color: 'var(--t3)', background: 'var(--ivd)', borderRadius: 10, padding: '1px 6px' }}>
                  {t.count}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'bills' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {bills.length === 0 && <p style={{ color: 'var(--t3)', fontSize: 14 }}>발의 법안이 없습니다.</p>}
            {bills.map(bill => (
              <Link key={bill.id} href={`/bills/${bill.id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--bd)', textDecoration: 'none', color: 'inherit' }}>
                <StatusBadge status={bill.status ?? '계류'} size="sm" />
                <span style={{ fontSize: 14, color: 'var(--t1)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bill.title}
                </span>
                <span style={{ flexShrink: 0, fontSize: 12, color: 'var(--t3)' }}>
                  {bill.committee ?? ''}
                </span>
                {bill.proposed_at && (
                  <span style={{ flexShrink: 0, fontSize: 12, color: 'var(--t3)' }}>
                    {bill.proposed_at.slice(0, 10)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}

        {tab === 'votes' && (
          <VotingRecord votes={votes as unknown as VoteRow[]} />
        )}

        {tab === 'attendance' && (
          <AttendanceChart data={attendanceChartData} overallRate={overallRate} />
        )}
      </div>
    </main>
  )
}
