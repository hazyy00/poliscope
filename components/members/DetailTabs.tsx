'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { BillRow, VoteRow } from '@/app/members/[id]/page'
import type { CareerEntry } from '@/lib/types'

interface VoteCounts {
  yes: number
  no: number
  abstain: number
  missed: number
}

interface DetailTabsProps {
  memberId: string
  activeTab: string
  bills: BillRow[]
  votes: VoteRow[]
  voteCounts: VoteCounts
  totalVotes: number
  career: CareerEntry[]
  partyColor: string
  crossParty: number
}

const TABS = [
  { id: 'voting', label: '표결 성향' },
  { id: 'bills', label: '발의 법안' },
  { id: 'network', label: '공동발의 네트워크', soon: true },
  { id: 'career', label: '경력' },
]

type BillStatus = '전체' | '계류' | '가결' | '폐기'

export function DetailTabs({
  memberId, activeTab, bills, votes, voteCounts, totalVotes, career, partyColor, crossParty
}: DetailTabsProps) {
  const [tab, setTab] = useState(activeTab)
  const [billFilter, setBillFilter] = useState<BillStatus>('전체')

  const billCounts = useMemo(() => ({
    '전체': bills.length,
    '계류': bills.filter(b => b.status === '계류').length,
    '가결': bills.filter(b => b.status === '가결' || b.status === '수정가결').length,
    '폐기': bills.filter(b => b.status === '폐기' || b.status === '부결' || b.status === '철회').length,
  }), [bills])

  const filteredBills = useMemo(() => {
    if (billFilter === '전체') return bills
    if (billFilter === '가결') return bills.filter(b => b.status === '가결' || b.status === '수정가결')
    if (billFilter === '폐기') return bills.filter(b => b.status === '폐기' || b.status === '부결' || b.status === '철회')
    return bills.filter(b => b.status === billFilter)
  }, [bills, billFilter])

  const participated = totalVotes - voteCounts.missed
  const rawP = totalVotes > 0
    ? [voteCounts.yes, voteCounts.no, voteCounts.abstain, voteCounts.missed].map(c => (c / totalVotes) * 100)
    : [0, 0, 0, 0]
  const rounded = rawP.map(p => Math.round(p))
  const diff = 100 - rounded.reduce((a, b) => a + b, 0)
  const maxIdx = rawP.indexOf(Math.max(...rawP))
  rounded[maxIdx] += diff
  const [yesP, noP, absP, missedP] = rounded

  return (
    <div>
      {/* Tab bar */}
      <div style={{ borderBottom: '1px solid var(--m-faint)', marginBottom: 28 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          {TABS.map(t => {
            const active = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => !t.soon && setTab(t.id)}
                disabled={t.soon}
                style={{
                  background: 'transparent', border: 'none',
                  padding: '12px 24px 14px 0', marginRight: 24,
                  fontFamily: 'inherit', fontSize: 14,
                  color: t.soon ? 'var(--m-muted)' : (active ? 'var(--m-ink)' : 'var(--m-ink-soft)'),
                  fontWeight: active ? 600 : 400,
                  borderBottom: active ? '2px solid var(--m-accent)' : '2px solid transparent',
                  marginBottom: -1,
                  cursor: t.soon ? 'not-allowed' : 'pointer',
                  opacity: t.soon ? 0.55 : 1,
                }}
              >
                {t.label}
                {t.id === 'bills' && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.6, fontFamily: 'var(--font-mono)' }}>{bills.length}</span>}
                {t.id === 'voting' && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.6, fontFamily: 'var(--font-mono)' }}>{totalVotes}</span>}
                {t.soon && <span style={{ marginLeft: 6, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--m-muted)', letterSpacing: '0.06em' }}>SOON</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      {tab === 'bills' && (
        <div>
          {/* Filter chips */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 0, border: '1px solid var(--m-faint)', background: 'var(--iv)' }}>
              {(['전체', '계류', '가결', '폐기'] as BillStatus[]).map(s => (
                <button
                  key={s}
                  onClick={() => setBillFilter(s)}
                  style={{
                    padding: '10px 16px',
                    background: billFilter === s ? 'var(--m-ink)' : 'transparent',
                    color: billFilter === s ? '#fff' : 'var(--m-ink-soft)',
                    border: 'none', fontFamily: 'inherit', fontSize: 12.5,
                    fontWeight: billFilter === s ? 600 : 400, cursor: 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {s}
                  <span style={{ fontSize: 10, opacity: 0.6, fontFamily: 'var(--font-mono)' }}>
                    {billCounts[s]}
                  </span>
                </button>
              ))}
            </div>
            <span style={{ fontSize: 11, color: 'var(--m-muted)', fontFamily: 'var(--font-mono)' }}>NEWEST ▾</span>
          </div>

          {/* Bills table */}
          <div style={{ background: 'var(--m-panel)', border: '1px solid var(--m-faint)' }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '60px 1fr 200px 110px 80px',
              padding: '12px 20px', borderBottom: '1px solid var(--m-faint)',
              fontSize: 10, color: 'var(--m-muted)', fontFamily: 'var(--font-mono)',
              letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              <span>NO.</span><span>법안명</span><span>위원회</span><span>발의일</span>
              <span style={{ textAlign: 'right' }}>상태</span>
            </div>
            {filteredBills.length === 0 && (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--m-muted)', fontSize: 13 }}>
                해당 상태의 법안이 없습니다.
              </div>
            )}
            {filteredBills.map((bill, i) => {
              const statusColor = (bill.status === '가결' || bill.status === '수정가결') ? 'var(--성공)'
                : (bill.status === '폐기' || bill.status === '부결') ? 'var(--위험)'
                : 'var(--m-muted)'
              const statusBg = (bill.status === '가결' || bill.status === '수정가결') ? '#e3edd9'
                : (bill.status === '폐기' || bill.status === '부결') ? '#f3dcd6'
                : 'var(--iv)'
              return (
                <Link
                  key={bill.id}
                  href={`/bills/${bill.id}`}
                  style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                >
                  <div
                    style={{
                      display: 'grid', gridTemplateColumns: '60px 1fr 200px 110px 80px',
                      padding: '14px 20px', borderBottom: '1px solid var(--m-faint)',
                      fontSize: 13, alignItems: 'center', cursor: 'pointer',
                      transition: 'background .12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--iv)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ color: 'var(--m-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {String(i + 1).padStart(3, '0')}
                    </span>
                    <span style={{ color: 'var(--m-ink)', lineHeight: 1.4, overflow: 'hidden', paddingRight: 12 }}>
                      {bill.title}
                      {(bill.cosponsor_count ?? 0) > 0 && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--m-muted)', fontFamily: 'var(--font-mono)' }}>
                          +{bill.cosponsor_count}명 공동
                        </span>
                      )}
                    </span>
                    <span style={{ color: 'var(--m-ink-soft)', fontSize: 12 }}>{bill.committee ?? ''}</span>
                    <span style={{ color: 'var(--m-muted)', fontFamily: 'var(--font-mono)', fontSize: 11.5 }}>
                      {bill.proposed_at?.slice(0, 10).replace(/-/g, '.') ?? ''}
                    </span>
                    <span style={{ textAlign: 'right' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', fontSize: 11,
                        background: statusBg, color: statusColor, fontWeight: 500, letterSpacing: '0.02em',
                      }}>
                        {bill.status ?? '계류'}
                      </span>
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'voting' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Overall breakdown */}
          <div style={{ background: 'var(--m-panel)', padding: '24px 26px', border: '1px solid var(--m-faint)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 22 }}>
              <h3 style={{
                margin: 0, fontFamily: 'var(--font-display)', fontSize: 22,
                fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--m-ink)',
              }}>
                전체 표결 분포
              </h3>
              <span style={{ fontSize: 11, color: 'var(--m-muted)', fontFamily: 'var(--font-mono)' }}>
                {totalVotes}건 중 {participated}건 참여
              </span>
            </div>

            {/* Stacked bar */}
            {totalVotes > 0 && (
              <div style={{ display: 'flex', height: 36, marginBottom: 18, border: '1px solid var(--m-faint)' }}>
                <div style={{ flex: yesP, background: 'var(--성공)', minWidth: 2 }} />
                <div style={{ flex: noP, background: 'var(--위험)', minWidth: 2 }} />
                <div style={{ flex: absP, background: 'var(--m-muted)', minWidth: 2 }} />
                <div style={{ flex: missedP, background: 'var(--m-faint)', minWidth: 2 }} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <VoteStat label="찬성" count={voteCounts.yes} percent={yesP} color="var(--성공)" />
              <VoteStat label="반대" count={voteCounts.no} percent={noP} color="var(--위험)" />
              <VoteStat label="기권" count={voteCounts.abstain} percent={absP} color="var(--m-muted)" />
              <VoteStat label="미투표" count={voteCounts.missed} percent={missedP} color="var(--m-faint)" />
            </div>

            {crossParty > 0 && (
              <div style={{
                marginTop: 26, padding: '16px 18px', background: 'var(--iv)',
                fontSize: 12.5, color: 'var(--m-ink-soft)', lineHeight: 1.6,
              }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--m-muted)',
                  letterSpacing: '0.1em', marginRight: 10,
                }}>NOTE</span>
                당론 이탈률 <strong style={{ color: 'var(--m-accent)', fontWeight: 600 }}>{crossParty}%</strong> · 본회의 표결 기준
              </div>
            )}
          </div>

          {/* Recent votes list */}
          <div style={{ background: 'var(--m-panel)', padding: '24px 26px', border: '1px solid var(--m-faint)' }}>
            <h3 style={{
              margin: '0 0 18px', fontFamily: 'var(--font-display)', fontSize: 22,
              fontWeight: 600, letterSpacing: '-0.01em', color: 'var(--m-ink)',
            }}>
              최근 표결 기록
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {votes.slice(0, 15).map((v, i) => {
                const stanceColor = v.stance === '찬성' ? 'var(--성공)'
                  : v.stance === '반대' ? 'var(--위험)'
                  : 'var(--m-muted)'
                const stanceBg = v.stance === '찬성' ? '#e3edd9'
                  : v.stance === '반대' ? '#f3dcd6'
                  : 'var(--iv)'
                return (
                  <Link key={i} href={`/bills/${v.vote_id}`} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderBottom: '1px solid var(--m-faint)',
                    fontSize: 13, textDecoration: 'none', color: 'inherit',
                    margin: '0 -12px',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--m-faint)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{
                      flexShrink: 0, display: 'inline-block', padding: '2px 8px',
                      fontSize: 11, background: stanceBg, color: stanceColor,
                      fontWeight: 500,
                    }}>
                      {v.stance}
                    </span>
                    <span style={{
                      flex: 1, color: 'var(--m-ink)', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {v.votes?.title ?? ''}
                    </span>
                    <span style={{ flexShrink: 0, fontSize: 11, color: 'var(--m-muted)', fontFamily: 'var(--font-mono)' }}>
                      {v.votes?.voted_at?.slice(0, 10).replace(/-/g, '.') ?? ''}
                    </span>
                  </Link>
                )
              })}
              {votes.length === 0 && (
                <div style={{ color: 'var(--m-muted)', fontSize: 13, padding: '20px 0' }}>표결 기록이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'network' && (
        <div style={{ background: 'var(--m-panel)', padding: '60px 40px', border: '1px solid var(--m-faint)', textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 600, letterSpacing: '-0.01em', marginBottom: 8, color: 'var(--m-ink)' }}>
            공동발의 네트워크
          </div>
          <div style={{ fontSize: 13, color: 'var(--m-muted)' }}>곧 공개됩니다.</div>
        </div>
      )}

      {tab === 'career' && (
        <div style={{ background: 'var(--m-panel)', padding: '32px 40px', border: '1px solid var(--m-faint)' }}>
          {career.length === 0 ? (
            <div style={{ color: 'var(--m-muted)', fontSize: 13 }}>약력 정보가 없습니다.</div>
          ) : (
            <div>
              {career.map((item, i) => {
                const HEADER_RE = /^[\[■●▶◆【〔\s]*(학력|경력)[\]】〕:：\s]*$/
                const isHeader = HEADER_RE.test(item.title.trim())
                if (isHeader) {
                  const label = item.title
                    .replace(/^[\[■●▶◆【〔\s]+/, '')
                    .replace(/[\]】〕:：\s]+$/, '')
                    .trim()
                  return (
                    <div key={i} style={{
                      marginTop: i === 0 ? 0 : 28,
                      marginBottom: 12,
                      fontSize: 10, fontFamily: 'var(--font-mono)',
                      letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: 'var(--m-muted)',
                    }}>
                      {label}
                    </div>
                  )
                }
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '8px 0',
                    borderBottom: '1px solid var(--m-faint)',
                  }}>
                    <div style={{
                      width: 3, height: 18, background: partyColor,
                      flexShrink: 0, marginTop: 3, opacity: 0.6,
                    }} />
                    <span style={{ fontSize: 14, color: 'var(--m-ink)', lineHeight: 1.6 }}>
                      {item.title}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function VoteStat({ label, count, percent, color }: { label: string; count: number; percent: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ width: 8, height: 8, background: color, display: 'inline-block' }} />
        <span style={{
          fontSize: 11, color: 'var(--m-muted)', fontFamily: 'var(--font-mono)',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--m-ink)' }}>
          {percent}
        </span>
        <span style={{ fontSize: 13, color: 'var(--m-muted)' }}>%</span>
      </div>
      <div style={{ fontSize: 11, color: 'var(--m-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
        {count}건
      </div>
    </div>
  )
}
