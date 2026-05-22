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
  '더불어민주당': '#2E5BA8',
  '국민의힘': '#C0392B',
  '조국혁신당': '#0F8FB2',
  '개혁신당': '#FF7A00',
  '진보당': '#E53935',
  '기본소득당': '#00897B',
  '사회민주당': '#F4C31A',
}

export function getPartyColor(party: string | null | undefined): string {
  if (!party) return '#888888'
  return PARTY_COLORS[party] ?? '#888888'
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}
