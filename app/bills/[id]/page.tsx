import { createServerClient } from '@/lib/supabase'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PartyBadge } from '@/components/ui/PartyBadge'
import { AISummary } from '@/components/bills/AISummary'
import { Cosponsors, type Cosponsor } from '@/components/bills/Cosponsors'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import type { AiSummaryJson } from '@/lib/types'
import { formatDate } from '@/lib/utils'
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
  if (!data) return { title: '법안 — PoliScope' }
  return {
    title: `${data.title} — PoliScope`,
    description: `22대 국회 법안 · ${data.status ?? '계류'}`,
    openGraph: { title: data.title, description: `22대 국회 법안 · ${data.status ?? '계류'}` },
  }
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

  const aiSummary = bill.ai_summary as AiSummaryJson | null

  const STATUS_STEPS = ['계류', '위원회 심사', '본회의 심의', bill.status === '가결' || bill.status === '수정가결' ? bill.status : '가결/부결']
  const currentStep = bill.status === '계류' ? 0 : bill.status === '가결' || bill.status === '수정가결' ? 3 : bill.status === '부결' || bill.status === '폐기' ? 3 : 1

  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 80px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Link href="/bills" style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}>
          ← 법안 목록
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            <StatusBadge status={bill.status ?? '계류'} />
            {bill.committee && <span style={{ fontSize: 13, color: 'var(--t3)' }}>{bill.committee}</span>}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--t1)', lineHeight: 1.4, margin: 0 }}>
            {bill.title}
          </h1>
          <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 13, color: 'var(--t3)', flexWrap: 'wrap' }}>
            {bill.proposed_at && <span>발의일 {formatDate(bill.proposed_at)}</span>}
            {bill.passed_at && <span>의결일 {formatDate(bill.passed_at)}</span>}
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* AI Summary */}
            {aiSummary && bill.ai_confidence && (
              <AISummary summary={aiSummary} confidence={bill.ai_confidence} contentUrl={bill.content_url} />
            )}

            {/* 심사경과 */}
            <section>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 16 }}>심사 경과</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {STATUS_STEPS.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 1 : undefined }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 12, height: 12, borderRadius: '50%',
                        background: i <= currentStep ? 'var(--pu)' : 'var(--ivd)',
                        border: `2px solid ${i <= currentStep ? 'var(--pu)' : 'var(--bd)'}`,
                      }} />
                      <span style={{ fontSize: 11, color: i <= currentStep ? 'var(--pu)' : 'var(--t3)', whiteSpace: 'nowrap' }}>{step}</span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div style={{ flex: 1, height: 2, background: i < currentStep ? 'var(--pu)' : 'var(--bd)', margin: '0 4px', marginBottom: 18 }} />
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Vote summary */}
            {vote && (
              <section>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 12 }}>본회의 표결</h2>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: '찬성', value: vote.yes_count, color: '#3D6DB5' },
                    { label: '반대', value: vote.no_count, color: '#C0392B' },
                    { label: '기권', value: vote.abstain_count, color: '#F5A623' },
                    { label: '불참', value: vote.absent_count, color: '#AAAAAA' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', padding: '12px 20px', border: '1px solid var(--bd)', borderRadius: 8 }}>
                      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-serif)', color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 12, color: 'var(--t3)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 원문 링크 */}
            {bill.content_url && (
              <a
                href={bill.content_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px', borderRadius: 8, border: '1px solid var(--bd)',
                  fontSize: 13, color: 'var(--t2)', textDecoration: 'none', width: 'fit-content',
                }}
              >
                원문 법안 확인하기 →
              </a>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Proposer */}
            {proposer && (
              <section style={{ padding: '16px', border: '1px solid var(--bd)', borderRadius: 10 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  대표발의
                </h3>
                <Link href={`/members/${proposer.id}`} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', background: 'var(--ivd)', flexShrink: 0, position: 'relative' }}>
                    {proposer.photo_url ? (
                      <Image src={proposer.photo_url} alt={proposer.name} fill style={{ objectFit: 'cover' }} sizes="44px" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--t3)' }}>
                        {proposer.name?.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--t1)' }}>{proposer.name}</div>
                    <PartyBadge party={proposer.party} size="sm" />
                  </div>
                </Link>
              </section>
            )}

            {/* Cosponsors */}
            <section style={{ padding: '16px', border: '1px solid var(--bd)', borderRadius: 10 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--t3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                공동발의 ({cosponsors.length}명)
              </h3>
              <Cosponsors cosponsors={cosponsors as unknown as Cosponsor[]} />
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
