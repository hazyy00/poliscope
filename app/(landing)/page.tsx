import { createServerClient } from '@/lib/supabase'
import { LandingClient } from './LandingClient'

export default async function LandingPage() {
  const supabase = createServerClient()

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfLastWeek = new Date(startOfWeek)
  startOfLastWeek.setDate(startOfWeek.getDate() - 7)

  const [
    { count: billsCount },
    { count: membersCount },
    { count: votesCount },
    { count: passedCount },
    { data: latestVote },
    { data: latestVoteTime },
    { data: aiConfRow },
    { count: thisWeekCount },
    { count: lastWeekCount },
    { data: weeklyBills },
  ] = await Promise.all([
    supabase.from('bills').select('*', { count: 'exact', head: true }).eq('is_hidden', false),
    supabase.from('members').select('*', { count: 'exact', head: true }),
    supabase.from('votes').select('*', { count: 'exact', head: true }),
    supabase.from('votes').select('*', { count: 'exact', head: true }).eq('result', '가결'),
    supabase.from('votes').select('id, title, result').not('result', 'is', null).order('voted_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('sync_log').select('synced_at').eq('key', 'votes').maybeSingle(),
    supabase.from('bills').select('ai_confidence').not('ai_confidence', 'is', null).limit(500),
    supabase.from('bills').select('*', { count: 'exact', head: true }).eq('is_hidden', false).not('passed_at', 'is', null).gte('passed_at', startOfWeek.toISOString()),
    supabase.from('bills').select('*', { count: 'exact', head: true }).eq('is_hidden', false).not('passed_at', 'is', null).gte('passed_at', startOfLastWeek.toISOString()).lt('passed_at', startOfWeek.toISOString()),
    supabase.from('bills').select('proposer_id').eq('is_hidden', false).not('proposer_id', 'is', null).order('proposed_at', { ascending: false }).limit(300),
  ])

  const totalVotes = votesCount ?? 0
  const passedVotes = passedCount ?? 0

  // 데이터 신선도
  const syncAgo = (() => {
    if (!latestVoteTime?.synced_at) return null
    const diff = now.getTime() - new Date(latestVoteTime.synced_at).getTime()
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h 전`
    return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m 전`
  })()

  // AI 신뢰도 평균
  const avgAi = (() => {
    if (!aiConfRow || aiConfRow.length === 0) return null
    const vals = aiConfRow.map((r: { ai_confidence: number }) => r.ai_confidence).filter(Boolean)
    if (vals.length === 0) return null
    return (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(2)
  })()

  const thisWeek = thisWeekCount ?? 0
  const lastWeek = lastWeekCount ?? 0
  const weekDiff = thisWeek - lastWeek

  // 최근 300건 기준 발의 상위 3명
  const billCountById: Record<string, number> = {}
  for (const bill of weeklyBills ?? []) {
    const id = (bill as { proposer_id: string }).proposer_id
    billCountById[id] = (billCountById[id] ?? 0) + 1
  }
  const top3Ids = Object.entries(billCountById)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id)

  const { data: topMemberRows } = top3Ids.length > 0
    ? await supabase.from('members').select('id, name, district, party').in('id', top3Ids)
    : { data: [] }

  const topMembers = top3Ids
    .map(id => {
      const m = (topMemberRows ?? []).find(r => r.id === id)
      if (!m) return null
      return { id: m.id, name: m.name, district: m.district ?? '', party: m.party ?? '', count: billCountById[id] }
    })
    .filter(Boolean) as { id: string; name: string; district: string; party: string; count: number }[]

  return (
    <LandingClient
      stats={{
        bills: billsCount ?? 0,
        members: membersCount ?? 0,
        votes: totalVotes,
        passedRate: totalVotes > 0 ? Math.round(passedVotes / totalVotes * 100) : 0,
        latestVote: latestVote ?? null,
        syncAgo,
        avgAi,
        thisWeek,
        weekDiff,
        topMembers,
      }}
    />
  )
}
