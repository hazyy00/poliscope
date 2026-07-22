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
    // Vercel Image Optimization의 Transformations 무료 한도(5K)를 초과해
    // 최적화 이미지가 생성되지 못하면 의원 사진이 빈 칸으로 렌더됨.
    // 최적화를 끄고 원본을 직접 서빙 — Transformations 과금이 0이 됨.
    // 사진 원본이 작고 Origin/Data Transfer 여유가 충분해 영향은 미미.
    unoptimized: true,
    // 아래 항목은 unoptimized: true 동안 비활성(참고용으로 유지).
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
