import { PersonaTabs } from './PersonaTabs'
import type { AiSummaryJson } from '@/lib/types'

interface Props {
  summary: AiSummaryJson
  confidence: number
  contentUrl: string | null
}

export function AISummary({ summary, confidence, contentUrl }: Props) {
  return (
    <div style={{ background: 'var(--ivd)', borderRadius: 10, padding: '20px 24px', border: '1px solid var(--bd)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--pu)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          AI 요약
        </span>
        <span style={{ fontSize: 11, color: 'var(--t3)' }}>
          신뢰도 {Math.round(confidence * 100)}%
        </span>
      </div>

      <p style={{ fontSize: 15, color: 'var(--t1)', lineHeight: 1.7, fontStyle: 'italic', fontFamily: 'var(--font-serif)', marginBottom: 16 }}>
        {summary.summary}
      </p>

      {summary.key_points.length > 0 && (
        <ul style={{ margin: '0 0 16px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {summary.key_points.map((pt, i) => (
            <li key={i} style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>{pt}</li>
          ))}
        </ul>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t2)', marginBottom: 8 }}>내 삶의 영향</div>
        <PersonaTabs personas={summary.personas} />
      </div>

      {/* 면책 문구 — 항상 표시, 숨김 불가 */}
      <div style={{
        borderTop: '1px solid var(--bd)',
        paddingTop: 12,
        marginTop: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}>
        <p style={{ fontSize: 11, color: 'var(--t3)', margin: 0 }}>
          AI가 생성한 요약입니다. 법적 판단의 근거로 사용하지 마세요.
        </p>
        {contentUrl && (
          <a href={contentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--pu)', textDecoration: 'none' }}>
            원문 확인하기 →
          </a>
        )}
      </div>
    </div>
  )
}
