import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: bill } = await supabase
    .from('bills')
    .select('report_count')
    .eq('id', id)
    .single()

  if (!bill) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const newCount = (bill.report_count ?? 0) + 1
  await supabase
    .from('bills')
    .update({ report_count: newCount, ...(newCount >= 5 ? { is_hidden: true } : {}) })
    .eq('id', id)

  return NextResponse.json({ ok: true })
}
