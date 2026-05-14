import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase'
import { REGIONS_DATA } from '@/lib/regions'
import { PartyBadge } from '@/components/ui/PartyBadge'
import { MemberCard } from '@/components/members/MemberCard'

interface Props {
  params: Promise<{ name: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params
  const decodedName = decodeURIComponent(name)
  const regionData = REGIONS_DATA.find(r => r.name === decodedName)
  if (!regionData) return { title: '지역 — PoliScope' }
  return {
    title: `${decodedName} — PoliScope`,
    description: `22대 총선 ${decodedName} 의석 현황: ${regionData.party} ${regionData.seats} (${regionData.rate})`,
  }
}

export default async function RegionPage({ params }: Props) {
  const { name } = await params
  const decodedName = decodeURIComponent(name)

  const regionData = REGIONS_DATA.find(r => r.name === decodedName)
  if (!regionData) notFound()

  const supabase = createServerClient()
  const { data: members } = await supabase
    .from('members')
    .select('id, name, party, district, is_pr, photo_url, committee')
    .ilike('district', `%${regionData.short}%`)
    .eq('is_pr', false)
    .order('district')

  const [won, total] = regionData.rate.split('/').map(Number)
  const wonPct = Math.round((won / total) * 100)

  // Compute per-party seat counts from member list
  const partyCounts: Record<string, number> = {}
  for (const m of members ?? []) {
    const p = m.party ?? '무소속'
    partyCounts[p] = (partyCounts[p] ?? 0) + 1
  }
  const partyBreakdown = Object.entries(partyCounts).sort((a, b) => b[1] - a[1])

  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', paddingTop: 80, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Back */}
        <Link
          href="/"
          style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          지도로 돌아가기
        </Link>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontFamily: 'var(--font-serif), serif', fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 500, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>
              {decodedName}
            </h1>
            <PartyBadge party={regionData.party} />
          </div>
          <p style={{ fontSize: 14, color: 'var(--t3)', margin: 0 }}>
            22대 총선 · 총 {total}석 중 {regionData.seats} ({regionData.party} 기준)
          </p>
        </div>

        {/* Party breakdown */}
        <div style={{ marginBottom: 52, padding: '20px 24px', background: 'white', borderRadius: 12, border: '1px solid var(--bd)' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t3)', marginBottom: 14, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            의석 분포
          </div>

          {/* Bar */}
          <div style={{ height: 10, borderRadius: 5, background: 'var(--ivd)', overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ height: '100%', width: `${wonPct}%`, background: regionData.color, borderRadius: 5 }} />
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {partyBreakdown.length > 0 ? partyBreakdown.map(([party, count]) => (
              <div key={party} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t2)' }}>
                <PartyBadge party={party} size="sm" />
                <span style={{ color: 'var(--t3)' }}>{count}석</span>
              </div>
            )) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: regionData.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ color: 'var(--t2)' }}>{regionData.party}</span>
                  <span style={{ color: 'var(--t3)' }}>{won}석</span>
                </div>
                {won < total && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--ivd)', border: '1px solid var(--bd)', display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ color: 'var(--t2)' }}>기타</span>
                    <span style={{ color: 'var(--t3)' }}>{total - won}석</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Governor / Mayor */}
        <div style={{ marginBottom: 52 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', margin: '0 0 16px' }}>
            {regionData.governor.title}
          </h2>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20,
            padding: '20px 24px',
            background: 'white', borderRadius: 12, border: '1px solid var(--bd)',
            maxWidth: 420,
          }}>
            {/* Avatar */}
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: `${regionData.governor.party === '더불어민주당' ? '#3D6DB5' : regionData.governor.party === '국민의힘' ? '#C0392B' : '#888888'}22`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 400, color: 'var(--t2)',
              fontFamily: 'var(--font-serif), serif',
            }}>
              {regionData.governor.name[0]}
            </div>
            {/* Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--t1)', fontFamily: 'var(--font-serif), serif' }}>
                  {regionData.governor.name}
                </span>
                <span style={{ fontSize: 12, color: 'var(--t3)' }}>{regionData.governor.title}</span>
              </div>
              <PartyBadge party={regionData.governor.party} size="sm" />
              <span style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{regionData.governor.term}</span>
            </div>
          </div>
        </div>

        {/* Member grid */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>지역구 의원</h2>
            <span style={{ fontSize: 13, color: 'var(--t3)' }}>{members?.length ?? 0}명</span>
          </div>

          {members && members.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {members.map(m => {
                const districtLabel = m.district
                  ?.replace(new RegExp(`^${regionData.short}\\s*`), '')
                  .trim() ?? m.district ?? '—'
                return (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 11, color: 'var(--t3)', paddingLeft: 2, letterSpacing: '0.02em', fontWeight: 500 }}>
                      {districtLabel || m.district}
                    </div>
                    <MemberCard
                      id={m.id}
                      name={m.name}
                      party={m.party}
                      district={m.district}
                      is_pr={m.is_pr}
                      photo_url={m.photo_url}
                      committee={m.committee}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--t3)', padding: '60px 0', fontSize: 14 }}>
              이 지역 지역구 의원 정보가 없습니다.
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
