import { createServerClient } from '@/lib/supabase'
import { COMMITTEE_AREA } from '@/lib/party-colors'

export interface BillStat {
  proposer_id: string
  status: string
  committee?: string | null
}

export interface TopCommittee {
  name: string
  label: string
  pct: number
}

export interface MemberBillStats {
  total: number
  passed: number
  passRate: number
  topCommittees: TopCommittee[]
}

const PAGE = 1000

/**
 * Supabase PostgREST max row limit is 1000.
 * Fetch all bills in parallel pages to get correct aggregation.
 */
export async function fetchAllBillStats(
  supabase: ReturnType<typeof createServerClient>
): Promise<BillStat[]> {
  // Get total count first
  const { count } = await supabase
    .from('bills')
    .select('*', { count: 'exact', head: true })
    .not('proposer_id', 'is', null)

  if (!count) return []

  const pages = Math.ceil(count / PAGE)

  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      supabase
        .from('bills')
        .select('proposer_id, status, committee')
        .not('proposer_id', 'is', null)
        .range(i * PAGE, i * PAGE + PAGE - 1)
    )
  )

  return results.flatMap(r => r.data ?? []) as BillStat[]
}

export function aggregateBillStats(allBills: BillStat[]): Record<string, MemberBillStats> {
  const map: Record<string, { total: number; passed: number; committeeCounts: Record<string, number> }> = {}

  for (const bill of allBills) {
    if (!bill.proposer_id) continue
    if (!map[bill.proposer_id]) map[bill.proposer_id] = { total: 0, passed: 0, committeeCounts: {} }
    map[bill.proposer_id].total++
    if (bill.status === '가결' || bill.status === '수정가결') {
      map[bill.proposer_id].passed++
    }
    if (bill.committee && COMMITTEE_AREA[bill.committee]) {
      const cc = map[bill.proposer_id].committeeCounts
      cc[bill.committee] = (cc[bill.committee] ?? 0) + 1
    }
  }

  const result: Record<string, MemberBillStats> = {}
  for (const [id, { total, passed, committeeCounts }] of Object.entries(map)) {
    const topCommittees = Object.entries(committeeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({
        name,
        label: COMMITTEE_AREA[name] ?? name,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
    result[id] = {
      total,
      passed,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      topCommittees,
    }
  }
  return result
}

export function computePartyAverages(
  members: { id: string; party: string | null }[],
  billStatsMap: Record<string, MemberBillStats>
): Record<string, { avgBills: number; avgPassRate: number }> {
  const groups: Record<string, { bills: number[]; passRates: number[] }> = {}

  for (const m of members) {
    const p = m.party ?? '무소속'
    const stats = billStatsMap[m.id] ?? { total: 0, passed: 0, passRate: 0 }
    if (!groups[p]) groups[p] = { bills: [], passRates: [] }
    groups[p].bills.push(stats.total)
    groups[p].passRates.push(stats.passRate)
  }

  const result: Record<string, { avgBills: number; avgPassRate: number }> = {}
  for (const [party, { bills, passRates }] of Object.entries(groups)) {
    result[party] = {
      avgBills: bills.length > 0
        ? Math.round(bills.reduce((s, v) => s + v, 0) / bills.length)
        : 0,
      avgPassRate: passRates.length > 0
        ? Math.round(passRates.reduce((s, v) => s + v, 0) / passRates.length)
        : 0,
    }
  }
  return result
}
