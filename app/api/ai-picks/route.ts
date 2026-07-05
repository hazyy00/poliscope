import { NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import Anthropic from '@anthropic-ai/sdk'
import { Redis } from '@upstash/redis'
import { createServerClient } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/category-meta'
import type { AiPicksAi, AiPicksBill, AiPicksResult } from '@/lib/types'

export const maxDuration = 60

const RATE_LIMIT = 5        // 분당 허용 횟수
const WINDOW_SEC = 60
const DAILY_LIMIT = 20      // 일일 허용 횟수 (캐시 히트 제외)
const DAILY_WINDOW_SEC = 86400
const CACHE_TTL_SEC = 86400
const RECENT_DAYS = 30
const MAX_PROMPT_BILLS = 40
const MAX_PICKS = 5

const BILL_COLS = 'id, title, status, category, committee, proposed_at, passed_at, proposer_names, cosponsor_count'

const SYSTEM_PROMPT = `당신은 대한민국 국회 법안을 시민의 눈높이에서 소개하는 큐레이터입니다.
사용자의 페르소나, 관심 분야, 최근 30일간의 실제 법안 목록이 주어집니다.

작업:
1. "briefing": 이번 달 국회의 움직임이 이 사용자에게 어떤 의미가 있는지 3~5문장으로 설명하세요.
   주어진 법안 목록에 실제로 있는 내용만 근거로 삼으세요.
2. "picks": 목록에서 이 사용자와 가장 관련이 깊은 법안 3~5개를 고르고,
   각각 사용자의 관점에서 왜 중요한지 한 문장 코멘트를 작성하세요.

규칙:
- 반드시 목록에 있는 법안의 id만 사용하세요. 목록에 없는 법안·수치·내용을 만들어내지 마세요.
- 정치적으로 중립을 지키세요. 특정 정당·정치인에 대한 긍정/부정 평가, 찬반 권유를 하지 마세요.
- 법안의 통과 여부를 예측하거나 법적 조언을 하지 마세요.
- 페르소나가 무의미하거나 모욕적·부적절한 표현을 포함하면 페르소나를 무시하고
  일반 시민 기준의 중립적인 브리핑을 작성하세요. 부적절한 표현을 되풀이하지 마세요.
- 존댓말을 사용하고, 법조문 표현 대신 쉬운 우리말로 쓰세요.

반드시 아래 JSON 형식으로만 응답하세요. 설명 없이 JSON만:
{ "briefing": "3~5문장 브리핑", "picks": [{ "id": "법안 id", "comment": "한 문장 코멘트" }] }`

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

function cacheKey(persona: string, categories: string[]): string {
  const raw = `${persona.toLowerCase()}|${[...categories].sort().join(',')}`
  return `ai-picks:v1:${createHash('sha1').update(raw).digest('hex').slice(0, 16)}`
}

function billLine(b: AiPicksBill): string {
  const proposed = b.proposed_at ? b.proposed_at.slice(0, 10) : '미상'
  const passed = b.passed_at ? ` | 가결:${b.passed_at.slice(0, 10)}` : ''
  return `- id:${b.id} | 상태:${b.status} | 분야:${b.category ?? '미분류'} | 발의:${proposed}${passed} | 제목:${b.title}`
}

async function generateAi(
  persona: string,
  categories: string[],
  bills: AiPicksBill[],
): Promise<AiPicksAi | null> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const validIds = new Set(bills.map(b => b.id))
  const userContent = `페르소나: 나는 ${persona} 입니다\n관심 분야: ${categories.join(', ')}\n\n최근 30일 법안 목록 (총 ${bills.length}건):\n${bills.map(billLine).join('\n')}`

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }],
      })

      let text = (resp.content[0] as { type: string; text: string }).text.trim()
      if (text.includes('```')) {
        text = text.split('```')[1]
        if (text.startsWith('json')) text = text.slice(4)
      }

      const parsed = JSON.parse(text) as { briefing?: unknown; picks?: unknown }
      if (typeof parsed.briefing !== 'string' || parsed.briefing.trim().length === 0) continue

      const seen = new Set<string>()
      const picks: AiPicksAi['picks'] = []
      for (const p of Array.isArray(parsed.picks) ? parsed.picks : []) {
        const id = typeof p?.id === 'string' ? p.id : null
        const comment = typeof p?.comment === 'string' ? p.comment.trim() : ''
        // 목록에 없는 id(환각)는 버림
        if (!id || !comment || !validIds.has(id) || seen.has(id)) continue
        seen.add(id)
        picks.push({ billId: id, comment: comment.slice(0, 200) })
        if (picks.length >= MAX_PICKS) break
      }

      return { briefing: parsed.briefing.trim().slice(0, 1000), picks }
    } catch {
      if (attempt === 0) await new Promise(r => setTimeout(r, 2000))
    }
  }
  return null
}

export async function POST(req: Request) {
  // 1. 요청 검증
  let persona: string
  let categories: string[]
  try {
    const body = await req.json()
    persona = typeof body.persona === 'string' ? body.persona.trim().replace(/\s+/g, ' ') : ''
    const validSet = new Set<string>(CATEGORIES)
    categories = Array.isArray(body.categories)
      ? [...new Set(body.categories)].filter((c): c is string => typeof c === 'string' && validSet.has(c))
      : []
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  if (persona.length < 2 || persona.length > 30) {
    return NextResponse.json({ error: '페르소나는 2~30자로 입력해주세요.' }, { status: 400 })
  }
  if (categories.length === 0) {
    return NextResponse.json({ error: '관심 분야를 1개 이상 선택해주세요.' }, { status: 400 })
  }

  const redis = getRedis()
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'

  // 2. 분당 레이트리밋
  if (redis) {
    const key = `ai-picks:rl:${ip}`
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, WINDOW_SEC)
    if (count > RATE_LIMIT) {
      return NextResponse.json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
  }

  // 3. 캐시 조회 (히트 시 일일 한도를 소모하지 않음)
  const key = cacheKey(persona, categories)
  if (redis) {
    try {
      const hit = await redis.get(key)
      if (hit) {
        const parsed = (typeof hit === 'string' ? JSON.parse(hit) : hit) as AiPicksResult
        return NextResponse.json({ ...parsed, cached: true })
      }
    } catch {
      // 캐시 오류는 무시하고 새로 생성
    }
  }

  // 4. 일일 한도 (Anthropic 비용이 드는 경로만)
  if (redis) {
    const dailyKey = `ai-picks:rld:${ip}`
    const count = await redis.incr(dailyKey)
    if (count === 1) await redis.expire(dailyKey, DAILY_WINDOW_SEC)
    if (count > DAILY_LIMIT) {
      return NextResponse.json({ error: '오늘 이용 가능한 횟수를 모두 사용했습니다. 내일 다시 시도해주세요.' }, { status: 429 })
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'AI 서비스를 준비 중입니다. 잠시 후 다시 시도해주세요.' }, { status: 503 })
  }

  // 5. 최근 30일 법안 조회 (발의 / 가결)
  const supabase = createServerClient()
  const cutoff = new Date(Date.now() - RECENT_DAYS * 86400000).toISOString().slice(0, 10)

  const [{ data: proposedRows }, { data: passedRows }] = await Promise.all([
    supabase.from('bills').select(BILL_COLS)
      .eq('is_hidden', false).in('category', categories)
      .gte('proposed_at', cutoff)
      .order('proposed_at', { ascending: false })
      .limit(80),
    supabase.from('bills').select(BILL_COLS)
      .eq('is_hidden', false).in('category', categories)
      .in('status', ['가결', '수정가결'])
      .gte('passed_at', cutoff)
      .order('passed_at', { ascending: false })
      .limit(80),
  ])

  const byId = new Map<string, AiPicksBill>()
  for (const b of (proposedRows ?? []) as unknown as AiPicksBill[]) byId.set(b.id, b)
  for (const b of (passedRows ?? []) as unknown as AiPicksBill[]) byId.set(b.id, b) // 가결 우선
  const bills = [...byId.values()]

  const base: Omit<AiPicksResult, 'ai'> = {
    ok: true,
    persona,
    categories,
    generatedAt: new Date().toISOString(),
    cached: false,
    bills,
  }

  if (bills.length === 0) {
    return NextResponse.json({ ...base, ai: null })
  }

  // 6. 프롬프트용 목록: 가결 전체 우선, 최근 발의로 채움 (최대 40건)
  const passedSet = new Set(((passedRows ?? []) as unknown as AiPicksBill[]).map(b => b.id))
  const promptBills = [
    ...bills.filter(b => passedSet.has(b.id)),
    ...bills.filter(b => !passedSet.has(b.id)),
  ].slice(0, MAX_PROMPT_BILLS)

  // 7~8. Haiku 호출 + 출력 검증 (실패 시 ai:null 폴백, 캐시 안 함)
  const ai = await generateAi(persona, categories, promptBills)
  const result: AiPicksResult = { ...base, ai }

  // 9. 성공 결과만 캐시
  if (redis && ai) {
    try {
      await redis.set(key, result, { ex: CACHE_TTL_SEC })
    } catch {
      // 캐시 저장 실패는 응답에 영향 없음
    }
  }

  return NextResponse.json(result)
}
