'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface MonthlyAttendance {
  month: string
  rate: number
  attended: number
  total: number
}

interface Props {
  data: MonthlyAttendance[]
  overallRate: number
}

export function AttendanceChart({ data, overallRate }: Props) {
  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 36, fontWeight: 700, fontFamily: 'var(--font-serif)', color: 'var(--t1)' }}>
          {overallRate}%
        </span>
        <span style={{ fontSize: 13, color: 'var(--t3)' }}>평균 출석률</span>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={14}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--t3)' }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--t3)' }} axisLine={false} tickLine={false} unit="%" width={36} />
            <Tooltip
              formatter={(val: number, _: string, props: any) => [
                `${val}% (${props.payload.attended}/${props.payload.total})`,
                '출석률',
              ]}
              contentStyle={{ fontSize: 12, background: 'var(--iv)', border: '1px solid var(--bd)', borderRadius: 6 }}
            />
            <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
              {data.map(entry => (
                <Cell key={entry.month} fill={entry.rate >= 80 ? 'var(--pu)' : entry.rate >= 60 ? '#F5A623' : '#C0392B'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p style={{ color: 'var(--t3)', fontSize: 14 }}>출석 데이터가 없습니다.</p>
      )}
    </div>
  )
}
