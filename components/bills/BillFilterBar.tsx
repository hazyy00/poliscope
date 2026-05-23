'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useRef } from 'react'

interface Props {
  initialQ: string
  initialCategory: string
  initialSort: string
}

const SORTS = [
  { label: '최근순', value: 'voteDate' },
  { label: '찬성순', value: 'approval' },
  { label: '저항순', value: 'resistance' },
  { label: '공동발의순', value: 'cosponsors' },
]

const CATEGORIES = [
  '경제/재정', '과학/IT', '보건/복지', '교육', '환경/노동',
  '국방/외교', '교통/건설', '문화/체육', '농업/해양', '정치/법률',
]

export function BillFilterBar({ initialQ, initialCategory, initialSort }: Props) {
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

  function handleSearch(value: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => pushParams({ q: value.trim() || null }), 300)
  }

  function handleSort(value: string) {
    pushParams({ sort: value === 'voteDate' ? null : value })
  }

  function handleCategory(value: string) {
    pushParams({ category: value || null })
  }

  const activeSort = initialSort || 'voteDate'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
      {/* Row 1: 검색 + 정렬 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center' }}>
        <div style={{ position: 'relative', border: '0.5px solid var(--bd)', background: 'var(--iv)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="6" cy="6" r="4.5" stroke="var(--t3)" strokeWidth="1" />
            <path d="M9.5 9.5L12 12" stroke="var(--t3)" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <input
            defaultValue={initialQ}
            onChange={e => handleSearch(e.target.value)}
            placeholder="법안명 · 발의자 검색"
            style={{
              width: '100%', padding: '14px 14px 14px 38px',
              border: 0, background: 'transparent', outline: 'none',
              fontSize: 13, color: 'var(--t1)',
            }}
          />
        </div>
        <div style={{ display: 'flex', border: '0.5px solid var(--bd)', background: 'var(--iv)', height: 44 }}>
          {SORTS.map((s, i) => {
            const isActive = activeSort === s.value
            return (
              <button
                key={s.value}
                onClick={() => handleSort(s.value)}
                style={{
                  padding: '0 14px', fontSize: 12,
                  color: isActive ? 'var(--t1)' : 'var(--t3)',
                  background: isActive ? 'var(--ivd)' : 'transparent',
                  border: 'none',
                  borderRight: i < SORTS.length - 1 ? '0.5px solid var(--bd)' : 'none',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                {s.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Row 2: 분야 pill */}
      <div style={{ display: 'flex', gap: 0, border: '0.5px solid var(--bd)' }}>
        <button
          onClick={() => handleCategory('')}
          style={{
            flex: 1, padding: '10px 0', fontSize: 11,
            letterSpacing: '0.03em',
            border: 'none',
            borderRight: '0.5px solid var(--bd)',
            background: !initialCategory ? 'var(--t1)' : 'var(--iv)',
            color: !initialCategory ? 'var(--iv)' : 'var(--t2)',
            cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          전체
        </button>
        {CATEGORIES.map((cat, i) => {
          const isActive = initialCategory === cat
          return (
            <button
              key={cat}
              onClick={() => handleCategory(cat)}
              style={{
                flex: 1, padding: '10px 0', fontSize: 11,
                letterSpacing: '0.03em',
                border: 'none',
                borderLeft: '0.5px solid var(--bd)',
                background: isActive ? 'var(--t1)' : 'var(--iv)',
                color: isActive ? 'var(--iv)' : 'var(--t2)',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {cat}
            </button>
          )
        })}
      </div>
    </div>
  )
}
