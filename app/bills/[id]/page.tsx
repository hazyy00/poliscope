import { createServerClient } from '@/lib/supabase'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PartyBadge } from '@/components/ui/PartyBadge'
import { AISummary } from '@/components/bills/AISummary'
import { Cosponsors, type Cosponsor } from '@/components/bills/Cosponsors'
import { MemberVoteGrid, type MemberVoteRow } from '@/components/bills/MemberVoteGrid'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import type { AiSummaryJson } from '@/lib/types'
import { formatDate, getPartyColor } from '@/lib/utils'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { cache } from 'react'

type Proposer = {
  id: string
  name: string
  party: string | null
  photo_url: string | null
  district: string | null
  is_pr: boolean
}

const getBill = cache(async (id: string) => {
  const supabase = createServerClient()
  return supabase
    .from('bills')
    .select('*, members!bills_proposer_id_fkey(id, name, party, photo_url, district, is_pr)')
    .eq('id', id)
    .eq('is_hidden', false)
    .single()
})

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getBill(id)
  if (!data) return { title: '법안 | PoliScope' }
  return {
    title: `${data.title} | PoliScope`,
    description: `22대 국회 법안 · ${data.status ?? '계류'}`,
    openGraph: { title: data.title, description: `22대 국회 법안 · ${data.status ?? '계류'}` },
  }
}

const TOTAL_SEATS = 286

function SectionHeader({ num, label, en, right }: { num: string; label: string; en: string; right?: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      paddingBottom: 14, borderBottom: '0.5px solid var(--bd)', marginBottom: 22,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span style={{
          fontFamily: 'var(--font-fell)', fontStyle: 'italic',
          fontSize: 13, color: 'var(--pu)',
        }}>{num} · {en}</span>
        <span style={{
          fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400,
          letterSpacing: '-0.015em', color: 'var(--t1)',
        }}>{label}</span>
      </div>
      {right}
    </div>
  )
}

function Timeline({ steps, currentStep }: { steps: string[]; currentStep: number }) {
  const n = steps.length
  // Each dot sits at the center of its equal-width grid column.
  // Dot centers are at (2i+1)/(2n) * 100%, so the connecting line starts
  // at 1/(2n) from the left and ends at 1/(2n) from the right.
  // Progress line width = currentStep/n * 100% (derived from equal-column geometry).
  const edgeOffset = `${100 / (2 * n)}%`
  return (
    <div style={{ border: '0.5px solid var(--bd)', padding: 18, background: 'var(--ivd)' }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)',
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16,
      }}>입법 경로</div>
      <div style={{ position: 'relative' }}>
        {/* Base line: dot-center to dot-center */}
        <div style={{
          position: 'absolute', top: 4,
          left: edgeOffset, right: edgeOffset,
          height: 1, background: 'var(--bd)',
        }} />
        {/* Progress line */}
        <div style={{
          position: 'absolute', top: 4,
          left: edgeOffset,
          width: `${currentStep / n * 100}%`,
          height: 1, background: 'var(--pu)',
        }} />
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                background: i <= currentStep ? 'var(--pu)' : 'var(--iv)',
                border: '1.5px solid var(--pu)',
                position: 'relative', zIndex: 1,
              }} />
              <span style={{
                fontSize: 11, textAlign: 'center', whiteSpace: 'nowrap',
                color: i <= currentStep ? 'var(--t1)' : 'var(--t3)',
                fontWeight: i <= currentStep ? 400 : 300,
              }}>{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function BillDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = createServerClient()

  const [billRes, cosponsorsRes, voteRes] = await Promise.all([
    getBill(id),
    supabase
      .from('bill_cosponsors')
      .select('member_id, members(name, party, photo_url)')
      .eq('bill_id', id),
    supabase
      .from('votes')
      .select('*')
      .eq('bill_id', id)
      .order('voted_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  if (!billRes.data) notFound()
  const bill = billRes.data
  const proposer: Proposer | null = Array.isArray(bill.members) ? (bill.members[0] ?? null) : bill.members
  const cosponsors = cosponsorsRes.data ?? []
  const vote = voteRes.data

  let memberVotes: MemberVoteRow[] = []
  if (vote) {
    const { data } = await supabase
      .from('member_votes')
      .select('stance, members(id, name, party, photo_url, district, term)')
      .eq('vote_id', vote.id)
    memberVotes = (data ?? []) as unknown as MemberVoteRow[]
  }

  const aiSummary = bill.ai_summary as AiSummaryJson | null

  const STATUS_STEPS = ['발의', '위원회 회부', '심사', '본회의 표결']
  const currentStep = bill.status === '계류' ? 1 : bill.status === '가결' || bill.status === '수정가결' || bill.status === '부결' || bill.status === '폐기' ? 3 : 2

  // Party breakdown from member votes
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

  // member_votes가 있으면 개별 기록 합산 (absent_count가 API에서 0으로 수집되는 문제 해결)
  const voteResult = memberVotes.length > 0 ? {
    yes: memberVotes.filter(v => v.stance === '찬성').length,
    no: memberVotes.filter(v => v.stance === '반대').length,
    abstain: memberVotes.filter(v => v.stance === '기권').length,
    absent: memberVotes.filter(v => v.stance === '불참').length,
  } : vote ? {
    yes: vote.yes_count ?? 0,
    no: vote.no_count ?? 0,
    abstain: vote.abstain_count ?? 0,
    absent: vote.absent_count ?? 0,
  } : null

  const billDroppedAfterPass = vote?.result === '가결' && (bill.status === '폐기' || bill.status === '철회')

  const pass = { color: 'var(--st-pass)' } as const
  const fail = { color: 'var(--st-fail)' } as const
  const drop = { color: 'var(--st-drop)' } as const
  const bold = { fontWeight: 500 } as const

  const outcomeLabel: React.ReactNode = (() => {
    if (!vote?.result) return null
    if (billDroppedAfterPass) return <><span style={pass}>가결</span>되었으나 <span style={drop}>폐기</span>되었습니다.</>
    if (vote.result === '가결') return <><span style={pass}>가결</span>되었습니다.</>
    if (vote.result === '부결') return <><span style={fail}>부결</span>되었습니다.</>
    if (vote.result === '폐기') return <><span style={drop}>폐기</span>되었습니다.</>
    return `${vote.result}되었습니다.`
  })()

  const outcomeDesc: React.ReactNode = (() => {
    if (!voteResult || !vote?.result) return null
    const diff = voteResult.yes - voteResult.no
    if (billDroppedAfterPass) return (
      <>찬성이 반대보다 <span style={{ ...pass, ...bold }}>{diff}표</span> 많아 본회의를 통과했으나,{' '}
      <span style={drop}>임기만료로 폐기</span>되었습니다.</>
    )
    if (vote.result === '가결') return (
      <>찬성이 반대보다 <span style={{ ...pass, ...bold }}>{diff}표</span> 많아 본회의를 통과했습니다.</>
    )
    if (vote.result === '부결') return (
      <>반대가 찬성보다 <span style={{ ...fail, ...bold }}>{voteResult.no - voteResult.yes}표</span> 많아 부결되었습니다.</>
    )
    return null
  })()

  const total = voteResult ? voteResult.yes + voteResult.no + voteResult.abstain + voteResult.absent : 0
  const pct = (v: number) => total ? ((v / total) * 100).toFixed(1) : '0.0'

  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 0 80px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 80px' }}>
        <Link
          href="/bills"
          style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 16 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          법안 목록으로 돌아가기
        </Link>
        {/* Header — 2-column */}
        <header style={{
          marginTop: 18, paddingBottom: 30,
          borderBottom: '0.5px solid var(--bd)', marginBottom: 36,
          display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 48,
          alignItems: 'end',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
              <StatusBadge status={bill.status ?? '계류'} />
              {bill.committee && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)', letterSpacing: '0.06em' }}>
                  법안 #{bill.id} · {bill.committee}위원회
                </span>
              )}
            </div>
            <h1 style={{
              fontFamily: 'var(--font-serif)', fontWeight: 300,
              fontSize: 38, margin: 0, letterSpacing: '-0.025em', lineHeight: 1.22,
              color: 'var(--t1)',
            }}>
              {bill.title}
            </h1>
            <div style={{
              marginTop: 18, display: 'flex', alignItems: 'center', gap: 22,
              fontSize: 12, color: 'var(--t2)', flexWrap: 'wrap',
            }}>
              {proposer && (
                <Link href={`/members/${proposer.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', overflow: 'hidden', background: 'var(--ivd)', flexShrink: 0, position: 'relative' }}>
                    {proposer.photo_url ? (
                      <Image src={proposer.photo_url} alt={proposer.name} fill style={{ objectFit: 'cover' }} sizes="20px" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--t3)' }}>
                        {proposer.name?.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <span><span style={{ color: 'var(--t3)' }}>발의 </span>{proposer.name}</span>
                </Link>
              )}
              {proposer && bill.proposed_at && <span style={{ width: 1, height: 10, background: 'var(--bd)', flexShrink: 0 }} />}
              {bill.proposed_at && <span><span style={{ color: 'var(--t3)' }}>발의일 </span>{formatDate(bill.proposed_at)}</span>}
              {bill.passed_at && <><span style={{ width: 1, height: 10, background: 'var(--bd)', flexShrink: 0 }} /><span><span style={{ color: 'var(--t3)' }}>의결일 </span>{formatDate(bill.passed_at)}</span></>}
            </div>
          </div>
          <Timeline steps={STATUS_STEPS} currentStep={currentStep} />
        </header>

        {/* AI Summary */}
        {aiSummary && bill.ai_confidence && (
          <div style={{ marginBottom: 36 }}>
            <AISummary summary={aiSummary} confidence={bill.ai_confidence} contentUrl={bill.content_url} />
          </div>
        )}

        {/* Cosponsors */}
        {cosponsors.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              공동발의 ({cosponsors.length}명)
            </div>
            <Cosponsors cosponsors={cosponsors as unknown as Cosponsor[]} />
          </div>
        )}

        {/* Full-width vote sections */}
        {voteResult && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
            {/* 01. 표결 결과 */}
            <section>
              <SectionHeader num="01" label="표결 결과" en="Vote tally" />
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 40, alignItems: 'start' }}>
                <div>
                  {/* Big numbers */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
                    {[
                      { val: voteResult.yes,     label: '찬성', color: 'var(--pu)',      size: 72 },
                      { val: voteResult.no,      label: '반대', color: 'var(--st-fail)', size: 56 },
                      { val: voteResult.abstain, label: '기권', color: 'var(--t2)',       size: 38 },
                      { val: voteResult.absent,  label: '불참', color: 'var(--t3)',       size: 30 },
                    ].map(({ val, label, color, size }, i, arr) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 300, fontSize: size, letterSpacing: '-0.04em', lineHeight: 1, color }}>{val}</span>
                        <span style={{ fontSize: 13, color: 'var(--t3)' }}>{label}</span>
                        {i < arr.length - 1 && <span style={{ marginLeft: 6, width: 1, height: 28, background: 'var(--bd)', display: 'inline-block', flexShrink: 0, verticalAlign: 'middle' }} />}
                      </div>
                    ))}
                  </div>

                  {/* Bar — 28px */}
                  <div style={{ display: 'flex', height: 28, gap: 2, marginBottom: 6 }}>
                    {voteResult.yes > 0 && (
                      <div style={{ width: `${(voteResult.yes / total) * 100}%`, background: 'var(--pu)', display: 'flex', alignItems: 'center', paddingInline: 8, overflow: 'hidden', minWidth: 2 }}>
                        {voteResult.yes / total > 0.09 && <span style={{ fontSize: 11, color: 'var(--iv)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>찬성 {pct(voteResult.yes)}%</span>}
                      </div>
                    )}
                    {voteResult.no > 0 && (
                      <div style={{ width: `${(voteResult.no / total) * 100}%`, background: 'var(--st-fail)', display: 'flex', alignItems: 'center', paddingInline: 8, overflow: 'hidden', minWidth: 2 }}>
                        {voteResult.no / total > 0.09 && <span style={{ fontSize: 11, color: 'var(--iv)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>반대 {pct(voteResult.no)}%</span>}
                      </div>
                    )}
                    {voteResult.abstain > 0 && (
                      <div style={{ width: `${(voteResult.abstain / total) * 100}%`, background: 'rgba(138,132,120,0.55)', display: 'flex', alignItems: 'center', paddingInline: 6, overflow: 'hidden', minWidth: 2 }}>
                        {voteResult.abstain / total > 0.07 && <span style={{ fontSize: 10, color: 'var(--iv)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>기 {pct(voteResult.abstain)}%</span>}
                      </div>
                    )}
                    {voteResult.absent > 0 && (
                      <div style={{ width: `${(voteResult.absent / total) * 100}%`, background: 'rgba(100,95,88,0.22)', border: '0.5px solid rgba(100,95,88,0.3)', display: 'flex', alignItems: 'center', paddingInline: 8, overflow: 'hidden', minWidth: 2 }}>
                        {voteResult.absent / total > 0.07 && <span style={{ fontSize: 10, color: 'var(--t2)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>불참 {pct(voteResult.absent)}%</span>}
                      </div>
                    )}
                  </div>

                  {/* Bar legend below */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 10, flexWrap: 'wrap' }}>
                    {[
                      { label: '찬성', bg: 'var(--pu)', pctVal: pct(voteResult.yes) },
                      { label: '반대', bg: 'var(--st-fail)', pctVal: pct(voteResult.no) },
                      ...(voteResult.abstain > 0 ? [{ label: '기권', bg: 'rgba(138,132,120,0.55)', pctVal: pct(voteResult.abstain) }] : []),
                      ...(voteResult.absent > 0 ? [{ label: '불참', bg: 'rgba(100,95,88,0.22)', pctVal: pct(voteResult.absent) }] : []),
                    ].map(({ label, bg, pctVal }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <div style={{ width: 8, height: 8, background: bg, flexShrink: 0, border: label === '불참' ? '0.5px solid rgba(100,95,88,0.3)' : 'none' }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)' }}>{label} {pctVal}%</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--t3)', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>재적 {TOTAL_SEATS}명 · 참석 {total - voteResult.absent}명 · 불참 {voteResult.absent}명</span>
                    <span>의결정족수 {Math.ceil(TOTAL_SEATS / 2)}명 (재적 1/2)</span>
                  </div>
                </div>

                {/* Outcome card */}
                {outcomeLabel && (
                  <div style={{
                    border: '0.5px solid var(--bd)', padding: 22,
                    background: 'var(--ivd)',
                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    minHeight: 140,
                  }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-fell)', fontStyle: 'italic', fontSize: 13, color: 'var(--pu)', marginBottom: 6 }}>Outcome</div>
                      <div style={{
                        fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300,
                        letterSpacing: '-0.025em', lineHeight: 1.3,
                        color: 'var(--t1)', wordBreak: 'keep-all',
                      }}>
                        {outcomeLabel}
                      </div>
                      {outcomeDesc && (
                        <div style={{ fontSize: 13, color: 'var(--t2)', marginTop: 8 }}>{outcomeDesc}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 02. 정당별 표결 */}
            {partyRows.length > 0 && (
              <section>
                <SectionHeader num="02" label="정당별 표결" en="By party" />
                <div style={{ border: '0.5px solid var(--bd)' }}>
                  {partyRows.map(([party, counts], idx) => {
                    const partyTotal = Object.values(counts).reduce((s, n) => s + n, 0)
                    const pc = getPartyColor(party)
                    return (
                      <div key={party} style={{
                        display: 'grid',
                        gridTemplateColumns: '170px 1fr 200px',
                        alignItems: 'center', gap: 24,
                        padding: '16px 22px',
                        borderBottom: idx < partyRows.length - 1 ? '0.5px solid var(--bd)' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: pc, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 14, color: 'var(--t1)' }}>{party}</div>
                            <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--font-mono)' }}>{partyTotal}명</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', height: 12, gap: 1, background: 'rgba(26,25,22,.05)' }}>
                          {counts['찬성'] > 0 && <div style={{ width: `${(counts['찬성'] / partyTotal) * 100}%`, background: 'var(--pu)' }} />}
                          {counts['반대'] > 0 && <div style={{ width: `${(counts['반대'] / partyTotal) * 100}%`, background: 'var(--st-fail)' }} />}
                          {counts['기권'] > 0 && <div style={{ width: `${(counts['기권'] / partyTotal) * 100}%`, background: 'rgba(138,132,120,0.55)' }} />}
                          {counts['불참'] > 0 && <div style={{ width: `${(counts['불참'] / partyTotal) * 100}%`, background: 'rgba(26,25,22,.06)', borderTop: '1px dashed rgba(26,25,22,0.2)' }} />}
                        </div>
                        <div style={{ display: 'flex', gap: 14, justifyContent: 'flex-end', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                          <span style={{ color: 'var(--pu)' }}>{counts['찬성'] ?? 0}</span>
                          <span style={{ color: 'var(--st-fail)' }}>{counts['반대'] ?? 0}</span>
                          <span style={{ color: 'var(--t1)' }}>{counts['기권'] ?? 0}</span>
                          <span style={{ color: 'var(--t3)' }}>{counts['불참'] ?? 0}</span>
                        </div>
                      </div>
                    )
                  })}
                  {/* Footer key */}
                  <div style={{
                    display: 'flex', justifyContent: 'flex-end', gap: 24,
                    padding: '10px 22px', borderTop: '0.5px solid var(--bd)',
                    background: 'var(--ivd)',
                    fontSize: 10, color: 'var(--t3)', letterSpacing: '0.06em',
                    fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                  }}>
                    <span>찬</span><span>반</span><span>기</span><span>불참</span>
                  </div>
                </div>
              </section>
            )}

            {/* 03. 의원별 표결 기록 */}
            {memberVotes.length > 0 && (
              <MemberVoteGrid memberVotes={memberVotes} />
            )}
          </div>
        )}

        {/* No vote: show original bill link */}
        {!voteResult && bill.content_url && (
          <a
            href={bill.content_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', border: '0.5px solid var(--bd)',
              fontSize: 13, color: 'var(--t2)', textDecoration: 'none',
            }}
          >
            원문 법안 확인하기 →
          </a>
        )}
      </div>
    </main>
  )
}
