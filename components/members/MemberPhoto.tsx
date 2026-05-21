'use client'

import { useState } from 'react'
import Image from 'next/image'

interface Props {
  src: string | null | undefined
  name: string
  sizes?: string
  style?: React.CSSProperties
}

export function MemberPhoto({ src, name, sizes = '200px', style }: Props) {
  const [imgError, setImgError] = useState(false)

  if (!src || imgError) {
    return (
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: 'var(--t3)', fontFamily: 'var(--font-serif)' }}>
        {name[0]}
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={name}
      fill
      style={{ objectFit: 'cover', objectPosition: 'top', ...style }}
      sizes={sizes}
      onError={() => setImgError(true)}
    />
  )
}
