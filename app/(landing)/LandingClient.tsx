'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KoreaMap } from '@/components/map/KoreaMap'
import { REGIONS_DATA } from '@/lib/regions'
import { getPartyColor } from '@/lib/utils'

let introPlayed = false

interface TopMember {
  id: string
  name: string
  district: string
  party: string
  count: number
}

interface Stats {
  bills: number
  members: number
  votes: number
  passedRate: number
  latestVote: { id: string; title: string; result: string } | null
  syncAgo: string | null
  avgAi: string | null
  thisWeek: number
  weekDiff: number
  topMembers: TopMember[]
  partyStats: { party: string; count: number }[]
}

// ── DECO 1: 의원 프로필 — 세로 바 그리드 (출석률) ──────────────
function Deco1({ membersCount }: { membersCount: number }) {
  const bars = [58, 72, 81, 65, 92, 78, 88, 69, 95, 74, 83, 61]
  const svgW = 300, svgH = 260
  const barW = 16, gap = 8
  const total = bars.length * (barW + gap) - gap
  const startX = (svgW - total) / 2
  const maxH = svgH * 0.78

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} xmlns="http://www.w3.org/2000/svg" style={{ width: 300, height: 'auto' }}>
        {bars.map((h, i) => {
          const bh = Math.round(h / 100 * maxH)
          const x = startX + i * (barW + gap)
          const alpha = (0.12 + (h / 100) * 0.55).toFixed(2)
          return <rect key={i} x={x} y={svgH - bh - 20} width={barW} height={bh} rx={2} fill={`rgba(74,63,143,${alpha})`} />
        })}
        <line x1={startX} y1={svgH - 20} x2={startX + total} y2={svgH - 20} stroke="rgba(26,25,22,0.1)" strokeWidth={0.8} />
        <text x={svgW / 2} y={svgH - 4} fontSize={9} fill="rgba(26,25,22,0.3)" textAnchor="middle" fontFamily="Pretendard Variable,Pretendard,sans-serif" letterSpacing="0.08em">
          의원별 본회의 출석률
        </text>
      </svg>
      <div style={{ display: 'flex', gap: 28, marginTop: 16 }}>
        {[{ n: String(membersCount), l: '현역 의원' }, { n: '발의·표결', l: '기록 추적' }, { n: '당 평균', l: '비교 제공' }].map(c => (
          <div key={c.l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-pretendard)', fontSize: 20, fontWeight: 400, color: 'rgba(26,25,22,0.75)', letterSpacing: '-0.02em' }}>{c.n}</div>
            <div style={{ fontSize: 10, color: 'rgba(26,25,22,0.35)', marginTop: 3, letterSpacing: '0.06em' }}>{c.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── DECO 2: 법안 추적 — 웨이브 + 페르소나 태그 ────────────────
function Deco2({ billsCount }: { billsCount: number }) {
  const svgW = 300, svgH = 260
  const waves: { pts: string; alpha: string; sw: string }[] = []
  for (let i = 0; i < 7; i++) {
    const pts: string[] = []
    const baseY = 80 + i * 22
    const amp = 14 - i
    for (let x = 0; x <= svgW; x += 6) {
      const y = baseY + Math.sin((x / svgW) * Math.PI * 2.5 + i * 0.7) * amp
      pts.push(`${x},${y.toFixed(1)}`)
    }
    waves.push({
      pts: pts.join(' '),
      alpha: (0.06 + i * 0.055).toFixed(2),
      sw: (0.8 + i * 0.25).toFixed(1),
    })
  }
  const tags = [
    { x: 30, y: 28, w: 58, t: '직장인' },
    { x: 118, y: 18, w: 68, t: '자영업자' },
    { x: 218, y: 28, w: 54, t: '학생' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} xmlns="http://www.w3.org/2000/svg" style={{ width: 300, height: 'auto' }}>
        {tags.map(tg => (
          <g key={tg.t}>
            <rect x={tg.x} y={tg.y} width={tg.w} height={20} rx={10} fill="rgba(74,63,143,0.09)" stroke="rgba(74,63,143,0.25)" strokeWidth={0.7} />
            <text x={tg.x + tg.w / 2} y={tg.y + 13.5} fontSize={9} fill="rgba(74,63,143,0.75)" textAnchor="middle" fontFamily="Pretendard Variable,Pretendard,sans-serif">{tg.t}</text>
          </g>
        ))}
        {waves.map((w, i) => (
          <polyline key={i} points={w.pts} fill="none" stroke={`rgba(74,63,143,${w.alpha})`} strokeWidth={w.sw} />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 28, marginTop: 16 }}>
        {[{ n: billsCount.toLocaleString(), l: '발의 법안' }, { n: '3종', l: '페르소나 해석' }, { n: 'AI', l: '자동 요약' }].map(c => (
          <div key={c.l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-pretendard)', fontSize: 20, fontWeight: 400, color: 'rgba(26,25,22,0.75)', letterSpacing: '-0.02em' }}>{c.n}</div>
            <div style={{ fontSize: 10, color: 'rgba(26,25,22,0.35)', marginTop: 3, letterSpacing: '0.06em' }}>{c.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── DECO 3: 표결 기록 — 도트 그리드 ──────────────────────────
function Deco3({ votesCount, passedRate, thisWeek }: { votesCount: number; passedRate: number; thisWeek: number }) {
  const cols = 10, rows = 8, dotR = 2.5, gapX = 18, gapY = 18
  const svgW = cols * gapX, svgH = rows * gapY
  const dots: { cx: number; cy: number; alpha: string }[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * gapX + gapX / 2
      const cy = r * gapY + gapY / 2
      const distFromCenter = Math.sqrt(Math.pow(c - (cols / 2 - 0.5), 2) + Math.pow(r - (rows / 2 - 0.5), 2))
      const alpha = Math.max(0.07, 0.52 - distFromCenter * 0.045).toFixed(2)
      dots.push({ cx, cy, alpha })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} xmlns="http://www.w3.org/2000/svg" style={{ width: 180, height: 'auto' }}>
        {dots.map((d, i) => (
          <circle key={i} cx={d.cx.toFixed(1)} cy={d.cy.toFixed(1)} r={dotR} fill={`rgba(74,63,143,${d.alpha})`} />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 28, marginTop: 4 }}>
        {[{ n: votesCount.toLocaleString(), l: '표결 기록' }, { n: `${passedRate}%`, l: '가결률' }, { n: `${thisWeek}건`, l: '이번 주 처리' }].map(c => (
          <div key={c.l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-pretendard)', fontSize: 20, fontWeight: 400, color: 'rgba(26,25,22,0.75)', letterSpacing: '-0.02em' }}>{c.n}</div>
            <div style={{ fontSize: 10, color: 'rgba(26,25,22,0.35)', marginTop: 3, letterSpacing: '0.06em' }}>{c.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SECTIONS = ['hero', 'p1', 'p2', 'p3']

export function LandingClient({ stats }: { stats: Stats }) {
  const router = useRouter()
  const [loaderOut, setLoaderOut] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [ibukHovered, setIbukHovered] = useState(false)
  const [navVisible, setNavVisible] = useState(false)
  const [activeSection, setActiveSection] = useState(0)
  const [dotsVisible, setDotsVisible] = useState(false)
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)
  const swRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const f = (n: number) => n.toLocaleString()

  const SNAP_PANELS = [
    {
      id: 'p1',
      num: '01 / 03',
      title: <>국회의원 <em>프로필</em></>,
      desc: `${f(stats.members)}명 의원 전원의 발의 현황과 표결 성향을 한 페이지에. 정당 평균과의 비교, 주요 활동 분야 태그, 최근 표결 이력. 말이 아닌 기록으로 의원을 봅니다.`,
      tags: ['발의 법안 추적', '표결 성향 분석', '정당 평균 비교'],
      bg: 'var(--iv)',
      rightBg: 'var(--ivd)',
      deco: <Deco1 membersCount={stats.members}/>,
    },
    {
      id: 'p2',
      num: '02 / 03',
      title: <>법안을<br /><em>내 삶의 언어</em>로</>,
      desc: `${f(stats.bills)}건 발의 법안 전수 수록. AI가 법조문의 제안 이유와 핵심을 요약합니다. 가결·계류·폐기 상태, 카테고리 분류, 원문 링크 제공.`,
      tags: ['AI 요약', '카테고리 분류', '가결·계류·폐기 필터'],
      bg: 'var(--ivd)',
      rightBg: 'var(--iv)',
      deco: <Deco2 billsCount={stats.bills} />,
    },
    {
      id: 'p3',
      num: '03 / 03',
      title: <>표결,<br /><em>있는 그대로</em></>,
      desc: `${f(stats.votes)}건 표결 전수 공개. 의원별 찬성·반대·기권·미투표 비율, 소속 정당 평균과의 비교. 편집 없이, 데이터 그대로.`,
      tags: ['찬반 비율 시각화', '정당별 패턴', '의원별 이력'],
      bg: 'var(--iv)',
      rightBg: 'var(--ivd)',
      deco: <Deco3 votesCount={stats.votes} passedRate={stats.passedRate} thisWeek={stats.thisWeek} />,
    },
  ]

  const handleRegionClick = (name: string) => {
    router.push(`/regions/${encodeURIComponent(name)}`)
  }

  useLayoutEffect(() => {
    if (introPlayed) {
      setLoaderOut(true)
      setLoaded(true)
      setNavVisible(true)
      setDotsVisible(true)
    }
  }, [])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (introPlayed) return

    const l1 = document.getElementById('l1')
    const l2 = document.getElementById('l2')
    const l3 = document.getElementById('l3')
    const lb = document.getElementById('lb')
    const lf = document.getElementById('lf')
    const ln = document.getElementById('ln')

    let iv: ReturnType<typeof setInterval>
    const t1 = setTimeout(() => l1?.classList.add('s'), 180)
    const t2 = setTimeout(() => l2?.classList.add('s'), 650)
    const t3 = setTimeout(() => l3?.classList.add('s'), 1100)
    const t4 = setTimeout(() => {
      lb?.classList.add('s')
      if (lf) lf.style.width = '100%'
      let n = 0
      iv = setInterval(() => {
        n = Math.min(n + 3, 100)
        if (ln) ln.textContent = n + '%'
        if (n >= 100) clearInterval(iv)
      }, 64)
    }, 1400)
    const t5 = setTimeout(() => {
      setLoaderOut(true)
      const t6 = setTimeout(() => {
        setLoaded(true)
        setNavVisible(true)
        introPlayed = true
        setTimeout(() => setDotsVisible(true), 600)
      }, 700)
      timersRef.current.push(t6)
    }, 3500)

    timersRef.current = [t1, t2, t3, t4, t5]
    return () => {
      timersRef.current.forEach(clearTimeout)
      clearInterval(iv)
    }
  }, [])

  useEffect(() => {
    if (!loaded) return
    const sw = swRef.current
    if (!sw) return

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = SECTIONS.indexOf(e.target.id)
            if (idx >= 0) setActiveSection(idx)
          }
        })
      },
      { root: sw, threshold: 0.5 }
    )

    SECTIONS.forEach((id) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })

    return () => obs.disconnect()
  }, [loaded])

  function scrollToSection(idx: number) {
    const el = document.getElementById(SECTIONS[idx])
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.35;transform:scale(.65);} }
        .li { transform:translateY(110%); opacity:0; transition:transform .7s cubic-bezier(.16,1,.3,1), opacity .6s; }
        .li.s { transform:translateY(0); opacity:1; }
        #lb { opacity:0; transition:opacity .4s; }
        #lb.s { opacity:1; }
        .sp-title em { font-style:italic; color:var(--pu); font-family:var(--font-pretendard); }
        .fcard:hover .fa-arrow { border-color:var(--pu); color:var(--pu); transform:translate(2px,-2px); }
      `}</style>

      {/* LOADER */}
      {!loaded && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'var(--bk)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            transition: 'opacity .7s, visibility .7s',
            opacity: loaderOut ? 0 : 1,
            visibility: loaderOut ? 'hidden' : 'visible',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, overflow: 'hidden' }}>
            {[
              { id: 'l1', text: 'PoliScope.', color: 'var(--iv)', italic: false, font: 'var(--font-modern),sans-serif' },
              { id: 'l2', text: '데이터로 보는 민주주의.', color: 'var(--pul)', italic: true, font: 'var(--font-pretendard)' },
              { id: 'l3', text: '대한민국 국회 투명성 플랫폼.', color: 'var(--iv)', italic: false, font: 'var(--font-pretendard)' },
            ].map(({ id, text, color, italic, font }) => (
              <div
                key={id} id={id} className="li"
                style={{
                  fontFamily: font,
                  fontSize: 'clamp(24px,4vw,48px)', fontWeight: 300,
                  color, fontStyle: italic ? 'italic' : 'normal',
                  letterSpacing: '-.01em', lineHeight: 1.25,
                }}
              >
                {text}
              </div>
            ))}
          </div>
          <div id="lb" style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 320, height: 3, background: 'rgba(242,237,228,.13)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
              <div id="lf" style={{ position: 'absolute', inset: 0, width: 0, background: 'var(--pul)', borderRadius: 2, transition: 'width 2.3s cubic-bezier(.4,0,.2,1)' }} />
            </div>
            <div id="ln" style={{ fontSize: 13, color: 'rgba(242,237,228,.45)', letterSpacing: '.08em', minWidth: 36, textAlign: 'right' }}>0%</div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 52px', height: 60,
        borderBottom: '.5px solid var(--bd)',
        background: 'color-mix(in srgb, var(--iv) 90%, transparent)', backdropFilter: 'blur(14px)',
        opacity: navVisible ? 1 : 0,
        transform: navVisible ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'opacity .5s, transform .5s',
      }}>
        <div style={{ fontFamily: 'var(--font-pretendard)', fontSize: 15, display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pu)' }}></div>
          <div>
            <div style={{ fontFamily: 'var(--font-modern),sans-serif' }}>PoliScope</div>
            <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '.04em', marginTop: 2 }}>대한민국 국회 투명성 플랫폼</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Link href="/members" style={{ fontSize: 13, color: 'var(--t2)', textDecoration: 'none' }}>국회의원</Link>
          <Link href="/bills" style={{ fontSize: 13, color: 'var(--t2)', textDecoration: 'none' }}>법안</Link>
          <Link href="/members" style={{ fontSize: 12, fontWeight: 500, color: 'var(--iv)', background: 'var(--bk)', padding: '7px 16px', borderRadius: 2, textDecoration: 'none' }}>검색하기 →</Link>
        </div>
      </nav>

      {/* SCROLL DOTS */}
      <div style={{
        position: 'fixed', right: 24, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 8, zIndex: 200,
        opacity: dotsVisible ? 1 : 0, transition: 'opacity .4s',
      }}>
        {SECTIONS.map((_, i) => (
          <div
            key={i}
            onClick={() => scrollToSection(i)}
            style={{
              width: 6, height: 6, borderRadius: '50%', cursor: 'pointer',
              background: activeSection === i ? 'var(--pu)' : 'transparent',
              border: '.5px solid var(--t3)',
              transform: activeSection === i ? 'scale(1.4)' : 'scale(1)',
              transition: 'background .2s, transform .2s',
            }}
          />
        ))}
      </div>

      {/* SCROLL WRAPPER */}
      <div
        ref={swRef}
        style={{
          height: '100vh', overflowY: 'scroll',
          scrollSnapType: 'y mandatory', scrollBehavior: 'smooth',
          paddingTop: 60,
        }}
      >
        {/* HERO */}
        <section
          id="hero"
          style={{
            height: '100vh', display: 'flex', flexDirection: 'column',
            scrollSnapAlign: 'start', overflow: 'hidden', marginTop: -60,
            paddingTop: 60,
          }}
        >
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'minmax(260px,0.65fr) 1fr minmax(220px,0.45fr)', minHeight: 0 }}>

            {/* COL 1 — 펀치라인 + stats table + CTA */}
            <div style={{ borderRight: '.5px solid var(--bd)', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto', background: 'var(--iv)' }}>
              {/* 펀치라인 */}
              <div style={{ marginBottom: 28, paddingBottom: 28, borderBottom: '.5px solid var(--bd)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)', marginBottom: 16 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pu)', animation: 'blink 2s ease infinite' }} />
                  <div style={{ width: 28, height: 1, background: 'var(--pu)' }} />
                  22대 국회 실시간 추적
                </div>
                <div style={{ fontFamily: 'var(--font-modern),sans-serif', fontSize: 'clamp(48px,6vw,82px)', fontWeight: 200, lineHeight: 1, letterSpacing: '-.02em', marginBottom: 10 }}>
                  PoliScope
                </div>
                <h1 style={{ fontFamily: 'var(--font-pretendard)', fontSize: 'clamp(14px,1.5vw,22px)', fontWeight: 300, lineHeight: 1.4, letterSpacing: '-.01em', margin: 0, marginBottom: 14, color: 'var(--t2)' }}>
                  국회 투명성 플랫폼
                </h1>
                <p style={{ fontSize: 12, fontWeight: 300, lineHeight: 1.8, color: 'var(--t2)', margin: 0 }}>
                  {f(stats.members)}명 의원의 발의·표결·출석을 실시간으로 추적합니다.
                </p>
              </div>

              {/* Stats table */}
              <div style={{ border: '.5px solid var(--bd)', marginBottom: 20 }}>
                {[
                  {
                    label: 'AI  신뢰도  평균',
                    value: stats.avgAi ?? '—',
                    suffix: stats.avgAi ? '/  1.00' : '',
                  },
                  {
                    label: '최근  표결',
                    value: stats.latestVote ? `#${stats.latestVote.id.slice(-4)}` : '—',
                    suffix: stats.latestVote?.result ?? '',
                    valueColor: 'var(--t1)',
                  },
                  {
                    label: '이번  주  처리',
                    value: `${stats.thisWeek}건`,
                    suffix: stats.weekDiff !== 0 ? `${stats.weekDiff > 0 ? '+' : ''}${stats.weekDiff}  vs  평균` : '',
                    suffixColor: stats.weekDiff > 0 ? 'var(--st-pass)' : stats.weekDiff < 0 ? 'var(--st-fail)' : 'var(--t3)',
                  },
                ].map((row, i, arr) => (
                  <div key={row.label} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '13px 16px',
                    borderBottom: i < arr.length - 1 ? '.5px solid var(--bd)' : 'none',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)', letterSpacing: '.08em' }}>
                      {row.label}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: row.valueColor ?? 'var(--t1)', letterSpacing: '.04em' }}>
                        {row.value}
                      </span>
                      {row.suffix && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: row.suffixColor ?? 'var(--t3)', letterSpacing: '.04em' }}>
                          {row.suffix}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Link href="/members" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.06em',
                  color: 'var(--iv)', background: 'var(--bk)',
                  padding: '12px 20px', textDecoration: 'none', flexShrink: 0,
                }}>
                  &gt;  국회의원
                </Link>
                <Link href="/bills" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '.06em',
                  color: 'var(--iv)', background: 'var(--pu)',
                  padding: '12px 20px', textDecoration: 'none', flexShrink: 0,
                }}>
                  &gt;  법안  /  표결
                </Link>
              </div>
            </div>

            {/* COL 2 — interactive Korea map */}
            <div style={{ height: '100%', position: 'relative', overflow: 'hidden', background: '#DDDDDD' }}>
              <KoreaMap className="absolute inset-0" onRegionClick={handleRegionClick} onRegionHover={setHoveredRegion} partyStats={stats.partyStats} />

              {/* 이북5도위원회 panel */}
              <div
                onMouseEnter={() => setIbukHovered(true)}
                onMouseLeave={() => setIbukHovered(false)}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'var(--배경-카드)', backdropFilter: 'blur(12px)',
                  borderRadius: 12, padding: '14px 16px',
                  border: '0.5px solid rgba(26,25,22,0.1)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                  zIndex: 10, minWidth: 210,
                  cursor: 'default',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/emblem-ibuk5do.png" alt="이북5도위원회 엠블럼" width={38} height={38} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(26,25,22,0.42)', letterSpacing: '0.01em', marginBottom: 2 }}>행정안전부</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em' }}>이북5도위원회</div>
                  </div>
                </div>

                <div style={{
                  overflow: 'hidden',
                  maxHeight: ibukHovered ? 300 : 0,
                  opacity: ibukHovered ? 1 : 0,
                  marginTop: ibukHovered ? 12 : 0,
                  paddingTop: ibukHovered ? 12 : 0,
                  borderTop: ibukHovered ? '0.5px solid rgba(26,25,22,0.08)' : '0.5px solid transparent',
                  transition: 'max-height 0.28s ease, opacity 0.22s ease, margin-top 0.28s ease, padding-top 0.28s ease',
                }}>
                  {REGIONS_DATA.filter(r => r.is_northern).map((r, i, arr) => (
                    <Link
                      key={r.name}
                      href={`/regions/${encodeURIComponent(r.name)}`}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                        padding: '7px 0',
                        borderBottom: i < arr.length - 1 ? '0.5px solid rgba(26,25,22,0.06)' : 'none',
                        textDecoration: 'none',
                      }}
                    >
                      <span style={{ fontSize: 12, color: 'var(--t1)', whiteSpace: 'nowrap' }}>{r.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--t3)', whiteSpace: 'nowrap' }}>{r.governor.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* COL 3 — Region detail / default hint */}
            {(() => {
              const region = hoveredRegion ? REGIONS_DATA.find(r => r.name === hoveredRegion || r.short === hoveredRegion) : null
              if (!region) {
                return (
                  <div style={{ borderLeft: '.5px solid var(--bd)', padding: '28px 40px 28px 24px', display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--iv)', overflowY: 'auto' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                      <div style={{ fontSize: 10, letterSpacing: '.1em', color: 'var(--t3)', textTransform: 'uppercase' }}>SYSTEM ► OVERVIEW</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--pu)' }}>
                        <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--pu)', animation: 'blink 2s ease infinite' }} />
                        LIVE
                      </div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-pretendard)', fontSize: 'clamp(20px,2.2vw,28px)', fontWeight: 300, letterSpacing: '-.02em', lineHeight: 1.2, marginBottom: 4 }}>
                      실시간 현황
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 20 }}>
                      22대 국회 · {stats.syncAgo ? `${stats.syncAgo.split(' 전')[0]} 전 동기화` : '동기화 정보 없음'}
                    </div>
                    {/* 4-box stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                      {[
                        { l: '국회의원', n: f(stats.members), u: '명' },
                        { l: '법안', n: f(stats.bills), u: '건' },
                        { l: '표결', n: f(stats.votes), u: '건' },
                        { l: '가결률', n: String(stats.passedRate), u: '%' },
                      ].map(s => (
                        <div key={s.l} style={{ border: '.5px solid var(--bd)', borderRadius: 6, padding: '10px 12px', background: 'rgba(255,255,255,0.5)' }}>
                          <div style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 6, letterSpacing: '.04em' }}>{s.l}</div>
                          <div style={{ fontFamily: 'var(--font-pretendard)', fontSize: 20, fontWeight: 400, letterSpacing: '-.02em', lineHeight: 1 }}>
                            {s.n}<span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 2 }}>{s.u}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* 이번 주 가결 현황 */}
                    <div style={{ marginBottom: 20, border: '.5px solid var(--bd)', borderRadius: 6, padding: '10px 12px', background: 'rgba(255,255,255,0.5)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--t3)', marginBottom: 6, letterSpacing: '.04em' }}>
                        <span>이번 주 가결 법안</span>
                        <span style={{ color: stats.weekDiff >= 0 ? 'var(--pu)' : 'var(--t3)', fontSize: 10 }}>
                          {stats.weekDiff >= 0 ? `+${stats.weekDiff}` : stats.weekDiff} vs 지난 주
                        </span>
                      </div>
                      <div style={{ fontFamily: 'var(--font-pretendard)', fontSize: 20, fontWeight: 400, letterSpacing: '-.02em', lineHeight: 1 }}>
                        {stats.thisWeek}<span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 2 }}>건</span>
                      </div>
                    </div>
                    {/* 주목 표결 */}
                    {stats.latestVote && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '.04em', marginBottom: 8 }}>주목 표결</div>
                        <Link href={`/bills/${stats.latestVote.id}`}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; e.currentTarget.style.borderColor = 'rgba(74,63,143,0.35)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'var(--bd)'; }}
                          style={{ display: 'block', border: '.5px solid var(--bd)', borderRadius: 6, padding: '10px 12px', background: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'background .15s, border-color .15s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ fontSize: 11, color: 'var(--t2)', fontWeight: 500 }}>법안 #{stats.latestVote.id.slice(-4)}</div>
                            <div style={{ fontSize: 10, color: 'var(--pu)', fontWeight: 600 }}>► {stats.latestVote.result}</div>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--t3)', lineHeight: 1.4, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {stats.latestVote.title}
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: 'var(--bd)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${stats.passedRate}%`, background: 'var(--pu)', borderRadius: 2 }} />
                          </div>
                        </Link>
                      </div>
                    )}
                    {/* 최근 활동 상위 */}
                    {stats.topMembers.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '.04em', marginBottom: 10 }}>최근 활동 상위(300건)</div>
                        {stats.topMembers.map((m, i) => {
                          const regionShort = m.district.replace(/특별시|광역시|특별자치시|도$|특별자치도/, '').slice(0, 2) || '비례'
                          return (
                            <Link key={m.id} href={`/members/${m.id}`}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.45)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--t2)', padding: '6px 4px', margin: '0 -4px', borderBottom: '.5px solid var(--bd)', textDecoration: 'none', transition: 'background .15s' }}>
                              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--pu)', width: 10, flexShrink: 0, textAlign: 'center' }}>{i + 1}</span>
                              <span>{m.name}</span>
                              <span style={{ color: 'var(--t3)' }}>·</span>
                              <span style={{ color: 'var(--t3)' }}>{regionShort}</span>
                              <span style={{ color: 'var(--t3)' }}>·</span>
                              <span style={{ color: 'var(--t3)' }}>{m.party}</span>
                              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--t3)' }}>발의 {m.count}건</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              const [won, total] = region.rate.split('/').map(Number)
              const pct = total > 0 ? Math.round(won / total * 100) : 0
              const regionCode = region.short === '서울' ? 'KR-SE' : region.short === '경기' ? 'KR-GG' : region.short === '부산' ? 'KR-BS' : `KR-${region.short.slice(0,2).toUpperCase()}`

              return (
                <div style={{ borderLeft: '.5px solid var(--bd)', padding: '28px 40px 28px 24px', display: 'flex', flexDirection: 'column', gap: 0, background: 'var(--iv)', overflowY: 'auto' }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <div style={{ fontSize: 10, letterSpacing: '.08em', color: 'var(--t3)', textTransform: 'uppercase' }}>REGION ► {regionCode}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--pu)' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--pu)', animation: 'blink 2s ease infinite' }} />
                      LIVE
                    </div>
                  </div>

                  {/* Title */}
                  <div style={{ fontFamily: 'var(--font-pretendard)', fontSize: 'clamp(20px,2.2vw,28px)', fontWeight: 300, letterSpacing: '-.02em', lineHeight: 1.2, marginBottom: 4 }}>
                    {region.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>{region.governor.title} {region.governor.name}</div>
                    {region.governor.party && (
                      <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, background: `${getPartyColor(region.governor.party)}18`, color: getPartyColor(region.governor.party), fontWeight: 600 }}>
                        {region.governor.party}
                      </span>
                    )}
                  </div>

                  {/* 4-box stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
                    {[
                      { l: '총 의석', n: `${total}석` },
                      { l: '보유 의석', n: `${won}석` },
                      { l: '점유율', n: `${pct}%` },
                      { l: '의원 수', n: `${total}명` },
                    ].map(s => (
                      <div key={s.l} style={{ border: '.5px solid var(--bd)', borderRadius: 5, padding: '8px 10px', background: 'rgba(255,255,255,0.5)' }}>
                        <div style={{ fontSize: 9, color: 'var(--t3)', marginBottom: 4, letterSpacing: '.04em' }}>{s.l}</div>
                        <div style={{ fontFamily: 'var(--font-pretendard)', fontSize: 16, fontWeight: 400, letterSpacing: '-.02em' }}>{s.n}</div>
                      </div>
                    ))}
                  </div>

                  {/* 의석 분포 */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--t3)', marginBottom: 5, letterSpacing: '.04em' }}>
                      <span>의석 분포</span><span>{won}/{total}</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, background: 'var(--bd)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: region.color, borderRadius: 3 }} />
                    </div>
                  </div>



                  {/* 하단 링크 */}
                  <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '.5px solid var(--bd)', fontFamily: 'monospace', fontSize: 10, color: 'var(--t3)', lineHeight: 2 }}>
                    <Link href={`/regions/${encodeURIComponent(region.name)}`} style={{ display: 'block', color: 'var(--pu)', textDecoration: 'none' }}>
                      ► /regions/{region.short}
                    </Link>
                    <Link href={`/regions/${encodeURIComponent(region.name)}`} style={{ display: 'block', color: 'var(--t3)', textDecoration: 'none' }}>
                      → 클릭하여 상세보기
                    </Link>
                  </div>
                </div>
              )
            })()}
          </div>

          {/* FEATURE CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, background: 'rgba(26,25,22,.11)', borderTop: '.5px solid var(--bd)', flexShrink: 0 }}>
            {[
              { num: '01', title: '국회의원 프로필', desc: `${f(stats.members)}명 전원. 발의 현황·표결 성향·정당 평균 비교. 주요 활동 분야 태그.`, href: '/members' },
              { num: '02', title: '법안 추적', desc: `${f(stats.bills)}건 전수. AI 요약, 카테고리 분류, 가결·계류·폐기 필터.`, href: '/bills' },
              { num: '03', title: '표결 기록', desc: `${f(stats.votes)}건 전수. 의원별 찬반·기권·미투표 비율, 정당별 패턴.`, href: '/bills?sort=voteDate' },
            ].map(card => (
              <Link
                key={card.num}
                href={card.href}
                className="fcard"
                style={{ background: 'var(--iv)', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 9, textDecoration: 'none', borderRight: '.5px solid rgba(26,25,22,.11)' }}
              >
                <div style={{ fontFamily: 'var(--font-pretendard)', fontSize: 12, color: 'var(--pu)', letterSpacing: '.05em' }}>{card.num}</div>
                <div style={{ fontFamily: 'var(--font-pretendard)', fontSize: 17, fontWeight: 400, color: 'var(--t1)', letterSpacing: '-.01em' }}>{card.title}</div>
                <div style={{ fontSize: 12, fontWeight: 300, color: 'var(--t2)', lineHeight: 1.7 }}>{card.desc}</div>
                <div
                  className="fa-arrow"
                  style={{
                    marginTop: 'auto', width: 24, height: 24, borderRadius: '50%',
                    border: '.5px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--t3)', transition: 'border-color .2s, color .2s, transform .2s',
                  }}
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M1.5 9.5L9.5 1.5M9.5 1.5H4.5M9.5 1.5V6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* SNAP PANELS */}
        {SNAP_PANELS.map((panel) => (
          <div
            key={panel.id}
            id={panel.id}
            style={{
              scrollSnapAlign: 'start', height: '100vh',
              display: 'grid', gridTemplateColumns: '1fr 1fr',
              alignItems: 'center', gap: 0,
              borderTop: '.5px solid var(--bd)',
              position: 'relative', overflow: 'hidden',
              background: panel.bg,
            }}
          >
            {/* LEFT */}
            <div style={{ padding: '0 60px 0 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontFamily: 'var(--font-pretendard)', fontSize: 12, color: 'var(--pu)', letterSpacing: '.08em', marginBottom: 18 }}>
                {panel.num}
              </div>
              <div
                className="sp-title"
                style={{
                  fontFamily: 'var(--font-pretendard)',
                  fontSize: 'clamp(34px,4.2vw,58px)', fontWeight: 300,
                  lineHeight: 1.15, letterSpacing: '-.025em', marginBottom: 20,
                }}
              >
                {panel.title}
              </div>
              <p style={{ fontSize: 15, fontWeight: 300, color: 'var(--t2)', lineHeight: 1.8, maxWidth: 500, marginBottom: 32 }}>
                {panel.desc}
              </p>
              <div style={{ display: 'flex', gap: 10, paddingTop: 18, borderTop: '.5px solid var(--bd)' }}>
                {panel.tags.map(tag => (
                  <div key={tag} style={{ fontSize: 12, color: 'var(--t3)', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pu)', flexShrink: 0, display: 'inline-block' }} />
                    {tag}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — deco */}
            <div style={{
              height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderLeft: '.5px solid var(--bd)', background: panel.rightBg,
              position: 'relative', overflow: 'hidden',
            }}>
              {panel.deco}
            </div>
          </div>
        ))}

        {/* FOOTER */}
        <footer style={{
          scrollSnapAlign: 'start',
          padding: '22px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderTop: '.5px solid var(--bd)',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-modern),sans-serif', fontSize: 13, color: 'var(--t2)' }}>PoliScope</div>
            <div style={{ fontSize: 10, color: 'var(--t3)', marginTop: 2 }}>대한민국 국회 투명성 플랫폼</div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>국회 공공데이터 API 기반 · 원문 출처 제공 · 정치적 중립</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--pu)' }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--pu)', animation: 'blink 2s ease infinite' }} />
            실시간 업데이트 중
          </div>
        </footer>
      </div>
    </>
  )
}
