import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const maxDuration = 300

const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL = 'https://open.assembly.go.kr/portal/openapi'

const RESULT_MAP: Record<string, string> = {
  '원안가결': '가결', '수정가결': '수정가결',
  '부결': '부결', '폐기': '폐기', '무효': '무효',
}
const STANCE_MAP: Record<string, string> = {
  '찬성': '찬성', '반대': '반대', '기권': '기권', '불참': '불참', '결석': '불참',
}

// Vercel cron secret 검증
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // 어제 날짜
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const since = yesterday.toISOString().slice(0, 10).replace(/-/g, '')

  try {
    // 1. 표결 목록 수집 (60초 하드 타임아웃)
    const votesRaw = await Promise.race([
      fetchVotes(since),
      new Promise<[]>(resolve => setTimeout(() => resolve([]), 60000)),
    ])
    const votes = votesRaw.filter(Boolean) as NonNullable<Awaited<ReturnType<typeof fetchVotes>>[number]>[]
    if (votes.length > 0) {
      await upsertInBatches(supabase, 'votes', votes, 'id')
    }

    // 2. 의원별 표결 수집 (member_votes에 없는 vote_id만)
    const voteIds = votes.map(v => v!.id)
    let newVoteIds = voteIds
    if (voteIds.length > 0) {
      const { data: existing } = await supabase
        .from('member_votes')
        .select('vote_id')
        .in('vote_id', voteIds)
      const existingVoteIds = new Set((existing ?? []).map((r: { vote_id: string }) => r.vote_id))
      newVoteIds = voteIds.filter(id => !existingVoteIds.has(id))
    }
    if (newVoteIds.length > 0) {
      const memberRows = await fetchMemberVotes(newVoteIds)
      if (memberRows.length > 0) {
        const validIds = await getValidMemberIds(supabase)
        const filtered = memberRows.filter(r => validIds.has(r.member_id))
        if (filtered.length > 0) {
          await upsertInBatches(supabase, 'member_votes', filtered, 'vote_id,member_id')
        }

        // votes.absent_count를 member_votes 기반으로 역산하여 업데이트
        const absentCounts = filtered
          .filter(r => r.stance === '불참')
          .reduce((acc, r) => {
            acc[r.vote_id] = (acc[r.vote_id] ?? 0) + 1
            return acc
          }, {} as Record<string, number>)
        for (const [vote_id, count] of Object.entries(absentCounts)) {
          await supabase.from('votes').update({ absent_count: count }).eq('id', vote_id)
        }
      }
    }

    // 3. votes에 result가 있는데 bills 테이블에 없는 bill 자동 삽입 (대안·정부안 등)
    const RESULT_TO_STATUS: Record<string, string> = {
      '가결': '가결', '수정가결': '수정가결', '부결': '부결', '폐기': '폐기',
    }
    const votedBills = votes.filter(v => v && v.result && RESULT_TO_STATUS[v.result])
    if (votedBills.length > 0) {
      const { data: existing } = await supabase
        .from('bills')
        .select('id, passed_at, content_url')
        .in('id', votedBills.map(v => v!.id))
      const existingMap = new Map((existing ?? []).map((b: { id: string; passed_at: string | null; content_url: string | null }) => [b.id, b]))
      const newBills = votedBills
        .filter(v => !existingMap.has(v!.id))
        .map(v => ({
          id: v!.id,
          title: (v!.title ?? '').replace(/\s*\([^)]+\)\s*$/, '').trim() || v!.title,
          status: RESULT_TO_STATUS[v!.result!],
          passed_at: v!.voted_at ? v!.voted_at.slice(0, 10) : null,
          content_url: v!.link_url ?? null,
        }))
      if (newBills.length > 0) {
        await upsertInBatches(supabase, 'bills', newBills, 'id')
      }
      // 기존 bill 중 passed_at 또는 content_url이 null인 것 배치 upsert
      const toFix = votedBills
        .filter(v => existingMap.has(v!.id))
        .map(v => {
          const ex = existingMap.get(v!.id)!
          return {
            id: v!.id,
            ...((!ex.passed_at && v!.voted_at) ? { passed_at: v!.voted_at.slice(0, 10) } : {}),
            ...((!ex.content_url && v!.link_url) ? { content_url: v!.link_url } : {}),
          }
        })
        .filter(r => Object.keys(r).length > 1)
      if (toFix.length > 0) {
        await upsertInBatches(supabase, 'bills', toFix, 'id')
      }
    }

    // sync_log 기록
    await supabase.from('sync_log').upsert(
      { key: 'votes', synced_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

    return NextResponse.json({
      ok: true,
      votes: votes.length,
      since,
    })
  } catch (err) {
    console.error('[cron/sync-votes]', err)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}

async function fetchVotes(since: string) {
  const rows: object[] = []
  let page = 1
  while (page <= 20) {
    const params = new URLSearchParams({
      KEY: ASSEMBLY_API_KEY, Type: 'json', AGE: '22',
      pIndex: String(page), pSize: '100', LAW_PROC_DT: since,
    })
    const res = await fetch(`${BASE_URL}/nwbpacrgavhjryiph?${params}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    const wrapper = data?.nwbpacrgavhjryiph ?? []
    if (wrapper.length < 2) break
    const head = wrapper[0]?.head ?? []
    const code = head[1]?.RESULT?.CODE ?? ''
    if (!['INFO-000', 'INFO-200'].includes(code)) break
    const total = parseInt(head[0]?.list_total_count ?? '0')
    const pageRows: Record<string, string>[] = wrapper[1]?.row ?? []
    rows.push(...pageRows.map(parseVote).filter((r): r is NonNullable<ReturnType<typeof parseVote>> => r !== null))
    if (rows.length >= total || pageRows.length === 0) break
    page++
  }
  return rows as ReturnType<typeof parseVote>[]
}

function parseVote(raw: Record<string, string>) {
  const id = raw.BILL_ID
  const title = raw.BILL_NM
  if (!id || !title) return null
  const dateRaw = raw.LAW_PROC_DT ?? raw.RGS_PROC_DT ?? raw.RGS_PRESENT_DT ?? raw.PROC_DT ?? ''
  const toIso = (d: string) => d.length === 8
    ? `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6)}T00:00:00+09:00`
    : d
  const voted_at = dateRaw ? toIso(dateRaw) : null
  const resultRaw = raw.PROC_RESULT_CD ?? ''
  const result = Object.entries(RESULT_MAP).find(([k]) => resultRaw.includes(k))?.[1] ?? null
  return {
    id, bill_id: id, title, voted_at, result,
    yes_count: parseInt(raw.YES_TCNT ?? '0') || 0,
    no_count: parseInt(raw.NO_TCNT ?? '0') || 0,
    abstain_count: parseInt(raw.BLANK_TCNT ?? '0') || 0,
    absent_count: 0,
    link_url: raw.LINK_URL || null,
  }
}

async function fetchMemberVotes(voteIds: string[]) {
  const rows: { vote_id: string; member_id: string; stance: string }[] = []
  for (const vid of voteIds) {
    const params = new URLSearchParams({
      KEY: ASSEMBLY_API_KEY, Type: 'json', AGE: '22',
      BILL_ID: vid, pIndex: '1', pSize: '300',
    })
    const res = await fetch(`${BASE_URL}/nojepdqqaweusdfbi?${params}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    const wrapper = data?.nojepdqqaweusdfbi ?? []
    if (wrapper.length < 2) continue
    const pageRows: Record<string, string>[] = wrapper[1]?.row ?? []
    for (const r of pageRows) {
      const stance = STANCE_MAP[r.RESULT_VOTE_MOD ?? '']
      if (r.BILL_ID && r.MONA_CD && stance) {
        rows.push({ vote_id: r.BILL_ID, member_id: r.MONA_CD, stance })
      }
    }
  }
  return rows
}

async function getValidMemberIds(supabase: SupabaseClient) {
  const { data } = await supabase.from('members').select('id')
  return new Set((data ?? []).map((m: { id: string }) => m.id))
}

async function upsertInBatches(
  supabase: SupabaseClient,
  table: string,
  rows: object[],
  onConflict: string,
) {
  for (let i = 0; i < rows.length; i += 100) {
    await supabase.from(table).upsert(rows.slice(i, i + 100), { onConflict })
  }
}
