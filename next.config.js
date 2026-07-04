/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/votes',
        destination: '/bills?status=passed&sort=voteDate',
        permanent: true,
      },
      {
        source: '/votes/:path*',
        destination: '/bills?status=passed&sort=voteDate',
        permanent: true,
      },
    ]
  },
  images: {
    // 의원 사진은 사실상 불변 — Supabase의 max-age=3600을 덮어써
    // 시간당 재변환(Vercel Transformations/Cache Writes 과금)을 방지
    minimumCacheTTL: 2678400, // 31일
    formats: ['image/webp'],
    // 실제 렌더 폭: 아바타 20~32px, 벤치마크 80px, 카드·프로필 180~220px
    deviceSizes: [640, 1080, 1920],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.assembly.go.kr',
        pathname: '/static/**',
      },
      {
        protocol: 'https',
        hostname: '*.assembly.go.kr',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
}
module.exports = nextConfig
