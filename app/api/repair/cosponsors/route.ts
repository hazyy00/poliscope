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

  const url = new URL(req.url)
  const fromPage = parseInt(url.searchParams.get('from') ?? '1')

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  // 처음 실행 시 기존 데이터 전부 삭제
  if (fromPage === 1) {
    await supabase.from('bill_cosponsors').delete().neq('bill_id', '')
  }

  const rows: { bill_id: string; member_id: string }[] = []
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
    const pageRows: Record<string, string>[] = wrapper[1]?.row ?? []

    for (const row of pageRows) {
      if (!row.BILL_ID || !row.PUBL_MONA_CD) continue
      const memberIds = row.PUBL_MONA_CD.split(',').map((s: string) => s.trim()).filter(Boolean)
      for (const memberId of memberIds) {
        rows.push({ bill_id: row.BILL_ID, member_id: memberId })
      }
    }

    if (pageRows.length === 0 || page >= totalApiPages) break
    // Batch in chunks of 50 pages to avoid timeout
    if (page - fromPage >= 49) break
    page++
  }

  // bills, members 테이블에 있는 ID만 필터 (FK constraints)
  const allBillIds = new Set<string>()
  let bFrom = 0
  while (true) {
    const { data: bData } = await supabase.from('bills').select('id').range(bFrom, bFrom + 999)
    if (!bData || bData.length === 0) break
    for (const b of bData) allBillIds.add(b.id)
    if (bData.length < 1000) break
    bFrom += 1000
  }

  const allMemberIds = new Set<string>()
  let mFrom = 0
  while (true) {
    const { data: mData } = await supabase.from('members').select('id').range(mFrom, mFrom + 999)
    if (!mData || mData.length === 0) break
    for (const m of mData) allMemberIds.add(m.id)
    if (mData.length < 1000) break
    mFrom += 1000
  }

  const filtered = rows.filter(r => allBillIds.has(r.bill_id) && allMemberIds.has(r.member_id))

  // Insert into bill_cosponsors
  let inserted = 0
  let firstError: string | null = null
  for (let i = 0; i < filtered.length; i += 500) {
    const { error } = await supabase
      .from('bill_cosponsors')
      .insert(filtered.slice(i, i + 500))
    if (error) { if (!firstError) firstError = error.message; break }
    inserted += Math.min(500, filtered.length - i)
  }

  return NextResponse.json({
    ok: !firstError,
    pagesProcessed: page - fromPage + 1,
    nextFrom: page < totalApiPages ? page + 1 : null,
    totalApiPages,
    cosponsors: rows.length,
    filtered: filtered.length,
    inserted,
    error: firstError,
  })
}
