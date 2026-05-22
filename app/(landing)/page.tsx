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
      }}
    />
  )
}
