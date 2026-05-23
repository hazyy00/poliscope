import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL = 'https://open.assembly.go.kr/portal/openapi'

function parseCosponsorCount(proposer: string | null | undefined, rstMonaCd: string | null | undefined): number {
  if (!proposer) return 0
  const m = proposer.match(/등\s*(\d+)인/)
  if (!m) return 0
  const total = parseInt(m[1])
  const leaderCount = rstMonaCd ? rstMonaCd.split(',').filter(Boolean).length : 1
  return total - leaderCount
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const fromPage = parseInt(url.searchParams.get('from') ?? '1')

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // API에서 PROPOSER, RST_PROPOSER, RST_MONA_CD 수집
  const updates: { id: string; cosponsor_count: number; proposer_names: string | null; proposer_id: string | null }[] = []
  let page = fromPage
  let totalApiPages = 0

  while (true) {
    const params = new URLSearchParams({
      KEY: ASSEMBLY_API_KEY, Type: 'json', AGE: '22',
      pIndex: String(page), pSize: '100',
    })
    const res = await fetch(`${BASE_URL}/nzmimeepazxkubdpn?${params}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    const data = await res.json()
    const wrapper = data?.nzmimeepazxkubdpn ?? []
    if (wrapper.length < 2) break
    const head = wrapper[0]?.head ?? []
    const code = head[1]?.RESULT?.CODE ?? ''
    if (!['INFO-000', 'INFO-200'].includes(code)) break
    const total = parseInt(head[0]?.list_total_count ?? '0')
    totalApiPages = Math.ceil(total / 100)
    const rows: Record<string, string>[] = wrapper[1]?.row ?? []

    for (const row of rows) {
      if (!row.BILL_ID) continue
      updates.push({
        id: row.BILL_ID,
        cosponsor_count: parseCosponsorCount(row.PROPOSER, row.RST_MONA_CD),
        proposer_names: row.RST_PROPOSER || null,
        proposer_id: row.RST_MONA_CD?.split(',')[0]?.trim() || null,
      })
    }

    if (rows.length === 0 || page >= totalApiPages) break
    if (page - fromPage >= 49) break
    page++
  }

  // (proposer_id, proposer_names, cosponsor_count) 조합별로 그룹핑 → 배치 update
  type UpdateKey = string
  const byKey = new Map<UpdateKey, { proposer_id: string | null; proposer_names: string | null; cosponsor_count: number; ids: string[] }>()
  for (const u of updates) {
    const key = `${u.proposer_id}||${u.proposer_names}||${u.cosponsor_count}`
    if (!byKey.has(key)) byKey.set(key, { proposer_id: u.proposer_id, proposer_names: u.proposer_names, cosponsor_count: u.cosponsor_count, ids: [] })
    byKey.get(key)!.ids.push(u.id)
  }

  let updated = 0
  for (const { proposer_id, proposer_names, cosponsor_count, ids } of byKey.values()) {
    for (let i = 0; i < ids.length; i += 200) {
      await supabase.from('bills')
        .update({ proposer_id, proposer_names, cosponsor_count })
        .in('id', ids.slice(i, i + 200))
      updated += Math.min(200, ids.length - i)
    }
  }

  return NextResponse.json({
    ok: true,
    pagesProcessed: page - fromPage + 1,
    nextFrom: page < totalApiPages ? page + 1 : null,
    totalApiPages,
    updated,
  })
}
