import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL = 'https://open.assembly.go.kr/portal/openapi'

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // proposer_id가 null인 법안 ID 수집 (ARC_ 제외) — 전체 페이지네이션
  const allBills: { id: string }[] = []
  let from = 0
  while (true) {
    const { data } = await supabase
      .from('bills')
      .select('id')
      .is('proposer_id', null)
      .not('id', 'like', 'ARC_%')
      .eq('is_hidden', false)
      .range(from, from + 999)
    if (!data || data.length === 0) break
    allBills.push(...data)
    if (data.length < 1000) break
    from += 1000
  }
  const bills = allBills

  if (!bills || bills.length === 0) {
    return NextResponse.json({ ok: true, updated: 0 })
  }

  const nullIds = new Set(bills.map(b => b.id))

  // bills API 전체 fetch → BILL_ID : RST_MONA_CD 매핑
  const idToProposer = new Map<string, string>()
  let page = 1
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
    const rows: Record<string, string>[] = wrapper[1]?.row ?? []
    for (const row of rows) {
      if (row.BILL_ID && row.RST_MONA_CD && nullIds.has(row.BILL_ID)) {
        idToProposer.set(row.BILL_ID, row.RST_MONA_CD)
      }
    }
    if (rows.length === 0 || page * 100 >= total) break
    page++
  }

  // proposer_id별로 그룹핑해서 배치 업데이트
  const byProposer = new Map<string, string[]>()
  for (const [billId, proposerId] of idToProposer) {
    if (!byProposer.has(proposerId)) byProposer.set(proposerId, [])
    byProposer.get(proposerId)!.push(billId)
  }

  let updated = 0
  for (const [proposerId, billIds] of byProposer) {
    for (let i = 0; i < billIds.length; i += 200) {
      await supabase.from('bills')
        .update({ proposer_id: proposerId })
        .in('id', billIds.slice(i, i + 200))
      updated += Math.min(200, billIds.length - i)
    }
  }

  return NextResponse.json({ ok: true, total: bills.length, fetched: idToProposer.size, updated })
}
