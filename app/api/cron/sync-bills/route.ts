import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ASSEMBLY_API_KEY = process.env.ASSEMBLY_API_KEY!
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL = 'https://open.assembly.go.kr/portal/openapi'

// collect_bills.py의 STATUS_MAP과 동일
const STATUS_MAP: Record<string, string> = {
  '원안가결': '가결',
  '수정가결': '수정가결',
  '부결': '부결',
  '폐기': '폐기',
  '철회': '철회',
  '계류': '계류',
  '임기만료폐기': '폐기',
  '대안반영폐기': '폐기',
  '본회의불부의': '폐기',
}

function normalizeStatus(raw: string | null | undefined): string {
  if (!raw) return '계류'
  for (const [key, mapped] of Object.entries(STATUS_MAP)) {
    if (raw.includes(key)) return mapped
  }
  return '계류'
}

function normalizeDate(raw: string | null | undefined): string | null {
  if (!raw || raw.length < 8) return null
  const v = raw.trim()
  if (v.length === 8 && /^\d+$/.test(v)) return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6)}`
  return v
}

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(req.url)
  const full = url.searchParams.get('full') === 'true'

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const since = yesterday.toISOString().slice(0, 10).replace(/-/g, '')

  try {
    const rows = await fetchBills(full ? undefined : since)

    const bills = rows
      .map((raw: Record<string, string>) => {
        const id = raw.BILL_ID || raw.BILL_NO
        const title = raw.BILL_NM || raw.BILL_NAME
        if (!id || !title) return null
        return {
          id,
          title,
          status: normalizeStatus(raw.PROC_RESULT || raw.PROC_RESULT_CD),
          committee: raw.COMMITTEE || raw.CURR_COMMITTEE || null,
          proposer_id: raw.MONA_CD || null,
          proposed_at: normalizeDate(raw.PROPOSE_DT),
          passed_at: normalizeDate(raw.PROC_DT) || null,
          content_url: raw.LINK_URL || raw.DETAIL_LINK || null,
        }
      })
      .filter((b): b is NonNullable<typeof b> => b !== null)

    for (let i = 0; i < bills.length; i += 100) {
      await supabase.from('bills').upsert(bills.slice(i, i + 100), { onConflict: 'id' })
    }

    await supabase.from('sync_log').upsert(
      { key: 'bills', synced_at: new Date().toISOString() },
      { onConflict: 'key' }
    )

    return NextResponse.json({ ok: true, bills: bills.length, since: full ? 'full' : since })
  } catch (err) {
    console.error('[cron/sync-bills]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

async function fetchBills(since?: string): Promise<Record<string, string>[]> {
  const rows: Record<string, string>[] = []
  let page = 1
  while (true) {
    const params = new URLSearchParams({
      KEY: ASSEMBLY_API_KEY, Type: 'json', AGE: '22',
      pIndex: String(page), pSize: '100',
      ...(since ? { PROPOSE_DT: since } : {}),
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
    const pageRows: Record<string, string>[] = wrapper[1]?.row ?? []
    rows.push(...pageRows)
    if (rows.length >= total || pageRows.length === 0) break
    page++
  }
  return rows
}
