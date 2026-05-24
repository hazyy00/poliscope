import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'
import { scrapeBillText } from '@/lib/scrape-bill'

const SYSTEM_PROMPT = `당신은 대한민국 국회 법안을 시민이 이해하기 쉽게 요약하는 전문가입니다.

규칙:
1. 원문에 없는 숫자, 고유명사, 인용문을 생성하지 마세요.
2. 불확실한 내용은 "원문에서 확인되지 않음"으로 명시하세요.
3. 요약은 2~4문장 평문으로, 법조문 없이 작성하세요.
4. key_points는 3~5개 핵심 변경사항을 간결하게 나열하세요.
5. source_spans는 요약의 근거가 된 원문 구절을 그대로 인용하세요 (최대 3개).

반드시 아래 JSON 형식으로만 응답하세요. 설명 없이 JSON만:
{
  "summary": "법안 내용을 2~4문장으로 요약",
  "key_points": ["핵심 포인트 1", "핵심 포인트 2"],
  "source_spans": ["원문 인용 구절 1", "원문 인용 구절 2"]
}`

const BATCH_SIZE = 20
const CONCURRENCY = 5

type BillRow = { id: string; title: string; committee: string | null; content_url: string | null }

async function summarizeBill(
  client: Anthropic,
  bill: BillRow,
  sourceText: string,
): Promise<{ summary: string; key_points: string[]; source_spans: string[] } | null> {
  const userContent = `법안 제목: ${bill.title}\n위원회: ${bill.committee ?? '미상'}\n\n제안이유 및 주요내용:\n${sourceText}`

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      })

      let text = (resp.content[0] as { type: string; text: string }).text.trim()
      if (text.includes('```')) {
        text = text.split('```')[1]
        if (text.startsWith('json')) text = text.slice(4)
      }

      const parsed = JSON.parse(text)
      if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.key_points)) return null
      return {
        summary: parsed.summary,
        key_points: parsed.key_points,
        source_spans: Array.isArray(parsed.source_spans) ? parsed.source_spans : [],
      }
    } catch {
      if (attempt === 0) await new Promise(r => setTimeout(r, 2000))
    }
  }
  return null
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // 가결 법안 중 ai_summary가 없는 것을 우선순위 순 BATCH_SIZE건 조회
  const { data: bills } = await supabase
    .from('bills')
    .select('id, title, committee, content_url')
    .eq('is_hidden', false)
    .in('status', ['가결', '수정가결'])
    .is('ai_summary', null)
    .not('content_url', 'is', null)
    .order('passed_at', { ascending: false })
    .limit(BATCH_SIZE)

  if (!bills || bills.length === 0) {
    return NextResponse.json({ ok: true, generated: 0, skipped: 0 })
  }

  let generated = 0
  let skipped = 0

  // CONCURRENCY개씩 병렬 처리
  for (let i = 0; i < bills.length; i += CONCURRENCY) {
    const chunk = bills.slice(i, i + CONCURRENCY) as BillRow[]

    await Promise.all(chunk.map(async (bill) => {
      const sourceText = await scrapeBillText(bill.content_url!)

      if (!sourceText) {
        // 스크래핑 실패 → ai_summary에 sentinel 저장 (반복 시도 방지)
        await supabase.from('bills').update({
          ai_summary: JSON.stringify({ summary: '', key_points: [], source_spans: [], _no_source: true }),
          ai_summary_at: new Date().toISOString(),
        }).eq('id', bill.id)
        skipped++
        return
      }

      const result = await summarizeBill(anthropic, bill, sourceText)
      if (!result) { skipped++; return }

      await supabase.from('bills').update({
        ai_summary: JSON.stringify(result),
        ai_summary_at: new Date().toISOString(),
        ai_confidence: null,
      }).eq('id', bill.id)
      generated++
    }))
  }

  await supabase.from('sync_log').upsert({ key: 'generate-summaries', synced_at: new Date().toISOString() })

  return NextResponse.json({ ok: true, generated, skipped })
}
