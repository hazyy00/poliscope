'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef } from 'react'

interface Props {
  initialQ: string
  initialCommittee: string
  initialSort: string
}

const SORTS = [
  { label: '표결일순', value: 'voteDate' },
  { label: '발의일순', value: 'proposeDate' },
  { label: '접전순', value: 'contested' },
]

export function BillFilterBar({ initialQ, initialCommittee, initialSort }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function pushParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') {
        params.delete(k)
      } else {
        params.set(k, v)
      }
    }
    params.delete('page')
    router.push(`/bills?${params.toString()}`)
  }

  function handleText(key: string, value: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => pushParams({ [key]: value || null }), 300)
  }

  function handleSort(value: string) {
    pushParams({ sort: value === 'proposeDate' ? null : value })
  }

  const activeSort = initialSort || 'proposeDate'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 14, alignItems: 'center', marginBottom: 20 }}>
      {/* Search with icon */}
      <div style={{ position: 'relative', border: '0.5px solid var(--bd)', background: 'var(--iv)' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="6" cy="6" r="4.5" stroke="var(--t3)" strokeWidth="1" />
          <path d="M9.5 9.5L12 12" stroke="var(--t3)" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <input
          defaultValue={initialQ}
          onChange={e => handleText('q', e.target.value)}
          placeholder="법안명 · 발의자 · 위원회 검색"
          style={{
            width: '100%', padding: '14px 14px 14px 38px',
            border: 0, background: 'transparent', outline: 'none',
            fontSize: 13, color: 'var(--t1)',
          }}
        />
      </div>

      {/* Committee select */}
      <div style={{
        display: 'flex', alignItems: 'center',
        border: '0.5px solid var(--bd)', padding: '0 14px',
        height: 44, gap: 8, background: 'var(--iv)', cursor: 'pointer',
        position: 'relative',
      }}>
        <span style={{ fontSize: 11, color: 'var(--t3)', letterSpacing: '0.04em' }}>위원회</span>
        <input
          defaultValue={initialCommittee}
          onChange={e => handleText('committee', e.target.value)}
          placeholder="전체"
          style={{
            border: 0, background: 'transparent', outline: 'none',
            fontSize: 13, color: 'var(--t1)', width: 80,
          }}
        />
        <svg width="9" height="6" viewBox="0 0 9 6" style={{ marginLeft: 4, flexShrink: 0, pointerEvents: 'none' }}>
          <path d="M1 1L4.5 5L8 1" stroke="var(--t3)" strokeWidth="1" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      {/* Sort control */}
      <div style={{ display: 'flex', border: '0.5px solid var(--bd)', background: 'var(--iv)', height: 44 }}>
        {SORTS.map((s, i) => {
          const isActive = activeSort === s.value
          return (
            <button
              key={s.value}
              onClick={() => handleSort(s.value)}
              style={{
                padding: '0 14px',
                fontSize: 12,
                color: isActive ? 'var(--t1)' : 'var(--t3)',
                background: isActive ? 'var(--ivd)' : 'transparent',
                border: 'none',
                borderRight: i < SORTS.length - 1 ? '0.5px solid var(--bd)' : 'none',
                cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
