'use client'

import { useState } from 'react'

interface Props {
  pdfUrl: string | null
  contentUrl: string | null
}

export function BillSourceViewer({ pdfUrl, contentUrl }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [iframeError, setIframeError] = useState(false)

  const linkUrl = pdfUrl || contentUrl
  if (!linkUrl) return null

  return (
    <div style={{ border: '0.5px solid var(--bd)' }}>
      {/* 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 20px', background: 'var(--ivd)',
        borderBottom: expanded ? '0.5px solid var(--bd)' : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="2" y="1" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="1" style={{ color: 'var(--pu)' }} />
            <path d="M4 4h4M4 6.5h4M4 9h2.5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" style={{ color: 'var(--pu)' }} />
          </svg>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--t2)', letterSpacing: '0.04em' }}>
            원문 법안
          </span>
          {pdfUrl && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--pu)', letterSpacing: '0.06em' }}>
              PDF
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)', textDecoration: 'none', letterSpacing: '0.04em' }}
          >
            새 탭에서 열기 ↗
          </a>
          {pdfUrl && !iframeError && (
            <button
              onClick={() => setExpanded(v => !v)}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--iv)',
                background: 'var(--bk)', border: 'none', cursor: 'pointer',
                padding: '6px 14px', letterSpacing: '0.04em',
              }}
            >
              {expanded ? '닫기' : '인라인 보기'}
            </button>
          )}
        </div>
      </div>

      {/* 인라인 PDF */}
      {expanded && pdfUrl && (
        <iframe
          src={pdfUrl}
          style={{ width: '100%', height: 720, display: 'block', border: 'none' }}
          onError={() => { setIframeError(true); setExpanded(false) }}
          title="원문 법안"
        />
      )}
    </div>
  )
}
