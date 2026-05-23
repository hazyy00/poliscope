'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { PARTIES } from '@/lib/constants'

export function MemberSearch() {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [party, setParty] = useState(params.get('party') ?? '')
  const [district, setDistrict] = useState(params.get('district') ?? '')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  function push(overrides: Record<string, string>) {
    const sp = new URLSearchParams()
    const values = { q, party, district, ...overrides }
    if (values.q) sp.set('q', values.q)
    if (values.party) sp.set('party', values.party)
    if (values.district) sp.set('district', values.district)
    router.replace(`/members?${sp.toString()}`)
  }

  function handleText(field: 'q' | 'district', value: string) {
    if (field === 'q') setQ(value)
    else setDistrict(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => push({ [field]: value.trim() }), 300)
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
      <input
        type="text"
        value={q}
        onChange={e => handleText('q', e.target.value)}
        placeholder="의원 이름 검색"
        style={{
          padding: '8px 12px', fontSize: 13, border: '1px solid var(--bd)', borderRadius: 7,
          background: 'var(--iv)', color: 'var(--t1)', outline: 'none', minWidth: 160,
        }}
      />
      <select
        value={party}
        onChange={e => { setParty(e.target.value); push({ party: e.target.value }) }}
        style={{
          padding: '8px 12px', fontSize: 13, border: '1px solid var(--bd)', borderRadius: 7,
          background: 'var(--iv)', color: party ? 'var(--t1)' : 'var(--t3)', outline: 'none',
        }}
      >
        <option value="">전체 정당</option>
        {PARTIES.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <input
        type="text"
        value={district}
        onChange={e => handleText('district', e.target.value)}
        placeholder="지역구 (예: 서울)"
        style={{
          padding: '8px 12px', fontSize: 13, border: '1px solid var(--bd)', borderRadius: 7,
          background: 'var(--iv)', color: 'var(--t1)', outline: 'none', minWidth: 140,
        }}
      />
      {(q || party || district) && (
        <button
          onClick={() => { setQ(''); setParty(''); setDistrict(''); router.replace('/members') }}
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
