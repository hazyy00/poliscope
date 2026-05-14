'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { BILL_STATUSES } from '@/lib/constants'

export function BillSearch() {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [status, setStatus] = useState(params.get('status') ?? '')
  const [committee, setCommittee] = useState(params.get('committee') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  function push(overrides: Record<string, string>) {
    const sp = new URLSearchParams()
    const values = { q, status, committee, ...overrides }
    if (values.q) sp.set('q', values.q)
    if (values.status) sp.set('status', values.status)
    if (values.committee) sp.set('committee', values.committee)
    router.push(`/bills?${sp.toString()}`)
  }

  function handleText(field: 'q' | 'committee', value: string) {
    if (field === 'q') setQ(value)
    else setCommittee(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => push({ [field]: value }), 300)
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        type="text"
        value={q}
        onChange={e => handleText('q', e.target.value)}
        placeholder="법안명 검색"
        style={{
          padding: '8px 12px', fontSize: 13, border: '1px solid var(--bd)', borderRadius: 7,
          background: 'var(--iv)', color: 'var(--t1)', outline: 'none', minWidth: 200,
        }}
      />
      <select
        value={status}
        onChange={e => { setStatus(e.target.value); push({ status: e.target.value }) }}
        style={{
          padding: '8px 12px', fontSize: 13, border: '1px solid var(--bd)', borderRadius: 7,
          background: 'var(--iv)', color: status ? 'var(--t1)' : 'var(--t3)', outline: 'none',
        }}
      >
        <option value="">전체 상태</option>
        {BILL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <input
        type="text"
        value={committee}
        onChange={e => handleText('committee', e.target.value)}
        placeholder="위원회 (예: 법제사법)"
        style={{
          padding: '8px 12px', fontSize: 13, border: '1px solid var(--bd)', borderRadius: 7,
          background: 'var(--iv)', color: 'var(--t1)', outline: 'none', minWidth: 160,
        }}
      />
      {(q || status || committee) && (
        <button
          onClick={() => { setQ(''); setStatus(''); setCommittee(''); router.push('/bills') }}
          style={{
            padding: '8px 12px', fontSize: 13, border: '1px solid var(--bd)', borderRadius: 7,
            background: 'transparent', color: 'var(--t3)', cursor: 'pointer',
          }}
        >
          초기화
        </button>
      )}
    </div>
  )
}
