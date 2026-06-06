'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as d3 from 'd3'
import { getPartyColor } from '@/lib/utils'

interface MemberInfo {
  id: string
  name: string
  party: string | null
  district: string | null
}

interface Props {
  regionName: string
  regionShort: string
  regionShorts?: string[]  // 통합 행정구역 등 복수 SIDO 처리용
  members: MemberInfo[]
}

interface GeoFeature {
  type: 'Feature'
  properties: { SGG: string; SIDO_SGG: string; SIDO: string; SGG_Code: string }
  geometry: d3.GeoGeometryObjects
}

interface TooltipState {
  x: number
  y: number
  districtName: string
  memberName: string | null
  party: string | null
}

// 시/군/구/· 제거 → DB ORIG_NM과 GeoJSON SGG를 공통 키로 정규화
function normSGG(s: string): string {
  return s.replace(/[시군구·]/g, '').trim()
}

// d3-geo v3 expects CW exterior rings; GeoJSON RFC 7946 uses CCW → rewind
function rewindFeature(f: GeoFeature): GeoFeature {
  const geom = f.geometry as unknown as { type: string; coordinates: unknown[] }
  if (geom.type === 'Polygon') {
    const coords = geom.coordinates as number[][][]
    return { ...f, geometry: { ...f.geometry, coordinates: coords.map(r => [...r].reverse()) } as d3.GeoGeometryObjects }
  }
  if (geom.type === 'MultiPolygon') {
    const coords = geom.coordinates as number[][][][]
    return { ...f, geometry: { ...f.geometry, coordinates: coords.map(p => p.map(r => [...r].reverse())) } as d3.GeoGeometryObjects }
  }
  return f
}

function SkeletonMap({ height }: { height: number }) {
  return (
    <div style={{
      width: '100%',
      height,
      background: 'var(--ivd)',
      borderRadius: 8,
      animation: 'pulse 1.5s ease-in-out infinite',
    }} />
  )
}

export function DistrictMap({ regionShort, regionShorts, members }: Props) {
  const allShorts = regionShorts ?? [regionShort]
  const containerRef = useRef<HTMLDivElement>(null)
  const [features, setFeatures] = useState<GeoFeature[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [dims, setDims] = useState({ width: 600, height: 450 })
  const [hovered, setHovered] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    fetch('/korea-electoral.json')
      .then(r => {
        if (!r.ok) throw new Error('fetch failed')
        return r.json()
      })
      .then((geojson: { features: GeoFeature[] }) => {
        const filtered = geojson.features
          .filter(f => allShorts.includes(f.properties.SIDO))
          .map(rewindFeature)
        setFeatures(filtered)
        setLoading(false)
      })
      .catch(() => {
        setError(true)
        setLoading(false)
      })
  }, [regionShort])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width
      setDims({ width: w, height: Math.round(w * 0.75) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // DB ORIG_NM → 정규화 키 → 의원 매핑
  const memberByNorm = useMemo(() => {
    const map = new Map<string, MemberInfo>()
    for (const m of members) {
      if (!m.district) continue
      const prefixPattern = allShorts.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
      const withoutRegion = m.district
        .replace(new RegExp(`^(${prefixPattern})\\s*`), '')
        .trim()
      const key = normSGG(withoutRegion)
      if (key) map.set(key, m)
    }
    return map
  }, [members, regionShort])

  const { pathGenerator } = useMemo(() => {
    if (features.length === 0) return { pathGenerator: null }

    const featureCollection = {
      type: 'FeatureCollection' as const,
      features: features as unknown as d3.ExtendedFeature[],
    }

    const proj = d3.geoMercator().fitExtent(
      [[16, 16], [dims.width - 16, dims.height - 16]],
      featureCollection
    )

    const gen = d3.geoPath().projection(proj)
    return { pathGenerator: gen }
  }, [features, dims])

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const target = (e.target as Element).closest('[data-norm]')
    if (target) {
      const normKey = (target as HTMLElement).dataset.norm!
      const displayName = (target as HTMLElement).dataset.display!
      setHovered(normKey)
      const member = memberByNorm.get(normKey) ?? null
      let x = e.clientX + 16
      let y = e.clientY - 10
      if (x + 220 > window.innerWidth) x = e.clientX - 230
      if (y + 100 > window.innerHeight) y = e.clientY - 110
      setTooltip({
        x, y,
        districtName: displayName,
        memberName: member?.name ?? null,
        party: member?.party ?? null,
      })
    } else {
      setHovered(null)
      setTooltip(null)
    }
  }, [memberByNorm])

  const handleMouseLeave = useCallback(() => {
    setHovered(null)
    setTooltip(null)
  }, [])

  if (!loading && (error || features.length === 0)) return null

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      {loading && <SkeletonMap height={dims.height} />}

      {!loading && features.length > 0 && (
        <svg
          width={dims.width}
          height={dims.height}
          style={{ display: 'block', cursor: 'default' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* 1패스: 채우기 + hover 효과 + 이벤트 영역 */}
          {features.map(feature => {
            const normKey = normSGG(feature.properties.SGG)
            const member = memberByNorm.get(normKey)
            const color = member ? getPartyColor(member.party) : '#C8C2B8'
            const isHovered = hovered === normKey
            const d = pathGenerator!(feature as unknown as d3.GeoPermissibleObjects)

            return (
              <g
                key={feature.properties.SGG_Code}
                style={{
                  transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                  filter: isHovered
                    ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.3)) brightness(1.1)'
                    : 'none',
                  transition: 'transform 0.12s ease, filter 0.12s ease',
                }}
              >
                <path
                  d={d ?? ''}
                  fill={color}
                  fillOpacity={member ? 0.85 : 0.4}
                  stroke="none"
                  data-norm={normKey}
                  data-display={feature.properties.SIDO_SGG}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            )
          })}

          {/* 2패스: 경계선 (모든 fill 위에 렌더링 → 항상 보임) */}
          {features.map(feature => {
            const d = pathGenerator!(feature as unknown as d3.GeoPermissibleObjects)
            return (
              <path
                key={`border-${feature.properties.SGG_Code}`}
                d={d ?? ''}
                fill="none"
                stroke="rgba(255,255,255,0.75)"
                strokeWidth={1}
                style={{ pointerEvents: 'none' }}
              />
            )
          })}

          {/* 3패스: 라벨 (면적이 충분히 큰 선거구만) */}
          {features.map(feature => {
            const normKey = normSGG(feature.properties.SGG)
            const d = pathGenerator!(feature as unknown as d3.GeoPermissibleObjects)
            const area = Math.abs(pathGenerator!.area(feature as unknown as d3.GeoPermissibleObjects))
            if (area < 400) return null

            const centroid = pathGenerator!.centroid(feature as unknown as d3.GeoPermissibleObjects)
            const cx = centroid[0]
            const cy = centroid[1]
            if (isNaN(cx) || isNaN(cy)) return null

            const isHovered = hovered === normKey
            return (
              <text
                key={`label-${feature.properties.SGG_Code}`}
                x={cx}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
                fontSize={isHovered ? 11 : 9}
                fontFamily="Pretendard Variable,Pretendard,sans-serif"
                fontWeight={600}
                fill="white"
                stroke="rgba(0,0,0,0.5)"
                strokeWidth={2}
                paintOrder="stroke"
                opacity={0.95}
              >
                {feature.properties.SGG}
              </text>
            )
          })}
        </svg>
      )}

      {tooltip && (
        <div style={{
          position: 'fixed',
          left: tooltip.x,
          top: tooltip.y,
          background: 'var(--bk)',
          color: 'var(--iv)',
          borderRadius: 8,
          padding: '10px 14px',
          fontSize: 12,
          pointerEvents: 'none',
          zIndex: 9999,
          minWidth: 150,
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
        }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
            {tooltip.districtName}
          </div>
          {tooltip.memberName ? (
            <>
              <div style={{ color: tooltip.party ? getPartyColor(tooltip.party) : 'var(--t3)', fontWeight: 500 }}>
                {tooltip.memberName}
              </div>
              <div style={{ color: 'rgba(242,237,228,0.55)', fontSize: 11, marginTop: 2 }}>
                {tooltip.party ?? '무소속'}
              </div>
            </>
          ) : (
            <div style={{ color: 'rgba(242,237,228,0.55)', fontSize: 11 }}>
              지역구 의원 없음
            </div>
          )}
        </div>
      )}
    </div>
  )
}
