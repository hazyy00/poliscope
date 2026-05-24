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

  const STATUS_TARGETS = ['가결', '수정가결', '부결', '폐기']

  // passed_at 또는 content_url이 null인 법안 수집
  const { data: bills } = await supabase
    .from('bills')
    .select('id, passed_at, content_url')
    .in('status', STATUS_TARGETS)
    .or('passed_at.is.null,content_url.is.null')
    .eq('is_hidden', false)

  if (!bills || bills.length === 0) {
    return NextResponse.json({ ok: true, updated: 0 })
  }

  let updated = 0
  let failed = 0

  // 1st pass: Assembly 외부 API에서 LAW_PROC_DT / LINK_URL 수집
  for (const bill of bills) {
    try {
      const params = new URLSearchParams({
        KEY: ASSEMBLY_API_KEY, Type: 'json', AGE: '22',
        pIndex: '1', pSize: '1', BILL_ID: bill.id,
      })
      const res = await fetch(`${BASE_URL}/nwbpacrgavhjryiph?${params}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      })
      const data = await res.json()
      const wrapper = data?.nwbpacrgavhjryiph ?? []
      if (wrapper.length < 2) continue
      const row: Record<string, string> = wrapper[1]?.row?.[0]
      if (!row) continue

      const updates: Record<string, string> = {}

      const rawDate = row.LAW_PROC_DT || row.RGS_PROC_DT || row.RGS_PRESENT_DT || row.PROC_DT || ''
      if (!bill.passed_at && rawDate) {
        const d = rawDate.trim()
        updates.passed_at = d.length === 8
          ? `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6)}`
          : d
      }
      if (!bill.content_url && row.LINK_URL) {
        updates.content_url = row.LINK_URL
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('bills').update(updates).eq('id', bill.id)
        updated++
      }
    } catch (err) {
      console.error('[repair/bills] bill.id:', bill.id, err)
      failed++
    }
  }

  // 2nd pass: 외부 API에서 날짜를 못 얻은 법안 → votes 테이블 voted_at 활용
  const { data: stillNull } = await supabase
    .from('bills')
    .select('id')
    .in('status', STATUS_TARGETS)
    .is('passed_at', null)
    .eq('is_hidden', false)

  for (const bill of stillNull ?? []) {
    const { data: vote } = await supabase
      .from('votes')
      .select('voted_at')
      .eq('bill_id', bill.id)
      .not('voted_at', 'is', null)
      .order('voted_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (vote?.voted_at) {
      await supabase
        .from('bills')
        .update({ passed_at: (vote.voted_at as string).slice(0, 10) })
        .eq('id', bill.id)
      updated++
    }
  }

  // 3rd pass: ARC_ 법안 중 아직 null → LIKMS HTML에서 의결일자 파싱
  const { data: arcNull } = await supabase
    .from('bills')
    .select('id')
    .in('status', STATUS_TARGETS)
    .is('passed_at', null)
    .like('id', 'ARC_%')
    .eq('is_hidden', false)

  for (const bill of arcNull ?? []) {
    try {
      const html = await fetch(
        `https://likms.assembly.go.kr/bill/billDetail.do?billId=${bill.id}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      ).then(r => r.text())

      const m = html.match(/의결일자[\s\S]{1,150}?(\d{4}-\d{2}-\d{2})/)
      if (m) {
        await supabase.from('bills').update({ passed_at: m[1] }).eq('id', bill.id)
        updated++
      }
    } catch (err) {
      console.error('[repair/bills] ARC_ LIKMS scrape failed:', bill.id, err)
      failed++
    }
  }

  return NextResponse.json({ ok: true, total: bills.length, updated, failed })
}
