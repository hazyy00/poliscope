'use client'

import { useState } from 'react'
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/category-meta'
import { hexToRgba } from '@/lib/utils'
import type { AiPicksResult } from '@/lib/types'
import { AiPicksResults } from './AiPicksResults'

type Status = 'idle' | 'loading' | 'done' | 'error'

export function AiPicksClient() {
  const [persona, setPersona] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState<AiPicksResult | null>(null)
  const [focused, setFocused] = useState(false)

  const canSubmit = persona.trim().length >= 2 && selected.length > 0 && status !== 'loading'

  const toggle = (cat: string) => {
    setSelected(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  const submit = async () => {
    if (!canSubmit) return
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/ai-picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: persona.trim(), categories: selected }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data) {
        setResult(data as AiPicksResult)
        setStatus('done')
      } else {
        setErrorMsg(data?.error ?? `서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요. (${res.status})`)
        setStatus('error')
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.')
      setStatus('error')
    }
  }

  return (
    <div>
      {/* 페르소나 입력 — 빈칸 채우기 문장 */}
      <div style={{
        padding: '36px 28px', background: 'white',
        border: '0.5px solid var(--bd)', borderRadius: 12, marginBottom: 20,
      }}>
        <div style={{
          fontFamily: 'var(--font-serif)', fontWeight: 400,
          fontSize: 'clamp(22px, 3vw, 30px)', color: 'var(--t1)',
          display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap',
        }}>
          <span>나는</span>
          <input
            type="text"
            value={persona}
            maxLength={30}
            onChange={e => setPersona(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={e => { if (e.key === 'Enter') submit() }}
            placeholder="20대 대학생, 주부, 스타트업 사장…"
            aria-label="페르소나 입력"
            style={{
              flex: '1 1 280px', minWidth: 200,
              fontFamily: 'inherit', fontSize: 'inherit', color: 'var(--t1)',
              background: 'transparent', border: 'none', outline: 'none',
              borderBottom: focused ? '2px solid var(--pu)' : '2px solid var(--bd)',
              padding: '2px 6px', transition: 'border-color 0.15s',
            }}
          />
          <span>입니다</span>
        </div>

        {/* 관심 분야 칩 */}
        <div style={{ marginTop: 28 }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)',
            letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12,
          }}>
            관심 분야 선택
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => {
              const active = selected.includes(cat)
              const color = CATEGORY_COLORS[cat]
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggle(cat)}
                  aria-pressed={active}
                  style={{
                    padding: '7px 14px', fontSize: 13, borderRadius: 20,
                    cursor: 'pointer', transition: 'all 0.12s',
                    fontFamily: 'var(--font-pretendard)',
                    border: active ? `1px solid ${color}` : '1px solid var(--bd)',
                    background: active ? hexToRgba(color, 0.1) : 'var(--iv)',
                    color: active ? color : 'var(--t2)',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* 제출 */}
        <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            style={{
              padding: '11px 24px', fontSize: 14, fontWeight: 500,
              background: 'var(--bk)', color: 'var(--iv)',
              border: 'none', borderRadius: 8,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              opacity: canSubmit ? 1 : 0.5,
            }}
          >
            {status === 'loading' ? '생성 중…' : '내 브리핑 받기 →'}
          </button>
          {status === 'error' && (
            <span style={{ fontSize: 13, color: 'var(--st-fail)' }}>{errorMsg}</span>
          )}
        </div>
      </div>

      {/* 로딩 스켈레톤 */}
      {status === 'loading' && (
        <div style={{
          padding: '24px 28px', background: 'var(--ivd)',
          border: '0.5px solid var(--bd)', borderRadius: 12,
        }}>
          {[220, 460, 340].map((w, i) => (
            <div key={i} style={{
              height: 13, maxWidth: w, borderRadius: 4,
              background: 'var(--bd)', marginBottom: 12,
              animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)', marginTop: 16,
          }}>
            AI가 최근 30일의 법안을 읽고 있습니다… (약 5~10초)
          </div>
        </div>
      )}

      {/* 결과 */}
      {status === 'done' && result && <AiPicksResults result={result} />}
    </div>
  )
}
