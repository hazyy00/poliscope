'use client'

import Link from 'next/link'
import { BillRow } from '@/components/bills/BillRow'
import type { AiPicksBill, AiPicksResult } from '@/lib/types'

const PASSED_STATUSES = new Set(['가결', '수정가결'])

function toBillRow(b: AiPicksBill, today: string) {
  return (
    <BillRow
      key={b.id}
      id={b.id}
      title={b.title}
      status={b.status}
      committee={b.committee}
      proposed_at={b.proposed_at}
      proposer_name={null}
      proposer_names={b.proposer_names}
      proposer_party={null}
      cosponsor_count={b.cosponsor_count}
      today={today}
    />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--t3)',
      letterSpacing: '0.06em', textTransform: 'uppercase',
      margin: '36px 0 4px', paddingBottom: 10, borderBottom: '0.5px solid var(--bd)',
    }}>
      {children}
    </div>
  )
}

export function AiPicksResults({ result }: { result: AiPicksResult }) {
  const { ai, bills } = result
  const today = new Date().toISOString().slice(0, 10)

  if (bills.length === 0) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--t3)', padding: '60px 0', fontSize: 14 }}>
        최근 30일간 선택하신 분야의 법안이 없습니다. 다른 분야를 선택해보세요.
      </div>
    )
  }

  const pickIds = new Set(ai?.picks.map(p => p.billId) ?? [])
  const billById = new Map(bills.map(b => [b.id, b]))
  const picks = (ai?.picks ?? []).filter(p => billById.has(p.billId))
  const rest = bills.filter(b => !pickIds.has(b.id))
  const restPassed = rest.filter(b => PASSED_STATUSES.has(b.status))
  const restProposed = rest.filter(b => !PASSED_STATUSES.has(b.status))

  return (
    <div>
      {/* AI 브리핑 */}
      <div
        className="ai-picks-briefing"
        style={{
          display: 'grid', gridTemplateColumns: '180px 1fr', gap: 24,
          padding: '24px 28px', border: '0.5px solid var(--bd)',
          background: 'var(--ivd)', borderRadius: 12, marginBottom: 8,
        }}
      >
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--pu)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          AI 브리핑
        </div>
        <div>
          {ai ? (
            <p style={{
              fontFamily: 'var(--font-serif)', fontSize: 14, lineHeight: 1.85,
              fontWeight: 300, color: 'var(--t1)', margin: 0,
            }}>
              {ai.briefing}
            </p>
          ) : (
            <p style={{
              fontFamily: 'var(--font-serif)', fontSize: 14, lineHeight: 1.85,
              fontWeight: 300, color: 'var(--t3)', margin: 0,
            }}>
              AI 브리핑을 생성하지 못했습니다. 아래에서 최근 30일 법안 목록을 확인하세요.
            </p>
          )}
          <p style={{ fontSize: 11, color: 'var(--t3)', margin: '14px 0 0' }}>
            AI가 생성한 브리핑입니다. 법적 판단의 근거로 사용하지 마세요.{' '}
            <Link href="/ai-guide" style={{ color: 'var(--pu)' }}>AI 요약 방식 보기</Link>
          </p>
        </div>
      </div>

      {/* AI 추천 법안 */}
      {picks.length > 0 && (
        <>
          <SectionLabel>AI 추천 법안 ({picks.length})</SectionLabel>
          {picks.map(p => {
            const bill = billById.get(p.billId)!
            return (
              <div key={p.billId} style={{ borderLeft: '2px solid var(--pu)', paddingLeft: 14, marginTop: 4 }}>
                {toBillRow(bill, today)}
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '10px 6px 16px' }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--pu)',
                    letterSpacing: '0.06em', flexShrink: 0,
                  }}>
                    AI 코멘트
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                    fontSize: 13, lineHeight: 1.7, color: 'var(--t2)',
                  }}>
                    {p.comment}
                  </span>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* 나머지 법안 */}
      {restPassed.length > 0 && (
        <>
          <SectionLabel>최근 30일 가결 법안 ({restPassed.length})</SectionLabel>
          {restPassed.map(b => toBillRow(b, today))}
        </>
      )}
      {restProposed.length > 0 && (
        <>
          <SectionLabel>최근 30일 발의 법안 ({restProposed.length})</SectionLabel>
          {restProposed.map(b => toBillRow(b, today))}
        </>
      )}

      {/* 반응형: 좁은 화면에서 브리핑 1열 */}
      <style>{`
        @media (max-width: 640px) {
          .ai-picks-briefing { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
