import { PersonaTabs } from './PersonaTabs'
import type { AiSummaryJson } from '@/lib/types'

export function AISummaryPlaceholder() {
  return (
    <div style={{
      padding: '24px 28px',
      border: '0.5px solid var(--bd)', background: 'var(--ivd)',
      display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32,
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.1em', color: 'var(--pu)',
          textTransform: 'uppercase',
        }}>AI 요약</div>
        <div style={{
          fontFamily: 'var(--font-fell)', fontStyle: 'italic',
          fontSize: 13, color: 'var(--t3)', marginTop: 4,
        }}>plain-language abstract</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-serif)', fontWeight: 300, color: 'var(--t3)' }}>
          이 법안의 AI 요약이 아직 생성되지 않았습니다.
        </span>
      </div>
    </div>
  )
}

interface Props {
  summary: AiSummaryJson
  confidence: number
  contentUrl: string | null
}

export function AISummary({ summary, confidence, contentUrl }: Props) {
  return (
    <div style={{
      padding: '24px 28px',
      border: '0.5px solid var(--bd)', background: 'var(--ivd)',
      display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32,
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          letterSpacing: '0.1em', color: 'var(--pu)',
          textTransform: 'uppercase',
        }}>AI 요약</div>
        <div style={{
          fontFamily: 'var(--font-fell)', fontStyle: 'italic',
          fontSize: 13, color: 'var(--t3)', marginTop: 4,
        }}>plain-language abstract</div>
      </div>
      <div>
        <p style={{
          margin: 0, fontSize: 14, lineHeight: 1.85,
          fontFamily: 'var(--font-serif)', fontWeight: 300, color: 'var(--t1)',
          marginBottom: 12,
        }}>
          {summary.summary}
        </p>

        {summary.key_points.length > 0 && (
          <ul style={{ margin: '0 0 16px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {summary.key_points.map((pt, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>{pt}</li>
            ))}
          </ul>
        )}

        {summary.personas && (
          <div style={{ marginBottom: 16 }}>
            <PersonaTabs personas={summary.personas} />
          </div>
        )}

        <div style={{
          display: 'flex', gap: 18,
          fontSize: 11, color: 'var(--t3)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
          borderTop: '0.5px solid var(--bd)', paddingTop: 12,
        }}>
          <span>신뢰도 {(confidence * 100).toFixed(0)}% / 100</span>
          {contentUrl && (
            <a href={contentUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--pu)', textDecoration: 'underline', textUnderlineOffset: 3, marginLeft: 'auto' }}>
              원문 확인하기 →
            </a>
          )}
        </div>
        <p style={{ fontSize: 11, color: 'var(--t3)', margin: '8px 0 0' }}>
          AI가 생성한 요약입니다. 법적 판단의 근거로 사용하지 마세요.
        </p>
      </div>
    </div>
  )
}
