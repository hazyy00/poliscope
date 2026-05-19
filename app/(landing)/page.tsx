'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { KoreaMap } from '@/components/map/KoreaMap'
import { REGIONS_DATA } from '@/lib/regions'

let introPlayed = false

// ── DECO 1: 의원 프로필 — 세로 바 그리드 (출석률) ──────────────
function Deco1() {
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
        <text x={svgW / 2} y={svgH - 4} fontSize={9} fill="rgba(26,25,22,0.3)" textAnchor="middle" fontFamily="Noto Sans KR,sans-serif" letterSpacing="0.08em">
          의원별 본회의 출석률
        </text>
      </svg>
      <div style={{ display: 'flex', gap: 28, marginTop: 16 }}>
        {[{ n: '300', l: '현역 의원' }, { n: '94.2%', l: '평균 출석률' }, { n: '12명', l: '출석 미달' }].map(c => (
          <div key={c.l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-serif),serif', fontSize: 20, fontWeight: 400, color: 'rgba(26,25,22,0.75)', letterSpacing: '-0.02em' }}>{c.n}</div>
            <div style={{ fontSize: 10, color: 'rgba(26,25,22,0.35)', marginTop: 3, letterSpacing: '0.06em' }}>{c.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── DECO 2: 법안 추적 — 웨이브 + 페르소나 태그 ────────────────
function Deco2() {
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
            <text x={tg.x + tg.w / 2} y={tg.y + 13.5} fontSize={9} fill="rgba(74,63,143,0.75)" textAnchor="middle" fontFamily="Noto Sans KR,sans-serif">{tg.t}</text>
          </g>
        ))}
        {waves.map((w, i) => (
          <polyline key={i} points={w.pts} fill="none" stroke={`rgba(74,63,143,${w.alpha})`} strokeWidth={w.sw} />
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 28, marginTop: 16 }}>
        {[{ n: '17,241', l: '발의 법안' }, { n: '3종', l: '페르소나 해석' }, { n: 'AI', l: '자동 요약' }].map(c => (
          <div key={c.l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-serif),serif', fontSize: 20, fontWeight: 400, color: 'rgba(26,25,22,0.75)', letterSpacing: '-0.02em' }}>{c.n}</div>
            <div style={{ fontSize: 10, color: 'rgba(26,25,22,0.35)', marginTop: 3, letterSpacing: '0.06em' }}>{c.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── DECO 3: 표결 기록 — 도트 그리드 ──────────────────────────
function Deco3() {
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
        {[{ n: '4,812', l: '표결 기록' }, { n: '68%', l: '평균 가결률' }, { n: '14건', l: '이번 주 표결' }].map(c => (
          <div key={c.l} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-serif),serif', fontSize: 20, fontWeight: 400, color: 'rgba(26,25,22,0.75)', letterSpacing: '-0.02em' }}>{c.n}</div>
            <div style={{ fontSize: 10, color: 'rgba(26,25,22,0.35)', marginTop: 3, letterSpacing: '0.06em' }}>{c.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

const SNAP_PANELS = [
  {
    id: 'p1',
    num: '01 / 03',
    title: <>의원 <em>프로필</em></>,
    desc: '300명 의원의 발의·표결·출석·재산·경력을 한 페이지에. 정당 이탈 표시, 위원회별 활동, 역대 대수 비교. 숫자로 보는 의원, 말이 아닌 기록으로.',
    tags: ['발의 법안 추적', '표결 이탈 감지', '출석률 시각화'],
    bg: 'var(--iv)',
    rightBg: 'var(--ivd)',
    deco: <Deco1 />,
  },
  {
    id: 'p2',
    num: '02 / 03',
    title: <>법안을<br /><em>내 삶의 언어</em>로</>,
    desc: '17,241건 발의 법안 전수 수록. AI가 법조문을 직장인·자영업자·학생 언어로 풀어냄. 이 법이 나한테 어떤 영향을 주는가를 먼저 답합니다.',
    tags: ['AI 요약', '페르소나 해석', '원문 링크'],
    bg: 'var(--ivd)',
    rightBg: 'var(--iv)',
    deco: <Deco2 />,
  },
  {
    id: 'p3',
    num: '03 / 03',
    title: <>표결,<br /><em>있는 그대로</em></>,
    desc: '4,812건 표결 전수 공개. 찬반 비율, 정당별 투표 내역, 접전 표결 하이라이트. 편집 없이, 원문 그대로.',
    tags: ['찬반 시각화', '정당별 비교', '접전 표결 강조'],
    bg: 'var(--iv)',
    rightBg: 'var(--ivd)',
    deco: <Deco3 />,
  },
]

const SECTIONS = ['hero', 'p1', 'p2', 'p3']

export default function LandingPage() {
  const router = useRouter()
  const [loaderOut, setLoaderOut] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [ibukHovered, setIbukHovered] = useState(false)
  const [navVisible, setNavVisible] = useState(false)
  const [activeSection, setActiveSection] = useState(0)
  const [dotsVisible, setDotsVisible] = useState(false)
  const swRef = useRef<HTMLDivElement>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

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
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .li { transform:translateY(110%); opacity:0; transition:transform .7s cubic-bezier(.16,1,.3,1), opacity .6s; }
        .li.s { transform:translateY(0); opacity:1; }
        #lb { opacity:0; transition:opacity .4s; }
        #lb.s { opacity:1; }
        .tk-inner { animation:ticker 30s linear infinite; }
        .sp-title em { font-style:italic; color:var(--pu); font-family:var(--font-fell),serif; }
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
              { id: 'l1', text: 'PoliScope.', color: 'var(--iv)', italic: false },
              { id: 'l2', text: '데이터로 보는 민주주의.', color: 'var(--pul)', italic: true },
              { id: 'l3', text: '대한민국 국회 투명성 플랫폼.', color: 'var(--iv)', italic: false },
            ].map(({ id, text, color, italic }) => (
              <div
                key={id} id={id} className="li"
                style={{
                  fontFamily: 'var(--font-serif),serif',
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
        <div style={{ fontFamily: 'var(--font-serif),serif', fontSize: 15, display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pu)' }}></div>
          <div>
            <div>PoliScope</div>
            <div style={{ fontSize: 10, color: 'var(--t3)', letterSpacing: '.04em', marginTop: 2 }}>대한민국 국회 투명성 플랫폼</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Link href="/members" style={{ fontSize: 13, color: 'var(--t2)', textDecoration: 'none' }}>의원</Link>
          <Link href="/bills" style={{ fontSize: 13, color: 'var(--t2)', textDecoration: 'none' }}>법안</Link>
          <Link href="/votes" style={{ fontSize: 13, color: 'var(--t2)', textDecoration: 'none' }}>표결</Link>
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
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '0.75fr 1.25fr', alignItems: 'center', minHeight: 0 }}>
            {/* LEFT */}
            <div style={{ padding: '0 40px 0 56px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--t3)' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pu)', animation: 'blink 2s ease infinite' }}></div>
                <div style={{ width: 28, height: 1, background: 'var(--pu)' }}></div>
                22대 국회 실시간 추적
              </div>

              <h1 style={{ fontFamily: 'var(--font-serif),serif', fontSize: 'clamp(30px,3.6vw,54px)', fontWeight: 300, lineHeight: 1.18, letterSpacing: '-.025em' }}>
                정치를<br />
                <em style={{ fontStyle: 'italic', color: 'var(--pu)', fontFamily: 'var(--font-fell),serif' }}>있는 그대로</em><br />
                볼 권리
              </h1>

              <p style={{ fontSize: 14, fontWeight: 300, lineHeight: 1.8, color: 'var(--t2)', maxWidth: 360 }}>
                300명 의원의 발의·표결·출석을 원문 그대로.<br />좌도 우도 아닌, 데이터만.
              </p>

              <div style={{ display: 'flex', gap: 28, paddingTop: 6, borderTop: '.5px solid var(--bd)' }}>
                {[
                  { n: '17,192', l: '발의 법안' },
                  { n: '286', l: '현역 의원' },
                  { n: '1,547', l: '표결 기록' },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ fontFamily: 'var(--font-serif),serif', fontSize: 24, fontWeight: 400, letterSpacing: '-.02em', lineHeight: 1 }}>{s.n}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 3 }}>{s.l}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Link href="/members" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 500, color: 'var(--iv)', background: 'var(--bk)', padding: '11px 22px', borderRadius: 2, textDecoration: 'none' }}>
                  의원 검색하기 →
                </Link>
                <Link href="/bills" style={{ fontSize: 13, color: 'var(--t2)', textDecoration: 'none' }}>
                  법안 둘러보기 →
                </Link>
              </div>
            </div>

            {/* RIGHT — interactive Korea map */}
            <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
              <KoreaMap className="absolute inset-0" onRegionClick={handleRegionClick} />

              {/* 이북5도위원회 panel */}
              <div
                onMouseEnter={() => setIbukHovered(true)}
                onMouseLeave={() => setIbukHovered(false)}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(16px)',
                  borderRadius: 12, padding: '14px 16px',
                  border: '0.5px solid rgba(26,25,22,0.1)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                  zIndex: 10, minWidth: 210,
                  cursor: 'default',
                }}
              >
                {/* Header: emblem + title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Korean Government Emblem */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/emblem-ibuk5do.png" alt="이북5도위원회 엠블럼" width={38} height={38} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 10, color: 'rgba(26,25,22,0.42)', letterSpacing: '0.01em', marginBottom: 2 }}>행정안전부</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--t1)', letterSpacing: '-0.01em' }}>이북5도위원회</div>
                  </div>
                </div>

                {/* Province list — slides down on hover */}
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
          </div>

          {/* TICKER */}
          <div style={{ borderTop: '.5px solid var(--bd)', borderBottom: '.5px solid var(--bd)', padding: '11px 0', overflow: 'hidden', background: 'var(--ivd)', flexShrink: 0 }}>
            <div className="tk-inner" style={{ display: 'flex', whiteSpace: 'nowrap', width: 'max-content' }}>
              {Array(2).fill(null).map((_, i) => (
                <span key={i} style={{ display: 'inline-flex' }}>
                  {['22대 국회 의원 286명 수록', '법안 17,192건 실시간 추적', '표결 기록 1,547건', '국회 투명성 플랫폼', 'poliscope.kr'].map((t, j) => (
                    <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '0 28px', fontSize: 12, color: 'var(--t3)', flexShrink: 0 }}>
                      <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--pu)', flexShrink: 0, display: 'inline-block' }} />
                      {t}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>

          {/* FEATURE CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, background: 'rgba(26,25,22,.11)', borderTop: '.5px solid var(--bd)', flexShrink: 0 }}>
            {[
              { num: '01', title: '의원 프로필', desc: '300명 발의·표결·출석·재산·경력. 정당 이탈 표시, 위원회별 활동.', href: '/members' },
              { num: '02', title: '법안 추적', desc: '17,241건 전수. AI 요약 + 페르소나별 해석. 직장인·자영업자·학생.', href: '/bills' },
              { num: '03', title: '표결 기록', desc: '4,812건 표결 전수. 찬반 비율, 정당별 투표, 접전 표결 하이라이트.', href: '/votes' },
            ].map(card => (
              <Link
                key={card.num}
                href={card.href}
                className="fcard"
                style={{ background: 'var(--iv)', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 9, textDecoration: 'none', borderRight: '.5px solid rgba(26,25,22,.11)' }}
              >
                <div style={{ fontFamily: 'var(--font-fell),serif', fontSize: 12, color: 'var(--pu)', letterSpacing: '.05em' }}>{card.num}</div>
                <div style={{ fontFamily: 'var(--font-serif),serif', fontSize: 17, fontWeight: 400, color: 'var(--t1)', letterSpacing: '-.01em' }}>{card.title}</div>
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
              <div style={{ fontFamily: 'var(--font-fell),serif', fontSize: 12, color: 'var(--pu)', letterSpacing: '.08em', marginBottom: 18 }}>
                {panel.num}
              </div>
              <div
                className="sp-title"
                style={{
                  fontFamily: 'var(--font-serif),serif',
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
            <div style={{ fontFamily: 'var(--font-serif),serif', fontSize: 13, color: 'var(--t2)' }}>PoliScope</div>
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
