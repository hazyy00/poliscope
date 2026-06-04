import type { Metadata } from 'next'
import { Noto_Serif_KR, IM_Fell_English, JetBrains_Mono, Funnel_Display } from 'next/font/google'
import localFont from 'next/font/local'
import { SiteNav } from '@/components/ui/SiteNav'
import ScrollToTop from '@/components/ui/ScrollToTop'
import './globals.css'

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  variable: '--font-pretendard',
  weight: '45 920',
  display: 'swap',
})
const notoSerif = Noto_Serif_KR({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-serif' })
const imFell = IM_Fell_English({ subsets: ['latin'], weight: ['400'], style: ['normal', 'italic'], variable: '--font-fell' })
const jetBrainsMono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono' })
const funnelDisplay = Funnel_Display({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-modern' })

export const metadata: Metadata = {
  metadataBase: new URL('https://poliscope.kr'),
  title: 'PoliScope',
  description: '22대 국회 300명 의원의 발의·표결·출석을 누구나 쉽게 검색하고 볼 수 있는 웹서비스',
  openGraph: {
    title: 'PoliScope',
    description: '데이터로 보는 민주주의',
    url: 'https://poliscope.kr',
    siteName: 'PoliScope',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${notoSerif.variable} ${imFell.variable} ${jetBrainsMono.variable} ${funnelDisplay.variable}`}>
      <body>
        <ScrollToTop />
        <SiteNav />
        {children}
      </body>
    </html>
  )
}
