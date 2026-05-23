'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

export interface StatusCardDef {
  label: string
  value: string
  count: number
  color: string
  bg: string
}

interface Props {
  cards: StatusCardDef[]
  activeStatus: string
  totalCount: number
}

export function BillStatusCards({ cards, activeStatus, totalCount }: Props) {
  const router = useRouter()
  const sp = useSearchParams()
  const [hovered, setHovered] = useState<string | null>(null)

  function handleClick(value: string) {
    const params = new URLSearchParams(sp.toString())
    params.set('status', value)
    params.delete('page')
    router.push(`/bills?${params.toString()}`)
  }

  return (
    <div>
      <button
        onClick={() => handleClick('all')}
        style={{
          padding: '8px 18px', width: '100%', textAlign: 'left',
          border: '0.5px solid var(--bd)', borderBottom: 'none',
          fontSize: 15, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
          cursor: 'pointer', background: 'transparent',
          color: activeStatus === 'all' ? 'var(--t1)' : 'var(--t3)',
          outline: activeStatus === 'all' ? '1.5px solid var(--t1)' : 'none',
          outlineOffset: -1,
        }}
      >
        전체 <span style={{ color: 'var(--t1)' }}>{totalCount.toLocaleString()}</span>건
      </button>
    <div style={{ display: 'flex', border: '0.5px solid var(--bd)' }}>
      {cards.map((card, i) => {
        const isActive = activeStatus === card.value
        const isHovered = hovered === card.value
        return (
          <button
            key={card.value}
            onClick={() => handleClick(card.value)}
            onMouseEnter={() => setHovered(card.value)}
            onMouseLeave={() => setHovered(null)}
            style={{
              flex: 1,
              padding: '12px 18px',
              background: isActive ? card.bg : isHovered ? 'color-mix(in srgb, var(--bd) 40%, transparent)' : 'transparent',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 4,
              transition: 'background 0.12s',
              border: 'none',
              borderRight: i < cards.length - 1 ? '0.5px solid var(--bd)' : 'none',
              outline: isActive ? `1.5px solid ${card.color}` : 'none',
              outlineOffset: -1,
            }}
          >
            <span style={{
              fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
              color: isActive ? card.color : 'var(--t3)',
              fontWeight: isActive ? 500 : 400,
            }}>
              {card.label}
            </span>
            <span style={{
              fontFamily: 'var(--font-serif)', fontWeight: 400,
              fontSize: 20, letterSpacing: '-0.02em',
              color: isActive ? card.color : 'var(--t2)',
            }}>
              {card.count.toLocaleString()}
            </span>
          </button>
        )
      })}
    </div>
    </div>
  )
}
