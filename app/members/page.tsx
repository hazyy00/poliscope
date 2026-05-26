import { createServerClient } from '@/lib/supabase'
import { MemberListClient } from '@/components/members/MemberListClient'
import { fetchAllBillStats, aggregateBillStats, computePartyAverages } from '@/lib/bill-stats'
import type { EnrichedMember } from '@/components/members/BenchmarkCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '의원 | PoliScope',
  description: '22대 국회 286명 의원의 발의·표결·주요 분야를 한 화면에서.',
  openGraph: {
    title: '의원 | PoliScope',
    description: '22대 국회 286명 의원의 발의·표결·주요 분야를 한 화면에서.',
  },
}

export default async function MembersPage() {
  const supabase = createServerClient()

  const [membersRes, allBills] = await Promise.all([
    supabase
      .from('members')
      .select('id, name, party, district, is_pr, photo_url, committee, term')
      .order('name'),
    fetchAllBillStats(supabase),
  ])

  const rawMembers = membersRes.data ?? []
  const billStatsMap = aggregateBillStats(allBills)
  const partyAverages = computePartyAverages(rawMembers, billStatsMap)

  const enriched: EnrichedMember[] = rawMembers.map(m => {
    const stats = billStatsMap[m.id] ?? { total: 0, passed: 0, passRate: 0, topCommittees: [] }
    return {
      ...m,
      billsCount: stats.total,
      passRate: stats.passRate,
      topCommittees: stats.topCommittees,
    }
  })

  const maxBills = Math.max(...enriched.map(m => m.billsCount), 1)
  const billsBarMax = Math.ceil(maxBills / 20) * 20

  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 80px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>

        {/* Page title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8, marginTop: 28 }}>
          <h1 style={{
            margin: 0, fontFamily: 'var(--font-display)', fontSize: 56,
            lineHeight: 1.0, fontWeight: 700, letterSpacing: '-0.02em',
            color: 'var(--m-ink)',
          }}>
            국회의원
          </h1>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--m-muted)', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>전체</div>
            <div style={{ fontSize: 28, fontWeight: 500, fontFamily: 'var(--font-display)', color: 'var(--m-ink)' }}>
              {enriched.length}<span style={{ fontSize: 14, color: 'var(--m-muted)', marginLeft: 2 }}>명</span>
            </div>
          </div>
        </div>
        <p style={{ fontSize: 14, color: 'var(--m-ink-soft)', lineHeight: 1.6, maxWidth: 560, marginBottom: 36 }}>
          286명 의원의 발의·표결·주요 분야를 한 화면에서. 원문 그대로. 좌도 우도 아닌, 데이터만.
        </p>

        <MemberListClient
          members={enriched}
          partyAverages={partyAverages}
          billsBarMax={billsBarMax}
          totalAssembly={enriched.length}
        />
      </div>
    </main>
  )
}
