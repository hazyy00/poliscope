export interface Governor {
  name: string
  title: string
  party: string | null
  term: string
  photo_url?: string
}

export interface RegionData {
  name: string
  short: string
  party: string
  seats: string
  rate: string
  color: string
  governor: Governor
  is_northern?: boolean
}

const PHOTOS = 'https://iywhjjnzrfjjunlyanic.supabase.co/storage/v1/object/public/photos'

export const REGIONS_DATA: RegionData[] = [
  {
    name: '서울특별시', short: '서울', party: '더불어민주당', seats: '18석', rate: '18/48', color: '#3D6DB5',
    governor: { name: '오세훈', title: '시장', party: '국민의힘', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_seoul.jpg` },
  },
  {
    name: '인천광역시', short: '인천', party: '더불어민주당', seats: '11석', rate: '11/13', color: '#3D6DB5',
    governor: { name: '유정복', title: '시장', party: '국민의힘', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_incheon.jpg` },
  },
  {
    name: '경기도', short: '경기', party: '더불어민주당', seats: '51석', rate: '51/60', color: '#3D6DB5',
    governor: { name: '김동연', title: '도지사', party: '더불어민주당', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_gyeonggi.jpg` },
  },
  {
    name: '강원도', short: '강원', party: '국민의힘', seats: '7석', rate: '7/8', color: '#C0392B',
    governor: { name: '김진태', title: '도지사', party: '국민의힘', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_gangwon.jpg` },
  },
  {
    name: '충청북도', short: '충북', party: '국민의힘', seats: '4석', rate: '4/8', color: '#C0392B',
    governor: { name: '김영환', title: '도지사', party: '국민의힘', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_chungbuk.jpg` },
  },
  {
    name: '충청남도', short: '충남', party: '더불어민주당', seats: '5석', rate: '5/11', color: '#3D6DB5',
    governor: { name: '김태흠', title: '도지사', party: '국민의힘', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_chungnam.jpg` },
  },
  {
    name: '경상북도', short: '경북', party: '국민의힘', seats: '12석', rate: '12/13', color: '#C0392B',
    governor: { name: '이철우', title: '도지사', party: '국민의힘', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_gyeongbuk.png` },
  },
  {
    name: '울산광역시', short: '울산', party: '국민의힘', seats: '4석', rate: '4/6', color: '#C0392B',
    governor: { name: '김두겸', title: '시장', party: '국민의힘', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_ulsan.jpg` },
  },
  {
    name: '경상남도', short: '경남', party: '국민의힘', seats: '11석', rate: '11/16', color: '#C0392B',
    governor: { name: '박완수', title: '도지사', party: '국민의힘', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_gyeongnam.jpg` },
  },
  {
    name: '부산광역시', short: '부산', party: '국민의힘', seats: '14석', rate: '14/18', color: '#C0392B',
    governor: { name: '박형준', title: '시장', party: '국민의힘', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_busan.jpg` },
  },
  {
    name: '전라북도', short: '전북', party: '더불어민주당', seats: '6석', rate: '6/10', color: '#3D6DB5',
    governor: { name: '김관영', title: '도지사', party: '더불어민주당', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_jeonbuk.jpg` },
  },
  {
    name: '전라남도', short: '전남', party: '더불어민주당', seats: '7석', rate: '7/10', color: '#3D6DB5',
    governor: { name: '김영록', title: '도지사', party: '더불어민주당', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_jeonnam.jpg` },
  },
  {
    name: '제주특별자치도', short: '제주', party: '더불어민주당', seats: '3석', rate: '3/3', color: '#3D6DB5',
    governor: { name: '오영훈', title: '도지사', party: '더불어민주당', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_jeju.jpg` },
  },
  {
    name: '대전광역시', short: '대전', party: '더불어민주당', seats: '5석', rate: '5/7', color: '#3D6DB5',
    governor: { name: '이장우', title: '시장', party: '국민의힘', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_daejeon.png` },
  },
  {
    name: '세종특별자치시', short: '세종', party: '무소속', seats: '1석', rate: '1/1', color: '#888888',
    governor: { name: '최민호', title: '시장', party: '국민의힘', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_sejong.jpg` },
  },
  {
    name: '대구광역시', short: '대구', party: '국민의힘', seats: '11석', rate: '11/12', color: '#C0392B',
    governor: { name: '홍준표', title: '시장', party: '국민의힘', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_daegu.png` },
  },
  {
    name: '광주광역시', short: '광주', party: '더불어민주당', seats: '7석', rate: '7/8', color: '#3D6DB5',
    governor: { name: '강기정', title: '시장', party: '더불어민주당', term: '민선 8기 (2022.07 – 2026.06)', photo_url: `${PHOTOS}/gov_gwangju.jpg` },
  },

  // ── 이북5도위원회 ─────────────────────────────────────────────
  {
    name: '황해도', short: '황해도', party: '—', seats: '0석', rate: '0/0', color: '#6B7280', is_northern: true,
    governor: { name: '명계남', title: '도지사', party: null, term: '제18대 (2026.03–)', photo_url: `${PHOTOS}/gov_hwanghae.png` },
  },
  {
    name: '평안남도', short: '평안남도', party: '—', seats: '0석', rate: '0/0', color: '#6B7280', is_northern: true,
    governor: { name: '정경조', title: '도지사', party: null, term: '제20대 (2024.08–)' },
  },
  {
    name: '평안북도', short: '평안북도', party: '—', seats: '0석', rate: '0/0', color: '#6B7280', is_northern: true,
    governor: { name: '이세웅', title: '도지사', party: null, term: '제16대 (2024.08–)' },
  },
  {
    name: '함경남도', short: '함경남도', party: '—', seats: '0석', rate: '0/0', color: '#6B7280', is_northern: true,
    governor: { name: '손양영', title: '도지사', party: null, term: '제21대 (2023.08–)' },
  },
  {
    name: '함경북도', short: '함경북도', party: '—', seats: '0석', rate: '0/0', color: '#6B7280', is_northern: true,
    governor: { name: '지성호', title: '도지사', party: '국민의힘', term: '제19대 (2024.08–)', photo_url: `${PHOTOS}/gov_hamgbuk.jpg` },
  },
]
