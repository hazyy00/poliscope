import { NextResponse } from 'next/server'

export async function POST(req: Request) {
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
