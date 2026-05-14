'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function LandingPage() {
  const [loaderOut, setLoaderOut] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const l1 = document.getElementById('l1')
    const l2 = document.getElementById('l2')
    const l3 = document.getElementById('l3')
    const lb = document.getElementById('lb')
    const lf = document.getElementById('lf')
    const ln = document.getElementById('ln')

    // 목업과 동일한 타이밍
    setTimeout(() => l1?.classList.add('s'), 180)
    setTimeout(() => l2?.classList.add('s'), 650)
    setTimeout(() => l3?.classList.add('s'), 1100)
    setTimeout(() => {
      lb?.classList.add('s')
      // CSS transition으로 0→100% (2.3s)
      if (lf) lf.style.width = '100%'
      // 숫자 카운터: 0→100, 64ms마다 3씩
      let n = 0
      const iv = setInterval(() => {
        n = Math.min(n + 3, 100)
        if (ln) ln.textContent = n + '%'
        if (n >= 100) clearInterval(iv)
      }, 64)
    }, 1400)

    setTimeout(() => {
      setLoaderOut(true)
      setTimeout(() => setLoaded(true), 700)
    }, 3500)
  }, [])

  return (
    <>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        .li { transform:translateY(110%); opacity:0; transition:transform .7s cubic-bezier(.16,1,.3,1), opacity .6s; }
        .li.s { transform:translateY(0); opacity:1; }
        #lb { opacity:0; transition:opacity .4s; }
        #lb.s { opacity:1; }
        .tk-inner { animation:ticker 28s linear infinite; }
      `}</style>

      {/* LOADER */}
      {!loaded && (
        <div
          style={{
            position:'fixed', inset:0, background:'var(--bk)', zIndex:9999,
            display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column',
            transition:'opacity .7s, visibility .7s',
            opacity: loaderOut ? 0 : 1,
            visibility: loaderOut ? 'hidden' : 'visible',
          }}
        >
          <div style={{display:'flex',flexDirection:'column',gap:4,overflow:'hidden'}}>
            {[
              { id:'l1', text:'PoliScope.',              color:'var(--iv)',  italic:false },
              { id:'l2', text:'데이터로 보는 민주주의.', color:'var(--pul)', italic:true  },
              { id:'l3', text:'대한민국 국회 투명성 플랫폼.', color:'var(--iv)', italic:false },
            ].map(({ id, text, color, italic }) => (
              <div
                key={id}
                id={id}
                className="li"
                style={{
                  fontFamily:'var(--font-serif),serif',
                  fontSize:'clamp(24px,4vw,48px)',
                  fontWeight:300,
                  color,
                  fontStyle: italic ? 'italic' : 'normal',
                  letterSpacing:'-.01em',
                  lineHeight:1.25,
                }}
              >
                {text}
              </div>
            ))}
          </div>

          {/* 바 + 숫자 */}
          <div
            id="lb"
            style={{
              position:'absolute', bottom:80, left:'50%', transform:'translateX(-50%)',
              display:'flex', alignItems:'center', gap:12,
            }}
          >
            <div style={{width:320, height:3, background:'rgba(242,237,228,.13)', borderRadius:2, position:'relative', overflow:'hidden'}}>
              <div
                id="lf"
                style={{
                  position:'absolute', inset:0, width:0,
                  background:'var(--pul)',
                  borderRadius:2,
                  transition:'width 2.3s cubic-bezier(.4,0,.2,1)',
                }}
              />
            </div>
            <div id="ln" style={{fontSize:13, color:'rgba(242,237,228,.45)', letterSpacing:'.08em', minWidth:36, textAlign:'right'}}>0%</div>
          </div>
        </div>
      )}

      {/* NAV */}
      <nav style={{
        position:'fixed',top:0,left:0,right:0,zIndex:100,
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'0 52px',height:60,
        borderBottom:'.5px solid var(--bd)',
        background:'rgba(242,237,228,.9)',backdropFilter:'blur(14px)',
      }}>
        <div style={{fontFamily:'var(--font-serif),serif',fontSize:15,display:'flex',alignItems:'center',gap:7}}>
          <div style={{width:5,height:5,borderRadius:'50%',background:'var(--pu)'}}></div>
          <div>
            <div>PoliScope</div>
            <div style={{fontSize:10,color:'var(--t3)',letterSpacing:'.04em',marginTop:2}}>대한민국 국회 투명성 플랫폼</div>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:28}}>
          <Link href="/members" style={{fontSize:13,color:'var(--t2)',textDecoration:'none'}}>의원</Link>
          <Link href="/bills" style={{fontSize:13,color:'var(--t2)',textDecoration:'none'}}>법안</Link>
          <Link href="/votes" style={{fontSize:13,color:'var(--t2)',textDecoration:'none'}}>표결</Link>
          <Link href="/members" style={{fontSize:12,fontWeight:500,color:'var(--iv)',background:'var(--bk)',padding:'7px 16px',borderRadius:2,textDecoration:'none'}}>검색하기 →</Link>
        </div>
      </nav>

      {/* MAIN */}
      <main style={{paddingTop:60}}>

        {/* HERO */}
        <section style={{minHeight:'100vh',display:'flex',flexDirection:'column'}}>
          <div style={{flex:1,display:'grid',gridTemplateColumns:'0.9fr 1.4fr',alignItems:'center',padding:'0 56px',gap:40}}>

            {/* LEFT */}
            <div style={{display:'flex',flexDirection:'column',gap:20}}>
              <div style={{display:'flex',alignItems:'center',gap:10,fontSize:11,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--t3)'}}>
                <div style={{width:5,height:5,borderRadius:'50%',background:'var(--pu)',animation:'blink 2s ease infinite'}}></div>
                <div style={{width:28,height:1,background:'var(--pu)'}}></div>
                22대 국회 실시간 추적
              </div>

              <h1 style={{fontFamily:'var(--font-serif),serif',fontSize:'clamp(30px,3.6vw,54px)',fontWeight:300,lineHeight:1.18,letterSpacing:'-.025em'}}>
                정치를<br/>
                <em style={{fontStyle:'italic',color:'var(--pu)',fontFamily:'var(--font-fell),serif'}}>있는 그대로</em><br/>
                볼 권리
              </h1>

              <p style={{fontSize:14,fontWeight:300,lineHeight:1.8,color:'var(--t2)',maxWidth:360}}>
                300명 의원의 발의·표결·출석을 원문 그대로.<br/>좌도 우도 아닌, 데이터만.
              </p>

              <div style={{display:'flex',gap:28,paddingTop:6,borderTop:'.5px solid var(--bd)'}}>
                {[
                  {n:'17,192', l:'발의 법안'},
                  {n:'286',    l:'현역 의원'},
                  {n:'1,547',  l:'표결 기록'},
                ].map(s => (
                  <div key={s.l}>
                    <div style={{fontFamily:'var(--font-serif),serif',fontSize:24,fontWeight:400,letterSpacing:'-.02em',lineHeight:1}}>{s.n}</div>
                    <div style={{fontSize:11,color:'var(--t3)',marginTop:3}}>{s.l}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',alignItems:'center',gap:16}}>
                <Link href="/members" style={{display:'inline-flex',alignItems:'center',gap:7,fontSize:13,fontWeight:500,color:'var(--iv)',background:'var(--bk)',padding:'11px 22px',borderRadius:2,textDecoration:'none'}}>
                  의원 검색하기 →
                </Link>
                <Link href="/bills" style={{fontSize:13,color:'var(--t2)',textDecoration:'none'}}>
                  법안 둘러보기 →
                </Link>
              </div>
            </div>

            {/* RIGHT — placeholder until KoreaMap component */}
            <div style={{position:'relative',height:'70vh',background:'var(--ivd)',borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <div style={{textAlign:'center',color:'var(--t3)'}}>
                <div style={{fontSize:13}}>지역구 지도</div>
                <div style={{fontSize:11,marginTop:4}}>준비 중</div>
              </div>
            </div>
          </div>

          {/* TICKER */}
          <div style={{borderTop:'.5px solid var(--bd)',borderBottom:'.5px solid var(--bd)',padding:'11px 0',overflow:'hidden',background:'var(--ivd)',flexShrink:0}}>
            <div className="tk-inner" style={{display:'flex',gap:48,whiteSpace:'nowrap',width:'max-content'}}>
              {Array(2).fill(null).map((_, i) => (
                <span key={i} style={{display:'flex',gap:48}}>
                  {['22대 국회 의원 286명 수록','법안 17,192건 실시간 추적','표결 기록 1,547건','국회 투명성 플랫폼','poliscope.kr'].map((t, j) => (
                    <span key={j} style={{fontSize:11,letterSpacing:'.08em',color:'var(--t3)'}}>
                      <span style={{color:'var(--pu)',marginRight:12}}>◆</span>{t}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURE CARDS */}
        <section style={{padding:'80px 56px',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24}}>
          {[
            { title:'의원 프로필', desc:'발의 법안, 표결 이력, 출석률을 한눈에', href:'/members', tag:'의원 286명' },
            { title:'법안 검색', desc:'17,000+ 법안을 상태·위원회·발의자로 검색', href:'/bills', tag:'법안 17,192건' },
            { title:'표결 기록', desc:'본회의 표결 결과와 정당별 찬반 현황', href:'/votes', tag:'표결 1,547건' },
          ].map(card => (
            <Link
              key={card.title}
              href={card.href}
              style={{display:'block',padding:32,border:'.5px solid var(--bd)',borderRadius:4,textDecoration:'none',transition:'border-color .2s,transform .15s',background:'var(--iv)'}}
            >
              <div style={{fontSize:10,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--t3)',marginBottom:16}}>{card.tag}</div>
              <div style={{fontFamily:'var(--font-serif),serif',fontSize:22,fontWeight:400,color:'var(--t1)',marginBottom:10}}>{card.title}</div>
              <div style={{fontSize:13,color:'var(--t2)',lineHeight:1.7}}>{card.desc}</div>
              <div style={{marginTop:20,fontSize:12,color:'var(--pu)'}}>바로가기 →</div>
            </Link>
          ))}
        </section>

        {/* FOOTER */}
        <footer style={{borderTop:'.5px solid var(--bd)',padding:'32px 56px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontFamily:'var(--font-serif),serif',fontSize:13,color:'var(--t3)'}}>PoliScope © 2024</div>
          <div style={{fontSize:11,color:'var(--t3)',maxWidth:400,textAlign:'right',lineHeight:1.6}}>
            이 서비스의 데이터는 국회 공공데이터 API 기반이며 참고용입니다.<br/>법적 판단의 근거로 사용하지 마세요.
          </div>
        </footer>
      </main>
    </>
  )
}
