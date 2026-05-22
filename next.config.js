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
