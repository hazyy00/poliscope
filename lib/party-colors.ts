export type Party = '더불어민주당' | '국민의힘' | '조국혁신당' | '개혁신당' | '진보당' | '무소속'

export const PARTY_PALETTE: Record<string, { color: string; soft: string; dot: string }> = {
  '더불어민주당': { color: '#1f5fbd', soft: '#dfe7f3', dot: '#2c6fc7' },
  '국민의힘':     { color: '#c83a48', soft: '#f1d9dd', dot: '#d6505d' },
  '조국혁신당':   { color: '#3d7da6', soft: '#dde9f0', dot: '#4f93bc' },
  '개혁신당':     { color: '#d97520', soft: '#f3e2cd', dot: '#e08537' },
  '진보당':       { color: '#a93333', soft: '#ebd5d5', dot: '#bb4949' },
  '기본소득당':   { color: '#2cb5aa', soft: '#d4f0ee', dot: '#3dbfb4' },
  '사회민주당':   { color: '#d96b00', soft: '#f5e0cc', dot: '#f58400' },
  '새로운미래':   { color: '#1a6e8a', soft: '#d4e8f0', dot: '#2588ac' },
  '무소속':       { color: '#6b6b6b', soft: '#e6e3dd', dot: '#888888' },
}

const FALLBACK = { color: '#6b6b6b', soft: '#e6e3dd', dot: '#888888' }

export function partyPalette(party: string | null | undefined) {
  return PARTY_PALETTE[party ?? ''] ?? FALLBACK
}

export function partyColor(party: string | null | undefined) {
  return partyPalette(party).color
}

export function partyDot(party: string | null | undefined) {
  return partyPalette(party).dot
}

export function partyTone(party: string | null | undefined) {
  return partyPalette(party).soft
}

export const COMMITTEE_AREA: Record<string, string> = {
  '법제사법위원회':              '법제·사법',
  '정무위원회':                  '정무·금융',
  '기획재정위원회':              '경제·재정',
  '교육위원회':                  '교육',
  '과학기술방송통신위원회':       '과학·ICT',
  '외교통일위원회':              '외교·통일',
  '국방위원회':                  '국방·안보',
  '행정안전위원회':              '행정·안전',
  '문화체육관광위원회':          '문화·체육',
  '농림축산식품해양수산위원회':   '농림·수산',
  '산업통상자원중소벤처기업위원회': '산업·통상',
  '보건복지위원회':              '보건·복지',
  '환경노동위원회':              '환경·노동',
  '국토교통위원회':              '국토·교통',
  '정보위원회':                  '정보',
  '여성가족위원회':              '여성·가족',
}

export function termLabel(term: number | null | undefined): string {
  if (!term) return ''
  if (term === 1) return '초선'
  if (term === 2) return '재선'
  return `${term}선`
}
