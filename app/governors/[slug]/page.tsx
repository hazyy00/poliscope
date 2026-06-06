import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { REGIONS_DATA } from '@/lib/regions'
import { PartyBadge } from '@/components/ui/PartyBadge'
import { MemberPhoto } from '@/components/members/MemberPhoto'

interface Props {
  params: Promise<{ slug: string }>
}

function findRegionBySlug(slug: string) {
  return REGIONS_DATA.find(r => r.governor.slug === slug) ?? null
}

export async function generateStaticParams() {
  return REGIONS_DATA.map(r => ({ slug: r.governor.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const region = findRegionBySlug(slug)
  if (!region) return { title: '지방자치단체장 | PoliScope' }
  const { governor } = region
  return {
    title: `${governor.name} ${governor.title} | PoliScope`,
    description: `${region.name} ${governor.title} ${governor.name} · ${governor.party ?? '—'} · ${governor.term}`,
    openGraph: {
      title: `${governor.name} ${governor.title} 프로필`,
      description: `${region.name} ${governor.title} · ${governor.party ?? '—'} · ${governor.term}`,
    },
  }
}

export default async function GovernorPage({ params }: Props) {
  const { slug } = await params
  const region = findRegionBySlug(slug)
  if (!region) notFound()

  const { governor } = region
  const [won, total] = region.rate.split('/').map(Number)
  const wonPct = total > 0 ? Math.round((won / total) * 100) : 0

  return (
    <main style={{ minHeight: '100vh', background: 'var(--iv)', padding: '80px 24px 80px' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>

        {/* Back */}
        <Link
          href={`/regions/${encodeURIComponent(region.name)}`}
          style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {region.name}으로 돌아가기
        </Link>

        {/* Profile header */}
        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32, marginBottom: 48, alignItems: 'start' }}>
          <div style={{ borderRadius: 12, overflow: 'hidden', background: 'var(--ivd)', aspectRatio: '3/4', position: 'relative', flexShrink: 0 }}>
            <MemberPhoto src={governor.photo_url} name={governor.name} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 8 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--t3)', marginBottom: 6, letterSpacing: '0.04em' }}>
                {region.name} {governor.title}
              </div>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--t1)', margin: 0, letterSpacing: '-0.02em' }}>
                {governor.name}
              </h1>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <PartyBadge party={governor.party} />
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 20, fontSize: 12, color: 'var(--t2)', border: '1px solid var(--bd)' }}>
                {governor.title}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              <div style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--t2)' }}>
                <span style={{ color: 'var(--t3)', minWidth: 60 }}>임기</span>
                <span>{governor.term}</span>
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--t2)' }}>
                <span style={{ color: 'var(--t3)', minWidth: 60 }}>관할 지역</span>
                <Link href={`/regions/${encodeURIComponent(region.name)}`} style={{ color: 'var(--t1)', textDecoration: 'none', fontWeight: 500 }}>
                  {region.name}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Region overview */}
        {!region.is_northern && (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--bd)', padding: '24px 28px', marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--t3)', marginBottom: 16, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              지역 국회 의석 현황 (22대)
            </div>

            <div style={{ display: 'flex', gap: 32, marginBottom: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)' }}>
                  {region.seats}
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>{region.party} 의석</div>
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)' }}>
                  {wonPct}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>지역구 점유율</div>
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--t1)' }}>
                  {total}석
                </div>
                <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 2 }}>전체 지역구</div>
              </div>
            </div>

            {/* Bar */}
            <div style={{ height: 8, borderRadius: 4, background: 'var(--ivd)', overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${wonPct}%`, background: region.color, borderRadius: 4 }} />
            </div>

            <Link
              href={`/regions/${encodeURIComponent(region.name)}`}
              style={{ fontSize: 13, color: 'var(--t3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              지역 상세 보기
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 6h6M6 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        )}

        {/* Northern province note */}
        {region.is_northern && (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--bd)', padding: '24px 28px' }}>
            <div style={{ fontSize: 13, color: 'var(--t2)', lineHeight: 1.8 }}>
              이북5도 도지사는 대통령이 임명하는 차관급 정무직입니다. 국회 지역구는 없으며, 이북5도위원회를 통해 실향민 지원 업무를 담당합니다.
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
