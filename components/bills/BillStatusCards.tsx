'use client'

import { useRouter, useSearchParams } from 'next/navigation'

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
}

export function BillStatusCards({ cards, activeStatus }: Props) {
  const router = useRouter()
  const sp = useSearchParams()

  function handleClick(value: string) {
    const params = new URLSearchParams(sp.toString())
    if (value) {
      params.set('status', value)
    } else {
      params.delete('status')
    }
    params.delete('page')
    router.push(`/bills?${params.toString()}`)
  }

  return (
    <div style={{ display: 'flex', border: '0.5px solid var(--bd)' }}>
      {cards.map((card, i) => {
        const isActive = activeStatus === card.value
        const isAll = card.value === ''
        return (
          <button
            key={card.value}
            onClick={() => handleClick(card.value)}
            style={{
              flex: 1,
              padding: '12px 18px',
              background: isActive ? (isAll ? 'var(--bk)' : card.bg) : 'transparent',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
              gap: 4,
              transition: 'background 0.15s',
              border: 'none',
              borderRight: i < cards.length - 1 ? '0.5px solid var(--bd)' : 'none',
            }}
          >
            <span style={{
              fontSize: 10, letterSpacing: '0.06em',
              color: isActive && isAll ? 'rgba(247,245,242,0.55)' : 'var(--t3)',
            }}>
              {card.label}
            </span>
            <span style={{
              fontFamily: 'var(--font-serif)', fontWeight: 400,
              fontSize: 20, letterSpacing: '-0.02em',
              color: isActive ? (isAll ? 'var(--iv)' : card.color) : 'var(--t1)',
            }}>
              {card.count.toLocaleString()}
            </span>
          </button>
        )
      })}
    </div>
  )
}
