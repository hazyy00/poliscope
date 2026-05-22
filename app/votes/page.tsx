import { createServerClient } from '@/lib/supabase'
import { Pagination } from '@/components/ui/Pagination'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import VoteSearch from '@/components/votes/VoteSearch'

export const metadata: Metadata = {
  title: '표결 기록 | PoliScope',
  description: '22대 국회 본회의 표결 전수를 확인하세요.',
  openGraph: {
    title: '표결 기록 | PoliScope',
    description: '22대 국회 본회의 표결 전수를 확인하세요.',
  },
}

const PAGE_SIZE = 20

const RESULT_COLORS: Record<string, string> = {
  '가결': 'var(--pu)',
  '부결': '#C0392B',
  '폐기': '#AAAAAA',
  '무효': '#F5A623',
  '결과 미확인': '#C8BFB0',
}

const RESULTS = ['가결', '부결', '폐기', '무효', '결과 미확인'] as const

interface Props {
  searchParams: Promise<{ q?: string; result?: string; page?: string }>
}

export default async function VotesPage({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = createServerClient()
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('votes')
    .select('id, title, voted_at, result, yes_count, no_count, abstain_count, absent_count', { count: 'exact' })
    .order('voted_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (sp.result === '결과 미확인') {
    query = query.is('result', null)
  } else if (sp.result) {
    query = query.eq('result', sp.result)
  }
  if (sp.q) query = query.ilike('title', `%${sp.q}%`)

  const { data: votes, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function buildHref(p: number) {
    const usp = new URLSearchParams()
    if (sp.q) usp.set('q', sp.q)
    if (sp.result) usp.set('result', sp.result)
    if (p > 1) usp.set('page', String(p))
    const qs = usp.toString()
    return `/votes${qs ? `?${qs}` : ''}`
  }

  function filterHref(result?: string) {
    const usp = new URLSearchParams()
    if (sp.q) usp.set('q', sp.q)
    if (result) usp.set('result', result)
    const qs = usp.toString()
    return `/votes${qs ? `?${qs}` : ''}`
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 60px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Link href="/" style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          홈으로 돌아가기
        </Link>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--font-serif)', color: 'var(--t1)', marginBottom: 8 }}>
            표결 기록
          </h1>
          <p style={{ fontSize: 14, color: 'var(--t3)' }}>
            총 {count?.toLocaleString() ?? 0}건
          </p>
        </div>

        {/* 검색 */}
        <div style={{ marginBottom: 16 }}>
          <Suspense>
            <VoteSearch />
          </Suspense>
        </div>

        {/* 결과 필터 탭 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <Link
            href={filterHref()}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 13, textDecoration: 'none',
              background: !sp.result ? 'var(--bk)' : 'transparent',
              color: !sp.result ? 'var(--iv)' : 'var(--t2)',
              border: '1px solid var(--bd)',
            }}
          >
            전체
          </Link>
          {RESULTS.map(r => (
            <Link
              key={r}
              href={filterHref(r)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 13, textDecoration: 'none',
                background: sp.result === r ? RESULT_COLORS[r] : 'transparent',
                color: sp.result === r ? '#fff' : 'var(--t2)',
                border: `1px solid ${sp.result === r ? RESULT_COLORS[r] : 'var(--bd)'}`,
              }}
            >
              {r}
            </Link>
          ))}
        </div>

        {/* 목록 */}
        {votes && votes.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {votes.map(vote => {
              const label = vote.result ?? '결과 미확인'
              const color = RESULT_COLORS[label] ?? '#AAAAAA'
              const total = (vote.yes_count ?? 0) + (vote.no_count ?? 0) + (vote.abstain_count ?? 0) + (vote.absent_count ?? 0)
              return (
                <Link
                  key={vote.id}
                  href={`/votes/${vote.id}`}
                  style={{
                    display: 'block', padding: '16px 20px',
                    border: '1px solid var(--bd)', borderRadius: 10,
                    textDecoration: 'none', background: '#fff',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{
                      flexShrink: 0,
                      padding: '2px 10px', borderRadius: 20,
                      fontSize: 11, fontWeight: 600,
                      background: `${color}18`, color,
                    }}>
                      {label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--t1)', flex: 1, lineHeight: 1.5 }}>
                      {vote.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    {vote.voted_at && (
                      <span style={{ fontSize: 12, color: 'var(--t3)' }}>
                        {vote.voted_at.slice(0, 10)}
                      </span>
                    )}
                    {total > 0 && (
                      <div style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                        <span style={{ color: '#3D6DB5' }}>찬성 {vote.yes_count}</span>
                        <span style={{ color: '#C0392B' }}>반대 {vote.no_count}</span>
                        {(vote.abstain_count ?? 0) > 0 && (
                          <span style={{ color: '#F5A623' }}>기권 {vote.abstain_count}</span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--t3)', padding: '80px 0', fontSize: 15 }}>
            검색 결과가 없습니다.
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} buildHref={buildHref} className="mt-12" />
      </div>
    </main>
  )
}
