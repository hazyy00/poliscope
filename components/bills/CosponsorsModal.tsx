'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export interface Cosponsor {
  member_id: string
  members: {
    name: string
    party: string | null
    photo_url: string | null
  } | null
}

interface Props {
  cosponsors: Cosponsor[]
  totalCount: number
}

export function CosponsorsModal({ cosponsors, totalCount }: Props) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearLeave = useCallback(() => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
  }, [])

  const scheduleClose = useCallback(() => {
    leaveTimer.current = setTimeout(() => setOpen(false), 120)
  }, [])

  function handleBtnEnter() {
    clearLeave()
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 8, left: r.left })
    }
    setOpen(true)
  }

  return (
    <div style={{ marginBottom: 48 }}>
      <button
        ref={btnRef}
        onMouseEnter={handleBtnEnter}
        onMouseLeave={scheduleClose}
        style={{
          fontSize: 11, fontWeight: 600, color: open ? 'var(--t1)' : 'var(--t3)',
          textTransform: 'uppercase', letterSpacing: '0.05em',
          background: open ? 'var(--ivd)' : 'none',
          border: 'none', cursor: 'pointer',
          padding: '4px 8px', borderRadius: 4, margin: '-4px -8px',
          display: 'inline-flex', alignItems: 'center', gap: 5,
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        공동발의 ({totalCount}명)
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ opacity: 0.5 }}>
          <path d="M1.5 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && pos && (
        <div
          onMouseEnter={clearLeave}
          onMouseLeave={scheduleClose}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            background: 'var(--iv)',
            border: '0.5px solid var(--bd)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
            width: 560,
            maxHeight: 420,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 16px 10px',
            borderBottom: '0.5px solid var(--bd)',
            fontSize: 11, fontWeight: 600, color: 'var(--t3)',
            textTransform: 'uppercase', letterSpacing: '0.05em',
            flexShrink: 0,
          }}>
            공동발의 {totalCount}명
          </div>

          {/* Scrollable grid */}
          <div style={{ overflowY: 'auto', padding: '12px 16px 16px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 1fr)',
              gap: '10px 4px',
            }}>
              {cosponsors.map(cs => (
                <Link
                  key={cs.member_id}
                  href={`/members/${cs.member_id}`}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    textDecoration: 'none', color: 'inherit',
                    padding: '6px 2px', borderRadius: 6,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--ivd)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: 'var(--ivd)', flexShrink: 0, position: 'relative' }}>
                    {cs.members?.photo_url ? (
                      <Image src={cs.members.photo_url} alt={cs.members.name ?? ''} fill style={{ objectFit: 'cover' }} sizes="32px" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--t3)' }}>
                        {cs.members?.name?.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--t2)', textAlign: 'center', lineHeight: 1.2, wordBreak: 'keep-all', whiteSpace: 'nowrap' }}>
                    {cs.members?.name}
                  </span>
                </Link>
              ))}
            </div>
            {totalCount > cosponsors.length && (
              <p style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>
                외 {totalCount - cosponsors.length}명 <span style={{ opacity: 0.6 }}>(전직 의원)</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
