import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI 요약 방식 | PoliScope',
  description: 'PoliScope AI 요약이 어떻게 생성되는지 알아보세요.',
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 40 }}>
    <h2 style={{
      fontFamily: 'var(--font-serif)', fontWeight: 400, fontSize: 22,
      letterSpacing: '-0.015em', color: 'var(--t1)', margin: '0 0 14px',
      paddingBottom: 10, borderBottom: '0.5px solid var(--bd)',
    }}>{title}</h2>
    {children}
  </section>
)

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--t2)', margin: '0 0 10px', fontWeight: 300 }}>
    {children}
  </p>
)

export default function AiGuidePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 80px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link
          href="/bills"
          style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          법안 목록으로
        </Link>

        <h1 style={{
          fontFamily: 'var(--font-serif)', fontWeight: 300,
          fontSize: 42, margin: '0 0 8px', letterSpacing: '-0.03em',
          color: 'var(--t1)',
        }}>
          AI 요약 방식
        </h1>
        <p style={{ fontSize: 14, color: 'var(--t3)', margin: '0 0 48px', fontWeight: 300 }}>
          법안 요약이 어떻게 만들어지는지 설명합니다.
        </p>

        <Section title="요약 생성 방식">
          <P>
            PoliScope는 국회 의안정보시스템(LIKMS)에서 각 법안의 <strong>제안이유 및 주요내용</strong> 원문을 가져와,
            Anthropic의 <strong>Claude Haiku</strong> 모델로 2~4문장 요약을 생성합니다.
          </P>
          <P>
            요약은 매일 자동으로 생성되며, 가결(원안가결·수정가결)된 법안을 우선으로 처리합니다.
            원문을 가져올 수 없는 법안은 요약이 제공되지 않습니다.
          </P>
        </Section>

        <Section title="생성 원칙">
          <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              '원문에 없는 숫자, 고유명사, 인용문은 생성하지 않습니다.',
              '불확실한 내용은 "원문에서 확인되지 않음"으로 명시합니다.',
              '핵심 포인트와 함께 원문 근거 구절을 함께 제공합니다.',
              'AI 생성 요약은 법적 판단의 근거가 될 수 없습니다.',
            ].map((item, i) => (
              <li key={i} style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.7, fontWeight: 300 }}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section title="한계 및 주의사항">
          <P>
            AI 요약은 원문을 기반으로 하지만, 법률 용어의 해석이나 맥락에 따라 의미가 달라질 수 있습니다.
            중요한 내용은 반드시 원문을 직접 확인하세요.
          </P>
          <P>
            요약 내용이 잘못되었거나 오해의 소지가 있다고 판단되면 법안 상세 페이지 하단의
            <strong> "이 요약이 틀렸어요"</strong> 버튼으로 신고해 주세요.
            신고가 일정 기준 이상 누적되면 해당 요약은 자동으로 숨겨지고 재검토됩니다.
          </P>
        </Section>

        <div style={{
          padding: '16px 20px', border: '0.5px solid var(--bd)',
          background: 'var(--ivd)', fontSize: 12, color: 'var(--t3)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.03em',
        }}>
          모델: claude-haiku-4-5-20251001 · 원문: LIKMS (likms.assembly.go.kr)
        </div>
      </div>
    </main>
  )
}
