import { createServerClient } from '@/lib/supabase'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PartyBadge } from '@/components/ui/PartyBadge'
import VoteDetailTabs, { type MemberVoteRow } from '@/components/votes/VoteDetailTabs'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { formatDate } from '@/lib/utils'

const RESULT_COLORS: Record<string, string> = {
  '가결': 'var(--pu)',
  '부결': '#C0392B',
  '폐기': '#AAAAAA',
  '무효': '#F5A623',
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = createServerClient()
  const { data } = await supabase.from('votes').select('title, result').eq('id', id).single()
  if (!data) return { title: '표결 | PoliScope' }
  return {
    title: `${data.title} | PoliScope`,
    description: `22대 국회 표결 · ${data.result ?? ''}`,
    openGraph: { title: data.title, description: `22대 국회 표결 · ${data.result ?? ''}` },
  }
}

export default async function VoteDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = createServerClient()

  const [voteRes, memberVotesRes] = await Promise.all([
    supabase.from('votes').select('*').eq('id', id).single(),
    supabase
      .from('member_votes')
      .select('stance, members(id, name, party, photo_url)')
      .eq('vote_id', id),
  ])

  if (!voteRes.data) notFound()
  const vote = voteRes.data
  const memberVotes = (memberVotesRes.data ?? []) as unknown as MemberVoteRow[]

  // 관련 법안 (bill_id 있을 때)
  let bill: { id: string; title: string; status: string | null } | null = null
  if (vote.bill_id) {
    const { data } = await supabase
      .from('bills')
      .select('id, title, status')
      .eq('id', vote.bill_id)
      .maybeSingle()
    bill = data
  }

  const total = (vote.yes_count ?? 0) + (vote.no_count ?? 0) + (vote.abstain_count ?? 0) + (vote.absent_count ?? 0)
  const resultColor = RESULT_COLORS[vote.result ?? ''] ?? '#AAAAAA'

  // 정당별 집계
  const partyMap = new Map<string, Record<string, number>>()
  for (const mv of memberVotes) {
    const party = mv.members?.party ?? '무소속'
    if (!partyMap.has(party)) partyMap.set(party, { 찬성: 0, 반대: 0, 기권: 0, 불참: 0 })
    const rec = partyMap.get(party)!
    rec[mv.stance] = (rec[mv.stance] ?? 0) + 1
  }
  const partyRows = Array.from(partyMap.entries())
    .sort((a, b) => {
      const aTotal = Object.values(a[1]).reduce((s, n) => s + n, 0)
      const bTotal = Object.values(b[1]).reduce((s, n) => s + n, 0)
      return bTotal - aTotal
    })

  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 80px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Link href="/votes" style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          표결 목록으로 돌아가기
        </Link>

        {/* 헤더 */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {vote.result && (
              <span style={{
                padding: '3px 12px', borderRadius: 20,
                fontSize: 12, fontWeight: 600,
                background: `${resultColor}18`, color: resultColor,
              }}>
                {vote.result}
              </span>
            )}
            {vote.voted_at && (
              <span style={{ fontSize: 13, color: 'var(--t3)' }}>
                {formatDate(vote.voted_at)}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--t1)', lineHeight: 1.5, margin: 0 }}>
            {vote.title}
          </h1>
        </div>

        {/* 찬반 집계 */}
        {total > 0 && (
          <section style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { label: '찬성', value: vote.yes_count ?? 0, color: '#3D6DB5' },
                { label: '반대', value: vote.no_count ?? 0, color: '#C0392B' },
                { label: '기권', value: vote.abstain_count ?? 0, color: '#F5A623' },
                { label: '불참', value: vote.absent_count ?? 0, color: '#AAAAAA' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: '12px 20px', border: '1px solid var(--bd)', borderRadius: 8, background: '#fff', minWidth: 72 }}>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-serif)', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* 비율 바 */}
            <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--ivd)' }}>
              {[
                { value: vote.yes_count ?? 0, color: '#3D6DB5' },
                { value: vote.no_count ?? 0, color: '#C0392B' },
                { value: vote.abstain_count ?? 0, color: '#F5A623' },
                { value: vote.absent_count ?? 0, color: '#AAAAAA' },
              ].map((s, i) => {
                const pct = total > 0 ? (s.value / total) * 100 : 0
                return pct > 0 ? (
                  <div key={i} style={{ width: `${pct}%`, background: s.color }} />
                ) : null
              })}
            </div>
          </section>
        )}

        {/* 관련 법안 */}
        {bill && (
          <section style={{ marginBottom: 32, padding: '16px 20px', border: '1px solid var(--bd)', borderRadius: 10, background: '#fff' }}>
            <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              관련 법안
            </h2>
            <Link href={`/bills/${bill.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <StatusBadge status={bill.status ?? '계류'} size="sm" />
              <span style={{ fontSize: 14, color: 'var(--t1)', lineHeight: 1.5 }}>{bill.title}</span>
            </Link>
          </section>
        )}

        {/* 정당별 표결 */}
        {partyRows.length > 0 && (
          <section style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 14 }}>정당별 표결</h2>
            <div style={{ border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--ivd)' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--t3)', fontWeight: 600 }}>정당</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#3D6DB5', fontWeight: 600 }}>찬성</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#C0392B', fontWeight: 600 }}>반대</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#F5A623', fontWeight: 600 }}>기권</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', color: '#AAAAAA', fontWeight: 600 }}>불참</th>
                  </tr>
                </thead>
                <tbody>
                  {partyRows.map(([party, counts], i) => (
                    <tr key={party} style={{ borderTop: '1px solid var(--bd)', background: i % 2 === 0 ? '#fff' : 'transparent' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <PartyBadge party={party} size="sm" />
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: counts['찬성'] > 0 ? '#3D6DB5' : 'var(--t3)', fontWeight: counts['찬성'] > 0 ? 600 : 400 }}>
                        {counts['찬성'] || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: counts['반대'] > 0 ? '#C0392B' : 'var(--t3)', fontWeight: counts['반대'] > 0 ? 600 : 400 }}>
                        {counts['반대'] || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: counts['기권'] > 0 ? '#F5A623' : 'var(--t3)', fontWeight: counts['기권'] > 0 ? 600 : 400 }}>
                        {counts['기권'] || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: 'var(--t3)' }}>
                        {counts['불참'] || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 의원별 표결 탭 */}
        {memberVotes.length > 0 && (
          <VoteDetailTabs memberVotes={memberVotes} />
        )}
      </div>
    </main>
  )
}
