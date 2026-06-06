export interface Governor {
  name: string
  title: string
  party: string | null
  term: string
  photo_url?: string
  slug: string
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
    name: '서울특별시', short: '서울', party: '더불어민주당', seats: '33석', rate: '33/48', color: '#3D6DC4',
    governor: { name: '오세훈', title: '시장', party: '국민의힘', term: '민선 9기 (2026.07 – 2030.06)', photo_url: `${PHOTOS}/gov_seoul.jpg`, slug: 'seoul' },
  },
  {
    name: '인천광역시', short: '인천', party: '더불어민주당', seats: '10석', rate: '10/12', color: '#3D6DC4',
    governor: { name: '박찬대', title: '시장', party: '더불어민주당', term: '민선 9기 (2026.07 – 2030.06)', slug: 'incheon' },
  },
  {
    name: '경기도', short: '경기', party: '더불어민주당', seats: '48석', rate: '48/55', color: '#3D6DC4',
    governor: { name: '추미애', title: '도지사', party: '더불어민주당', term: '민선 9기 (2026.07 – 2030.06)', slug: 'gyeonggi' },
  },
  {
    name: '강원특별자치도', short: '강원', party: '국민의힘', seats: '6석', rate: '6/8', color: '#C44858',
    governor: { name: '우상호', title: '도지사', party: '더불어민주당', term: '민선 9기 (2026.07 – 2030.06)', slug: 'gangwon' },
  },
  {
    name: '충청북도', short: '충북', party: '더불어민주당', seats: '5석', rate: '5/8', color: '#3D6DC4',
    governor: { name: '신용한', title: '도지사', party: '더불어민주당', term: '민선 9기 (2026.07 – 2030.06)', slug: 'chungbuk' },
  },
  {
    name: '충청남도', short: '충남', party: '더불어민주당', seats: '6석', rate: '6/9', color: '#3D6DC4',
    governor: { name: '박수현', title: '도지사', party: '더불어민주당', term: '민선 9기 (2026.07 – 2030.06)', slug: 'chungnam' },
  },
  {
    name: '경상북도', short: '경북', party: '국민의힘', seats: '13석', rate: '13/13', color: '#C44858',
    governor: { name: '이철우', title: '도지사', party: '국민의힘', term: '민선 9기 (2026.07 – 2030.06)', photo_url: `${PHOTOS}/gov_gyeongbuk.png`, slug: 'gyeongbuk' },
  },
  {
    name: '울산광역시', short: '울산', party: '국민의힘', seats: '3석', rate: '3/5', color: '#C44858',
    governor: { name: '김상욱', title: '시장', party: '더불어민주당', term: '민선 9기 (2026.07 – 2030.06)', slug: 'ulsan' },
  },
  {
    name: '경상남도', short: '경남', party: '국민의힘', seats: '13석', rate: '13/16', color: '#C44858',
    governor: { name: '김경수', title: '도지사', party: '더불어민주당', term: '민선 9기 (2026.07 – 2030.06)', slug: 'gyeongnam' },
  },
  {
    name: '부산광역시', short: '부산', party: '국민의힘', seats: '17석', rate: '17/17', color: '#C44858',
    governor: { name: '전재수', title: '시장', party: '더불어민주당', term: '민선 9기 (2026.07 – 2030.06)', slug: 'busan' },
  },
  {
    name: '전북특별자치도', short: '전북', party: '더불어민주당', seats: '7석', rate: '7/8', color: '#3D6DC4',
    governor: { name: '이원택', title: '도지사', party: '더불어민주당', term: '민선 9기 (2026.07 – 2030.06)', slug: 'jeonbuk' },
  },
  {
    name: '전라남도', short: '전남', party: '더불어민주당', seats: '10석', rate: '10/10', color: '#3D6DC4',
    governor: { name: '민형배', title: '시장', party: '더불어민주당', term: '민선 9기 (2026.07 – 2030.06)', slug: 'jeonnam' },
  },
  {
    name: '제주특별자치도', short: '제주', party: '더불어민주당', seats: '2석', rate: '2/2', color: '#3D6DC4',
    governor: { name: '위성곤', title: '도지사', party: '더불어민주당', term: '민선 9기 (2026.07 – 2030.06)', slug: 'jeju' },
  },
  {
    name: '대전광역시', short: '대전', party: '더불어민주당', seats: '7석', rate: '7/7', color: '#3D6DC4',
    governor: { name: '허태정', title: '시장', party: '더불어민주당', term: '민선 9기 (2026.07 – 2030.06)', slug: 'daejeon' },
  },
  {
    name: '세종특별자치시', short: '세종', party: '더불어민주당', seats: '1석', rate: '1/2', color: '#3D6DC4',
    governor: { name: '조상호', title: '시장', party: '더불어민주당', term: '민선 9기 (2026.07 – 2030.06)', slug: 'sejong' },
  },
  {
    name: '대구광역시', short: '대구', party: '국민의힘', seats: '11석', rate: '11/11', color: '#C44858',
    governor: { name: '추경호', title: '시장', party: '국민의힘', term: '민선 9기 (2026.07 – 2030.06)', slug: 'daegu' },
  },
  {
    name: '광주광역시', short: '광주', party: '더불어민주당', seats: '9석', rate: '9/9', color: '#3D6DC4',
    governor: { name: '민형배', title: '시장', party: '더불어민주당', term: '민선 9기 (2026.07 – 2030.06)', slug: 'gwangju' },
  },

  // ── 이북5도위원회 ─────────────────────────────────────────────
  {
    name: '황해도', short: '황해도', party: '—', seats: '0석', rate: '0/0', color: '#6B7280', is_northern: true,
    governor: { name: '명계남', title: '도지사', party: null, term: '제18대 (2026.03–)', photo_url: `${PHOTOS}/gov_hwanghae.png`, slug: 'hwanghae' },
  },
  {
    name: '평안남도', short: '평안남도', party: '—', seats: '0석', rate: '0/0', color: '#6B7280', is_northern: true,
    governor: { name: '정경조', title: '도지사', party: null, term: '제20대 (2024.08–)', slug: 'pyeongnam' },
  },
  {
    name: '평안북도', short: '평안북도', party: '—', seats: '0석', rate: '0/0', color: '#6B7280', is_northern: true,
    governor: { name: '이세웅', title: '도지사', party: null, term: '제16대 (2024.08–)', slug: 'pyeongbuk' },
  },
  {
    name: '함경남도', short: '함경남도', party: '—', seats: '0석', rate: '0/0', color: '#6B7280', is_northern: true,
    governor: { name: '손양영', title: '도지사', party: null, term: '제21대 (2023.08–)', slug: 'hamnam' },
  },
  {
    name: '함경북도', short: '함경북도', party: '—', seats: '0석', rate: '0/0', color: '#6B7280', is_northern: true,
    governor: { name: '지성호', title: '도지사', party: '국민의힘', term: '제19대 (2024.08–)', photo_url: `${PHOTOS}/gov_hamgbuk.jpg`, slug: 'hambuk' },
  },
]
