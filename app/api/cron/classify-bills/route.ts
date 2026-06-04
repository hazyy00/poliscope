import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase'

export const maxDuration = 300

const CATEGORIES = [
  '경제/재정', '과학/IT', '보건/복지', '교육', '환경/노동',
  '국방/외교', '교통/건설', '문화/체육', '농업/해양', '정치/법률',
] as const

const SYSTEM_PROMPT = `당신은 대한민국 국회 법안을 분야별로 분류하는 전문가입니다.
주어진 법안 제목을 보고 아래 10개 분야 중 가장 적합한 하나를 선택하세요.

분야 목록:
- 경제/재정
- 과학/IT
- 보건/복지
- 교육
- 환경/노동
- 국방/외교
- 교통/건설
- 문화/체육
- 농업/해양
- 정치/법률

분야 선택 기준:
- 경제/재정: 세금, 예산, 금융, 보험, 무역, 기업, 소상공인 관련
- 과학/IT: 정보통신, AI, 방송, 디지털, 우주, 연구개발 관련
- 보건/복지: 의료, 건강, 복지, 사회보장, 장애인, 노인 관련
- 교육: 학교, 대학, 학생, 교육과정, 유아 관련
- 환경/노동: 기후, 환경오염, 근로, 노동조합, 안전 관련
- 국방/외교: 군사, 방위, 외교, 조약, 국가안보 관련
- 교통/건설: 도로, 철도, 항공, 해운, 건축, 부동산 관련
- 문화/체육: 문화예술, 체육, 관광, 저작권, 한류 관련
- 농업/해양: 농업, 축산, 수산, 임업, 식품 관련
- 정치/법률: 선거, 국회, 행정, 사법, 공무원, 지방자치 관련

응답은 반드시 JSON 형식으로만 하세요. 설명 없이 JSON만:
{"법안ID": "분야명", ...}`

const BATCH_SIZE = 30

type Bill = { id: string; title: string; committee: string | null }

async function classifyBatch(
  client: Anthropic,
  batch: Bill[],
): Promise<Record<string, string>> {
  const payload: Record<string, string> = {}
  for (const b of batch) payload[b.id] = b.title

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `다음 법안들을 분류해주세요:\n${JSON.stringify(payload, null, 0)}`,
        }],
      })

      let text = (resp.content[0] as { type: string; text: string }).text.trim()
      if (text.includes('```')) {
        text = text.split('```')[1]
        if (text.startsWith('json')) text = text.slice(4)
      }

      const parsed = JSON.parse(text) as Record<string, string>
      const validSet = new Set<string>(CATEGORIES)
      return Object.fromEntries(
        Object.entries(parsed).filter(([, v]) => validSet.has(v))
      )
    } catch {
      if (attempt === 0) await new Promise(r => setTimeout(r, 2000))
    }
  }
  return {}
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServerClient()
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // Fetch all NULL-category bills (paginated by 1000)
  const allBills: Bill[] = []
  let offset = 0
  while (true) {
    const { data } = await supabase
      .from('bills')
      .select('id, title, committee')
      .eq('is_hidden', false)
      .is('category', null)
      .range(offset, offset + 999)

    const rows = data ?? []
    allBills.push(...rows)
    if (rows.length < 1000) break
    offset += 1000
  }

  if (allBills.length === 0) {
    return NextResponse.json({ ok: true, classified: 0 })
  }

  // Classify in batches of 30
  const batches: Bill[][] = []
  for (let i = 0; i < allBills.length; i += BATCH_SIZE) {
    batches.push(allBills.slice(i, i + BATCH_SIZE))
  }

  const results: Record<string, string> = {}
  for (const batch of batches) {
    const batchResult = await classifyBatch(anthropic, batch)
    Object.assign(results, batchResult)
  }

  // Group by category and batch-update
  const byCategory: Record<string, string[]> = {}
  for (const [id, cat] of Object.entries(results)) {
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(id)
  }

  let saved = 0
  for (const [cat, ids] of Object.entries(byCategory)) {
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500)
      await supabase.from('bills').update({ category: cat }).in('id', chunk)
      saved += chunk.length
    }
  }

  await supabase.from('sync_log').upsert({ key: 'classify-bills', synced_at: new Date().toISOString() })

  return NextResponse.json({ ok: true, classified: saved })
}
