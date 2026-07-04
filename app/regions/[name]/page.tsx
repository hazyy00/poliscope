import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase'
import { REGIONS_DATA } from '@/lib/regions'
import { PartyBadge } from '@/components/ui/PartyBadge'
import { MemberCard } from '@/components/members/MemberCard'
import { MemberPhoto } from '@/components/members/MemberPhoto'
import { DistrictMap } from '@/components/map/DistrictMap'

interface Props {
  params: Promise<{ name: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { name } = await params
  let decodedName: string
  try { decodedName = decodeURIComponent(name) } catch { return { title: '지역 | PoliScope' } }
  const regionData = REGIONS_DATA.find(r => r.name === decodedName)
  if (!regionData) return { title: '지역 | PoliScope' }
  return {
    title: `${decodedName} | PoliScope`,
    description: `22대 총선 ${decodedName} 의석 현황: ${regionData.party} ${regionData.seats} (${regionData.rate})`,
  }
}

export default async function RegionPage({ params }: Props) {
  const { name } = await params
  let decodedName: string
  try { decodedName = decodeURIComponent(name) } catch { notFound() }

  const regionData = REGIONS_DATA.find(r => r.name === decodedName)
  if (!regionData) notFound()

  const supabase = createServerClient()
  const shorts = regionData.queryShorts ?? [regionData.short]
  // prefix 매칭이어야 함 — '%광주%'는 '경기 광주시갑'까지 잡는다
  const districtFilter = shorts.map(s => `district.ilike.${s}%`).join(',')
  const { data: members } = await supabase
    .from('members')
    .select('id, name, party, district, is_pr, photo_url, committee')
    .or(districtFilter)
    .eq('is_pr', false)
    .order('district')

  const [won, total] = regionData.rate.split('/').map(Number)
  const wonPct = total > 0 ? Math.round((won / total) * 100) : 0

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

        {/* Northern province notice */}
        {regionData.is_northern && (
          <div style={{ marginBottom: 40, padding: '16px 20px', background: 'var(--ivd)', borderRadius: 10, fontSize: 13, color: 'var(--t3)', lineHeight: 1.7 }}>
            이북5도는 국회 지역구가 없습니다. 도지사는 대통령이 임명하는 차관급 정무직입니다.
          </div>
        )}

        {/* Party breakdown */}
        {!regionData.is_northern && (
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
        )}

        {/* District map */}
        <div style={{ marginBottom: 52, padding: '20px 24px', background: 'white', borderRadius: 12, border: '1px solid var(--bd)' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t3)', marginBottom: 16, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            지역구 지도
          </div>
          <DistrictMap
            regionName={decodedName}
            regionShort={regionData.short}
            regionShorts={regionData.queryShorts}
            members={(members ?? []).map(m => ({
              id: m.id,
              name: m.name,
              party: m.party,
              district: m.district,
            }))}
          />
        </div>

        {/* Governor / Mayor */}
        <div style={{ marginBottom: 52 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', margin: '0 0 16px' }}>
            {regionData.governor.title}
          </h2>
          <div style={{ width: 180 }}>
            <Link
              href={`/governors/${regionData.governor.slug}`}
              style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
            >
              <div style={{
                display: 'flex', flexDirection: 'column',
                background: 'white', border: '1px solid var(--bd)',
                borderRadius: 10, overflow: 'hidden',
                transition: 'box-shadow 0.15s',
              }}>
                {/* Photo */}
                <div style={{ position: 'relative', aspectRatio: '3/4', background: 'var(--ivd)' }}>
                  <MemberPhoto src={regionData.governor.photo_url} name={regionData.governor.name} sizes="180px" />
                </div>
                {/* Info */}
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--t1)' }}>{regionData.governor.name}</div>
                  <PartyBadge party={regionData.governor.party} size="sm" />
                  <div style={{ fontSize: 12, color: 'var(--t3)' }}>{regionData.governor.term}</div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Member grid */}
        {!regionData.is_northern && <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', margin: 0 }}>지역구 의원</h2>
            <span style={{ fontSize: 13, color: 'var(--t3)' }}>{members?.length ?? 0}명</span>
          </div>

          {members && members.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {members.map(m => {
                const prefixPattern = shorts.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
                const districtLabel = m.district
                  ?.replace(new RegExp(`^(${prefixPattern})\\s*`), '')
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
        </div>}
      </div>
    </main>
  )
}
