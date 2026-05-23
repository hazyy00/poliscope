import Link from 'next/link'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { createServerClient } from '@/lib/supabase'
import { BillRow } from '@/components/bills/BillRow'
import { BillStatusCards, type StatusCardDef } from '@/components/bills/BillStatusCards'
import { BillFilterBar } from '@/components/bills/BillFilterBar'
import { Pagination } from '@/components/ui/Pagination'
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: '법안 | PoliScope',
  description: '22대 국회 발의 법안 17,000+건, 발의부터 표결까지.',
  openGraph: {
    title: '법안 | PoliScope',
    description: '22대 국회 발의 법안 17,000+건, 발의부터 표결까지.',
  },
}

const PAGE_SIZE = 20

const STATUS_GROUPS: Record<string, string[]> = {
  passed:  ['가결', '수정가결'],
  failed:  ['부결'],
  dropped: ['폐기', '철회'],
  pending: ['계류'],
}

const STATUS_CARD_DEFS: StatusCardDef[] = [
  { label: '전체', value: '',        count: 0, color: 'var(--t1)',      bg: 'var(--ivd)' },
  { label: '가결', value: 'passed',  count: 0, color: 'var(--st-pass)', bg: 'var(--st-pass-bg)' },
  { label: '부결', value: 'failed',  count: 0, color: 'var(--st-fail)', bg: 'var(--st-fail-bg)' },
  { label: '폐기', value: 'dropped', count: 0, color: 'var(--st-drop)', bg: 'var(--st-drop-bg)' },
  { label: '계류', value: 'pending', count: 0, color: 'var(--st-pend)', bg: 'var(--st-pend-bg)' },
]

interface Props {
  searchParams: Promise<{
    q?: string
    status?: string
    category?: string
    sort?: string
    page?: string
  }>
}

type BillWithVote = {
  id: string
  title: string
  status: string | null
  committee: string | null
  proposed_at: string | null
  proposer_name: string | null
  proposer_names: string | null
  proposer_party: string | null
  cosponsor_count: number
  vote?: {
    yes_count: number
    no_count: number
    abstain_count: number
    absent_count: number
    voted_at: string | null
  }
}

export default async function BillsPage({ searchParams }: Props) {
  const sp = await searchParams
  const supabase = createServerClient()
  const page = Math.max(1, parseInt(sp.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE
  const sort = sp.sort ?? 'voteDate'
  const statusGroup = sp.status ?? 'passed'
  const statusFilter = STATUS_GROUPS[statusGroup] ?? null
  const category = sp.category ?? ''

  const today = new Date().toISOString()

  // Status summary counts (parallel)
  const [totalRes, passedRes, failedRes, droppedRes, pendingRes] = await Promise.all([
    supabase.from('bills').select('*', { count: 'exact', head: true }).eq('is_hidden', false),
    supabase.from('bills').select('*', { count: 'exact', head: true }).eq('is_hidden', false).in('status', STATUS_GROUPS.passed),
    supabase.from('bills').select('*', { count: 'exact', head: true }).eq('is_hidden', false).in('status', STATUS_GROUPS.failed),
    supabase.from('bills').select('*', { count: 'exact', head: true }).eq('is_hidden', false).in('status', STATUS_GROUPS.dropped),
    supabase.from('bills').select('*', { count: 'exact', head: true }).eq('is_hidden', false).in('status', STATUS_GROUPS.pending),
  ])

  const statusCounts = [
    totalRes.count ?? 0,
    passedRes.count ?? 0,
    failedRes.count ?? 0,
    droppedRes.count ?? 0,
    pendingRes.count ?? 0,
  ]
  const statusCards: StatusCardDef[] = STATUS_CARD_DEFS.map((c, i) => ({ ...c, count: statusCounts[i] }))

  // Shared row normalizer
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function normalizeRow(b: any, voteDate?: string | null): BillWithVote {
    const proposer = Array.isArray(b.members) ? b.members[0] : b.members
    const votesArr = Array.isArray(b.votes) ? b.votes : (b.votes ? [b.votes] : [])
    // 여러 vote 중 총 투표수 가장 많은 것 선택 (all-zero 레코드 제외)
    const meaningful = votesArr.filter((x: any) => (x.yes_count ?? 0) + (x.no_count ?? 0) + (x.abstain_count ?? 0) > 0)
    const statusToResult: Record<string, string> = { '가결': '가결', '수정가결': '수정가결', '부결': '부결', '폐기': '폐기' }
    const targetResult = statusToResult[b.status ?? '']
    const matching = targetResult ? meaningful.filter((x: any) => x.result === targetResult) : []
    const byTotal = (arr: any[]) => arr.sort((a: any, c: any) =>
      ((c.yes_count??0)+(c.no_count??0)+(c.abstain_count??0)+(c.absent_count??0)) -
      ((a.yes_count??0)+(a.no_count??0)+(a.abstain_count??0)+(a.absent_count??0))
    )[0] ?? null
    const v = (matching.length > 0 ? byTotal([...matching]) : null) ?? byTotal([...meaningful]) ?? null
    return {
      id: b.id,
      title: b.title,
      status: b.status,
      committee: b.committee,
      proposed_at: b.proposed_at,
      proposer_name: proposer?.name ?? null,
      proposer_names: b.proposer_names ?? null,
      proposer_party: proposer?.party ?? null,
      cosponsor_count: b.cosponsor_count ?? 0,
      vote: v ? {
        yes_count: v.yes_count ?? 0,
        no_count: v.no_count ?? 0,
        abstain_count: v.abstain_count ?? 0,
        absent_count: v.absent_count ?? 0,
        voted_at: voteDate ?? v.voted_at ?? b.proposed_at ?? null,
      } : (voteDate ? { yes_count: 0, no_count: 0, abstain_count: 0, absent_count: 0, voted_at: voteDate } : undefined),
    }
  }

  // Main data fetch
  let bills: BillWithVote[] = []
  let totalCount = 0

  if (sort === 'voteDate') {
    // Sort by passed_at as vote/decision date proxy
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from('bills')
      .select('id, title, status, committee, proposed_at, passed_at, cosponsor_count, proposer_names, proposer_id, members!bills_proposer_id_fkey(name, party), votes!votes_bill_id_fkey(yes_count, no_count, abstain_count, absent_count, voted_at, result)', { count: 'exact' })
      .eq('is_hidden', false)
      .order(statusGroup === 'pending' ? 'proposed_at' : 'passed_at', { ascending: false, nullsFirst: false })
      .order('title', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (statusFilter) q = q.in('status', statusFilter)
    else if (statusGroup !== 'all') q = q.not('status', 'eq', '계류').not('passed_at', 'is', null)
    if (sp.q) q = q.or(`title.ilike.%${sp.q}%,proposer_names.ilike.%${sp.q}%,committee.ilike.%${sp.q}%`)
    if (category) q = q.eq('category', category)

    const { data: vdData, count: vdCount } = await q
    totalCount = vdCount ?? 0
    const vdBills = (vdData ?? []).map((b: any) => normalizeRow(b, b.passed_at ?? null))
    bills = vdBills
  } else if (sort === 'approval') {
    // 찬성순: yes_count 내림차순, 인메모리 정렬 (필터는 DB 레벨 적용)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from('bills')
      .select('id, title, status, committee, proposed_at, passed_at, cosponsor_count, proposer_names, proposer_id, members!bills_proposer_id_fkey(name, party), votes!votes_bill_id_fkey(yes_count, no_count, abstain_count, absent_count, voted_at, result)')
      .eq('is_hidden', false)
      .not('passed_at', 'is', null)

    if (statusFilter) q = q.in('status', statusFilter)
    if (sp.q) q = q.or(`title.ilike.%${sp.q}%,proposer_names.ilike.%${sp.q}%,committee.ilike.%${sp.q}%`)
    if (category) q = q.eq('category', category)

    const { data: allBills } = await q

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let withApproval = ((allBills ?? []) as any[])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((b: any) => {
        const proposer = Array.isArray(b.members) ? b.members[0] : b.members
        const votesArr = Array.isArray(b.votes) ? b.votes : (b.votes ? [b.votes] : [])
        const meaningful = votesArr.filter((x: any) => (x.yes_count ?? 0) + (x.no_count ?? 0) + (x.abstain_count ?? 0) > 0)
        const statusToResult: Record<string, string> = { '가결': '가결', '수정가결': '수정가결', '부결': '부결', '폐기': '폐기' }
        const targetResult = statusToResult[b.status ?? '']
        const matching = targetResult ? meaningful.filter((x: any) => x.result === targetResult) : []
        const byTotal = (arr: any[]) => arr.sort((a: any, c: any) =>
          ((c.yes_count??0)+(c.no_count??0)+(c.abstain_count??0)+(c.absent_count??0)) -
          ((a.yes_count??0)+(a.no_count??0)+(a.abstain_count??0)+(a.absent_count??0))
        )[0] ?? null
        const v = (matching.length > 0 ? byTotal([...matching]) : null) ?? byTotal([...meaningful]) ?? null
        return {
          id: b.id as string,
          title: b.title as string,
          status: b.status as string | null,
          committee: b.committee as string | null,
          proposed_at: b.proposed_at as string | null,
          proposer_name: (proposer?.name ?? null) as string | null,
          proposer_names: (b.proposer_names ?? null) as string | null,
          proposer_party: (proposer?.party ?? null) as string | null,
          cosponsor_count: (b.cosponsor_count ?? 0) as number,
          vote: v ? {
            yes_count: v.yes_count ?? 0,
            no_count: v.no_count ?? 0,
            abstain_count: v.abstain_count ?? 0,
            absent_count: v.absent_count ?? 0,
            voted_at: (b.passed_at ?? v.voted_at ?? null) as string | null,
          } : undefined,
          _score: v?.yes_count ?? 0,
        }
      })
      .sort((a: { _score: number; title: string }, b: { _score: number; title: string }) =>
        b._score !== a._score ? b._score - a._score : a.title.localeCompare(b.title, 'ko')
      )

    totalCount = withApproval.length
    bills = withApproval.slice(offset, offset + PAGE_SIZE)
  } else if (sort === 'resistance') {
    // 저항순: 반대+기권+불참 합계 내림차순, 인메모리 정렬 (필터는 DB 레벨 적용)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from('bills')
      .select('id, title, status, committee, proposed_at, passed_at, cosponsor_count, proposer_names, proposer_id, members!bills_proposer_id_fkey(name, party), votes!votes_bill_id_fkey(yes_count, no_count, abstain_count, absent_count, voted_at, result)')
      .eq('is_hidden', false)
      .not('passed_at', 'is', null)

    if (statusFilter) q = q.in('status', statusFilter)
    if (sp.q) q = q.or(`title.ilike.%${sp.q}%,proposer_names.ilike.%${sp.q}%,committee.ilike.%${sp.q}%`)
    if (category) q = q.eq('category', category)

    const { data: allBills } = await q

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let withResist = ((allBills ?? []) as any[])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((b: any) => {
        const proposer = Array.isArray(b.members) ? b.members[0] : b.members
        const votesArr = Array.isArray(b.votes) ? b.votes : (b.votes ? [b.votes] : [])
        const meaningful = votesArr.filter((x: any) => (x.yes_count ?? 0) + (x.no_count ?? 0) + (x.abstain_count ?? 0) > 0)
        const statusToResult: Record<string, string> = { '가결': '가결', '수정가결': '수정가결', '부결': '부결', '폐기': '폐기' }
        const targetResult = statusToResult[b.status ?? '']
        const matching = targetResult ? meaningful.filter((x: any) => x.result === targetResult) : []
        const byTotal = (arr: any[]) => arr.sort((a: any, c: any) =>
          ((c.yes_count??0)+(c.no_count??0)+(c.abstain_count??0)+(c.absent_count??0)) -
          ((a.yes_count??0)+(a.no_count??0)+(a.abstain_count??0)+(a.absent_count??0))
        )[0] ?? null
        const v = (matching.length > 0 ? byTotal([...matching]) : null) ?? byTotal([...meaningful]) ?? null
        const resistScore = (v?.no_count ?? 0) + (v?.abstain_count ?? 0) + (v?.absent_count ?? 0)
        return {
          id: b.id as string,
          title: b.title as string,
          status: b.status as string | null,
          committee: b.committee as string | null,
          proposed_at: b.proposed_at as string | null,
          proposer_name: (proposer?.name ?? null) as string | null,
          proposer_names: (b.proposer_names ?? null) as string | null,
          proposer_party: (proposer?.party ?? null) as string | null,
          cosponsor_count: (b.cosponsor_count ?? 0) as number,
          vote: v ? {
            yes_count: v.yes_count ?? 0,
            no_count: v.no_count ?? 0,
            abstain_count: v.abstain_count ?? 0,
            absent_count: v.absent_count ?? 0,
            voted_at: (b.passed_at ?? v.voted_at ?? null) as string | null,
          } : undefined,
          _score: resistScore,
        }
      })
      .sort((a: { _score: number; title: string }, b: { _score: number; title: string }) =>
        b._score !== a._score ? b._score - a._score : a.title.localeCompare(b.title, 'ko')
      )

    totalCount = withResist.length
    bills = withResist.slice(offset, offset + PAGE_SIZE)
  } else {
    // 공동발의순: cosponsor_count 내림차순, DB 레벨 정렬
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from('bills')
      .select('id, title, status, committee, proposed_at, passed_at, cosponsor_count, proposer_names, proposer_id, members!bills_proposer_id_fkey(name, party), votes!votes_bill_id_fkey(yes_count, no_count, abstain_count, absent_count, voted_at, result)', { count: 'exact' })
      .eq('is_hidden', false)
      .order('cosponsor_count', { ascending: false, nullsFirst: false })
      .order('title', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1)

    if (statusFilter) q = q.in('status', statusFilter)
    if (sp.q) q = q.or(`title.ilike.%${sp.q}%,proposer_names.ilike.%${sp.q}%,committee.ilike.%${sp.q}%`)
    if (category) q = q.eq('category', category)

    const { data: csData, count: csCount } = await q
    totalCount = csCount ?? 0
    bills = (csData ?? []).map((b: any) => normalizeRow(b, b.passed_at ?? null))
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)


  function buildHref(p: number) {
    const params = new URLSearchParams()
    if (sp.q) params.set('q', sp.q)
    if (sp.status) params.set('status', sp.status)
    if (category) params.set('category', category)
    if (sort !== 'voteDate') params.set('sort', sort)
    if (p > 1) params.set('page', String(p))
    const qs = params.toString()
    return `/bills${qs ? `?${qs}` : ''}`
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 60px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Link
          href="/"
          style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          홈으로 돌아가기
        </Link>
        <Breadcrumb items={[{ label: 'PoliScope', href: '/' }, { label: '법안' }]} />

        {/* Page header — 2-column */}
        <header style={{
          marginTop: 18,
          display: 'grid', gridTemplateColumns: '1fr auto',
          alignItems: 'end', gap: 32,
          paddingBottom: 28, borderBottom: '0.5px solid var(--bd)',
          marginBottom: 24,
        }}>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-serif)', fontWeight: 300,
              fontSize: 56, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.05,
              color: 'var(--t1)',
            }}>
              법안 · <em className="fell">발의부터 표결까지</em>
            </h1>
            <p style={{
              margin: '14px 0 0', maxWidth: 540,
              fontSize: 14, fontWeight: 300, color: 'var(--t2)', lineHeight: 1.7,
            }}>
              {statusCounts[0].toLocaleString()}건의 법안과 표결을 한 화면에서. 법이 어디까지 갔는지,<br />누가 어떻게 투표했는지 확인하세요.
            </p>
          </div>
          <Suspense>
            <BillStatusCards cards={statusCards.filter(c => c.value !== '')} activeStatus={statusGroup} totalCount={statusCounts[0]} />
          </Suspense>
        </header>

        <Suspense>
          <BillFilterBar
            initialQ={sp.q ?? ''}
            initialCategory={category}
            initialSort={sort}
          />
        </Suspense>

        {/* Result meta */}
        <div style={{
          paddingBottom: 10, borderBottom: '0.5px solid var(--bd)',
          fontSize: 11, color: 'var(--t3)',
          fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
        }}>
          <span style={{ color: 'var(--t1)' }}>{totalCount.toLocaleString()}</span>건 표시
        </div>

        {bills.length > 0 ? (
          <div>
            {bills.map(bill => (
              <BillRow
                key={bill.id}
                id={bill.id}
                title={bill.title}
                status={bill.status ?? '계류'}
                committee={bill.committee}
                proposed_at={bill.proposed_at}
                proposer_name={bill.proposer_name}
                proposer_names={bill.proposer_names}
                proposer_party={bill.proposer_party}
                cosponsor_count={bill.cosponsor_count}
                vote={bill.vote}
                today={today}
              />
            ))}
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
