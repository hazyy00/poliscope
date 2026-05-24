'use client'

import { useState } from 'react'
import type { AiSummaryJson } from '@/lib/types'

export function AISummaryNoSource() {
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
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-serif)', fontWeight: 300, color: 'var(--t3)' }}>
          원문을 찾을 수 없어 요약을 제공하지 못했습니다.{' '}
          <a href="/ai-guide" style={{ color: 'var(--t3)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            AI 요약 방식 보기
          </a>
        </span>
      </div>
    </div>
  )
}

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
  billId: string
  contentUrl: string | null
}

export function AISummary({ summary, billId: _billId, contentUrl }: Props) {
  const [showSources, setShowSources] = useState(false)

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
      </div>
      <div>
        <p style={{
          margin: 0, fontSize: 14, lineHeight: 1.85,
          fontFamily: 'var(--font-serif)', fontWeight: 300, color: 'var(--t1)',
          marginBottom: 12,
        }}>
          {summary.summary}
        </p>

        {(summary.key_points?.length ?? 0) > 0 && (
          <ul style={{ margin: '0 0 16px', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {summary.key_points.map((pt, i) => (
              <li key={i} style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.5 }}>{pt}</li>
            ))}
          </ul>
        )}

        {(summary.source_spans?.length ?? 0) > 0 && (
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={() => setShowSources(s => !s)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)',
                letterSpacing: '0.04em',
              }}
            >
              원문 근거 {showSources ? '▲ 숨기기' : '▼ 펼치기'}
            </button>
            {showSources && (
              <ul style={{ margin: '8px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {summary.source_spans.map((span, i) => (
                  <li key={i} style={{ fontSize: 12, color: 'var(--t3)', lineHeight: 1.5, fontStyle: 'italic' }}>"{span}"</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div style={{
          display: 'flex', alignItems: 'center', gap: 18,
          fontSize: 11, color: 'var(--t3)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
          borderTop: '0.5px solid var(--bd)', paddingTop: 12,
        }}>
          {contentUrl && (
            <a href={contentUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--pu)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              원문 확인하기 →
            </a>
          )}
          <a href="/ai-guide" style={{ color: 'var(--t3)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            AI 요약 방식 보기
          </a>
        </div>
        <p style={{ fontSize: 11, color: 'var(--t3)', margin: '8px 0 0' }}>
          AI가 생성한 요약입니다. 법적 판단의 근거로 사용하지 마세요.
        </p>
      </div>
    </div>
  )
}
