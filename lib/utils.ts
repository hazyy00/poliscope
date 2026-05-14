import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso)
  const yy = String(d.getFullYear()).slice(2)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yy}.${mm}.${dd}`
}

const PARTY_COLORS: Record<string, string> = {
  '더불어민주당': '#3D6DB5',
  '국민의힘': '#C0392B',
  '조국혁신당': '#8B2FC9',
  '개혁신당': '#F07B2B',
  '진보당': '#E53935',
  '기본소득당': '#00897B',
  '사회민주당': '#F4C31A',
}

export function getPartyColor(party: string | null | undefined): string {
  if (!party) return '#888888'
  return PARTY_COLORS[party] ?? '#888888'
}
