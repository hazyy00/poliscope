'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PartyBadge } from '@/components/ui/PartyBadge'

export interface MemberVoteRow {
  stance: string
  members: {
    id: string
    name: string
    party: string | null
    photo_url: string | null
  } | null
}

interface Props {
  memberVotes: MemberVoteRow[]
}

const STANCES = ['찬성', '반대', '기권', '불참'] as const
const STANCE_COLOR: Record<string, string> = {
  '찬성': '#3D6DB5',
  '반대': '#C0392B',
  '기권': '#F5A623',
  '불참': '#AAAAAA',
}

export default function VoteDetailTabs({ memberVotes }: Props) {
  const [active, setActive] = useState<string>('찬성')

  const grouped = memberVotes.reduce<Record<string, MemberVoteRow[]>>((acc, v) => {
    if (!acc[v.stance]) acc[v.stance] = []
    acc[v.stance].push(v)
    return acc
  }, {})

  const list = grouped[active] ?? []

  return (
    <section>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--t1)', marginBottom: 14 }}>의원별 표결</h2>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {STANCES.filter(s => (grouped[s]?.length ?? 0) > 0).map(s => {
          const color = STANCE_COLOR[s]
          const isActive = active === s
          return (
            <button
              key={s}
              onClick={() => setActive(s)}
              style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? color : 'transparent',
                color: isActive ? '#fff' : 'var(--t2)',
                border: `1px solid ${isActive ? color : 'var(--bd)'}`,
                cursor: 'pointer',
              }}
            >
              {s} {grouped[s]?.length ?? 0}
            </button>
          )
        })}
      </div>

      {/* 의원 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
        {list.map((v, i) => {
          const m = v.members
          if (!m) return null
          return (
            <Link
              key={`${m.id}-${i}`}
              href={`/members/${m.id}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                border: '1px solid var(--bd)', textDecoration: 'none',
                background: '#fff',
              }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: 'var(--ivd)', flexShrink: 0, position: 'relative' }}>
                {m.photo_url ? (
                  <Image src={m.photo_url} alt={m.name} fill style={{ objectFit: 'cover', objectPosition: 'top' }} sizes="32px" />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'var(--t3)' }}>
                    {m.name[0]}
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {m.name}
                </div>
                <PartyBadge party={m.party} size="sm" />
              </div>
            </Link>
          )
        })}
      </div>

      {list.length === 0 && (
        <p style={{ color: 'var(--t3)', fontSize: 14 }}>표결 데이터가 없습니다.</p>
      )}
    </section>
  )
}
