'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

export default function VoteSearch() {
  const router = useRouter()
  const sp = useSearchParams()

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const usp = new URLSearchParams(sp.toString())
    if (e.target.value) {
      usp.set('q', e.target.value)
    } else {
      usp.delete('q')
    }
    usp.delete('page')
    router.push(`/votes?${usp.toString()}`)
  }, [sp, router])

  return (
    <input
      type="search"
      defaultValue={sp.get('q') ?? ''}
      placeholder="표결 제목 검색..."
      onChange={handleChange}
      style={{
        width: '100%', padding: '10px 14px',
        border: '1px solid var(--bd)', borderRadius: 8,
        fontSize: 14, color: 'var(--t1)', background: '#fff',
        outline: 'none', boxSizing: 'border-box',
      }}
    />
  )
}
