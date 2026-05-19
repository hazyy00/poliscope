import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { REGIONS_DATA } from '@/lib/regions'
import { MemberCard } from '@/components/members/MemberCard'
import { GovernorCard } from '@/components/members/GovernorCard'
import { MemberSearch } from '@/components/members/MemberSearch'
import { Pagination } from '@/components/ui/Pagination'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: '의원 검색 — PoliScope',
  description: '22대 국회 의원 286명을 이름·지역구·정당으로 검색하세요.',
  openGraph: {
    title: '의원 검색 — PoliScope',
    description: '22대 국회 의원 286명을 이름·지역구·정당으로 검색하세요.',
  },
}

const PAGE_SIZE = 24

interface Props {
  searchParams: Promise<{ q?: string; party?: string; district?: string; page?: string }>
}

export default async function MembersPage({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = createServerClient()
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  // Filter governors from static data (split into southern/northern)
  const filterRegion = (r: typeof REGIONS_DATA[0]) => {
    const gov = r.governor
    if (sp.q && !gov.name.includes(sp.q)) return false
    if (sp.party && gov.party !== sp.party) return false
    if (sp.district && !r.name.includes(sp.district) && !r.short.includes(sp.district)) return false
    return true
  }
  const filteredGovernors = REGIONS_DATA.filter(r => !r.is_northern && filterRegion(r))
  const filteredNorthern = REGIONS_DATA.filter(r => r.is_northern && filterRegion(r))

  let query = supabase
    .from('members')
    .select('id, name, party, district, is_pr, photo_url, committee', { count: 'exact' })
    .order('name')
    .range(offset, offset + PAGE_SIZE - 1)

  if (sp.q) query = query.ilike('name', `%${sp.q}%`)
  if (sp.party) query = query.eq('party', sp.party)
  if (sp.district) query = query.ilike('district', `%${sp.district}%`)

  const { data: members, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  const hasFilters = !!(sp.q || sp.party || sp.district)
  const showGovernors = !hasFilters || filteredGovernors.length > 0
  const showNorthern = !hasFilters || filteredNorthern.length > 0

  const totalCount = (count ?? 0) + (showGovernors ? filteredGovernors.length : 0) + (showNorthern ? filteredNorthern.length : 0)

  function buildHref(p: number) {
    const usp = new URLSearchParams()
    if (sp.q) usp.set('q', sp.q)
    if (sp.party) usp.set('party', sp.party)
    if (sp.district) usp.set('district', sp.district)
    if (p > 1) usp.set('page', String(p))
    const qs = usp.toString()
    return `/members${qs ? `?${qs}` : ''}`
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 60px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Link
          href="/"
          style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          지도로 돌아가기
        </Link>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--font-serif)', color: 'var(--t1)', marginBottom: 8 }}>
            의원 검색
          </h1>
          <p style={{ fontSize: 14, color: 'var(--t3)' }}>
            {totalCount}명
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Suspense>
            <MemberSearch />
          </Suspense>
        </div>

        {/* Governors section */}
        {showGovernors && filteredGovernors.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
              시장 · 도지사
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              {filteredGovernors.map(r => (
                <GovernorCard key={r.name} region={r} />
              ))}
            </div>
          </div>
        )}

        {/* 이북5도위원회 */}
        {showNorthern && filteredNorthern.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              이북5도위원회
            </div>
            <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 16 }}>
              황해도 · 평안남도 · 평안북도 · 함경남도 · 함경북도 도지사 (차관급 정무직)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              {filteredNorthern.map(r => (
                <GovernorCard key={r.name} region={r} />
              ))}
            </div>
            {(members && members.length > 0) && (
              <div style={{ height: 1, background: 'var(--bd)', margin: '40px 0 0' }} />
            )}
          </div>
        )}

        {/* Members section */}
        {members && members.length > 0 ? (
          <>
            {showGovernors && filteredGovernors.length > 0 && (
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>
                국회의원
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              {members.map(m => (
                <MemberCard key={m.id} {...m} />
              ))}
            </div>
          </>
        ) : filteredGovernors.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--t3)', padding: '80px 0', fontSize: 15 }}>
            검색 결과가 없습니다.
          </div>
        ) : null}

        <Pagination page={page} totalPages={totalPages} buildHref={buildHref} className="mt-12" />
      </div>
    </main>
  )
}
