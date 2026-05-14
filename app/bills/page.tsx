import { createServerClient } from '@/lib/supabase'
import { BillCard } from '@/components/bills/BillCard'
import { BillSearch } from '@/components/bills/BillSearch'
import { Pagination } from '@/components/ui/Pagination'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: '법안 검색 — PoliScope',
  description: '22대 국회 발의 법안 17,000+건을 검색하세요.',
  openGraph: {
    title: '법안 검색 — PoliScope',
    description: '22대 국회 발의 법안 17,000+건을 검색하세요.',
  },
}

const PAGE_SIZE = 20

interface Props {
  searchParams: Promise<{ q?: string; status?: string; committee?: string; page?: string }>
}

export default async function BillsPage({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = createServerClient()
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('bills')
    .select('id, title, status, committee, proposed_at, summary_short, proposer_id, members!bills_proposer_id_fkey(name, party)', { count: 'exact' })
    .eq('is_hidden', false)
    .order('proposed_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (sp.q) query = query.ilike('title', `%${sp.q}%`)
  if (sp.status) query = query.eq('status', sp.status)
  if (sp.committee) query = query.ilike('committee', `%${sp.committee}%`)

  const { data: bills, count } = await query
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  function buildHref(p: number) {
    const usp = new URLSearchParams()
    if (sp.q) usp.set('q', sp.q)
    if (sp.status) usp.set('status', sp.status)
    if (sp.committee) usp.set('committee', sp.committee)
    if (p > 1) usp.set('page', String(p))
    const qs = usp.toString()
    return `/bills${qs ? `?${qs}` : ''}`
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 60px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--font-serif)', color: 'var(--t1)', marginBottom: 8 }}>
            법안 검색
          </h1>
          <p style={{ fontSize: 14, color: 'var(--t3)' }}>
            총 {count?.toLocaleString() ?? 0}건
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <Suspense>
            <BillSearch />
          </Suspense>
        </div>

        {bills && bills.length > 0 ? (
          <div>
            {bills.map(bill => {
              const proposer = Array.isArray(bill.members) ? bill.members[0] : bill.members
              return (
                <BillCard
                  key={bill.id}
                  id={bill.id}
                  title={bill.title}
                  status={bill.status ?? '계류'}
                  committee={bill.committee}
                  proposed_at={bill.proposed_at}
                  summary_short={(bill as any).summary_short}
                  proposer_name={(proposer as any)?.name ?? null}
                  proposer_party={(proposer as any)?.party ?? null}
                />
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
