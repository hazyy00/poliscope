'use client'

import { useState } from 'react'

export function SubscribeForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('success')
        setEmail('')
      } else {
        setErrorMsg(data.error ?? '오류가 발생했습니다.')
        setStatus('error')
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <p style={{ fontSize: 14, color: 'var(--pu)', fontWeight: 500 }}>
        구독 신청 완료! 이메일을 확인해주세요.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="이메일 주소"
        required
        style={{
          padding: '9px 14px', fontSize: 13, border: '1px solid var(--bd)', borderRadius: 7,
          background: 'var(--iv)', color: 'var(--t1)', outline: 'none', minWidth: 220,
          boxShadow: 'none',
        }}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        style={{
          padding: '9px 18px', fontSize: 13, borderRadius: 7, border: 'none',
          background: 'var(--bk)', color: 'var(--iv)', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          opacity: status === 'loading' ? 0.6 : 1, fontWeight: 500,
        }}
      >
        {status === 'loading' ? '신청 중…' : '뉴스레터 구독'}
      </button>
      {status === 'error' && (
        <p style={{ width: '100%', fontSize: 12, color: '#C0392B', margin: 0 }}>{errorMsg}</p>
      )}
    </form>
  )
}
