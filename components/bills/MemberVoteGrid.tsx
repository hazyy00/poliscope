'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { PartyBadge } from '@/components/ui/PartyBadge'
import { getPartyColor, hexToRgba } from '@/lib/utils'

export interface MemberVoteRow {
  stance: string
  members: {
    id: string
    name: string
    party: string | null
    photo_url: string | null
    district: string | null
    term: number | null
  } | null
}

interface Props {
  memberVotes: MemberVoteRow[]
}

const STANCES = ['전체', '찬성', '반대', '기권', '불참'] as const
type Stance = typeof STANCES[number]

const SORT_MODES = ['정당', '지역', '이탈순'] as const
type SortMode = typeof SORT_MODES[number]

const STANCE_COLOR: Record<string, string> = {
  '찬성': '#4A3F8F',
  '반대': '#A8362A',
  '기권': '#8A6A1F',
  '불참': '#8A8478',
}

function computePartyMajority(votes: MemberVoteRow[]): Map<string, string> {
  const partyStanceCounts = new Map<string, Record<string, number>>()
  for (const v of votes) {
    if (!v.members || v.stance === '불참') continue
    const party = v.members.party ?? '무소속'
    if (!partyStanceCounts.has(party)) partyStanceCounts.set(party, { 찬성: 0, 반대: 0, 기권: 0 })
    const rec = partyStanceCounts.get(party)!
    rec[v.stance] = (rec[v.stance] ?? 0) + 1
  }
  const majority = new Map<string, string>()
  for (const [party, counts] of partyStanceCounts.entries()) {
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (best) majority.set(party, best[0])
  }
  return majority
}

export function MemberVoteGrid({ memberVotes }: Props) {
  const [activeStance, setActiveStance] = useState<Stance>('전체')
  const [sortMode, setSortMode] = useState<SortMode>('정당')
  // selectedId: shared between dot-click and list-click (mutually exclusive)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // hoveredId: dot hover only (for tooltip)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  // listHoveredId: list row hover only (for 자세히보기 visibility)
  const [listHoveredId, setListHoveredId] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; v: MemberVoteRow } | null>(null)

  const sectionRef = useRef<HTMLElement>(null)
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map())

  // Click outside section → deselect (capture phase runs before React synthetic events)
  useEffect(() => {
    function handleCapture(e: MouseEvent) {
      if (sectionRef.current && !sectionRef.current.contains(e.target as Node)) {
        setSelectedId(null)
      }
    }
    window.addEventListener('mousedown', handleCapture, true)
    return () => window.removeEventListener('mousedown', handleCapture, true)
  }, [])

  const partyMajority = computePartyMajority(memberVotes)

  const filtered = activeStance === '전체'
    ? memberVotes
    : memberVotes.filter(v => v.stance === activeStance)

  function sortVotes(votes: MemberVoteRow[]): MemberVoteRow[] {
    const byName = (a: MemberVoteRow, b: MemberVoteRow) =>
      (a.members?.name ?? '').localeCompare(b.members?.name ?? '', 'ko')

    if (sortMode === '정당') {
      return [...votes].sort((a, b) => {
        const pa = a.members?.party ?? '무소속'
        const pb = b.members?.party ?? '무소속'
        const pc = pa.localeCompare(pb, 'ko')
        return pc !== 0 ? pc : byName(a, b)
      })
    }
    if (sortMode === '지역') {
      return [...votes].sort((a, b) => {
        const da = a.members?.district ?? ''
        const db = b.members?.district ?? ''
        const dc = da.localeCompare(db, 'ko')
        return dc !== 0 ? dc : byName(a, b)
      })
    }
    return [...votes].sort((a, b) => {
      const aDefect = isDefector(a, partyMajority)
      const bDefect = isDefector(b, partyMajority)
      if (aDefect !== bDefect) return aDefect ? -1 : 1
      return byName(a, b)
    })
  }

  const sorted = sortVotes(memberVotes)
  const filteredSorted = sortVotes(filtered)

  const stanceCounts: Record<string, number> = {}
  for (const v of memberVotes) {
    stanceCounts[v.stance] = (stanceCounts[v.stance] ?? 0) + 1
  }

  function isDotVisible(stance: string) {
    return activeStance === '전체' || stance === activeStance
  }

  function handleDotMouseEnter(e: React.MouseEvent, v: MemberVoteRow) {
    if (!v.members || !isDotVisible(v.stance)) return
    setHoveredId(v.members.id)
    const x = e.clientX + 180 > window.innerWidth ? e.clientX - 194 : e.clientX + 14
    setTooltip({ x, y: e.clientY - 10, v })
  }

  function handleDotMouseLeave() {
    setHoveredId(null)
    setTooltip(null)
  }

  function handleDotClick(e: React.MouseEvent, v: MemberVoteRow) {
    if (!v.members || !isDotVisible(v.stance)) return
    const id = v.members.id
    const next = id === selectedId ? null : id
    setSelectedId(next)
    if (next) {
      itemRefs.current.get(id)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }

  function handleListClick(id: string) {
    setSelectedId(id === selectedId ? null : id)
  }

  return (
    <section ref={sectionRef}>
      {/* Section header with controls */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        paddingBottom: 14, borderBottom: '0.5px solid var(--bd)', marginBottom: 22,
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span style={{ fontFamily: 'var(--font-fell)', fontStyle: 'italic', fontSize: 13, color: 'var(--pu)' }}>03 · Member-by-member</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 400, letterSpacing: '-0.015em', color: 'var(--t1)' }}>의원별 표결 기록</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Vote filter */}
          <div style={{ display: 'flex', border: '0.5px solid var(--bd)', background: 'var(--iv)' }}>
            {STANCES.map((s, i) => {
              const isActive = activeStance === s
              const count = s === '전체' ? memberVotes.length : (stanceCounts[s] ?? 0)
              return (
                <button
                  key={s}
                  onClick={() => { setActiveStance(s); setSelectedId(null) }}
                  style={{
                    padding: '6px 12px',
                    background: isActive ? 'var(--ivd)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: 6,
                    cursor: 'pointer', border: 'none',
                    borderRight: i < STANCES.length - 1 ? '0.5px solid var(--bd)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 11, color: isActive ? 'var(--t1)' : 'var(--t2)' }}>{s}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--t3)' }}>{count}</span>
                </button>
              )
            })}
          </div>
          {/* Sort toggle */}
          <div style={{ display: 'flex', border: '0.5px solid var(--bd)', background: 'var(--iv)' }}>
            {SORT_MODES.map((m, i) => (
              <button
                key={m}
                onClick={() => setSortMode(m)}
                style={{
                  padding: '6px 12px', fontSize: 11,
                  color: sortMode === m ? 'var(--t1)' : 'var(--t2)',
                  background: sortMode === m ? 'var(--ivd)' : 'transparent',
                  border: 'none',
                  borderRight: i < SORT_MODES.length - 1 ? '0.5px solid var(--bd)' : 'none',
                  cursor: 'pointer',
                }}
              >{m}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Main panel: dot grid + member list */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 40, alignItems: 'start' }}>
        {/* Dot grid */}
        <div>
          <div
            className="vote-dot-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(22, 1fr)',
              gap: 4,
              padding: 18, border: '0.5px solid var(--bd)', background: 'var(--ivd)',
            }}
          >
            {sorted.map((v, i) => {
              if (!v.members) return null
              const id = v.members.id
              const party = v.members.party
              const pc = getPartyColor(party)
              const dot = getDotStyle(v.stance, pc)
              const visible = isDotVisible(v.stance)
              const isSelected = selectedId === id
              return (
                <div
                  key={`${id}-${i}`}
                  className="vote-dot"
                  onMouseEnter={e => handleDotMouseEnter(e, v)}
                  onMouseLeave={handleDotMouseLeave}
                  onClick={e => handleDotClick(e, v)}
                  style={{
                    aspectRatio: '1',
                    opacity: visible ? 1 : 0.12,
                    transition: 'opacity 0.2s',
                    cursor: visible ? 'pointer' : 'default',
                    outline: isSelected ? '2px solid var(--t1)' : 'none',
                    outlineOffset: '1px',
                    position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    ...dot,
                  }}
                >
                  {v.stance === '반대' && (
                    <span style={{
                      fontSize: '62%', lineHeight: 1, fontWeight: 700,
                      color: hexToRgba(pc, 0.85),
                      userSelect: 'none', pointerEvents: 'none',
                    }}>✕</span>
                  )}
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', marginRight: 4 }}>
              1칸 = 의원 1명
            </span>
            {([
              { stance: '찬성', label: '찬성' },
              { stance: '반대', label: '반대' },
              { stance: '기권', label: '기권' },
              { stance: '불참', label: '불참' },
            ] as const).map(({ stance, label }) => {
              const demoColor = '#1a1a1a'
              const dot = getDotStyle(stance, demoColor)
              return (
                <div key={stance} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 16, height: 16, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    ...dot,
                  }}>
                    {stance === '반대' && (
                      <span style={{ fontSize: '62%', lineHeight: 1, fontWeight: 700, color: hexToRgba(demoColor, 0.85), userSelect: 'none' }}>✕</span>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Member list */}
        <div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, height: 480, overflowY: 'auto' }}>
            {filteredSorted.map((v, i) => {
              const m = v.members
              if (!m) return null
              const pc = getPartyColor(m.party)
              const defector = isDefector(v, partyMajority)
              const isSelected = selectedId === m.id
              const isListHovered = listHoveredId === m.id
              return (
                <div
                  key={`list-${m.id}-${i}`}
                  ref={el => { if (el) itemRefs.current.set(m.id, el); else itemRefs.current.delete(m.id) }}
                  onClick={() => handleListClick(m.id)}
                  onMouseEnter={() => setListHoveredId(m.id)}
                  onMouseLeave={() => setListHoveredId(null)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '32px 1fr auto minmax(0, 68px) 52px auto',
                    gap: 8,
                    alignItems: 'center',
                    padding: '7px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: isSelected
                      ? hexToRgba(pc, 0.10)
                      : isListHovered
                        ? hexToRgba(pc, 0.06)
                        : defector && sortMode === '이탈순' ? hexToRgba(pc, 0.04) : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: hexToRgba(pc, 0.18),
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 600, color: pc, flexShrink: 0,
                  }}>
                    {m.name[0]}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--t1)' }}>{m.name}</span>
                    {m.term != null && <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 4 }}>{m.term}선</span>}
                  </div>
                  <PartyBadge party={m.party} size="sm" />
                  <div style={{
                    fontSize: 11, color: 'var(--t3)',
                    overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                  }}>{m.district ?? ''}</div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600,
                      color: STANCE_COLOR[v.stance] ?? 'var(--t3)',
                      padding: '2px 6px',
                      borderRadius: 20,
                      background: hexToRgba(STANCE_COLOR[v.stance] ?? '#888', 0.12),
                    }}>
                      {v.stance}
                    </span>
                  </div>
                  <Link
                    href={`/members/${m.id}`}
                    onClick={e => e.stopPropagation()}
                    style={{
                      fontSize: 10, color: 'var(--t3)', textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      opacity: isSelected || isListHovered ? 1 : 0,
                      transition: 'opacity 0.15s',
                      pointerEvents: isSelected || isListHovered ? 'auto' : 'none',
                    }}
                  >
                    자세히보기 →
                  </Link>
                </div>
              )
            })}
          </div>

          {filteredSorted.length === 0 && (
            <div style={{ color: 'var(--t3)', fontSize: 13, padding: '20px 0' }}>표결 데이터가 없습니다.</div>
          )}
        </div>
      </div>

      {/* Tooltip (dot hover only) */}
      {tooltip && tooltip.v.members && (
        <div style={{
          position: 'fixed', zIndex: 9999,
          left: tooltip.x, top: tooltip.y,
          background: 'var(--iv)', border: '0.5px solid var(--bd)',
          padding: '8px 12px', pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          minWidth: 160,
        }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--t1)' }}>
            {tooltip.v.members.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--t2)', marginTop: 2 }}>
            {tooltip.v.members.party ?? '무소속'}{tooltip.v.members.district ? ` · ${tooltip.v.members.district}` : ''}
          </div>
          <div style={{ marginTop: 4 }}>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: STANCE_COLOR[tooltip.v.stance] ?? 'var(--t3)',
              padding: '2px 7px', borderRadius: 20,
              background: hexToRgba(STANCE_COLOR[tooltip.v.stance] ?? '#888', 0.12),
            }}>
              {tooltip.v.stance}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}

function getDotStyle(stance: string, partyColor: string): React.CSSProperties {
  switch (stance) {
    case '찬성':
      return { background: partyColor }
    case '반대':
      return { background: 'transparent', border: `1.5px solid ${partyColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }
    case '기권':
      return {
        background: `repeating-linear-gradient(45deg, ${hexToRgba(partyColor, 0.7)}, ${hexToRgba(partyColor, 0.7)} 2px, transparent 2px, transparent 6px)`,
        border: `1px solid ${hexToRgba(partyColor, 0.35)}`,
      }
    case '불참':
      return { background: 'transparent', border: `1px solid ${hexToRgba(partyColor, 0.4)}` }
    default:
      return { background: 'var(--ivd)' }
  }
}

function isDefector(v: MemberVoteRow, partyMajority: Map<string, string>): boolean {
  if (!v.members || v.stance === '불참') return false
  const party = v.members.party ?? '무소속'
  const majority = partyMajority.get(party)
  return majority != null && v.stance !== majority
}
