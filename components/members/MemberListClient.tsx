'use client'

import { useState, useMemo } from 'react'
import { BenchmarkCard, type EnrichedMember } from './BenchmarkCard'
import { PARTY_ROLES } from '@/lib/party-roles'

const PARTIES = ['더불어민주당', '국민의힘', '조국혁신당', '개혁신당', '진보당', '기본소득당', '사회민주당', '새로운미래', '무소속']
const REGIONS = ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '비례']

type Sort = '이름순' | '발의수순' | '가결율순'
type Dir = 'desc' | 'asc'

interface PartyAverages {
  [party: string]: { avgBills: number; avgPassRate: number }
}

interface MemberListClientProps {
  members: EnrichedMember[]
  partyAverages: PartyAverages
  billsBarMax: number
  totalAssembly: number
}

export function MemberListClient({ members, partyAverages, billsBarMax, totalAssembly }: MemberListClientProps) {
  const [query, setQuery] = useState('')
  const [party, setParty] = useState('전체')
  const [region, setRegion] = useState('전체')
  const [sort, setSort] = useState<Sort>('이름순')
  const [dir, setDir] = useState<Dir>('desc')

  function handleSort(s: Sort) {
    if (s === sort && s !== '이름순') {
      setDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSort(s)
      setDir('desc')
    }
  }

  const filtered = useMemo(() => {
    let out = members.filter(m => {
      if (party !== '전체' && m.party !== party) return false
      if (region !== '전체') {
        if (region === '비례') {
          if (!m.is_pr) return false
        } else {
          if (m.is_pr) return false
          if (!m.district?.includes(region)) return false
        }
      }
      if (query) {
        const q = query.trim()
        const role = PARTY_ROLES[m.id] ?? ''
        const areas = m.topCommittees.map(t => t.label).join(' ')
        if (!m.name.includes(q) && !(m.district ?? '').includes(q) && !role.includes(q) && !areas.includes(q)) return false
      }
      return true
    })

    const cmp: Record<Sort, (a: EnrichedMember, b: EnrichedMember) => number> = {
      '이름순': (a, b) => a.name.localeCompare(b.name, 'ko'),
      '발의수순': (a, b) => dir === 'desc' ? b.billsCount - a.billsCount : a.billsCount - b.billsCount,
      '가결율순': (a, b) => dir === 'desc' ? b.passRate - a.passRate : a.passRate - b.passRate,
    }
    return [...out].sort(cmp[sort])
  }, [members, query, party, region, sort, dir])

  const FALLBACK_AVG = { avgBills: 0, avgPassRate: 0 }

  return (
    <div>
      {/* Filter bar */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 0.9fr 0.7fr auto',
          gap: 10,
          alignItems: 'center',
        }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--m-muted)', fontSize: 14, pointerEvents: 'none',
            }}>
              ⌕
            </span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="이름, 지역구, 정당, 분야 검색"
              style={{
                width: '100%', padding: '12px 14px 12px 38px',
                border: '1px solid var(--m-faint)', background: 'var(--iv)',
                fontFamily: 'inherit', fontSize: 14, outline: 'none',
                color: 'var(--m-ink)', boxSizing: 'border-box', borderRadius: 0,
              }}
            />
          </div>

          {/* Party select */}
          <select
            value={party}
            onChange={e => setParty(e.target.value)}
            style={{
              padding: '12px 14px', border: '1px solid var(--m-faint)',
              background: 'var(--iv)', fontFamily: 'inherit', fontSize: 14,
              outline: 'none', color: 'var(--m-ink)', cursor: 'pointer',
              appearance: 'none', borderRadius: 0,
            }}
          >
            <option value="전체">전체 정당</option>
            {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Region select */}
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            style={{
              padding: '12px 14px', border: '1px solid var(--m-faint)',
              background: 'var(--iv)', fontFamily: 'inherit', fontSize: 14,
              outline: 'none', color: 'var(--m-ink)', cursor: 'pointer',
              appearance: 'none', borderRadius: 0,
            }}
          >
            <option value="전체">전체 지역</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>

          {/* Sort toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--m-faint)', background: 'var(--iv)' }}>
            {(['이름순', '발의수순', '가결율순'] as Sort[]).map(s => {
              const active = sort === s
              const arrow = active && s !== '이름순' ? (dir === 'desc' ? ' ▼' : ' ▲') : ''
              return (
                <button
                  key={s}
                  onClick={() => handleSort(s)}
                  style={{
                    padding: '11px 13px',
                    width: s === '이름순' ? 64 : 82,
                    background: active ? 'var(--m-ink)' : 'transparent',
                    color: active ? '#fff' : 'var(--m-ink-soft)',
                    border: 'none', fontFamily: 'inherit', fontSize: 12.5,
                    cursor: 'pointer', fontWeight: active ? 600 : 400,
                    whiteSpace: 'nowrap', textAlign: 'center',
                  }}
                >
                  {s}{arrow}
                </button>
              )
            })}
          </div>
        </div>

        {/* Count row */}
        <div style={{
          marginTop: 14, display: 'flex', justifyContent: 'space-between',
          fontSize: 12, color: 'var(--m-muted)', letterSpacing: '0.02em',
        }}>
          <span>
            <strong style={{ color: 'var(--m-ink)', fontWeight: 600 }}>{filtered.length}</strong>
            명 표시{' '}
            <span style={{ opacity: 0.5 }}>· 전체 {totalAssembly}명</span>
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            {sort.toUpperCase()}{sort !== '이름순' && <span style={{ fontSize: 13, lineHeight: 1, verticalAlign: 'middle', marginLeft: 4 }}>{dir === 'desc' ? '▼' : '▲'}</span>}
          </span>
        </div>
      </div>

      {/* Benchmark header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: 'var(--m-panel)', border: '1px solid var(--m-faint)',
        fontSize: 12, color: 'var(--m-ink-soft)', marginBottom: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: 'var(--m-muted)', letterSpacing: '0.1em',
          }}>
            BENCHMARK
          </span>
          <span>
            각 의원의 발의 · 가결율을{' '}
            <strong style={{ color: 'var(--m-accent)', fontWeight: 600 }}>소속 정당 평균</strong>
            과 비교합니다.
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--m-muted)', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 4, background: 'var(--m-accent)', display: 'inline-block' }} />
            본인
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 1, height: 10, background: 'var(--m-ink)', opacity: 0.6, display: 'inline-block' }} />
            정당 평균
          </span>
        </div>
      </div>

      {/* Cards grid */}
      {filtered.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: 10,
        }}>
          {filtered.map(m => (
            <BenchmarkCard
              key={m.id}
              member={m}
              partyAvg={partyAverages[m.party ?? '무소속'] ?? FALLBACK_AVG}
              billsBarMax={billsBarMax}
            />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', color: 'var(--m-muted)', padding: '80px 0', fontSize: 15 }}>
          검색 결과가 없습니다.
        </div>
      )}
    </div>
  )
}
