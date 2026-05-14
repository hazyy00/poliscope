'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface VoteRow {
  stance: string
  vote_id: string
  votes: { id: string; title: string; voted_at: string | null; result: string | null } | null
}

interface Props {
  votes: VoteRow[]
}

const STANCE_COLOR: Record<string, string> = {
  '찬성': '#3D6DB5',
  '반대': '#C0392B',
  '기권': '#F5A623',
  '불참': '#AAAAAA',
}

export function VotingRecord({ votes }: Props) {
  const counts = votes.reduce<Record<string, number>>((acc, v) => {
    acc[v.stance] = (acc[v.stance] ?? 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(counts).map(([name, value]) => ({ name, value }))

  return (
    <div>
      {chartData.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                {chartData.map(entry => (
                  <Cell key={entry.name} fill={STANCE_COLOR[entry.name] ?? '#CCC'} />
                ))}
              </Pie>
              <Tooltip formatter={(val: number) => [`${val}건`, '']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {votes.slice(0, 20).map(v => (
          <div key={v.vote_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--bd)' }}>
            <span style={{
              flexShrink: 0,
              padding: '2px 8px',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              background: `${STANCE_COLOR[v.stance] ?? '#CCC'}18`,
              color: STANCE_COLOR[v.stance] ?? '#888',
            }}>
              {v.stance}
            </span>
            <span style={{ fontSize: 13, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {v.votes?.title ?? '—'}
            </span>
            {v.votes?.voted_at && (
              <span style={{ flexShrink: 0, fontSize: 11, color: 'var(--t3)', marginLeft: 'auto' }}>
                {v.votes.voted_at.slice(0, 10)}
              </span>
            )}
          </div>
        ))}
      </div>

      {votes.length === 0 && (
        <p style={{ color: 'var(--t3)', fontSize: 14 }}>표결 기록이 없습니다.</p>
      )}
    </div>
  )
}
