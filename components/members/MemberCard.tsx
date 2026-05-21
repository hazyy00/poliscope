'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { PartyBadge } from '@/components/ui/PartyBadge'
import type { Member } from '@/lib/types'

type Props = Pick<Member, 'id' | 'name' | 'party' | 'district' | 'is_pr' | 'photo_url' | 'committee'>

export function MemberCard({ id, name, party, district, is_pr, photo_url, committee }: Props) {
  const resolvedPhoto = photo_url ?? `https://www.assembly.go.kr/static/portal/img/openassm/${id}.jpg`
  const [imgError, setImgError] = useState(false)

  return (
    <Link
      href={`/members/${id}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--iv)',
        border: '1px solid var(--bd)',
        borderRadius: 10,
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
      }}
      className="hover-card"
    >
      {/* Photo */}
      <div style={{ position: 'relative', aspectRatio: '3/4', background: 'var(--ivd)' }}>
        {!imgError ? (
          <Image
            src={resolvedPhoto}
            alt={name}
            fill
            style={{ objectFit: 'cover', objectPosition: 'top' }}
            sizes="200px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 300, color: 'var(--t3)', fontFamily: 'var(--font-serif), serif' }}>
            {name[0]}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--t1)' }}>{name}</div>
        <PartyBadge party={party} size="sm" />
        <div style={{ fontSize: 12, color: 'var(--t3)' }}>
          {is_pr ? '비례대표' : (district ?? '—')}
        </div>
        {committee && committee.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 'auto', paddingTop: 4 }}>
            {committee[0]}
          </div>
        )}
      </div>
    </Link>
  )
}
