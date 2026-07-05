import Link from 'next/link'
import type { Metadata } from 'next'
import { AiPicksClient } from '@/components/ai-picks/AiPicksClient'

export const metadata: Metadata = {
  title: 'AI 큐레이션 | PoliScope',
  description: '당신이 누구인지 알려주시면, 최근 30일의 국회를 당신의 눈으로 다시 보여드립니다.',
  openGraph: {
    title: 'AI 큐레이션 | PoliScope',
    description: '당신이 누구인지 알려주시면, 최근 30일의 국회를 당신의 눈으로 다시 보여드립니다.',
  },
}

export default function AiPicksPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 60px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Link
          href="/"
          style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          홈으로 돌아가기
        </Link>

        <header style={{
          marginTop: 18,
          paddingBottom: 28, borderBottom: '0.5px solid var(--bd)',
          marginBottom: 36,
        }}>
          <h1 style={{
            fontFamily: 'var(--font-pretendard)', fontWeight: 700,
            fontSize: 56, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.05,
            color: 'var(--t1)',
          }}>
            AI 큐레이션
          </h1>
          <p style={{
            margin: '14px 0 0', maxWidth: 540,
            fontSize: 14, fontWeight: 300, color: 'var(--t2)', lineHeight: 1.7,
          }}>
            당신이 누구인지 알려주시면, 최근 30일의 국회를 당신의 눈으로 다시 보여드립니다.
          </p>
        </header>

        <AiPicksClient />
      </div>
    </main>
  )
}
