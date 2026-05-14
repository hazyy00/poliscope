'use client'

import { useState } from 'react'

interface Personas {
  worker: string
  selfemployed: string
  student: string
}

interface Props {
  personas: Personas
}

const TABS = [
  { id: 'worker', label: '직장인' },
  { id: 'selfemployed', label: '자영업자' },
  { id: 'student', label: '학생' },
] as const

export function PersonaTabs({ personas }: Props) {
  const [active, setActive] = useState<keyof Personas>('worker')

  return (
    <div>
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--bd)', marginBottom: 12 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            style={{
              padding: '8px 14px',
              fontSize: 13,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: active === t.id ? 'var(--bk)' : 'var(--t3)',
              borderBottom: active === t.id ? '2px solid var(--bk)' : '2px solid transparent',
              fontWeight: active === t.id ? 600 : 400,
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p style={{ fontSize: 14, color: 'var(--t2)', lineHeight: 1.6 }}>
        {personas[active]}
      </p>
    </div>
  )
}
