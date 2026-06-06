'use client'

import { useRef, useState, useCallback, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { partyColor } from '@/lib/party-colors'
import { REGIONS, INNER_CITIES } from './korea-map-paths'

interface Tooltip {
  x: number
  y: number
  region: (typeof REGIONS)[number]
}

interface Props {
  className?: string
  onRegionClick?: (name: string) => void
  onRegionHover?: (name: string | null) => void
  partyStats?: { party: string; count: number }[]
}

function darken(hex: string, f: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return '#' + [r, g, b].map(v => Math.round(v * f).toString(16).padStart(2, '0')).join('')
}

export function KoreaMap({ className, onRegionClick, onRegionHover, partyStats }: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const sortedRegions = useMemo(() => [...REGIONS].sort((a, b) => {
    const aInner = INNER_CITIES.has(a.name)
    const bInner = INNER_CITIES.has(b.name)
    const aActive = a.name === hovered || a.name === selected
    const bActive = b.name === hovered || b.name === selected
    if (aActive && !bActive) return 1
    if (!aActive && bActive) return -1
    if (aInner && !bInner) return 1
    if (!aInner && bInner) return -1
    return 0
  }), [hovered, selected])

  const getGroupStyle = useCallback((name: string): React.CSSProperties => {
    const isSelected = name === selected
    const isHovered = name === hovered && name !== selected
    if (isSelected) return {
      transform: 'translateY(-14px)',
      filter: 'drop-shadow(0 28px 35px rgba(0,0,0,.44)) brightness(1.09)',
      transition: 'transform 0.15s ease, filter 0.15s ease',
    }
    if (isHovered) return {
      transform: 'translateY(-9px)',
      filter: 'drop-shadow(0 18px 22.5px rgba(0,0,0,.44)) brightness(1.09)',
      transition: 'transform 0.15s ease, filter 0.15s ease',
    }
    return { transition: 'transform 0.15s ease, filter 0.15s ease' }
  }, [hovered, selected])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const target = (e.target as Element).closest('[data-region]')
    if (target) {
      const name = (target as HTMLElement).dataset.region!
      if (hovered !== name) { setHovered(name); onRegionHover?.(name) }
      const region = REGIONS.find(r => r.name === name)
      if (region) {
        let x = e.clientX + 16
        let y = e.clientY - 10
        if (x + 200 > window.innerWidth) x = e.clientX - 210
        if (y + 110 > window.innerHeight) y = e.clientY - 120
        setTooltip({ x, y, region })
      }
    } else {
      if (hovered && hovered !== selected) setHovered(null)
      if (hovered !== selected) setTooltip(null)
      onRegionHover?.(null)
    }
  }, [hovered, selected, onRegionHover])

  const handleMouseLeave = useCallback(() => {
    if (hovered && hovered !== selected) setHovered(null)
    if (!selected) setTooltip(null)
    onRegionHover?.(null)
  }, [hovered, selected, onRegionHover])

  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const target = (e.target as Element).closest('[data-region]')
    if (target) {
      e.stopPropagation()
      const name = (target as HTMLElement).dataset.region!
      if (selected === name) {
        setSelected(null); setHovered(null); setTooltip(null); onRegionHover?.(null)
      } else {
        setSelected(name); onRegionHover?.(name); onRegionClick?.(name)
      }
    } else {
      setSelected(null); setTooltip(null)
    }
  }, [selected, onRegionClick])

  return (
    <div className={cn('relative w-full h-full', className)}>
      <svg
        ref={svgRef}
        viewBox="30 10 450 580"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', cursor: 'default' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {sortedRegions.map(region => {
          const isActive = region.name === hovered || region.name === selected
          const depthColor0 = darken(region.color, 0.38)
          const depthColor1 = darken(region.color, 0.48)
          const depthColor2 = darken(region.color, 0.58)
          return (
            <g key={region.name} style={{ ...getGroupStyle(region.name), pointerEvents: 'none' }}>
              {isActive && region.paths[0] && (
                <g style={{ transform: 'translateY(0px)', opacity: 1 }}>
                  <path d={region.paths[0]} transform="translate(0,8)" fill={depthColor0} fillOpacity={1} stroke="none" pointerEvents="none" />
                  <path d={region.paths[0]} transform="translate(0,5)" fill={depthColor1} fillOpacity={1} stroke="none" pointerEvents="none" />
                  <path d={region.paths[0]} transform="translate(0,2)" fill={depthColor2} fillOpacity={1} stroke="none" pointerEvents="none" />
                </g>
              )}
              {region.paths.map((d, i) => (
                <path key={i} d={d} fill={region.color} fillOpacity={0.85} stroke="var(--지도-경계선)" strokeWidth={1.1} fillRule="evenodd" pointerEvents="none" />
              ))}
            </g>
          )
        })}

        <g pointerEvents="none">
          {sortedRegions.map(region => (
            <text key={region.name} x={region.labelX} y={region.labelY} fontSize={region.labelSize} fill="rgba(255,255,255,0.9)" fontFamily="Pretendard Variable,Pretendard,sans-serif" textAnchor="middle" fontWeight={500} style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
              {region.short}
            </text>
          ))}
        </g>

        <g>
          {REGIONS.filter(r => !INNER_CITIES.has(r.name)).map(region => (
            <path key={region.name} data-region={region.name} d={region.hitPath} fill="transparent" stroke="none" pointerEvents="all" fillRule="evenodd" />
          ))}
          {REGIONS.filter(r => INNER_CITIES.has(r.name)).map(region => (
            <path key={region.name} data-region={region.name} d={region.hitPath} fill="transparent" stroke="none" pointerEvents="all" fillRule="evenodd" />
          ))}
        </g>
      </svg>

      {tooltip && (
        <div style={{ position: 'fixed', left: tooltip.x, top: tooltip.y, background: 'var(--bk)', color: 'var(--iv)', borderRadius: 8, padding: '10px 14px', fontSize: 12, pointerEvents: 'none', zIndex: 9999, minWidth: 160, boxShadow: '0 4px 20px rgba(0,0,0,0.35)' }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 5 }}>{tooltip.region.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: tooltip.region.color, flexShrink: 0, display: 'inline-block' }} />
            <span style={{ color: 'rgba(255,255,255,0.75)' }}>{tooltip.region.party}</span>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>22대 총선 · {tooltip.region.seats} ({tooltip.region.rate})</div>
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--iv)', borderRadius: 6, padding: '8px 10px', fontSize: 11, color: 'var(--t2)' }}>
        {(partyStats ?? [
          { party: '더불어민주당', count: 152 },
          { party: '국민의힘', count: 106 },
          { party: '조국혁신당', count: 12 },
          { party: '무소속', count: 7 },
          { party: '진보당', count: 4 },
          { party: '개혁신당', count: 3 },
          { party: '기본소득당', count: 1 },
          { party: '사회민주당', count: 1 },
        ]).map(({ party, count }) => ({ color: partyColor(party), label: `${party} ${count}` })).map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
