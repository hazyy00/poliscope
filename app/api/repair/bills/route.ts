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

  // passed_at 또는 content_url이 null인 가결/수정가결 법안 수집
  const { data: bills } = await supabase
    .from('bills')
    .select('id, passed_at, content_url')
    .in('status', ['가결', '수정가결'])
    .or('passed_at.is.null,content_url.is.null')
    .eq('is_hidden', false)

  if (!bills || bills.length === 0) {
    return NextResponse.json({ ok: true, updated: 0 })
  }

  let updated = 0
  let failed = 0

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

      if (!bill.passed_at && row.LAW_PROC_DT) {
        const d = row.LAW_PROC_DT
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
    } catch {
      failed++
    }
  }

  return NextResponse.json({ ok: true, total: bills.length, updated, failed })
}
