import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const RATE_LIMIT = 5      // 요청 허용 횟수
const WINDOW_SEC = 60     // 윈도우 (초)

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

export async function POST(req: Request) {
  const redis = getRedis()
  if (redis) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    const key = `subscribe:${ip}`
    const count = await redis.incr(key)
    if (count === 1) await redis.expire(key, WINDOW_SEC)
    if (count > RATE_LIMIT) {
      return NextResponse.json({ error: '잠시 후 다시 시도해주세요.' }, { status: 429 })
    }
  }

  let email: string
  try {
    const body = await req.json()
    email = body.email
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: '올바른 이메일 주소를 입력해주세요.' }, { status: 400 })
  }

  const pubId = process.env.BEEHIIV_PUBLICATION_ID
  const apiKey = process.env.BEEHIIV_API_KEY

  if (!pubId || !apiKey) {
    return NextResponse.json({ error: '구독 서비스를 준비 중입니다. 잠시 후 다시 시도해주세요.' }, { status: 503 })
  }

  const res = await fetch(`https://api.beehiiv.com/v2/publications/${pubId}/subscriptions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, reactivate_existing: true, send_welcome_email: true }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: '구독 신청에 실패했습니다. 다시 시도해주세요.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
